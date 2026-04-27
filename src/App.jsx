import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

const C = {
  bg: "#F4F0E8",
  white: "#FAFAF8",
  cream: "#EDE8DF",
  slate: "#3D4F63",
  slateMid: "#5A7189",
  slateLight: "#C5D8E6",
  slatePale: "#EDF3F8",
  dusty: "#8FADC4",
  gold: "#B89A6A",
  goldLight: "#E8D9C0",
  dark: "#2C3A47",
  mid: "#5A6E7E",
  muted: "#8FA0AF",
  border: "#DDD5C9",
  rose: "#B8897F",
  roseMid: "#DDB5AE",
  rosePale: "#F7EDEB",
  roseDark: "#8B5E55",
};

const ADMIN_PASSWORD = "shower";

const GUEST_LIST = [
  { firstName: "Emily",          lastName: "Walsh" },
  { firstName: "Claire",         lastName: "Walsh" },
  { firstName: "Christine",       lastName: "Zeman" },
  { firstName: "Laura",          lastName: "Zeman" },
  { firstName: "Dorothy",        lastName: "DeVoy" },
  { firstName: "Jeff",           lastName: "DeVoy" },
  { firstName: "Bianca",         lastName: "Jenkins" },
  { firstName: "Lynn",           lastName: "Jenkins" },
  { firstName: "Hannah",         lastName: "Duehren" },
  { firstName: "Annette",        lastName: "Katamay" },
  { firstName: "Margie",         lastName: "Gedeit" },
  { firstName: "Cathy",          lastName: "McClarey" },
  { firstName: "Maria",          lastName: "Wesolowski" },
  { firstName: "Jackie",         lastName: "Pajor" },
  { firstName: "Mary",           lastName: "Condon" },
  { firstName: "Jeff",           lastName: "" },
  { firstName: "Jake",           lastName: "" },
  { firstName: "Lindsay",        lastName: "Gil" },
  { firstName: "Liz",            lastName: "Boschma" },
  { firstName: "Kristine",       lastName: "Petrella" },
  { firstName: "Haley",          lastName: "Masters" },
  { firstName: "Darnell",        lastName: "Thomas" },
  { firstName: "Leah",           lastName: "Long" },
  { firstName: "Dani",           lastName: "Navarro" },
  { firstName: "Bobby",          lastName: "Navarro" },
  { firstName: "Hanna",          lastName: "Meidel" },
  { firstName: "Alexa",          lastName: "DeLaHera" },
  { firstName: "Jackie",         lastName: "Steiff" },
  { firstName: "Meredith",       lastName: "Olson" },
  { firstName: "Caroline",       lastName: "Moroz" },
  { firstName: "Kelsey",         lastName: "Visser Snider" },
];

