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

/** Kompak: Rp 1,2jt / RM 1,2k / Rp 12rb */
export function formatShort(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  const symbol = currency === "IDR" ? "Rp" : currency === "MYR" ? "RM" : currency;
  if (currency === "IDR") {
    if (abs >= 1_000_000_000) return `${sign}${symbol} ${(abs / 1_000_000_000).toFixed(1)}M`;
    if (abs >= 1_000_000) return `${sign}${symbol} ${(abs / 1_000_000).toFixed(1)}jt`;
    if (abs >= 1_000) return `${sign}${symbol} ${(abs / 1_000).toFixed(0)}rb`;
    return `${sign}${symbol} ${abs.toFixed(0)}`;
  }
  if (abs >= 1_000_000) return `${sign}${symbol} ${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${symbol} ${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${symbol} ${abs.toFixed(2)}`;
}

export function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

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
