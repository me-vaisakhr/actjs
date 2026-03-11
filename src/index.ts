// ─── Public API barrel ────────────────────────────────────────────────────────

export type {
  Signal,
  Getter,
  Setter,
  Ref,
  Child,
  Props,
  HeadConfig,
  Resource,
  RenderFn,
  HydrateStrategy,
  ComponentOptions,
  ComponentProps,
  CreateAppOptions,
  ActApp,
  Route,
  RouterOptions,
} from './types.js';

export { signal, computed } from './signal.js';
export { globalSignal } from './global-signal.js';
export { onInit, onMount, onDestroy } from './lifecycle.js';
export { useHead } from './head.js';
export { resource, Suspense } from './resource.js';
export { h, el, ref, Fragment } from './hyperscript.js';
export { html } from './template.js';
export { component, component as defineComponent } from './component.js';
export { createApp } from './app.js';
export {
  createRouter,
  navigate,
  Link,
  params,
  query,
  currentPath,
  matchRoute,
} from './router.js';
