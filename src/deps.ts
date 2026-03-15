// ─── CDN URL resolver for actjs external package system ───────────────────────

export type CdnProvider = 'esm.sh' | 'jsdelivr' | 'unpkg';

export interface ActDepsConfig {
  provider?: CdnProvider;
  packages: Record<string, string>;
}

// Known CSS packages and the relative path to their minified stylesheet.
// Stylesheet is served from jsDelivr regardless of the chosen JS provider.
const CSS_PATHS: Record<string, string> = {
  'bootstrap': 'dist/css/bootstrap.min.css',
  'bulma': 'css/bulma.min.css',
  'tailwindcss': 'dist/tailwind.min.css',
  'animate.css': 'animate.min.css',
  'normalize.css': 'normalize.css',
  'foundation-sites': 'dist/css/foundation.min.css',
  'materialize-css': 'dist/css/materialize.min.css',
};

/**
 * Derive the ESM CDN URL for a package given a provider.
 */
export function resolveUrl(pkg: string, version: string, provider: CdnProvider = 'esm.sh'): string {
  switch (provider) {
    case 'jsdelivr':
      return `https://cdn.jsdelivr.net/npm/${pkg}@${version}/+esm`;
    case 'unpkg':
      return `https://unpkg.com/${pkg}@${version}?module`;
    case 'esm.sh':
    default:
      return `https://esm.sh/${pkg}@${version}`;
  }
}

/**
 * Derive the CSS stylesheet URL for a known CSS package, or null if unknown.
 * Always uses jsDelivr for stylesheet delivery.
 */
export function resolveStylesheetUrl(pkg: string, version: string): string | null {
  const cssPath = CSS_PATHS[pkg];
  if (!cssPath) return null;
  return `https://cdn.jsdelivr.net/npm/${pkg}@${version}/${cssPath}`;
}

/**
 * Returns true if the package is known to ship a CSS stylesheet.
 */
export function isKnownCssPackage(pkg: string): boolean {
  return pkg in CSS_PATHS;
}
