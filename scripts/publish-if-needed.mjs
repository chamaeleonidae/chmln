// Publishes package.json's version to npm when npm does not have it yet, then tags the commit
// <version>. Runs only in .github/workflows/publish.yml, whose npm trusted publisher is what
// authenticates the publish; see RELEASING.md.
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const TAGGER = ['-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com'];

// npm serves the per-version document uncached; the full packument is cached for 300 s and
// would hide a version published moments earlier.
export function versionUrl(name, version) {
  return `https://registry.npmjs.org/${name.replace('/', '%2f')}/${version}`;
}

export async function isPublished(name, version, fetchImpl = fetch) {
  const { status } = await fetchImpl(versionUrl(name, version));
  if (status === 200) return true;
  if (status === 404) return false;
  throw new Error(`npm registry returned ${status} for ${name}@${version}`);
}

export function planRelease(version, published) {
  return { version, tag: version, publish: !published };
}

export async function runMain({
  env = process.env,
  readFile = fs.readFile,
  fetchImpl = fetch,
  exec = promisify(execFile),
  log = console.log,
} = {}) {
  if (env.GITHUB_ACTIONS !== 'true') {
    throw new Error('Publishing requires GitHub Actions — releases run from .github/workflows/publish.yml (see RELEASING.md)');
  }

  const { name, version } = JSON.parse(await readFile('package.json', 'utf8'));
  const plan = planRelease(version, await isPublished(name, version, fetchImpl));
  if (!plan.publish) {
    log(`${name}@${version} is already on npm — nothing to publish`);
    return plan;
  }

  const { tag } = plan;
  log(`${name}@${version} is not on npm yet — publishing it and tagging ${tag}`);

  let tagExists;
  try {
    const { stdout } = await exec('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`]);
    tagExists = stdout.trim() !== '';
  } catch (error) {
    throw new Error(`Unable to inspect release tag ${tag} on origin: ${error.message}`);
  }
  if (tagExists) log(`Tag ${tag} already exists on origin — leaving it as it is`);

  try {
    await exec('npm', ['publish', '--access', 'public']);
  } catch (error) {
    throw new Error(`npm publish failed: ${error.message}`);
  }

  if (!tagExists) {
    try {
      await exec('git', [...TAGGER, 'tag', '-a', tag, '-m', version]);
      await exec('git', ['push', 'origin', `refs/tags/${tag}`]);
    } catch (error) {
      throw new Error(
        `Release tag push failed: ${error.message}\n`
        + `${name}@${version} is on npm, so re-running will not tag it. Tag the published commit by hand (see RELEASING.md):\n`
        + `git tag -a ${tag} -m ${version} ${env.GITHUB_SHA} && git push origin refs/tags/${tag}`,
      );
    }
  }

  log(`Published ${name}@${version}`);
  return plan;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMain().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
