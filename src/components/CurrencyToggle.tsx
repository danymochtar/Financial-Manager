"use client";

type View = "IDR" | "MYR" | "BOTH";

export function CurrencyToggle({
  value,
  onChange,
}: {
  value: View;
  onChange: (v: View) => void;
}) {
  const opts: View[] = ["IDR", "MYR", "BOTH"];
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
      {opts.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`px-3 py-1 rounded-md transition ${
            value === o ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {o === "BOTH" ? "IDR + MYR" : o}
        </button>
      ))}
    </div>
  );
}
