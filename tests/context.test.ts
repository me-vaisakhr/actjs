import { describe, it, expect, afterEach } from 'vitest';
import { getCurrentSetup, setCurrentSetup, createSetupContext } from '../src/context.js';

afterEach(() => {
  setCurrentSetup(null);
});

describe('context', () => {
  it('returns null by default', () => {
    expect(getCurrentSetup()).toBeNull();
  });

  it('setCurrentSetup stores the context', () => {
    const ctx = createSetupContext();
    setCurrentSetup(ctx);
    expect(getCurrentSetup()).toBe(ctx);
  });

  it('setCurrentSetup(null) clears the context', () => {
    setCurrentSetup(createSetupContext());
    setCurrentSetup(null);
    expect(getCurrentSetup()).toBeNull();
  });

  it('createSetupContext returns empty arrays and null headConfig', () => {
    const ctx = createSetupContext();
    expect(ctx.onInitFns).toEqual([]);
    expect(ctx.onMountFns).toEqual([]);
    expect(ctx.onDestroyFns).toEqual([]);
    expect(ctx.headConfig).toBeNull();
  });
});
