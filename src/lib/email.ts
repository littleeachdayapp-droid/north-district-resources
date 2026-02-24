import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "./prisma";

// Initialize Resend client only if API key is configured
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = "MinistryShare Austin <noreply@send.ministryshare.org>";

// --- HTML builder ---

function buildEmailHtml(title: string, bodyLines: string[]): string {
  const body = bodyLines
    .map((line) => `<p style="margin:0 0 12px;color:#333;line-height:1.5">${line}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f5f5f4">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e7e5e4">
    <div style="background:#78716c;padding:20px 24px">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600">${title}</h1>
    </div>
    <div style="padding:24px">
      ${body}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e7e5e4;text-align:center">
      <p style="margin:0;color:#a8a29e;font-size:12px">MinistryShare Austin</p>
    </div>
  </div>
</body>
</html>`;
}

// --- Settings check ---

async function isEmailEnabled(): Promise<boolean> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
    return settings?.emailNotifications ?? false;
  } catch {
    return false;
  }
}

// --- Send helper ---

async function sendNotification(to: string, subject: string, html: string): Promise<void> {
  try {
    const enabled = await isEmailEnabled();
    if (!enabled) return;

    if (resend) {
      await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    } else {
      console.log(`[Email] To: ${to} | Subject: ${subject}`);
    }
  } catch (err) {
    console.error("[Email] Failed to send notification:", err);
  }
}

// --- Direct send (bypasses isEmailEnabled — for registration emails that must always send) ---

async function sendDirect(to: string, subject: string, html: string): Promise<void> {
  try {
    if (resend) {
      await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    } else {
      console.log(`[Email] To: ${to} | Subject: ${subject}`);
    }
  } catch (err) {
    console.error("[Email] Failed to send:", err);
  }
}

// --- Token helper ---

export function generateVerificationToken(): { token: string; expiry: Date } {
  const token = crypto.randomUUID();
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { token, expiry };
}

// --- Registration email functions ---

export function sendVerificationEmail(to: string, token: string, locale: string): void {
  void (async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ministryshare.org";
      const link = `${baseUrl}/${locale}/verify-email?token=${token}`;
      const subject = locale === "es"
        ? "Verifica tu correo electrónico — MinistryShare Austin"
        : "Verify your email — MinistryShare Austin";
      const html = buildEmailHtml(
        locale === "es" ? "Verificar Correo" : "Verify Email",
        [
          locale === "es"
            ? "Gracias por registrarte en MinistryShare Austin."
            : "Thank you for registering with MinistryShare Austin.",
          locale === "es"
            ? `<a href="${link}" style="display:inline-block;padding:10px 20px;background:#78716c;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Verificar correo</a>`
            : `<a href="${link}" style="display:inline-block;padding:10px 20px;background:#78716c;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Verify email</a>`,
          locale === "es"
            ? "Este enlace expira en 24 horas."
            : "This link expires in 24 hours.",
        ]
      );
      await sendDirect(to, subject, html);
    } catch (err) {
      console.error("[Email] sendVerificationEmail error:", err);
    }
  })();
}

export function notifyAdminNewRegistration(churchId: string): void {
  void (async () => {
    try {
      const church = await prisma.church.findUnique({
        where: { id: churchId },
        select: { name: true },
      });
      if (!church) return;

      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", isActive: true, email: { not: null } },
        select: { email: true },
      });

      const subject = `New Church Registration: ${church.name}`;
      const html = buildEmailHtml("New Church Registration", [
        `A new church <strong>${church.name}</strong> has registered and is awaiting approval.`,
        "Please log in to the admin dashboard to review this registration.",
      ]);

      for (const admin of admins) {
        if (admin.email) {
          await sendDirect(admin.email, subject, html);
        }
      }
    } catch (err) {
      console.error("[Email] notifyAdminNewRegistration error:", err);
    }
  })();
}

