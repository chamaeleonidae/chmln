# Releasing @chamaeleonidae/chmln

A release is a pull request that bumps `version` in `package.json`. Merging it to `main` is what publishes it: the [Publish to npm](.github/workflows/publish.yml) workflow publishes the new version to npm and tags the commit it published. This is the only release path. Nobody runs `npm publish` by hand, and no npm token is stored anywhere.

## Cutting a release

1. Branch from an up-to-date `main`.
2. Run `make release BUMP=patch` (or `BUMP=minor`, `BUMP=major`). It refuses to run on a dirty working tree, and it only rewrites `version` in `package.json` and `package-lock.json`. It does not commit, tag, push or publish.
3. Add the new version's entry to `CHANGELOG.md`.
4. Commit `package.json`, `package-lock.json` and `CHANGELOG.md`, open a pull request to `main`, and merge it.

## What the merge does

Every push to `main` runs the workflow. It runs `npm test`, then `scripts/publish-if-needed.mjs`, which asks npm whether the exact version in `package.json` is published:

- **Not on npm yet:** it runs `npm publish --access public`, which publishes the version as `latest` with a provenance attestation. Then it pushes an annotated tag named after the bare version (`1.0.3`, like the existing `1.0.1`) on the commit it published.
- **Already on npm:** it logs `… is already on npm — nothing to publish` and succeeds without doing anything else. That covers every push that leaves the version alone, and every re-run of a run that already published.

CI never commits to `main`. The only thing it pushes is the tag.

## Prereleases are not supported

npm refuses to publish a prerelease version such as `1.1.0-beta.0` without `--tag`, and the workflow passes none. A prerelease merged to `main` fails the run without publishing anything.

## When a run fails

The failed step's log ends with the reason.

- Fix the cause, then use **Re-run all jobs** on that run, or push to `main` again. A failed publish leaves no tag behind, so the next run publishes and tags.
- If `npm publish` fails with `E404 Not Found` or `ENEEDAUTH` ("Unable to authenticate"), npm did not accept the workflow's identity. Check the trusted publisher setting below, including its environment name. npm does not validate the setting when it is saved, so a mistake in it only shows up here.
- If the publish succeeded but the tag push failed, re-running will not tag it, because the re-run finds the version on npm and stops. Tag the commit that run published by hand (the failed run prints this command with the values filled in):

  ```sh
  git tag -a <version> -m <version> <commit> && git push origin refs/tags/<version>
  ```

  Don't bump the version just to get a tag.
- Don't re-run an older failed run after a newer version has been published. npm refuses to make a lower version `latest` (`Cannot implicitly apply the "latest" tag …`), so that run fails without publishing. Recover from current `main` instead.

## Never publish from a laptop

Don't run `npm publish` locally, and don't run `scripts/publish-if-needed.mjs` outside GitHub Actions: it refuses with `Publishing requires GitHub Actions`. A local publish skips the tests, the provenance attestation and the tag, and it needs the npm login this setup exists to avoid.

## One-time setup

Three settings, made before the merge that adds the workflow and in this order. Together they mean no other branch and no npm token can publish.

### 1. GitHub: the `npm` environment, limited to `main`

The publish job runs in a GitHub environment named `npm`, and npm accepts only runs in that environment (step 2). The environment's rule that admits only `main` is what stops other branches from publishing. npm's setting has no branch field, and a push to any branch runs that branch's own copy of the workflow. Without the rule, anyone who can push a branch could publish from it.

A repository admin sets it up at GitHub → `chamaeleonidae/chmln` → **Settings** → **Environments** → **New environment**:

1. Name it `npm` and click **Configure environment**.
2. Under **Deployment branches and tags**, choose **Selected branches and tags**.
3. Click **Add deployment branch or tag rule**, choose ref type **Branch**, enter `main`, and click **Add rule**.

- Do this first. A workflow that names a missing environment creates it with no rules, and an environment with no rules admits every branch.
- Leave required reviewers and the wait timer off. Merging the release pull request is the approval.
- Anyone who can read the repo can check the rule. `gh api repos/chamaeleonidae/chmln/environments/npm/deployment-branch-policies --jq '.branch_policies[] | "\(.type) \(.name)"'` must print exactly `branch main`. A `404` means the environment or its rule is missing.
- With publishing limited to `main`, `main`'s branch protection decides who can publish. A repository admin should confirm that it requires a reviewed pull request.

### 2. npm: trusted publishing

npm authenticates the workflow through [trusted publishing](https://docs.npmjs.com/trusted-publishers): the workflow's GitHub OIDC identity stands in for an npm token. An owner of the `@chamaeleonidae` npm organization sets it up at npmjs.com → `@chamaeleonidae/chmln` → **Settings** → **Trusted publishing**, choosing **GitHub Actions**:

| Field | Value |
|---|---|
| Organization or user | `chamaeleonidae` |
| Repository | `chmln` |
| Workflow filename | `publish.yml` |
| Environment name | `npm` |
| Allowed actions | **`npm publish`** enabled |

- Every field is case-sensitive and must match exactly. The filename is entered without its `.github/workflows/` path. Renaming the workflow file or the job's environment stops publishing until this setting is updated.
- Don't leave the environment name empty. npm then doesn't check it, and a branch's copy of the workflow can simply leave the environment out.
- Configurations created after 2026-09-03 allow only `npm stage publish` until `npm publish` is enabled under Allowed actions. The workflow runs `npm publish`, so it fails without it.
- A new configuration must publish within 2 days, or it expires and can no longer be used or edited. Create it no more than 2 days before the merge that should publish. If it expires, delete it, create it again, and re-run the workflow.
- Trusted publishing needs npm 11.5.1 or later and Node 22.14.0 or later, which are separate minimums. The workflow runs Node 24 because no Node 22 release bundles npm 11.5.1 or later.

### 3. npm: no publishing with tokens

Setting up trusted publishing doesn't turn off publishing with npm tokens, and a token publish goes around the workflow, its tests and its tag. Once the trusted publisher is saved, an npm owner closes that path:

1. At npmjs.com → `@chamaeleonidae/chmln` → **Settings** → **Publishing access**, choose **Require two-factor authentication and disallow tokens** and click **Update Package Settings**. Trusted publishing keeps working under it, because it authenticates with OIDC tokens.
2. Each owner revokes any npm access token they made for publishing this package, at npmjs.com → profile picture → **Access Tokens**.

## Checking a release

- `npm view @chamaeleonidae/chmln dist-tags` shows the new version as `latest`.
- The version's page on npmjs.com shows the provenance badge.
- `git ls-remote --tags origin '<version>^{}'` resolves to the commit that published it.

## The first release: 1.0.2

`main` already carries version 1.0.2, which has never been published, so the merge that adds the workflow publishes it. It goes out to `latest` as a patch release, so `^1.0.1` ranges pick it up on their next install. Its runtime predates the workflow (PR #8, 2024) and behaves differently from 1.0.1:

- `index.js` reads `window` as soon as it is imported, so a server-side `require` throws `ReferenceError: window is not defined`.
- It exports the `window.chmln` object instead of 1.0.1's `init`, `identify` and `track` functions.
- `forceOverride` is gone. When the Chameleon snippet is already on the page, the export has no `init`.
- Without `fastUrl`, it loads from `https://fast.chameleon.io/` instead of `https://fast.trychameleon.com/`.
