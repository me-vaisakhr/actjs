import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import {
  loadScript,
  loadStylesheet,
  defineImportMap,
  preloadResource,
  useDeps,
  __resetLoaderState,
} from '../src/loader.js';

// ─── Script mock helpers ───────────────────────────────────────────────────────
// happy-dom's HTMLScriptElement uses fetchSync() which throws a DOMException
// synchronously on 404. We mock document.createElement('script') to return a
// plain object with the same interface so loadScript() can be tested without
// triggering happy-dom's internal network behaviour.

type MockScript = {
  src: string;
  type: string;
  async: boolean;
  defer: boolean;
  crossOrigin: string | null;
  integrity: string;
  noModule: boolean;
  id: string;
  onload: ((e: Event) => void) | null;
  onerror: ((e: Event) => void) | null;
  dispatchEvent(e: Event): void;
};

let mockScripts: MockScript[] = [];

function setupScriptMock() {
  mockScripts = [];
  const realCreate = document.createElement.bind(document);

  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag !== 'script') return realCreate(tag);
    const el: MockScript = {
      src: '',
      type: 'text/javascript',
      async: true,
      defer: false,
      crossOrigin: null,
      integrity: '',
      noModule: false,
      id: '',
      onload: null,
      onerror: null,
      dispatchEvent(e: Event) {
        if (e.type === 'load') this.onload?.call(this, e);
        if (e.type === 'error') this.onerror?.call(this, e);
      },
    };
    mockScripts.push(el);
    return el as unknown as HTMLScriptElement;
  });

  // Prevent mock scripts from being appended to the DOM (they're plain objects,
  // not real nodes, so we intercept appendChild and skip them).
  const realAppend = document.head.appendChild.bind(document.head);
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(child: T): T => {
    if ((mockScripts as unknown[]).includes(child)) return child;
    return realAppend(child);
  });
}

function lastScript() {
  return mockScripts[mockScripts.length - 1];
}

afterEach(() => {
  document.head.innerHTML = '';
  __resetLoaderState();
  vi.restoreAllMocks();
});

// ─── loadScript ───────────────────────────────────────────────────────────────

describe('loadScript', () => {
  beforeEach(setupScriptMock);

  it('sets src on the created script element', () => {
    const p = loadScript('/test-1.js');
    expect(lastScript().src).toBe('/test-1.js');
    lastScript().dispatchEvent(new Event('load'));
    return p;
  });

  it('resolves when the script fires a load event', async () => {
    const p = loadScript('/test-2.js');
    lastScript().dispatchEvent(new Event('load'));
    await expect(p).resolves.toBeUndefined();
  });

  it('rejects when the script fires an error event', async () => {
    const p = loadScript('/test-3.js');
    lastScript().dispatchEvent(new Event('error'));
    await expect(p).rejects.toThrow('actjs: Failed to load script: /test-3.js');
  });

  it('is idempotent — second call resolves without creating a new element', async () => {
    const p1 = loadScript('/test-4.js');
    lastScript().dispatchEvent(new Event('load'));
    await p1;

    const p2 = loadScript('/test-4.js');
    await expect(p2).resolves.toBeUndefined();
    expect(mockScripts.length).toBe(1);
  });

  it('concurrent calls share the same in-flight Promise', () => {
    const p1 = loadScript('/test-5.js');
    const p2 = loadScript('/test-5.js');
    expect(p1).toBe(p2);
    lastScript().dispatchEvent(new Event('load'));
  });

  it('detects a pre-existing script tag and skips injection', async () => {
    // Simulate a script already in the HTML before actjs ran
    vi.spyOn(document, 'querySelector').mockImplementationOnce((sel: string) => {
      if (sel === 'script[src="/pre-existing.js"]') return {} as Element;
      return null;
    });

    const p = loadScript('/pre-existing.js');
    await expect(p).resolves.toBeUndefined();
    expect(mockScripts.length).toBe(0); // no new script created
  });

  it('passes type option', async () => {
    const p = loadScript('/test-6.js', { type: 'module' });
    expect(lastScript().type).toBe('module');
    lastScript().dispatchEvent(new Event('load'));
    await p;
  });

  it('passes async option', async () => {
    const p = loadScript('/test-7.js', { async: false });
    expect(lastScript().async).toBe(false);
    lastScript().dispatchEvent(new Event('load'));
    await p;
  });

  it('passes defer option', async () => {
    const p = loadScript('/test-8.js', { defer: true });
    expect(lastScript().defer).toBe(true);
    lastScript().dispatchEvent(new Event('load'));
    await p;
  });

  it('passes crossOrigin option', async () => {
    const p = loadScript('/test-9.js', { crossOrigin: 'anonymous' });
    expect(lastScript().crossOrigin).toBe('anonymous');
    lastScript().dispatchEvent(new Event('load'));
    await p;
  });

  it('passes integrity option', async () => {
    const p = loadScript('/test-10.js', { integrity: 'sha384-abc' });
    expect(lastScript().integrity).toBe('sha384-abc');
    lastScript().dispatchEvent(new Event('load'));
    await p;
  });

  it('passes id option', async () => {
    const p = loadScript('/test-11.js', { id: 'my-script' });
    expect(lastScript().id).toBe('my-script');
    lastScript().dispatchEvent(new Event('load'));
    await p;
  });

  it('passes noModule option', async () => {
    const p = loadScript('/test-12.js', { noModule: true });
    expect(lastScript().noModule).toBe(true);
    lastScript().dispatchEvent(new Event('load'));
    await p;
  });

  it('no-ops and resolves on server (document undefined)', async () => {
    vi.restoreAllMocks(); // remove script mock first
    vi.stubGlobal('document', undefined);
    const p = loadScript('/ssr.js');
    vi.unstubAllGlobals();
    await expect(p).resolves.toBeUndefined();
  });
});

