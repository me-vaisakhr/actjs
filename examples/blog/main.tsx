import { component, signal, createApp, html } from 'actjs';

// ─── Static island — ships zero JS ───────────────────────────────────────────
const Header = component(() => {
  return () => html`
    <header>
      <h1>My Blog</h1>
      <nav>
        <a href="/">Home</a>
        ${' · '}
        <a href="/about">About</a>
      </nav>
    </header>
  `;
});

// ─── Interactive island — one per post ───────────────────────────────────────
function makeLikeButton(initialLikes: number) {
  return component(() => {
    const [liked, setLiked] = signal(false);
    const [count, setCount] = signal(initialLikes);

    const toggle = () => {
      const isLiked = liked();
      setLiked(l => !l);
      setCount(c => isLiked ? c - 1 : c + 1);
    };

    return () => html`
      <button onclick=${toggle} class=${liked() ? 'like-btn liked' : 'like-btn'}>
        ${liked() ? '❤️' : '🤍'} ${count()} likes
      </button>
    `;
  }, { hydrate: 'interactive' });
}

// ─── Visible island — hydrates on scroll ─────────────────────────────────────
const Newsletter = component(() => {
  const [email, setEmail] = signal('');
  const [submitted, setSubmitted] = signal(false);

  const submit = (e: Event) => {
    e.preventDefault();
    if (email()) setSubmitted(true);
  };

  return () => submitted()
    ? html`<div><p>Subscribed! Check ${email()} for confirmation.</p></div>`
    : html`
      <form onsubmit=${submit}>
        <h3>Newsletter</h3>
        <p>Get notified when new posts drop.</p>
        <input
          type="email"
          placeholder="you@example.com"
          value=${email()}
          oninput=${(e: Event) => setEmail((e.target as HTMLInputElement).value)}
          style=${{ padding: '0.5rem', width: '240px', marginRight: '0.5rem' }}
        />
        <button type="submit">Subscribe</button>
      </form>
    `;
}, { hydrate: 'visible' });

// ─── Mount all islands independently ─────────────────────────────────────────
createApp('#header').mount(Header);
createApp('#like-1').mount(makeLikeButton(42));
createApp('#like-2').mount(makeLikeButton(17));
createApp('#like-3').mount(makeLikeButton(31));
createApp('#newsletter').mount(Newsletter);
