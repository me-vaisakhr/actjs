import { component, signal, useInterval } from 'js-act';

export const TimerDemo = component(() => {
  const [elapsed, setElapsed] = signal(0);
  const [flash, setFlash]     = signal(false);

  // Tick every second — auto-clears on destroy
  useInterval(() => setElapsed(s => s + 1), 1000);

  // Flash the badge on every 5th second
  useInterval(() => {
    const s = elapsed() + 1;
    if (s % 5 === 0) {
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    }
  }, 1000);

  return () => (
    <div>
      <div class="d-muted timer-hint">
        Timers start on mount, clean up on destroy — no <code>app</code> reference needed.
      </div>
      <div class="timer-display">
        <span class="timer-count">{elapsed()}s</span>
        {flash() && <span class="timer-badge">5s!</span>}
      </div>
      <pre class="code-inline">{`useInterval(() => setElapsed(s => s + 1), 1000);
useTimeout(() => setFlash(true), 5000);`}</pre>
    </div>
  );
}, { hydrate: 'interactive' });
