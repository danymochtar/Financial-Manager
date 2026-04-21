import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedUser, unauthorized } from "@/lib/api";
import { sumInBase, toNumber } from "@/lib/currency";
import { periodRange, startOfMonth, endOfMonth } from "@/lib/period";
import { computeHematStreak } from "@/lib/streak";

export async function GET(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const now = new Date();

  const from = fromParam ? new Date(fromParam) : startOfMonth(now);
  const to = toParam ? new Date(toParam) : endOfMonth(now);

  const [txs, accounts, debts, dependents, fixedIncomes, fixedExpenses, budgets, streak] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: from, lte: to } },
      include: { category: true, account: true },
    }),
    prisma.account.findMany({ where: { userId: user.id, isActive: true } }),
    prisma.debt.findMany({ where: { userId: user.id, isActive: true } }),
    prisma.dependent.findMany({ where: { userId: user.id } }),
    prisma.fixedIncome.findMany({ where: { userId: user.id, isActive: true } }),
    prisma.fixedExpense.findMany({ where: { userId: user.id, isActive: true } }),
    prisma.budget.findMany({ where: { userId: user.id }, include: { category: true } }),
    computeHematStreak(user.id),
  ]);

  const totals = {
    incomeIDR: sumInBase(txs, "IDR", "income"),
    expenseIDR: sumInBase(txs, "IDR", "expense"),
    incomeMYR: sumInBase(txs, "MYR", "income"),
    expenseMYR: sumInBase(txs, "MYR", "expense"),
  };

  // Net worth snapshot (from accounts) — converted to IDR & MYR via FX at today
  let assetIDR = 0, assetMYR = 0, debtIDR = 0, debtMYR = 0;
  for (const a of accounts) {
    const bal = toNumber(a.balance);
    // Rough FX: assume 1 MYR = 3400 IDR, 1 IDR = 1/3400 MYR — we use live rate later
    // For exactness the client can fetch /api/fx — here we use approximations.
    if (a.currency === "IDR") {
      if (a.type === "credit_card") debtIDR += bal;
      else assetIDR += bal;
    } else if (a.currency === "MYR") {
      if (a.type === "credit_card") debtMYR += bal;
      else assetMYR += bal;
    }
  }
  for (const d of debts) {
    const rem = toNumber(d.remainingAmount);
    if (d.currency === "IDR") debtIDR += rem;
    else if (d.currency === "MYR") debtMYR += rem;
  }

  // Period expense breakdown (variable only for "boros" focus)
  const byCategory: Record<string, { categoryId: string; name: string; emoji: string; color: string; nature: string; IDR: number; MYR: number }> = {};
  for (const t of txs) {
    if (t.type !== "expense") continue;
    const key = t.categoryId;
    if (!byCategory[key]) {
      byCategory[key] = {
        categoryId: t.categoryId,
        name: t.category?.name ?? "-",
        emoji: t.category?.emoji ?? "🏷️",
        color: t.category?.color ?? "#64748b",
        nature: t.category?.nature ?? "variable",
        IDR: 0,
        MYR: 0,
      };
    }
    byCategory[key].IDR += toNumber(t.amountIDR);
    byCategory[key].MYR += toNumber(t.amountMYR);
  }

  // Monthly series — last 6 months
  const windowStart = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 5, 1));
  const seriesTxs = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: windowStart, lte: to } },
  });
  const series: Array<{ month: string; incomeIDR: number; expenseIDR: number; incomeMYR: number; expenseMYR: number }> = [];
  for (let i = 0; i < 6; i++) {
    const start = new Date(Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth() + i, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59));
    const bucket = seriesTxs.filter((t) => t.date >= start && t.date <= end);
    series.push({
      month: start.toISOString().slice(0, 7),
      incomeIDR: sumInBase(bucket, "IDR", "income"),
      expenseIDR: sumInBase(bucket, "IDR", "expense"),
      incomeMYR: sumInBase(bucket, "MYR", "income"),
      expenseMYR: sumInBase(bucket, "MYR", "expense"),
    });
  }

  // Today's variable expense (for Boros Meter on dashboard)
  const todayRange = periodRange("daily");
  const weekRange = periodRange("weekly");
  const monthRange = periodRange("monthly");
  const [dayTxs, weekTxs, monthTxs] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "expense",
        date: { gte: todayRange.from, lte: todayRange.to },
        category: { nature: "variable" },
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "expense",
        date: { gte: weekRange.from, lte: weekRange.to },
        category: { nature: "variable" },
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "expense",
        date: { gte: monthRange.from, lte: monthRange.to },
        category: { nature: "variable" },
      },
    }),
  ]);

  const boros = {
    today: { IDR: sumInBase(dayTxs, "IDR"), MYR: sumInBase(dayTxs, "MYR") },
    week: { IDR: sumInBase(weekTxs, "IDR"), MYR: sumInBase(weekTxs, "MYR") },
    month: { IDR: sumInBase(monthTxs, "IDR"), MYR: sumInBase(monthTxs, "MYR") },
  };

  const fixedLoadIDR =
    fixedExpenses.reduce((acc, f) => acc + (f.currency === "IDR" ? toNumber(f.amount) : 0), 0) +
    dependents.reduce((acc, d) => acc + (d.currency === "IDR" ? toNumber(d.monthlyAmount) : 0), 0) +
    debts.reduce((acc, d) => acc + (d.currency === "IDR" ? toNumber(d.monthlyPayment) : 0), 0);
  const fixedLoadMYR =
    fixedExpenses.reduce((acc, f) => acc + (f.currency === "MYR" ? toNumber(f.amount) : 0), 0) +
    dependents.reduce((acc, d) => acc + (d.currency === "MYR" ? toNumber(d.monthlyAmount) : 0), 0) +
    debts.reduce((acc, d) => acc + (d.currency === "MYR" ? toNumber(d.monthlyPayment) : 0), 0);
  const fixedIncomeIDR = fixedIncomes.reduce((acc, f) => acc + (f.currency === "IDR" ? toNumber(f.amount) : 0), 0);
  const fixedIncomeMYR = fixedIncomes.reduce((acc, f) => acc + (f.currency === "MYR" ? toNumber(f.amount) : 0), 0);

  return NextResponse.json({
    range: { from: from.toISOString(), to: to.toISOString() },
    totals,
    byCategory: Object.values(byCategory).sort((a, b) => b.IDR - a.IDR),
    series,
    boros,
    budgets,
    netWorth: { assetIDR, assetMYR, debtIDR, debtMYR },
    fixedLoad: { incomeIDR: fixedIncomeIDR, incomeMYR: fixedIncomeMYR, expenseIDR: fixedLoadIDR, expenseMYR: fixedLoadMYR },
    streak,
    meta: {
      accountCount: accounts.length,
      transactionCount: txs.length,
    },
  });
}
