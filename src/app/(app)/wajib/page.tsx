"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatShort } from "@/lib/currency";
import { MoneyInput, CurrencySelect } from "@/components/MoneyInput";
import { useT } from "@/lib/i18n";
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
  const { t } = useT();
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

  async function remove(kind: Tab, id: string) {
    if (!confirm(t("wajib.form.deleteConfirm"))) return;
    const map: Record<Tab, string> = {
      expense: "fixed-expenses",
      income: "fixed-incomes",
      debt: "debts",
      dependent: "dependents",
      investment: "investments",
      goal: "goals",
    };
    await fetch(`/api/${map[kind]}/${id}`, { method: "DELETE" });
    toast({ kind: "success", message: t("toast.deleted") });
    load();
  }

  const TABS: Array<{ k: Tab; l: string }> = [
    { k: "expense", l: t("wajib.tab.expense") },
    { k: "income", l: t("wajib.tab.income") },
    { k: "debt", l: t("wajib.tab.debt") },
    { k: "dependent", l: t("wajib.tab.dependent") },
    { k: "investment", l: t("wajib.tab.investment") },
    { k: "goal", l: t("wajib.tab.goal") },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("wajib.title")}</h1>
        <p className="text-sm text-slate-600">{t("wajib.desc")}</p>
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
        <Plus className="h-4 w-4" /> {t("wajib.addBtn")} {TABS.find((x) => x.k === tab)?.l}
      </button>

      {tab === "expense" && (
        <ItemList
          items={expenses}
          emptyLabel="expense fix"
          render={(item) => ({
            emoji: item.category.emoji,
            title: item.name,
            sub: `${item.category.name} · d ${item.dayOfMonth ?? "-"}`,
            amount: formatShort(Number(item.amount), item.currency),
            onDelete: () => remove("expense", item.id),
          })}
        />
      )}
      {tab === "income" && (
        <ItemList
          items={incomes}
          emptyLabel="income fix"
          render={(item) => ({
            emoji: "💰",
            title: item.name,
            sub: `${item.account?.name ?? "—"} · d ${item.dayOfMonth ?? "-"}`,
            amount: `+${formatShort(Number(item.amount), item.currency)}`,
            amountColor: "emerald",
            onDelete: () => remove("income", item.id),
          })}
        />
      )}
      {tab === "debt" && (
        <ItemList
          items={debts}
          emptyLabel="cicilan"
          render={(item) => ({
            emoji: "⛓️",
            title: item.name,
            sub: `${formatShort(Number(item.remainingAmount), item.currency)}`,
            amount: `${formatShort(Number(item.monthlyPayment), item.currency)}/mo`,
            onDelete: () => remove("debt", item.id),
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
            amount: `${formatShort(Number(dep.monthlyAmount), dep.currency)}/mo`,
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
            sub: `${t(`wajib.type.${inv.type}`)}${inv.platform ? ` · ${inv.platform}` : ""}`,
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
  return p === 1 ? "HIGH" : p === 3 ? "LOW" : "normal";
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
  const { t } = useT();
  if (items.length === 0) {
    return <div className="card p-4 text-sm text-slate-500">{t("wajib.item.empty")} — {emptyLabel}.</div>;
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
  const { t } = useT();
  const title =
    tab === "investment"
      ? t("wajib.addInvestment")
      : tab === "goal"
      ? t("wajib.addGoal")
      : t("wajib.addTitle");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md space-y-3 rounded-3xl bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">{title}</div>
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
  const { t } = useT();
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
      toast({ kind: "error", message: d?.error ?? t("toast.failed") });
      return;
    }
    toast({ kind: "success", message: t("toast.saved") });
    onAdded();
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div>
        <div className="label mb-1">{t("wajib.form.templateQuick")}</div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {FIXED_EXPENSE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              type="button"
              onClick={() => useTemplate(tpl)}
              className="chip"
            >
              {tpl.emoji} {tpl.name}
            </button>
          ))}
        </div>
      </div>
      <input
        className="input text-sm"
        placeholder={t("wajib.form.name")}
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
          placeholder={t("wajib.form.payDay")}
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
        <option value="">{t("wajib.form.category")}</option>
        {fixedCats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.emoji} {c.name}
          </option>
        ))}
      </select>
      <button type="submit" className="btn-primary w-full">
        {t("save")}
      </button>
    </form>
  );
}

function IncomeForm({ onAdded }: { onAdded: () => void }) {
  const { t } = useT();
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
      toast({ kind: "error", message: t("toast.failed") });
      return;
    }
    onAdded();
  }
  return (
    <form className="space-y-2" onSubmit={submit}>
      <input
        className="input text-sm"
        placeholder={t("wajib.form.incomeNameHint")}
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
          placeholder={t("wajib.form.payDate")}
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(Number(e.target.value))}
        />
      </div>
      <MoneyInput value={amount} onChange={setAmount} currency={currency} />
      <button type="submit" className="btn-primary w-full">
        {t("save")}
      </button>
    </form>
  );
}

