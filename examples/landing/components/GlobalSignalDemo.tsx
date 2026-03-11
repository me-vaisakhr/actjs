import { component, globalSignal, createApp } from 'actjs';

const THEMES = ['light', 'dark', 'system'] as const;

const ComponentA = component(() => {
  const [theme, setTheme] = globalSignal<string>('landing-theme', 'light');

  const cycle = () => {
    const next = THEMES[(THEMES.indexOf(theme() as typeof THEMES[number]) + 1) % THEMES.length];
    setTheme(next!);
  };

  return () => (
    <div class="gs-card gs-card-mb">
      <div class="gs-sublabel">ComponentA</div>
      <div class="gs-header">
        <span class="gs-mono">{theme()}</span>
        <button type="button" class="d-btn" onClick={cycle}>cycle</button>
      </div>
    </div>
  );
}, { hydrate: 'interactive' });

const ComponentB = component(() => {
  const [theme] = globalSignal<string>('landing-theme', 'light');

  return () => (
    <div class="gs-card">
      <div class="gs-sublabel">ComponentB — reads same signal</div>
      <div class="gs-mono-b">{theme()}</div>
    </div>
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
