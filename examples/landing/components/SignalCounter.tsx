import { component, signal, el } from 'actjs';

export const SignalCounter = component(() => {
  const [count, setCount] = signal(0);

  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset     = () => setCount(0);

  return () => el.div(
    el.div({ class: 'd-count' }, String(count())),
    el.div({ class: 'd-label' }, 'current value'),
    el.div({ class: 'd-btns' },
      el.button({ class: 'd-btn green',  onclick: increment }, '+1'),
      el.button({ class: 'd-btn accent', onclick: reset     }, 'reset'),
      el.button({ class: 'd-btn red',    onclick: decrement, disabled: count() <= 0 }, '-1'),
    ),
  );
}, { hydrate: 'interactive' });
