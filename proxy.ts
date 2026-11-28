import { NextResponse, type NextRequest } from "next/server";
import { auth, isNeonAuthConfigured } from "@/lib/auth";

const authMiddleware = auth.middleware({ loginUrl: "/sign-in" });

/**
 * Next.js 16 proxy: protect application pages. API routes are excluded here
 * because each API route enforces its own server-side identity boundary.
 */
export default function proxy(request: NextRequest) {
  if (!isNeonAuthConfigured()) return NextResponse.next();
  return authMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
