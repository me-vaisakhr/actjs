import type { SetupContext } from './types.js';

/** The currently-active component setup context. null = not inside setup(). */
let currentSetup: SetupContext | null = null;

export function getCurrentSetup(): SetupContext | null {
  return currentSetup;
}

export function setCurrentSetup(ctx: SetupContext | null): void {
  currentSetup = ctx;
}

export function createSetupContext(): SetupContext {
  return {
    onInitFns: [],
    onMountFns: [],
    onDestroyFns: [],
    headConfig: null,
  };
}
