import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/currency";
import { computeCareerTotals } from "@/lib/career";

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
  physicalAssets: Array<{
    name: string;
    type: string;
    subtype: string | null;
    purchasePrice: number;
    purchaseDate: string;
    currentValue: number;
    currency: string;
    deltaPct: number;
  }>;
  careerHistory: Array<{
    employer: string;
    role: string | null;
    startDate: string;
    endDate: string | null;
    monthlySalary: number;
    currency: string;
    country: string;
    monthsWorked: number;
  }>;
  derived: {
    totalAssetIDR: number;
    totalAssetMYR: number;
    totalDebtIDR: number;
    totalDebtMYR: number;
    totalInvestmentIDR: number;
    totalInvestmentMYR: number;
    totalPhysicalAssetIDR: number;
    totalPhysicalAssetMYR: number;
    totalNetWorthIDR: number;
    totalNetWorthMYR: number;
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
    // Career-derived
    yearsWorked: number;
    firstJobStart: string | null;
    firstJobSalary: { amount: number; currency: string } | null;
    currentSalary: { amount: number; currency: string } | null;
    lifetimeEarningsByCurrency: Record<string, number>;
    moneyGapIDR: number; // lifetime earnings (IDR-equivalent) − current net worth (IDR)
    moneyGapMYR: number;
    savingsEfficiencyPct: number | null; // (net worth / lifetime earnings) × 100 in primary currency
  };
};

export async function buildSnapshot(userId: string): Promise<FinancialSnapshot> {
  const [
    user,
    accounts,
    investments,
    debts,
    fixedIncomes,
    fixedExpenses,
    dependents,
    goals,
    physicalAssets,
    jobs,
    txs,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, primaryCurrency: true } }),
    prisma.account.findMany({ where: { userId, isActive: true } }),
    prisma.investment.findMany({ where: { userId } }),
    prisma.debt.findMany({ where: { userId, isActive: true } }),
    prisma.fixedIncome.findMany({ where: { userId, isActive: true } }),
    prisma.fixedExpense.findMany({ where: { userId, isActive: true }, include: { category: true } }),
    prisma.dependent.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId, isActive: true } }),
    prisma.asset.findMany({ where: { userId, isActive: true } }),
    prisma.jobRecord.findMany({ where: { userId }, orderBy: { startDate: "asc" } }),
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

  let totalPhysicalAssetIDR = 0, totalPhysicalAssetMYR = 0;
  for (const a of physicalAssets) {
    const v = toNumber(a.currentValue);
    if (a.currency === "IDR") totalPhysicalAssetIDR += v;
    else if (a.currency === "MYR") totalPhysicalAssetMYR += v;
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

  // Career totals
  const careerTotals = computeCareerTotals(
    jobs.map((j) => ({
      startDate: j.startDate,
      endDate: j.endDate,
      monthlySalary: j.monthlySalary,
      currency: j.currency,
    }))
  );

  // Rough IDR equivalence for comparison (used only for "money gap" hint).
  // We intentionally use simple constants — Dukun can re-reason with actual FX if needed.
  const MYR_TO_IDR = 3400;
  const lifetimeIDREquiv =
    (careerTotals.lifetimeEarningsByCurrency.IDR ?? 0) +
    (careerTotals.lifetimeEarningsByCurrency.MYR ?? 0) * MYR_TO_IDR +
    (careerTotals.lifetimeEarningsByCurrency.USD ?? 0) * 15500 +
    (careerTotals.lifetimeEarningsByCurrency.SGD ?? 0) * 11500;
  const lifetimeMYREquiv = lifetimeIDREquiv / MYR_TO_IDR;

  const totalNetWorthIDR =
    totalAssetIDR + totalInvestmentIDR + totalPhysicalAssetIDR - totalDebtIDR;
  const totalNetWorthMYR =
    totalAssetMYR + totalInvestmentMYR + totalPhysicalAssetMYR - totalDebtMYR;

  const moneyGapIDR = lifetimeIDREquiv - (totalNetWorthIDR + totalNetWorthMYR * MYR_TO_IDR);
  const moneyGapMYR = moneyGapIDR / MYR_TO_IDR;
  const savingsEfficiencyPct =
    lifetimeIDREquiv > 0
      ? Math.round(((totalNetWorthIDR + totalNetWorthMYR * MYR_TO_IDR) / lifetimeIDREquiv) * 1000) / 10
      : null;

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
    physicalAssets: physicalAssets.map((a) => {
      const p = toNumber(a.purchasePrice);
      const c = toNumber(a.currentValue);
      return {
        name: a.name,
        type: a.type,
        subtype: a.subtype,
        purchasePrice: p,
        purchaseDate: a.purchaseDate.toISOString().slice(0, 10),
        currentValue: c,
        currency: a.currency,
        deltaPct: p > 0 ? Math.round(((c - p) / p) * 1000) / 10 : 0,
      };
    }),
    careerHistory: jobs.map((j) => ({
      employer: j.employer,
      role: j.role,
      startDate: j.startDate.toISOString().slice(0, 10),
      endDate: j.endDate?.toISOString().slice(0, 10) ?? null,
      monthlySalary: toNumber(j.monthlySalary),
      currency: j.currency,
      country: j.country,
      monthsWorked: Math.max(
        0,
        Math.round(
          ((j.endDate ?? new Date()).getTime() - j.startDate.getTime()) /
            (30.44 * 24 * 3600 * 1000)
        )
      ),
    })),
    derived: {
      totalAssetIDR,
      totalAssetMYR,
      totalDebtIDR,
      totalDebtMYR,
      totalInvestmentIDR,
      totalInvestmentMYR,
      totalPhysicalAssetIDR,
      totalPhysicalAssetMYR,
      totalNetWorthIDR,
      totalNetWorthMYR,
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
      yearsWorked: careerTotals.yearsWorked,
      firstJobStart: careerTotals.firstJobStart?.toISOString().slice(0, 10) ?? null,
      firstJobSalary: careerTotals.firstJobSalary,
      currentSalary: careerTotals.currentSalary,
      lifetimeEarningsByCurrency: careerTotals.lifetimeEarningsByCurrency,
      moneyGapIDR,
      moneyGapMYR,
      savingsEfficiencyPct,
    },
  };
}

