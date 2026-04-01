// api/rsvps.js
// Handles all RSVP data using Upstash Redis.
// Notification logic is inlined here to avoid unreliable internal fetch calls.
//
// Vercel environment variables (auto-added by Upstash):
//   KV_REST_API_URL
//   KV_REST_API_TOKEN
//
// Notification variables (add manually in Vercel):
//   RESEND_API_KEY
//   NOTIFY_FROM_EMAIL
//   NOTIFY_TO_EMAIL
//   NOTIFY_PHONE       (optional, 10-digit)
//   NOTIFY_CARRIER     (optional: att | verizon | tmobile | sprint | cricket | boost | metro)
//   NOTIFY_PHONE_2     (optional, second 10-digit number)
//   NOTIFY_CARRIER_2   (optional: same options as NOTIFY_CARRIER)

import { Redis } from "@upstash/redis";

const KV_KEY = "shower:rsvps";

const GATEWAYS = {
  att:     "txt.att.net",
  verizon: "vtext.com",
  tmobile: "tmomail.net",
  sprint:  "messaging.sprintpcs.com",
  cricket: "mms.cricketwireless.net",
  boost:   "sms.myboostmobile.com",
  metro:   "mymetropcs.com",
};

function getRedis() {
  return new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

async function sendNotification(rsvp) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFY_FROM_EMAIL;
  const toEmail   = process.env.NOTIFY_TO_EMAIL;

  if (!resendKey || !fromEmail || !toEmail) {
    console.log("Notification skipped — missing RESEND_API_KEY, NOTIFY_FROM_EMAIL, or NOTIFY_TO_EMAIL");
    return;
  }

  const attendanceLabel =
    rsvp.attendance === "yes" ? "Attending" :
    rsvp.attendance === "no"  ? "Not attending" : "Maybe";

  const fullName = `${rsvp.firstName} ${rsvp.lastName}`;
  const subject  = `New RSVP: ${fullName} — ${attendanceLabel}`;

  const htmlBody = `
    <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#2A3828;">
      <div style="background:#4A6648;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
        <p style="color:#C8DCC6;font-style:italic;margin:0 0 6px;font-size:13px;">New RSVP received</p>
        <h2 style="color:#F5F0E8;margin:0;font-weight:400;font-size:22px;">Bianca Jenkins Bridal Shower</h2>
      </div>
      <div style="background:#fff;border:1px solid #DDD8CF;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#8FA08C;padding:6px 0;width:120px;">Name</td><td style="font-weight:500;">${fullName}</td></tr>
          <tr><td style="color:#8FA08C;padding:6px 0;">Response</td><td>${attendanceLabel}</td></tr>
          <tr><td style="color:#8FA08C;padding:6px 0;">Email</td><td>${rsvp.email}</td></tr>
          <tr><td style="color:#8FA08C;padding:6px 0;">Phone</td><td>${rsvp.phone}</td></tr>
          ${rsvp.dietary ? `<tr><td style="color:#8FA08C;padding:6px 0;">Dietary</td><td>${rsvp.dietary}</td></tr>` : ""}
          ${rsvp.note    ? `<tr><td style="color:#8FA08C;padding:6px 0;vertical-align:top;">Note</td><td style="font-style:italic;">"${rsvp.note}"</td></tr>` : ""}
          <tr><td style="color:#8FA08C;padding:6px 0;">Submitted</td><td>${new Date(rsvp.at).toLocaleString("en-US")}</td></tr>
        </table>
      </div>
    </div>
  `;

  const smsText = `RSVP: ${fullName} - ${attendanceLabel}. ${rsvp.email} | ${rsvp.phone}`;

  // Build recipient list
  const toAddresses = [toEmail];
  const phone   = process.env.NOTIFY_PHONE;
  const carrier = process.env.NOTIFY_CARRIER?.toLowerCase();
  if (phone && carrier && GATEWAYS[carrier]) {
    toAddresses.push(`${phone.replace(/\D/g, "")}@${GATEWAYS[carrier]}`);
  }

  const phone2   = process.env.NOTIFY_PHONE_2;
  const carrier2 = process.env.NOTIFY_CARRIER_2?.toLowerCase();
  if (phone2 && carrier2 && GATEWAYS[carrier2]) {
    toAddresses.push(`${phone2.replace(/\D/g, "")}@${GATEWAYS[carrier2]}`);
  }

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from:    fromEmail,
      to:      toAddresses,
      subject,
      html:    htmlBody,
      text:    smsText,
    }),
  });

  const emailData = await emailRes.json();
  if (!emailRes.ok) {
    throw new Error(emailData.message || "Resend error");
  }
  console.log(`Notification sent to ${toAddresses.join(", ")}`);
}

export default async function handler(req, res) {

  // ── GET all RSVPs ────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const redis = getRedis();
      const rsvps = await redis.get(KV_KEY) || [];
      return res.status(200).json({ ok: true, rsvps });
    } catch (err) {
      console.error("GET error:", err);
      return res.status(500).json({ error: "Failed to load RSVPs: " + err.message });
    }
  }

  // ── POST new RSVP ────────────────────────────────────────────
  if (req.method === "POST") {
    const { firstName, lastName, email, phone, attendance, dietary, note } = req.body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const entry = {
      id: Date.now(),
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     email.trim(),
      phone:     phone.trim(),
      attendance: attendance || "yes",
      dietary:   dietary?.trim() || "",
      note:      note?.trim() || "",
      at:        new Date().toISOString(),
    };

    try {
      const redis    = getRedis();
      const existing = await redis.get(KV_KEY) || [];
      const updated  = [...existing, entry];
      await redis.set(KV_KEY, updated);
      console.log(`RSVP saved for ${entry.firstName} ${entry.lastName}`);
    } catch (err) {
      console.error("KV save error:", err);
      return res.status(500).json({ error: "Failed to save RSVP: " + err.message });
    }

    // Send notification — inline, no internal HTTP call
    try {
      await sendNotification(entry);
    } catch (err) {
      // Non-fatal — RSVP is already saved
      console.error("Notification error (non-fatal):", err.message);
    }

    return res.status(200).json({ ok: true, entry });
  }

  // ── DELETE one RSVP ─────────────────────────────────────────
  if (req.method === "DELETE") {
    const id = parseInt(req.query.id);
    if (!id) return res.status(400).json({ error: "Missing id" });

    try {
      const redis    = getRedis();
      const existing = await redis.get(KV_KEY) || [];
      const updated  = existing.filter(r => r.id !== id);
      await redis.set(KV_KEY, updated);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("DELETE error:", err);
      return res.status(500).json({ error: "Failed to delete RSVP: " + err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
