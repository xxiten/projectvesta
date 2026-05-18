import { describe, it, expect } from 'vitest';
import { Money } from './money';

describe('Money', () => {
  it('adds amounts of the same currency', () => {
    expect(Money.of(1000, 'eur').add(Money.of(250, 'EUR')).amountMinor).toBe(1250);
  });

  it('rejects cross-currency arithmetic', () => {
    expect(() => Money.of(100, 'EUR').add(Money.of(100, 'USD'))).toThrow(/Currency mismatch/);
  });

  it('rejects non-integer minor units', () => {
    expect(() => Money.of(10.5, 'EUR')).toThrow(/integer/);
  });
});
