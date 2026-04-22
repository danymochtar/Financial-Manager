import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Normalize a date to midnight UTC. Frankfurter / FX providers give daily rates,
 * so caching by calendar day is sufficient.
 */
function startOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function toISODate(date: Date): string {
  return startOfDayUTC(date).toISOString().slice(0, 10);
}

type FrankfurterResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

async function fetchFrankfurter(date: Date, from: string, to: string): Promise<number> {
  const iso = toISODate(date);
  const url = `https://api.frankfurter.app/${iso}?from=${from}&to=${to}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Frankfurter HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const data = (await res.json()) as FrankfurterResponse;
  const rate = data.rates?.[to];
  if (typeof rate !== "number") {
    throw new Error(`Frankfurter did not return rate for ${to}: ${JSON.stringify(data)}`);
  }
  return rate;
}

async function fetchExchangerateHost(date: Date, from: string, to: string): Promise<number> {
  const iso = toISODate(date);
  const url = `https://api.exchangerate.host/${iso}?base=${from}&symbols=${to}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`exchangerate.host HTTP ${res.status}`);
  const data = (await res.json()) as { rates?: Record<string, number> };
  const rate = data.rates?.[to];
  if (typeof rate !== "number") throw new Error("exchangerate.host: rate missing");
  return rate;
}

/**
 * Get FX rate for `from -> to` on `date`, caching in the FxRate table.
 * Fallback: if the provider fails, try yesterday then two days ago.
 */
export async function getRate(date: Date, from: string, to: string): Promise<number> {
  if (from === to) return 1;
  const day = startOfDayUTC(date);

  const cached = await prisma.fxRate.findUnique({
    where: {
      date_fromCurrency_toCurrency: { date: day, fromCurrency: from, toCurrency: to },
    },
  });
  if (cached) return Number(cached.rate.toString());

  let rate: number | null = null;
  const attempts = [0, 1, 2, 3];
  for (const back of attempts) {
    const tryDate = new Date(day);
    tryDate.setUTCDate(tryDate.getUTCDate() - back);
    try {
      rate = await fetchFrankfurter(tryDate, from, to);
      break;
    } catch {
      try {
        rate = await fetchExchangerateHost(tryDate, from, to);
        break;
      } catch {
        continue;
      }
    }
  }

  if (rate == null) {
    // last-resort fallback: derive via USD cross rate
    try {
      const fromUsd = from === "USD" ? 1 : await fetchFrankfurter(day, from, "USD");
      const toUsd = to === "USD" ? 1 : await fetchFrankfurter(day, "USD", to);
      rate = fromUsd * toUsd;
    } catch {
      throw new Error(`Unable to fetch FX rate ${from}->${to} for ${toISODate(date)}`);
    }
  }

  await prisma.fxRate.upsert({
    where: {
      date_fromCurrency_toCurrency: { date: day, fromCurrency: from, toCurrency: to },
    },
    create: { date: day, fromCurrency: from, toCurrency: to, rate: new Prisma.Decimal(rate) },
    update: { rate: new Prisma.Decimal(rate), fetchedAt: new Date() },
  });

  return rate;
}

/**
 * For a given amount in `currency` on `date`, compute the equivalent
 * amount in IDR and MYR. Used whenever we create a transaction so that
 * dashboard summaries don't need to convert on the fly.
 */
export async function computeDualBase(
  amount: number,
  currency: string,
  date: Date
): Promise<{ amountIDR: number; amountMYR: number }> {
  const [idrRate, myrRate] = await Promise.all([
    getRate(date, currency, "IDR"),
    getRate(date, currency, "MYR"),
  ]);
  return {
    amountIDR: Math.round(amount * idrRate * 100) / 100,
    amountMYR: Math.round(amount * myrRate * 10000) / 10000,
  };
}

export type FxMatrix = {
  date: string;
  rates: Record<string, Record<string, number>>; // rates[from][to]
};

const SUPPORTED_MATRIX = ["IDR", "MYR", "USD", "SGD"] as const;

/**
 * Full FX matrix for all supported currency pairs, for a given day.
 * Dashboard uses this to convert any balance to any single display
 * currency with a consistent daily rate. Cached via getRate() so only
 * the first call of the day hits the external provider.
 */
export async function getFxMatrix(date: Date = new Date()): Promise<FxMatrix> {
  const day = startOfDayUTC(date);
  const rates: Record<string, Record<string, number>> = {};
  for (const from of SUPPORTED_MATRIX) {
    rates[from] = {};
    for (const to of SUPPORTED_MATRIX) {
      if (from === to) {
        rates[from][to] = 1;
      } else {
        rates[from][to] = await getRate(day, from, to);
      }
    }
  }
  return { date: toISODate(day), rates };
}

export function convertWithMatrix(
  amount: number,
  from: string,
  to: string,
  matrix: FxMatrix
): number {
  if (from === to) return amount;
  const rate = matrix.rates[from]?.[to];
  if (rate == null) return amount;
  return amount * rate;
}
