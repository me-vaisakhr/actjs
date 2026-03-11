import { component, signal, ref, onMount } from 'actjs';

export const RefDemo = component(() => {
  const inputRef = ref<HTMLInputElement>();
  const [focused, setFocused] = signal(false);

  onMount(() => {
    inputRef.current?.focus();
  });

  return () => (
    <div>
      <input
        ref={inputRef}
        class="d-input"
        placeholder="Auto-focused via ref()..."
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <div class="d-value">
        {`ref.current.tagName = "${focused() ? 'INPUT (focused)' : 'INPUT'}"`}
      </div>
    </div>
  );
}, { hydrate: 'interactive' });
