/**
 * Money value object. Integer minor units only — never floats in money math.
 * Operations across currencies are a programming error and throw.
 */
export class Money {
  private constructor(
    public readonly amountMinor: number,
    public readonly currency: string,
  ) {
    if (!Number.isInteger(amountMinor)) {
      throw new Error(`Money.amountMinor must be an integer, got ${amountMinor}`);
    }
  }

  static of(amountMinor: number, currency: string): Money {
    return new Money(amountMinor, currency.toUpperCase());
  }

  static zero(currency: string): Money {
    return new Money(0, currency.toUpperCase());
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor + other.amountMinor, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor - other.amountMinor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amountMinor === other.amountMinor && this.currency === other.currency;
  }

  isNegative(): boolean {
    return this.amountMinor < 0;
  }
}
