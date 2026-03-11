import * as fs from 'node:fs';
import * as path from 'node:path';

type ChangeCallback = () => void;

export class FileWatcher {
  private callbacks: ChangeCallback[] = [];
  private handles: fs.FSWatcher[] = [];
  private lastEvents = new Map<string, number>(); // filename → last event ms
  private readonly dedupeMs = 50;

  /**
   * Start watching `projectRoot` recursively.
   * Falls back to per-directory watching on platforms that don't support recursive mode.
   */
  start(projectRoot: string): void {
    try {
      const handle = fs.watch(
        projectRoot,
        { recursive: true },
        (_event, filename) => this.onEvent(filename ?? ''),
      );
      this.handles.push(handle);
    } catch {
      console.warn(
        '[actjs-dev] Recursive fs.watch unavailable — falling back to top-level watch.',
      );
      // Watch only the immediate directory (non-recursive fallback)
      const handle = fs.watch(projectRoot, (_event, filename) =>
        this.onEvent(filename ?? ''),
      );
      this.handles.push(handle);
    }
  }

  /**
   * Update the watched directory set based on esbuild metafile inputs.
   * Adds watchers for any new parent directories not yet watched.
   */
  updateFromMetafile(watchedFiles: string[]): void {
    const dirs = new Set(watchedFiles.map(f => path.dirname(path.resolve(f))));
    for (const dir of dirs) {
      const alreadyWatched = this.handles.some(h => {
        try { return (h as unknown as { path?: string }).path === dir; } catch { return false; }
      });
      if (!alreadyWatched) {
        try {
          const handle = fs.watch(dir, (_event, filename) =>
            this.onEvent(filename ? path.join(dir, filename) : dir),
          );
          this.handles.push(handle);
        } catch {
          // Directory may not exist anymore — skip silently
        }
      }
    }
  }

  onChange(cb: ChangeCallback): void {
    this.callbacks.push(cb);
  }

  close(): void {
    for (const h of this.handles) {
      try { h.close(); } catch { /* ignore */ }
    }
    this.handles = [];
  }

  private onEvent(filename: string): void {
    const now = Date.now();
    const last = this.lastEvents.get(filename) ?? 0;
    if (now - last < this.dedupeMs) return; // duplicate event — ignore
    this.lastEvents.set(filename, now);
    for (const cb of this.callbacks) cb();
  }
}
