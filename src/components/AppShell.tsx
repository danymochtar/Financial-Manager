"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Camera, Home, Wallet } from "lucide-react";
import { ToastProvider } from "@/components/Toast";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/akun", label: "Akun", icon: Wallet },
  // center: floating Catat button (special)
  { href: "/analytics", label: "Stats", icon: BarChart3 },
  { href: "/setting", label: "Setting", icon: null, isSetting: true },
] as const;

export function AppShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const onboarding = pathname.startsWith("/onboarding");

  return (
    <ToastProvider>
      <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col bg-gradient-to-b from-pink-50/50 to-orange-50/30">
        {/* Top strip — only shows greeting, no nav. Mobile-first single column. */}
        {!onboarding && (
          <header className="px-4 pt-5 safe-t">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-pink-600">
                  Seberapa Boros Lo?
                </div>
                <div className="text-xs text-slate-500">Halo {userName.split(" ")[0]} 👋</div>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-[11px] text-slate-500 hover:text-slate-700"
              >
                Keluar
              </button>
            </div>
          </header>
        )}

        <main
          className={cn(
            "flex-1 px-4 pb-32 pt-4",
            onboarding && "pb-8 pt-[max(1rem,var(--safe-top))]"
          )}
        >
          {children}
        </main>

        {!onboarding && <BottomNav pathname={pathname} />}
      </div>
    </ToastProvider>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app bg-white/90 backdrop-blur border-t border-pink-100"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="relative grid grid-cols-5 h-16">
        <NavItem href="/" label="Home" icon={Home} active={active("/")} />
        <NavItem href="/akun" label="Akun" icon={Wallet} active={active("/akun")} />
        {/* center floating Catat */}
        <div className="relative flex items-center justify-center">
          <Link
            href="/catat"
            className="absolute -top-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-xl shadow-pink-500/40 active:scale-95"
            aria-label="Catat keborosan"
          >
            <Camera className="h-7 w-7" />
          </Link>
        </div>
        <NavItem href="/analytics" label="Stats" icon={BarChart3} active={active("/analytics")} />
        <NavItem href="/setting" label="Profil" icon={SettingIcon} active={active("/setting")} />
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
        active ? "text-pink-600" : "text-slate-500"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

function SettingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 20c1-3.5 4-5 8-5s7 1.5 8 5" strokeLinecap="round" />
    </svg>
  );
}
