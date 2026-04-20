import { Prisma } from "@prisma/client";

export const SUPPORTED_CURRENCIES = ["IDR", "MYR", "USD", "SGD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const FORMATTERS: Record<string, Intl.NumberFormat> = {};

function getFormatter(currency: string, locale: string) {
  const key = `${locale}:${currency}`;
  if (!FORMATTERS[key]) {
    FORMATTERS[key] = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    });
  }
  return FORMATTERS[key];
}

export function formatMoney(
  amount: number | string | Prisma.Decimal,
  currency: string,
  locale = currency === "IDR" ? "id-ID" : currency === "MYR" ? "ms-MY" : "en-US"
): string {
  const num = typeof amount === "number" ? amount : Number(amount.toString());
  if (!Number.isFinite(num)) return "-";
  return getFormatter(currency, locale).format(num);
}

export function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

/**
 * Sum a list of transactions using the appropriate pre-computed column
 * (amountIDR or amountMYR) for the target base currency.
 */
export function sumInBase(
  txs: Array<{ amountIDR: Prisma.Decimal; amountMYR: Prisma.Decimal; type: string }>,
  currency: "IDR" | "MYR",
  type?: "income" | "expense"
): number {
  const field = currency === "IDR" ? "amountIDR" : "amountMYR";
  return txs
    .filter((t) => (type ? t.type === type : true))
    .reduce((acc, t) => acc + toNumber(t[field]), 0);
}
