"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { LogOut, Tags, Wallet, Receipt, PiggyBank } from "lucide-react";

export default function SettingPage() {
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      toast({ kind: "error", message: "Gagal simpan" });
      return;
    }
    await update({ user: { primaryCurrency: form.primaryCurrency } });
    toast({ kind: "success", message: "Tersimpan" });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Setting</h1>

      <form className="card space-y-3 p-4" onSubmit={save}>
        <div>
          <label className="label">Nama</label>
          <input
            className="input mt-1"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Currency default</label>
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
        <button type="submit" className="btn-primary w-full">
          Simpan
        </button>
      </form>

      <div className="card divide-y divide-pink-50">
        <QuickLink href="/budget" icon={PiggyBank} label="Target Boros" desc="Atur budget harian/mingguan/bulanan" />
        <QuickLink href="/wajib" icon={Receipt} label="Wajib Bulanan" desc="Income, fix expense, cicilan, tanggungan" />
        <QuickLink href="/akun" icon={Wallet} label="Akun" desc="Rekening, e-wallet, kartu kredit" />
        <QuickLink href="/review" icon={Tags} label="Draft Struk" desc="Review hasil OCR" />
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="btn-outline w-full text-rose-600"
      >
        <LogOut className="h-4 w-4" /> Keluar
      </button>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 active:bg-pink-50/40">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50 text-pink-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-slate-500">{desc}</div>
      </div>
    </Link>
  );
}
