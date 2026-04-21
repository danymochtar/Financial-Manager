"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Money input yang nampilin format enak (Rp 1.234.567 / RM 1,234.56)
 * tapi tetep expose numeric value via onChange.
 * Visually different dari text input: ada prefix currency, tipografi tabular.
 */
export function MoneyInput({
  value,
  onChange,
  currency,
  placeholder = "0",
  className,
  autoFocus,
}: {
  value: number | null | undefined;
  onChange: (n: number) => void;
  currency: "IDR" | "MYR" | "USD" | "SGD";
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const decimals = currency === "IDR" ? 0 : 2;
  const [display, setDisplay] = useState(() => formatDisplay(value, currency));
  useEffect(() => {
    setDisplay(formatDisplay(value, currency));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, currency]);

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const clean = raw
      .replace(currency === "IDR" ? /[^\d]/g : /[^\d.]/g, "")
      .replace(/(\..*)\./g, "$1"); // only first dot
    const num = Number(clean);
    if (Number.isFinite(num)) {
      onChange(num);
      setDisplay(clean);
    } else if (clean === "") {
      onChange(0);
      setDisplay("");
    }
  }

  function onBlur() {
    setDisplay(formatDisplay(value, currency));
  }

  function onFocus() {
    setDisplay(value ? String(value) : "");
  }

  const symbol = currency === "IDR" ? "Rp" : currency === "MYR" ? "RM" : currency === "SGD" ? "S$" : "$";

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-pink-600">
        {symbol}
      </span>
      <input
        type="text"
        inputMode="decimal"
        pattern={currency === "IDR" ? "[0-9]*" : "[0-9.]*"}
        className="input pl-10 font-mono tabular-nums tracking-tight text-right"
        value={display}
        onChange={onInput}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase text-slate-400">
        {decimals === 0 ? "" : ""}
      </span>
    </div>
  );
}

function formatDisplay(value: number | null | undefined, currency: string): string {
  if (value == null || !Number.isFinite(value) || value === 0) return "";
  try {
    return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Reusable selector currency dengan USD option.
 */
export function CurrencySelect({
  value,
  onChange,
  className,
  allowUsd = true,
  allowSgd = false,
}: {
  value: string;
  onChange: (v: "IDR" | "MYR" | "USD" | "SGD") => void;
  className?: string;
  allowUsd?: boolean;
  allowSgd?: boolean;
}) {
  return (
    <select
      className={cn("input text-sm", className)}
      value={value}
      onChange={(e) => onChange(e.target.value as "IDR" | "MYR" | "USD" | "SGD")}
    >
      <option value="IDR">IDR</option>
      <option value="MYR">MYR</option>
      {allowUsd && <option value="USD">USD</option>}
      {allowSgd && <option value="SGD">SGD</option>}
    </select>
  );
}
