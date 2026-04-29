import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function billingFromAddress(facilityName: string): string {
  return `${facilityName} via Kinroster <billing@${process.env.RESEND_DOMAIN || "kinroster.com"}>`;
}

type BillingReminderKey = "trial_7_day" | "trial_1_day" | "trial_expired";

interface BillingEmailContent {
  subject: string;
  html: string;
}

function billingEmailContent(
  reminder: BillingReminderKey,
  params: { adminName: string | null; facilityName: string; billingUrl: string }
): BillingEmailContent {
  const greeting = params.adminName
    ? `Hi ${params.adminName.split(" ")[0]},`
    : "Hello,";

  if (reminder === "trial_7_day") {
    return {
      subject: `Your Kinroster free trial ends in a week`,
      html: buildBillingEmailHtml({
        ...params,
        greeting,
        bodyHtml: `<p style="margin: 0 0 16px 0; line-height: 1.6;">Your Kinroster free trial for <strong>${params.facilityName}</strong> ends in 7 days.</p><p style="margin: 0 0 16px 0; line-height: 1.6;">No payment is needed yet — when you're ready, click below to keep your team's documentation flowing without interruption.</p>`,
        ctaLabel: "Set up billing",
      }),
    };
  }
  if (reminder === "trial_1_day") {
    return {
      subject: `Your Kinroster free trial ends tomorrow`,
      html: buildBillingEmailHtml({
        ...params,
        greeting,
        bodyHtml: `<p style="margin: 0 0 16px 0; line-height: 1.6;">Your Kinroster free trial for <strong>${params.facilityName}</strong> ends <strong>tomorrow</strong>.</p><p style="margin: 0 0 16px 0; line-height: 1.6;">Add a payment method now to keep documentation working without a gap.</p>`,
        ctaLabel: "Subscribe now",
      }),
    };
  }
  return {
    subject: `Your Kinroster free trial has ended`,
    html: buildBillingEmailHtml({
      ...params,
      greeting,
      bodyHtml: `<p style="margin: 0 0 16px 0; line-height: 1.6;">Your Kinroster free trial for <strong>${params.facilityName}</strong> has ended.</p><p style="margin: 0 0 16px 0; line-height: 1.6;">Note creation, voice sessions, and AI summaries are paused until you subscribe. Your data is safe and waiting for you.</p>`,
      ctaLabel: "Subscribe now",
    }),
  };
}

