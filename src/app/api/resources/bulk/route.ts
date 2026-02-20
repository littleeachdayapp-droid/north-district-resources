import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
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
  newTagNames: z.array(z.string()).optional(),
});

const bulkImportSchema = z.object({
  resources: z.array(resourceItemSchema).min(1),
  churchId: z.string().optional(),
});

const BATCH_SIZE = 100;

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

    // 1. Collect and dedupe all new tag names
    const allNewNames = new Set<string>();
    for (const item of parsed.resources) {
      if (item.newTagNames?.length) {
        for (const name of item.newTagNames) {
          allNewNames.add(name);
        }
      }
    }

    // 2. Batch-create new tags
    const newTagMap = new Map<string, string>(); // lowercase name → tag ID
    if (allNewNames.size > 0) {
      // Check which already exist (case-insensitive)
      const existingTags = await prisma.tag.findMany({
        where: { name: { in: [...allNewNames] } },
      });
      for (const tag of existingTags) {
        newTagMap.set(tag.name.toLowerCase(), tag.id);
        allNewNames.delete(tag.name);
      }

      // Create remaining in batch
      if (allNewNames.size > 0) {
        const created = await prisma.tag.createManyAndReturn({
          data: [...allNewNames].map((name) => ({
            name,
            category: "MUSIC",
          })),
        });
        for (const tag of created) {
          newTagMap.set(tag.name.toLowerCase(), tag.id);
        }
      }
    }

    // 3. Resolve per-row tag IDs (existing + newly created)
    const rowTagIds: string[][] = parsed.resources.map((item) => {
      const ids = [...(item.tagIds || [])];
      if (item.newTagNames?.length) {
        for (const name of item.newTagNames) {
          const id = newTagMap.get(name.toLowerCase());
          if (id) ids.push(id);
        }
      }
      return ids;
    });

    // 4. Insert resources in batches using createManyAndReturn
    let created = 0;
    const allResourceTagLinks: { resourceId: string; tagId: string }[] = [];
    const allActivityLogs: {
      userId: string;
      action: string;
      entityType: string;
      entityId: string;
      details: string;
    }[] = [];

    for (let batchStart = 0; batchStart < parsed.resources.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, parsed.resources.length);
      const batch = parsed.resources.slice(batchStart, batchEnd);

      const createdResources = await prisma.resource.createManyAndReturn({
        data: batch.map((item) => {
          const { tagIds: _t, newTagNames: _n, ...data } = item;
          return { ...data, churchId };
        }),
      });

      for (let j = 0; j < createdResources.length; j++) {
        const resource = createdResources[j];
        const globalIdx = batchStart + j;
        const tags = rowTagIds[globalIdx];

        if (tags.length > 0) {
          for (const tagId of tags) {
            allResourceTagLinks.push({ resourceId: resource.id, tagId });
          }
        }

        allActivityLogs.push({
          userId: user.id,
          action: "CREATE_RESOURCE",
          entityType: "Resource",
          entityId: resource.id,
          details: `Bulk imported resource "${batch[j].title}"`,
        });

        created++;
      }
    }

    // 5. Batch-insert ResourceTag links
    if (allResourceTagLinks.length > 0) {
      for (let i = 0; i < allResourceTagLinks.length; i += BATCH_SIZE) {
        await prisma.resourceTag.createMany({
          data: allResourceTagLinks.slice(i, i + BATCH_SIZE),
        });
      }
    }

    // 6. Batch-insert activity logs (fire-and-forget)
    void (async () => {
      try {
        for (let i = 0; i < allActivityLogs.length; i += BATCH_SIZE) {
          await prisma.activityLog.createMany({
            data: allActivityLogs.slice(i, i + BATCH_SIZE),
          });
        }
      } catch (err) {
        console.error("Failed to log bulk import activity:", err);
      }
    })();

    return NextResponse.json({
      created,
      failed: parsed.resources.length - created,
      errors: [],
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
