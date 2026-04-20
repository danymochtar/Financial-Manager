"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { Trash2 } from "lucide-react";

type Category = { id: string; name: string; kind: string; icon: string; color: string };

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", kind: "expense" as "expense" | "income", color: "#64748b" });
  const toast = useToast();

  async function load() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setItems(data.categories ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      toast({ kind: "error", message: data?.error ?? "Gagal" });
      return;
    }
    setForm({ name: "", kind: form.kind, color: form.color });
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("Hapus kategori ini?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast({ kind: "error", message: data?.error ?? "Gagal hapus" });
      return;
    }
    load();
  }

  const expenses = items.filter((i) => i.kind === "expense");
  const incomes = items.filter((i) => i.kind === "income");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Kategori</h1>

      <form className="card flex flex-wrap items-end gap-3 p-4" onSubmit={onAdd}>
        <div className="flex-1 min-w-[160px]">
          <label className="label">Nama</label>
          <input
            className="input mt-1"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Kind</label>
          <select
            className="input mt-1"
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as "expense" | "income" }))}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label className="label">Warna</label>
          <input
            type="color"
            className="mt-1 h-9 w-14 rounded-lg border border-slate-200"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
          />
        </div>
        <button type="submit" className="btn-primary">
          Tambah
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryList title="Expense" items={expenses} onDelete={onDelete} />
        <CategoryList title="Income" items={incomes} onDelete={onDelete} />
      </div>
    </div>
  );
}

function CategoryList({
  title,
  items,
  onDelete,
}: {
  title: string;
  items: Category[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="card">
      <div className="border-b border-slate-200 p-4 font-semibold">{title}</div>
      {items.length === 0 ? (
        <div className="p-4 text-sm text-slate-500">Belum ada.</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.name}</span>
              </div>
              <button className="btn-ghost text-rose-600" onClick={() => onDelete(c.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
