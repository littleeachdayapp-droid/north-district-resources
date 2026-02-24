import * as jose from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret"
);

export const AUTH_COOKIE = "north-district-token";

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  churchId: string | null;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(payload: JWTPayload): Promise<void> {
  const token = await signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId, isActive: true },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      churchId: true,
      email: true,
      emailVerified: true,
      church: { select: { id: true, name: true, nameEs: true } },
    },
  });

  return user;
}

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(minRole: "EDITOR" | "ADMIN"): Promise<AuthUser> {
  const user = await requireAuth();
  if (minRole === "ADMIN" && user.role !== "ADMIN") {
    redirect("/login");
  }
  return user;
}
