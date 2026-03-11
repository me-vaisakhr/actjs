import { h, Fragment } from './hyperscript.js';
import type { Child } from './types.js';

// ─── Op types emitted by parseStrings ───────────────────────────────────────

type AttrOp =
  | { kind: 'static';  name: string; value: string }  // attr="literal"
  | { kind: 'bool';    name: string }                  // disabled, checked, …
  | { kind: 'dynamic'; name: string; idx: number };    // attr=${val}

type Op =
  | { t: 'text';  v: string }
  | { t: 'open';  tag: string; attrs: AttrOp[]; selfClose: boolean }
  | { t: 'close'; tag: string }
  | { t: 'val';   idx: number };

// ─── Void elements ───────────────────────────────────────────────────────────

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

// ─── Parse-result cache ──────────────────────────────────────────────────────

const cache = new WeakMap<TemplateStringsArray, Op[]>();

// ─── Parser ──────────────────────────────────────────────────────────────────

function parseStrings(strings: TemplateStringsArray): Op[] {
  const ops: Op[] = [];

  type State =
    | 'text'
    | 'open_tag'
    | 'attrs'
    | 'attr_eq'
    | 'attr_val_sq'
    | 'attr_val_dq'
    | 'close_tag';

  let state: State = 'text';
  let buf = '';
  let currentTag = '';
  let pendingAttr = '';
  let attrs: AttrOp[] = [];

  function flushText(): void {
    // Keep text as-is if it contains any non-whitespace; skip pure-whitespace indentation
    if (buf.trim()) ops.push({ t: 'text', v: buf });
    buf = '';
  }

  function finalizeOpenTag(selfClose: boolean): void {
    if (pendingAttr) {
      attrs.push({ kind: 'bool', name: pendingAttr });
      pendingAttr = '';
    } else if (buf.trim()) {
      attrs.push({ kind: 'bool', name: buf.trim() });
      buf = '';
    }
    const sc = selfClose || VOID.has(currentTag);
    ops.push({ t: 'open', tag: currentTag, attrs: [...attrs], selfClose: sc });
    attrs = [];
    buf = '';
    state = 'text';
  }

  for (let ci = 0; ci < strings.length; ci++) {
    const chunk = strings[ci]!;

    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i]!;

      switch (state) {
        case 'text': {
          if (ch === '<') {
            flushText();
            // peek: is next char '/'?
            if (chunk[i + 1 as number] === '/') {
              state = 'close_tag';
              i++; // skip /
            } else {
              state = 'open_tag';
              buf = '';
            }
          } else {
            buf += ch;
          }
          break;
        }

        case 'open_tag': {
          if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') {
            if (buf.trim()) {
              currentTag = buf.trim().toLowerCase();
              attrs = [];
              buf = '';
              state = 'attrs';
            }
          } else if (ch === '>') {
            currentTag = buf.trim().toLowerCase();
            attrs = [];
            buf = '';
            finalizeOpenTag(false);
          } else if (ch === '/' && chunk[i + 1 as number] === '>') {
            currentTag = buf.trim().toLowerCase();
            attrs = [];
            buf = '';
            i++; // skip >
            finalizeOpenTag(true);
          } else {
            buf += ch;
          }
          break;
        }

        case 'close_tag': {
          if (ch === '>') {
            ops.push({ t: 'close', tag: buf.trim().toLowerCase() });
            buf = '';
            state = 'text';
          } else {
            buf += ch;
          }
          break;
        }

        case 'attrs': {
          if (ch === '>') {
            finalizeOpenTag(false);
          } else if (ch === '/' && chunk[i + 1 as number] === '>') {
            i++;
            finalizeOpenTag(true);
          } else if (ch === '=') {
            pendingAttr = buf.trim();
            buf = '';
            state = 'attr_eq';
          } else if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') {
            if (buf.trim()) {
              attrs.push({ kind: 'bool', name: buf.trim() });
              buf = '';
            }
          } else {
            buf += ch;
          }
          break;
        }

        case 'attr_eq': {
          if (ch === '"') {
            buf = '';
            state = 'attr_val_dq';
          } else if (ch === "'") {
            buf = '';
            state = 'attr_val_sq';
          }
          // dynamic value follows in the values array — handled after chunk loop
          break;
        }

        case 'attr_val_dq': {
          if (ch === '"') {
            attrs.push({ kind: 'static', name: pendingAttr, value: buf });
            pendingAttr = '';
            buf = '';
            state = 'attrs';
          } else {
            buf += ch;
          }
          break;
        }

        case 'attr_val_sq': {
          if (ch === "'") {
            attrs.push({ kind: 'static', name: pendingAttr, value: buf });
            pendingAttr = '';
            buf = '';
            state = 'attrs';
          } else {
            buf += ch;
          }
          break;
        }
      }
    }

    // Place the dynamic value that follows strings[ci]
    if (ci < strings.length - 1) {
      if (state === 'text') {
        flushText();
        ops.push({ t: 'val', idx: ci });
      } else if (state === 'attr_eq') {
        // attr=${val}
        attrs.push({ kind: 'dynamic', name: pendingAttr, idx: ci });
        pendingAttr = '';
        buf = '';
        state = 'attrs';
      }
      // In other states (e.g. inside quoted value) dynamics are uncommon;
      // they land in 'text' after the tag closes naturally.
    }
  }

  if (state === 'text') flushText();

  return ops;
}

// ─── Builder ─────────────────────────────────────────────────────────────────

interface Frame {
  tag: string;
  props: Record<string, unknown>;
  children: Child[];
}

function build(ops: Op[], values: unknown[]): Element | DocumentFragment {
  const stack: Frame[] = [];
  let current: Frame = { tag: '', props: {}, children: [] };

  for (const op of ops) {
    switch (op.t) {
      case 'text': {
        current.children.push(op.v);
        break;
      }

      case 'val': {
        const v = values[op.idx];
        if (v === null || v === undefined || v === false) break;
        if (Array.isArray(v)) {
          current.children.push(...(v as Child[]));
        } else {
          current.children.push(v as Child);
        }
        break;
      }

      case 'open': {
        const props: Record<string, unknown> = {};
        for (const a of op.attrs) {
          if (a.kind === 'static')       props[a.name] = a.value;
          else if (a.kind === 'bool')    props[a.name] = true;
          else /* dynamic */             props[a.name] = values[a.idx];
        }

        if (op.selfClose) {
          current.children.push(h(op.tag, props) as Element);
        } else {
          stack.push(current);
          current = { tag: op.tag, props, children: [] };
        }
        break;
      }

      case 'close': {
        const frame = current;
        current = stack.pop()!;
        current.children.push(h(frame.tag, frame.props, ...frame.children) as Element);
        break;
      }
    }
  }

  const kids = current.children;
  if (kids.length === 1 && kids[0] instanceof Element) return kids[0];
  return h(Fragment as unknown as (...args: unknown[]) => DocumentFragment, null, ...kids) as DocumentFragment;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * html tagged template — JSX-like syntax without a build step.
 *
 * Parses once per call site (WeakMap cache on the stable strings array),
 * then builds DOM via h() on every render. Works in plain <script> tags.
 *
 * @example
 * return () => html`
 *   <section>
 *     <p class="count">${count()}</p>
 *     <button onclick=${increment}>+</button>
 *   </section>
 * `;
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Element | DocumentFragment {
  let ops = cache.get(strings);
  if (!ops) {
    ops = parseStrings(strings);
    cache.set(strings, ops);
  }
  return build(ops, values);
}
