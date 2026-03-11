import { component, signal, el } from 'actjs';

const COLORS = ['#c9ff33', '#33aaff', '#ff4545', '#33ff99', '#f97316'];

export const ElDemo = component(() => {
  const [clicks, setClicks] = signal(0);
  const [color, setColor]   = signal(COLORS[0]!);

  const handleClick = () => {
    const next = clicks() + 1;
    setClicks(next);
    setColor(COLORS[next % COLORS.length]!);
  };

  return () => el.div(
    el.div({ class: 'd-muted', style: 'font-size:0.82rem;margin-bottom:0.6rem' },
      'el.* hyperscript — Proxy over h(), no build step',
    ),
    el.div({
      style: `display:inline-block;background:${color()};color:#0d0d0f;padding:0.4rem 1rem;border-radius:5px;font-family:var(--font-mono);font-size:0.85rem;margin-bottom:0.75rem`,
    }, `clicked ${clicks()} times`),
    el.div({ class: 'd-btns' },
      el.button({ class: 'd-btn accent', onclick: handleClick }, 'click me'),
    ),
  );
}, { hydrate: 'interactive' });
