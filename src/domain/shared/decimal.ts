const SCALE = 6;
const FACTOR = 10n ** BigInt(SCALE);

/**
 * Decimal de ponto fixo com seis casas.
 * Evita que médias de indicadores dependam de erro binário de ponto flutuante.
 */
export class Decimal {
  private constructor(readonly scaled: bigint) {}

  static fromInt(value: number): Decimal {
    if (!Number.isInteger(value)) {
      throw new Error("Decimal.fromInt aceita apenas inteiros.");
    }
    return new Decimal(BigInt(value) * FACTOR);
  }

  static fromString(value: string): Decimal {
    const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
    if (!match) {
      throw new Error(`Decimal inválido: ${value}`);
    }
    const fraction = match[3] ?? "";
    if (fraction.length > SCALE) {
      throw new Error(`Precisão acima de ${SCALE} casas não é aceita: ${value}`);
    }
    const sign = match[1] === "-" ? -1n : 1n;
    const whole = BigInt(match[2] ?? "0");
    const frac = BigInt(fraction.padEnd(SCALE, "0") || "0");
    return new Decimal(sign * (whole * FACTOR + frac));
  }

  add(other: Decimal): Decimal {
    return new Decimal(this.scaled + other.scaled);
  }

  compare(other: Decimal): number {
    if (this.scaled < other.scaled) return -1;
    if (this.scaled > other.scaled) return 1;
    return 0;
  }

  gt(other: Decimal): boolean {
    return this.compare(other) > 0;
  }

  gte(other: Decimal): boolean {
    return this.compare(other) >= 0;
  }

  lt(other: Decimal): boolean {
    return this.compare(other) < 0;
  }

  lte(other: Decimal): boolean {
    return this.compare(other) <= 0;
  }

  eq(other: Decimal): boolean {
    return this.compare(other) === 0;
  }

  round(places: number): Decimal {
    if (!Number.isInteger(places) || places < 0 || places > SCALE) {
      throw new Error("Casas decimais fora do intervalo suportado.");
    }
    const unit = 10n ** BigInt(SCALE - places);
    const negative = this.scaled < 0n;
    const absolute = negative ? -this.scaled : this.scaled;
    const quotient = absolute / unit;
    const remainder = absolute % unit;
    const increment = remainder * 2n >= unit ? 1n : 0n;
    const rounded = (quotient + increment) * unit;
    return new Decimal(negative ? -rounded : rounded);
  }

  toFixed(places: number): string {
    const rounded = this.round(places);
    const negative = rounded.scaled < 0n;
    const absolute = negative ? -rounded.scaled : rounded.scaled;
    const whole = absolute / FACTOR;
    const fraction = (absolute % FACTOR).toString().padStart(SCALE, "0").slice(0, places);
    const sign = negative ? "-" : "";
    return places === 0 ? `${sign}${whole}` : `${sign}${whole}.${fraction}`;
  }

  formatPtBr(places = 2): string {
    return this.toFixed(places).replace(".", ",");
  }

  static fromScaled(scaled: bigint): Decimal {
    return new Decimal(scaled);
  }
}

export function sumDecimals(values: readonly Decimal[]): Decimal {
  return values.reduce((total, value) => total.add(value), Decimal.fromInt(0));
}

/** Divisão com arredondamento half away from zero na escala interna. */
export function divideDecimal(numerator: Decimal, divisor: number): Decimal {
  if (!Number.isInteger(divisor) || divisor <= 0) {
    throw new Error("O divisor precisa ser um inteiro positivo.");
  }
  const divider = BigInt(divisor);
  const negative = numerator.scaled < 0n;
  const absolute = negative ? -numerator.scaled : numerator.scaled;
  const quotient = absolute / divider;
  const remainder = absolute % divider;
  const increment = remainder * 2n >= divider ? 1n : 0n;
  const rounded = quotient + increment;
  return Decimal.fromScaled(negative ? -rounded : rounded);
}

export function meanDecimals(values: readonly Decimal[]): Decimal | null {
  if (values.length === 0) return null;
  return divideDecimal(sumDecimals(values), values.length);
}
