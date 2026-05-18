import { describe, it, expect } from 'vitest';
import { canTransition, computeNights, computeTotalMinor } from './status';

describe('reservation domain', () => {
  it('computes whole nights', () => {
    expect(computeNights('2026-06-12', '2026-06-15')).toBe(3);
  });

  it('rejects same-day / inverted ranges', () => {
    expect(() => computeNights('2026-06-12', '2026-06-12')).toThrow(/at least one night/);
    expect(() => computeNights('2026-06-15', '2026-06-12')).toThrow(/at least one night/);
  });

  it('rejects invalid dates', () => {
    expect(() => computeNights('not-a-date', '2026-06-15')).toThrow(/Invalid/);
  });

  it('totals base * nights', () => {
    expect(computeTotalMinor(14500, 3)).toBe(43500);
  });

  it('guards illegal status transitions', () => {
    expect(canTransition('enquiry', 'confirmed')).toBe(true);
    expect(canTransition('confirmed', 'checked_in')).toBe(true);
    expect(canTransition('checked_out', 'confirmed')).toBe(false);
    expect(canTransition('cancelled', 'confirmed')).toBe(false);
  });

  it('allows the room-rack check-in / check-out path', () => {
    expect(canTransition('confirmed', 'checked_in')).toBe(true);
    expect(canTransition('checked_in', 'checked_out')).toBe(true);
  });

  it('forbids check-in/out from terminal or wrong states', () => {
    expect(canTransition('enquiry', 'checked_in')).toBe(false);
    expect(canTransition('confirmed', 'checked_out')).toBe(false);
    expect(canTransition('checked_out', 'checked_in')).toBe(false);
    expect(canTransition('no_show', 'checked_in')).toBe(false);
  });
});
