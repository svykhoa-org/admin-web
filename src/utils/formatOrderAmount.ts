export const formatOrderAmount = (
  amountMinor: string | null | undefined,
  legacyAmount: number,
): string => {
  if (amountMinor && /^\d+$/.test(amountMinor)) {
    return BigInt(amountMinor).toLocaleString('vi-VN')
  }
  return legacyAmount.toLocaleString('vi-VN')
}
