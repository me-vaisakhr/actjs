import { describe, it, expect, afterEach } from 'vitest';
import { CssManager } from '../src/css.js';

afterEach(() => {
  document.head.innerHTML = '';
});

describe('CssManager', () => {
  it('criticalCSS injects a <style> tag', () => {
    const mgr = new CssManager();
    mgr.criticalCSS('body { color: red; }');
    const style = document.querySelector('style');
    expect(style?.textContent).toBe('body { color: red; }');
  });

  it('criticalStylesheet injects a <link rel="stylesheet">', () => {
    const mgr = new CssManager();
    mgr.criticalStylesheet('/styles.css');
    const link = document.querySelector('link[rel="stylesheet"]');
    expect(link?.getAttribute('href')).toBe('/styles.css');
  });

  it('destroy() removes injected elements', () => {
    const mgr = new CssManager();
    mgr.criticalCSS('p { color: blue; }');
    mgr.criticalStylesheet('/reset.css');
    expect(document.querySelectorAll('style, link').length).toBe(2);
    mgr.destroy();
    expect(document.querySelectorAll('style, link').length).toBe(0);
  });

  it('destroy() is idempotent', () => {
    const mgr = new CssManager();
    mgr.criticalCSS('a {}');
    mgr.destroy();
    expect(() => mgr.destroy()).not.toThrow();
    expect(document.querySelectorAll('style').length).toBe(0);
  });

  it('multiple managers are independent', () => {
    const mgr1 = new CssManager();
    const mgr2 = new CssManager();
    mgr1.criticalCSS('h1 {}');
    mgr2.criticalCSS('h2 {}');
    mgr1.destroy();
    expect(document.querySelectorAll('style').length).toBe(1);
    mgr2.destroy();
    expect(document.querySelectorAll('style').length).toBe(0);
  });
});
