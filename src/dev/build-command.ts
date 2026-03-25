import * as esbuild from 'esbuild';
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

// ─── MIME types (shared with dev server) ─────────────────────────────────────

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function mime(filePath: string): string {
  return MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

// ─── Preview server ───────────────────────────────────────────────────────────

export async function runPreview(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      dir:  { type: 'string', default: 'dist' },
      port: { type: 'string', default: '4000' },
    },
    strict: false,
  });

  const distDir = path.resolve(values['dir'] as string);
  const port    = parseInt(values['port'] as string, 10);

  if (!fs.existsSync(distDir)) {
    console.error(`[actjs] Preview dir not found: ${distDir}. Run: actjs build`);
    process.exit(1);
  }

  const server = http.createServer((req, res) => {
    const urlPath  = (req.url ?? '/').split('?')[0]!;
    const filePath = urlPath === '/' || urlPath === ''
      ? path.join(distDir, 'index.html')
      : path.join(distDir, urlPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': mime(filePath) });
      res.end(fs.readFileSync(filePath));
    } else {
      // SPA fallback → index.html
      const index = path.join(distDir, 'index.html');
      if (fs.existsSync(index)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(index));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    }
  });

  server.listen(port, () => {
    console.log(`\n  actjs preview  →  http://localhost:${port}\n`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[actjs] Port ${port} is in use. Try: actjs preview --port ${port + 1}`);
    } else {
      console.error('[actjs] Preview error:', err.message);
    }
    process.exit(1);
  });

  // Keep running until Ctrl+C
  process.on('SIGINT',  () => { server.close(); process.exit(0); });
  process.on('SIGTERM', () => { server.close(); process.exit(0); });
}

// ─── Entry-script regex (same as dev server) ─────────────────────────────────

// Matches just the opening <script type="module" src="..."> tag (for standard mode, which keeps the closing </script>)
const MODULE_SCRIPT_RE = /(<script[^>]+type=["']module["'][^>]+src=["'])([^"']+\.(?:ts|tsx|js|jsx))(["'][^>]*>)/i;

// Matches the full element including the closing </script> (for inline mode, which emits its own closing tag)
const MODULE_SCRIPT_FULL_RE = /<script[^>]+type=["']module["'][^>]*src=["'][^"']+\.(?:ts|tsx|js|jsx)["'][^>]*>\s*<\/script>/i;

// ─── Resolve actjs src root (same logic as builder.ts) ───────────────────────

function resolveActjsSrcRoot(): string {
  const distDevDir = path.dirname(fileURLToPath(import.meta.url));
  const pkgRoot    = path.resolve(distDevDir, '..', '..');
  const srcCandidate = path.join(pkgRoot, 'src', 'index.ts');
  if (fs.existsSync(srcCandidate)) return path.join(pkgRoot, 'src');
  return path.join(pkgRoot, 'dist');
}

function buildAliases(srcRoot: string): Record<string, string> {
  const isSource = fs.existsSync(path.join(srcRoot, 'index.ts'));
  if (isSource) {
    return {
      'js-act/jsx-dev-runtime': path.join(srcRoot, 'jsx-runtime.ts'),
      'js-act/jsx-runtime':     path.join(srcRoot, 'jsx-runtime.ts'),
      'js-act/server':          path.join(srcRoot, 'hydration.ts'),
      'js-act':                 path.join(srcRoot, 'index.ts'),
    };
  }
  return {
    'js-act/jsx-dev-runtime': path.join(srcRoot, 'jsx-runtime.js'),
    'js-act/jsx-runtime':     path.join(srcRoot, 'jsx-runtime.js'),
    'js-act/server':          path.join(srcRoot, 'actjs.server.esm.js'),
    'js-act':                 path.join(srcRoot, 'actjs.esm.js'),
  };
}

// ─── Static file copy (skip source/config files) ─────────────────────────────

const SKIP_NAMES = new Set(['node_modules', 'dist', 'src', '.git', 'tsconfig.json', 'package.json', 'package-lock.json']);
const SKIP_EXTS  = new Set(['.ts', '.tsx']);

function copyStaticFiles(srcDir: string, destDir: string): void {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (SKIP_NAMES.has(entry.name)) continue;

    const srcPath  = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyStaticFiles(srcPath, destPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!SKIP_EXTS.has(ext)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// ─── CSS link inliner (used by --inline mode) ────────────────────────────────

// Matches <link rel="stylesheet" href="..."> in either attribute order
const LINK_STYLESHEET_RE = /<link\b([^>]*)>/gi;

function inlineCss(html: string, projectRoot: string): string {
  return html.replace(LINK_STYLESHEET_RE, (_full, attrs: string) => {
    if (!/\brel=["']stylesheet["']/i.test(attrs)) return _full;
    const hrefMatch = /\bhref=["']([^"']+)["']/i.exec(attrs);
    if (!hrefMatch) return _full;
    const href = hrefMatch[1]!;
    // Leave absolute URLs / protocol-relative URLs as-is
    if (/^(https?:)?\/\//i.test(href)) return _full;
    const cssPath = path.resolve(projectRoot, href);
    if (!fs.existsSync(cssPath)) return '';
    const css = fs.readFileSync(cssPath, 'utf-8');
    return `<style>${css}</style>`;
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runBuild(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      entry:  { type: 'string',  default: 'index.html' },
      out:    { type: 'string',  default: 'dist' },
      inline: { type: 'boolean', default: false },
    },
    strict: false,
  });

  const entryArg    = values['entry']  as string;
  const outArg      = values['out']    as string;
  const doInline    = values['inline'] as boolean;
  const entryHtml   = path.resolve(entryArg);
  const projectRoot = path.dirname(entryHtml);
  const outDir      = path.resolve(outArg);

  if (!fs.existsSync(entryHtml)) {
    console.error(`[actjs] Entry not found: ${entryHtml}`);
    process.exit(1);
  }

  console.log(doInline ? '[actjs] Building (inline mode)...' : '[actjs] Building...');

  const rawHtml = fs.readFileSync(entryHtml, 'utf-8');
  const match   = MODULE_SCRIPT_RE.exec(rawHtml);

  fs.mkdirSync(outDir, { recursive: true });

  if (doInline) {
    // ── Inline mode: single self-contained index.html ────────────────────────
    if (!match) {
      console.warn('[actjs] No <script type="module" src="..."> found — writing HTML as-is.');
      fs.writeFileSync(path.join(outDir, 'index.html'), rawHtml, 'utf-8');
      return;
    }

    const entryScript = match[2]!;
    const entryPoint  = path.resolve(projectRoot, entryScript);
    const srcRoot     = resolveActjsSrcRoot();

    const result = await esbuild.build({
      entryPoints: [entryPoint],
      bundle:   true,
      write:    false,
      outfile:  'main.js',
      format:   'iife',
      platform: 'browser',
      jsx:      'automatic',
      jsxImportSource: 'js-act',
      sourcemap: false,
      minify:   true,
      target:   'es2018',
      alias: buildAliases(srcRoot),
      loader: { '.ts': 'ts', '.tsx': 'tsx' },
      absWorkingDir: projectRoot,
    });

    if (result.errors.length > 0) {
      console.error('[actjs] Build failed');
      process.exit(1);
    }

    const jsText   = result.outputFiles?.[0]?.text ?? '';
    // Inline CSS first, then replace the full <script type="module">…</script> with the bundled JS
    let outHtml = inlineCss(rawHtml, projectRoot);
    outHtml = outHtml.replace(MODULE_SCRIPT_FULL_RE, `<script>${jsText}</script>`);

    fs.writeFileSync(path.join(outDir, 'index.html'), outHtml, 'utf-8');

    const size = Buffer.byteLength(outHtml, 'utf-8');
    console.log(`  index.html   ${(size / 1024).toFixed(1)} kB  (self-contained — no server needed)`);
  } else {
    // ── Standard mode: chunked output ────────────────────────────────────────
    const assetsDir = path.join(outDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    // Copy static assets first so the later index.html write wins
    copyStaticFiles(projectRoot, outDir);

    if (match) {
      const entryScript = match[2]!;
      const entryPoint  = path.resolve(projectRoot, entryScript);
      const srcRoot     = resolveActjsSrcRoot();

      const result = await esbuild.build({
        entryPoints: [entryPoint],
        bundle:   true,
        write:    true,
        outfile:  path.join(assetsDir, 'main.js'),
        format:   'iife',
        platform: 'browser',
        jsx:      'automatic',
        jsxImportSource: 'js-act',
        sourcemap: false,
        minify:   true,
        target:   'es2018',
        alias: buildAliases(srcRoot),
        loader: { '.ts': 'ts', '.tsx': 'tsx' },
        absWorkingDir: projectRoot,
      });

      if (result.errors.length > 0) {
        console.error('[actjs] Build failed');
        process.exit(1);
      }

      const size = fs.statSync(path.join(assetsDir, 'main.js')).size;
      console.log(`  assets/main.js   ${(size / 1024).toFixed(1)} kB`);

      // Replace module script with plain <script> — IIFE works on file:// without CORS
      const outHtml = rawHtml.replace(MODULE_SCRIPT_RE, `<script src="./assets/main.js">`);
      fs.writeFileSync(path.join(outDir, 'index.html'), outHtml, 'utf-8');
    } else {
      console.warn('[actjs] No <script type="module" src="..."> found — copying HTML only.');
    }
  }

  console.log(`\n  Built to ${path.relative(process.cwd(), outDir)}/\n`);
  console.log(`  Open: ${path.join(path.relative(process.cwd(), outDir), 'index.html')}\n`);
}