export function notifyChurchApproved(churchId: string): void {
  void (async () => {
    try {
      const church = await prisma.church.findUnique({
        where: { id: churchId },
        include: {
          users: {
            where: { email: { not: null } },
            select: { email: true, displayName: true },
            take: 1,
            orderBy: { createdAt: "asc" },
          },
        },
      });
      if (!church || church.users.length === 0 || !church.users[0].email) return;

      const user = church.users[0];
      const subject = `Your church has been approved — MinistryShare Austin`;
      const html = buildEmailHtml("Church Approved", [
        `Hello ${user.displayName},`,
        `Great news! <strong>${church.name}</strong> has been approved on MinistryShare Austin.`,
        "You can now log in and start sharing resources with other churches.",
      ]);
      await sendDirect(user.email!, subject, html);
    } catch (err) {
      console.error("[Email] notifyChurchApproved error:", err);
    }
  })();
}

export function notifyChurchRejected(churchId: string, reason?: string): void {
  void (async () => {
    try {
      const church = await prisma.church.findUnique({
        where: { id: churchId },
        include: {
          users: {
            where: { email: { not: null } },
            select: { email: true, displayName: true },
            take: 1,
            orderBy: { createdAt: "asc" },
          },
        },
      });
      if (!church || church.users.length === 0 || !church.users[0].email) return;

      const user = church.users[0];
      const subject = `Church registration update — MinistryShare Austin`;
      const lines = [
        `Hello ${user.displayName},`,
        `We were unable to approve <strong>${church.name}</strong> on MinistryShare Austin at this time.`,
      ];
      if (reason) {
        lines.push(`Reason: ${reason}`);
      }
      lines.push("If you have questions, please contact us.");

      const html = buildEmailHtml("Registration Update", lines);
      await sendDirect(user.email!, subject, html);
    } catch (err) {
      console.error("[Email] notifyChurchRejected error:", err);
    }
  })();
}

// --- Notification functions ---

export function notifyNewRequest(requestId: string): void {
  void (async () => {
    try {
      const req = await prisma.loanRequest.findUnique({
        where: { id: requestId },
        include: {
          resource: { include: { church: { select: { name: true, email: true } } } },
          requestingChurch: { select: { name: true } },
        },
      });
      if (!req || !req.resource.church.email) return;

      const subject = `New Loan Request for ${req.resource.title}`;
      const html = buildEmailHtml("New Loan Request", [
        `Hello ${req.resource.church.name},`,
        `${req.requestingChurch.name} has requested to borrow <strong>&ldquo;${req.resource.title}&rdquo;</strong> from your church.`,
        `Please log in to the dashboard to approve or deny this request.`,
      ]);
      await sendNotification(req.resource.church.email, subject, html);
    } catch (err) {
      console.error("[Email] notifyNewRequest error:", err);
    }
  })();
}

export function notifyRequestApproved(requestId: string): void {
  void (async () => {
    try {
      const req = await prisma.loanRequest.findUnique({
        where: { id: requestId },
        include: {
          resource: { include: { church: { select: { name: true } } } },
          requestingChurch: { select: { name: true, email: true } },
        },
      });
      if (!req || !req.requestingChurch.email) return;

      const subject = `Loan Request Approved: ${req.resource.title}`;
      const html = buildEmailHtml("Request Approved", [
        `Hello ${req.requestingChurch.name},`,
        `Your request to borrow <strong>&ldquo;${req.resource.title}&rdquo;</strong> from ${req.resource.church.name} has been approved.`,
        `Please coordinate pickup with the lending church.`,
      ]);
      await sendNotification(req.requestingChurch.email, subject, html);
    } catch (err) {
      console.error("[Email] notifyRequestApproved error:", err);
    }
  })();
}

