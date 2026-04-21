export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col items-center justify-center bg-gradient-to-b from-pink-50 via-orange-50 to-white px-5 py-8 safe-t safe-b">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 text-4xl">🫠</div>
          <h1 className="text-2xl font-bold tracking-tight">Seberapa Boros Lo?</h1>
          <p className="mt-1 text-sm text-slate-600">
            Catet keborosan, sadar, terus nabung.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
