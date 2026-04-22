"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/components/Toast";
import { MoneyInput, CurrencySelect } from "@/components/MoneyInput";
import { useT } from "@/lib/i18n";
import { DEPENDENT_RELATIONSHIPS } from "@/lib/categories";

export type EditTab =
  | "expense"
  | "income"
  | "debt"
  | "dependent"
  | "investment"
  | "goal"
  | "asset"
  | "career";

type Currency = "IDR" | "MYR" | "USD" | "SGD";

// Initial data shapes accepted (loose — we only read the fields each tab needs)
export type EditableItem = {
  id: string;
  name?: string;
  employer?: string;
  role?: string | null;
  amount?: string;
  monthlyPayment?: string;
  remainingAmount?: string;
  monthlyAmount?: string;
  monthlySalary?: string;
  currentValue?: string;
  currentSaved?: string;
  targetAmount?: string;
  purchasePrice?: string;
  platform?: string | null;
  details?: string | null;
  dayOfMonth?: number | null;
  currency?: string;
  relationship?: string;
  targetDate?: string | null;
  startDate?: string;
  endDate?: string | null;
  priority?: number;
  emoji?: string;
};

const API_PATH: Record<EditTab, string> = {
  expense: "/api/fixed-expenses",
  income: "/api/fixed-incomes",
  debt: "/api/debts",
  dependent: "/api/dependents",
  investment: "/api/investments",
  goal: "/api/goals",
  asset: "/api/assets",
  career: "/api/career",
};

