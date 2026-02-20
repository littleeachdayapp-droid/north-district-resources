import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is a dashboard route (after locale prefix)
  const dashboardPattern = /^\/(en|es)\/dashboard/;
  if (dashboardPattern.test(pathname)) {
    const hasToken = request.cookies.has("north-district-token");
    if (!hasToken) {
      const locale = pathname.startsWith("/es") ? "es" : "en";
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
