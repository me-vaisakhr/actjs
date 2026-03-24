// ─── actjs Vite plugin ────────────────────────────────────────────────────────
// Reads actjs.deps.json at build time and:
//   • Adds declared packages to Rollup's external list
//   • Injects a <script type="importmap"> into index.html
//   • Injects <link rel="stylesheet"> tags for known CSS packages

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin, HtmlTagDescriptor } from 'vite';
import type { ActDepsConfig } from './deps.js';
import { resolveUrl, resolveStylesheetUrl } from './deps.js';

/**
 * Vite plugin that reads `actjs.deps.json` and wires up CDN package loading
 * at build time — import map injection, stylesheet links, and Rollup externals.
 *
 * @example
 * // vite.config.ts
 * import { actjsPlugin } from 'actjs/vite'
 * export default defineConfig({ plugins: [actjsPlugin()] })
 */
export function actjsPlugin(): Plugin {
  let deps: ActDepsConfig | null = null;

  return {
    name: 'actjs',

    configResolved(config) {
      const depsPath = join(config.root, 'actjs.deps.json');
      if (!existsSync(depsPath)) return;
      try {
        deps = JSON.parse(readFileSync(depsPath, 'utf-8')) as ActDepsConfig;
      } catch {
        config.logger.warn('[actjs] Could not parse actjs.deps.json — skipping CDN integration');
      }
    },

    config() {
      if (!deps) return {};
      // Externalize all declared packages so Rollup doesn't try to bundle them
      return {
        build: {
          rollupOptions: {
            external: Object.keys(deps.packages),
          },
        },
      };
    },

    transformIndexHtml(): HtmlTagDescriptor[] {
      if (!deps) return [];
      const { provider = 'esm.sh', packages } = deps;
      const tags: HtmlTagDescriptor[] = [];
      const importMap: Record<string, string> = {};

      for (const [pkg, version] of Object.entries(packages)) {
        importMap[pkg] = resolveUrl(pkg, version, provider);

        const cssUrl = resolveStylesheetUrl(pkg, version);
        if (cssUrl) {
          tags.push({
            tag: 'link',
            attrs: { rel: 'stylesheet', href: cssUrl },
            injectTo: 'head',
          });
        }
      }

      // Import map must be injected before any module scripts
      tags.unshift({
        tag: 'script',
        attrs: { type: 'importmap' },
        children: JSON.stringify({ imports: importMap }, null, 2),
        injectTo: 'head-prepend',
      });

      return tags;
    },
  };
}
