import { component, signal } from 'js-act';

export const SignalCounter = component(() => {
  const [count, setCount] = signal(0);

  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset     = () => setCount(0);

  return () => (
    <div>
      <div class="d-count">{count()}</div>
      <div class="d-label">current value</div>
      <div class="d-btns">
        <button type="button" class="d-btn green"  onClick={increment}>+1</button>
        <button type="button" class="d-btn accent" onClick={reset}>reset</button>
        <button type="button" class="d-btn red"    onClick={decrement} disabled={count() <= 0}>-1</button>
      </div>
    </div>
  );
}, { hydrate: 'interactive' });
