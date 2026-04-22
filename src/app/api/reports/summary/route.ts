import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedUser, unauthorized } from "@/lib/api";
import { sumInBase, toNumber } from "@/lib/currency";
import { periodRange, startOfMonth, endOfMonth } from "@/lib/period";
import { computeHematStreak } from "@/lib/streak";
import { convertWithMatrix, getFxMatrix } from "@/lib/fx";

export async function GET(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const now = new Date();

  const from = fromParam ? new Date(fromParam) : startOfMonth(now);
  const to = toParam ? new Date(toParam) : endOfMonth(now);

  const [
    txs,
    accounts,
    debts,
    dependents,
    fixedIncomes,
    fixedExpenses,
    investments,
    physicalAssets,
    budgets,
    streak,
    fxMatrix,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: from, lte: to } },
      include: { category: true, account: true },
    }),
    prisma.account.findMany({ where: { userId: user.id, isActive: true } }),
    prisma.debt.findMany({ where: { userId: user.id, isActive: true } }),
    prisma.dependent.findMany({ where: { userId: user.id } }),
    prisma.fixedIncome.findMany({ where: { userId: user.id, isActive: true } }),
    prisma.fixedExpense.findMany({ where: { userId: user.id, isActive: true } }),
    prisma.investment.findMany({ where: { userId: user.id } }),
    prisma.asset.findMany({ where: { userId: user.id, isActive: true } }),
    prisma.budget.findMany({ where: { userId: user.id }, include: { category: true } }),
    computeHematStreak(user.id),
    getFxMatrix().catch(() => ({
      date: new Date().toISOString().slice(0, 10),
      rates: { IDR: { IDR: 1 }, MYR: { MYR: 1 }, USD: { USD: 1 }, SGD: { SGD: 1 } } as Record<string, Record<string, number>>,
    })),
  ]);

  const totals = {
    incomeIDR: sumInBase(txs, "IDR", "income"),
    expenseIDR: sumInBase(txs, "IDR", "expense"),
    incomeMYR: sumInBase(txs, "MYR", "income"),
    expenseMYR: sumInBase(txs, "MYR", "expense"),
  };

  // Net worth — converted to ALL 4 currencies using today's FX matrix.
  // We bucket each line item by native currency then sum-convert on demand.
  const VIEW_CURRENCIES = ["IDR", "MYR", "USD", "SGD"] as const;
  type CurrencyView = (typeof VIEW_CURRENCIES)[number];
  const makeView = () =>
    ({
      IDR: 0,
      MYR: 0,
      USD: 0,
      SGD: 0,
    } as Record<CurrencyView, number>);
  const assetView = makeView();
  const debtView = makeView();
  const investmentView = makeView();
  const physicalView = makeView();

  const addToView = (view: Record<CurrencyView, number>, amount: number, from: string) => {
    for (const to of VIEW_CURRENCIES) {
      view[to] += convertWithMatrix(amount, from, to, fxMatrix);
    }
  };

  for (const a of accounts) {
    const bal = toNumber(a.balance);
    if (a.type === "credit_card") addToView(debtView, bal, a.currency);
    else addToView(assetView, bal, a.currency);
  }
  for (const d of debts) {
    addToView(debtView, toNumber(d.remainingAmount), d.currency);
  }
  for (const i of investments) {
    addToView(investmentView, toNumber(i.currentValue), i.currency);
  }
  for (const p of physicalAssets) {
    addToView(physicalView, toNumber(p.currentValue), p.currency);
  }

  const netWorthView = makeView();
  for (const c of VIEW_CURRENCIES) {
    netWorthView[c] = assetView[c] + investmentView[c] + physicalView[c] - debtView[c];
  }

  // Legacy IDR/MYR-only fields — keep for backward compat with existing UI
  const assetIDR = assetView.IDR;
  const assetMYR = assetView.MYR;
  const debtIDR = debtView.IDR;
  const debtMYR = debtView.MYR;

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

  // Boros expand to all 4 currencies via matrix conversion on IDR-base.
  const sumBorosAllCurrencies = (bucket: typeof dayTxs) => {
    const v = makeView();
    for (const t of bucket) {
      // We convert from IDR-base snapshot using today's matrix — consistent
      // with how "today" views are presented.
      addToView(v, toNumber(t.amountIDR), "IDR");
    }
    return v;
  };
  const boros = {
    today: sumBorosAllCurrencies(dayTxs),
    week: sumBorosAllCurrencies(weekTxs),
    month: sumBorosAllCurrencies(monthTxs),
  };

  // Fixed load (expense + dependents + debts) and fixed income — per-currency
  const fixedLoadView = makeView();
  const fixedIncomeView = makeView();
  for (const f of fixedExpenses) addToView(fixedLoadView, toNumber(f.amount), f.currency);
  for (const d of dependents) addToView(fixedLoadView, toNumber(d.monthlyAmount), d.currency);
  for (const d of debts) addToView(fixedLoadView, toNumber(d.monthlyPayment), d.currency);
  for (const f of fixedIncomes) addToView(fixedIncomeView, toNumber(f.amount), f.currency);

  // Period totals expanded to 4 currencies too
  const periodView = {
    income: sumBorosAllCurrencies(txs.filter((t) => t.type === "income")),
    expense: sumBorosAllCurrencies(txs.filter((t) => t.type === "expense")),
  };

  return NextResponse.json({
    range: { from: from.toISOString(), to: to.toISOString() },
    totals,
    periodView,
    byCategory: Object.values(byCategory).sort((a, b) => b.IDR - a.IDR),
    series,
    boros,
    budgets,
    // Legacy 2-currency fields (kept for older screens)
    netWorth: { assetIDR, assetMYR, debtIDR, debtMYR },
    fixedLoad: {
      incomeIDR: fixedIncomeView.IDR,
      incomeMYR: fixedIncomeView.MYR,
      expenseIDR: fixedLoadView.IDR,
      expenseMYR: fixedLoadView.MYR,
    },
    // New multi-currency view
    wealth: {
      asset: assetView,
      debt: debtView,
      investment: investmentView,
      physical: physicalView,
      netWorth: netWorthView,
      fixedIncome: fixedIncomeView,
      fixedLoad: fixedLoadView,
    },
    fx: fxMatrix,
    streak,
    meta: {
      accountCount: accounts.length,
      transactionCount: txs.length,
    },
  });
}
