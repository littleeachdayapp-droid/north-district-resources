import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  await requireRole("ADMIN");

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", emailNotifications: false },
  });

  return <SettingsClient initialSettings={settings} />;
}
