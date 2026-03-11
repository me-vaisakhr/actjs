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
