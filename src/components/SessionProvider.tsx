"use client";

import { SessionProvider as Next } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <Next>{children}</Next>;
}