// ─── loadStylesheet ───────────────────────────────────────────────────────────
// happy-dom fetches stylesheets asynchronously (unlike scripts), so we can
// dispatch events manually on the real link element.

describe('loadStylesheet', () => {
  it('injects a <link rel="stylesheet"> with the given href', async () => {
    const p = loadStylesheet('/test-style-1.css');
    const link = document.querySelector('link[rel="stylesheet"][href="/test-style-1.css"]')!;
    expect(link).toBeTruthy();
    link.dispatchEvent(new Event('load'));
    await p;
  });

  it('resolves when the link fires a load event', async () => {
    const p = loadStylesheet('/test-style-2.css');
    const link = document.querySelector('link[rel="stylesheet"][href="/test-style-2.css"]')!;
    link.dispatchEvent(new Event('load'));
    await expect(p).resolves.toBeUndefined();
  });

  it('rejects when the link fires an error event', async () => {
    const p = loadStylesheet('/test-style-3.css');
    const link = document.querySelector('link[rel="stylesheet"][href="/test-style-3.css"]')!;
    link.dispatchEvent(new Event('error'));
    await expect(p).rejects.toThrow('actjs: Failed to load stylesheet: /test-style-3.css');
  });

  it('is idempotent — second call resolves without a new tag', async () => {
    const p1 = loadStylesheet('/test-style-4.css');
    const link = document.querySelector('link[rel="stylesheet"][href="/test-style-4.css"]')!;
    link.dispatchEvent(new Event('load'));
    await p1;

    const p2 = loadStylesheet('/test-style-4.css');
    await expect(p2).resolves.toBeUndefined();
    expect(document.querySelectorAll('link[href="/test-style-4.css"]').length).toBe(1);
  });

  it('concurrent calls share the same in-flight Promise', () => {
    const p1 = loadStylesheet('/test-style-5.css');
    const p2 = loadStylesheet('/test-style-5.css');
    expect(p1).toBe(p2);
    const link = document.querySelector('link[href="/test-style-5.css"]')!;
    link.dispatchEvent(new Event('load'));
  });

  it('detects a pre-existing link tag and skips injection', async () => {
    const existing = document.createElement('link');
    existing.rel = 'stylesheet';
    existing.href = '/test-style-6.css';
    document.head.appendChild(existing);

    const p = loadStylesheet('/test-style-6.css');
    await expect(p).resolves.toBeUndefined();
    expect(document.querySelectorAll('link[href="/test-style-6.css"]').length).toBe(1);
  });

  it('passes media option', async () => {
    const p = loadStylesheet('/test-style-7.css', { media: 'print' });
    const link = document.querySelector('link[href="/test-style-7.css"]') as HTMLLinkElement;
    expect(link.media).toBe('print');
    link.dispatchEvent(new Event('load'));
    await p;
  });

  it('passes crossOrigin option', async () => {
    const p = loadStylesheet('/test-style-8.css', { crossOrigin: 'anonymous' });
    const link = document.querySelector('link[href="/test-style-8.css"]') as HTMLLinkElement;
    expect(link.crossOrigin).toBe('anonymous');
    link.dispatchEvent(new Event('load'));
    await p;
  });

  it('passes integrity option', async () => {
    const p = loadStylesheet('/test-style-9.css', { integrity: 'sha384-xyz' });
    const link = document.querySelector('link[href="/test-style-9.css"]') as HTMLLinkElement;
    expect(link.integrity).toBe('sha384-xyz');
    link.dispatchEvent(new Event('load'));
    await p;
  });

  it('no-ops and resolves on server (document undefined)', async () => {
    vi.stubGlobal('document', undefined);
    const p = loadStylesheet('/ssr.css');
    vi.unstubAllGlobals();
    await expect(p).resolves.toBeUndefined();
  });
});

