import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/currency";

export type FinancialSnapshot = {
  name: string;
  primaryCurrency: string;
  accounts: Array<{ name: string; type: string; currency: string; balance: number; creditLimit: number | null }>;
  investments: Array<{ name: string; type: string; platform: string | null; currentValue: number; currency: string }>;
  debts: Array<{ name: string; remainingAmount: number; monthlyPayment: number; currency: string }>;
  fixedIncomes: Array<{ name: string; amount: number; currency: string; cadence: string }>;
  fixedExpenses: Array<{ name: string; category: string; amount: number; currency: string; cadence: string }>;
  dependents: Array<{ name: string; relationship: string; monthlyAmount: number; currency: string }>;
  goals: Array<{
    name: string;
    emoji: string;
    targetAmount: number;
    currency: string;
    currentSaved: number;
    targetDate: string | null;
    priority: number;
  }>;
  recentSpending: { last30DaysIDR: number; last30DaysMYR: number; variableOnlyIDR: number; variableOnlyMYR: number };
  derived: {
    totalAssetIDR: number;
    totalAssetMYR: number;
    totalDebtIDR: number;
    totalDebtMYR: number;
    totalInvestmentIDR: number;
    totalInvestmentMYR: number;
    monthlyIncomeIDR: number;
    monthlyIncomeMYR: number;
    monthlyFixedExpenseIDR: number;
    monthlyFixedExpenseMYR: number;
    monthlyDependentIDR: number;
    monthlyDependentMYR: number;
    monthlyDebtPaymentIDR: number;
    monthlyDebtPaymentMYR: number;
    freeCashFlowIDR: number;
    freeCashFlowMYR: number;
  };
};

