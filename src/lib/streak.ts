import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/currency";
import { localDateKey, startOfDay, endOfDay } from "@/lib/period";

/**
 * "Hemat streak" — berapa hari berturut-turut user expense variable-nya
 * di bawah (atau sama dengan) daily budget overall.
 * Kalau belum set daily budget, streak di-skip (return 0).
 */
export async function computeHematStreak(userId: string): Promise<{
  currentStreak: number;
  bestStreak: number;
  lastCheckDate: string | null;
}> {
  const budgets = await prisma.budget.findMany({
    where: { userId, scope: "overall", period: "daily" },
  });
  if (budgets.length === 0) {
    return { currentStreak: 0, bestStreak: 0, lastCheckDate: null };
  }
  // Kalau ada beberapa daily budget (misal IDR + MYR), anggap dua-duanya harus OK.
  // Simpler: pake yang currency match sama user.primaryCurrency — tapi biar cepet
  // pake daily budget IDR kalau ada, fallback ke yang pertama.
  const primary = budgets.find((b) => b.currency === "IDR") ?? budgets[0];
  const dailyLimit = toNumber(primary.amount);
  const baseField = primary.currency === "MYR" ? "amountMYR" : "amountIDR";

  // Look back up to 60 days.
  const now = new Date();
  const lookbackStart = new Date(now);
  lookbackStart.setUTCDate(lookbackStart.getUTCDate() - 60);

  const txs = await prisma.transaction.findMany({
    where: {
      userId,
      type: "expense",
      date: { gte: startOfDay(lookbackStart), lte: endOfDay(now) },
      category: { nature: "variable" },
    },
    include: { category: true },
  });

  // Group by local date key.
  const byDay = new Map<string, number>();
  for (const t of txs) {
    const key = localDateKey(t.date);
    const val = Number((t as unknown as Record<string, Prisma.Decimal>)[baseField].toString());
    byDay.set(key, (byDay.get(key) ?? 0) + val);
  }

  // Walk backward from today counting days where spend <= limit.
  let current = 0;
  let best = 0;
  const today = localDateKey(now);
  const cursor = new Date(now);
  let safety = 60;
  while (safety-- > 0) {
    const key = localDateKey(cursor);
    const spent = byDay.get(key) ?? 0;
    const passed = spent <= dailyLimit;
    if (passed) {
      current += 1;
      best = Math.max(best, current);
    } else {
      if (current > 0) best = Math.max(best, current);
      // Break streak only if we've already counted today — otherwise include earlier
      if (key !== today) break;
      current = 0;
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { currentStreak: current, bestStreak: best, lastCheckDate: today };
}
