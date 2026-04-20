"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toast";
import { formatMoney, toNumber } from "@/lib/currency";
import { Trash2 } from "lucide-react";

type Budget = {
  id: string;
  categoryId: string;
  amount: string;
  currency: string;
  period: string;
  category: { name: string; color: string };
};

type Category = { id: string; name: string; kind: string };

type Summary = {
  byCategory: Array<{ categoryId: string; name: string; color: string; IDR: number; MYR: number }>;
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const toast = useToast();
  const [form, setForm] = useState({
    categoryId: "",
    amount: 0,
    currency: "IDR" as "IDR" | "MYR" | "USD" | "SGD",
  });

  async function load() {
    const [b, c, s] = await Promise.all([
      fetch("/api/budgets").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/reports/summary").then((r) => r.json()),
    ]);
    setBudgets(b.budgets ?? []);
    setCategories((c.categories ?? []).filter((x: Category) => x.kind === "expense"));
    setSummary(s);
  }

  useEffect(() => {
    load();
  }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId || !form.amount) return;
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      toast({ kind: "error", message: d?.error ?? "Gagal" });
      return;
    }
    setForm({ categoryId: "", amount: 0, currency: form.currency });
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("Hapus budget?")) return;
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const spentByCategory = useMemo(() => {
    const map: Record<string, { IDR: number; MYR: number }> = {};
    (summary?.byCategory ?? []).forEach((c) => {
      map[c.categoryId] = { IDR: c.IDR, MYR: c.MYR };
    });
    return map;
  }, [summary]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Budget Bulanan</h1>
        <p className="text-sm text-slate-500">Set budget per kategori expense per currency.</p>
      </div>

      <form className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-4" onSubmit={onAdd}>
        <div>
          <label className="label">Kategori</label>
          <select
            className="input mt-1"
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            <option value="">— pilih —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Amount / bulan</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input mt-1"
            value={form.amount || ""}
            onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className="label">Currency</label>
          <select
            className="input mt-1"
            value={form.currency}
            onChange={(e) =>
              setForm((f) => ({ ...f, currency: e.target.value as typeof f.currency }))
            }
          >
            <option value="IDR">IDR</option>
            <option value="MYR">MYR</option>
            <option value="USD">USD</option>
            <option value="SGD">SGD</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full">
            Simpan
          </button>
        </div>
      </form>

      <div className="card">
        {budgets.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">Belum ada budget.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {budgets.map((b) => {
              const limit = toNumber(b.amount);
              const spent = spentByCategory[b.categoryId]?.[b.currency === "MYR" ? "MYR" : "IDR"] ?? 0;
              const pct = limit ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
              const warn = pct >= 80;
              return (
                <li key={b.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: b.category.color }} />
                      <span className="font-medium">{b.category.name}</span>
                      <span className="chip">{b.currency}</span>
                      {warn && <span className="chip border-amber-300 bg-amber-50 text-amber-700">&gt;80%</span>}
                    </div>
                    <button className="btn-ghost text-rose-600" onClick={() => onDelete(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Spent: {formatMoney(spent, b.currency === "MYR" ? "MYR" : "IDR")} /{" "}
                    <span className="text-slate-900 font-medium">{formatMoney(limit, b.currency)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full ${pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
