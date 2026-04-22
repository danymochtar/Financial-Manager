import { Prisma } from "@prisma/client";

export const SUPPORTED_CURRENCIES = ["IDR", "MYR", "USD", "SGD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const FORMATTERS: Record<string, Intl.NumberFormat> = {};

/**
 * Convention:
 * - IDR: no decimals. "Rp 1.234.567". id-ID locale.
 * - MYR / USD / SGD: always 2 decimals. "RM 1,234.56" / "$1,234.56" / "S$1,234.56".
 */
function getFormatter(currency: string, locale: string) {
  const isIDR = currency === "IDR";
  const key = `${locale}:${currency}`;
  if (!FORMATTERS[key]) {
    FORMATTERS[key] = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: isIDR ? 0 : 2,
      minimumFractionDigits: isIDR ? 0 : 2,
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

/**
 * Kompak, tetap mengikuti aturan sen:
 *   IDR  → tanpa desimal, suffix rb/jt/M (Rp 12rb, Rp 1,5jt, Rp 2,3M)
 *   MYR  → RM {thousands}.xx untuk <1jt, RM {x}.xxK / .xxM untuk besar
 *   USD  → $ {thousands}.xx (sama seperti MYR)
 *   SGD  → S$ {thousands}.xx
 *
 * Rule: IDR NEVER has cents. Non-IDR ALWAYS has exactly 2 decimals on the
 * final value (even when abbreviated to K/M).
 */
export function formatShort(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  const symbol =
    currency === "IDR" ? "Rp " : currency === "MYR" ? "RM " : currency === "SGD" ? "S$ " : currency === "USD" ? "$ " : `${currency} `;

  if (currency === "IDR") {
    if (abs >= 1_000_000_000) return `${sign}${symbol}${formatFraction(abs / 1_000_000_000, 1, "id-ID")}M`;
    if (abs >= 1_000_000) return `${sign}${symbol}${formatFraction(abs / 1_000_000, 1, "id-ID")}jt`;
    if (abs >= 1_000) return `${sign}${symbol}${Math.round(abs / 1_000)}rb`;
    return `${sign}${symbol}${formatThousands(Math.round(abs), "id-ID", 0)}`;
  }
  // Non-IDR: always 2 decimals on final value.
  if (abs >= 1_000_000) return `${sign}${symbol}${formatFraction(abs / 1_000_000, 2, "en-US")}M`;
  if (abs >= 1_000) return `${sign}${symbol}${formatThousands(abs, "en-US", 2)}`;
  return `${sign}${symbol}${abs.toFixed(2)}`;
}

function formatFraction(n: number, digits: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

function formatThousands(n: number, locale: string, decimals: number): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);
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
