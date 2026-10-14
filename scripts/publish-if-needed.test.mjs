import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { isPublished, planRelease, runMain, versionUrl } from './publish-if-needed.mjs';

const NAME = '@chamaeleonidae/chmln';
const VERSION = '1.0.2';
const SHA = '0123456789abcdef0123456789abcdef01234567';
const ACTIONS_ENV = { GITHUB_ACTIONS: 'true', GITHUB_SHA: SHA };

const LS_REMOTE = ['git', ['ls-remote', '--tags', 'origin', 'refs/tags/1.0.2']];
const PUBLISH = ['npm', ['publish', '--access', 'public']];
const TAG = ['git', [
  '-c', 'user.name=github-actions[bot]',
  '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
  'tag', '-a', '1.0.2', '-m', '1.0.2',
]];
const PUSH = ['git', ['push', 'origin', 'refs/tags/1.0.2']];

const commandLine = ([file, args]) => [file, ...args].join(' ');

function fakeFetch(status) {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(url);
    return { status };
  };
  return Object.assign(fetchImpl, { urls });
}

function throwingFetch(error) {
  return async () => {
    throw error;
  };
}

function fakeReadFile() {
  const paths = [];
  const readFile = async (path) => {
    paths.push(path);
    return JSON.stringify({ name: NAME, version: VERSION });
  };
  return Object.assign(readFile, { paths });
}

// Stands in for promisify(execFile): resolves { stdout, stderr }, or rejects with the error
// execFile gives a non-zero exit. Commands without a scripted outcome print nothing.
function fakeExec(outcomes = {}) {
  const calls = [];
  const exec = async (file, args) => {
    calls.push([file, args]);
    const outcome = outcomes[commandLine([file, args])] ?? '';
    if (outcome instanceof Error) throw outcome;
    return { stdout: outcome, stderr: '' };
  };
  return Object.assign(exec, { calls });
}

function commandFailed(command, stderr) {
  const cmd = commandLine(command);
  return Object.assign(new Error(`Command failed: ${cmd}\n${stderr}`), { code: 1, cmd, stdout: '', stderr });
}

function setup({ env = ACTIONS_ENV, fetchImpl = fakeFetch(404), outcomes } = {}) {
  const readFile = fakeReadFile();
  const exec = fakeExec(outcomes);
  const lines = [];
  const run = () => runMain({ env, readFile, fetchImpl, exec, log: (line) => lines.push(line) });
  return { run, readFile, fetchImpl, exec, lines };
}

describe('versionUrl', () => {
  it('addresses the per-version document, with the scope separator encoded', () => {
    assert.equal(versionUrl(NAME, VERSION), 'https://registry.npmjs.org/@chamaeleonidae%2fchmln/1.0.2');
  });
});

describe('isPublished', () => {
  describe('when the registry returns 200', () => {
    it('resolves true, having requested only the version document', async () => {
      const fetchImpl = fakeFetch(200);
      assert.equal(await isPublished(NAME, VERSION, fetchImpl), true);
      assert.deepEqual(fetchImpl.urls, [versionUrl(NAME, VERSION)]);
    });
  });

  describe('when the registry returns 404', () => {
    it('resolves false', async () => {
      assert.equal(await isPublished(NAME, VERSION, fakeFetch(404)), false);
    });
  });

  describe('when the registry returns any other status', () => {
    for (const status of [401, 403, 429, 500, 503]) {
      it(`rejects on ${status} instead of guessing`, async () => {
        await assert.rejects(isPublished(NAME, VERSION, fakeFetch(status)), {
          message: `npm registry returned ${status} for @chamaeleonidae/chmln@1.0.2`,
        });
      });
    }
  });

  describe('when the registry cannot be reached', () => {
    it('rejects with the fetch error unchanged', async () => {
      const error = new TypeError('fetch failed');
      await assert.rejects(isPublished(NAME, VERSION, throwingFetch(error)), (rejection) => rejection === error);
    });
  });
});

describe('planRelease', () => {
  describe('when the version is not on npm', () => {
    it('plans a publish, tagged with the bare version', () => {
      assert.deepEqual(planRelease('1.0.2', false), { version: '1.0.2', tag: '1.0.2', publish: true });
    });
  });

  describe('when the version is already on npm', () => {
    it('plans no publish', () => {
      assert.deepEqual(planRelease('1.0.2', true), { version: '1.0.2', tag: '1.0.2', publish: false });
    });
  });
});

