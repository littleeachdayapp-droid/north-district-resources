import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import type { Category } from "@/lib/constants";
import { ResourceCard } from "./ResourceCard";
import { SearchBar } from "./SearchBar";
import { FilterSidebar } from "./FilterSidebar";
import { Pagination } from "./Pagination";

interface ResourceListPageProps {
  category: Category;
  title: string;
  noResultsText: string;
  searchParams: Record<string, string | string[] | undefined>;
}

export async function ResourceListPage({
  category,
  title,
  noResultsText,
  searchParams,
}: ResourceListPageProps) {
  const search = (searchParams.search as string) || "";
  const subcategory = (searchParams.subcategory as string) || "";
  const churchId = (searchParams.churchId as string) || "";
  const availability = (searchParams.availability as string) || "";
  const tagIds = ((searchParams.tags as string) || "")
    .split(",")
    .filter(Boolean);
  const sort = (searchParams.sort as string) || "newest";
  const page = Math.max(1, parseInt((searchParams.page as string) || "1"));
  const limit = 12;

  // Build where clause
  const where: Record<string, unknown> = { category };

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { authorComposer: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (subcategory) {
    where.subcategory = { in: subcategory.split(",") };
  }
  if (churchId) where.churchId = churchId;
  if (availability) {
    where.availabilityStatus = { in: availability.split(",") };
  }
  if (tagIds.length > 0) {
    where.tags = { some: { tagId: { in: tagIds } } };
  }

  const orderBy =
    sort === "title"
      ? { title: "asc" as const }
      : sort === "author"
        ? { authorComposer: "asc" as const }
        : { createdAt: "desc" as const };

  const [resources, total, tags, churches] = await Promise.all([
    prisma.resource.findMany({
      where: where as never,
      include: {
        church: { select: { id: true, name: true, nameEs: true, city: true } },
        tags: { include: { tag: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.resource.count({ where: where as never }),
    prisma.tag.findMany({
      where: { category: { in: [category, "BOTH"] } },
      orderBy: { name: "asc" },
    }),
    prisma.church.findMany({
      where: { isActive: true },
      select: { id: true, name: true, nameEs: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary-800 mb-6">{title}</h1>

      <Suspense>
        <SearchBar />
      </Suspense>

      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        <Suspense>
          <FilterSidebar
            category={category}
            tags={tags}
            churches={churches}
          />
        </Suspense>

        <div className="flex-1">
          {resources.length === 0 ? (
            <p className="text-primary-500 text-center py-12">
              {noResultsText}
            </p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
              <Suspense>
                <Pagination page={page} totalPages={totalPages} />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
