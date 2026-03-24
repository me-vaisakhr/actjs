Check the actjs bundle size and report against the 8 kB gzip target.

Run:
```sh
npm run build 2>&1 | grep "gzip"
```

Report the gzip sizes for each output file. Flag with ⚠️ if any of these exceed their limit:

| File | Limit |
|------|-------|
| `actjs.esm.js` | 8 kB |
| `actjs.iife.js` | 8 kB |
| `actjs.cjs.js` | 8 kB |

If any file exceeds its limit, identify what likely caused the growth by checking which source files were recently edited.

If all are within limits, report ✓ with the exact sizes.
