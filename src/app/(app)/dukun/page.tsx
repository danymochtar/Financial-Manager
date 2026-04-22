"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Loader2, Target, ShieldCheck, PiggyBank, TrendingDown, RefreshCw, Compass } from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatShort } from "@/lib/currency";
import { useT } from "@/lib/i18n";

type Snapshot = {
  name: string;
  primaryCurrency: string;
  derived: {
    totalAssetIDR: number;
    totalAssetMYR: number;
    totalDebtIDR: number;
    totalDebtMYR: number;
    totalInvestmentIDR: number;
    totalInvestmentMYR: number;
    totalPhysicalAssetIDR: number;
    totalPhysicalAssetMYR: number;
    totalNetWorthIDR: number;
    totalNetWorthMYR: number;
    monthlyIncomeIDR: number;
    monthlyIncomeMYR: number;
    monthlyFixedExpenseIDR: number;
    monthlyFixedExpenseMYR: number;
    monthlyDebtPaymentIDR: number;
    monthlyDebtPaymentMYR: number;
    monthlyDependentIDR: number;
    monthlyDependentMYR: number;
    freeCashFlowIDR: number;
    freeCashFlowMYR: number;
    yearsWorked: number;
    savingsEfficiencyPct: number | null;
    moneyGapIDR: number;
    moneyGapMYR: number;
  };
  goals: Array<{ name: string; emoji: string; targetAmount: number; currency: string; currentSaved: number; targetDate: string | null }>;
};

type Msg = { id: string; role: "user" | "assistant"; content: string };

const QUICK_ACTION_KEYS = [
  { key: "analyze", labelKey: "dukun.qa.analyze", promptKey: "dukun.prompt.analyze", icon: Sparkles },
  { key: "money_trail", labelKey: "dukun.qa.moneyTrail", promptKey: "dukun.prompt.moneyTrail", icon: Compass },
  { key: "safety_net", labelKey: "dukun.qa.safety", promptKey: "dukun.prompt.safety", icon: ShieldCheck },
  { key: "savings_plan", labelKey: "dukun.qa.savings", promptKey: "dukun.prompt.savings", icon: Target },
  { key: "reduce_boros", labelKey: "dukun.qa.reduce", promptKey: "dukun.prompt.reduce", icon: TrendingDown },
  { key: "debt_strategy", labelKey: "dukun.qa.debt", promptKey: "dukun.prompt.debt", icon: PiggyBank },
] as const;

