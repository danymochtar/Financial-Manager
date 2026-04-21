"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Plus, X, Check } from "lucide-react";
import { useToast } from "@/components/Toast";
import { ACCOUNT_TEMPLATES, DEPENDENT_RELATIONSHIPS } from "@/lib/categories";

type AccountDraft = {
  name: string;
  type: "bank" | "ewallet" | "cash" | "credit_card";
  currency: "IDR" | "MYR" | "USD" | "SGD";
  balance: number;
  creditLimit?: number;
  emoji: string;
  color: string;
};
type IncomeDraft = { name: string; amount: number; currency: "IDR" | "MYR"; dayOfMonth: number; accountIndex: number | null };
type FixedExpenseDraft = { name: string; amount: number; currency: "IDR" | "MYR"; dayOfMonth: number; categoryName: string };
type DebtDraft = { name: string; remainingAmount: number; monthlyPayment: number; currency: "IDR" | "MYR" };
type DependentDraft = { name: string; relationship: string; monthlyAmount: number; currency: "IDR" | "MYR" };
type BudgetDraft = {
  dailyIDR?: number;
  weeklyIDR?: number;
  monthlyIDR?: number;
  dailyMYR?: number;
  weeklyMYR?: number;
  monthlyMYR?: number;
};

const STEPS = [
  { key: "welcome", title: "Halo", emoji: "👋" },
  { key: "accounts", title: "Rekening Lo", emoji: "🏦" },
  { key: "credit_cards", title: "Kartu Kredit", emoji: "💳" },
  { key: "income", title: "Penghasilan", emoji: "💰" },
  { key: "fixed_expense", title: "Pengeluaran Fix", emoji: "🏠" },
  { key: "debts", title: "Cicilan", emoji: "⛓️" },
  { key: "dependents", title: "Tanggungan", emoji: "👪" },
  { key: "budget", title: "Target Boros", emoji: "🎯" },
  { key: "done", title: "Siap!", emoji: "🎉" },
] as const;

const FIXED_EXPENSE_CATS = ["Sewa / Kost", "Utilitas", "Internet & Pulsa", "Langganan Digital", "Asuransi", "Tanggungan Keluarga"];

