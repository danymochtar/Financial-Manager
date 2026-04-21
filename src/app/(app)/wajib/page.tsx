"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatShort } from "@/lib/currency";
import { MoneyInput, CurrencySelect } from "@/components/MoneyInput";
import {
  DEPENDENT_RELATIONSHIPS,
  DEBT_TEMPLATES,
  FIXED_EXPENSE_TEMPLATES,
  INVESTMENT_TEMPLATES,
  GOAL_TEMPLATES,
} from "@/lib/categories";

type FixedIncome = {
  id: string;
  name: string;
  amount: string;
  currency: string;
  dayOfMonth: number | null;
  nextDue: string;
  account: { name: string; emoji: string } | null;
};
type FixedExpense = {
  id: string;
  name: string;
  amount: string;
  currency: string;
  dayOfMonth: number | null;
  nextDue: string;
  category: { name: string; emoji: string };
};
type Debt = {
  id: string;
  name: string;
  remainingAmount: string;
  monthlyPayment: string;
  currency: string;
};
type Dependent = {
  id: string;
  name: string;
  relationship: string;
  monthlyAmount: string;
  currency: string;
};
type Investment = {
  id: string;
  name: string;
  type: string;
  platform: string | null;
  currentValue: string;
  currency: string;
  emoji: string;
  color: string;
};
type Goal = {
  id: string;
  name: string;
  emoji: string;
  targetAmount: string;
  currentSaved: string;
  currency: string;
  targetDate: string | null;
  priority: number;
  note: string | null;
};
type Category = { id: string; name: string; kind: string; emoji: string; nature: string };

type Tab = "expense" | "income" | "debt" | "dependent" | "investment" | "goal";

