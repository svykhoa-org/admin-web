export enum Currency {
  VND = 'VND',
  USD = 'USD',
}

export const CurrencyConfig: Record<Currency, { symbol: string; precision: number; step: number }> =
  {
    [Currency.VND]: { symbol: '₫', precision: 0, step: 1000 },
    [Currency.USD]: { symbol: '$', precision: 2, step: 0.01 },
  }
