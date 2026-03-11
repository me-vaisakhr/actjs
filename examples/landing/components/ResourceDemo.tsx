import { component, signal, el } from 'actjs';

interface User {
  name: string;
  role: string;
}

const FAKE_USERS: User[] = [
  { name: 'Ada Lovelace',  role: 'Mathematician' },
  { name: 'Grace Hopper',  role: 'Computer Scientist' },
  { name: 'Alan Turing',   role: 'Theorist' },
];

export const ResourceDemo = component(() => {
  const [loading, setLoading] = signal(false);
  const [data, setData]       = signal<User[] | null>(null);
  const [error, setError]     = signal<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setData(null);
    setError(null);
    setTimeout(() => {
      if (Math.random() < 0.2) {
        setError('Network error — try again');
      } else {
        setData(FAKE_USERS);
      }
      setLoading(false);
    }, 1200);
  };

  return () => {
    let status: Element | DocumentFragment;
    if (loading()) {
      status = el.div({ class: 'spinner' });
    } else if (error()) {
      status = el.div({ class: 'd-value', style: 'color:var(--red);border-color:rgba(255,69,69,0.25);background:rgba(255,69,69,0.06)' }, error()!);
    } else if (data()) {
      status = el.div(
        ...data()!.map(u =>
          el.div({ class: 'resource-card' },
            el.div({ class: 'resource-name' }, u.name),
            el.div({ class: 'resource-meta' }, u.role),
          )
        ),
      );
    } else {
      status = el.div({ class: 'd-muted', style: 'font-size:0.85rem' }, 'Click "Fetch users" to load data.');
    }

    return el.div(
      el.div({ style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem' },
        el.div({ class: 'd-muted', style: 'font-size:0.85rem' }, 'Simulates async fetch with loading/error states'),
        el.button({ class: 'd-btn accent', onclick: fetchData }, 'Fetch users'),
      ),
      status,
    );
  };
}, { hydrate: 'interactive' });
