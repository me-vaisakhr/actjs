import { component, signal, computed, onMount, onDestroy, createApp } from 'js-act';

const Counter = component(() => {
  const [count, setCount] = signal(0);
  const doubled = computed(() => count() * 2);

  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset     = () => setCount(0);

  onMount(() => console.log('Counter mounted'));
  onDestroy(() => console.log('Counter destroyed, final count:', count()));

  return () => (
    <section>
      <h1>actjs Counter</h1>
      <p class="count">{count()} (doubled: {doubled()})</p>
      <div>
        <button type="button" onClick={increment} class="primary">Increment</button>
        <button type="button" onClick={reset}>Reset</button>
        <button type="button" onClick={decrement} class="danger" disabled={count() <= 0}>Decrement</button>
      </div>
    </section>
  );
}, { hydrate: 'interactive' });

createApp('#root').mount(Counter);
