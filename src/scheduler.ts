/**
 * Wraps a render function in a microtask scheduler.
 * Multiple signal updates in one tick → exactly 1 re-render via queueMicrotask.
 */
export function makeScheduler(renderFn: () => void): () => void {
  let pending = false;

  return function scheduleRerender(): void {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
      pending = false;
      renderFn();
    });
  };
}
