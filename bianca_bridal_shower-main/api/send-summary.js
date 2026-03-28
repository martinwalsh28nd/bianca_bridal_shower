// api/send-summary.js
// Called from the Admin tab "Email Summary" button.
// Uses the same Resend setup as api/notify.js.
//
// Required Vercel Environment Variables (same as notify.js):
//   RESEND_API_KEY
//   NOTIFY_FROM_EMAIL

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, summary } = req.body;
  if (!to || !summary) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFY_FROM_EMAIL;

  if (!resendKey || !fromEmail) {
    return res.status(500).json({ error: "Email not configured. Add RESEND_API_KEY and NOTIFY_FROM_EMAIL to Vercel environment variables." });
  }

  // Convert plain text summary to a simple styled HTML email
  const lines = summary.split("\n");
  const htmlLines = lines.map(line => {
    if (line.startsWith("══")) return `<hr style="border: none; border-top: 1px solid #DDD8CF; margin: 8px 0;" />`;
    if (line.startsWith("──")) return `<p style="font-weight: 500; color: #4A6648; margin: 16px 0 6px; font-size: 13px; letter-spacing: 0.08em;">${line}</p>`;
    if (line.startsWith("  •")) return `<p style="margin: 4px 0 4px 16px; font-size: 13px; color: #566654;">${line.replace("  •", "•")}</p>`;
    if (line.trim() === "") return `<br/>`;
    return `<p style="margin: 4px 0; font-size: 14px;">${line}</p>`;
  }).join("\n");

  const htmlBody = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2A3828;">
      <div style="background: #4A6648; padding: 28px 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <p style="color: #C8DCC6; font-style: italic; margin: 0 0 6px; font-size: 13px;">RSVP Summary Report</p>
        <h1 style="color: #F5F0E8; margin: 0; font-weight: 400; font-size: 26px;">Bianca Jenkins</h1>
        <p style="color: #C8DCC6; margin: 4px 0 0; font-style: italic; font-size: 15px;">Bridal Shower · June 6, 2026</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #DDD8CF; border-top: none; padding: 24px 28px; border-radius: 0 0 8px 8px; line-height: 1.7;">
        ${htmlLines}
      </div>
      <p style="text-align: center; font-size: 11px; color: #8FA08C; margin-top: 16px; font-style: italic;">
        Generated ${new Date().toLocaleString("en-US")}
      </p>
    </div>
  `;

  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: "Bianca Jenkins Bridal Shower — RSVP Summary",
        html: htmlBody,
        text: summary,
      }),
    });

    const data = await emailRes.json();
    if (!emailRes.ok) throw new Error(data.message || "Resend error");

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Summary email error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
