"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Plus, X, Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatMoney, formatShort } from "@/lib/currency";
import { ACCOUNT_TEMPLATES } from "@/lib/categories";

type Account = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: string;
  creditLimit: string | null;
  emoji: string;
  color: string;
};

type Upload = {
  id: string;
  extractedBalance: string | null;
  extractedAccountName: string | null;
  currency: string | null;
  status: string;
};

export default function AkunPage() {
  const toast = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState(0);
  const screenshotInput = useRef<HTMLInputElement>(null);
  const [uploadingBalance, setUploadingBalance] = useState(false);
  const [lastUpload, setLastUpload] = useState<{
    uploadId: string;
    draft: { account_name: string | null; balance: number | null; currency: string | null } | null;
    matchedAccountId: string | null;
  } | null>(null);

  async function load() {
    setLoading(true);
    const [a] = await Promise.all([fetch("/api/accounts").then((r) => r.json())]);
    setAccounts(a.accounts ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
    void uploads;
    void setUploads;
  }, []);

  async function saveBalance(id: string) {
    const res = await fetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: editBalance }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast({ kind: "error", message: d?.error ?? "Gagal simpan" });
      return;
    }
    setEditingId(null);
    toast({ kind: "success", message: "Saldo ter-update" });
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("Hapus akun ini?")) return;
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function handleScreenshot(file: File) {
    setUploadingBalance(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/balance-uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: "error", message: data?.error ?? "OCR gagal" });
        return;
      }
      setLastUpload({
        uploadId: data.upload.id,
        draft: data.draft,
        matchedAccountId: data.matchedAccountId,
      });
    } catch (err) {
      toast({ kind: "error", message: (err as Error).message });
    } finally {
      setUploadingBalance(false);
    }
  }

  async function applyUpload(accountId: string, balance: number) {
    if (!lastUpload) return;
    const res = await fetch(`/api/balance-uploads/${lastUpload.uploadId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, balance }),
    });
    if (!res.ok) {
      toast({ kind: "error", message: "Gagal apply" });
      return;
    }
    toast({ kind: "success", message: "Saldo udah di-update 🎉" });
    setLastUpload(null);
    load();
  }

  const totalByCurrency = accounts.reduce(
    (acc, a) => {
      const bal = Number(a.balance);
      const key = a.currency as "IDR" | "MYR" | "USD" | "SGD";
      if (!acc[key]) acc[key] = { asset: 0, debt: 0 };
      if (a.type === "credit_card") acc[key].debt += bal;
      else acc[key].asset += bal;
      return acc;
    },
    {} as Record<string, { asset: number; debt: number }>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Akun Lo</h1>
        <button className="btn-outline text-xs" onClick={() => setShowAdd(true)}>
          <Plus className="h-3 w-3" /> Akun baru
        </button>
      </div>

      {/* Balance screenshot OCR */}
      <button
        type="button"
        onClick={() => screenshotInput.current?.click()}
        className="card flex w-full items-center gap-3 border-2 border-dashed border-pink-200 bg-pink-50/40 p-4"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-500 text-white">
          <Upload className="h-5 w-5" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-sm">Update Saldo via Screenshot</div>
          <div className="text-xs text-slate-500">
            Upload screenshot banking app / e-wallet → auto-extract saldo
          </div>
        </div>
      </button>
      <input
        ref={screenshotInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleScreenshot(f);
          e.target.value = "";
        }}
      />

      {uploadingBalance && (
        <div className="card flex items-center gap-2 p-3 text-sm text-pink-700">
          <Loader2 className="h-4 w-4 animate-spin" /> Lagi nebak saldo dari screenshot...
        </div>
      )}

      {lastUpload && (
        <BalanceApplyDialog
          draft={lastUpload.draft}
          matchedId={lastUpload.matchedAccountId}
          accounts={accounts}
          onApply={applyUpload}
          onClose={() => setLastUpload(null)}
        />
      )}

      {/* Totals */}
      {Object.entries(totalByCurrency).map(([cur, { asset, debt }]) => (
        <div key={cur} className="grid grid-cols-2 gap-3">
          <div className="stat-tile">
            <div className="text-[11px] uppercase tracking-wider text-emerald-600">Aset {cur}</div>
            <div className="mt-1 font-bold">{formatShort(asset, cur)}</div>
          </div>
          <div className="stat-tile">
            <div className="text-[11px] uppercase tracking-wider text-rose-600">Hutang {cur}</div>
            <div className="mt-1 font-bold">{formatShort(debt, cur)}</div>
          </div>
        </div>
      ))}

      {/* Accounts */}
      {loading ? (
        <div className="card p-4 text-sm text-slate-500">Loading…</div>
      ) : accounts.length === 0 ? (
        <div className="card p-4 text-sm text-slate-500">Belum ada akun.</div>
      ) : (
        <div className="space-y-2">
          {accounts.map((a) => (
            <div key={a.id} className="card p-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold">{a.name}</div>
                  <div className="text-[11px] text-slate-500 capitalize">
                    {a.type.replace("_", " ")} · {a.currency}
                  </div>
                </div>
                {editingId === a.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      className="input w-28 py-1.5 text-sm"
                      value={editBalance || ""}
                      onChange={(e) => setEditBalance(Number(e.target.value))}
                    />
                    <button className="p-1.5" onClick={() => saveBalance(a.id)}>
                      <Check className="h-4 w-4 text-emerald-600" />
                    </button>
                    <button className="p-1.5" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                ) : (
                  <button
                    className="text-right"
                    onClick={() => {
                      setEditingId(a.id);
                      setEditBalance(Number(a.balance));
                    }}
                  >
                    <div
                      className={`text-sm font-bold ${
                        a.type === "credit_card" ? "text-rose-600" : "text-slate-900"
                      }`}
                    >
                      {formatMoney(a.balance, a.currency)}
                    </div>
                    {a.creditLimit && (
                      <div className="text-[10px] text-slate-500">
                        limit {formatShort(Number(a.creditLimit), a.currency)}
                      </div>
                    )}
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  className="text-[11px] text-rose-500 hover:underline"
                  onClick={() => onDelete(a.id)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddAccountSheet onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function BalanceApplyDialog({
  draft,
  matchedId,
  accounts,
  onApply,
  onClose,
}: {
  draft: { account_name: string | null; balance: number | null; currency: string | null } | null;
  matchedId: string | null;
  accounts: Account[];
  onApply: (accountId: string, balance: number) => void;
  onClose: () => void;
}) {
  const [accountId, setAccountId] = useState<string>(matchedId ?? accounts[0]?.id ?? "");
  const [balance, setBalance] = useState<number>(draft?.balance ?? 0);

  return (
    <div className="card bg-pink-50/60 p-4 space-y-3 border-pink-300">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Hasil OCR</div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="text-xs text-slate-600">
        Terdeteksi:{" "}
        <strong>{draft?.account_name ?? "Akun gak kebaca"}</strong>
        {draft?.currency && ` · ${draft.currency}`}
        {draft?.balance != null && ` · ${draft.balance.toLocaleString()}`}
      </div>
      <div>
        <label className="label">Apply ke akun</label>
        <select
          className="input mt-1 text-sm"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.emoji} {a.name} ({a.currency})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Saldo baru</label>
        <input
          type="number"
          className="input mt-1 text-sm"
          value={balance || ""}
          onChange={(e) => setBalance(Number(e.target.value))}
        />
      </div>
      <button
        className="btn-primary w-full"
        disabled={!accountId || !balance}
        onClick={() => onApply(accountId, balance)}
      >
        Update saldo
      </button>
    </div>
  );
}

function AddAccountSheet({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const toast = useToast();
  const [custom, setCustom] = useState({
    name: "",
    type: "bank" as "bank" | "ewallet" | "cash" | "credit_card",
    currency: "IDR" as "IDR" | "MYR" | "USD" | "SGD",
    balance: 0,
    creditLimit: 0,
    emoji: "🏦",
    color: "#ec4899",
  });

  async function addFromTemplate(t: (typeof ACCOUNT_TEMPLATES)[number]) {
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: t.name,
        type: t.type,
        currency: t.currency,
        balance: 0,
        emoji: t.emoji,
        color: t.color,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast({ kind: "error", message: d?.error ?? "Gagal" });
      return;
    }
    onAdded();
  }

  async function addCustom() {
    if (!custom.name) return;
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...custom,
        creditLimit: custom.type === "credit_card" ? custom.creditLimit : null,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast({ kind: "error", message: d?.error ?? "Gagal" });
      return;
    }
    onAdded();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-bold">Tambah Akun</div>
          <button onClick={onClose} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="label mb-2">Dari template</div>
        <div className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-y-auto">
          {ACCOUNT_TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => addFromTemplate(t)}
              className="chip"
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
        <div className="label mb-2">Atau manual</div>
        <div className="space-y-2">
          <input
            className="input text-sm"
            placeholder="Nama"
            value={custom.name}
            onChange={(e) => setCustom({ ...custom, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="input text-sm"
              value={custom.type}
              onChange={(e) => setCustom({ ...custom, type: e.target.value as typeof custom.type })}
            >
              <option value="bank">Bank</option>
              <option value="ewallet">E-wallet</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
            </select>
            <select
              className="input text-sm"
              value={custom.currency}
              onChange={(e) =>
                setCustom({ ...custom, currency: e.target.value as typeof custom.currency })
              }
            >
              <option value="IDR">IDR</option>
              <option value="MYR">MYR</option>
              <option value="USD">USD</option>
              <option value="SGD">SGD</option>
            </select>
          </div>
          <input
            type="number"
            className="input text-sm"
            placeholder="Saldo awal"
            value={custom.balance || ""}
            onChange={(e) => setCustom({ ...custom, balance: Number(e.target.value) })}
          />
          {custom.type === "credit_card" && (
            <input
              type="number"
              className="input text-sm"
              placeholder="Limit kartu"
              value={custom.creditLimit || ""}
              onChange={(e) => setCustom({ ...custom, creditLimit: Number(e.target.value) })}
            />
          )}
          <button className="btn-primary w-full" onClick={addCustom}>
            Tambah
          </button>
        </div>
      </div>
    </div>
  );
}
