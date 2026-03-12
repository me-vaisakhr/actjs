import { component, signal } from 'actjs';

export const TextBind = component(() => {
  const [name, setName] = signal('');

  return () => (
    <div class="d-col">
      <input
        class="d-input"
        placeholder="Type your name..."
        value={name()}
        onInput={(e: Event) => setName((e.target as HTMLInputElement).value)}
      />
      <div class="d-value w-100">
        {name() ? `Hello, ${name()}!` : 'Waiting for input...'}
      </div>
    </div>
  );
}, { hydrate: 'interactive' });
