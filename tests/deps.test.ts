import { describe, it, expect } from 'vitest';
import { resolveUrl, resolveStylesheetUrl, isKnownCssPackage } from '../src/deps.js';

describe('resolveUrl', () => {
  it('esm.sh (default)', () => {
    expect(resolveUrl('lodash', '4.17.21', 'esm.sh')).toBe('https://esm.sh/lodash@4.17.21');
  });

  it('jsdelivr', () => {
    expect(resolveUrl('lodash', '4.17.21', 'jsdelivr')).toBe(
      'https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm',
    );
  });

  it('unpkg', () => {
    expect(resolveUrl('lodash', '4.17.21', 'unpkg')).toBe(
      'https://unpkg.com/lodash@4.17.21?module',
    );
  });

  it('falls back to esm.sh for unknown provider', () => {
    // @ts-expect-error intentional unknown provider
    expect(resolveUrl('lodash', '4.17.21', 'other')).toBe('https://esm.sh/lodash@4.17.21');
  });

  it('uses default provider when omitted', () => {
    expect(resolveUrl('lodash', '4.17.21')).toBe('https://esm.sh/lodash@4.17.21');
  });
});

describe('resolveStylesheetUrl', () => {
  it('returns jsdelivr URL for bootstrap', () => {
    expect(resolveStylesheetUrl('bootstrap', '5.3.3')).toBe(
      'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    );
  });

  it('returns jsdelivr URL for bulma', () => {
    expect(resolveStylesheetUrl('bulma', '1.0.0')).toBe(
      'https://cdn.jsdelivr.net/npm/bulma@1.0.0/css/bulma.min.css',
    );
  });

  it('returns jsdelivr URL for tailwindcss', () => {
    expect(resolveStylesheetUrl('tailwindcss', '3.4.17')).toBe(
      'https://cdn.jsdelivr.net/npm/tailwindcss@3.4.17/dist/tailwind.min.css',
    );
  });

  it('returns jsdelivr URL for animate.css', () => {
    expect(resolveStylesheetUrl('animate.css', '4.1.1')).toBe(
      'https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css',
    );
  });

  it('returns jsdelivr URL for normalize.css', () => {
    expect(resolveStylesheetUrl('normalize.css', '8.0.1')).toBe(
      'https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.css',
    );
  });

  it('returns null for unknown CSS package', () => {
    expect(resolveStylesheetUrl('lodash', '4.17.21')).toBeNull();
  });

  it('returns null for unknown package', () => {
    expect(resolveStylesheetUrl('some-random-package', '1.0.0')).toBeNull();
  });
});

describe('isKnownCssPackage', () => {
  it('returns true for bootstrap', () => {
    expect(isKnownCssPackage('bootstrap')).toBe(true);
  });

  it('returns true for tailwindcss', () => {
    expect(isKnownCssPackage('tailwindcss')).toBe(true);
  });

  it('returns true for normalize.css', () => {
    expect(isKnownCssPackage('normalize.css')).toBe(true);
  });

  it('returns false for lodash', () => {
    expect(isKnownCssPackage('lodash')).toBe(false);
  });

  it('returns false for unknown package', () => {
    expect(isKnownCssPackage('unknown-package')).toBe(false);
  });
});
