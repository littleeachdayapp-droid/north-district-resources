import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", emailNotifications: false },
  });

  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {
      emailNotifications: Boolean(body.emailNotifications),
    },
    create: {
      id: "singleton",
      emailNotifications: Boolean(body.emailNotifications),
    },
  });

  logActivity({
    userId: user.id,
    action: "UPDATE_SETTINGS",
    entityType: "SiteSettings",
    entityId: "singleton",
    details: `Updated site settings`,
  });

  return NextResponse.json(settings);
}
