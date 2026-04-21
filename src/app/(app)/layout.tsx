import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { SessionProvider } from "@/components/SessionProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingDone: true, name: true },
  });

  if (me && !me.onboardingDone) {
    redirect("/onboarding");
  }

  return (
    <SessionProvider>
      <AppShell userName={me?.name ?? session.user.name ?? "Bestie"}>{children}</AppShell>
    </SessionProvider>
  );
}
