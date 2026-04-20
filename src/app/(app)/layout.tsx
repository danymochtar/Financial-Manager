import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { SessionProvider } from "@/components/SessionProvider";
import { runDueRecurrings } from "@/lib/recurring";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // opportunistic recurring runner — materialize any due recurrings
  // the moment the user opens the app. Idempotent & bounded.
  runDueRecurrings(session.user.id).catch(() => undefined);

  return (
    <SessionProvider>
      <AppShell userName={session.user.name ?? session.user.email ?? "User"}>{children}</AppShell>
    </SessionProvider>
  );
}