export default function App() {
  const [tab, setTab] = useState("rsvp");
  const [rsvps, setRsvps] = useState([]);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminPassErr, setAdminPassErr] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    attendance: "yes", dietary: "", note: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailState, setEmailState] = useState("idle");
  const [emailMsg, setEmailMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [rsvpError, setRsvpError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [adminView, setAdminView] = useState("details");

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Raleway:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    setTimeout(() => setFontsReady(true), 600);
    return () => { try { document.head.removeChild(link); } catch (e) {} };
  }, []);

  const loadRsvps = async () => {
    try {
      const res = await fetch("/api/rsvps");
      const data = await res.json();
      if (res.ok && data.ok) setRsvps(data.rsvps);
    } catch (e) {
      console.error("Failed to load RSVPs:", e.message);
    }
  };

  useEffect(() => { loadRsvps(); }, []);

  const submitRsvp = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) return;
    setSubmitting(true);
    setRsvpError("");
    try {
      const res = await fetch("/api/rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
    } catch (e) {
      setRsvpError(e.message || "Could not save your RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRsvp = async (id) => {
    try {
      await fetch(`/api/rsvps?id=${id}`, { method: "DELETE" });
      setRsvps(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error("Delete failed:", e.message);
    }
    setDeleteConfirm(null);
  };

  const sendEmailSummary = async () => {
    if (!emailTo.trim()) return;
    setEmailState("sending");
    const yes = rsvps.filter(r => r.attendance === "yes");
    const no  = rsvps.filter(r => r.attendance === "no");
    const maybe = rsvps.filter(r => r.attendance === "maybe");
    const lines = [
      "BIANCA JENKINS BRIDAL SHOWER — RSVP SUMMARY",
      "═".repeat(44), "",
      `Total Responses : ${rsvps.length}`,
      `Attending       : ${yes.length}`,
      `Not Attending   : ${no.length}`,
      `Maybe           : ${maybe.length}`, "",
      "── ATTENDING ──",
      ...(yes.length   ? yes.map(r   => `  • ${r.firstName} ${r.lastName} | ${r.email} | ${r.phone}${r.dietary ? ` | Dietary: ${r.dietary}` : ""}${r.note ? ` | "${r.note}"` : ""}`) : ["  None yet"]), "",
      "── NOT ATTENDING ──",
      ...(no.length    ? no.map(r    => `  • ${r.firstName} ${r.lastName} | ${r.email} | ${r.phone}${r.note ? ` | "${r.note}"` : ""}`) : ["  None yet"]), "",
      "── MAYBE ──",
      ...(maybe.length ? maybe.map(r => `  • ${r.firstName} ${r.lastName} | ${r.email} | ${r.phone}${r.note ? ` | "${r.note}"` : ""}`) : ["  None yet"]),
    ];
    try {
      const res = await fetch("/api/send-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailTo, summary: lines.join("\n") }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setEmailState("done");
        setEmailMsg(`Summary sent to ${emailTo}`);
      } else {
        throw new Error(data.error || "Send failed");
      }
    } catch (e) {
      setEmailState("error");
      setEmailMsg(e.message || "Could not send email");
    }
  };

  const exportExcel = () => {
    const rows = rsvps.map(r => ({
      "First Name":    r.firstName,
      "Last Name":     r.lastName,
      "Email":         r.email,
      "Phone":         r.phone,
      "Attendance":    r.attendance === "yes" ? "Attending" : r.attendance === "no" ? "Not Attending" : "Maybe",
      "Dietary":       r.dietary || "",
      "Note":          r.note || "",
      "Submitted":     new Date(r.at).toLocaleString("en-US"),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws["!cols"] = [
      { wch: 14 }, { wch: 16 }, { wch: 28 }, { wch: 16 },
      { wch: 15 }, { wch: 22 }, { wch: 36 }, { wch: 22 },
    ];

    // Bold header row
    const headerKeys = Object.keys(rows[0] || {});
    headerKeys.forEach((_, i) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: i });
      if (ws[cell]) ws[cell].s = { font: { bold: true } };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
    XLSX.writeFile(wb, "Bianca_Jenkins_Shower_RSVPs.xlsx");
  };

  const stats = {
    total: rsvps.length,
    yes:   rsvps.filter(r => r.attendance === "yes").length,
    no:    rsvps.filter(r => r.attendance === "no").length,
    maybe: rsvps.filter(r => r.attendance === "maybe").length,
  };

  const script = fontsReady ? "'Great Vibes', cursive" : "cursive";
  const serif  = fontsReady ? "'Cormorant Garamond', Georgia, serif" : "Georgia, serif";
  const sans   = fontsReady ? "'Raleway', system-ui, sans-serif" : "system-ui, sans-serif";

  const inputStyle = {
    width: "100%", padding: "11px 16px",
    border: `1px solid ${C.border}`, borderRadius: 0,
    fontFamily: serif, fontSize: 16, color: C.dark,
    background: C.white, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
    letterSpacing: "0.02em",
  };
  const labelStyle = {
    display: "block", fontSize: 10, letterSpacing: "0.14em",
    textTransform: "uppercase", color: C.muted, marginBottom: 7,
    fontFamily: sans, fontWeight: 500,
  };
  const cardStyle = {
    background: C.white, borderRadius: 0,
    border: `1px solid ${C.border}`, padding: "1.75rem", marginBottom: "1rem",
  };
  const primaryBtn = {
    padding: "12px 28px", borderRadius: 0,
    border: `1px solid ${C.slate}`,
    background: C.slate, color: C.white, fontFamily: sans,
    fontSize: 11, fontWeight: 500, letterSpacing: "0.14em",
    textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
  };
  const outlineBtn = {
    padding: "12px 28px", borderRadius: 0,
    border: `1px solid ${C.border}`, background: "transparent",
    color: C.mid, fontFamily: sans, fontSize: 11, fontWeight: 400,
    letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
    transition: "all 0.2s",
  };
  const greenBtn = { ...primaryBtn, background: C.slateMid, borderColor: C.slateMid };
  const roseBtn  = { ...primaryBtn, background: C.rose, borderColor: C.rose };
  const tabBtn = (active) => ({
    padding: "14px 24px", background: "transparent", border: "none",
    borderBottom: `1.5px solid ${active ? C.slate : "transparent"}`,
    color: active ? C.slate : C.muted, fontFamily: sans,
    fontSize: 10, fontWeight: active ? 600 : 400,
    letterSpacing: "0.14em", textTransform: "uppercase",
    cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
  });
  const attendancePill = (val) => ({
    flex: 1, padding: "11px 6px",
    border: `1px solid ${form.attendance === val ? C.slate : C.border}`,
    borderRadius: 0, cursor: "pointer", textAlign: "center",
    background: form.attendance === val ? C.slatePale : C.white,
    transition: "all 0.2s",
  });
  const statCard = () => ({
    background: C.slatePale, borderRadius: 0, padding: "1rem 0.75rem",
    textAlign: "center", border: `1px solid ${C.slateLight}`,
  });

  const formValid = form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.phone.trim();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: sans, color: C.dark, WebkitFontSmoothing: "antialiased" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(180deg, #EDE9E0 0%, #E8E2D6 40%, #DDD8CE 100%)",
        padding: "3rem 1.5rem 2.75rem", textAlign: "center", position: "relative", overflow: "hidden",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {/* Subtle linen texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.18,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23C4A87A' opacity='0.15'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23C4A87A' opacity='0.3'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23C4A87A' opacity='0.3'/%3E%3C/svg%3E\")",
        }} />
        {/* Fleur-de-lis */}
        <div style={{ marginBottom: 12 }}>
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.55 }}>
            <path d="M16 2C16 2 12 6 12 10C12 13 14 15 16 15C18 15 20 13 20 10C20 6 16 2 16 2Z" fill="#3D4F63"/>
            <path d="M16 15C16 15 10 14 8 18C6 22 9 26 12 26L16 38L20 26C23 26 26 22 24 18C22 14 16 15 16 15Z" fill="#3D4F63"/>
            <path d="M16 15C14 12 10 11 8 14C6 17 8 20 11 21" stroke="#3D4F63" strokeWidth="1" fill="none"/>
            <path d="M16 15C18 12 22 11 24 14C26 17 24 20 21 21" stroke="#3D4F63" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        {/* Top scrollwork */}
        <div style={{ marginBottom: 16, opacity: 0.4 }}>
          <svg width="220" height="16" viewBox="0 0 220 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M110 8 C100 8 95 4 85 4 C75 4 70 8 60 8 C50 8 45 4 35 4 C25 4 15 8 5 8" stroke="#3D4F63" strokeWidth="0.75" fill="none"/>
            <path d="M110 8 C120 8 125 4 135 4 C145 4 150 8 160 8 C170 8 175 4 185 4 C195 4 205 8 215 8" stroke="#3D4F63" strokeWidth="0.75" fill="none"/>
            <circle cx="110" cy="8" r="2" fill="#B89A6A"/>
            <circle cx="60" cy="8" r="1.5" fill="#B89A6A" opacity="0.6"/>
            <circle cx="160" cy="8" r="1.5" fill="#B89A6A" opacity="0.6"/>
          </svg>
        </div>
        <p style={{ fontFamily: sans, fontSize: 10, color: C.mid, margin: "0 0 6px", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 500 }}>
          Please join us to celebrate
        </p>
        <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 13, color: C.mid, margin: "0 0 10px", letterSpacing: "0.06em" }}>
          the bride to be
        </p>
        {/* Bottom scrollwork */}
        <div style={{ margin: "0 0 10px", opacity: 0.35 }}>
          <svg width="160" height="10" viewBox="0 0 160 10" fill="none">
            <path d="M80 5 C70 5 65 2 55 2 C45 2 40 5 30 5 C20 5 10 2 5 2" stroke="#3D4F63" strokeWidth="0.75" fill="none"/>
            <path d="M80 5 C90 5 95 2 105 2 C115 2 120 5 130 5 C140 5 150 2 155 2" stroke="#3D4F63" strokeWidth="0.75" fill="none"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: script, fontSize: 58, fontWeight: 400, color: C.slate, margin: "0 0 4px", lineHeight: 1.1 }}>
          Bianca Jenkins
        </h1>
        <p style={{ fontFamily: sans, fontSize: 10, color: C.gold, margin: "0 0 22px", letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 500 }}>
          Bridal Shower
        </p>
        <div style={{ width: 48, height: 1, background: C.gold, margin: "0 auto 18px", opacity: 0.7 }} />
        <div style={{ display: "inline-flex", gap: 20, fontSize: 10, color: C.mid, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: sans, fontWeight: 400, flexWrap: "wrap", justifyContent: "center" }}>
          <span>Saturday, June 6th, 2026</span>
          <span style={{ color: C.gold, opacity: 0.6 }}>✦</span>
          <span>Noon</span>
          <span style={{ color: C.gold, opacity: 0.6 }}>✦</span>
          <a
            href="https://maps.apple.com/?address=200+E+Chestnut+Street,Chicago,IL+60611&q=Francesca%27s+on+Chestnut"
            target="_blank" rel="noopener noreferrer"
            style={{ color: C.mid, textDecoration: "underline", textDecorationColor: `${C.gold}88`, textUnderlineOffset: 3 }}
          >
            Francesca's on Chestnut
          </a>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "center", position: "relative", boxShadow: "0 1px 8px rgba(60,50,40,0.04)" }}>
        {[["rsvp", "RSVP"], ["registry", "Registry"]].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={tabBtn(tab === id)}>{lbl}</button>
        ))}
        <button onClick={() => { setTab("admin"); loadRsvps(); }} style={{ ...tabBtn(tab === "admin"), position: "absolute", right: 0, top: 0, bottom: 0 }}>Manage</button>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>

        {/* ═══ RSVP TAB ═══ */}
        {tab === "rsvp" && (
          submitted ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: "3.5rem 2rem" }}>
              <div style={{ width: 56, height: 56, background: C.slatePale, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", border: `1px solid ${C.slateLight}` }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M4 11L9 16L18 6" stroke={C.slate} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: script, fontSize: 40, fontWeight: 400, color: C.slate, margin: "0 0 10px" }}>Thank you!</h2>
              <p style={{ color: C.mid, lineHeight: 1.75, margin: "0 0 2rem", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                Your response has been received. We can't wait to celebrate with you!
              </p>
              <button onClick={() => { setSubmitted(false); setRsvpError(""); setForm({ firstName: "", lastName: "", email: "", phone: "", attendance: "yes", dietary: "", note: "" }); }} style={outlineBtn}>
                Submit Another Response
              </button>
            </div>
          ) : (
            <div style={cardStyle}>
              <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 300, color: C.dark, margin: "0 0 0.25rem", letterSpacing: "0.02em" }}>Your Response</h2>
              <div style={{ width: 32, height: 1, background: C.gold, marginBottom: "1.75rem", opacity: 0.7 }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.25rem" }}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input style={inputStyle} placeholder="First" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input style={inputStyle} placeholder="Last" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Phone Number *</label>
                <input style={inputStyle} type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Will you be joining us?</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[["yes", "Joyfully accepts"], ["no", "Regretfully declines"], ["maybe", "Will try to attend"]].map(([val, lbl]) => (
                    <label key={val} style={attendancePill(val)}>
                      <input type="radio" name="att" value={val} checked={form.attendance === val}
                        onChange={() => setForm({ ...form, attendance: val })} style={{ display: "none" }} />
                      <div style={{ fontSize: 11, color: form.attendance === val ? C.slate : C.muted, fontWeight: form.attendance === val ? 500 : 400, lineHeight: 1.4, letterSpacing: "0.04em", fontFamily: sans }}>{lbl}</div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Dietary Restrictions</label>
                <input style={inputStyle} placeholder="Vegetarian, gluten-free, allergies…" value={form.dietary} onChange={e => setForm({ ...form, dietary: e.target.value })} />
              </div>

              <div style={{ marginBottom: "1.75rem" }}>
                <label style={labelStyle}>A Note for the Bride</label>
                <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.65 }}
                  placeholder="Share your well-wishes, memories, or advice…"
                  value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                />
              </div>

              {rsvpError && (
                <div style={{ marginBottom: "1rem", padding: "10px 14px", background: C.rosePale, borderRadius: 8, border: `1px solid ${C.roseMid}`, color: C.roseDark, fontSize: 13 }}>
                  {rsvpError}
                </div>
              )}
              <button onClick={submitRsvp} disabled={!formValid || submitting}
                style={{ ...primaryBtn, width: "100%", opacity: (formValid && !submitting) ? 1 : 0.45, padding: "13px" }}>
                {submitting ? "Submitting…" : "Submit RSVP"}
              </button>
            </div>
          )
        )}

        {/* ═══ REGISTRY TAB ═══ */}
        {tab === "registry" && (
          <div>
            <div style={{ ...cardStyle, textAlign: "center", padding: "3rem 2rem 2.5rem", marginBottom: "1rem" }}>
              <div style={{ width: 56, height: 56, background: C.slatePale, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", border: `1px solid ${C.slateLight}` }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 12V22H4V12" stroke={C.slate} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 7H2V12H22V7Z" stroke={C.slate} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22V7" stroke={C.slate} strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" stroke={C.slate} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" stroke={C.slate} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: script, fontSize: 42, fontWeight: 400, color: C.slate, margin: "0 0 10px" }}>Gift Registry</h2>
              <p style={{ color: C.mid, lineHeight: 1.85, margin: "0 0 2rem", maxWidth: 360, marginLeft: "auto", marginRight: "auto", fontFamily: serif, fontSize: 16 }}>
                Bianca & Jacob have thoughtfully curated their registry at the following retailers.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: "1.5rem" }}>
                {[
                  { name: "Zola", sub: "Wedding Registry", url: "https://www.zola.com/registry/biancaandjacoboctober17" },
                  { name: "Crate & Barrel", sub: "Home & Dining", url: "https://www.crateandbarrel.com/gift-registry/bianca-jenkins-and-jacob-devoy/r7439269" },
                ].map(store => (
                  <a
                    key={store.name}
                    href={store.url}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "block", padding: "1.5rem 1rem",
                      background: C.white, border: `1px solid ${C.border}`,
                      textDecoration: "none", color: C.dark,
                      transition: "all 0.2s", textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 10, color: C.gold, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: sans, marginBottom: 8, fontWeight: 500 }}>
                      Registered at
                    </div>
                    <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: C.slate, marginBottom: 4, letterSpacing: "0.02em" }}>
                      {store.name}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: sans, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                      {store.sub}
                    </div>
                    <div style={{ width: 24, height: 1, background: C.gold, margin: "0 auto 14px", opacity: 0.7 }} />
                    <div style={{ fontSize: 10, color: C.slate, fontFamily: sans, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500 }}>
                      View Registry →
                    </div>
                  </a>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: sans, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Bianca Jenkins &nbsp;✦&nbsp; Jacob DeVoy &nbsp;✦&nbsp; October 17, 2026
              </div>
            </div>
          </div>
        )}

        {/* ═══ ADMIN TAB ═══ */}
        {tab === "admin" && (
          !adminUnlocked ? (
            <div style={{ ...cardStyle, maxWidth: 380, margin: "0 auto" }}>
              <h2 style={{ fontFamily: script, fontSize: 38, fontWeight: 400, textAlign: "center", margin: "0 0 6px", color: C.slate }}>Admin Access</h2>
              <p style={{ fontSize: 13, color: C.muted, textAlign: "center", margin: "0 0 1.5rem" }}>Enter the password to manage RSVPs</p>
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Password</label>
                <input style={{ ...inputStyle, borderColor: adminPassErr ? C.rose : C.border }}
                  type="password" placeholder="••••••" value={adminPass}
                  onChange={e => { setAdminPass(e.target.value); setAdminPassErr(false); }}
                  onKeyDown={e => e.key === "Enter" && (adminPass === ADMIN_PASSWORD ? setAdminUnlocked(true) : setAdminPassErr(true))}
                />
                {adminPassErr && <p style={{ fontSize: 12, color: C.rose, margin: "5px 0 0" }}>Incorrect password</p>}
              </div>
              <button onClick={() => adminPass === ADMIN_PASSWORD ? setAdminUnlocked(true) : setAdminPassErr(true)}
                style={{ ...primaryBtn, width: "100%", padding: "13px" }}>
                Unlock
              </button>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
                {[
                  { label: "Total", value: stats.total },
                  { label: "Attending", value: stats.yes },
                  { label: "Not Attending", value: stats.no },
                  { label: "Maybe", value: stats.maybe },
                ].map(({ label: lbl, value }) => (
                  <div key={lbl} style={statCard()}>
                    <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 300, color: C.slate, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 6, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans }}>{lbl}</div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem", flexWrap: "wrap" }}>
                <button onClick={() => { setShowEmailForm(!showEmailForm); setEmailState("idle"); setEmailMsg(""); }} style={primaryBtn}>
                  {showEmailForm ? "Hide Email Form" : "Email Summary"}
                </button>
                <button onClick={exportExcel} disabled={rsvps.length === 0} style={{ ...greenBtn, opacity: rsvps.length === 0 ? 0.45 : 1 }}>
                  Export Excel
                </button>
                <button onClick={() => setAdminUnlocked(false)} style={outlineBtn}>Lock</button>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: "1.25rem" }}>
                {[["table", "Guest Table"], ["details", "Full Responses"]].map(([id, lbl]) => (
                  <button key={id} onClick={() => setAdminView(id)} style={{
                    padding: "9px 18px", background: "transparent", border: "none",
                    borderBottom: `2px solid ${adminView === id ? C.sage : "transparent"}`,
                    color: adminView === id ? C.sage : C.muted, fontFamily: sans,
                    fontSize: 12, fontWeight: adminView === id ? 500 : 400,
                    letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer",
                  }}>{lbl}</button>
                ))}
              </div>

              {/* Email summary form */}
              {showEmailForm && (
                <div style={{ ...cardStyle, background: C.slatePale, border: `1px solid ${C.slateLight}`, marginBottom: "1.5rem" }}>
                  <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, margin: "0 0 10px", color: C.dark, letterSpacing: "0.02em" }}>Email RSVP Summary</h3>
                  <p style={{ fontSize: 13, color: C.mid, margin: "0 0 1rem", lineHeight: 1.65 }}>
                    Send a full summary of all {stats.total} responses ({stats.yes} attending · {stats.no} not attending · {stats.maybe} maybe) to any email address.
                  </p>
                  {emailState === "done" ? (
                    <div style={{ padding: "12px 14px", background: C.white, borderRadius: 8, border: `1px solid ${C.sageLight}`, color: C.sage, fontSize: 14 }}>
                      ✓ {emailMsg}
                    </div>
                  ) : emailState === "error" ? (
                    <div>
                      <div style={{ padding: "12px 14px", background: C.rosePale, borderRadius: 8, border: `1px solid ${C.roseMid}`, color: C.roseDark, fontSize: 13, marginBottom: 10 }}>
                        Error: {emailMsg}
                      </div>
                      <button onClick={sendEmailSummary} style={primaryBtn}>Try Again</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={labelStyle}>Send to email</label>
                        <input style={inputStyle} type="email" placeholder="terri@example.com" value={emailTo}
                          onChange={e => setEmailTo(e.target.value)} disabled={emailState === "sending"} />
                      </div>
                      <button onClick={sendEmailSummary} disabled={!emailTo.trim() || emailState === "sending"}
                        style={{ ...primaryBtn, opacity: (!emailTo.trim() || emailState === "sending") ? 0.55 : 1 }}>
                        {emailState === "sending" ? "Sending…" : "Send Summary"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Guest Table View ── */}
              {adminView === "table" && (() => {
                const norm = s => s.toLowerCase().trim();
                const findMatch = (g) => {
                  const gFirst = norm(g.firstName);
                  const gLastWords = norm(g.lastName).split(/\s+/).filter(Boolean);
                  for (const r of rsvps) {
                    const rFirst = norm(r.firstName);
                    const rLastWords = norm(r.lastName).split(/\s+/).filter(Boolean);
                    const firstMatch = rFirst === gFirst || rFirst.startsWith(gFirst) || gFirst.startsWith(rFirst);
                    if (!firstMatch) continue;
                    const lastExact = norm(r.lastName) === norm(g.lastName);
                    const shared = rLastWords.some(w => gLastWords.includes(w)) || gLastWords.some(w => rLastWords.includes(w));
                    if (lastExact && rFirst === gFirst) return { rsvp: r, exact: true };
                    if (lastExact || shared) return { rsvp: r, exact: false };
                  }
                  return { rsvp: null, exact: false };
                };
                const guestRows = GUEST_LIST.map(g => {
                  const { rsvp, exact } = findMatch(g);
                  return { ...g, rsvp, exactMatch: exact };
                });
                const responded = guestRows.filter(g => g.rsvp !== null).length;
                const attending  = guestRows.filter(g => g.rsvp?.attendance === "yes").length;
                const declining  = guestRows.filter(g => g.rsvp?.attendance === "no").length;
                const maybe      = guestRows.filter(g => g.rsvp?.attendance === "maybe").length;
                const pending    = guestRows.filter(g => !g.rsvp).length;
                return (
                  <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: C.sagePale, borderBottom: `1px solid ${C.sageLight}` }}>
                          {["#", "Name", "Response", "Dietary"].map(h => (
                            <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontFamily: sans, fontWeight: 500, fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {guestRows.map((g, i) => {
                          const r = g.rsvp;
                          return (
                            <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.bg }}>
                              <td style={{ padding: "10px 16px", color: C.muted, fontFamily: sans, width: 36 }}>{i + 1}</td>
                              <td style={{ padding: "10px 16px" }}>
                                <div style={{ fontFamily: serif, fontSize: 15 }}>{g.firstName} {g.lastName}</div>
                                {r && !g.exactMatch && (
                                  <div style={{ fontSize: 11, color: C.muted, fontFamily: sans, marginTop: 2, fontStyle: "italic" }}>
                                    responded as: {r.firstName} {r.lastName}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "10px 16px" }}>
                                {r ? (
                                  <span style={{
                                    fontSize: 11, padding: "2px 10px", borderRadius: 20, fontFamily: sans,
                                    background: r.attendance === "yes" ? C.slatePale : r.attendance === "no" ? C.rosePale : "#F5F0E8",
                                    color: r.attendance === "yes" ? C.slate : r.attendance === "no" ? C.roseDark : C.gold,
                                    letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap",
                                  }}>
                                    {r.attendance === "yes" ? "✓ Attending" : r.attendance === "no" ? "✗ Declining" : "? Maybe"}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, fontFamily: sans, background: C.ivory, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                                    — No Response
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "10px 16px", color: C.mid, fontFamily: sans, fontSize: 13 }}>
                                {r?.dietary || <span style={{ color: C.muted }}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ padding: "10px 16px", background: C.bg, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.muted, fontFamily: sans, letterSpacing: "0.05em", display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span>{GUEST_LIST.length} invited</span>
                      <span>·</span>
                      <span style={{ color: C.slate }}>{attending} attending</span>
                      <span>·</span>
                      <span style={{ color: C.roseDark }}>{declining} declining</span>
                      <span>·</span>
                      <span style={{ color: C.gold }}>{maybe} maybe</span>
                      <span>·</span>
                      <span>{pending} no response</span>
                    </div>
                  </div>
                );
              })()}

              {/* ── Full Responses (Details) View ── */}
              {adminView === "details" && (
              rsvps.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: "center", padding: "3rem", color: C.muted }}>
                  <div style={{ fontFamily: script, fontSize: 32, marginBottom: 8, color: C.dusty }}>No responses yet</div>
                  <div style={{ fontSize: 13 }}>Share the link to start collecting RSVPs.</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                    {rsvps.length} Response{rsvps.length !== 1 ? "s" : ""}
                  </div>
                  {rsvps.slice().reverse().map(r => (
                    <div key={r.id} style={{ ...cardStyle, marginBottom: 10, borderLeft: `2px solid ${r.attendance === "yes" ? C.dusty : r.attendance === "no" ? C.rose : C.gold}` }}>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontFamily: serif, fontSize: 17, fontWeight: 400 }}>{r.firstName} {r.lastName}</span>
                            <span style={{
                              fontSize: 11, padding: "2px 8px", borderRadius: 20,
                              background: r.attendance === "yes" ? C.slatePale : r.attendance === "no" ? C.rosePale : "#F5F0E8",
                              color: r.attendance === "yes" ? C.slate : r.attendance === "no" ? C.roseDark : C.gold,
                              letterSpacing: "0.05em", textTransform: "uppercase",
                            }}>
                              {r.attendance === "yes" ? "Attending" : r.attendance === "no" ? "Not Attending" : "Maybe"}
                            </span>
                          </div>
                          {r.email   && <div style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>{r.email}</div>}
                          {r.phone   && <div style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>{r.phone}</div>}
                          {r.dietary && <div style={{ fontSize: 13, color: C.mid,  marginBottom: 3 }}>🍽 {r.dietary}</div>}
                          {r.note    && <div style={{ fontSize: 13, fontStyle: "italic", color: C.mid, lineHeight: 1.5, marginBottom: 3 }}>"{r.note}"</div>}
                          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.04em", marginTop: 6 }}>
                            {new Date(r.at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <button onClick={() => setDeleteConfirm(deleteConfirm === r.id ? null : r.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 20, padding: "0 2px", lineHeight: 1, flexShrink: 0 }}>
                          ×
                        </button>
                      </div>
                      {deleteConfirm === r.id && (
                        <div style={{ marginTop: 12, padding: "10px 12px", background: C.rosePale, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 13, color: C.roseDark }}>Remove this response?</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => deleteRsvp(r.id)} style={{ ...roseBtn, padding: "6px 14px", fontSize: 12 }}>Remove</button>
                            <button onClick={() => setDeleteConfirm(null)} style={{ ...outlineBtn, padding: "6px 14px", fontSize: 12 }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ))}
            </>
          )
        )}
      </div>
    </div>
  );
}
