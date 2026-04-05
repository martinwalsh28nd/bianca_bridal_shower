import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

const C = {
  bg: "#FAF7F2",
  white: "#FFFFFF",
  ivory: "#F2EDE4",
  sage: "#4A6648",
  sageMid: "#7A9478",
  sageLight: "#C8DCC6",
  sagePale: "#ECF3EB",
  rose: "#B8897F",
  roseMid: "#DDB5AE",
  rosePale: "#F7EDEB",
  roseDark: "#8B5E55",
  dark: "#2A3828",
  mid: "#566654",
  muted: "#8FA08C",
  border: "#DDD8CF",
};

const ADMIN_PASSWORD = "shower";

const GUEST_LIST = [
  { firstName: "Emily",          lastName: "Walsh" },
  { firstName: "Claire",         lastName: "Walsh" },
  { firstName: "Chris",          lastName: "Zeman" },
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
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500&display=swap";
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

  const serif = fontsReady ? "'Playfair Display', Georgia, serif" : "Georgia, serif";
  const sans  = fontsReady ? "'Jost', system-ui, sans-serif" : "system-ui, sans-serif";

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    border: `1px solid ${C.border}`, borderRadius: 8,
    fontFamily: sans, fontSize: 15, color: C.dark,
    background: C.white, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
  };
  const labelStyle = {
    display: "block", fontSize: 11, letterSpacing: "0.08em",
    textTransform: "uppercase", color: C.muted, marginBottom: 6, fontFamily: sans,
  };
  const cardStyle = {
    background: C.white, borderRadius: 14,
    border: `1px solid ${C.border}`, padding: "1.5rem", marginBottom: "1rem",
  };
  const primaryBtn = {
    padding: "11px 22px", borderRadius: 8, border: "none",
    background: C.sage, color: C.white, fontFamily: sans,
    fontSize: 13, fontWeight: 500, letterSpacing: "0.08em",
    textTransform: "uppercase", cursor: "pointer", transition: "opacity 0.15s",
  };
  const outlineBtn = {
    padding: "11px 22px", borderRadius: 8,
    border: `1px solid ${C.border}`, background: "transparent",
    color: C.mid, fontFamily: sans, fontSize: 13, fontWeight: 400,
    letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
  };
  const greenBtn = { ...primaryBtn, background: "#2D6A2D" };
  const roseBtn  = { ...primaryBtn, background: C.rose };
  const tabBtn = (active) => ({
    padding: "13px 22px", background: "transparent", border: "none",
    borderBottom: `2px solid ${active ? C.sage : "transparent"}`,
    color: active ? C.sage : C.muted, fontFamily: sans,
    fontSize: 13, fontWeight: active ? 500 : 400,
    letterSpacing: "0.08em", textTransform: "uppercase",
    cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
  });
  const attendancePill = (val) => ({
    flex: 1, padding: "10px 6px",
    border: `1.5px solid ${form.attendance === val ? C.sage : C.border}`,
    borderRadius: 8, cursor: "pointer", textAlign: "center",
    background: form.attendance === val ? C.sagePale : C.white,
    transition: "all 0.15s",
  });
  const statCard = () => ({
    background: C.sagePale, borderRadius: 12, padding: "1rem 0.75rem",
    textAlign: "center", border: `1px solid ${C.sageLight}`,
  });

  const formValid = form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.phone.trim();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: sans, color: C.dark }}>

      {/* ── Header ── */}
      <div style={{ background: C.sage, padding: "3rem 1.5rem 2.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.06,
          backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 14, color: C.sageLight, margin: "0 0 10px", letterSpacing: "0.1em", opacity: 0.8 }}>
          Please join us to celebrate the bride to be
        </p>
        <h1 style={{ fontFamily: serif, fontSize: 38, fontWeight: 400, color: "#F5F0E8", margin: "0 0 6px", letterSpacing: "0.02em" }}>
          Bianca Jenkins
        </h1>
        <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 16, color: C.sageLight, margin: "0 0 16px", opacity: 0.85 }}>
          bridal shower
        </p>
        <div style={{ display: "inline-flex", gap: 24, fontSize: 13, color: C.sageLight, opacity: 0.75, letterSpacing: "0.1em" }}>
          <span>JUNE 6, 2026</span>
          <span>·</span>
          <span>NOON</span>
          <span>·</span>
          <a
            href="https://maps.apple.com/?address=200+E+Chestnut+Street,Chicago,IL+60611&q=Francesca%27s+on+Chestnut"
            target="_blank" rel="noopener noreferrer"
            style={{ color: C.sageLight, textDecoration: "underline", textDecorationColor: "rgba(200,220,198,0.45)", textUnderlineOffset: 3, letterSpacing: "0.1em" }}
          >
            FRANCESCA'S ON CHESTNUT
          </a>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "center", position: "relative" }}>
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
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.sagePale, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", border: `1px solid ${C.sageLight}` }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M4 11L9 16L18 6" stroke={C.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, color: C.dark, margin: "0 0 10px" }}>Thank you!</h2>
              <p style={{ color: C.mid, lineHeight: 1.75, margin: "0 0 2rem", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                Your response has been received. We can't wait to celebrate with you!
              </p>
              <button onClick={() => { setSubmitted(false); setRsvpError(""); setForm({ firstName: "", lastName: "", email: "", phone: "", attendance: "yes", dietary: "", note: "" }); }} style={outlineBtn}>
                Submit Another Response
              </button>
            </div>
          ) : (
            <div style={cardStyle}>
              <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: C.dark, margin: "0 0 1.75rem" }}>Your Response</h2>

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
                      <div style={{ fontSize: 12, color: form.attendance === val ? C.sage : C.muted, fontWeight: form.attendance === val ? 500 : 400, lineHeight: 1.4 }}>{lbl}</div>
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
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.rosePale, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", border: `1px solid ${C.roseMid}` }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <path d="M13 3C13 3 6 7 6 13C6 16.31 9.13 19 13 19C16.87 19 20 16.31 20 13C20 7 13 3 13 3Z" stroke={C.rose} strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M13 19V23" stroke={C.rose} strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9 23H17" stroke={C.rose} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, color: C.dark, margin: "0 0 10px" }}>Gift Registry</h2>
              <p style={{ color: C.mid, lineHeight: 1.75, margin: "0 0 2rem", maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
                Bianca's registry links will be added here soon. Check back for curated wish lists from her favorite stores.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                {[
                  { name: "Williams Sonoma", sub: "Kitchen & Home" },
                  { name: "Crate & Barrel", sub: "Dining & Décor" },
                  { name: "Zola", sub: "Wedding Registry" },
                ].map(store => (
                  <div key={store.name} style={{ background: C.ivory, borderRadius: 10, padding: "1.25rem 0.75rem", border: `1px solid ${C.border}`, opacity: 0.65 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: C.border, margin: "0 auto 10px" }} />
                    <div style={{ fontSize: 12, fontWeight: 500, color: C.mid, marginBottom: 3 }}>{store.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{store.sub}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 8, letterSpacing: "0.06em" }}>COMING SOON</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...cardStyle, background: C.sagePale, border: `1px solid ${C.sageLight}`, padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ color: C.sageMid, fontSize: 18, flexShrink: 0 }}>💡</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.dark, marginBottom: 4 }}>For the organizer</div>
                  <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.65 }}>
                    Replace the placeholder store cards with real registry links by editing the registry section of this app. Each card can link to a specific registry page.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ADMIN TAB ═══ */}
        {tab === "admin" && (
          !adminUnlocked ? (
            <div style={{ ...cardStyle, maxWidth: 380, margin: "0 auto" }}>
              <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, textAlign: "center", margin: "0 0 6px" }}>Admin Access</h2>
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
                    <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, color: C.sage, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{lbl}</div>
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
                <div style={{ ...cardStyle, background: C.sagePale, border: `1px solid ${C.sageLight}`, marginBottom: "1.5rem" }}>
                  <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 400, margin: "0 0 10px", color: C.dark }}>Email RSVP Summary</h3>
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
                    if (rFirst !== gFirst) continue;
                    if (norm(r.lastName) === norm(g.lastName)) return { rsvp: r, exact: true };
                    const shared = rLastWords.some(w => gLastWords.includes(w)) || gLastWords.some(w => rLastWords.includes(w));
                    if (shared) return { rsvp: r, exact: false };
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
                                    background: r.attendance === "yes" ? C.sagePale : r.attendance === "no" ? C.rosePale : "#FFF5F0",
                                    color: r.attendance === "yes" ? C.sage : r.attendance === "no" ? C.roseDark : "#9B7040",
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
                      <span style={{ color: C.sage }}>{attending} attending</span>
                      <span>·</span>
                      <span style={{ color: C.roseDark }}>{declining} declining</span>
                      <span>·</span>
                      <span style={{ color: "#9B7040" }}>{maybe} maybe</span>
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
                  <div style={{ fontFamily: serif, fontSize: 18, marginBottom: 8, color: C.sageMid }}>No responses yet</div>
                  <div style={{ fontSize: 13 }}>Share the link to start collecting RSVPs.</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                    {rsvps.length} Response{rsvps.length !== 1 ? "s" : ""}
                  </div>
                  {rsvps.slice().reverse().map(r => (
                    <div key={r.id} style={{ ...cardStyle, marginBottom: 10, borderLeft: `3px solid ${r.attendance === "yes" ? C.sage : r.attendance === "no" ? C.rose : C.roseMid}` }}>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontFamily: serif, fontSize: 17, fontWeight: 400 }}>{r.firstName} {r.lastName}</span>
                            <span style={{
                              fontSize: 11, padding: "2px 8px", borderRadius: 20,
                              background: r.attendance === "yes" ? C.sagePale : r.attendance === "no" ? C.rosePale : "#FFF5F0",
                              color: r.attendance === "yes" ? C.sage : r.attendance === "no" ? C.roseDark : "#9B7040",
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