// ─── defineImportMap ──────────────────────────────────────────────────────────

describe('defineImportMap', () => {
  it('injects a <script type="importmap"> in <head>', () => {
    defineImportMap({ lodash: 'https://esm.sh/lodash@4.17.21' });
    const el = document.querySelector('script[type="importmap"]')!;
    expect(el).toBeTruthy();
    const parsed = JSON.parse(el.textContent!);
    expect(parsed.imports.lodash).toBe('https://esm.sh/lodash@4.17.21');
  });

  it('prepends the import map before other head children', () => {
    const existing = document.createElement('meta');
    document.head.appendChild(existing);
    defineImportMap({ foo: 'https://esm.sh/foo@1' });
    expect(document.head.firstElementChild!.getAttribute('type')).toBe('importmap');
  });

  it('warns and no-ops if an import map already exists', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    defineImportMap({ a: 'https://esm.sh/a' });
    defineImportMap({ b: 'https://esm.sh/b' });
    expect(warn).toHaveBeenCalledWith(
      'actjs: An import map already exists. defineImportMap() had no effect.',
    );
    expect(document.querySelectorAll('script[type="importmap"]').length).toBe(1);
    warn.mockRestore();
  });

  it('no-ops on server (document undefined)', () => {
    vi.stubGlobal('document', undefined);
    expect(() => defineImportMap({ a: 'https://esm.sh/a' })).not.toThrow();
    vi.unstubAllGlobals();
  });
});

// ─── preloadResource ──────────────────────────────────────────────────────────

describe('preloadResource', () => {
  it('injects <link rel="preload" as="script">', () => {
    preloadResource('/app.js', 'script');
    const link = document.querySelector('link[rel="preload"][as="script"]') as HTMLLinkElement;
    expect(link).toBeTruthy();
    expect(link.href).toContain('/app.js');
  });

  it('injects <link rel="preload" as="style">', () => {
    preloadResource('/app.css', 'style');
    const link = document.querySelector('link[rel="preload"][as="style"]') as HTMLLinkElement;
    expect(link).toBeTruthy();
    expect(link.href).toContain('/app.css');
  });

  it('injects <link rel="preload" as="font">', () => {
    preloadResource('/font.woff2', 'font');
    const link = document.querySelector('link[rel="preload"][as="font"]') as HTMLLinkElement;
    expect(link).toBeTruthy();
    expect(link.href).toContain('/font.woff2');
  });

  it('no-ops on server (document undefined)', () => {
    vi.stubGlobal('document', undefined);
    expect(() => preloadResource('/app.js', 'script')).not.toThrow();
    vi.unstubAllGlobals();
  });
});

// ─── useDeps ──────────────────────────────────────────────────────────────────

describe('useDeps', () => {
  it('injects import map for JS packages', async () => {
    const p = useDeps({ provider: 'esm.sh', packages: { lodash: '4.17.21' } });
    const map = document.querySelector('script[type="importmap"]')!;
    expect(JSON.parse(map.textContent!).imports.lodash).toBe('https://esm.sh/lodash@4.17.21');
    await p;
  });

  it('loads stylesheets for known CSS packages', async () => {
    const p = useDeps({ provider: 'esm.sh', packages: { bootstrap: '5.3.3' } });
    const link = document.querySelector(
      'link[rel="stylesheet"][href*="bootstrap"]',
    ) as HTMLLinkElement;
    expect(link).toBeTruthy();
    link.dispatchEvent(new Event('load'));
    await p;
  });

  it('uses esm.sh when provider is omitted', async () => {
    const p = useDeps({ packages: { lodash: '4.17.21' } });
    const map = document.querySelector('script[type="importmap"]')!;
    expect(JSON.parse(map.textContent!).imports.lodash).toContain('esm.sh');
    await p;
  });

  it('no-ops on server (document undefined)', async () => {
    vi.stubGlobal('document', undefined);
    const p = useDeps({ packages: { lodash: '4.17.21' } });
    vi.unstubAllGlobals();
    await expect(p).resolves.toBeUndefined();
  });
});

// ─── __resetLoaderState ───────────────────────────────────────────────────────

describe('__resetLoaderState', () => {
  beforeEach(setupScriptMock);

  it('clears cached URLs so the same script URL can be loaded again', async () => {
    const p1 = loadScript('/reset-test.js');
    lastScript().dispatchEvent(new Event('load'));
    await p1;

    __resetLoaderState();

    // After reset, loadedUrls is cleared — calling loadScript again should create a new element
    const p2 = loadScript('/reset-test.js');
    expect(mockScripts.length).toBe(2); // new mock script was created
    lastScript().dispatchEvent(new Event('load'));
    await p2;
  });
});
