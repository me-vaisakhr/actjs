import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseArgs } from 'node:util';
import { Builder } from './builder.js';
import { FileWatcher } from './watcher.js';
import { HmrServer } from './hmr.js';
import { transformHtml } from './html.js';

// ─── MIME types ──────────────────────────────────────────────────────────────

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
  '.map':  'application/json',
};

function mime(filePath: string): string {
  return MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

// ─── Request handler ─────────────────────────────────────────────────────────

function createHandler(
  projectRoot: string,
  getHtml: () => string,
  getJs: () => string,
  getMap: () => string,
): http.RequestListener {
  return (req, res) => {
    const url = req.url ?? '/';
    const urlPath = url.split('?')[0]!;

    // HTML entry
    if (urlPath === '/' || urlPath === '/index.html') {
      const body = getHtml();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(body);
      return;
    }

    // JS bundle
    if (urlPath === '/__actjs_bundle.js') {
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(getJs());
      return;
    }

    // Source map
    if (urlPath === '/__actjs_bundle.js.map') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(getMap());
      return;
    }

    // Static file fallback
    const filePath = path.join(projectRoot, urlPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': mime(filePath) });
      res.end(fs.readFileSync(filePath));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

export async function startDevServer(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      entry: { type: 'string', default: 'index.html' },
      port:  { type: 'string', default: '3000' },
    },
    strict: false,
  });

  const port        = parseInt(values['port'] as string, 10);
  const entryArg    = values['entry'] as string;
  const entryHtml   = path.resolve(entryArg);
  const projectRoot = path.dirname(entryHtml);

  if (!fs.existsSync(entryHtml)) {
    console.error(`[actjs-dev] Entry not found: ${entryHtml}`);
    process.exit(1);
  }

  // Transform the HTML entry once to detect the script entry point
  const rawHtml  = fs.readFileSync(entryHtml, 'utf-8');
  const { html: transformedHtml, entryScript } = transformHtml(rawHtml);

  let htmlContent = transformedHtml;
  let jsContent   = '';
  let mapContent  = '';

  const builder = entryScript
    ? new Builder({
        entryPoint: path.resolve(projectRoot, entryScript),
        projectRoot,
      })
    : null;

  // Initial build
  if (builder) {
    try {
      await builder.init();
      const result = await builder.rebuild();
      jsContent  = result.js;
      mapContent = result.map;
      console.log(`[actjs-dev] Built ${entryScript}`);
    } catch (err) {
      console.error('[actjs-dev] Initial build failed:', err);
    }
  } else {
    console.warn('[actjs-dev] No <script type="module" src="..."> found — serving static HTML only.');
  }

  // HTTP server
  const server = http.createServer(
    createHandler(
      projectRoot,
      () => htmlContent,
      () => jsContent,
      () => mapContent,
    ),
  );

  // HMR
  const hmr = new HmrServer();
  hmr.attach(server);

  // File watcher
  const watcher = new FileWatcher();
  watcher.start(projectRoot);

  if (builder) {
    watcher.onChange(async () => {
      try {
        const result = await builder.rebuild();
        jsContent  = result.js;
        mapContent = result.map;
        watcher.updateFromMetafile(result.watchedFiles);
        hmr.broadcast({ type: 'reload' });
        console.log(`[actjs-dev] Rebuilt — reloading browser`);
      } catch (err) {
        console.error('[actjs-dev] Rebuild failed:', err);
      }
    });
  }

  // Start listening
  server.listen(port, () => {
    console.log(`\n  actjs-dev  →  http://localhost:${port}\n`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[actjs-dev] Port ${port} is in use. Try: actjs-dev --port ${port + 1}`);
    } else {
      console.error('[actjs-dev] Server error:', err.message);
    }
    process.exit(1);
  });

  // Shutdown — exit immediately, fire async cleanup in background
  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('\n[actjs-dev] Shutting down...');
    watcher.close();
    server.closeAllConnections?.(); // Node 18.2+ — drops keep-alive & WS connections
    server.close();
    // Kick off async cleanup but do not await — exit immediately so the
    // terminal returns on the first Ctrl+C.
    void builder?.dispose();
    void hmr.close();
    process.exit(0);
  };
  process.on('SIGINT',  shutdown);
  process.on('SIGTERM', shutdown);
}
