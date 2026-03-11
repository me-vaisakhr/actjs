import { component, signal, computed, el } from 'actjs';

interface Item {
  id: number;
  text: string;
  done: boolean;
}

let nextId = 3;

export const TodoDemo = component(() => {
  const [items, setItems] = signal<Item[]>([
    { id: 1, text: 'Read the actjs docs', done: true },
    { id: 2, text: 'Build something cool', done: false },
  ]);
  const [input, setInput] = signal('');

  const remaining = computed(() => items().filter(i => !i.done).length);

  const add = () => {
    const text = input().trim();
    if (!text) return;
    setItems(it => [...it, { id: nextId++, text, done: false }]);
    setInput('');
  };

  const toggle = (id: number) =>
    setItems(it => it.map(i => i.id === id ? { ...i, done: !i.done } : i));

  const remove = (id: number) =>
    setItems(it => it.filter(i => i.id !== id));

  return () => el.div(
    el.div({ style: 'display:flex;gap:0.5rem;margin-bottom:0.75rem' },
      el.input({
        class: 'd-input',
        style: 'margin-bottom:0',
        placeholder: 'Add task...',
        value: input(),
        oninput: (e: Event) => setInput((e.target as HTMLInputElement).value),
        onkeydown: (e: KeyboardEvent) => { if (e.key === 'Enter') add(); },
      }),
      el.button({ class: 'd-btn accent', onclick: add }, 'Add'),
    ),
    el.div(
      ...items().map(item =>
        el.div({ class: `todo-item${item.done ? ' done' : ''}` },
          el.input({ type: 'checkbox', checked: item.done, onchange: () => toggle(item.id) }),
          el.span(item.text),
          el.button({ class: 'del-btn', onclick: () => remove(item.id) }, '×'),
        )
      ),
    ),
    el.div({ class: 'todo-count' },
      `${remaining()} task${remaining() !== 1 ? 's' : ''} remaining`,
    ),
  );
}, { hydrate: 'interactive' });