export function QuickEditSheet({
  tab,
  item,
  onClose,
  onSaved,
}: {
  tab: EditTab;
  item: EditableItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  // Draft state keyed by field — only the fields relevant to this tab are set.
  const [name, setName] = useState(item.name ?? item.employer ?? "");
  const [role, setRole] = useState(item.role ?? "");
  const [emoji, setEmoji] = useState(item.emoji ?? "");
  const [primaryAmount, setPrimaryAmount] = useState<number>(() => {
    if (tab === "debt") return Number(item.monthlyPayment ?? 0);
    if (tab === "dependent") return Number(item.monthlyAmount ?? 0);
    if (tab === "investment") return Number(item.currentValue ?? 0);
    if (tab === "goal") return Number(item.targetAmount ?? 0);
    if (tab === "asset") return Number(item.currentValue ?? 0);
    if (tab === "career") return Number(item.monthlySalary ?? 0);
    return Number(item.amount ?? 0);
  });
  const [secondaryAmount, setSecondaryAmount] = useState<number>(() => {
    if (tab === "debt") return Number(item.remainingAmount ?? 0);
    if (tab === "goal") return Number(item.currentSaved ?? 0);
    return 0;
  });
  const currency = (item.currency as Currency) ?? "IDR";
  const [dayOfMonth, setDayOfMonth] = useState<number>(item.dayOfMonth ?? 1);
  const [relationship, setRelationship] = useState<string>(item.relationship ?? "parent");
  const [platform, setPlatform] = useState<string>(item.platform ?? "");
  const [details, setDetails] = useState<string>(item.details ?? "");
  const [targetDate, setTargetDate] = useState<string>(
    item.targetDate ? new Date(item.targetDate).toISOString().slice(0, 10) : ""
  );
  const [priority, setPriority] = useState<number>(item.priority ?? 2);
  const [isCurrent, setIsCurrent] = useState<boolean>(
    tab === "career" ? !item.endDate : false
  );
  const [endDate, setEndDate] = useState<string>(
    item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : ""
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body: Record<string, unknown> = {};
      if (tab === "expense" || tab === "income") {
        body.name = name;
        body.amount = primaryAmount;
        body.dayOfMonth = dayOfMonth;
      } else if (tab === "debt") {
        body.name = name;
        body.monthlyPayment = primaryAmount;
        body.remainingAmount = secondaryAmount;
      } else if (tab === "dependent") {
        body.name = name;
        body.monthlyAmount = primaryAmount;
        body.relationship = relationship;
      } else if (tab === "investment") {
        body.name = name;
        body.currentValue = primaryAmount;
        if (platform) body.platform = platform;
      } else if (tab === "goal") {
        body.name = name;
        body.emoji = emoji || "🎯";
        body.targetAmount = primaryAmount;
        body.currentSaved = secondaryAmount;
        body.targetDate = targetDate || null;
        body.priority = priority;
      } else if (tab === "asset") {
        body.name = name;
        body.emoji = emoji || "💎";
        body.currentValue = primaryAmount;
        body.details = details || null;
      } else if (tab === "career") {
        body.employer = name;
        body.role = role || null;
        body.monthlySalary = primaryAmount;
        body.endDate = isCurrent ? null : endDate ? new Date(endDate).toISOString() : null;
      }

      const res = await fetch(`${API_PATH[tab]}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ kind: "error", message: d?.error ?? t("toast.saveFailed") });
        return;
      }
      toast({ kind: "success", message: t("toast.saved") });
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm(t("wajib.form.deleteConfirm"))) return;
    const res = await fetch(`${API_PATH[tab]}/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      toast({ kind: "error", message: d?.error ?? t("toast.deleteFailed") });
      return;
    }
    toast({ kind: "success", message: t("toast.deleted") });
    onSaved();
  }

  const nameLabel =
    tab === "career" ? t("career.employer") : t("wajib.form.name");
  const primaryLabel =
    tab === "debt"
      ? t("wajib.form.monthly")
      : tab === "dependent"
      ? t("wajib.form.monthly")
      : tab === "investment"
      ? t("wajib.form.currentValue")
      : tab === "goal"
      ? t("wajib.form.goalTarget")
      : tab === "asset"
      ? t("asset.current")
      : tab === "career"
      ? t("career.monthlySalary")
      : t("wajib.form.amount");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        className="w-full max-w-md space-y-3 rounded-3xl bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">Edit</div>
          <button type="button" onClick={onClose} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {(tab === "goal" || tab === "asset") && (
          <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
            <input
              className="input text-sm w-14 text-center"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={4}
            />
            <input
              className="input text-sm"
              placeholder={nameLabel}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        {tab !== "goal" && tab !== "asset" && (
          <div>
            <label className="label">{nameLabel}</label>
            <input
              className="input text-sm mt-1"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        {tab === "career" && (
          <div>
            <label className="label">{t("career.role")}</label>
            <input
              className="input text-sm mt-1"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        )}

        {tab === "dependent" && (
          <div>
            <label className="label">{DEPENDENT_RELATIONSHIPS.find((r) => r.value === relationship)?.label ?? relationship}</label>
            <select
              className="input text-sm mt-1"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              {DEPENDENT_RELATIONSHIPS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.emoji} {r.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {tab === "investment" && (
          <div>
            <label className="label">Platform</label>
            <input
              className="input text-sm mt-1"
              placeholder={t("wajib.form.platform")}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
          </div>
        )}

        {tab === "asset" && (
          <div>
            <label className="label">Detail</label>
            <textarea
              className="input text-sm mt-1 min-h-[56px]"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="label">{primaryLabel}</label>
          <MoneyInput value={primaryAmount} onChange={setPrimaryAmount} currency={currency} />
        </div>

        {tab === "debt" && (
          <div>
            <label className="label">{t("wajib.form.remaining")}</label>
            <MoneyInput value={secondaryAmount} onChange={setSecondaryAmount} currency={currency} />
          </div>
        )}

        {tab === "goal" && (
          <div>
            <label className="label">{t("wajib.form.goalSaved")}</label>
            <MoneyInput value={secondaryAmount} onChange={setSecondaryAmount} currency={currency} />
          </div>
        )}

        {(tab === "expense" || tab === "income") && (
          <div>
            <label className="label">
              {tab === "income" ? t("wajib.form.payDate") : t("wajib.form.payDay")}
            </label>
            <input
              type="number"
              min={1}
              max={31}
              className="input text-sm mt-1"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
            />
          </div>
        )}

        {tab === "goal" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">{t("wajib.form.goalDeadline")}</label>
              <input
                type="date"
                className="input text-sm mt-1"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">{t("wajib.form.goalPriority")}</label>
              <select
                className="input text-sm mt-1"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              >
                <option value={1}>{t("wajib.form.priorityHigh")}</option>
                <option value={2}>{t("wajib.form.priorityNormal")}</option>
                <option value={3}>{t("wajib.form.priorityLow")}</option>
              </select>
            </div>
          </div>
        )}

        {tab === "career" && (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
              />
              <span>{t("career.isCurrent")}</span>
            </label>
            {!isCurrent && (
              <div>
                <label className="label">{t("career.end")}</label>
                <input
                  type="date"
                  className="input text-sm mt-1"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onDelete}
            className="btn-outline flex-1 text-rose-600"
            disabled={busy}
          >
            {t("delete")}
          </button>
          <button type="submit" className="btn-primary flex-[2]" disabled={busy}>
            {busy ? t("saving") : t("save")}
          </button>
        </div>

        <CurrencySelectHint currency={currency} />
      </form>
    </div>
  );
}

function CurrencySelectHint({ currency }: { currency: string }) {
  return (
    <div className="text-center text-[10px] text-slate-400">
      Currency: {currency} · mau ganti? hapus & add baru
    </div>
  );
}

// Exported wrapper so wajib/page.tsx doesn't have to import CurrencySelect
// (we keep the import here just for potential future use)
export { CurrencySelect };
