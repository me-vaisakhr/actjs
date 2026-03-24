import { component, signal } from 'js-act';
import { loadScript } from 'js-act';

declare global {
  interface Window {
    confetti: (opts?: Record<string, unknown>) => Promise<void>;
  }
}

export const DepsDemo = component(() => {
  const [loaded, setLoaded]   = signal(false);
  const [loading, setLoading] = signal(false);
  const [loadErr, setLoadErr] = signal(false);
  const [snap, setSnap]       = signal(false); // brief CSS snap for boring click

  const loadLib = async () => {
    setLoading(true);
    setLoadErr(false);
    try {
      await loadScript(
        'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js',
      );
      setLoaded(true);
    } catch {
      setLoadErr(true);
    } finally {
      setLoading(false);
    }
  };

  const clickBoring = () => {
    setSnap(true);
    setTimeout(() => setSnap(false), 90);
  };

  const clickConfetti = () => {
    window.confetti({
      particleCount: 180,
      spread: 90,
      origin: { y: 0.65 },
      colors: ['#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#fb923c'],
    });
    // Second burst for drama
    setTimeout(() => window.confetti({
      particleCount: 60,
      spread: 55,
      origin: { x: 0.2, y: 0.7 },
      colors: ['#a78bfa', '#f472b6', '#34d399'],
    }), 200);
    setTimeout(() => window.confetti({
      particleCount: 60,
      spread: 55,
      origin: { x: 0.8, y: 0.7 },
      colors: ['#fbbf24', '#60a5fa', '#fb923c'],
    }), 250);
  };

  return () => {
    const isLoaded  = loaded();
    const isLoading = loading();

    return (
      <div>
        {/* Stage */}
        <div class={`deps-stage ${isLoaded ? 'deps-stage-ready' : ''}`}>
          {!isLoaded && <div class="deps-stage-label">before</div>}
          {isLoaded  && <div class="deps-stage-label deps-stage-label-after">after</div>}

          <button
            type="button"
            class={`deps-btn ${snap() ? 'deps-btn-snap' : ''} ${isLoaded ? 'deps-btn-loaded' : ''}`}
            onClick={isLoaded ? clickConfetti : clickBoring}
          >
            <span class="deps-btn-emoji">{isLoaded ? '🎉' : '😐'}</span>
            <span>{isLoaded ? 'Celebrate!' : 'Click me'}</span>
          </button>
        </div>

        {/* Load button */}
        {!isLoaded && (
          <button
            type="button"
            class={`d-btn deps-load-btn ${isLoading ? '' : 'accent'}`}
            disabled={isLoading}
            onClick={loadLib}
          >
            {isLoading
              ? '⏳ Loading canvas-confetti from CDN…'
              : '⚡ Load canvas-confetti from CDN'}
          </button>
        )}

        {/* Hint / status */}
        {loadErr() && (
          <div class="d-value d-value-error deps-error">Failed to load — check network</div>
        )}

        {!isLoaded && !isLoading && !loadErr() && (
          <div class="d-muted deps-hint">
            Click the button — it does nothing interesting.
            Then load <code>canvas-confetti</code> via <code>loadScript()</code>.
          </div>
        )}

        {isLoaded && (
          <div class="deps-loaded-badge">
            <span class="deps-check">✓</span>
            <span>
              <strong>canvas-confetti</strong> loaded from jsDelivr.
              Click the button.
            </span>
          </div>
        )}
      </div>
    );
  };
}, { hydrate: 'interactive' });
