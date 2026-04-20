import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedUser, unauthorized } from "@/lib/api";
import { sumInBase, toNumber } from "@/lib/currency";

export async function GET(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const now = new Date();

  const from = fromParam
    ? new Date(fromParam)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = toParam
    ? new Date(toParam)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

  const [txs, categories, sources] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: from, lte: to } },
      include: { category: true, source: true },
    }),
    prisma.category.findMany({ where: { userId: user.id } }),
    prisma.source.findMany({ where: { userId: user.id } }),
  ]);

  const totals = {
    incomeIDR: sumInBase(txs, "IDR", "income"),
    expenseIDR: sumInBase(txs, "IDR", "expense"),
    incomeMYR: sumInBase(txs, "MYR", "income"),
    expenseMYR: sumInBase(txs, "MYR", "expense"),
  };

  // per category (expense breakdown)
  const byCategory: Record<string, { categoryId: string; name: string; color: string; IDR: number; MYR: number }> = {};
  for (const t of txs) {
    if (t.type !== "expense") continue;
    const key = t.categoryId;
    if (!byCategory[key]) {
      byCategory[key] = {
        categoryId: t.categoryId,
        name: t.category?.name ?? "-",
        color: t.category?.color ?? "#64748b",
        IDR: 0,
        MYR: 0,
      };
    }
    byCategory[key].IDR += toNumber(t.amountIDR);
    byCategory[key].MYR += toNumber(t.amountMYR);
  }

  // per source
  const bySource: Record<string, { sourceId: string; name: string; color: string; incomeIDR: number; expenseIDR: number; incomeMYR: number; expenseMYR: number }> = {};
  for (const t of txs) {
    const key = t.sourceId;
    if (!bySource[key]) {
      bySource[key] = {
        sourceId: t.sourceId,
        name: t.source?.name ?? "-",
        color: t.source?.color ?? "#3b82f6",
        incomeIDR: 0,
        expenseIDR: 0,
        incomeMYR: 0,
        expenseMYR: 0,
      };
    }
    const entry = bySource[key];
    if (t.type === "income") {
      entry.incomeIDR += toNumber(t.amountIDR);
      entry.incomeMYR += toNumber(t.amountMYR);
    } else {
      entry.expenseIDR += toNumber(t.amountIDR);
      entry.expenseMYR += toNumber(t.amountMYR);
    }
  }

  // monthly series — last 6 months window ending at `to`
  const series: Array<{ month: string; incomeIDR: number; expenseIDR: number; incomeMYR: number; expenseMYR: number }> = [];
  const windowStart = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 5, 1));
  const monthlyTxs = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: windowStart, lte: to } },
  });
  for (let i = 0; i < 6; i++) {
    const start = new Date(Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth() + i, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59));
    const bucket = monthlyTxs.filter((t) => t.date >= start && t.date <= end);
    series.push({
      month: start.toISOString().slice(0, 7),
      incomeIDR: sumInBase(bucket, "IDR", "income"),
      expenseIDR: sumInBase(bucket, "IDR", "expense"),
      incomeMYR: sumInBase(bucket, "MYR", "income"),
      expenseMYR: sumInBase(bucket, "MYR", "expense"),
    });
  }

  return NextResponse.json({
    range: { from: from.toISOString(), to: to.toISOString() },
    totals,
    byCategory: Object.values(byCategory).sort((a, b) => b.IDR - a.IDR),
    bySource: Object.values(bySource),
    series,
    meta: {
      categoryCount: categories.length,
      sourceCount: sources.length,
      transactionCount: txs.length,
    },
  });
}
