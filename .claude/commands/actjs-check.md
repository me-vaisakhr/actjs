Run the full actjs verification suite and report a clear PASS / FAIL summary.

Execute these three commands in sequence from the repo root:

```sh
npm run typecheck
npm test
npm run build 2>&1 | grep -E "gzip|error|built"
```

Then report:

**TypeScript** — list any errors (file:line message). If none: ✓ 0 errors.

**Tests** — total test count, any failures. If all pass: ✓ N tests passed.

**Bundle sizes** (gzip):
- `actjs.esm.js` — target: under 8 kB
- `actjs.iife.js` — target: under 8 kB
- Flag ⚠️ if either exceeds 8 kB

**Overall**: PASS if all three are green. FAIL with specific issues otherwise.
