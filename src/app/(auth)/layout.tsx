import { LocaleProvider } from "@/lib/i18n";
import { AuthLocaleToggle, BrandTitle } from "@/components/AuthLocaleToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-amber-50 px-5 py-8 safe-t safe-b relative">
        <div className="absolute top-4 right-4">
          <AuthLocaleToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 text-4xl">🫠</div>
            <BrandTitle />
          </div>
          {children}
        </div>
      </div>
    </LocaleProvider>
  );
}