describe('runMain', () => {
  it('publishes the version and then tags it, when npm does not have it', async () => {
    const { run, exec } = setup();
    assert.deepEqual(await run(), { version: '1.0.2', tag: '1.0.2', publish: true });
    assert.deepEqual(exec.calls, [LS_REMOTE, PUBLISH, TAG, PUSH]);
  });

  it('asks npm for the exact name and version in package.json', async () => {
    const { run, readFile, fetchImpl } = setup();
    await run();
    assert.deepEqual(readFile.paths, ['package.json']);
    assert.deepEqual(fetchImpl.urls, ['https://registry.npmjs.org/@chamaeleonidae%2fchmln/1.0.2']);
  });

  it('logs what it publishes and that the publish finished', async () => {
    const { run, lines } = setup();
    await run();
    assert.deepEqual(lines, [
      '@chamaeleonidae/chmln@1.0.2 is not on npm yet — publishing it and tagging 1.0.2',
      'Published @chamaeleonidae/chmln@1.0.2',
    ]);
  });

  describe('when the tag already exists on the remote', () => {
    const outcomes = { [commandLine(LS_REMOTE)]: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678\trefs/tags/1.0.2\n' };

    it('publishes without creating or pushing a tag', async () => {
      const { run, exec } = setup({ outcomes });
      assert.deepEqual(await run(), { version: '1.0.2', tag: '1.0.2', publish: true });
      assert.deepEqual(exec.calls, [LS_REMOTE, PUBLISH]);
    });

    it('logs that the existing tag is left as it is', async () => {
      const { run, lines } = setup({ outcomes });
      await run();
      assert.deepEqual(lines, [
        '@chamaeleonidae/chmln@1.0.2 is not on npm yet — publishing it and tagging 1.0.2',
        'Tag 1.0.2 already exists on origin — leaving it as it is',
        'Published @chamaeleonidae/chmln@1.0.2',
      ]);
    });
  });

  describe('when the version is already on npm', () => {
    it('runs no commands and plans no publish', async () => {
      const { run, exec } = setup({ fetchImpl: fakeFetch(200) });
      assert.deepEqual(await run(), { version: '1.0.2', tag: '1.0.2', publish: false });
      assert.deepEqual(exec.calls, []);
    });

    it('logs that there is nothing to publish', async () => {
      const { run, lines } = setup({ fetchImpl: fakeFetch(200) });
      await run();
      assert.deepEqual(lines, ['@chamaeleonidae/chmln@1.0.2 is already on npm — nothing to publish']);
    });
  });

  describe('when the registry check fails', () => {
    describe('with an unexpected status', () => {
      it('rejects with the registry error and runs no commands', async () => {
        const { run, exec } = setup({ fetchImpl: fakeFetch(500) });
        await assert.rejects(run(), { message: 'npm registry returned 500 for @chamaeleonidae/chmln@1.0.2' });
        assert.deepEqual(exec.calls, []);
      });
    });

    describe('because the registry cannot be reached', () => {
      it('rejects with the fetch error and runs no commands', async () => {
        const error = new TypeError('fetch failed');
        const { run, exec } = setup({ fetchImpl: throwingFetch(error) });
        await assert.rejects(run(), (rejection) => rejection === error);
        assert.deepEqual(exec.calls, []);
      });
    });
  });

  describe('when git ls-remote fails', () => {
    it('rejects with git\'s reason before publishing or tagging', async () => {
      const failure = commandFailed(LS_REMOTE, 'fatal: unable to access \'https://github.com/chamaeleonidae/chmln/\': Could not resolve host: github.com\n');
      const { run, exec } = setup({ outcomes: { [commandLine(LS_REMOTE)]: failure } });
      await assert.rejects(run(), { message: `Unable to inspect release tag 1.0.2 on origin: ${failure.message}` });
      assert.deepEqual(exec.calls, [LS_REMOTE]);
    });
  });

  describe('when npm publish fails', () => {
    it('rejects with npm\'s reason and creates no tag', async () => {
      const failure = commandFailed(PUBLISH, 'npm error code ENEEDAUTH\nnpm error need auth This command requires you to be logged in to https://registry.npmjs.org/\n');
      const { run, exec } = setup({ outcomes: { [commandLine(PUBLISH)]: failure } });
      await assert.rejects(run(), { message: `npm publish failed: ${failure.message}` });
      assert.deepEqual(exec.calls, [LS_REMOTE, PUBLISH]);
    });
  });

  describe('when git tag fails after a successful publish', () => {
    it('rejects with the manual command that tags the published commit, and pushes nothing', async () => {
      const failure = commandFailed(TAG, 'fatal: tag \'1.0.2\' already exists\n');
      const { run, exec } = setup({ outcomes: { [commandLine(TAG)]: failure } });
      await assert.rejects(run(), {
        message: `Release tag push failed: ${failure.message}\n`
          + '@chamaeleonidae/chmln@1.0.2 is on npm, so re-running will not tag it. Tag the published commit by hand (see RELEASING.md):\n'
          + `git tag -a 1.0.2 -m 1.0.2 ${SHA} && git push origin refs/tags/1.0.2`,
      });
      assert.deepEqual(exec.calls, [LS_REMOTE, PUBLISH, TAG]);
    });
  });

  describe('when git push fails after a successful publish', () => {
    it('rejects with the manual command that tags the published commit', async () => {
      const failure = commandFailed(PUSH, 'remote: Permission to chamaeleonidae/chmln.git denied to github-actions[bot].\n');
      const { run, exec } = setup({ outcomes: { [commandLine(PUSH)]: failure } });
      await assert.rejects(run(), {
        message: `Release tag push failed: ${failure.message}\n`
          + '@chamaeleonidae/chmln@1.0.2 is on npm, so re-running will not tag it. Tag the published commit by hand (see RELEASING.md):\n'
          + `git tag -a 1.0.2 -m 1.0.2 ${SHA} && git push origin refs/tags/1.0.2`,
      });
      assert.deepEqual(exec.calls, [LS_REMOTE, PUBLISH, TAG, PUSH]);
    });
  });

  describe('when not running in GitHub Actions', () => {
    it('refuses before reading package.json, asking npm or running a command', async () => {
      const { run, readFile, fetchImpl, exec } = setup({ env: {} });
      await assert.rejects(run(), {
        message: 'Publishing requires GitHub Actions — releases run from .github/workflows/publish.yml (see RELEASING.md)',
      });
      assert.deepEqual(readFile.paths, []);
      assert.deepEqual(fetchImpl.urls, []);
      assert.deepEqual(exec.calls, []);
    });
  });
});
