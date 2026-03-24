import { component, signal, computed } from 'js-act';

export const HeroDemo = component(() => {
  const [count, setCount] = signal(0);
  const doubled = computed(() => count() * 2);
  const isEven = computed(() => count() % 2 === 0);

  return () => (
    <div class="hero-demo-inner">
      <div class="hero-demo-indicator">
        <div class={`hdi-dot ${isEven() ? 'hdi-dot-even' : 'hdi-dot-odd'}`}></div>
        <span class="hdi-label">signals · live</span>
      </div>
      <div class="hero-demo-display">
        <div class={`hero-demo-val ${isEven() ? 'val-even' : 'val-odd'}`}>{count()}</div>
        <div class="hero-demo-sub">
          doubled = <strong>{doubled()}</strong> · {isEven() ? 'even' : 'odd'}
        </div>
      </div>
      <div class="hero-demo-controls">
        <button onclick={() => setCount(c => c - 1)} class="hd-btn">−</button>
        <button onclick={() => setCount(0)} class="hd-btn hd-btn-reset">reset</button>
        <button onclick={() => setCount(c => c + 1)} class="hd-btn hd-btn-primary">+</button>
      </div>
      <div class="hero-demo-snippet">
        <span class="cm">// getter call = subscription</span>{'\n'}
        <span class="kw">const</span> doubled = <span class="fn">computed</span>(() =&gt; count() * <span class="num">2</span>);
      </div>
    </div>
  );
}, { hydrate: 'interactive' });
