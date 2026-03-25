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

// ─── SVG Props ────────────────────────────────────────────────────────────────

/** Common SVG presentation and geometry attributes.
 *  Numeric values are accepted where the SVG spec allows them — the runtime
 *  converts them to strings via setAttribute(key, String(value)).
 */
export interface SVGProps {
  // Geometry
  x?: string | number;
  y?: string | number;
  width?: string | number;
  height?: string | number;
  cx?: string | number;
  cy?: string | number;
  r?: string | number;
  rx?: string | number;
  ry?: string | number;
  x1?: string | number;
  y1?: string | number;
  x2?: string | number;
  y2?: string | number;
  d?: string;
  points?: string;
  // Presentation
  fill?: string;
  'fill-opacity'?: string | number;
  'fill-rule'?: 'nonzero' | 'evenodd' | 'inherit';
  stroke?: string;
  'stroke-width'?: string | number;
  'stroke-linecap'?: 'butt' | 'round' | 'square' | 'inherit';
  'stroke-linejoin'?: 'miter' | 'round' | 'bevel' | 'inherit';
  'stroke-dasharray'?: string | number;
  'stroke-dashoffset'?: string | number;
  'stroke-opacity'?: string | number;
  opacity?: string | number;
  // Transform & clip
  transform?: string;
  'clip-path'?: string;
  'clip-rule'?: 'nonzero' | 'evenodd' | 'inherit';
  mask?: string;
  // Container / metadata
  viewBox?: string;
  xmlns?: string;
  'xmlns:xlink'?: string;
  preserveAspectRatio?: string;
  href?: string;
  'xlink:href'?: string;
  // Text
  'font-size'?: string | number;
  'font-family'?: string;
  'font-weight'?: string | number;
  'text-anchor'?: 'start' | 'middle' | 'end' | 'inherit';
  'dominant-baseline'?: string;
  // Shared with HTML
  id?: string;
  class?: string;
  style?: CSSProperties | string;
  children?: Child | Child[];
  [key: string]: unknown;
}

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
