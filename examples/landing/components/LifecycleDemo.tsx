import { component, signal, onInit, onMount, onDestroy, el } from 'actjs';

interface LogEntry {
  type: 'init' | 'mount' | 'destroy';
  msg: string;
  ts: string;
}

export const LifecycleDemo = component(() => {
  const [logs, setLogs] = signal<LogEntry[]>([]);
  let mountCount = 0;

  const addLog = (type: LogEntry['type'], msg: string) => {
    const ts = new Date().toLocaleTimeString('en', { hour12: false });
    setLogs(prev => {
      const next = [...prev, { type, msg, ts }];
      return next.length > 8 ? next.slice(next.length - 8) : next;
    });
  };

  onInit(() => addLog('init', 'onInit — runs on server + client'));
  onMount(() => addLog('mount', `onMount — DOM ready (mount #${++mountCount})`));
  onDestroy(() => addLog('destroy', 'onDestroy — cleanup'));

  return () => el.div(
    el.div({ class: 'd-muted', style: 'font-size:0.85rem' }, 'Lifecycle hooks fire on mount/destroy.'),
    el.div({ class: 'lifecycle-log' },
      ...logs().map(l =>
        el.div({ class: 'log-entry' },
          el.span({ class: 'ts' }, `[${l.ts}] `),
          el.span({ class: 'log-' + l.type }, l.msg),
        )
      ),
    ),
  );
}, { hydrate: 'interactive' });
