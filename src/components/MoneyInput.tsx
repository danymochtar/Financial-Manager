"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Money input:
 * - IDR: single box, integer-only. Thousands dots on blur ("Rp 1.234.567").
 * - MYR / USD / SGD: split whole + cents boxes so there's no ambiguity between
 *   Indonesian comma-as-decimal vs English dot-as-decimal. Left box holds the
 *   whole number; right box is exactly 2-digit cents.
 *
 * onChange always receives a plain JS number.
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
  const symbol =
    currency === "IDR" ? "Rp" : currency === "MYR" ? "RM" : currency === "SGD" ? "S$" : "$";

  if (currency === "IDR") {
    return (
      <IDRBox
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        symbol={symbol}
      />
    );
  }
  return (
    <WholeAndCents
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      autoFocus={autoFocus}
      symbol={symbol}
    />
  );
}

function IDRBox({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
  symbol,
}: {
  value: number | null | undefined;
  onChange: (n: number) => void;
  placeholder: string;
  className?: string;
  autoFocus?: boolean;
  symbol: string;
}) {
  const n = Number.isFinite(value) ? Math.abs(Math.round(value ?? 0)) : 0;
  const [display, setDisplay] = useState<string>(() => (n ? n.toLocaleString("id-ID") : ""));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDisplay(n ? n.toLocaleString("id-ID") : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    const next = digits === "" ? 0 : Number(digits);
    onChange(next);
    setDisplay(digits); // raw while typing
  }

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-600">
        {symbol}
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="input pl-10 font-mono tabular-nums tracking-tight text-right"
        value={display}
        onChange={onInput}
        onFocus={() => {
          setFocused(true);
          setDisplay(n ? String(n) : "");
        }}
        onBlur={() => {
          setFocused(false);
          setDisplay(n ? n.toLocaleString("id-ID") : "");
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </div>
  );
}

function WholeAndCents({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
  symbol,
}: {
  value: number | null | undefined;
  onChange: (n: number) => void;
  placeholder: string;
  className?: string;
  autoFocus?: boolean;
  symbol: string;
}) {
  const v = Number.isFinite(value) ? Math.max(0, value ?? 0) : 0;
  const whole = Math.floor(v);
  const cents = Math.round((v - whole) * 100);

  const [wholeDisplay, setWholeDisplay] = useState<string>(() =>
    whole ? whole.toLocaleString("en-US") : ""
  );
  const [centsDisplay, setCentsDisplay] = useState<string>(() =>
    cents ? String(cents).padStart(2, "0") : ""
  );
  const [wholeFocused, setWholeFocused] = useState(false);

  useEffect(() => {
    if (!wholeFocused) {
      setWholeDisplay(whole ? whole.toLocaleString("en-US") : "");
    }
    setCentsDisplay(cents ? String(cents).padStart(2, "0") : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function onWholeInput(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    const newWhole = digits === "" ? 0 : Number(digits);
    onChange(newWhole + cents / 100);
    setWholeDisplay(digits); // raw while typing
  }

  function onCentsInput(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
    const newCents = digits === "" ? 0 : Number(digits);
    onChange(whole + newCents / 100);
    setCentsDisplay(digits);
  }

  return (
    <div className={cn("relative flex", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-600 z-10">
        {symbol}
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="input pl-10 font-mono tabular-nums tracking-tight text-right rounded-r-none flex-1"
        value={wholeDisplay}
        onChange={onWholeInput}
        onFocus={() => {
          setWholeFocused(true);
          setWholeDisplay(whole ? String(whole) : "");
        }}
        onBlur={() => {
          setWholeFocused(false);
          setWholeDisplay(whole ? whole.toLocaleString("en-US") : "");
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      <span className="flex items-center bg-white border-y border-emerald-100 text-slate-400 font-mono text-sm px-1">
        .
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="input w-16 font-mono tabular-nums tracking-tight text-left rounded-l-none px-2"
        value={centsDisplay}
        onChange={onCentsInput}
        onBlur={() => setCentsDisplay(cents ? String(cents).padStart(2, "0") : "")}
        placeholder="00"
        maxLength={2}
      />
    </div>
  );
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
