"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Receipt,
  Repeat,
  Settings,
  Tags,
  Wallet,
  Globe,
  PiggyBank,
} from "lucide-react";
import { ToastProvider } from "@/components/Toast";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: Wallet },
  { href: "/receipts", label: "Receipts (OCR)", icon: Receipt },
  { href: "/budgets", label: "Budget", icon: PiggyBank },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/sources", label: "Sources", icon: Globe },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ToastProvider>
      <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="px-5 py-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand-600" />
              <div>
                <div className="text-sm font-semibold leading-tight">Financial Manager</div>
                <div className="text-xs text-slate-500">{userName}</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 px-3 pb-3">
            {NAV.map((n) => {
              const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                    active ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            className="mx-3 mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </aside>
        <main className="min-h-screen">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-brand-600" />
              <span className="font-semibold">Financial Manager</span>
            </div>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Logout
            </button>
          </header>
          <div className="px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">{children}</div>

          {/* bottom nav for mobile */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white lg:hidden">
            {[
              { href: "/", label: "Home", icon: LayoutDashboard },
              { href: "/transactions", label: "Tx", icon: Wallet },
              { href: "/receipts", label: "Receipt", icon: Receipt },
              { href: "/reports", label: "Report", icon: BarChart3 },
              { href: "/settings", label: "Setting", icon: Settings },
            ].map((n) => {
              const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 text-[11px]",
                    active ? "text-brand-700" : "text-slate-500"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </main>
      </div>
    </ToastProvider>
  );
}