export default function OnboardingPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [accounts, setAccounts] = useState<AccountDraft[]>([]);
  const [creditCards, setCreditCards] = useState<AccountDraft[]>([]);
  const [incomes, setIncomes] = useState<IncomeDraft[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseDraft[]>([]);
  const [debts, setDebts] = useState<DebtDraft[]>([]);
  const [dependents, setDependents] = useState<DependentDraft[]>([]);
  const [budget, setBudget] = useState<BudgetDraft>({});
  const [busy, setBusy] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  async function submitAll() {
    setBusy(true);
    try {
      // 1. Create accounts (regular + credit cards)
      const accountIds: string[] = [];
      for (const a of [...accounts, ...creditCards]) {
        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: a.name,
            type: a.type,
            currency: a.currency,
            balance: a.balance,
            creditLimit: a.creditLimit ?? null,
            emoji: a.emoji,
            color: a.color,
          }),
        });
        const data = await res.json();
        if (res.ok) accountIds.push(data.account.id);
      }

      // 2. Fetch categories to get IDs for FixedExpense + Income
      const catsRes = await fetch("/api/categories");
      const catsData = await catsRes.json();
      const cats: Array<{ id: string; name: string; kind: string }> = catsData.categories ?? [];
      const incomeCat = cats.find((c) => c.kind === "income" && c.name === "Gaji");

      // 3. Fixed incomes
      for (const inc of incomes) {
        const accId = inc.accountIndex != null && accountIds[inc.accountIndex] ? accountIds[inc.accountIndex] : null;
        const nextDue = nextDueDate(inc.dayOfMonth);
        await fetch("/api/fixed-incomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: accId,
            name: inc.name,
            amount: inc.amount,
            currency: inc.currency,
            dayOfMonth: inc.dayOfMonth,
            nextDue: nextDue.toISOString(),
          }),
        });
      }
      void incomeCat;

      // 4. Fixed expenses
      for (const fx of fixedExpenses) {
        const cat = cats.find((c) => c.kind === "expense" && c.name === fx.categoryName);
        if (!cat) continue;
        const nextDue = nextDueDate(fx.dayOfMonth);
        await fetch("/api/fixed-expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: cat.id,
            name: fx.name,
            amount: fx.amount,
            currency: fx.currency,
            dayOfMonth: fx.dayOfMonth,
            nextDue: nextDue.toISOString(),
          }),
        });
      }

      // 5. Debts
      for (const d of debts) {
        await fetch("/api/debts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: d.name,
            totalPrincipal: d.remainingAmount,
            remainingAmount: d.remainingAmount,
            monthlyPayment: d.monthlyPayment,
            currency: d.currency,
          }),
        });
      }

      // 6. Dependents
      for (const dep of dependents) {
        await fetch("/api/dependents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: dep.name,
            relationship: dep.relationship,
            monthlyAmount: dep.monthlyAmount,
            currency: dep.currency,
          }),
        });
      }

      // 7. Budgets
      const budgetEntries: Array<{ period: "daily" | "weekly" | "monthly"; currency: "IDR" | "MYR"; amount: number }> = [];
      if (budget.dailyIDR) budgetEntries.push({ period: "daily", currency: "IDR", amount: budget.dailyIDR });
      if (budget.weeklyIDR) budgetEntries.push({ period: "weekly", currency: "IDR", amount: budget.weeklyIDR });
      if (budget.monthlyIDR) budgetEntries.push({ period: "monthly", currency: "IDR", amount: budget.monthlyIDR });
      if (budget.dailyMYR) budgetEntries.push({ period: "daily", currency: "MYR", amount: budget.dailyMYR });
      if (budget.weeklyMYR) budgetEntries.push({ period: "weekly", currency: "MYR", amount: budget.weeklyMYR });
      if (budget.monthlyMYR) budgetEntries.push({ period: "monthly", currency: "MYR", amount: budget.monthlyMYR });
      for (const b of budgetEntries) {
        await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: "overall", ...b }),
        });
      }

      // 8. Mark onboarding done
      await fetch("/api/onboarding", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      toast({ kind: "error", message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col safe-t">
      {/* Progress */}
      <div className="flex items-center gap-1 px-4 pt-4">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-1.5 flex-1 rounded-full transition ${
              i <= step ? "bg-gradient-to-r from-pink-500 to-orange-500" : "bg-pink-100"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mb-4 text-6xl">{current.emoji}</div>
        <h1 className="text-2xl font-bold tracking-tight">{current.title}</h1>

        {current.key === "welcome" && (
          <div className="mt-3 space-y-4 text-slate-700">
            <p>
              Gw bakal bantuin lo sadar seberapa boros kebiasaan lo, biar pelan-pelan bisa lebih hemat
              dan nabung. Singkat aja — skip step yang ga relevan buat lo.
            </p>
            <ul className="space-y-2 text-sm">
              <li>🏦 Input saldo rekening & e-wallet</li>
              <li>💳 Kartu kredit (limit + tagihan)</li>
              <li>💰 Penghasilan fix</li>
              <li>🏠 Pengeluaran fix bulanan</li>
              <li>⛓️ Cicilan / hutang</li>
              <li>👪 Tanggungan (kalau generasi sandwich)</li>
              <li>🎯 Set target budget harian/mingguan/bulanan</li>
            </ul>
            <p className="text-sm text-slate-500">Bisa di-update kapan aja nanti di setting.</p>
          </div>
        )}

        {current.key === "accounts" && (
          <AccountsStep
            items={accounts}
            setItems={setAccounts}
            filterType="non_credit_card"
            subtitle="Masukin saldo rekening bank, e-wallet, cash. Minimal 1."
          />
        )}

        {current.key === "credit_cards" && (
          <AccountsStep
            items={creditCards}
            setItems={setCreditCards}
            filterType="credit_card"
            subtitle="Punya CC? Input limit & tagihan. Skip kalo gak punya."
          />
        )}

        {current.key === "income" && (
          <IncomeStep items={incomes} setItems={setIncomes} accounts={[...accounts, ...creditCards]} />
        )}

        {current.key === "fixed_expense" && (
          <FixedExpenseStep items={fixedExpenses} setItems={setFixedExpenses} />
        )}

        {current.key === "debts" && <DebtStep items={debts} setItems={setDebts} />}

        {current.key === "dependents" && <DependentStep items={dependents} setItems={setDependents} />}

        {current.key === "budget" && <BudgetStep value={budget} setValue={setBudget} />}

        {current.key === "done" && (
          <div className="mt-4 space-y-4">
            <p className="text-slate-700">
              Mantap! Semua udah kerekam. Klik <strong>Mulai Catat</strong> dan kita mulai tracking
              keborosan lo.
            </p>
            <div className="card p-4 space-y-1 text-sm">
              <div>🏦 {accounts.length} rekening + {creditCards.length} kartu kredit</div>
              <div>💰 {incomes.length} penghasilan</div>
              <div>🏠 {fixedExpenses.length} pengeluaran fix</div>
              <div>⛓️ {debts.length} cicilan</div>
              <div>👪 {dependents.length} tanggungan</div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex items-center gap-2 border-t border-pink-100 bg-white/95 px-5 py-4 backdrop-blur safe-b">
        {step > 0 && !isLast && (
          <button className="btn-ghost" onClick={back} disabled={busy}>
            <ArrowLeft className="h-4 w-4" /> Balik
          </button>
        )}
        <div className="flex-1" />
        {!isLast ? (
          <button
            className="btn-primary"
            onClick={next}
            disabled={busy || (current.key === "accounts" && accounts.length === 0)}
          >
            {step === 0 ? "Gas" : "Lanjut"} <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button className="btn-primary" onClick={submitAll} disabled={busy}>
            {busy ? "Menyimpan..." : "Mulai Catat 🚀"}
          </button>
        )}
      </div>
    </div>
  );
}

function nextDueDate(dayOfMonth: number): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), dayOfMonth, 0, 0, 0));
  if (d.getTime() <= now.getTime()) d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

function AccountsStep({
  items,
  setItems,
  filterType,
  subtitle,
}: {
  items: AccountDraft[];
  setItems: (v: AccountDraft[]) => void;
  filterType: "non_credit_card" | "credit_card";
  subtitle: string;
}) {
  const templates = ACCOUNT_TEMPLATES.filter((t) =>
    filterType === "credit_card" ? t.type === "credit_card" : t.type !== "credit_card"
  );
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState<AccountDraft>({
    name: "",
    type: filterType === "credit_card" ? "credit_card" : "bank",
    currency: "IDR",
    balance: 0,
    emoji: filterType === "credit_card" ? "💳" : "🏦",
    color: "#ec4899",
  });

  function addFromTemplate(t: (typeof ACCOUNT_TEMPLATES)[number]) {
    const name = t.name;
    if (items.some((x) => x.name === name)) return;
    setItems([
      ...items,
      {
        name,
        type: t.type,
        currency: t.currency,
        balance: 0,
        emoji: t.emoji,
        color: t.color,
      },
    ]);
  }

  function updateItem(i: number, patch: Partial<AccountDraft>) {
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function addCustom() {
    if (!custom.name) return;
    setItems([...items, custom]);
    setCustom({
      name: "",
      type: filterType === "credit_card" ? "credit_card" : "bank",
      currency: "IDR",
      balance: 0,
      emoji: filterType === "credit_card" ? "💳" : "🏦",
      color: "#ec4899",
    });
    setShowCustom(false);
  }

  return (
    <div className="mt-3 space-y-4">
      <p className="text-sm text-slate-600">{subtitle}</p>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="card flex items-center gap-3 p-3">
              <span className="text-2xl">{it.emoji}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{it.name}</div>
                <div className="text-xs text-slate-500 capitalize">
                  {it.type.replace("_", " ")} · {it.currency}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase text-slate-500">
                      {filterType === "credit_card" ? "Tagihan skrg" : "Saldo"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input mt-1 py-2 text-sm"
                      value={it.balance || ""}
                      onChange={(e) => updateItem(i, { balance: Number(e.target.value) })}
                    />
                  </div>
                  {filterType === "credit_card" && (
                    <div>
                      <label className="text-[10px] uppercase text-slate-500">Limit</label>
                      <input
                        type="number"
                        min="0"
                        className="input mt-1 py-2 text-sm"
                        value={it.creditLimit || ""}
                        onChange={(e) =>
                          updateItem(i, { creditLimit: Number(e.target.value) })
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
              <button
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                onClick={() => removeItem(i)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="label mb-2">Pilih cepet dari template</div>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => addFromTemplate(t)}
              disabled={items.some((x) => x.name === t.name)}
              className="chip disabled:opacity-40"
            >
              <span>{t.emoji}</span>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {showCustom ? (
        <div className="card p-3 space-y-2">
          <input
            className="input text-sm"
            placeholder="Nama rekening"
            value={custom.name}
            onChange={(e) => setCustom({ ...custom, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="input text-sm"
              value={custom.type}
              onChange={(e) => setCustom({ ...custom, type: e.target.value as AccountDraft["type"] })}
            >
              {filterType === "credit_card" ? (
                <option value="credit_card">Credit Card</option>
              ) : (
                <>
                  <option value="bank">Bank</option>
                  <option value="ewallet">E-wallet</option>
                  <option value="cash">Cash</option>
                </>
              )}
            </select>
            <select
              className="input text-sm"
              value={custom.currency}
              onChange={(e) =>
                setCustom({ ...custom, currency: e.target.value as AccountDraft["currency"] })
              }
            >
              <option value="IDR">IDR</option>
              <option value="MYR">MYR</option>
              <option value="USD">USD</option>
              <option value="SGD">SGD</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline flex-1 text-xs" onClick={() => setShowCustom(false)}>
              Batal
            </button>
            <button className="btn-primary flex-1 text-xs" onClick={addCustom}>
              Tambah
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="btn-outline w-full text-sm"
        >
          <Plus className="h-4 w-4" /> Tambah manual
        </button>
      )}
    </div>
  );
}

function IncomeStep({
  items,
  setItems,
  accounts,
}: {
  items: IncomeDraft[];
  setItems: (v: IncomeDraft[]) => void;
  accounts: AccountDraft[];
}) {
  const [draft, setDraft] = useState<IncomeDraft>({
    name: "Gaji",
    amount: 0,
    currency: "IDR",
    dayOfMonth: 25,
    accountIndex: null,
  });

  function add() {
    if (!draft.name || !draft.amount) return;
    setItems([...items, draft]);
    setDraft({ name: "", amount: 0, currency: "IDR", dayOfMonth: 25, accountIndex: null });
  }

  return (
    <div className="mt-3 space-y-4">
      <p className="text-sm text-slate-600">
        Gaji, retainer project, dll yang masuk tiap bulan. Skip kalo belum ada.
      </p>
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="card flex items-center justify-between p-3">
              <div>
                <div className="font-medium text-sm">💰 {it.name}</div>
                <div className="text-xs text-slate-500">
                  {it.currency} {it.amount.toLocaleString()} · tgl {it.dayOfMonth}
                </div>
              </div>
              <button
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                onClick={() => setItems(items.filter((_, idx) => idx !== i))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="card p-3 space-y-2">
        <input
          className="input text-sm"
          placeholder="Nama (contoh: Gaji Kerjaan Malaysia)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input text-sm"
            type="number"
            placeholder="Amount"
            min="0"
            value={draft.amount || ""}
            onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
          />
          <select
            className="input text-sm"
            value={draft.currency}
            onChange={(e) => setDraft({ ...draft, currency: e.target.value as IncomeDraft["currency"] })}
          >
            <option value="IDR">IDR</option>
            <option value="MYR">MYR</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] uppercase text-slate-500">Tanggal gajian</label>
            <input
              className="input text-sm"
              type="number"
              min="1"
              max="31"
              value={draft.dayOfMonth}
              onChange={(e) => setDraft({ ...draft, dayOfMonth: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-slate-500">Masuk ke rekening</label>
            <select
              className="input text-sm"
              value={draft.accountIndex ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, accountIndex: e.target.value === "" ? null : Number(e.target.value) })
              }
            >
              <option value="">— pilih —</option>
              {accounts.map((a, idx) => (
                <option key={idx} value={idx}>
                  {a.emoji} {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn-primary w-full text-sm" onClick={add}>
          <Plus className="h-4 w-4" /> Tambahin
        </button>
      </div>
    </div>
  );
}

function FixedExpenseStep({
  items,
  setItems,
}: {
  items: FixedExpenseDraft[];
  setItems: (v: FixedExpenseDraft[]) => void;
}) {
  const [draft, setDraft] = useState<FixedExpenseDraft>({
    name: "",
    amount: 0,
    currency: "IDR",
    dayOfMonth: 1,
    categoryName: "Sewa / Kost",
  });
  function add() {
    if (!draft.name || !draft.amount) return;
    setItems([...items, draft]);
    setDraft({ ...draft, name: "", amount: 0 });
  }
  return (
    <div className="mt-3 space-y-4">
      <p className="text-sm text-slate-600">
        Biaya pasti tiap bulan: kost, internet, langganan. (Cicilan nanti di step setelah ini).
      </p>
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="card flex items-center justify-between p-3">
              <div>
                <div className="font-medium text-sm">🏠 {it.name}</div>
                <div className="text-xs text-slate-500">
                  {it.currency} {it.amount.toLocaleString()} · tgl {it.dayOfMonth} · {it.categoryName}
                </div>
              </div>
              <button
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                onClick={() => setItems(items.filter((_, idx) => idx !== i))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="card p-3 space-y-2">
        <input
          className="input text-sm"
          placeholder="Nama (contoh: Sewa Kost Sudirman)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input text-sm"
            type="number"
            placeholder="Amount"
            min="0"
            value={draft.amount || ""}
            onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
          />
          <select
            className="input text-sm"
            value={draft.currency}
            onChange={(e) => setDraft({ ...draft, currency: e.target.value as "IDR" | "MYR" })}
          >
            <option value="IDR">IDR</option>
            <option value="MYR">MYR</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] uppercase text-slate-500">Tgl bayar</label>
            <input
              className="input text-sm"
              type="number"
              min="1"
              max="31"
              value={draft.dayOfMonth}
              onChange={(e) => setDraft({ ...draft, dayOfMonth: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-slate-500">Kategori</label>
            <select
              className="input text-sm"
              value={draft.categoryName}
              onChange={(e) => setDraft({ ...draft, categoryName: e.target.value })}
            >
              {FIXED_EXPENSE_CATS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn-primary w-full text-sm" onClick={add}>
          <Plus className="h-4 w-4" /> Tambahin
        </button>
      </div>
    </div>
  );
}

function DebtStep({ items, setItems }: { items: DebtDraft[]; setItems: (v: DebtDraft[]) => void }) {
  const [draft, setDraft] = useState<DebtDraft>({
    name: "",
    remainingAmount: 0,
    monthlyPayment: 0,
    currency: "IDR",
  });
  function add() {
    if (!draft.name || !draft.monthlyPayment) return;
    setItems([...items, draft]);
    setDraft({ name: "", remainingAmount: 0, monthlyPayment: 0, currency: "IDR" });
  }
  return (
    <div className="mt-3 space-y-4">
      <p className="text-sm text-slate-600">
        Cicilan KPR, KKB, pinjol, CC installment, dll. Biar kelihatan progress lunas-nya.
      </p>
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="card flex items-center justify-between p-3">
              <div>
                <div className="font-medium text-sm">⛓️ {it.name}</div>
                <div className="text-xs text-slate-500">
                  {it.currency} {it.monthlyPayment.toLocaleString()}/bln · sisa{" "}
                  {it.remainingAmount.toLocaleString()}
                </div>
              </div>
              <button
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                onClick={() => setItems(items.filter((_, idx) => idx !== i))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="card p-3 space-y-2">
        <input
          className="input text-sm"
          placeholder="Nama cicilan"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input text-sm"
            type="number"
            placeholder="Sisa hutang"
            min="0"
            value={draft.remainingAmount || ""}
            onChange={(e) => setDraft({ ...draft, remainingAmount: Number(e.target.value) })}
          />
          <input
            className="input text-sm"
            type="number"
            placeholder="Cicilan/bln"
            min="0"
            value={draft.monthlyPayment || ""}
            onChange={(e) => setDraft({ ...draft, monthlyPayment: Number(e.target.value) })}
          />
        </div>
        <select
          className="input text-sm"
          value={draft.currency}
          onChange={(e) => setDraft({ ...draft, currency: e.target.value as "IDR" | "MYR" })}
        >
          <option value="IDR">IDR</option>
          <option value="MYR">MYR</option>
        </select>
        <button className="btn-primary w-full text-sm" onClick={add}>
          <Plus className="h-4 w-4" /> Tambahin
        </button>
      </div>
    </div>
  );
}

function DependentStep({
  items,
  setItems,
}: {
  items: DependentDraft[];
  setItems: (v: DependentDraft[]) => void;
}) {
  const [draft, setDraft] = useState<DependentDraft>({
    name: "",
    relationship: "parent",
    monthlyAmount: 0,
    currency: "IDR",
  });
  function add() {
    if (!draft.name || !draft.monthlyAmount) return;
    setItems([...items, draft]);
    setDraft({ name: "", relationship: "parent", monthlyAmount: 0, currency: "IDR" });
  }
  return (
    <div className="mt-3 space-y-4">
      <p className="text-sm text-slate-600">
        Generasi sandwich? Tanggungan keluarga yang lo kirimin tiap bulan. (Skip kalo belum ada.)
      </p>
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="card flex items-center justify-between p-3">
              <div>
                <div className="font-medium text-sm">
                  {DEPENDENT_RELATIONSHIPS.find((r) => r.value === it.relationship)?.emoji ?? "👤"}{" "}
                  {it.name}
                </div>
                <div className="text-xs text-slate-500">
                  {it.currency} {it.monthlyAmount.toLocaleString()}/bln
                </div>
              </div>
              <button
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                onClick={() => setItems(items.filter((_, idx) => idx !== i))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="card p-3 space-y-2">
        <input
          className="input text-sm"
          placeholder="Nama (contoh: Mama)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            className="input text-sm"
            value={draft.relationship}
            onChange={(e) => setDraft({ ...draft, relationship: e.target.value })}
          >
            {DEPENDENT_RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.emoji} {r.label}
              </option>
            ))}
          </select>
          <select
            className="input text-sm"
            value={draft.currency}
            onChange={(e) => setDraft({ ...draft, currency: e.target.value as "IDR" | "MYR" })}
          >
            <option value="IDR">IDR</option>
            <option value="MYR">MYR</option>
          </select>
        </div>
        <input
          className="input text-sm"
          type="number"
          placeholder="Kirim per bulan"
          min="0"
          value={draft.monthlyAmount || ""}
          onChange={(e) => setDraft({ ...draft, monthlyAmount: Number(e.target.value) })}
        />
        <button className="btn-primary w-full text-sm" onClick={add}>
          <Plus className="h-4 w-4" /> Tambahin
        </button>
      </div>
    </div>
  );
}

function BudgetStep({ value, setValue }: { value: BudgetDraft; setValue: (v: BudgetDraft) => void }) {
  return (
    <div className="mt-3 space-y-4">
      <p className="text-sm text-slate-600">
        Target pengeluaran variable (jajan, makan, belanja). Kalo lewat, gw kasih tau "Woy boros!".
        Isi yang lo mau aja — boleh skip semua juga.
      </p>
      <div className="card p-4 space-y-3">
        <div className="text-sm font-semibold text-pink-700">Rupiah</div>
        <BudgetRow
          label="Harian"
          value={value.dailyIDR ?? ""}
          onChange={(n) => setValue({ ...value, dailyIDR: n })}
        />
        <BudgetRow
          label="Mingguan"
          value={value.weeklyIDR ?? ""}
          onChange={(n) => setValue({ ...value, weeklyIDR: n })}
        />
        <BudgetRow
          label="Bulanan"
          value={value.monthlyIDR ?? ""}
          onChange={(n) => setValue({ ...value, monthlyIDR: n })}
        />
      </div>
      <div className="card p-4 space-y-3">
        <div className="text-sm font-semibold text-pink-700">Ringgit</div>
        <BudgetRow
          label="Harian"
          value={value.dailyMYR ?? ""}
          onChange={(n) => setValue({ ...value, dailyMYR: n })}
        />
        <BudgetRow
          label="Mingguan"
          value={value.weeklyMYR ?? ""}
          onChange={(n) => setValue({ ...value, weeklyMYR: n })}
        />
        <BudgetRow
          label="Bulanan"
          value={value.monthlyMYR ?? ""}
          onChange={(n) => setValue({ ...value, monthlyMYR: n })}
        />
      </div>
    </div>
  );
}

function BudgetRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | "";
  onChange: (n: number | undefined) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm w-20">{label}</span>
      <input
        className="input text-sm flex-1"
        type="number"
        min="0"
        placeholder="0 = skip"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(n > 0 ? n : undefined);
        }}
      />
      {typeof value === "number" && value > 0 && <Check className="h-4 w-4 text-emerald-500" />}
    </div>
  );
}
