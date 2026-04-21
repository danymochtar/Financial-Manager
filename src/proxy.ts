import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const PUBLIC_PATHS = ["/login", "/register"];
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/register"];

// Edge-safe middleware: constructs a NextAuth instance with the providers
// list empty (from authConfig). No bcrypt / Prisma in the edge bundle.
export default NextAuth(authConfig).auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico";

  if (isPublicPage || isPublicApi || isPublicAsset) return NextResponse.next();

  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js).*)"],
};
