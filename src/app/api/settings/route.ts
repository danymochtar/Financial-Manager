import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const VALID_CURRENCIES = SUPPORTED_CURRENCIES as readonly string[];

function parseEnabled(raw: string | null | undefined): string[] {
  if (!raw) return [...VALID_CURRENCIES];
  const parts = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => VALID_CURRENCIES.includes(s));
  return parts.length > 0 ? parts : ["IDR"];
}

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      primaryCurrency: true,
      enabledCurrencies: true,
    },
  });
  if (!me) return unauthorized();
  return NextResponse.json({
    user: {
      id: me.id,
      email: me.email,
      name: me.name,
      primaryCurrency: me.primaryCurrency,
      enabledCurrencies: parseEnabled(me.enabledCurrencies),
    },
  });
}

const schema = z.object({
  primaryCurrency: z.enum(SUPPORTED_CURRENCIES).optional(),
  name: z.string().min(1).max(120).optional(),
  enabledCurrencies: z.array(z.enum(SUPPORTED_CURRENCIES)).min(1).optional(),
});

export async function PATCH(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        primaryCurrency: data.primaryCurrency,
        name: data.name,
        enabledCurrencies: data.enabledCurrencies
          ? data.enabledCurrencies.join(",")
          : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        primaryCurrency: true,
        enabledCurrencies: true,
      },
    });
    return NextResponse.json({
      user: {
        ...updated,
        enabledCurrencies: parseEnabled(updated.enabledCurrencies),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}
