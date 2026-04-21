import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SessionProvider } from "@/components/SessionProvider";
import { ToastProvider } from "@/components/Toast";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return (
    <SessionProvider>
      <ToastProvider>
        <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col bg-gradient-to-b from-pink-50 to-orange-50">
          {children}
        </div>
      </ToastProvider>
    </SessionProvider>
  );
}
