import { component, signal, ref, onMount, el } from 'actjs';

export const RefDemo = component(() => {
  const inputRef = ref<HTMLInputElement>();
  const [focused, setFocused] = signal(false);

  onMount(() => {
    inputRef.current?.focus();
  });

  return () => el.div(
    el.input({
      ref: inputRef,
      class: 'd-input',
      placeholder: 'Auto-focused via ref()...',
      onfocus: () => setFocused(true),
      onblur: () => setFocused(false),
    }),
    el.div({ class: 'd-value' },
      `ref.current.tagName = "${focused() ? 'INPUT (focused)' : 'INPUT'}"`,
    ),
  );
}, { hydrate: 'interactive' });
