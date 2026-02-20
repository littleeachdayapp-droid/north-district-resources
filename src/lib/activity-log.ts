import { prisma } from "./prisma";

export function logActivity(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
}): void {
  // Fire-and-forget — failures never affect API responses
  void (async () => {
    try {
      await prisma.activityLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          details: params.details || null,
        },
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  })();
}