function buildBillingEmailHtml(params: {
  facilityName: string;
  greeting: string;
  bodyHtml: string;
  ctaLabel: string;
  billingUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; background: #ffffff;">
  <div style="border-bottom: 2px solid #e5e5e5; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; font-size: 18px; color: #1a1a1a;">Kinroster</h2>
  </div>
  <p style="margin: 0 0 16px 0; line-height: 1.6;">${params.greeting}</p>
  ${params.bodyHtml}
  <p style="margin: 24px 0;">
    <a href="${params.billingUrl}" style="background: #1a1a1a; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 500;">${params.ctaLabel}</a>
  </p>
  <div style="border-top: 1px solid #e5e5e5; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #666;">
    <p style="margin: 0;">This billing reminder was sent to the admin(s) of ${params.facilityName} on Kinroster.</p>
  </div>
</body>
</html>`;
}

export async function sendBillingEmail(params: {
  to: string;
  adminName: string | null;
  facilityName: string;
  reminder: BillingReminderKey;
  billingUrl: string;
}): Promise<{ id: string }> {
  if (!resend) {
    throw new Error("Email sending is not configured (RESEND_API_KEY missing)");
  }

  const { subject, html } = billingEmailContent(params.reminder, {
    adminName: params.adminName,
    facilityName: params.facilityName,
    billingUrl: params.billingUrl,
  });

  const { data, error } = await resend.emails.send({
    from: billingFromAddress(params.facilityName),
    to: params.to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { id: data!.id };
}

interface SendEmailParams {
  to: string;
  fromName: string;
  replyTo: string;
  subject: string;
  body: string;
}

export async function sendFamilyEmail({
  to,
  fromName,
  replyTo,
  subject,
  body,
}: SendEmailParams): Promise<{ id: string }> {
  if (!resend) {
    throw new Error("Email sending is not configured (RESEND_API_KEY missing)");
  }

  const html = buildEmailHtml(body, fromName);

  const { data, error } = await resend.emails.send({
    from: `${fromName} <updates@${process.env.RESEND_DOMAIN || "kinroster.com"}>`,
    replyTo,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { id: data!.id };
}

interface SendClinicianPortalLinkParams {
  to: string;
  clinicianName: string;
  fromName: string;
  replyTo: string;
  facilityName: string;
  residentDisplay: string;
  portalUrl: string;
  expiresAt: Date;
}

// Sends a notification email containing the magic-link URL ONLY. The clinical
// summary itself lives behind the portal so that PHI never leaves HTTPS into
// the recipient's email provider.
export async function sendClinicianPortalLink({
  to,
  clinicianName,
  fromName,
  replyTo,
  facilityName,
  residentDisplay,
  portalUrl,
  expiresAt,
}: SendClinicianPortalLinkParams): Promise<{ id: string }> {
  if (!resend) {
    throw new Error("Email sending is not configured (RESEND_API_KEY missing)");
  }

  const expiresDisplay = expiresAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const subject = `Clinical summary available — ${residentDisplay}`;
  const html = buildPortalLinkHtml({
    clinicianName,
    facilityName,
    residentDisplay,
    portalUrl,
    expiresDisplay,
  });

  const { data, error } = await resend.emails.send({
    from: `${fromName} <updates@${process.env.RESEND_DOMAIN || "kinroster.com"}>`,
    replyTo,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { id: data!.id };
}

function buildEmailHtml(body: string, facilityName: string): string {
  const paragraphs = body
    .split("\n\n")
    .map((p) => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; background: #ffffff;">
  <div style="border-bottom: 2px solid #e5e5e5; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; font-size: 18px; color: #1a1a1a;">${facilityName}</h2>
  </div>
  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px 14px; margin-bottom: 20px; border-radius: 4px; font-size: 12px; line-height: 1.5; color: #78350f;">
    <p style="margin: 0;"><strong>AI-assisted update.</strong> This message was drafted by AI from caregiver shift notes and reviewed by ${facilityName}. It reflects observations from the care team and is not a medical diagnosis or clinical assessment.</p>
  </div>
  ${paragraphs}
  <div style="border-top: 1px solid #e5e5e5; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #666;">
    <p style="margin: 0;">This update was sent by ${facilityName} using Kinroster.</p>
  </div>
</body>
</html>`;
}

function buildPortalLinkHtml(params: {
  clinicianName: string;
  facilityName: string;
  residentDisplay: string;
  portalUrl: string;
  expiresDisplay: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; background: #ffffff;">
  <div style="border-bottom: 2px solid #e5e5e5; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; font-size: 18px; color: #1a1a1a;">${params.facilityName}</h2>
  </div>
  <p style="margin: 0 0 16px 0; line-height: 1.6;">Dr. ${params.clinicianName},</p>
  <p style="margin: 0 0 16px 0; line-height: 1.6;">A clinical summary for your patient <strong>${params.residentDisplay}</strong> is ready for your review. For the patient's privacy, the summary is not included in this email. Please use the secure link below to view it.</p>
  <p style="margin: 24px 0;">
    <a href="${params.portalUrl}" style="background: #1a1a1a; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 500;">View clinical summary</a>
  </p>
  <p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 14px; color: #555;">This link expires on <strong>${params.expiresDisplay}</strong>. Opens are logged for compliance.</p>
  <div style="border-top: 1px solid #e5e5e5; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #666;">
    <p style="margin: 0 0 6px 0;">Sent by ${params.facilityName} using Kinroster.</p>
    <p style="margin: 0 0 6px 0;">The clinical summary behind this link is AI-generated from caregiver shift notes and intended for professional review. It is not a substitute for direct clinical assessment.</p>
    <p style="margin: 0;">If you weren't expecting this, you can ignore this email. The link will expire on its own.</p>
  </div>
</body>
</html>`;
}
