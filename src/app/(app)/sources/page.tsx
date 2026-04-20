"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { Trash2 } from "lucide-react";

type Source = { id: string; name: string; country: string; color: string };

export default function SourcesPage() {
  const [items, setItems] = useState<Source[]>([]);
  const [form, setForm] = useState({ name: "", country: "ID", color: "#3b82f6" });
  const toast = useToast();

  async function load() {
    const res = await fetch("/api/sources");
    const data = await res.json();
    setItems(data.sources ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      toast({ kind: "error", message: data?.error ?? "Gagal" });
      return;
    }
    setForm({ name: "", country: form.country, color: form.color });
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("Hapus source ini?")) return;
    const res = await fetch(`/api/sources/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast({ kind: "error", message: data?.error ?? "Gagal hapus" });
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sources</h1>
        <p className="text-sm text-slate-500">Pemisah transaksi per sumber (Kerjaan Malaysia / Project Indonesia / Pribadi).</p>
      </div>

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
          <label className="label">Negara (2 huruf)</label>
          <input
            className="input mt-1 w-20"
            maxLength={2}
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))}
          />
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

      <div className="card">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">Belum ada source.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((s) => (
              <li key={s.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{s.name}</span>
                  <span className="chip">{s.country}</span>
                </div>
                <button className="btn-ghost text-rose-600" onClick={() => onDelete(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
