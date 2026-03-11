import { component, signal, computed } from 'actjs';

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

  return () => (
    <div>
      <div class="d-flex-gap mb-sm">
        <input
          class="d-input mb-0"
          placeholder="Add task..."
          value={input()}
          onInput={(e: Event) => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Enter') add(); }}
        />
        <button type="button" class="d-btn accent" onClick={add}>Add</button>
      </div>
      <div>
        {items().map(item => (
          <div class={`todo-item${item.done ? ' done' : ''}`}>
            <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} />
            <span>{item.text}</span>
            <button type="button" class="del-btn" onClick={() => remove(item.id)}>×</button>
          </div>
        ))}
      </div>
      <div class="todo-count">
        {`${remaining()} task${remaining() !== 1 ? 's' : ''} remaining`}
      </div>
    </div>
  );
}, { hydrate: 'interactive' });
