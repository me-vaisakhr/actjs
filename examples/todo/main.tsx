import { component, signal, computed, createApp } from 'actjs';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

let nextId = 1;

const TodoApp = component(() => {
  const [todos, setTodos] = signal<Todo[]>([]);
  const [input, setInput] = signal('');
  const [filter, setFilter] = signal<'all' | 'active' | 'done'>('all');

  const filteredTodos = computed(() => {
    const f = filter();
    const all = todos();
    if (f === 'active') return all.filter(t => !t.done);
    if (f === 'done')   return all.filter(t => t.done);
    return all;
  });

  const remaining = computed(() => todos().filter(t => !t.done).length);

  const addTodo = (e: Event) => {
    e.preventDefault();
    const text = input().trim();
    if (!text) return;
    setTodos(prev => [...prev, { id: nextId++, text, done: false }]);
    setInput('');
  };

  const toggle = (id: number) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const remove = (id: number) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  return () => (
    <div>
      <h1>Todo</h1>
      <form onSubmit={addTodo} class="add-row">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={input()}
          onInput={(e: Event) => setInput((e.target as HTMLInputElement).value)}
        />
        <button type="submit">Add</button>
      </form>
      <div class="filter-row">
        <button type="button" onClick={() => setFilter('all')}    class={filter() === 'all'    ? 'active' : ''}>All</button>
        <button type="button" onClick={() => setFilter('active')} class={filter() === 'active' ? 'active' : ''}>Active</button>
        <button type="button" onClick={() => setFilter('done')}   class={filter() === 'done'   ? 'active' : ''}>Done</button>
      </div>
      <ul>
        {filteredTodos().map(todo => (
          <li class={todo.done ? 'done' : ''}>
            <input placeholder="todo" type="checkbox" checked={todo.done} onChange={() => toggle(todo.id)} />
            <span>{todo.text}</span>
            <button type="button" onClick={() => remove(todo.id)}>✕</button>
          </li>
        ))}
      </ul>
      <p class="stats">{remaining()} item{remaining() === 1 ? '' : 's'} remaining</p>
    </div>
  );
}, { hydrate: 'interactive' });

createApp('#root').mount(TodoApp);
