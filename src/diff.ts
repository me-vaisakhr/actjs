import { elListeners } from './listeners.js';

/**
 * Reconcile DOM children of `parent` against `newContent`.
 * - Element: compare parent.childNodes against [newContent]
 * - DocumentFragment: compare parent.childNodes against newContent.childNodes
 * Only mutates nodes that actually differ — identical subtrees = zero DOM ops.
 */
export function reconcileChildren(
  parent: Element,
  newContent: Element | DocumentFragment | void
): void {
  if (!newContent) return;

  const newNodes: Node[] = newContent instanceof DocumentFragment
    ? Array.from(newContent.childNodes)
    : [newContent];

  const oldNodes = Array.from(parent.childNodes);
  const maxLen = Math.max(oldNodes.length, newNodes.length);

  for (let i = 0; i < maxLen; i++) {
    const oldNode = oldNodes[i];
    const newNode = newNodes[i];

    if (oldNode === undefined && newNode !== undefined) {
      parent.appendChild(newNode); // move directly — preserves event listeners
    } else if (oldNode !== undefined && newNode === undefined) {
      parent.removeChild(oldNode);
    } else if (oldNode !== undefined && newNode !== undefined) {
      patchNode(parent, oldNode, newNode);
    }
  }
}

function patchNode(parent: Node, oldNode: ChildNode, newNode: Node): void {
  // Text nodes
  if (oldNode.nodeType === Node.TEXT_NODE && newNode.nodeType === Node.TEXT_NODE) {
    if (oldNode.textContent !== newNode.textContent) {
      oldNode.textContent = newNode.textContent;
    }
    return;
  }

  // Same element tag — patch attributes and recurse children
  if (
    oldNode.nodeType === Node.ELEMENT_NODE &&
    newNode.nodeType === Node.ELEMENT_NODE &&
    (oldNode as Element).tagName === (newNode as Element).tagName
  ) {
    reconcileAttributes(oldNode as Element, newNode as Element);
    reconcileChildNodes(oldNode as Element, newNode as Element);
    return;
  }

  // Different type or tag — replace with the new node directly (preserves listeners)
  parent.replaceChild(newNode, oldNode);
}

function reconcileAttributes(oldEl: Element, newEl: Element): void {
  // Remove attributes not in new
  for (const attr of Array.from(oldEl.attributes)) {
    if (!newEl.hasAttribute(attr.name)) {
      oldEl.removeAttribute(attr.name);
    }
  }
  // Set new/changed attributes
  for (const attr of Array.from(newEl.attributes)) {
    if (oldEl.getAttribute(attr.name) !== attr.value) {
      oldEl.setAttribute(attr.name, attr.value);
    }
  }
  // Reconcile JS event listeners (set via addEventListener, invisible to .attributes)
  const oldListeners = elListeners.get(oldEl);
  const newListeners = elListeners.get(newEl);
  if (newListeners) {
    const updated = new Map<string, EventListenerOrEventListenerObject>();
    for (const [event, handler] of newListeners) {
      const prev = oldListeners?.get(event);
      if (prev !== handler) {
        if (prev !== undefined) oldEl.removeEventListener(event, prev);
        oldEl.addEventListener(event, handler);
      }
      updated.set(event, handler);
    }
    // Remove listeners that no longer exist
    if (oldListeners) {
      for (const [event, handler] of oldListeners) {
        if (!newListeners.has(event)) oldEl.removeEventListener(event, handler);
      }
    }
    elListeners.set(oldEl, updated);
  } else if (oldListeners) {
    // New element has no listeners — remove all old ones
    for (const [event, handler] of oldListeners) {
      oldEl.removeEventListener(event, handler);
    }
    elListeners.delete(oldEl);
  }
}

function reconcileChildNodes(oldEl: Element, newEl: Element): void {
  const oldChildren = Array.from(oldEl.childNodes);
  const newChildren = Array.from(newEl.childNodes);
  const maxLen = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLen; i++) {
    const oldChild = oldChildren[i];
    const newChild = newChildren[i];

    if (!oldChild && newChild) {
      oldEl.appendChild(newChild); // move directly — preserves event listeners
    } else if (oldChild && !newChild) {
      oldEl.removeChild(oldChild);
    } else if (oldChild && newChild) {
      patchNode(oldEl, oldChild, newChild);
    }
  }
}
