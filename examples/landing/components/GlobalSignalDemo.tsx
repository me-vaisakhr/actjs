import { component, globalSignal, createApp, el } from 'actjs';

const THEMES = ['light', 'dark', 'system'] as const;

const ComponentA = component(() => {
  const [theme, setTheme] = globalSignal<string>('landing-theme', 'light');

  const cycle = () => {
    const next = THEMES[(THEMES.indexOf(theme() as typeof THEMES[number]) + 1) % THEMES.length];
    setTheme(next!);
  };

  return () => el.div({ style: 'background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:0.6rem 0.9rem;margin-bottom:0.4rem' },
    el.div({ class: 'd-muted', style: 'font-size:0.75rem;margin-bottom:0.3rem' }, 'ComponentA'),
    el.div({ style: 'display:flex;align-items:center;justify-content:space-between' },
      el.span({ style: 'font-family:var(--font-mono);color:var(--accent);font-size:0.9rem' }, theme()),
      el.button({ class: 'd-btn', onclick: cycle }, 'cycle'),
    ),
  );
}, { hydrate: 'interactive' });

const ComponentB = component(() => {
  const [theme] = globalSignal<string>('landing-theme', 'light');

  return () => el.div({ style: 'background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:0.6rem 0.9rem' },
    el.div({ class: 'd-muted', style: 'font-size:0.75rem;margin-bottom:0.3rem' }, 'ComponentB — reads same signal'),
    el.div({ style: 'font-family:var(--font-mono);color:#a78bfa;font-size:0.9rem' }, theme()),
  );
}, { hydrate: 'interactive' });

export const GlobalSignalDemo = component(() => {
  return () => {
    const wrapper = document.createElement('div');

    queueMicrotask(() => {
      const divA = document.createElement('div');
      const divB = document.createElement('div');
      wrapper.appendChild(divA);
      wrapper.appendChild(divB);
      createApp(divA).mount(ComponentA);
      createApp(divB).mount(ComponentB);
    });

    return wrapper;
  };
}, { hydrate: 'interactive' });
