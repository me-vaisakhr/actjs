import { component, signal } from 'actjs';

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
      status = <div class="spinner" />;
    } else if (error()) {
      status = <div class="d-value d-value-error">{error()!}</div>;
    } else if (data()) {
      status = (
        <div>
          {data()!.map(u => (
            <div class="resource-card">
              <div class="resource-name">{u.name}</div>
              <div class="resource-meta">{u.role}</div>
            </div>
          ))}
        </div>
      );
    } else {
      status = <div class="d-muted">Click "Fetch users" to load data.</div>;
    }

    return (
      <div>
        <div class="d-row mb-sm">
          <div class="d-muted">Simulates async fetch with loading/error states</div>
          <button type="button" class="d-btn accent" onClick={fetchData}>Fetch users</button>
        </div>
        {status}
      </div>
    );
  };
}, { hydrate: 'interactive' });