function DebtForm({ onAdded }: { onAdded: () => void }) {
  const { t } = useT();
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
      toast({ kind: "error", message: t("toast.failed") });
      return;
    }
    onAdded();
  }
  return (
    <form className="space-y-2" onSubmit={submit}>
      <div>
        <div className="label mb-1">{t("wajib.form.template")}</div>
        <div className="flex flex-wrap gap-1.5">
          {DEBT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              type="button"
              onClick={() => setName(tpl.name)}
              className="chip"
            >
              {tpl.emoji} {tpl.name}
            </button>
          ))}
        </div>
      </div>
      <input
        className="input text-sm"
        placeholder={t("wajib.form.name")}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <CurrencySelect value={currency} onChange={setCurrency} />
      <div>
        <label className="label">{t("wajib.form.remaining")}</label>
        <MoneyInput value={remaining} onChange={setRemaining} currency={currency} />
      </div>
      <div>
        <label className="label">{t("wajib.form.monthly")}</label>
        <MoneyInput value={monthly} onChange={setMonthly} currency={currency} />
      </div>
      <button type="submit" className="btn-primary w-full">
        {t("save")}
      </button>
    </form>
  );
}

function DependentForm({ onAdded }: { onAdded: () => void }) {
  const { t } = useT();
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
      toast({ kind: "error", message: t("toast.failed") });
      return;
    }
    onAdded();
  }
  return (
    <form className="space-y-2" onSubmit={submit}>
      <input
        className="input text-sm"
        placeholder={t("onb.f.nameDep")}
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
        {t("save")}
      </button>
    </form>
  );
}

function InvestmentForm({ onAdded }: { onAdded: () => void }) {
  const { t } = useT();
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
      toast({ kind: "error", message: t("toast.failed") });
      return;
    }
    onAdded();
  }

  const typeLabel = (typ: typeof type) => t(`wajib.type.${typ}`);

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div>
        <div className="label mb-1">{t("wajib.form.template")}</div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {INVESTMENT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              type="button"
              onClick={() => useTemplate(tpl)}
              className="chip"
            >
              {tpl.emoji} {tpl.name}
            </button>
          ))}
        </div>
      </div>
      <input
        className="input text-sm"
        placeholder={t("wajib.form.investNameHint")}
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
          <option value="gold">{typeLabel("gold")}</option>
          <option value="crypto">{typeLabel("crypto")}</option>
          <option value="stock">{typeLabel("stock")}</option>
          <option value="mutual_fund">{typeLabel("mutual_fund")}</option>
          <option value="forex">{typeLabel("forex")}</option>
          <option value="deposit">{typeLabel("deposit")}</option>
          <option value="bond">{typeLabel("bond")}</option>
          <option value="property">{typeLabel("property")}</option>
          <option value="other">{typeLabel("other")}</option>
        </select>
        <CurrencySelect value={currency} onChange={setCurrency} />
      </div>
      <input
        className="input text-sm"
        placeholder={t("wajib.form.platform")}
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
      />
      <div>
        <label className="label">{t("wajib.form.currentValue")}</label>
        <MoneyInput value={value} onChange={setValue} currency={currency} />
      </div>
      <button type="submit" className="btn-primary w-full">
        {t("save")}
      </button>
    </form>
  );
}

function GoalForm({ onAdded }: { onAdded: () => void }) {
  const { t } = useT();
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
      toast({ kind: "error", message: t("toast.failed") });
      return;
    }
    onAdded();
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div>
        <div className="label mb-1">{t("wajib.form.lifeTemplate")}</div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {GOAL_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              type="button"
              onClick={() => useTemplate(tpl)}
              className="chip"
            >
              {tpl.emoji} {tpl.name}
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
          placeholder={t("wajib.form.goalName")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <CurrencySelect value={currency} onChange={setCurrency} />
      <div>
        <label className="label">{t("wajib.form.goalTarget")}</label>
        <MoneyInput value={target} onChange={setTarget} currency={currency} />
      </div>
      <div>
        <label className="label">{t("wajib.form.goalSaved")}</label>
        <MoneyInput value={saved} onChange={setSaved} currency={currency} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">{t("wajib.form.goalDeadline")}</label>
          <input
            type="date"
            className="input text-sm"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{t("wajib.form.goalPriority")}</label>
          <select
            className="input text-sm"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          >
            <option value={1}>{t("wajib.form.priorityHigh")}</option>
            <option value={2}>{t("wajib.form.priorityNormal")}</option>
            <option value={3}>{t("wajib.form.priorityLow")}</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary w-full">
        {t("wajib.form.saveGoal")}
      </button>
    </form>
  );
}
