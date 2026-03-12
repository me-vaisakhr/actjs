import { component, ref, onMount } from 'actjs';

export const RefDemo = component(() => {
  const listRef    = ref<HTMLDivElement>();
  const displayRef = ref<HTMLDivElement>();

  onMount(() => {
    const el      = listRef.current!;
    const display = displayRef.current!;
    el.addEventListener('scroll', () => {
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? Math.round((el.scrollTop / max) * 100) : 0;
      display.textContent = `ref.current.scrollTop → ${pct}% scrolled`;
    });
  });

  return () => (
    <div>
      <div ref={listRef} class="ref-scroll-box">
        {Array.from({ length: 12 }, (_, i) => (
          <div class="ref-scroll-item">Item {i + 1}</div>
        ))}
      </div>
      <div class="d-value ref-value-mt" ref={displayRef}>
        ref.current.scrollTop → 0% scrolled
      </div>
    </div>
  );
}, { hydrate: 'interactive' });
