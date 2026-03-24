import { component, signal, computed } from 'js-act';

export const ComputedDemo = component(() => {
  const [n, setN] = signal(4);
  const squared = computed(() => n() ** 2);
  const isEven  = computed(() => n() % 2 === 0);

  return () => (
    <div>
      <div class="d-count d-count-md">{n()}</div>
      <div class="d-label">input value</div>
      <div class="d-value">
        {`squared = ${squared()}   |   ${isEven() ? 'even' : 'odd'}`}
      </div>
      <div class="d-btns mt-sm">
        <button type="button" class="d-btn green" onClick={() => setN(v => v + 1)}>+1</button>
        <button type="button" class="d-btn red"   onClick={() => setN(v => Math.max(0, v - 1))}>-1</button>
      </div>
    </div>
  );
}, { hydrate: 'interactive' });
