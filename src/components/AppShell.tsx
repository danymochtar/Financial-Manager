"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Camera, Home, Sparkles, Wallet } from "lucide-react";
import { ToastProvider } from "@/components/Toast";
import { LocaleProvider, useT, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AppShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <ToastProvider>
        <Shell userName={userName}>{children}</Shell>
      </ToastProvider>
    </LocaleProvider>
  );
}

function Shell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, locale, setLocale } = useT();
  const onboarding = pathname.startsWith("/onboarding");

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col bg-gradient-to-b from-pink-50/50 to-orange-50/30">
      {!onboarding && (
        <header className="px-4 pt-5 safe-t">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-pink-600">
                {t("brand.name")}
              </div>
              <div className="text-xs text-slate-500">
                {t("hi")} {userName.split(" ")[0]} 👋
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LocaleSwitch locale={locale} setLocale={setLocale} />
              <Link href="/setting" className="text-[11px] text-slate-500 hover:text-slate-700">
                {t("settings.link")}
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-[11px] text-slate-500 hover:text-slate-700"
              >
                {t("logout")}
              </button>
            </div>
          </div>
        </header>
      )}

      {onboarding && (
        <div className="flex justify-end px-4 pt-[max(1rem,var(--safe-top))]">
          <LocaleSwitch locale={locale} setLocale={setLocale} />
        </div>
      )}

      <main
        className={cn(
          "flex-1 px-4 pb-32 pt-4",
          onboarding && "pb-8 pt-2"
        )}
      >
        {children}
      </main>

      {!onboarding && <BottomNav pathname={pathname} />}
    </div>
  );
}

function LocaleSwitch({ locale, setLocale }: { locale: Locale; setLocale: (l: Locale) => void }) {
  return (
    <div className="inline-flex rounded-full bg-white p-0.5 border border-pink-100 text-[10px]">
      {(["id", "en"] as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={cn(
            "px-2 py-0.5 rounded-full font-semibold uppercase",
            locale === l ? "bg-pink-600 text-white" : "text-slate-500"
          )}
          aria-pressed={locale === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  const { t } = useT();
  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app bg-white/90 backdrop-blur border-t border-pink-100"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="relative grid grid-cols-5 h-16">
        <NavItem href="/" label={t("nav.home")} icon={Home} active={active("/")} />
        <NavItem href="/akun" label={t("nav.akun")} icon={Wallet} active={active("/akun")} />
        <div className="relative flex items-center justify-center">
          <Link
            href="/catat"
            className="absolute -top-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-xl shadow-pink-500/40 active:scale-95"
            aria-label={t("nav.catat")}
          >
            <Camera className="h-7 w-7" />
          </Link>
        </div>
        <NavItem href="/dukun" label={t("nav.dukun")} icon={Sparkles} active={active("/dukun")} />
        <NavItem href="/analytics" label={t("nav.stats")} icon={BarChart3} active={active("/analytics")} />
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