export default function DukunPage() {
  const { t, locale } = useT();
  const toast = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([{ id: "greet", role: "assistant", content: t("dukun.greet") }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  // update greeting when locale changes (if chat is still empty)
  useEffect(() => {
    setMsgs((prev) => (prev.length === 1 && prev[0].id === "greet" ? [{ id: "greet", role: "assistant", content: t("dukun.greet") }] : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  useEffect(() => {
    fetch("/api/dukun")
      .then((r) => r.json())
      .then((d) => setSnapshot(d.snapshot))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    const userMsg: Msg = { id: String(Date.now()), role: "user", content: question };
    setMsgs((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const history = msgs
        .filter((m) => m.id !== "greet")
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/dukun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: "error", message: data?.error ?? "Dukun gak bisa jawab" });
        setMsgs((prev) => [
          ...prev,
          { id: String(Date.now() + 1), role: "assistant", content: `⚠️ ${data?.error ?? "Error"}` },
        ]);
        return;
      }
      if (data.snapshot) setSnapshot(data.snapshot);
      setMsgs((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: data.answer }]);
    } catch (err) {
      toast({ kind: "error", message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const primary = snapshot?.primaryCurrency ?? "IDR";
  const isMYR = primary === "MYR";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dukun.title")}</h1>
        <p className="text-sm text-slate-600">{t("dukun.desc")}</p>
      </div>

      {/* Snapshot strip */}
      {snapshot && (
        <div className="card bg-gradient-to-br from-emerald-50 to-amber-50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            {t("dukun.snapshotLabel")} ({primary})
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <Stat label={t("dukun.netWorth")} value={formatShort(isMYR ? snapshot.derived.totalNetWorthMYR : snapshot.derived.totalNetWorthIDR, primary)} tone={(isMYR ? snapshot.derived.totalNetWorthMYR : snapshot.derived.totalNetWorthIDR) >= 0 ? "emerald" : "rose"} />
            <Stat label={t("dukun.physical")} value={formatShort(isMYR ? snapshot.derived.totalPhysicalAssetMYR : snapshot.derived.totalPhysicalAssetIDR, primary)} tone="brand" />
            <Stat label={t("dash.debt")} value={formatShort(isMYR ? snapshot.derived.totalDebtMYR : snapshot.derived.totalDebtIDR, primary)} tone="rose" />
            <Stat label={t("dukun.freeCash")} value={formatShort(isMYR ? snapshot.derived.freeCashFlowMYR : snapshot.derived.freeCashFlowIDR, primary)} tone={(isMYR ? snapshot.derived.freeCashFlowMYR : snapshot.derived.freeCashFlowIDR) >= 0 ? "emerald" : "rose"} />
          </div>
          {snapshot.derived.yearsWorked > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 text-[11px]">
              <span>
                💼 {snapshot.derived.yearsWorked}y kerja · {t("dukun.efficiency")}:{" "}
                <strong>{snapshot.derived.savingsEfficiencyPct ?? "—"}%</strong>
              </span>
            </div>
          )}
          {snapshot.goals.length > 0 && (
            <div className="mt-3 text-[11px] text-slate-600">
              🎯 {snapshot.goals.length} {t("dukun.activeGoals")}:{" "}
              {snapshot.goals.slice(0, 3).map((g) => `${g.emoji} ${g.name}`).join(" · ")}
              {snapshot.goals.length > 3 && ` +${snapshot.goals.length - 3}`}
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTION_KEYS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              type="button"
              disabled={busy}
              onClick={() => ask(t(a.promptKey))}
              className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white p-3 text-left text-xs font-medium text-slate-700 active:scale-[0.98] disabled:opacity-50"
            >
              <Icon className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{t(a.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Chat */}
      <div ref={scrollRef} className="card max-h-[55vh] overflow-y-auto p-3 space-y-3">
        {msgs.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
        {busy && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50/60 px-3 py-2 text-sm text-emerald-700">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("dukun.thinking")}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        className="flex gap-2 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          className="input flex-1"
          placeholder={t("dukun.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary px-4" disabled={busy || !input.trim()}>
          <Send className="h-4 w-4" />
        </button>
      </form>

      {msgs.length > 1 && (
        <button
          type="button"
          className="btn-ghost w-full text-xs"
          onClick={() => setMsgs([msgs[0]])}
          disabled={busy}
        >
          <RefreshCw className="h-3 w-3" /> {t("dukun.clear")}
        </button>
      )}

      <p className="text-center text-[10px] text-slate-400">{t("dukun.disclaimer")}</p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "emerald" | "rose" | "brand" }) {
  const color = tone === "emerald" ? "text-emerald-600" : tone === "rose" ? "text-rose-600" : "text-emerald-600";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`font-bold ${color}`}>{value}</div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-br from-emerald-500 to-orange-500 px-3 py-2 text-sm text-white shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm">🧙</div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-emerald-50/60 px-3 py-2 text-sm leading-relaxed text-slate-800">
        <MiniMarkdown text={msg.content} />
      </div>
    </div>
  );
}

function MiniMarkdown({ text }: { text: string }) {
  // Render bold + bullets + line breaks — cukup buat output Dukun yg markdown ringan
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
        if (bulletMatch) {
          return (
            <div key={i} className="flex gap-1.5 pl-2">
              <span className="text-emerald-500">•</span>
              <span>{renderInline(bulletMatch[2])}</span>
            </div>
          );
        }
        const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={i} className="flex gap-1.5 pl-2">
              <span className="text-emerald-500 font-semibold">{numMatch[2]}.</span>
              <span>{renderInline(numMatch[3])}</span>
            </div>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        const h = line.match(/^(#{1,3})\s+(.*)$/);
        if (h) {
          return (
            <div key={i} className="mt-1 font-bold">
              {renderInline(h[2])}
            </div>
          );
        }
        return <div key={i}>{renderInline(line)}</div>;
      })}
    </>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1]) parts.push(<strong key={key++} className="font-semibold">{match[1]}</strong>);
    else if (match[2]) parts.push(<code key={key++} className="rounded bg-emerald-100 px-1 text-[12px]">{match[2]}</code>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