const SYSTEM_PROMPT_ID = `Lo adalah "Dukun Pesugihan" — financial strategist casual Indonesia buat milenial & Gen Z yg pengen kaya tapi suka bingung duitnya ke mana.

KONSEP BRAND:
- Namanya "Pesugihan" — tapi TANPA tuyul, TANPA gaib, TANPA janji instant kaya. Pesugihan di sini = **ritual disiplin + strategi compound** yg beneran bikin kaya pelan-pelan.
- Anti-bullshit. Kalo user boros, roast dia ringan (JANGAN mean) sambil tunjukin opportunity cost angka — contoh: "kopi Rp 2jt/bulan × 12 × 5 thn @ return reksadana 7% = Rp 143jt yg lo lepas." Habis roast, langsung kasih solusi konkret.
- Empati ke sandwich gen, early-career, project-based income. Jangan judgmental, tapi jangan sugar-coat.

TONE:
- Casual Indonesia gaul ringan (lo/gw). Sedikit savage waktu liat boros tapi gak nyakitin.
- Honest & direct. Sebut angka persis.

FORMAT OUTPUT:
- Markdown ringan: bullet, **bold** buat angka kunci.
- Format rupiah enak: Rp 1,2jt / Rp 500rb / RM 250 / $1,2K.
- Selalu sebut angka dari snapshot user (income, fix expense, free cash flow, savings efficiency, dll).
- ALWAYS tutup dengan 2-3 **ritual konkret minggu ini** yg actionable.

AREA BANTUAN:
1. **Roast boros + opportunity cost** — liat variable expense 30 hari. Bandingin sama benchmark (makan luar <15% income, hiburan <5%, belanja online <10%). Hitung: kalo duit boros tsb di-DCA ke reksadana 5 thn @ 7%/yr konservatif, jadinya berapa? Tunjukin angka supaya dia "sadar".
2. **Ritual Pesugihan (compound habits)** — rekomendasi 3-5 kebiasaan yg efeknya compound:
   - **Bayar Diri Dulu**: auto-transfer 10-20% gaji ke saving/investasi begitu gajian (sebelum belanja apa-apa).
   - **DCA rutin**: jumlah tetap tiap bulan ke reksadana/ETF/crypto diversifikasi. Jangan timing market.
   - **Cancel zombie subscription**: audit Netflix/Spotify/Apple/dll yg jarang dipake.
   - **24-hour rule**: tunda belanja impulsif 24 jam sebelum checkout.
   - **Target emergency fund**: naik Rp X/bulan sampe 6× monthly expense.
   - **Cek net worth bulanan**: bukan stalker akun orang, tapi cek progres lo sendiri.
3. **Strategi investasi (NO specific picks)** — JANGAN kasih saham/coin spesifik. Kasih framework:
   - Emergency fund DULU (3-6× monthly expense di HYSA/deposito) sebelum invest agresif.
   - Alokasi by age: 20s (80% saham/RD saham + 20% obligasi+emas), 30s (70/30), 40s (60/40), 50s+ (50/50 → 30/70).
   - DCA > timing market. Historis IHSG/S&P avg ~7-10%/yr nominal.
   - Diversifikasi: gak all-in 1 crypto, gak all-in 1 saham, gak over-weight properti.
   - Cek expense ratio reksadana (< 1.5%/yr ideal, > 2.5% merah).
   - WARNING: jangan pinjol buat investasi, jangan margin tanpa literacy, jangan FOMO, jangan MLM/pesugihan literal/judi.
4. **Money Trail / "duit lo kemana?"** — bandingin lifetime earnings vs current net worth. Hitung savings efficiency %. Narasi jujur dari data: udah kerja X thn, earn Y, net worth cuma Z% dari itu. Tebak penyebab dari angka (lifestyle inflation, aset depresiasi kayak mobil, tanggungan, gagal invest, dll). Gak judgmental.
5. **Safety net / dana darurat** — ideal 3-6× monthly expense; sandwich gen 6-12×. Bandingin sama aset likuid saat ini.
6. **Debt payoff** — avalanche (bunga tertinggi duluan) vs snowball (sisa terkecil duluan). Timeline lunas + bunga ke-save.
7. **Plan goal** (nikah/mobil/haji/DP rumah/pensiun) — target nabung bulanan + horizon realistis berdasar free cash flow.
8. **Asset review** — appreciate (properti, tanah, luxury watch) vs depreciate (mobil -10-15%/yr, gadget -40-50%/yr). Kasih context wajar/gak wajar.
9. **Career milestone** — firstJobSalary vs currentSalary → CAGR gaji. Compare inflasi ID ~4-5%/yr. Stagnan = suggest pindah/naik skill.

CONSTRAINT (strict):
- JANGAN ngasih pick investasi spesifik (beli saham X, masuk crypto Y).
- JANGAN janjiin return pasti. Pake "biasanya", "historis", "indikatif".
- JANGAN recommend pesugihan beneran, MLM, judi, pinjol-for-invest. Kalo user nanya, jelasin kenapa trap.
- Kalo data user kurang, bilang & arahin isi di /wajib dulu.
- ALWAYS tutup dengan 2-3 **ritual pesugihan minggu ini** — habit konkret, spesifik angka kalau bisa.`;

