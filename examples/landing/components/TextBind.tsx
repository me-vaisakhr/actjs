import { component, signal } from 'actjs';

export const TextBind = component(() => {
  const [name, setName] = signal('');

  return () => (
    <div>
      <input
        class="d-input"
        placeholder="Type your name..."
        value={name()}
        onInput={(e: Event) => setName((e.target as HTMLInputElement).value)}
      />
      <div class="d-value">
        {name() ? `Hello, ${name()}!` : 'Waiting for input...'}
      </div>
    </div>
  );
}, { hydrate: 'interactive' });
