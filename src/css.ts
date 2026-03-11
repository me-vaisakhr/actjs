/**
 * Injects a <style> or <link> into <head> and tracks it for cleanup.
 * All elements injected via a single CssManager instance are removed on destroy().
 */
export class CssManager {
  private readonly injected: Element[] = [];

  criticalCSS(css: string): void {
    if (typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    this.injected.push(style);
  }

  criticalStylesheet(href: string): void {
    if (typeof document === 'undefined') return;
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', href);
    document.head.appendChild(link);
    this.injected.push(link);
  }

  destroy(): void {
    for (const el of this.injected) {
      el.parentNode?.removeChild(el);
    }
    this.injected.length = 0;
  }
}