export default function WajibPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("expense");
  const [incomes, setIncomes] = useState<FixedIncome[]>([]);
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    const [i, e, d, p, inv, g, c] = await Promise.all([
      fetch("/api/fixed-incomes").then((r) => r.json()),
      fetch("/api/fixed-expenses").then((r) => r.json()),
      fetch("/api/debts").then((r) => r.json()),
      fetch("/api/dependents").then((r) => r.json()),
      fetch("/api/investments").then((r) => r.json()),
      fetch("/api/goals").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setIncomes(i.fixedIncomes ?? []);
    setExpenses(e.fixedExpenses ?? []);
    setDebts(d.debts ?? []);
    setDependents(p.dependents ?? []);
    setInvestments(inv.investments ?? []);
    setGoals(g.goals ?? []);
    setCategories(c.categories ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function remove(t: Tab, id: string) {
    if (!confirm("Hapus?")) return;
    const map: Record<Tab, string> = {
      expense: "fixed-expenses",
      income: "fixed-incomes",
      debt: "debts",
      dependent: "dependents",
      investment: "investments",
      goal: "goals",
    };
    await fetch(`/api/${map[t]}/${id}`, { method: "DELETE" });
    toast({ kind: "success", message: "Dihapus" });
    load();
  }

  const TABS: Array<{ k: Tab; l: string }> = [
    { k: "expense", l: "Expense Fix" },
    { k: "income", l: "Income" },
    { k: "debt", l: "Cicilan" },
    { k: "dependent", l: "Tanggungan" },
    { k: "investment", l: "Investasi" },
    { k: "goal", l: "Target 🎯" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wajib Bulanan</h1>
        <p className="text-sm text-slate-600">
          Income, fix expense, cicilan, tanggungan, investasi, & target goals.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 border border-pink-100 text-xs">
        {TABS.map(({ k, l }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 font-medium ${
              tab === k ? "bg-pink-600 text-white" : "text-slate-600"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <button className="btn-primary w-full" onClick={() => setShowAdd(true)}>
        <Plus className="h-4 w-4" /> Tambah {TABS.find((t) => t.k === tab)?.l}
      </button>

      {tab === "expense" && (
        <ItemList
          items={expenses}
          emptyLabel="expense fix"
          render={(e) => ({
            emoji: e.category.emoji,
            title: e.name,
            sub: `${e.category.name} · tgl ${e.dayOfMonth ?? "-"}`,
            amount: formatShort(Number(e.amount), e.currency),
            onDelete: () => remove("expense", e.id),
          })}
        />
      )}
      {tab === "income" && (
        <ItemList
          items={incomes}
          emptyLabel="income fix"
          render={(i) => ({
            emoji: "💰",
            title: i.name,
            sub: `${i.account?.name ?? "—"} · tgl ${i.dayOfMonth ?? "-"}`,
            amount: `+${formatShort(Number(i.amount), i.currency)}`,
            amountColor: "emerald",
            onDelete: () => remove("income", i.id),
          })}
        />
      )}
      {tab === "debt" && (
        <ItemList
          items={debts}
          emptyLabel="cicilan"
          render={(d) => ({
            emoji: "⛓️",
            title: d.name,
            sub: `sisa ${formatShort(Number(d.remainingAmount), d.currency)}`,
            amount: `${formatShort(Number(d.monthlyPayment), d.currency)}/bln`,
            onDelete: () => remove("debt", d.id),
          })}
        />
      )}
      {tab === "dependent" && (
        <ItemList
          items={dependents}
          emptyLabel="tanggungan"
          render={(dep) => ({
            emoji:
              DEPENDENT_RELATIONSHIPS.find((r) => r.value === dep.relationship)?.emoji ?? "👤",
            title: dep.name,
            sub: DEPENDENT_RELATIONSHIPS.find((r) => r.value === dep.relationship)?.label ?? "-",
            amount: `${formatShort(Number(dep.monthlyAmount), dep.currency)}/bln`,
            onDelete: () => remove("dependent", dep.id),
          })}
        />
      )}
      {tab === "investment" && (
        <ItemList
          items={investments}
          emptyLabel="investasi"
          render={(inv) => ({
            emoji: inv.emoji,
            title: inv.name,
            sub: `${inv.type.replace("_", " ")}${inv.platform ? ` · ${inv.platform}` : ""}`,
            amount: formatShort(Number(inv.currentValue), inv.currency),
            amountColor: "emerald",
            onDelete: () => remove("investment", inv.id),
          })}
        />
      )}
      {tab === "goal" && (
        <ItemList
          items={goals}
          emptyLabel="target goal"
          render={(g) => {
            const saved = Number(g.currentSaved);
            const target = Number(g.targetAmount);
            const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
            const deadline = g.targetDate
              ? ` · ${new Date(g.targetDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`
              : "";
            return {
              emoji: g.emoji,
              title: g.name,
              sub: `${pct}% · ${formatShort(saved, g.currency)} / ${formatShort(target, g.currency)}${deadline}`,
              amount: priorityLabel(g.priority),
              amountColor: g.priority === 1 ? "rose" : "emerald",
              onDelete: () => remove("goal", g.id),
            };
          }}
        />
      )}

      {showAdd && (
        <AddSheet
          tab={tab}
          categories={categories}
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function priorityLabel(p: number) {
  return p === 1 ? "HIGH" : p === 3 ? "low" : "normal";
}

function ItemList<T extends { id: string }>({
  items,
  emptyLabel,
  render,
}: {
  items: T[];
  emptyLabel: string;
  render: (it: T) => {
    emoji: string;
    title: string;
    sub: string;
    amount: string;
    amountColor?: "rose" | "emerald";
    onDelete: () => void;
  };
}) {
  if (items.length === 0) {
    return <div className="card p-4 text-sm text-slate-500">Belum ada {emptyLabel}.</div>;
  }
  return (
    <div className="space-y-2">
      {items.map((it) => {
        const r = render(it);
        return (
          <div key={it.id} className="card flex items-center gap-3 p-3">
            <span className="text-xl">{r.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold">{r.title}</div>
              <div className="text-[11px] text-slate-500">{r.sub}</div>
            </div>
            <div
              className={`text-sm font-bold ${
                r.amountColor === "emerald" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {r.amount}
            </div>
            <button className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100" onClick={r.onDelete}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AddSheet({
  tab,
  categories,
  onClose,
  onAdded,
}: {
  tab: Tab;
  categories: Category[];
  onClose: () => void;
  onAdded: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md space-y-3 rounded-3xl bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            Tambah {tab === "investment" ? "Investasi" : tab === "goal" ? "Target" : "baru"}
          </div>
          <button onClick={onClose} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        {tab === "expense" && <FixedExpenseForm categories={categories} onAdded={onAdded} />}
        {tab === "income" && <IncomeForm onAdded={onAdded} />}
        {tab === "debt" && <DebtForm onAdded={onAdded} />}
        {tab === "dependent" && <DependentForm onAdded={onAdded} />}
        {tab === "investment" && <InvestmentForm onAdded={onAdded} />}
        {tab === "goal" && <GoalForm onAdded={onAdded} />}
      </div>
    </div>
  );
}

function FixedExpenseForm({ categories, onAdded }: { categories: Category[]; onAdded: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState<"IDR" | "MYR" | "USD" | "SGD">("IDR");
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.kind === "expense" && c.nature === "fixed")?.id ?? ""
  );
  const fixedCats = categories.filter((c) => c.kind === "expense" && c.nature === "fixed");

  function useTemplate(t: (typeof FIXED_EXPENSE_TEMPLATES)[number]) {
    setName(t.name);
    const cat = categories.find((c) => c.name === t.categoryName);
    if (cat) setCategoryId(cat.id);
    if (currency === "IDR" && t.defaultAmountIDR) setAmount(t.defaultAmountIDR);
    if (currency === "MYR" && t.defaultAmountMYR) setAmount(t.defaultAmountMYR);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextDue = new Date();
    nextDue.setDate(dayOfMonth);
    const res = await fetch("/api/fixed-expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId,
        name,
        amount,
        currency,
        dayOfMonth,
        nextDue: nextDue.toISOString(),
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast({ kind: "error", message: d?.error ?? "Gagal" });
      return;
    }
    toast({ kind: "success", message: "Tersimpan" });
    onAdded();
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div>
        <div className="label mb-1">Template cepet</div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {FIXED_EXPENSE_TEMPLATES.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => useTemplate(t)}
              className="chip"
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
      </div>
      <input
        className="input text-sm"
        placeholder="Nama"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <input
          type="number"
          min={1}
          max={31}
          className="input text-sm"
          placeholder="Tgl bayar"
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(Number(e.target.value))}
        />
      </div>
      <MoneyInput value={amount} onChange={setAmount} currency={currency} />
      <select
        className="input text-sm"
        value={categoryId}
        required
        onChange={(e) => setCategoryId(e.target.value)}
      >
        <option value="">— kategori —</option>
        {fixedCats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.emoji} {c.name}
          </option>
        ))}
      </select>
      <button type="submit" className="btn-primary w-full">
        Simpan
      </button>
    </form>
  );
}

function IncomeForm({ onAdded }: { onAdded: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState<"IDR" | "MYR" | "USD" | "SGD">("IDR");
  const [dayOfMonth, setDayOfMonth] = useState(25);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextDue = new Date();
    nextDue.setDate(dayOfMonth);
    const res = await fetch("/api/fixed-incomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        amount,
        currency,
        dayOfMonth,
        nextDue: nextDue.toISOString(),
      }),
    });
    if (!res.ok) {
      toast({ kind: "error", message: "Gagal" });
      return;
    }
    onAdded();
  }
  return (
    <form className="space-y-2" onSubmit={submit}>
      <input
        className="input text-sm"
        placeholder="Nama (contoh: Gaji Kerjaan Malaysia)"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <CurrencySelect value={currency} onChange={setCurrency} />
        <input
          type="number"
          min={1}
          max={31}
          className="input text-sm"
          placeholder="Tgl gajian"
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(Number(e.target.value))}
        />
      </div>
      <MoneyInput value={amount} onChange={setAmount} currency={currency} />
      <button type="submit" className="btn-primary w-full">
        Simpan
      </button>
    </form>
  );
}

function DebtForm({ onAdded }: { onAdded: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [monthly, setMonthly] = useState(0);
  const [currency, setCurrency] = useState<"IDR" | "MYR" | "USD" | "SGD">("IDR");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        totalPrincipal: remaining,
        remainingAmount: remaining,
        monthlyPayment: monthly,
        currency,
      }),
    });
    if (!res.ok) {
      toast({ kind: "error", message: "Gagal" });
      return;
    }
    onAdded();
  }
  return (
    <form className="space-y-2" onSubmit={submit}>
      <div>
        <div className="label mb-1">Template</div>
        <div className="flex flex-wrap gap-1.5">
          {DEBT_TEMPLATES.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setName(t.name)}
              className="chip"
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
      </div>
      <input
        className="input text-sm"
        placeholder="Nama"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <CurrencySelect value={currency} onChange={setCurrency} />
      <div>
        <label className="label">Sisa hutang</label>
        <MoneyInput value={remaining} onChange={setRemaining} currency={currency} />
      </div>
      <div>
        <label className="label">Cicilan / bulan</label>
        <MoneyInput value={monthly} onChange={setMonthly} currency={currency} />
      </div>
      <button type="submit" className="btn-primary w-full">
        Simpan
      </button>
    </form>
  );
}

function DependentForm({ onAdded }: { onAdded: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("parent");
  const [monthly, setMonthly] = useState(0);
  const [currency, setCurrency] = useState<"IDR" | "MYR" | "USD" | "SGD">("IDR");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/dependents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, relationship, monthlyAmount: monthly, currency }),
    });
    if (!res.ok) {
      toast({ kind: "error", message: "Gagal" });
      return;
    }
    onAdded();
  }
  return (
    <form className="space-y-2" onSubmit={submit}>
      <input
        className="input text-sm"
        placeholder="Nama (contoh: Mama)"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          className="input text-sm"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
        >
          {DEPENDENT_RELATIONSHIPS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.emoji} {r.label}
            </option>
          ))}
        </select>
        <CurrencySelect value={currency} onChange={setCurrency} />
      </div>
      <MoneyInput value={monthly} onChange={setMonthly} currency={currency} />
      <button type="submit" className="btn-primary w-full">
        Simpan
      </button>
    </form>
  );
}

function InvestmentForm({ onAdded }: { onAdded: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<"gold" | "crypto" | "stock" | "mutual_fund" | "forex" | "deposit" | "bond" | "property" | "other">("gold");
  const [platform, setPlatform] = useState("");
  const [value, setValue] = useState(0);
  const [currency, setCurrency] = useState<"IDR" | "MYR" | "USD" | "SGD">("IDR");
  const [emoji, setEmoji] = useState("📈");
  const [color, setColor] = useState("#10b981");

  function useTemplate(t: (typeof INVESTMENT_TEMPLATES)[number]) {
    setName(t.name);
    setType(t.type);
    setEmoji(t.emoji);
    setColor(t.color);
    if (t.defaultPlatform) setPlatform(t.defaultPlatform);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        platform: platform || null,
        currentValue: value,
        currency,
        emoji,
        color,
      }),
    });
    if (!res.ok) {
      toast({ kind: "error", message: "Gagal" });
      return;
    }
    onAdded();
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div>
        <div className="label mb-1">Template</div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {INVESTMENT_TEMPLATES.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => useTemplate(t)}
              className="chip"
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
      </div>
      <input
        className="input text-sm"
        placeholder="Nama (contoh: BBCA, Emas Antam)"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          className="input text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          <option value="gold">Emas</option>
          <option value="crypto">Crypto</option>
          <option value="stock">Saham</option>
          <option value="mutual_fund">Reksadana</option>
          <option value="forex">Forex</option>
          <option value="deposit">Deposito</option>
          <option value="bond">Obligasi</option>
          <option value="property">Properti</option>
          <option value="other">Lainnya</option>
        </select>
        <CurrencySelect value={currency} onChange={setCurrency} />
      </div>
      <input
        className="input text-sm"
        placeholder="Platform (contoh: Pluang, Ajaib)"
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
      />
      <div>
        <label className="label">Nilai saat ini</label>
        <MoneyInput value={value} onChange={setValue} currency={currency} />
      </div>
      <button type="submit" className="btn-primary w-full">
        Simpan
      </button>
    </form>
  );
}

function GoalForm({ onAdded }: { onAdded: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [target, setTarget] = useState(0);
  const [saved, setSaved] = useState(0);
  const [currency, setCurrency] = useState<"IDR" | "MYR" | "USD" | "SGD">("IDR");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState(2);
  const [hint, setHint] = useState<string | null>(null);

  function useTemplate(t: (typeof GOAL_TEMPLATES)[number]) {
    setName(t.name);
    setEmoji(t.emoji);
    setHint(t.hint);
    if (t.defaultAmountIDR && currency === "IDR") setTarget(t.defaultAmountIDR);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        emoji,
        targetAmount: target,
        currentSaved: saved,
        currency,
        targetDate: targetDate || null,
        priority,
      }),
    });
    if (!res.ok) {
      toast({ kind: "error", message: "Gagal" });
      return;
    }
    onAdded();
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div>
        <div className="label mb-1">Template target hidup</div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {GOAL_TEMPLATES.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => useTemplate(t)}
              className="chip"
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
        {hint && <div className="mt-1 text-[11px] text-slate-500">💡 {hint}</div>}
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
        <input
          className="input text-sm w-12 text-center"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={4}
        />
        <input
          className="input text-sm"
          placeholder="Nama goal"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <CurrencySelect value={currency} onChange={setCurrency} />
      <div>
        <label className="label">Target dana</label>
        <MoneyInput value={target} onChange={setTarget} currency={currency} />
      </div>
      <div>
        <label className="label">Udah nabung berapa?</label>
        <MoneyInput value={saved} onChange={setSaved} currency={currency} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Deadline (opsional)</label>
          <input
            type="date"
            className="input text-sm"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Priority</label>
          <select
            className="input text-sm"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          >
            <option value={1}>🔥 High</option>
            <option value={2}>Normal</option>
            <option value={3}>Low</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary w-full">
        Simpan target
      </button>
    </form>
  );
}
