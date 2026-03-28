// api/notify.js
// Fires automatically whenever a guest submits an RSVP.
//
// Required Vercel Environment Variables:
//   RESEND_API_KEY      — from resend.com (free account, 100 emails/day)
//   NOTIFY_FROM_EMAIL   — e.g. "shower@yourdomain.com" (must be verified in Resend)
//   NOTIFY_TO_EMAIL     — Terri's email address for notifications
//
// Optional (for SMS via free email-to-text gateway):
//   NOTIFY_PHONE        — 10-digit number, e.g. 6308881234
//   NOTIFY_CARRIER      — one of: att | verizon | tmobile | sprint | cricket | boost | metro
//
// Carrier SMS gateways (all free, no account needed):
//   att      → number@txt.att.net
//   verizon  → number@vtext.com
//   tmobile  → number@tmomail.net
//   sprint   → number@messaging.sprintpcs.com
//   cricket  → number@mms.cricketwireless.net
//   boost    → number@sms.myboostmobile.com
//   metro    → number@mymetropcs.com

const GATEWAYS = {
  att:      "txt.att.net",
  verizon:  "vtext.com",
  tmobile:  "tmomail.net",
  sprint:   "messaging.sprintpcs.com",
  cricket:  "mms.cricketwireless.net",
  boost:    "sms.myboostmobile.com",
  metro:    "mymetropcs.com",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { rsvp } = req.body;
  if (!rsvp) return res.status(400).json({ error: "Missing rsvp data" });

  const resendKey   = process.env.RESEND_API_KEY;
  const fromEmail   = process.env.NOTIFY_FROM_EMAIL;
  const toEmail     = process.env.NOTIFY_TO_EMAIL;
  const phone       = process.env.NOTIFY_PHONE;
  const carrier     = process.env.NOTIFY_CARRIER?.toLowerCase();

  if (!resendKey || !fromEmail || !toEmail) {
    // Notifications not configured — fail silently so RSVPs still save
    return res.status(200).json({ ok: true, skipped: true });
  }

  const attendanceLabel =
    rsvp.attendance === "yes" ? "✅ Attending" :
    rsvp.attendance === "no"  ? "❌ Not attending" :
                                "🤔 Maybe";

  const fullName = `${rsvp.firstName} ${rsvp.lastName}`;

  // Build email recipients — always send to organizer; add SMS gateway if configured
  const toAddresses = [toEmail];
  if (phone && carrier && GATEWAYS[carrier]) {
    const smsAddress = `${phone.replace(/\D/g, "")}@${GATEWAYS[carrier]}`;
    toAddresses.push(smsAddress);
  }

  const subject = `New RSVP: ${fullName} — ${attendanceLabel}`;

  const htmlBody = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2A3828;">
      <div style="background: #4A6648; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <p style="color: #C8DCC6; font-style: italic; margin: 0 0 6px; font-size: 13px;">New RSVP received</p>
        <h2 style="color: #F5F0E8; margin: 0; font-weight: 400; font-size: 22px;">Bianca Jenkins Bridal Shower</h2>
      </div>
      <div style="background: #ffffff; border: 1px solid #DDD8CF; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="color: #8FA08C; padding: 6px 0; width: 120px;">Name</td><td style="font-weight: 500;">${fullName}</td></tr>
          <tr><td style="color: #8FA08C; padding: 6px 0;">Response</td><td>${attendanceLabel}</td></tr>
          <tr><td style="color: #8FA08C; padding: 6px 0;">Email</td><td>${rsvp.email}</td></tr>
          <tr><td style="color: #8FA08C; padding: 6px 0;">Phone</td><td>${rsvp.phone}</td></tr>
          ${rsvp.dietary ? `<tr><td style="color: #8FA08C; padding: 6px 0;">Dietary</td><td>${rsvp.dietary}</td></tr>` : ""}
          ${rsvp.note    ? `<tr><td style="color: #8FA08C; padding: 6px 0; vertical-align: top;">Note</td><td style="font-style: italic;">"${rsvp.note}"</td></tr>` : ""}
          <tr><td style="color: #8FA08C; padding: 6px 0;">Submitted</td><td>${new Date(rsvp.at).toLocaleString("en-US")}</td></tr>
        </table>
      </div>
    </div>
  `;

  // Short plain-text version for SMS (carriers strip HTML, limit to ~160 chars)
  const smsText = `RSVP: ${fullName} — ${attendanceLabel.replace(/[✅❌🤔]/g, "").trim()}. ${rsvp.email} | ${rsvp.phone}`;

  try {
    // Send via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toAddresses,
        subject,
        html: htmlBody,
        text: smsText,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      throw new Error(emailData.message || "Resend error");
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Notify error:", err.message);
    // Still return 200 so the guest-facing submission succeeds
    return res.status(200).json({ ok: false, error: err.message });
  }
}
