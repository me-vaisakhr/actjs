import { component, signal, el } from 'actjs';

export const TextBind = component(() => {
  const [name, setName] = signal('');

  return () => el.div(
    el.input({
      class: 'd-input',
      placeholder: 'Type your name...',
      oninput: (e: Event) => setName((e.target as HTMLInputElement).value),
      value: name(),
    }),
    el.div({ class: 'd-value' },
      name() ? `Hello, ${name()}!` : 'Waiting for input...',
    ),
  );
}, { hydrate: 'interactive' });
