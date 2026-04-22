import { toNumber } from "@/lib/currency";

type Job = {
  startDate: Date;
  endDate: Date | null;
  monthlySalary: import("@prisma/client").Prisma.Decimal;
  currency: string;
};

/**
 * Given a career history, compute total lifetime earnings separately by currency
 * (we don't auto-FX here — caller can convert via computeDualBase if needed).
 * Also returns start of career (earliest start) and years worked.
 */
export function computeCareerTotals(jobs: Job[]): {
  lifetimeEarningsByCurrency: Record<string, number>;
  firstJobStart: Date | null;
  firstJobSalary: { amount: number; currency: string } | null;
  currentSalary: { amount: number; currency: string } | null;
  totalMonthsWorked: number;
  yearsWorked: number;
} {
  if (jobs.length === 0) {
    return {
      lifetimeEarningsByCurrency: {},
      firstJobStart: null,
      firstJobSalary: null,
      currentSalary: null,
      totalMonthsWorked: 0,
      yearsWorked: 0,
    };
  }

  const sorted = [...jobs].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const firstJobStart = sorted[0].startDate;
  const firstJobSalary = {
    amount: toNumber(sorted[0].monthlySalary),
    currency: sorted[0].currency,
  };

  // "Current" = latest job by endDate null or latest startDate
  const current = sorted.slice().reverse().find((j) => j.endDate == null) ?? sorted[sorted.length - 1];
  const currentSalary = current
    ? { amount: toNumber(current.monthlySalary), currency: current.currency }
    : null;

  const lifetime: Record<string, number> = {};
  let totalMonths = 0;

  for (const j of sorted) {
    const end = j.endDate ?? new Date();
    const months = Math.max(
      0,
      Math.round((end.getTime() - j.startDate.getTime()) / (30.44 * 24 * 3600 * 1000))
    );
    totalMonths += months;
    const salary = toNumber(j.monthlySalary);
    lifetime[j.currency] = (lifetime[j.currency] ?? 0) + salary * months;
  }

  // Unique months (deduplicate overlap): use earliest start -> latest end span, not sum
  // For display we keep cumulative but also expose span:
  const earliestStart = sorted[0].startDate.getTime();
  const latestEnd = Math.max(
    ...sorted.map((j) => (j.endDate ?? new Date()).getTime())
  );
  const spanMonths = Math.max(0, Math.round((latestEnd - earliestStart) / (30.44 * 24 * 3600 * 1000)));
  const yearsWorked = Math.round((spanMonths / 12) * 10) / 10;

  return {
    lifetimeEarningsByCurrency: lifetime,
    firstJobStart,
    firstJobSalary,
    currentSalary,
    totalMonthsWorked: spanMonths, // use span instead of sum to avoid double-count on overlapping jobs
    yearsWorked,
  };
}
