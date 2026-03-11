import { component, signal, computed, el } from 'actjs';

export const ComputedDemo = component(() => {
  const [n, setN] = signal(4);
  const squared = computed(() => n() ** 2);
  const isEven  = computed(() => n() % 2 === 0);

  return () => el.div(
    el.div({ class: 'd-count', style: 'font-size:2.5rem' }, String(n())),
    el.div({ class: 'd-label' }, 'input value'),
    el.div({ class: 'd-value' },
      `squared = ${squared()}   |   ${isEven() ? 'even' : 'odd'}`,
    ),
    el.div({ class: 'd-btns', style: 'margin-top:0.75rem' },
      el.button({ class: 'd-btn green', onclick: () => setN(v => v + 1) }, '+1'),
      el.button({ class: 'd-btn red',   onclick: () => setN(v => Math.max(0, v - 1)) }, '-1'),
    ),
  );
}, { hydrate: 'interactive' });
