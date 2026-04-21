"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatShort } from "@/lib/currency";
import { useT } from "@/lib/i18n";

type Budget = {
  id: string;
  scope: string;
  period: "daily" | "weekly" | "monthly";
  categoryId: string | null;
  category: { name: string; emoji: string } | null;
  amount: string;
  currency: string;
};
type Category = { id: string; name: string; kind: string; emoji: string };

export default function BudgetPage() {
  const { t } = useT();
  const toast = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [b, c] = await Promise.all([
      fetch("/api/budgets").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setBudgets(b.budgets ?? []);
    setCategories((c.categories as Category[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function saveOverall(period: "daily" | "weekly" | "monthly", currency: "IDR" | "MYR", amount: number) {
    if (!amount) return;
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "overall",
        period,
        currency,
        amount,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast({ kind: "error", message: d?.error ?? t("toast.failed") });
      return;
    }
    toast({ kind: "success", message: t("toast.saved") });
    load();
  }

  async function deleteBudget(id: string) {
    if (!confirm(t("budget.deleteConfirm"))) return;
    // Budgets DELETE endpoint:
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    load();
  }

  const overallByKey = (period: "daily" | "weekly" | "monthly", currency: "IDR" | "MYR") =>
    budgets.find((b) => b.scope === "overall" && b.period === period && b.currency === currency);

  const catBudgets = budgets.filter((b) => b.scope === "category");
  const expenseCats = categories.filter((c) => c.kind === "expense");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("budget.title")}</h1>
        <p className="text-sm text-slate-600">{t("budget.desc")}</p>
      </div>

      {loading ? (
        <div className="card p-4 text-sm text-slate-500">{t("loading")}</div>
      ) : (
        <>
          <div className="card p-4 space-y-4">
            <div className="text-sm font-semibold text-pink-700">{t("budget.overallIDR")}</div>
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <BudgetRow
                key={`idr-${p}`}
                label={p === "daily" ? t("onb.b.daily") : p === "weekly" ? t("onb.b.weekly") : t("onb.b.monthly")}
                current={overallByKey(p, "IDR")?.amount}
                currency="IDR"
                onSave={(v) => saveOverall(p, "IDR", v)}
                existingId={overallByKey(p, "IDR")?.id}
                onDelete={() => {
                  const b = overallByKey(p, "IDR");
                  if (b) deleteBudget(b.id);
                }}
              />
            ))}
          </div>

          <div className="card p-4 space-y-4">
            <div className="text-sm font-semibold text-pink-700">{t("budget.overallMYR")}</div>
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <BudgetRow
                key={`myr-${p}`}
                label={p === "daily" ? t("onb.b.daily") : p === "weekly" ? t("onb.b.weekly") : t("onb.b.monthly")}
                current={overallByKey(p, "MYR")?.amount}
                currency="MYR"
                onSave={(v) => saveOverall(p, "MYR", v)}
                existingId={overallByKey(p, "MYR")?.id}
                onDelete={() => {
                  const b = overallByKey(p, "MYR");
                  if (b) deleteBudget(b.id);
                }}
              />
            ))}
          </div>

          <div className="card p-4">
            <div className="mb-3 text-sm font-semibold text-pink-700">{t("budget.perCategory")}</div>
            <CategoryBudgetForm categories={expenseCats} onSaved={load} />
            {catBudgets.length > 0 && (
              <div className="mt-3 space-y-2">
                {catBudgets.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl bg-pink-50/60 p-2 text-sm">
                    <div>
                      <span className="font-medium">{b.category?.emoji} {b.category?.name}</span>{" "}
                      <span className="text-xs text-slate-500">{b.period}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {formatShort(Number(b.amount), b.currency)}
                      </span>
                      <button
                        className="text-slate-400 hover:text-rose-500"
                        onClick={() => deleteBudget(b.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BudgetRow({
  label,
  current,
  currency,
  onSave,
  existingId,
  onDelete,
}: {
  label: string;
  current: string | undefined;
  currency: "IDR" | "MYR";
  onSave: (v: number) => void;
  existingId?: string;
  onDelete?: () => void;
}) {
  const [v, setV] = useState<string>(current ? String(Number(current)) : "");
  useEffect(() => {
    setV(current ? String(Number(current)) : "");
  }, [current]);
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-sm">{label}</span>
      <input
        type="number"
        min="0"
        className="input flex-1 py-2 text-sm"
        placeholder="0 = skip"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const n = Number(v);
          if (n > 0 && String(n) !== current) onSave(n);
        }}
      />
      <span className="text-xs text-slate-500">{currency}</span>
      {existingId && onDelete && (
        <button className="text-slate-400 hover:text-rose-500" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function CategoryBudgetForm({
  categories,
  onSaved,
}: {
  categories: Category[];
  onSaved: () => void;
}) {
  const { t } = useT();
  const toast = useToast();
  const [form, setForm] = useState({
    categoryId: "",
    period: "monthly" as "daily" | "weekly" | "monthly",
    amount: 0,
    currency: "IDR" as "IDR" | "MYR",
  });
  async function add() {
    if (!form.categoryId || !form.amount) return;
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "category",
        categoryId: form.categoryId,
        period: form.period,
        amount: form.amount,
        currency: form.currency,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast({ kind: "error", message: d?.error ?? t("toast.failed") });
      return;
    }
    setForm({ ...form, amount: 0 });
    onSaved();
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        className="input text-sm col-span-2"
        value={form.categoryId}
        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
      >
        <option value="">{t("wajib.form.selectCategory")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.emoji} {c.name}
          </option>
        ))}
      </select>
      <select
        className="input text-sm"
        value={form.period}
        onChange={(e) => setForm({ ...form, period: e.target.value as typeof form.period })}
      >
        <option value="daily">{t("onb.b.daily")}</option>
        <option value="weekly">{t("onb.b.weekly")}</option>
        <option value="monthly">{t("onb.b.monthly")}</option>
      </select>
      <select
        className="input text-sm"
        value={form.currency}
        onChange={(e) => setForm({ ...form, currency: e.target.value as "IDR" | "MYR" })}
      >
        <option value="IDR">IDR</option>
        <option value="MYR">MYR</option>
      </select>
      <input
        type="number"
        className="input text-sm col-span-2"
        placeholder={t("wajib.form.amount")}
        value={form.amount || ""}
        onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
      />
      <button className="btn-primary col-span-2" onClick={add}>
        {t("budget.setBtn")}
      </button>
    </div>
  );
}
