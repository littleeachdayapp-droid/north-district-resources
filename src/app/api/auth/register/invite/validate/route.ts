import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const invite = await prisma.churchInvite.findUnique({
    where: { token },
    include: { church: { select: { name: true, isActive: true } } },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  if (invite.status !== "PENDING") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 400 });
  }

  if (new Date() > invite.expiresAt) {
    await prisma.churchInvite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "This invite has expired" }, { status: 400 });
  }

  if (!invite.church.isActive) {
    return NextResponse.json({ error: "This church is no longer active" }, { status: 400 });
  }

  return NextResponse.json({
    churchName: invite.church.name,
    email: invite.email,
  });
}
