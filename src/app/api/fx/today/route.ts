import { NextResponse } from "next/server";
import { getFxMatrix } from "@/lib/fx";
import { getAuthedUser, serverError, unauthorized } from "@/lib/api";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const matrix = await getFxMatrix();
    return NextResponse.json(matrix);
  } catch (err) {
    return serverError(err);
  }
}
