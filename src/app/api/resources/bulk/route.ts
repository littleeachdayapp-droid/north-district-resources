import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { z } from "zod";
import {
  CATEGORIES,
  ALL_SUBCATEGORIES,
  FORMATS,
} from "@/lib/constants";

const resourceItemSchema = z.object({
  category: z.enum(CATEGORIES),
  title: z.string().min(1).max(500),
  titleEs: z.string().max(500).nullable().optional(),
  authorComposer: z.string().max(300).nullable().optional(),
  publisher: z.string().max(300).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  descriptionEs: z.string().max(2000).nullable().optional(),
  subcategory: z.enum(ALL_SUBCATEGORIES).nullable().optional(),
  format: z.enum(FORMATS).nullable().optional(),
  quantity: z.number().int().min(1).default(1),
  maxLoanWeeks: z.number().int().min(1).max(52).nullable().optional(),
  tagIds: z.array(z.string()).optional(),
});

const bulkImportSchema = z.object({
  resources: z.array(resourceItemSchema).min(1),
  churchId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bulkImportSchema.parse(body);

    // Determine churchId
    let churchId: string;
    if (user.role === "ADMIN") {
      if (!parsed.churchId) {
        return NextResponse.json(
          { error: "Admin must specify a churchId" },
          { status: 400 }
        );
      }
      churchId = parsed.churchId;
    } else if (user.churchId) {
      churchId = user.churchId;
    } else {
      return NextResponse.json(
        { error: "No church associated with user" },
        { status: 400 }
      );
    }

    let created = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < parsed.resources.length; i++) {
      const item = parsed.resources[i];
      try {
        const { tagIds, ...data } = item;

        const resource = await prisma.resource.create({
          data: {
            ...data,
            churchId,
            tags: tagIds?.length
              ? { create: tagIds.map((tagId) => ({ tagId })) }
              : undefined,
          },
        });

        logActivity({
          userId: user.id,
          action: "CREATE_RESOURCE",
          entityType: "Resource",
          entityId: resource.id,
          details: `Bulk imported resource "${item.title}"`,
        });

        created++;
      } catch (err) {
        errors.push({
          row: i,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      created,
      failed: errors.length,
      errors,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
