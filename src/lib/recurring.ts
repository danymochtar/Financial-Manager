import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeDualBase } from "@/lib/fx";

export function computeNextDue(
  current: Date,
  cadence: string,
  dayOfMonth?: number | null,
  weekday?: number | null
): Date {
  const next = new Date(current);
  if (cadence === "weekly") {
    next.setUTCDate(next.getUTCDate() + 7);
    if (weekday != null) {
      // align to target weekday (0 = Sunday)
      const diff = (weekday - next.getUTCDay() + 7) % 7;
      next.setUTCDate(next.getUTCDate() + diff);
    }
    return next;
  }
  // monthly (default)
  const target = dayOfMonth ?? current.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const lastDayOfMonth = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)
  ).getUTCDate();
  next.setUTCDate(Math.min(target, lastDayOfMonth));
  return next;
}

/**
 * Materialize any recurring transactions whose nextDueDate has passed.
 * Idempotent: on each run we advance nextDueDate to the next period,
 * so re-invocation cannot double-post.
 */
export async function runDueRecurrings(userId: string): Promise<number> {
  const now = new Date();
  const due = await prisma.recurring.findMany({
    where: { userId, isActive: true, nextDueDate: { lte: now } },
  });

  let created = 0;
  for (const r of due) {
    let dueDate = new Date(r.nextDueDate);
    // Loop in case multiple periods have elapsed since last run.
    while (dueDate.getTime() <= now.getTime()) {
      const amount = Number(r.amount.toString());
      const { amountIDR, amountMYR } = await computeDualBase(amount, r.currency, dueDate);
      await prisma.transaction.create({
        data: {
          userId: r.userId,
          sourceId: r.sourceId,
          categoryId: r.categoryId,
          type: r.type,
          amount: new Prisma.Decimal(amount),
          currency: r.currency,
          amountIDR: new Prisma.Decimal(amountIDR),
          amountMYR: new Prisma.Decimal(amountMYR),
          date: dueDate,
          merchant: null,
          note: r.note ? `[Recurring] ${r.note}` : "[Recurring]",
        },
      });
      created += 1;
      dueDate = computeNextDue(dueDate, r.cadence, r.dayOfMonth, r.weekday);
    }
    await prisma.recurring.update({
      where: { id: r.id },
      data: { nextDueDate: dueDate },
    });
  }
  return created;
}
