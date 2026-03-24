Publish a new version of actjs to npm.

## Step 1 — Pre-flight checks

Run these in sequence:

```sh
npm run typecheck
npm test
npm run build:all 2>&1 | grep -E "gzip|error|built"
```

Report results. **Stop and fix any failures before continuing.**

## Step 2 — Check npm login

```sh
npm whoami
```

If not logged in, tell the user to run `npm login` and stop.

## Step 3 — Check package name availability (first publish only)

```sh
npm view actjs version 2>&1
```

If the name is taken and this is a first publish, warn the user and suggest `npm publish --access public` with a scoped name.

## Step 4 — Confirm version

Read the current version from `package.json`. Ask the user:
- What type of release is this? **patch** (bug fix), **minor** (new feature), **major** (breaking change)
- Then bump accordingly:

```sh
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm version major   # 0.1.0 → 1.0.0
```

## Step 5 — Dry run

```sh
npm publish --dry-run
```

Show the user the file list. Confirm only `dist/`, `bin/`, `README.md`, `LICENSE` are included. Flag anything unexpected.

## Step 6 — Publish

```sh
npm publish --access public
```

Report the published version and registry URL:
`https://www.npmjs.com/package/actjs`

## Step 7 — Tag the release in git

```sh
git push --follow-tags
```

Report success with the tag name (e.g. `v0.2.0`).
