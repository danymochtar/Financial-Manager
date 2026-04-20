"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    primaryCurrency: "IDR" as "IDR" | "MYR" | "USD" | "SGD",
  });

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name ?? "",
        primaryCurrency: (session.user.primaryCurrency as typeof form.primaryCurrency) ?? "IDR",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      toast({ kind: "error", message: d?.error ?? "Gagal simpan" });
      return;
    }
    await update({ user: { primaryCurrency: form.primaryCurrency } });
    toast({ kind: "success", message: "Tersimpan" });
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <form className="card space-y-3 p-5" onSubmit={onSubmit}>
        <div>
          <label className="label">Nama</label>
          <input
            className="input mt-1"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Primary currency (tampilan default dashboard)</label>
          <select
            className="input mt-1"
            value={form.primaryCurrency}
            onChange={(e) =>
              setForm((f) => ({ ...f, primaryCurrency: e.target.value as typeof f.primaryCurrency }))
            }
          >
            <option value="IDR">IDR</option>
            <option value="MYR">MYR</option>
            <option value="USD">USD</option>
            <option value="SGD">SGD</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Simpan
        </button>
      </form>
    </div>
  );
}