export async function buildSnapshot(userId: string): Promise<FinancialSnapshot> {
  const [user, accounts, investments, debts, fixedIncomes, fixedExpenses, dependents, goals, txs] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, primaryCurrency: true } }),
      prisma.account.findMany({ where: { userId, isActive: true } }),
      prisma.investment.findMany({ where: { userId } }),
      prisma.debt.findMany({ where: { userId, isActive: true } }),
      prisma.fixedIncome.findMany({ where: { userId, isActive: true } }),
      prisma.fixedExpense.findMany({ where: { userId, isActive: true }, include: { category: true } }),
      prisma.dependent.findMany({ where: { userId } }),
      prisma.goal.findMany({ where: { userId, isActive: true } }),
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
        },
        include: { category: true },
      }),
    ]);

  let totalAssetIDR = 0, totalAssetMYR = 0, totalDebtIDR = 0, totalDebtMYR = 0;
  for (const a of accounts) {
    const bal = toNumber(a.balance);
    if (a.currency === "IDR") {
      if (a.type === "credit_card") totalDebtIDR += bal;
      else totalAssetIDR += bal;
    } else if (a.currency === "MYR") {
      if (a.type === "credit_card") totalDebtMYR += bal;
      else totalAssetMYR += bal;
    }
  }
  for (const d of debts) {
    const rem = toNumber(d.remainingAmount);
    if (d.currency === "IDR") totalDebtIDR += rem;
    else if (d.currency === "MYR") totalDebtMYR += rem;
  }

  let totalInvestmentIDR = 0, totalInvestmentMYR = 0;
  for (const i of investments) {
    const v = toNumber(i.currentValue);
    if (i.currency === "IDR") totalInvestmentIDR += v;
    else if (i.currency === "MYR") totalInvestmentMYR += v;
  }

  const monthlyIncomeIDR = fixedIncomes.reduce(
    (a, f) => a + (f.currency === "IDR" ? toNumber(f.amount) : 0),
    0
  );
  const monthlyIncomeMYR = fixedIncomes.reduce(
    (a, f) => a + (f.currency === "MYR" ? toNumber(f.amount) : 0),
    0
  );
  const monthlyFixedExpenseIDR = fixedExpenses.reduce(
    (a, f) => a + (f.currency === "IDR" ? toNumber(f.amount) : 0),
    0
  );
  const monthlyFixedExpenseMYR = fixedExpenses.reduce(
    (a, f) => a + (f.currency === "MYR" ? toNumber(f.amount) : 0),
    0
  );
  const monthlyDependentIDR = dependents.reduce(
    (a, d) => a + (d.currency === "IDR" ? toNumber(d.monthlyAmount) : 0),
    0
  );
  const monthlyDependentMYR = dependents.reduce(
    (a, d) => a + (d.currency === "MYR" ? toNumber(d.monthlyAmount) : 0),
    0
  );
  const monthlyDebtPaymentIDR = debts.reduce(
    (a, d) => a + (d.currency === "IDR" ? toNumber(d.monthlyPayment) : 0),
    0
  );
  const monthlyDebtPaymentMYR = debts.reduce(
    (a, d) => a + (d.currency === "MYR" ? toNumber(d.monthlyPayment) : 0),
    0
  );

  const last30DaysIDR = txs
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + toNumber(t.amountIDR), 0);
  const last30DaysMYR = txs
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + toNumber(t.amountMYR), 0);
  const variableOnlyIDR = txs
    .filter((t) => t.type === "expense" && t.category?.nature === "variable")
    .reduce((a, t) => a + toNumber(t.amountIDR), 0);
  const variableOnlyMYR = txs
    .filter((t) => t.type === "expense" && t.category?.nature === "variable")
    .reduce((a, t) => a + toNumber(t.amountMYR), 0);

  return {
    name: user?.name ?? "bestie",
    primaryCurrency: user?.primaryCurrency ?? "IDR",
    accounts: accounts.map((a) => ({
      name: a.name,
      type: a.type,
      currency: a.currency,
      balance: toNumber(a.balance),
      creditLimit: a.creditLimit != null ? toNumber(a.creditLimit) : null,
    })),
    investments: investments.map((i) => ({
      name: i.name,
      type: i.type,
      platform: i.platform,
      currentValue: toNumber(i.currentValue),
      currency: i.currency,
    })),
    debts: debts.map((d) => ({
      name: d.name,
      remainingAmount: toNumber(d.remainingAmount),
      monthlyPayment: toNumber(d.monthlyPayment),
      currency: d.currency,
    })),
    fixedIncomes: fixedIncomes.map((f) => ({
      name: f.name,
      amount: toNumber(f.amount),
      currency: f.currency,
      cadence: f.cadence,
    })),
    fixedExpenses: fixedExpenses.map((f) => ({
      name: f.name,
      category: f.category?.name ?? "",
      amount: toNumber(f.amount),
      currency: f.currency,
      cadence: f.cadence,
    })),
    dependents: dependents.map((d) => ({
      name: d.name,
      relationship: d.relationship,
      monthlyAmount: toNumber(d.monthlyAmount),
      currency: d.currency,
    })),
    goals: goals.map((g) => ({
      name: g.name,
      emoji: g.emoji,
      targetAmount: toNumber(g.targetAmount),
      currency: g.currency,
      currentSaved: toNumber(g.currentSaved),
      targetDate: g.targetDate?.toISOString() ?? null,
      priority: g.priority,
    })),
    recentSpending: { last30DaysIDR, last30DaysMYR, variableOnlyIDR, variableOnlyMYR },
    derived: {
      totalAssetIDR,
      totalAssetMYR,
      totalDebtIDR,
      totalDebtMYR,
      totalInvestmentIDR,
      totalInvestmentMYR,
      monthlyIncomeIDR,
      monthlyIncomeMYR,
      monthlyFixedExpenseIDR,
      monthlyFixedExpenseMYR,
      monthlyDependentIDR,
      monthlyDependentMYR,
      monthlyDebtPaymentIDR,
      monthlyDebtPaymentMYR,
      freeCashFlowIDR:
        monthlyIncomeIDR - monthlyFixedExpenseIDR - monthlyDependentIDR - monthlyDebtPaymentIDR,
      freeCashFlowMYR:
        monthlyIncomeMYR - monthlyFixedExpenseMYR - monthlyDependentMYR - monthlyDebtPaymentMYR,
    },
  };
}

