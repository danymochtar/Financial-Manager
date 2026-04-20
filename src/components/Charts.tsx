"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SeriesPoint = {
  month: string;
  incomeIDR: number;
  expenseIDR: number;
  incomeMYR: number;
  expenseMYR: number;
};

export function MonthlyBarChart({ data, currency }: { data: SeriesPoint[]; currency: "IDR" | "MYR" }) {
  const keyIncome = currency === "IDR" ? "incomeIDR" : "incomeMYR";
  const keyExpense = currency === "IDR" ? "expenseIDR" : "expenseMYR";
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => new Intl.NumberFormat().format(v)} />
        <Tooltip formatter={(v: number) => new Intl.NumberFormat().format(v)} />
        <Legend />
        <Bar dataKey={keyIncome} name="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
        <Bar dataKey={keyExpense} name="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

type CategorySlice = { name: string; color: string; IDR: number; MYR: number };

export function CategoryPieChart({ data, currency }: { data: CategorySlice[]; currency: "IDR" | "MYR" }) {
  const key = currency === "IDR" ? "IDR" : "MYR";
  const filtered = data.filter((d) => d[key] > 0);
  if (!filtered.length) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">Belum ada expense di periode ini.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={filtered} dataKey={key} nameKey="name" outerRadius={90} innerRadius={55}>
          {filtered.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => new Intl.NumberFormat().format(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

type SourceBar = {
  name: string;
  color: string;
  incomeIDR: number;
  expenseIDR: number;
  incomeMYR: number;
  expenseMYR: number;
};

export function SourceBarChart({ data, currency }: { data: SourceBar[]; currency: "IDR" | "MYR" }) {
  const keyIncome = currency === "IDR" ? "incomeIDR" : "incomeMYR";
  const keyExpense = currency === "IDR" ? "expenseIDR" : "expenseMYR";
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v) => new Intl.NumberFormat().format(v)} />
        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={120} />
        <Tooltip formatter={(v: number) => new Intl.NumberFormat().format(v)} />
        <Legend />
        <Bar dataKey={keyIncome} name="Income" fill="#10b981" />
        <Bar dataKey={keyExpense} name="Expense" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
}
