import * as esbuild from 'esbuild';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface BuilderOptions {
  entryPoint: string;
  projectRoot: string;
}

export interface BuildResult {
  js: string;
  map: string;
  watchedFiles: string[];
}

/**
 * Resolve the actjs src/ root for alias wiring.
 *
 * Strategy: the compiled server lives at dist/dev/server.js inside the actjs
 * package, so two levels up is always the actjs package root — whether running
 * inside the repo itself or as an installed node_module.
 *
 * dist/dev/server.js  →  ../..  →  actjs package root
 *
 * If src/index.ts exists there (source available), use src/.
 * Otherwise fall back to the dist build (installed without source).
 */
function resolveActjsSrcRoot(): string {
  // import.meta.url = file:///…/dist/dev/server.js  (after build)
  const distDevDir = path.dirname(fileURLToPath(import.meta.url));
  const pkgRoot    = path.resolve(distDevDir, '..', '..');

  const srcCandidate = path.join(pkgRoot, 'src', 'index.ts');
  if (fs.existsSync(srcCandidate)) return path.join(pkgRoot, 'src');

  // Installed package without source — use dist
  return path.join(pkgRoot, 'dist');
}

/**
 * Build the full alias map for js-act subpath imports.
 * When source is available, point at .ts files; otherwise use the actual
 * dist filenames (actjs.esm.js, jsx-runtime.js, actjs.server.esm.js).
 */
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

export class Builder {
  private ctx: esbuild.BuildContext | null = null;
  private lastResult: BuildResult = { js: '', map: '', watchedFiles: [] };
  private readonly opts: BuilderOptions;
  private readonly actjsSrcRoot: string;

  constructor(opts: BuilderOptions) {
    this.opts = opts;
    this.actjsSrcRoot = resolveActjsSrcRoot();
  }

  async init(): Promise<void> {
    const { entryPoint, projectRoot } = this.opts;
    const srcRoot = this.actjsSrcRoot;

    this.ctx = await esbuild.context({
      entryPoints: [entryPoint],
      bundle: true,
      write: false,
      outfile: '/__actjs_bundle.js', // virtual path — write:false means nothing is written to disk
      format: 'esm',
      platform: 'browser',
      jsx: 'automatic',
      jsxImportSource: 'js-act',
      sourcemap: true,
      sourcesContent: true,
      metafile: true,
      target: 'es2018',
      alias: buildAliases(srcRoot),
      loader: { '.ts': 'ts', '.tsx': 'tsx' },
      absWorkingDir: projectRoot,
    });
  }

  async rebuild(): Promise<BuildResult> {
    if (!this.ctx) throw new Error('Builder not initialized — call init() first');

    const result = await this.ctx.rebuild();

    const jsFile = result.outputFiles?.find(f => f.path.endsWith('.js'));
    const mapFile = result.outputFiles?.find(f => f.path.endsWith('.js.map'));
    const watchedFiles = result.metafile ? Object.keys(result.metafile.inputs) : [];

    this.lastResult = {
      js: jsFile?.text ?? '',
      map: mapFile?.text ?? '',
      watchedFiles,
    };

    return this.lastResult;
  }

  getLastResult(): BuildResult {
    return this.lastResult;
  }

  async dispose(): Promise<void> {
    await this.ctx?.dispose();
    this.ctx = null;
  }
}
