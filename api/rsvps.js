// api/rsvps.js
// Handles all RSVP data using Vercel KV (shared database).
//
// GET    /api/rsvps        → returns all RSVPs
// POST   /api/rsvps        → saves a new RSVP, fires notification
// DELETE /api/rsvps?id=123 → deletes one RSVP by id

import { kv } from "@vercel/kv";

const KV_KEY = "shower:rsvps";

export default async function handler(req, res) {

  // ── GET ──────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const rsvps = await kv.get(KV_KEY) || [];
      return res.status(200).json({ ok: true, rsvps });
    } catch (err) {
      console.error("KV GET error:", err);
      return res.status(500).json({ error: "Failed to load RSVPs" });
    }
  }

  // ── POST ─────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { firstName, lastName, email, phone, attendance, dietary, note } = req.body;

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const entry = {
      id: Date.now(),
      firstName, lastName, email, phone,
      attendance: attendance || "yes",
      dietary: dietary || "",
      note: note || "",
      at: new Date().toISOString(),
    };

    try {
      const existing = await kv.get(KV_KEY) || [];
      const updated  = [...existing, entry];
      await kv.set(KV_KEY, updated);

      // Fire notification (non-blocking)
      try {
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000";
        await fetch(`${baseUrl}/api/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rsvp: entry }),
        });
      } catch (notifyErr) {
        console.warn("Notification failed (non-fatal):", notifyErr.message);
      }

      return res.status(200).json({ ok: true, entry });
    } catch (err) {
      console.error("KV POST error:", err);
      return res.status(500).json({ error: "Failed to save RSVP" });
    }
  }

  // ── DELETE ───────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const id = parseInt(req.query.id);
    if (!id) return res.status(400).json({ error: "Missing id" });

    try {
      const existing = await kv.get(KV_KEY) || [];
      const updated  = existing.filter(r => r.id !== id);
      await kv.set(KV_KEY, updated);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("KV DELETE error:", err);
      return res.status(500).json({ error: "Failed to delete RSVP" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
