export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-brand-50 via-white to-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 h-10 w-10 rounded-xl bg-brand-600" />
          <h1 className="text-xl font-semibold">Financial Manager</h1>
          <p className="text-sm text-slate-600">Track duit masuk & keluar, lintas MYR &amp; IDR.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
