"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatShort } from "@/lib/currency";
import { DEPENDENT_RELATIONSHIPS } from "@/lib/categories";

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
type Category = { id: string; name: string; kind: string; emoji: string; nature: string };

type Tab = "income" | "expense" | "debt" | "dependent";

export default function WajibPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("expense");
  const [incomes, setIncomes] = useState<FixedIncome[]>([]);
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    const [i, e, d, p, c] = await Promise.all([
      fetch("/api/fixed-incomes").then((r) => r.json()),
      fetch("/api/fixed-expenses").then((r) => r.json()),
      fetch("/api/debts").then((r) => r.json()),
      fetch("/api/dependents").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setIncomes(i.fixedIncomes ?? []);
    setExpenses(e.fixedExpenses ?? []);
    setDebts(d.debts ?? []);
    setDependents(p.dependents ?? []);
    setCategories(c.categories ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function remove(kind: Tab, id: string) {
    const endpoint =
      kind === "income"
        ? `/api/fixed-incomes/${id}`
        : kind === "expense"
        ? `/api/fixed-expenses/${id}`
        : kind === "debt"
        ? `/api/debts/${id}`
        : `/api/dependents/${id}`;
    if (!confirm("Hapus?")) return;
    await fetch(endpoint, { method: "DELETE" });
    toast({ kind: "success", message: "Dihapus" });
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wajib Bulanan</h1>
        <p className="text-sm text-slate-600">Income fix, pengeluaran fix, cicilan, tanggungan.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 border border-pink-100 text-xs">
        {(
          [
            { k: "expense", l: "Expense Fix" },
            { k: "income", l: "Income Fix" },
            { k: "debt", l: "Cicilan" },
            { k: "dependent", l: "Tanggungan" },
          ] as Array<{ k: Tab; l: string }>
        ).map(({ k, l }) => (
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
        <Plus className="h-4 w-4" /> Tambah {tab === "expense" ? "expense fix" : tab === "income" ? "income fix" : tab === "debt" ? "cicilan" : "tanggungan"}
      </button>

      {tab === "expense" && (
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <EmptyState label="expense fix" />
          ) : (
            expenses.map((e) => (
              <Item
                key={e.id}
                emoji={e.category.emoji}
                title={e.name}
                sub={`${e.category.name} · tgl ${e.dayOfMonth ?? "-"}`}
                amount={formatShort(Number(e.amount), e.currency)}
                onDelete={() => remove("expense", e.id)}
              />
            ))
          )}
        </div>
      )}
      {tab === "income" && (
        <div className="space-y-2">
          {incomes.length === 0 ? (
            <EmptyState label="income fix" />
          ) : (
            incomes.map((i) => (
              <Item
                key={i.id}
                emoji="💰"
                title={i.name}
                sub={`${i.account?.name ?? "—"} · tgl ${i.dayOfMonth ?? "-"}`}
                amount={`+${formatShort(Number(i.amount), i.currency)}`}
                amountColor="emerald"
                onDelete={() => remove("income", i.id)}
              />
            ))
          )}
        </div>
      )}
      {tab === "debt" && (
        <div className="space-y-2">
          {debts.length === 0 ? (
            <EmptyState label="cicilan" />
          ) : (
            debts.map((d) => (
              <Item
                key={d.id}
                emoji="⛓️"
                title={d.name}
                sub={`sisa ${formatShort(Number(d.remainingAmount), d.currency)}`}
                amount={`${formatShort(Number(d.monthlyPayment), d.currency)}/bln`}
                onDelete={() => remove("debt", d.id)}
              />
            ))
          )}
        </div>
      )}
      {tab === "dependent" && (
        <div className="space-y-2">
          {dependents.length === 0 ? (
            <EmptyState label="tanggungan" />
          ) : (
            dependents.map((dep) => (
              <Item
                key={dep.id}
                emoji={DEPENDENT_RELATIONSHIPS.find((r) => r.value === dep.relationship)?.emoji ?? "👤"}
                title={dep.name}
                sub={
                  DEPENDENT_RELATIONSHIPS.find((r) => r.value === dep.relationship)?.label ?? dep.relationship
                }
                amount={`${formatShort(Number(dep.monthlyAmount), dep.currency)}/bln`}
                onDelete={() => remove("dependent", dep.id)}
              />
            ))
          )}
        </div>
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

function EmptyState({ label }: { label: string }) {
  return <div className="card p-4 text-sm text-slate-500">Belum ada {label}.</div>;
}

function Item({
  emoji,
  title,
  sub,
  amount,
  amountColor = "rose",
  onDelete,
}: {
  emoji: string;
  title: string;
  sub: string;
  amount: string;
  amountColor?: "rose" | "emerald";
  onDelete: () => void;
}) {
  return (
    <div className="card flex items-center gap-3 p-3">
      <span className="text-xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold">{title}</div>
        <div className="text-[11px] text-slate-500">{sub}</div>
      </div>
      <div
        className={`text-sm font-bold ${amountColor === "emerald" ? "text-emerald-600" : "text-rose-600"}`}
      >
        {amount}
      </div>
      <button
        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </button>
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
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, string | number>>({
    name: "",
    amount: 0,
    currency: "IDR",
    dayOfMonth: 1,
    categoryId: categories.find((c) => c.kind === "expense" && c.nature === "fixed")?.id ?? "",
    relationship: "parent",
    remainingAmount: 0,
    monthlyPayment: 0,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "expense") {
        const nextDue = new Date();
        nextDue.setDate(Number(form.dayOfMonth));
        await fetch("/api/fixed-expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: form.categoryId,
            name: form.name,
            amount: Number(form.amount),
            currency: form.currency,
            dayOfMonth: Number(form.dayOfMonth),
            nextDue: nextDue.toISOString(),
          }),
        });
      } else if (tab === "income") {
        const nextDue = new Date();
        nextDue.setDate(Number(form.dayOfMonth));
        await fetch("/api/fixed-incomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            amount: Number(form.amount),
            currency: form.currency,
            dayOfMonth: Number(form.dayOfMonth),
            nextDue: nextDue.toISOString(),
          }),
        });
      } else if (tab === "debt") {
        await fetch("/api/debts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            totalPrincipal: Number(form.remainingAmount),
            remainingAmount: Number(form.remainingAmount),
            monthlyPayment: Number(form.monthlyPayment),
            currency: form.currency,
          }),
        });
      } else {
        await fetch("/api/dependents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            relationship: form.relationship,
            monthlyAmount: Number(form.amount),
            currency: form.currency,
          }),
        });
      }
      toast({ kind: "success", message: "Tersimpan" });
      onAdded();
    } catch (err) {
      toast({ kind: "error", message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const fixedCats = categories.filter((c) => c.kind === "expense" && c.nature === "fixed");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        className="w-full max-w-md space-y-3 rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">Tambah baru</div>
          <button type="button" onClick={onClose} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <input
          className="input text-sm"
          placeholder="Nama"
          required
          value={String(form.name)}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {tab === "debt" ? (
          <>
            <input
              type="number"
              className="input text-sm"
              placeholder="Sisa hutang"
              required
              value={form.remainingAmount as number || ""}
              onChange={(e) => setForm({ ...form, remainingAmount: Number(e.target.value) })}
            />
            <input
              type="number"
              className="input text-sm"
              placeholder="Cicilan/bulan"
              required
              value={form.monthlyPayment as number || ""}
              onChange={(e) => setForm({ ...form, monthlyPayment: Number(e.target.value) })}
            />
          </>
        ) : (
          <input
            type="number"
            className="input text-sm"
            placeholder="Amount"
            required
            value={form.amount as number || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          />
        )}
        <select
          className="input text-sm"
          value={String(form.currency)}
          onChange={(e) => setForm({ ...form, currency: e.target.value })}
        >
          <option value="IDR">IDR</option>
          <option value="MYR">MYR</option>
        </select>
        {tab === "expense" && (
          <select
            className="input text-sm"
            value={String(form.categoryId)}
            required
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">— kategori —</option>
            {fixedCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        )}
        {(tab === "expense" || tab === "income") && (
          <input
            type="number"
            min={1}
            max={31}
            className="input text-sm"
            placeholder="Hari jatuh tempo"
            value={form.dayOfMonth as number || ""}
            onChange={(e) => setForm({ ...form, dayOfMonth: Number(e.target.value) })}
          />
        )}
        {tab === "dependent" && (
          <select
            className="input text-sm"
            value={String(form.relationship)}
            onChange={(e) => setForm({ ...form, relationship: e.target.value })}
          >
            {DEPENDENT_RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.emoji} {r.label}
              </option>
            ))}
          </select>
        )}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Nyimpen..." : "Simpan"}
        </button>
      </form>
    </div>
  );
}
