import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";

  const resourceWhere = isAdmin ? {} : { churchId: user.churchId! };

  const [resources, churches, incomingRequests, outgoingRequests, lentLoans, borrowedLoans] =
    await Promise.all([
      prisma.resource.findMany({
        where: resourceWhere,
        include: {
          church: { select: { id: true, name: true, nameEs: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      isAdmin
        ? prisma.church.findMany({
            where: { isActive: true },
            select: { id: true, name: true, nameEs: true },
            orderBy: { name: "asc" },
          })
        : Promise.resolve([]),
      // Incoming requests: for resources my church owns (or all if admin)
      prisma.loanRequest.findMany({
        where: isAdmin
          ? {}
          : { resource: { churchId: user.churchId! } },
        include: {
          resource: {
            select: {
              id: true,
              title: true,
              churchId: true,
              church: { select: { id: true, name: true, nameEs: true } },
            },
          },
          requestingChurch: { select: { id: true, name: true, nameEs: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Outgoing requests: my church requested (or all if admin)
      isAdmin
        ? Promise.resolve([])
        : prisma.loanRequest.findMany({
            where: { requestingChurchId: user.churchId! },
            include: {
              resource: {
                select: {
                  id: true,
                  title: true,
                  churchId: true,
                  church: { select: { id: true, name: true, nameEs: true } },
                },
              },
              requestingChurch: { select: { id: true, name: true, nameEs: true } },
            },
            orderBy: { createdAt: "desc" },
          }),
      // Lent loans: my church is the lender (or all if admin)
      prisma.loan.findMany({
        where: isAdmin
          ? {}
          : { lendingChurchId: user.churchId! },
        include: {
          resource: { select: { id: true, title: true } },
          borrowingChurch: { select: { id: true, name: true, nameEs: true } },
          lendingChurch: { select: { id: true, name: true, nameEs: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Borrowed loans: my church is the borrower (or all if admin)
      isAdmin
        ? Promise.resolve([])
        : prisma.loan.findMany({
            where: { borrowingChurchId: user.churchId! },
            include: {
              resource: { select: { id: true, title: true } },
              borrowingChurch: { select: { id: true, name: true, nameEs: true } },
              lendingChurch: { select: { id: true, name: true, nameEs: true } },
            },
            orderBy: { createdAt: "desc" },
          }),
    ]);

  return (
    <DashboardClient
      user={{
        displayName: user.displayName,
        role: user.role,
        churchId: user.churchId,
        churchName: user.church?.name || null,
      }}
      resources={resources}
      churches={churches}
      incomingRequests={incomingRequests}
      outgoingRequests={outgoingRequests}
      lentLoans={lentLoans}
      borrowedLoans={borrowedLoans}
    />
  );
}