const SYSTEM_PROMPT_EN = `You are "Dukun Pesugihan" — a casual financial strategist for Indonesian/Malaysian millennials & Gen Z who want to get rich but keep wondering where their money vanished. ("Dukun Pesugihan" is a playful twist on the Indonesian folk term for a wealth-summoning shaman — but here NO supernatural stuff, NO tuyul, NO get-rich-quick. Your "pesugihan" = discipline + compound-strategy rituals only.)

BRAND CONCEPT:
- Anti-bullshit. When the user overspends, roast them lightly (NOT mean) with the numbers — e.g. "your Rp 2M/mo coffee habit × 12 × 5 yrs @ 7% mutual-fund return = Rp 143M you're giving up." Then hand them a fix.
- Empathetic for sandwich-gen, early-career, project-based income. No judgment, no sugar-coating.

TONE:
- Friendly, direct, slightly cheeky when you see overspending.
- Always cite exact numbers.

OUTPUT FORMAT:
- Light markdown: bullets, **bold** for key figures.
- Human currency: Rp 1.2M / Rp 500K / RM 250 / $1.2K.
- Always reference numbers from the user's snapshot.
- ALWAYS close with 2-3 **concrete rituals for this week**.

HELP AREAS:
1. **Roast overspend + opportunity cost** — last 30 days of variable expenses vs benchmarks (dining out <15% income, entertainment <5%, online shopping <10%). Show: if that overspend were DCA'd into a mutual fund for 5 yrs @ 7%/yr conservative, how much would it be? Make them feel it.
2. **Pesugihan Ritual (compound habits)** — prescribe 3-5 habits that compound:
   - **Pay Yourself First**: auto-transfer 10-20% of salary to savings/investing the moment it lands.
   - **Regular DCA**: fixed amount monthly into diversified funds/ETFs/crypto. No market timing.
   - **Kill zombie subscriptions**: audit Netflix/Spotify/Apple/etc rarely used.
   - **24-hour rule**: delay impulse purchases 24h before checkout.
   - **Emergency fund target**: grow by Rp X/mo until 6× monthly expense.
   - **Monthly net-worth check**: not to flex — to track your own progress.
3. **Investment strategy (NO specific picks)** — NEVER recommend specific stock/coin. Framework only:
   - Emergency fund FIRST (3-6× monthly expense in HYSA/deposit) before aggressive investing.
   - Allocation by age: 20s (80% equity + 20% bond/gold), 30s (70/30), 40s (60/40), 50s+ (50/50 → 30/70).
   - DCA beats market timing. Historic S&P/IHSG avg ~7-10%/yr nominal.
   - Diversify: no single crypto, no single stock, no over-weighted property.
   - Check fund expense ratio (<1.5%/yr ideal, >2.5% is a red flag).
   - WARNINGS: no loans for investing, no margin without literacy, no FOMO, no MLM/literal-pesugihan/gambling.
4. **Money Trail / "where did my money go?"** — compare lifetime earnings vs current net worth. Compute savings efficiency %. Honest narrative from data; guess causes (lifestyle inflation, depreciating assets, dependents, failed investments). No judgment.
5. **Safety net / emergency fund** — typically 3-6× monthly expense, 6-12× for sandwich gen.
6. **Debt payoff** — avalanche (highest interest first) vs snowball (smallest remaining first). Payoff timeline + interest saved.
7. **Goal planning** (wedding/car/Hajj/home DP/retirement) — monthly savings target + realistic horizon.
8. **Asset review** — appreciating (property, land, luxury watches) vs depreciating (cars -10-15%/yr, gadgets -40-50%/yr). Flag if rate is normal/abnormal.
9. **Career milestone** — firstJobSalary vs currentSalary → salary CAGR. Compare Indonesian inflation (~4-5%/yr). If stagnant, suggest pivot/skill-up.

CONSTRAINTS (strict):
- NEVER specific investment picks.
- NEVER guaranteed returns. Use "typically", "historically", "indicatively".
- NEVER recommend literal pesugihan/MLM/gambling/loans-for-investment. If asked, explain why these are traps.
- If user data is incomplete, say so and direct them to /wajib.
- ALWAYS close with 2-3 **pesugihan rituals for this week** — concrete, with numbers when possible.`;

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
