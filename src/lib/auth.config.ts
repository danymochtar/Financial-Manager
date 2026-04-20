import type { DefaultSession, NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      primaryCurrency: string;
    } & DefaultSession["user"];
  }
}

/**
 * Edge-safe NextAuth config (no bcrypt / no Prisma imports).
 * Imported by middleware.ts so the middleware bundle stays slim
 * and Edge-runtime compatible.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.sub;
        token.primaryCurrency = (user as { primaryCurrency?: string }).primaryCurrency ?? "IDR";
      }
      if (trigger === "update" && session?.user?.primaryCurrency) {
        token.primaryCurrency = session.user.primaryCurrency;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = (token.id as string) ?? (token.sub as string);
        session.user.primaryCurrency = (token.primaryCurrency as string) ?? "IDR";
      }
      return session;
    },
  },
};