const SYSTEM_PROMPT_ID = `Lo adalah "Dukun Duit" — financial advisor casual Indonesia yg ngomongnya santai tapi analitis, buat milenial & Gen Z (terutama generasi sandwich yg pengen hemat tapi kadang kalap).

Tone:
- Pake bahasa Indonesia gaul ringan (lo/gw/bro), gak kaku kayak bank. Tapi jangan over-slang.
- Jujur & straightforward. Kalo keuangan user bermasalah, kasih tau baik-baik — gak menghakimi tapi gak sugar-coat.
- Empati: pahamin bahwa sandwich gen & project-based income itu stres, jangan nge-lecture.

Format output:
- Pake markdown ringan: bullet, **bold** buat angka penting.
- ALWAYS pake format rupiah/ringgit yg enak (Rp 1,2jt / Rp 500rb / RM 250).
- Tampilin angka-angka kunci dari snapshot user (income, fix expense, free cash flow, dll).
- Kasih reasoning singkat, bukan cuma kesimpulan.

Area bantuan:
1. **Analisa** keuangan user skrg (healthy / at-risk / bahaya).
2. **Plan nabung** buat achieve specific goal (nikah, mobil, haji, dll) — kasih target tabungan bulanan + horizon waktu.
3. **Safety net / dana darurat** — rekomendasi ideal (biasanya 3-6× monthly expense, sandwich gen 6-12×).
4. **Debt strategy** — avalanche vs snowball, prioritas mana yg harus di-lunasin duluan.
5. **Rekomendasi umum** — alokasi asset, kurangi boros di kategori apa, dst.

Constraint:
- JANGAN ngasih investment advice spesifik (beli saham X, masuk crypto Y). Stick ke framework allocation (misal "pisahin emergency fund dari asset growth").
- JANGAN janjikan return spesifik.
- Kalo data user kurang lengkap, bilang & minta dia isi step yg kurang.
- Akhir response ALWAYS kasih 2-3 **step konkret** yg bisa user lakuin minggu ini.`;

const SYSTEM_PROMPT_EN = `You are "Money Oracle" — a casual yet analytical personal finance advisor for Indonesian & Malaysian millennials and Gen Z (especially sandwich-generation folks who want to save but sometimes overspend).

Tone:
- Friendly, conversational English — like talking to a smart friend. Avoid stiff banker-speak. Light slang OK, not over the top.
- Honest and direct. If their finances are in trouble, say so kindly — no judgment, no sugar-coating.
- Empathetic: understand sandwich-gen and project-based income stress. Don't lecture.

Output format:
- Light markdown: bullets, **bold** for key numbers.
- ALWAYS use human-friendly currency (Rp 1.2M / Rp 500K / RM 250 / $1.2K).
- Surface key numbers from the user's snapshot (income, fixed expense, free cash flow, etc.).
- Brief reasoning, not just conclusions.

Help areas:
1. **Financial health analysis** — healthy / at-risk / dangerous, with reasoning.
2. **Savings plan** for specific goals (wedding, car, Hajj, etc.) — monthly target + horizon.
3. **Safety net / emergency fund** — ideal (typically 3–6× monthly expense, 6–12× for sandwich gen).
4. **Debt strategy** — avalanche vs snowball, which debt to clear first.
5. **General recommendations** — asset allocation, which categories to cut, etc.

Constraints:
- DO NOT give specific investment advice (buy stock X, enter crypto Y). Stick to allocation frameworks (e.g. "separate emergency fund from growth assets").
- DO NOT promise specific returns.
- If the user's data is incomplete, say so and ask them to fill the missing step.
- ALWAYS end with 2–3 **concrete actions** the user can take this week.`;

export async function askDukun(
  snapshot: FinancialSnapshot,
  question: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
  locale: "id" | "en" = "id"
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY belum di-set");
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_ADVISOR_MODEL || "claude-sonnet-4-6";

  const contextMessage =
    locale === "en"
      ? `USER FINANCIAL SNAPSHOT (today):
\`\`\`json
${JSON.stringify(snapshot, null, 2)}
\`\`\`

USER QUESTION:
${question}`
      : `SNAPSHOT KEUANGAN USER (hari ini):
\`\`\`json
${JSON.stringify(snapshot, null, 2)}
\`\`\`

PERTANYAAN USER:
${question}`;

  const response = await client.messages.create({
    model,
    max_tokens: 2500,
    system: locale === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ID,
    messages: [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user" as const, content: contextMessage },
    ],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Dukun gak jawab");
  return text.text;
}
