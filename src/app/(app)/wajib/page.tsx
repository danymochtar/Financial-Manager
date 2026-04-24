"use client";

import { useEffect, useState } from "react";
import { Plus, X, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatShort } from "@/lib/currency";
import { MoneyInput, CurrencySelect } from "@/components/MoneyInput";
import { useT } from "@/lib/i18n";
import { QuickEditSheet, type EditTab, type EditableItem } from "@/components/wajib/QuickEditSheet";
import {
  DEPENDENT_RELATIONSHIPS,
  DEBT_TEMPLATES,
  FIXED_EXPENSE_TEMPLATES,
  INVESTMENT_TEMPLATES,
  GOAL_TEMPLATES,
  ASSET_TEMPLATES,
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
type Asset = {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  emoji: string;
  purchasePrice: string;
  purchaseDate: string;
  currentValue: string;
  currency: string;
  details: string | null;
  note: string | null;
  lastValuationAt: string;
  valuationMethod: string;
  valuationNote: string | null;
};
type Job = {
  id: string;
  employer: string;
  role: string | null;
  startDate: string;
  endDate: string | null;
  monthlySalary: string;
  currency: string;
  country: string;
  note: string | null;
};
type Category = { id: string; name: string; kind: string; emoji: string; nature: string };

type Wishlist = {
  id: string;
  name: string;
  emoji: string;
  estimatedPrice: string;
  currency: string;
  priority: number;
  category: string | null;
  note: string | null;
  financingPlan: string | null;
  projectedDate: string | null;
  decisionNote: string | null;
};

type Tab = "expense" | "income" | "debt" | "dependent" | "investment" | "goal" | "asset" | "career" | "wishlist";

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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [wishlist, setWishlist] = useState<Wishlist[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<{ tab: EditTab; item: EditableItem } | null>(null);

  async function load() {
    const [i, e, d, p, inv, g, a, j, w, c] = await Promise.all([
      fetch("/api/fixed-incomes").then((r) => r.json()),
      fetch("/api/fixed-expenses").then((r) => r.json()),
      fetch("/api/debts").then((r) => r.json()),
      fetch("/api/dependents").then((r) => r.json()),
      fetch("/api/investments").then((r) => r.json()),
      fetch("/api/goals").then((r) => r.json()),
      fetch("/api/assets").then((r) => r.json()),
      fetch("/api/career").then((r) => r.json()),
      fetch("/api/wishlist").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setIncomes(i.fixedIncomes ?? []);
    setExpenses(e.fixedExpenses ?? []);
    setDebts(d.debts ?? []);
    setDependents(p.dependents ?? []);
    setInvestments(inv.investments ?? []);
    setGoals(g.goals ?? []);
    setAssets(a.assets ?? []);
    setJobs(j.jobs ?? []);
    setWishlist(w.wishlist ?? []);
    setCategories(c.categories ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  const TABS: Array<{ k: Tab; l: string }> = [
    { k: "expense", l: t("wajib.tab.expense") },
    { k: "income", l: t("wajib.tab.income") },
    { k: "asset", l: t("wajib.tab.asset") },
    { k: "career", l: t("wajib.tab.career") },
    { k: "debt", l: t("wajib.tab.debt") },
    { k: "dependent", l: t("wajib.tab.dependent") },
    { k: "investment", l: t("wajib.tab.investment") },
    { k: "goal", l: t("wajib.tab.goal") },
    { k: "wishlist", l: t("wajib.tab.wishlist") },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("wajib.title")}</h1>
        <p className="text-sm text-slate-600">{t("wajib.desc")}</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 border border-emerald-100 text-xs">
        {TABS.map(({ k, l }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 font-medium ${
              tab === k ? "bg-emerald-600 text-white" : "text-slate-600"
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
            onClick: () => setEditing({ tab: "expense", item: item as unknown as EditableItem }),
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
            onClick: () => setEditing({ tab: "income", item: item as EditableItem }),
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
            onClick: () => setEditing({ tab: "debt", item: item as EditableItem }),
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
            onClick: () => setEditing({ tab: "dependent", item: dep as EditableItem }),
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
            onClick: () => setEditing({ tab: "investment", item: inv as EditableItem }),
          })}
        />
      )}
      {tab === "asset" && (
        <AssetList
          assets={assets}
          onChanged={load}
          onEdit={(a) => setEditing({ tab: "asset", item: a as EditableItem })}
        />
      )}
      {tab === "career" && (
        <CareerList
          jobs={jobs}
          onEdit={(j) => setEditing({ tab: "career", item: j as EditableItem })}
        />
      )}
      {tab === "goal" && (
        <ItemList
          items={goals}
          emptyLabel="target goal"
          onItemClick={(g) => setEditing({ tab: "goal", item: g as EditableItem })}
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
            };
          }}
        />
      )}
      {tab === "wishlist" && (
        <WishlistList
          items={wishlist}
          onEdit={(w) => setEditing({ tab: "wishlist", item: w as EditableItem })}
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

      {editing && (
        <QuickEditSheet
          tab={editing.tab}
          item={editing.item}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
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
  onItemClick,
}: {
  items: T[];
  emptyLabel: string;
  render: (it: T) => {
    emoji: string;
    title: string;
    sub: string;
    amount: string;
    amountColor?: "rose" | "emerald";
    onClick?: () => void;
  };
  onItemClick?: (it: T) => void;
}) {
  const { t } = useT();
  if (items.length === 0) {
    return <div className="card p-4 text-sm text-slate-500">{t("wajib.item.empty")} — {emptyLabel}.</div>;
  }
  return (
    <div className="space-y-2">
      {items.map((it) => {
        const r = render(it);
        const handler = r.onClick ?? (onItemClick ? () => onItemClick(it) : undefined);
        return (
          <button
            key={it.id}
            type="button"
            onClick={handler}
            className="card flex w-full items-center gap-3 p-3 text-left transition active:scale-[0.99] hover:bg-emerald-50/30"
          >
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
          </button>
        );
      })}
    </div>
  );
}

function AssetList({
  assets,
  onChanged,
  onEdit,
}: {
  assets: Asset[];
  onChanged: () => void;
  onEdit: (a: Asset) => void;
}) {
  const { t, locale } = useT();
  const toast = useToast();
  const [revaluing, setRevaluing] = useState<string | null>(null);

  async function revalue(asset: Asset, force = false) {
    setRevaluing(asset.id);
    try {
      const res = await fetch(`/api/assets/${asset.id}/revalue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force, locale }),
      });
      const data = await res.json();
      if (res.status === 429) {
        toast({
          kind: "info",
          message: t("asset.revalueCooldown").replace("{d}", String(data.daysLeft ?? 0)),
        });
        return;
      }
      if (!res.ok) {
        toast({ kind: "error", message: data?.error ?? t("toast.failed") });
        return;
      }
      toast({ kind: "success", message: t("asset.revalued") });
      onChanged();
    } finally {
      setRevaluing(null);
    }
  }

  if (assets.length === 0) {
    return <div className="card p-4 text-sm text-slate-500">{t("wajib.item.empty")} — {t("asset.empty")}</div>;
  }
  return (
    <div className="space-y-2">
      {assets.map((a) => {
        const purchase = Number(a.purchasePrice);
        const current = Number(a.currentValue);
        const delta = current - purchase;
        const pct = purchase > 0 ? Math.round((delta / purchase) * 100) : 0;
        const deltaColor = delta >= 0 ? "text-emerald-600" : "text-rose-600";
        const staleDays = Math.floor(
          (Date.now() - new Date(a.lastValuationAt).getTime()) / (24 * 3600 * 1000)
        );
        return (
          <div key={a.id} className="card p-3 space-y-2">
            <button
              type="button"
              onClick={() => onEdit(a)}
              className="flex w-full items-center gap-3 text-left active:scale-[0.99]"
            >
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold">{a.name}</div>
                <div className="text-[11px] text-slate-500">
                  {a.details ?? a.subtype ?? a.type}
                </div>
              </div>
            </button>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-2">
                <div className="text-[10px] uppercase text-slate-500">{t("asset.purchase")}</div>
                <div className="font-semibold">{formatShort(purchase, a.currency)}</div>
                <div className="text-[10px] text-slate-500">
                  {new Date(a.purchaseDate).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="rounded-xl bg-emerald-50 p-2">
                <div className="text-[10px] uppercase text-emerald-700">{t("asset.current")}</div>
                <div className="font-semibold">{formatShort(current, a.currency)}</div>
                <div className={`text-[10px] ${deltaColor}`}>
                  {delta >= 0 ? "▲" : "▼"} {Math.abs(pct)}%
                </div>
              </div>
            </div>
            {a.valuationNote && (
              <div className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                ✨ {a.valuationNote}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                {t("asset.lastValued")} {staleDays}d · {a.valuationMethod === "ai_estimate" ? "AI" : "manual"}
              </span>
              <button
                className="btn-outline text-[11px] py-1.5 px-3"
                disabled={revaluing === a.id}
                onClick={() => revalue(a, false)}
              >
                {revaluing === a.id ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> {t("asset.revaluing")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" /> {t("asset.revalue")}
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CareerList({
  jobs,
  onEdit,
}: {
  jobs: Job[];
  onEdit: (j: Job) => void;
}) {
  const { t, locale } = useT();
  if (jobs.length === 0) {
    return <div className="card p-4 text-sm text-slate-500">{t("career.empty")}</div>;
  }
  return (
    <div className="space-y-2">
      {jobs.map((j) => {
        const months = Math.round(
          ((j.endDate ? new Date(j.endDate) : new Date()).getTime() -
            new Date(j.startDate).getTime()) /
            (30.44 * 24 * 3600 * 1000)
        );
        const years = (months / 12).toFixed(1);
        return (
          <button
            type="button"
            key={j.id}
            onClick={() => onEdit(j)}
            className="card flex w-full items-center gap-3 p-3 text-left active:scale-[0.99] hover:bg-emerald-50/30"
          >
            <span className="text-xl">💼</span>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold">
                {j.employer}
                {j.role && <span className="ml-1 text-slate-500 font-normal">· {j.role}</span>}
              </div>
              <div className="text-[11px] text-slate-500">
                {new Date(j.startDate).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
                  month: "short",
                  year: "numeric",
                })}
                {" → "}
                {j.endDate
                  ? new Date(j.endDate).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
                      month: "short",
                      year: "numeric",
                    })
                  : t("career.current")}{" "}
                · {years}y
              </div>
            </div>
            <div className="text-sm font-bold text-emerald-600">
              {formatShort(Number(j.monthlySalary), j.currency)}/mo
            </div>
          </button>
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
      : tab === "asset"
      ? t("wajib.addAsset")
      : tab === "career"
      ? t("wajib.addJob")
      : tab === "wishlist"
      ? t("wajib.addWishlist")
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
        {tab === "asset" && <AssetForm onAdded={onAdded} />}
        {tab === "career" && <JobForm onAdded={onAdded} />}
        {tab === "wishlist" && <WishlistForm onAdded={onAdded} />}
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

function AssetForm({ onAdded }: { onAdded: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const [tpl, setTpl] = useState<(typeof ASSET_TEMPLATES)[number] | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof ASSET_TEMPLATES)[number]["type"]>("property");
  const [subtype, setSubtype] = useState<string | null>(null);
  const [emoji, setEmoji] = useState("🏠");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [currentValue, setCurrentValue] = useState(0);
  const [currency, setCurrency] = useState<"IDR" | "MYR" | "USD" | "SGD">("IDR");
  const [details, setDetails] = useState("");

  function useTpl(t0: (typeof ASSET_TEMPLATES)[number]) {
    setTpl(t0);
    setType(t0.type);
    setSubtype(t0.subtype);
    setEmoji(t0.emoji);
    if (!name) setName(t0.name);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !purchasePrice) return;
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        subtype,
        emoji,
        purchasePrice,
        purchaseDate: new Date(purchaseDate).toISOString(),
        currentValue: currentValue || purchasePrice,
        currency,
        details: details || null,
      }),
    });
    if (!res.ok) {
      toast({ kind: "error", message: t("toast.failed") });
      return;
    }
    toast({ kind: "success", message: t("toast.saved") });
    onAdded();
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <div>
        <div className="label mb-1">{t("wajib.form.template")}</div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {ASSET_TEMPLATES.map((a) => (
            <button
              key={`${a.type}-${a.subtype}`}
              type="button"
              onClick={() => useTpl(a)}
              className="chip"
            >
              {a.emoji} {a.name}
            </button>
          ))}
        </div>
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
          placeholder={t("asset.namePlaceholder")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <textarea
        className="input text-sm min-h-[56px]"
        placeholder={tpl?.detailsHint || t("asset.detailsPlaceholder")}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">{t("asset.purchaseDate")}</label>
          <input
            type="date"
            className="input text-sm"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{t("tx.currency")}</label>
          <CurrencySelect value={currency} onChange={setCurrency} />
        </div>
      </div>
      <div>
        <label className="label">{t("asset.purchasePrice")}</label>
        <MoneyInput value={purchasePrice} onChange={setPurchasePrice} currency={currency} />
      </div>
      <div>
        <label className="label">{t("asset.currentEstimate")}</label>
        <MoneyInput value={currentValue} onChange={setCurrentValue} currency={currency} />
        <p className="mt-1 text-[10px] text-slate-500">{t("asset.currentHint")}</p>
      </div>
      <button type="submit" className="btn-primary w-full">
        {t("save")}
      </button>
    </form>
  );
}

function JobForm({ onAdded }: { onAdded: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const [employer, setEmployer] = useState("");
  const [role, setRole] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>("");
  const [current, setCurrent] = useState(true);
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [currency, setCurrency] = useState<"IDR" | "MYR" | "USD" | "SGD">("IDR");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!employer || !monthlySalary) return;
    const res = await fetch("/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employer,
        role: role || null,
        startDate: new Date(startDate).toISOString(),
        endDate: current ? null : endDate ? new Date(endDate).toISOString() : null,
        monthlySalary,
        currency,
        country: currency === "MYR" ? "MY" : "ID",
      }),
    });
    if (!res.ok) {
      toast({ kind: "error", message: t("toast.failed") });
      return;
    }
    toast({ kind: "success", message: t("toast.saved") });
    onAdded();
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <input
        className="input text-sm"
        placeholder={t("career.employer")}
        required
        value={employer}
        onChange={(e) => setEmployer(e.target.value)}
      />
      <input
        className="input text-sm"
        placeholder={t("career.role")}
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">{t("career.start")}</label>
          <input
            type="date"
            className="input text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{t("career.end")}</label>
          <input
            type="date"
            className="input text-sm disabled:opacity-40"
            disabled={current}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={current} onChange={(e) => setCurrent(e.target.checked)} />
        <span>{t("career.isCurrent")}</span>
      </label>
      <div>
        <label className="label">{t("career.monthlySalary")}</label>
        <MoneyInput value={monthlySalary} onChange={setMonthlySalary} currency={currency} />
      </div>
      <CurrencySelect value={currency} onChange={setCurrency} />
      <button type="submit" className="btn-primary w-full">
        {t("save")}
      </button>
    </form>
  );
}

function WishlistList({
  items,
  onEdit,
}: {
  items: Wishlist[];
  onEdit: (w: Wishlist) => void;
}) {
  const { t, locale } = useT();
  if (items.length === 0) {
    return <div className="card p-4 text-sm text-slate-500">{t("wishlist.empty")}</div>;
  }
  return (
    <div className="space-y-2">
      {items.map((w) => {
        const priorityEmoji = w.priority === 1 ? "🔥" : w.priority === 3 ? "🌙" : "✨";
        const priorityLabel =
          w.priority === 1
            ? t("wishlist.priority.urgent")
            : w.priority === 3
            ? t("wishlist.priority.someday")
            : t("wishlist.priority.nice");
        const projected = w.projectedDate
          ? new Date(w.projectedDate).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
              month: "short",
              year: "numeric",
            })
          : null;
        return (
          <button
            type="button"
            key={w.id}
            onClick={() => onEdit(w)}
            className="card flex w-full items-start gap-3 p-3 text-left active:scale-[0.99] hover:bg-emerald-50/30"
          >
            <span className="text-2xl shrink-0">{w.emoji}</span>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-semibold">{w.name}</div>
                <div className="text-sm font-bold text-emerald-600 shrink-0">
                  {formatShort(Number(w.estimatedPrice), w.currency)}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 text-[11px]">
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                  {priorityEmoji} {priorityLabel}
                </span>
                {w.category && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    {w.category}
                  </span>
                )}
                {projected && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                    🗓 {projected}
                  </span>
                )}
              </div>
              {w.decisionNote && (
                <div className="rounded-lg bg-amber-50/70 px-2 py-1 text-[11px] text-amber-800">
                  🧙 {w.decisionNote}
                </div>
              )}
              {w.financingPlan && (
                <div className="text-[11px] text-slate-500">💳 {w.financingPlan}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function WishlistForm({ onAdded }: { onAdded: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🛒");
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [currency, setCurrency] = useState<"IDR" | "MYR" | "USD" | "SGD">("IDR");
  const [priority, setPriority] = useState(2);
  const [category, setCategory] = useState("");
  const [projectedDate, setProjectedDate] = useState("");
  const [financingPlan, setFinancingPlan] = useState("");
  const [decisionNote, setDecisionNote] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !estimatedPrice) return;
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        emoji,
        estimatedPrice,
        currency,
        priority,
        category: category || null,
        projectedDate: projectedDate || null,
        financingPlan: financingPlan || null,
        decisionNote: decisionNote || null,
      }),
    });
    if (!res.ok) {
      toast({ kind: "error", message: t("toast.failed") });
      return;
    }
    toast({ kind: "success", message: t("toast.saved") });
    onAdded();
  }
  return (
    <form className="space-y-2" onSubmit={submit}>
      <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
        <input
          className="input text-sm w-12 text-center"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={4}
        />
        <input
          className="input text-sm"
          placeholder={t("wishlist.namePlaceholder")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <CurrencySelect value={currency} onChange={setCurrency} />
      <div>
        <label className="label">{t("wishlist.estimatedPrice")}</label>
        <MoneyInput value={estimatedPrice} onChange={setEstimatedPrice} currency={currency} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">{t("wishlist.projectedDate")}</label>
          <input
            type="date"
            className="input text-sm"
            value={projectedDate}
            onChange={(e) => setProjectedDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{t("wajib.form.goalPriority")}</label>
          <select
            className="input text-sm"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          >
            <option value={1}>{t("wishlist.priority.urgent")}</option>
            <option value={2}>{t("wishlist.priority.nice")}</option>
            <option value={3}>{t("wishlist.priority.someday")}</option>
          </select>
        </div>
      </div>
      <input
        className="input text-sm"
        placeholder={t("wishlist.categoryHint")}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <input
        className="input text-sm"
        placeholder={t("wishlist.financingPlanHint")}
        value={financingPlan}
        onChange={(e) => setFinancingPlan(e.target.value)}
      />
      <textarea
        className="input text-sm min-h-[56px]"
        placeholder={t("wishlist.decisionNoteHint")}
        value={decisionNote}
        onChange={(e) => setDecisionNote(e.target.value)}
      />
      <button type="submit" className="btn-primary w-full">
        {t("save")}
      </button>
    </form>
  );
}
