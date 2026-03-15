// ─── Reactivity ───────────────────────────────────────────────────────────────

export interface Effect {
  run(): void;
  deps: Set<Set<Effect>>;
}

export type Getter<T> = () => T;
export type Setter<T> = (newValue: T | ((prev: T) => T)) => void;
export type Signal<T> = [getter: Getter<T>, setter: Setter<T>];

// ─── Refs ─────────────────────────────────────────────────────────────────────

export interface Ref<T extends Element = Element> {
  current: T | null;
}

// ─── Children ─────────────────────────────────────────────────────────────────

export type Child =
  | string
  | number
  | boolean
  | null
  | undefined
  | Element
  | DocumentFragment
  | Child[];

export type Props = Record<string, unknown>;

// ─── Head ─────────────────────────────────────────────────────────────────────

export interface HeadConfig {
  title?: string;
  meta?: Array<Record<string, string>>;
  link?: Array<Record<string, string>>;
}

// ─── Resource ─────────────────────────────────────────────────────────────────

export interface Resource<T> {
  (): T | undefined;
  loading: Getter<boolean>;
  error: Getter<Error | undefined>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export type RenderFn = () => Element | DocumentFragment | void;

export type HydrateStrategy = 'static' | 'interactive' | 'visible';

export interface ComponentOptions {
  hydrate?: HydrateStrategy;
}

export interface ComponentProps<P extends object = object>
  extends Record<string, unknown> {
  children?: Child | Child[];
  key?: string | number;
}

// ─── Setup Context ─────────────────────────────────────────────────────────────

export interface SetupContext {
  onInitFns: Array<() => void | Promise<void>>;
  onMountFns: Array<() => void>;
  onDestroyFns: Array<() => void>;
  headConfig: HeadConfig | null;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export interface Route {
  /** URL pattern. Supports `:param` segments and `*` wildcard catch-all. */
  path: string;
  /** Component factory to render when this route matches. */
  component: (props?: Record<string, unknown>) => Element;
}

export interface RouterOptions {
  /** Strip this prefix from the pathname before matching. E.g. '/app'. */
  base?: string;
}

// ─── JSX Helpers ──────────────────────────────────────────────────────────────

/**
 * Typed CSS properties for the `style` prop. Accepts any valid CSS property
 * name as a key and a string or number as the value.
 *
 * @example
 * const boxStyle: CSSProperties = { color: 'red', fontSize: '1rem' };
 * return () => <div style={boxStyle}>Hello</div>;
 */
export type CSSProperties = Record<string, string | number>;

/**
 * Typed event handler props for common DOM events.
 * Use when you need strict typing on event handler arguments.
 *
 * @example
 * const MyInput = component<JSXEventHandlers>(() => {
 *   return () => (
 *     <input
 *       onInput={(e: InputEvent) => console.log((e.target as HTMLInputElement).value)}
 *     />
 *   );
 * });
 */
export interface JSXEventHandlers {
  onClick?:     (e: MouseEvent)    => void;
  onDblClick?:  (e: MouseEvent)    => void;
  onMouseDown?: (e: MouseEvent)    => void;
  onMouseUp?:   (e: MouseEvent)    => void;
  onMouseMove?: (e: MouseEvent)    => void;
  onMouseOver?: (e: MouseEvent)    => void;
  onMouseOut?:  (e: MouseEvent)    => void;
  onInput?:     (e: InputEvent)    => void;
  onChange?:    (e: Event)         => void;
  onSubmit?:    (e: SubmitEvent)   => void;
  onKeyDown?:   (e: KeyboardEvent) => void;
  onKeyUp?:     (e: KeyboardEvent) => void;
  onKeyPress?:  (e: KeyboardEvent) => void;
  onFocus?:     (e: FocusEvent)    => void;
  onBlur?:      (e: FocusEvent)    => void;
  onScroll?:    (e: Event)         => void;
  onWheel?:     (e: WheelEvent)    => void;
  onDragStart?: (e: DragEvent)     => void;
  onDragEnd?:   (e: DragEvent)     => void;
  onDrop?:      (e: DragEvent)     => void;
  onTouchStart?:(e: TouchEvent)    => void;
  onTouchEnd?:  (e: TouchEvent)    => void;
  onTouchMove?: (e: TouchEvent)    => void;
}

// ─── Loader ───────────────────────────────────────────────────────────────────

export interface LoadScriptOptions {
  type?: 'text/javascript' | 'module';
  async?: boolean;
  defer?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
  noModule?: boolean;
  id?: string;
}

export interface LoadStylesheetOptions {
  media?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export interface CreateAppOptions {
  hydrate?: boolean;
  devWarnings?: boolean;
}

export interface ActApp {
  mount(component: (props?: Props) => Element | DocumentFragment | void): void;
  destroy(): void;
  criticalCSS(css: string): void;
  criticalStylesheet(href: string): void;
  safeSetInterval(fn: () => void, ms: number): number;
  safeClearInterval(id: number): void;
  safeSetTimeout(fn: () => void, ms: number): number;
  safeClearTimeout(id: number): void;
}
