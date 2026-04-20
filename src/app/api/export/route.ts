import { prisma } from "@/lib/db";
import { getAuthedUser } from "@/lib/api";
import { toCsv, toXlsx, type ExportRow } from "@/lib/export";
import { toNumber } from "@/lib/currency";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getAuthedUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "csv").toLowerCase();
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const where = {
    userId: user.id,
    ...(fromParam || toParam
      ? {
          date: {
            ...(fromParam ? { gte: new Date(fromParam) } : {}),
            ...(toParam ? { lte: new Date(toParam) } : {}),
          },
        }
      : {}),
  };

  const txs = await prisma.transaction.findMany({
    where,
    include: { source: true, category: true },
    orderBy: { date: "desc" },
  });

  const rows: ExportRow[] = txs.map((t) => ({
    date: t.date.toISOString().slice(0, 10),
    type: t.type,
    source: t.source?.name ?? "",
    category: t.category?.name ?? "",
    merchant: t.merchant ?? "",
    amount: toNumber(t.amount).toString(),
    currency: t.currency,
    amountIDR: toNumber(t.amountIDR).toString(),
    amountMYR: toNumber(t.amountMYR).toString(),
    note: t.note ?? "",
  }));

  const filename = `transactions-${new Date().toISOString().slice(0, 10)}`;

  if (format === "xlsx") {
    const buf = await toXlsx(rows);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  const csv = toCsv(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
