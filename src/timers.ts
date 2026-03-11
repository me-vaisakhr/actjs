/**
 * Safe timer wrappers — auto-cleared on destroy().
 */
export class TimerManager {
  private readonly intervals = new Set<ReturnType<typeof setInterval>>();
  private readonly timeouts = new Set<ReturnType<typeof setTimeout>>();

  safeSetInterval(fn: () => void, ms: number): ReturnType<typeof setInterval> {
    const id = setInterval(fn, ms);
    this.intervals.add(id);
    return id;
  }

  safeClearInterval(id: ReturnType<typeof setInterval>): void {
    clearInterval(id);
    this.intervals.delete(id);
  }

  safeSetTimeout(fn: () => void, ms: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this.timeouts.delete(id);
      fn();
    }, ms);
    this.timeouts.add(id);
    return id;
  }

  safeClearTimeout(id: ReturnType<typeof setTimeout>): void {
    clearTimeout(id);
    this.timeouts.delete(id);
  }

  destroy(): void {
    for (const id of this.intervals) clearInterval(id);
    for (const id of this.timeouts) clearTimeout(id);
    this.intervals.clear();
    this.timeouts.clear();
  }
}