export function notifyRequestDenied(requestId: string): void {
  void (async () => {
    try {
      const req = await prisma.loanRequest.findUnique({
        where: { id: requestId },
        include: {
          resource: { include: { church: { select: { name: true } } } },
          requestingChurch: { select: { name: true, email: true } },
        },
      });
      if (!req || !req.requestingChurch.email) return;

      const subject = `Loan Request Denied: ${req.resource.title}`;
      const html = buildEmailHtml("Request Denied", [
        `Hello ${req.requestingChurch.name},`,
        `Your request to borrow <strong>&ldquo;${req.resource.title}&rdquo;</strong> from ${req.resource.church.name} has been denied.`,
        req.responseMessage ? `Response: ${req.responseMessage}` : "",
      ].filter(Boolean));
      await sendNotification(req.requestingChurch.email, subject, html);
    } catch (err) {
      console.error("[Email] notifyRequestDenied error:", err);
    }
  })();
}

export function notifyRequestCancelled(requestId: string): void {
  void (async () => {
    try {
      const req = await prisma.loanRequest.findUnique({
        where: { id: requestId },
        include: {
          resource: { include: { church: { select: { name: true, email: true } } } },
          requestingChurch: { select: { name: true } },
        },
      });
      if (!req || !req.resource.church.email) return;

      const subject = `Loan Request Cancelled: ${req.resource.title}`;
      const html = buildEmailHtml("Request Cancelled", [
        `Hello ${req.resource.church.name},`,
        `${req.requestingChurch.name} has cancelled their request to borrow <strong>&ldquo;${req.resource.title}&rdquo;</strong>.`,
      ]);
      await sendNotification(req.resource.church.email, subject, html);
    } catch (err) {
      console.error("[Email] notifyRequestCancelled error:", err);
    }
  })();
}

export function notifyLoanReturned(loanId: string): void {
  void (async () => {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: {
          resource: { select: { title: true } },
          lendingChurch: { select: { name: true, email: true } },
          borrowingChurch: { select: { name: true } },
        },
      });
      if (!loan || !loan.lendingChurch.email) return;

      const subject = `Loan Returned: ${loan.resource.title}`;
      const html = buildEmailHtml("Loan Returned", [
        `Hello ${loan.lendingChurch.name},`,
        `${loan.borrowingChurch.name} has returned <strong>&ldquo;${loan.resource.title}&rdquo;</strong>.`,
        `The resource is now available again.`,
      ]);
      await sendNotification(loan.lendingChurch.email, subject, html);
    } catch (err) {
      console.error("[Email] notifyLoanReturned error:", err);
    }
  })();
}

export function notifyLoanOverdue(loanId: string): void {
  void (async () => {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: {
          resource: { select: { title: true } },
          lendingChurch: { select: { name: true } },
          borrowingChurch: { select: { name: true, email: true } },
        },
      });
      if (!loan || !loan.borrowingChurch.email) return;

      const subject = `Loan Overdue: ${loan.resource.title}`;
      const html = buildEmailHtml("Loan Overdue", [
        `Hello ${loan.borrowingChurch.name},`,
        `The loan of <strong>&ldquo;${loan.resource.title}&rdquo;</strong> from ${loan.lendingChurch.name} has been marked as overdue.`,
        `Please arrange return as soon as possible.`,
      ]);
      await sendNotification(loan.borrowingChurch.email, subject, html);
    } catch (err) {
      console.error("[Email] notifyLoanOverdue error:", err);
    }
  })();
}

export function notifyLoanLost(loanId: string): void {
  void (async () => {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: {
          resource: { select: { title: true } },
          lendingChurch: { select: { name: true, email: true } },
          borrowingChurch: { select: { name: true } },
        },
      });
      if (!loan || !loan.lendingChurch.email) return;

      const subject = `Loan Marked Lost: ${loan.resource.title}`;
      const html = buildEmailHtml("Loan Marked Lost", [
        `Hello ${loan.lendingChurch.name},`,
        `The loan of <strong>&ldquo;${loan.resource.title}&rdquo;</strong> to ${loan.borrowingChurch.name} has been marked as lost.`,
        `Please contact ${loan.borrowingChurch.name} to resolve.`,
      ]);
      await sendNotification(loan.lendingChurch.email, subject, html);
    } catch (err) {
      console.error("[Email] notifyLoanLost error:", err);
    }
  })();
}
