import { component, createApp } from 'actjs';
import { themeMode, setThemeMode, applyTheme, type ThemeMode } from '../themeStore.js';

const MODES: ThemeMode[] = ['dark', 'light', 'system'];

// ComponentA — reads + writes the shared theme signal
const ComponentA = component(() => {
  const cycle = () => {
    const next = MODES[(MODES.indexOf(themeMode()) + 1) % MODES.length]!;
    setThemeMode(next);
    applyTheme(next);
  };

  return () => (
    <div class="gs-card gs-card-mb">
      <div class="gs-sublabel">ComponentA — writes theme</div>
      <div class="gs-header">
        <span class="gs-mono">{themeMode()}</span>
        <button type="button" class="d-btn" onClick={cycle}>Change</button>
      </div>
    </div>
  );
}, { hydrate: 'interactive' });

// ComponentB — read-only mirror of the same signal
const ComponentB = component(() => {
  return () => (
    <div class="gs-card">
      <div class="gs-sublabel">ComponentB — reads same signal</div>
      <div class="gs-mono-b">{themeMode()}</div>
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
