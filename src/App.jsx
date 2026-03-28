import { useState, useEffect, useRef } from "react";

// ─── Supabase ────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://kzkiktkcyaazubqagfaw.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6a2lrdGtjeWFhenVicWFnZmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjEyOTgsImV4cCI6MjA5MDI5NzI5OH0.vxn0EbPqtg8-L_xCHDz4Vm4aFBuKdbUkNWnof0gOMoM";

async function sb(path, opts = {}) {
  const session = JSON.parse(localStorage.getItem("jd_session") || "null");
  const token = session?.access_token || SUPABASE_ANON;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer ?? "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}

async function sbAuth(path, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10); }

function tripStatus(start, end) {
  const t = todayStr();
  if (t < start) return "proximo";
  if (t > end) return "pasado";
  return "actual";
}

function fmtDate(d) {
  if (!d) return "";
  const [, m, day] = d.split("-");
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${parseInt(day)} ${months[parseInt(m)-1]}`;
}

function fmtDayShort(d) {
  if (!d) return "";
  const date = new Date(d + "T12:00:00");
  const days = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
  return `${days[date.getDay()]} ${date.getDate()}`;
}

function fmtDayFull(d) {
  if (!d) return "";
  const date = new Date(d + "T12:00:00");
  const days = ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"];
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function nowHour() {
  return new Date().getHours() + new Date().getMinutes() / 60;
}

function timeToHour(t) {
  if (!t) return -1;
  const lower = t.toLowerCase().replace(/\s/g, "");
  const pm = lower.includes("pm");
  const am = lower.includes("am");
  const clean = lower.replace(/[apm]/g, "");
  const [h, m = "0"] = clean.split(":");
  let hour = parseInt(h);
  if (pm && hour !== 12) hour += 12;
  if (am && hour === 12) hour = 0;
  return hour + parseInt(m) / 60;
}

const ACT_ICONS = {
  vuelo:"✈️", hotel:"🏨", restaurante:"🍽️", museo:"🏛️",
  naturaleza:"🌿", transporte:"🚗", compras:"🛍️", playa:"🌊",
  tour:"🗺️", otro:"📍",
};

const DOC_ICONS = { pasaje:"✈️", hotel:"🏨", seguro:"🛡️", entrada:"🎟️", reserva:"📋", otro:"📄" };
const DOC_COLORS = { pasaje:"#E3F2FD", hotel:"#E8F5E9", seguro:"#FFF3E0", entrada:"#F3E5F5", reserva:"#E0F2F1", otro:"#F5F5F5" };
const CAT_ICONS = { restaurante:"🍽️", hotel:"🏨", museo:"🏛️", naturaleza:"🌿", playa:"🏖️", bar:"🍻", compras:"🛍️", otro:"📍" };
const COVER_COLORS = ["#0a7c6e","#1A73E8","#7c5c0a","#5c0a2e","#2e5c8a","#6a4c93","#cc3f0c"];

const STATUS_STYLES = {
  proximo: { bg:"#E3F2FD", color:"#1565C0", label:"Proximo" },
  actual:  { bg:"#FFD600", color:"#333",    label:"En curso" },
  pasado:  { bg:"#F0F0F0", color:"#888",    label:"Pasado" },
};

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#FFD600"/>
      <ellipse cx="20" cy="23" rx="5" ry="13" fill="white" opacity="0.95"/>
      <ellipse cx="20" cy="23" rx="3" ry="11" fill="#FFD600"/>
      <path d="M6 19 Q10 14 14 19 Q17 23 20 19 Q24 14 28 19 Q31 23 34 19"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M20 32 L23 28 L20 29 Z" fill="white" opacity="0.8"/>
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --yellow: #FFD600;
    --yellow-dark: #E6BE00;
    --yellow-pale: #FFFDE7;
    --blue: #1A73E8;
    --green: #00A36C;
    --red: #E53935;
    --dark: #111;
    --mid: #444;
    --muted: #999;
    --border: #EBEBEB;
    --bg: #F7F7F7;
    --shadow: 0 2px 12px rgba(0,0,0,0.07);
    --shadow-lg: 0 8px 32px rgba(0,0,0,0.13);
    --nav-h: 64px;
    --sat: env(safe-area-inset-top, 0px);
    --sab: env(safe-area-inset-bottom, 0px);
  }
  html, body { height: 100%; background: var(--bg); font-family: 'Space Grotesk', sans-serif; -webkit-font-smoothing: antialiased; overscroll-behavior: none; }
  #root { height: 100%; }
  input, textarea, select, button { font-family: 'Space Grotesk', sans-serif; outline: none; }
  button { cursor: pointer; }
  ::-webkit-scrollbar { width: 0; height: 0; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform:rotate(360deg); } }
  .fade-up  { animation: fadeUp 0.28s ease both; }
  .fade-up2 { animation: fadeUp 0.28s 0.06s ease both; }
`;

// ─── Primitives ───────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:56 }}>
      <div style={{ width:26, height:26, border:"3px solid #eee", borderTop:"3px solid #E6BE00", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
    </div>
  );
}

function Toast({ msg, type = "ok", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position:"fixed", bottom:"calc(var(--nav-h) + var(--sab) + 12px)", left:"50%",
      transform:"translateX(-50%)", background:"#111", color:"white",
      padding:"11px 18px", borderRadius:14, fontSize:14, fontWeight:600,
      zIndex:9999, display:"flex", alignItems:"center", gap:8,
      boxShadow:"0 4px 20px rgba(0,0,0,0.28)", maxWidth:"88vw", animation:"fadeUp 0.2s ease",
    }}>
      {type === "err" ? "⚠️" : "✓"} {msg}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.48)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"white", borderRadius:"22px 22px 0 0", width:"100%", maxWidth:500, maxHeight:"92vh", display:"flex", flexDirection:"column", paddingBottom:"var(--sab)", animation:"fadeUp 0.22s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 20px 14px", flexShrink:0 }}>
          <div style={{ fontSize:17, fontWeight:800 }}>{title}</div>
          <button onClick={onClose} style={{ background:"var(--border)", border:"none", borderRadius:10, width:32, height:32, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center" }}>x</button>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:"0 20px 28px" }}>{children}</div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>}
      <input style={{ width:"100%", padding:"12px 14px", border:"1.5px solid var(--border)", borderRadius:12, fontSize:15, color:"var(--dark)", background:"white" }}
        {...props}
        onFocus={e => e.target.style.borderColor = "var(--yellow-dark)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>}
      <textarea style={{ width:"100%", padding:"12px 14px", border:"1.5px solid var(--border)", borderRadius:12, fontSize:15, color:"var(--dark)", background:"white", resize:"vertical", minHeight:72 }}
        {...props}
        onFocus={e => e.target.style.borderColor = "var(--yellow-dark)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

function Sel({ label, children, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>}
      <select style={{ width:"100%", padding:"12px 14px", border:"1.5px solid var(--border)", borderRadius:12, fontSize:15, color:"var(--dark)", background:"white", appearance:"none" }} {...props}>{children}</select>
    </div>
  );
}

function Btn({ children, loading, disabled, ...props }) {
  return (
    <button style={{
      width:"100%", background: disabled ? "#eee" : "var(--yellow)", color: disabled ? "#aaa" : "var(--dark)",
      border:"none", borderRadius:14, padding:"14px 20px", fontSize:15, fontWeight:800,
      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
    }} disabled={disabled} {...props}>
      {loading
        ? <div style={{ width:18, height:18, border:"2.5px solid rgba(0,0,0,0.15)", borderTop:"2.5px solid var(--dark)", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
        : children}
    </button>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function handle() {
    setLoading(true); setErr(""); setMsg("");
    try {
      if (mode === "login") {
        const r = await sbAuth("token?grant_type=password", { email, password: pass });
        if (r.error) throw new Error(r.error_description || r.error);
        onAuth(r);
      } else {
        const r = await sbAuth("signup", { email, password: pass, data: { full_name: name } });
        if (r.error) throw new Error(r.error_description || r.error);
        setMsg("Revisa tu email para confirmar la cuenta");
      }
    } catch(e) { setErr(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#fff 0%,#FFFDE7 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="fade-up" style={{ textAlign:"center", marginBottom:36 }}>
        <Logo size={56}/>
        <div style={{ fontFamily:"Nunito", fontWeight:900, fontSize:36, letterSpacing:"-1.5px", color:"#111", marginTop:10 }}>
          JD<span style={{ color:"#E6BE00" }}>_</span>viajes
        </div>
        <div style={{ color:"#999", fontSize:14, marginTop:4 }}>Tu companero de aventuras</div>
      </div>
      <div className="fade-up2" style={{ background:"white", borderRadius:22, padding:"24px 20px", width:"100%", maxWidth:360, boxShadow:"0 8px 32px rgba(0,0,0,0.13)" }}>
        <div style={{ display:"flex", background:"#F7F7F7", borderRadius:12, padding:3, marginBottom:20 }}>
          {[["login","Ingresar"],["register","Registrarse"]].map(([m,l]) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:"9px 0", borderRadius:10, border:"none", fontSize:14, fontWeight:700, background:mode===m?"white":"transparent", color:mode===m?"#111":"#999", boxShadow:mode===m?"0 2px 12px rgba(0,0,0,0.07)":"none", transition:"all 0.18s" }}>{l}</button>
          ))}
        </div>
        {mode === "register" && <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"/>}
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"/>
        <Input label="Contrasena" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"/>
        {err && <div style={{ color:"#E53935", fontSize:13, marginBottom:12, padding:"10px 14px", background:"#FEE2E2", borderRadius:10 }}>{err}</div>}
        {msg && <div style={{ color:"#00A36C", fontSize:13, marginBottom:12, padding:"10px 14px", background:"#D1FAE5", borderRadius:10 }}>{msg}</div>}
        <Btn onClick={handle} loading={loading} disabled={loading}>{mode==="login"?"Entrar":"Crear cuenta"}</Btn>
      </div>
    </div>
  );
}

// ─── TRIPS ────────────────────────────────────────────────────────────────────
function EditCoverModal({ trip, onClose, onSaved }) {
  const [url, setUrl] = useState(trip.cover_url || "");
  const [loading, setLoading] = useState(false);
  async function save() {
    setLoading(true);
    try {
      await sb(`trips?id=eq.${trip.id}`, { method:"PATCH", body:JSON.stringify({ cover_url: url||null }), prefer:"return=minimal" });
      onSaved(url||null);
    } catch(e) { alert(e.message); }
    setLoading(false);
  }
  return (
    <Modal title="Foto del viaje" onClose={onClose}>
      <Input label="URL de imagen" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://images.unsplash.com/..."/>
      {url && <div style={{ borderRadius:12, overflow:"hidden", marginBottom:14, height:120, background:`url(${url}) center/cover` }}/>}
      <div style={{ fontSize:12, color:"var(--muted)", marginBottom:16 }}>Tip: usa <a href="https://unsplash.com" target="_blank" style={{ color:"var(--blue)" }}>unsplash.com</a> — abre la foto y copia la URL.</div>
      <Btn onClick={save} loading={loading}>Guardar</Btn>
    </Modal>
  );
}

function AddTripModal({ userId, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [cover, setCover] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!title || !start || !end) return;
    setLoading(true);
    try {
      const [trip] = await sb("trips", { method:"POST", body:JSON.stringify({ title, start_date:start, end_date:end, owner_id:userId, status:"active", cover_url:cover||null }) });
      const days = [];
      for (let d = new Date(start+"T12:00:00"); d <= new Date(end+"T12:00:00"); d.setDate(d.getDate()+1)) {
        days.push({ trip_id:trip.id, date:d.toISOString().slice(0,10), title:"" });
      }
      if (days.length) await sb("days", { method:"POST", body:JSON.stringify(days) });
      onCreated(trip);
    } catch(e) { alert(e.message); }
    setLoading(false);
  }

  return (
    <Modal title="Nuevo viaje" onClose={onClose}>
      <Input label="Destino" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Panama City"/>
      <Input label="Desde" type="date" value={start} onChange={e => setStart(e.target.value)}/>
      <Input label="Hasta" type="date" value={end} onChange={e => setEnd(e.target.value)}/>
      <Input label="Foto (URL, opcional)" value={cover} onChange={e => setCover(e.target.value)} placeholder="https://..."/>
      {cover && <div style={{ borderRadius:12, overflow:"hidden", marginBottom:14, height:100, background:`url(${cover}) center/cover` }}/>}
      <Btn onClick={create} loading={loading} disabled={loading||!title||!start||!end}>Crear viaje</Btn>
    </Modal>
  );
}

function TripCard({ trip, onClick, onEditCover }) {
  const status = tripStatus(trip.start_date, trip.end_date);
  const ss = STATUS_STYLES[status];
  const ci = trip.title.length % COVER_COLORS.length;
  const bg = trip.cover_url ? `url(${trip.cover_url}) center/cover` : `linear-gradient(135deg,${COVER_COLORS[ci]},${COVER_COLORS[(ci+3)%COVER_COLORS.length]})`;
  return (
    <div className="fade-up" style={{ borderRadius:20, overflow:"hidden", boxShadow:"var(--shadow)", marginBottom:14, background:"white" }}>
      <div onClick={onClick} style={{ height:150, background:bg, position:"relative", cursor:"pointer" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 55%)" }}/>
        <button onClick={e => { e.stopPropagation(); onEditCover(trip); }} style={{ position:"absolute", top:12, right:12, background:"rgba(0,0,0,0.35)", border:"none", borderRadius:8, padding:"5px 10px", color:"white", fontSize:12, fontWeight:600, backdropFilter:"blur(6px)" }}>Foto</button>
        <div style={{ position:"absolute", bottom:14, left:16, right:16 }}>
          <div style={{ fontFamily:"Nunito", fontWeight:900, fontSize:22, color:"white", textShadow:"0 2px 8px rgba(0,0,0,0.4)", lineHeight:1.1 }}>{trip.title}</div>
        </div>
      </div>
      <div onClick={onClick} style={{ padding:"11px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
        <div style={{ fontSize:13, color:"var(--muted)", fontWeight:500 }}>{fmtDate(trip.start_date)} -> {fmtDate(trip.end_date)}</div>
        <div style={{ fontSize:11, fontWeight:700, padding:"4px 11px", borderRadius:20, background:ss.bg, color:ss.color }}>{ss.label}</div>
      </div>
    </div>
  );
}

function TripsScreen({ session, onSelectTrip }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editCoverTrip, setEditCoverTrip] = useState(null);
  const [toast, setToast] = useState(null);
  const autoOpened = useRef(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const own = await sb(`trips?owner_id=eq.${session.user.id}&order=start_date.asc`);
      const mem = await sb(`trip_members?user_id=eq.${session.user.id}&select=trip_id`);
      const ids = mem.map(m => m.trip_id);
      const memberTrips = ids.length ? await sb(`trips?id=in.(${ids.join(",")})&order=start_date.asc`) : [];
      const seen = new Set();
      const all = [...own, ...memberTrips].filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
      all.sort((a,b) => {
        const order = { actual:0, proximo:1, pasado:2 };
        const sa = tripStatus(a.start_date, a.end_date);
        const sb2 = tripStatus(b.start_date, b.end_date);
        if (order[sa] !== order[sb2]) return order[sa]-order[sb2];
        return a.start_date.localeCompare(b.start_date);
      });
      setTrips(all);
      // Auto-open active trip once
      if (!autoOpened.current) {
        autoOpened.current = true;
        const active = all.find(t => tripStatus(t.start_date, t.end_date) === "actual");
        if (active) { onSelectTrip(active); return; }
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  const upcoming = trips.filter(t => tripStatus(t.start_date, t.end_date) !== "pasado");
  const past = trips.filter(t => tripStatus(t.start_date, t.end_date) === "pasado");

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", paddingBottom:24 }}>
      <div style={{ background:"white", padding:"calc(var(--sat) + 14px) 20px 14px", borderBottom:"1px solid var(--border)", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Logo size={30}/>
            <span style={{ fontFamily:"Nunito", fontWeight:900, fontSize:22, letterSpacing:"-0.5px" }}>JD<span style={{ color:"#E6BE00" }}>_</span>viajes</span>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ background:"var(--yellow)", border:"none", borderRadius:12, width:38, height:38, fontSize:24, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 10px rgba(255,214,0,0.45)" }}>+</button>
        </div>
      </div>

      <div style={{ padding:"18px 16px 0" }}>
        {loading ? <Spinner/> : trips.length === 0 ? (
          <div style={{ textAlign:"center", padding:"72px 0" }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🌊</div>
            <div style={{ fontWeight:800, fontSize:17 }}>Todavia no hay viajes</div>
            <div style={{ fontSize:14, color:"var(--muted)", marginTop:6 }}>Toca + para crear tu primera aventura</div>
          </div>
        ) : (
          <>
            {upcoming.map(t => <TripCard key={t.id} trip={t} onClick={() => onSelectTrip(t)} onEditCover={setEditCoverTrip}/>)}
            {past.length > 0 && (
              <>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"20px 0 12px" }}>Viajes pasados</div>
                {past.map(t => <TripCard key={t.id} trip={t} onClick={() => onSelectTrip(t)} onEditCover={setEditCoverTrip}/>)}
              </>
            )}
          </>
        )}
      </div>

      {showAdd && <AddTripModal userId={session.user.id} onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }}/>}
      {editCoverTrip && <EditCoverModal trip={editCoverTrip} onClose={() => setEditCoverTrip(null)} onSaved={url => {
        setTrips(prev => prev.map(t => t.id === editCoverTrip.id ? { ...t, cover_url: url } : t));
        setEditCoverTrip(null);
        setToast({ msg:"Foto actualizada" });
      }}/>}
      {toast && <Toast msg={toast.msg} onClose={() => setToast(null)}/>}
    </div>
  );
}

// ─── ADD ACTIVITY MODAL ───────────────────────────────────────────────────────
function AddActModal({ dayId, onClose, onAdded }) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("otro");
  const [desc, setDesc] = useState("");
  const [maps, setMaps] = useState("");
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!title) return;
    setLoading(true);
    try {
      const [a] = await sb("activities", { method:"POST", body:JSON.stringify({ day_id:dayId, title, time, type, description:desc, maps_url:maps }) });
      onAdded(a);
    } catch(e) { alert(e.message); }
    setLoading(false);
  }

  return (
    <Modal title="Nueva actividad" onClose={onClose}>
      <Input label="Titulo" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Visita al museo"/>
      <Input label="Horario" value={time} onChange={e => setTime(e.target.value)} placeholder="Ej: 10:00 AM"/>
      <Sel label="Tipo" value={type} onChange={e => setType(e.target.value)}>
        {Object.entries(ACT_ICONS).map(([k,v]) => <option key={k} value={k}>{v} {k[0].toUpperCase()+k.slice(1)}</option>)}
      </Sel>
      <Textarea label="Descripcion" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Tips, notas..."/>
      <Input label="Google Maps" value={maps} onChange={e => setMaps(e.target.value)} placeholder="https://maps.google.com/..."/>
      <Btn onClick={add} loading={loading} disabled={loading||!title}>Agregar</Btn>
    </Modal>
  );
}

// ─── TODAY TAB ────────────────────────────────────────────────────────────────
function TodayTab({ trip }) {
  const [todayDay, setTodayDay] = useState(null);
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, [trip.id]);

  async function load() {
    setLoading(true);
    try {
      const ds = await sb(`days?trip_id=eq.${trip.id}&order=date.asc`);
      const t = todayStr();
      let target = ds.find(d => d.date === t) || ds.find(d => d.date > t) || ds[ds.length-1];
      if (target) {
        setTodayDay(target);
        const a = await sb(`activities?day_id=eq.${target.id}&order=time.asc`);
        setActs(a);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function delAct(id) {
    await sb(`activities?id=eq.${id}`, { method:"DELETE", prefer:"" });
    setActs(prev => prev.filter(a => a.id !== id));
  }

  const isToday = todayDay?.date === todayStr();
  const now = nowHour();
  const nextIdx = isToday ? acts.findIndex(a => timeToHour(a.time) > now) : -1;

  if (loading) return <Spinner/>;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>
      <div style={{ padding:"14px 16px 12px", background:"white", borderBottom:"1px solid var(--border)" }}>
        <div style={{ fontSize:12, color:"var(--muted)", fontWeight:600 }}>{isToday ? "Hoy" : "Proximo dia del viaje"}</div>
        <div style={{ fontFamily:"Nunito", fontWeight:900, fontSize:24, letterSpacing:"-0.5px", marginTop:2 }}>{fmtDayFull(todayDay?.date)}</div>
      </div>

      <div style={{ padding:"12px 16px", flex:1 }}>
        {acts.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 0", color:"var(--muted)" }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
            <div style={{ fontWeight:700 }}>Sin actividades para hoy</div>
          </div>
        ) : acts.map((a, i) => {
          const isPast = isToday && timeToHour(a.time) > 0 && timeToHour(a.time) < now;
          const isNext = i === nextIdx;
          return (
            <div key={a.id} className="fade-up" style={{
              background:"white", borderRadius:16, marginBottom:10, overflow:"hidden",
              boxShadow: isNext ? "0 4px 20px rgba(255,214,0,0.35)" : "var(--shadow)",
              border: isNext ? "2px solid var(--yellow)" : "2px solid transparent",
              opacity: isPast ? 0.5 : 1,
              display:"flex",
            }}>
              <div style={{ width:66, background:isNext?"var(--yellow)":"#FAFAFA", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"12px 4px", flexShrink:0 }}>
                <div style={{ fontSize:18 }}>{ACT_ICONS[a.type]||"📍"}</div>
                <div style={{ fontSize:10, fontWeight:700, color:isNext?"var(--dark)":"var(--muted)", textAlign:"center", marginTop:4, lineHeight:1.2 }}>{a.time||"—"}</div>
                {isNext && <div style={{ fontSize:9, fontWeight:800, color:"var(--dark)", marginTop:3, textTransform:"uppercase" }}>Ahora</div>}
              </div>
              <div style={{ padding:"12px", flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{a.title}</div>
                {a.description && <div style={{ fontSize:12, color:"var(--muted)", marginTop:3, lineHeight:1.45 }}>{a.description}</div>}
                {a.maps_url && (
                  <a href={a.maps_url} target="_blank" rel="noopener" style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:6, fontSize:12, fontWeight:700, color:"var(--blue)", textDecoration:"none", background:"#EBF5FF", padding:"4px 10px", borderRadius:8 }}>
                    Abrir Maps
                  </a>
                )}
              </div>
              <button onClick={() => delAct(a.id)} style={{ background:"none", border:"none", padding:"0 12px", color:"#ccc", fontSize:18 }}>x</button>
            </div>
          );
        })}
      </div>

      <div style={{ padding:"0 16px 16px" }}>
        <Btn onClick={() => setShowAdd(true)}>+ Agregar actividad</Btn>
      </div>

      {showAdd && todayDay && <AddActModal dayId={todayDay.id} onClose={() => setShowAdd(false)} onAdded={a => {
        setActs(prev => [...prev, a].sort((x,y) => (x.time||"").localeCompare(y.time||"")));
        setShowAdd(false);
        setToast({ msg:"Actividad agregada" });
      }}/>}
      {toast && <Toast msg={toast.msg} onClose={() => setToast(null)}/>}
    </div>
  );
}

// ─── ITINERARY TAB ────────────────────────────────────────────────────────────
function ItineraryTab({ trip }) {
  const [days, setDays] = useState([]);
  const [acts, setActs] = useState({});
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const barRef = useRef(null);

  useEffect(() => { load(); }, [trip.id]);

  async function load() {
    setLoading(true);
    const ds = await sb(`days?trip_id=eq.${trip.id}&order=date.asc`);
    setDays(ds);
    const t = todayStr();
    const init = ds.find(d => d.date===t) || ds[0];
    if (init) { setSel(init); const a = await sb(`activities?day_id=eq.${init.id}&order=time.asc`); setActs({ [init.id]: a }); }
    setLoading(false);
  }

  async function pickDay(d) {
    setSel(d);
    if (!acts[d.id]) { const a = await sb(`activities?day_id=eq.${d.id}&order=time.asc`); setActs(prev => ({ ...prev, [d.id]: a })); }
  }

  async function delAct(id) {
    await sb(`activities?id=eq.${id}`, { method:"DELETE", prefer:"" });
    if (sel) setActs(prev => ({ ...prev, [sel.id]: (prev[sel.id]||[]).filter(a => a.id!==id) }));
  }

  useEffect(() => {
    if (!sel||!barRef.current) return;
    barRef.current.querySelector(`[data-id="${sel.id}"]`)?.scrollIntoView({ behavior:"smooth", block:"nearest", inline:"center" });
  }, [sel]);

  const dayActs = sel ? (acts[sel.id]||[]) : [];
  if (loading) return <Spinner/>;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div ref={barRef} style={{ display:"flex", gap:6, overflowX:"auto", padding:"10px 12px", background:"white", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
        {days.map(d => {
          const s = sel?.id===d.id;
          const isT = d.date===todayStr();
          return (
            <button key={d.id} data-id={d.id} onClick={() => pickDay(d)} style={{ flexShrink:0, border: isT&&!s?"2px solid var(--yellow-dark)":"2px solid transparent", borderRadius:12, padding:"7px 13px", background:s?"var(--yellow)":"var(--bg)", color:s?"var(--dark)":"var(--muted)", fontWeight:s?800:600, fontSize:13, transition:"all 0.15s" }}>
              {fmtDayShort(d.date)}
            </button>
          );
        })}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px 16px" }}>
        {sel && <div style={{ fontSize:13, color:"var(--muted)", fontWeight:600, marginBottom:10 }}>{fmtDayFull(sel.date)}{sel.date===todayStr()?" · Hoy":""}</div>}
        {dayActs.length===0 ? (
          <div style={{ textAlign:"center", padding:"48px 0", color:"var(--muted)" }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
            <div style={{ fontWeight:700, fontSize:14 }}>Sin actividades</div>
          </div>
        ) : dayActs.map(a => (
          <div key={a.id} style={{ background:"white", borderRadius:14, marginBottom:10, display:"flex", boxShadow:"var(--shadow)" }}>
            <div style={{ width:64, background:"#FAFAFA", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"12px 4px", flexShrink:0 }}>
              <div style={{ fontSize:18 }}>{ACT_ICONS[a.type]||"📍"}</div>
              <div style={{ fontSize:10, fontWeight:600, color:"var(--muted)", textAlign:"center", marginTop:4, lineHeight:1.2 }}>{a.time||"—"}</div>
            </div>
            <div style={{ padding:"12px", flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{a.title}</div>
              {a.description && <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>{a.description}</div>}
              {a.maps_url && <a href={a.maps_url} target="_blank" rel="noopener" style={{ display:"inline-flex", alignItems:"center", gap:3, marginTop:5, fontSize:11, fontWeight:700, color:"var(--blue)", textDecoration:"none" }}>Maps</a>}
            </div>
            <button onClick={() => delAct(a.id)} style={{ background:"none", border:"none", padding:"0 12px", color:"#ccc", fontSize:18 }}>x</button>
          </div>
        ))}
      </div>

      {sel && <div style={{ padding:"0 16px 16px", flexShrink:0 }}><Btn onClick={() => setShowAdd(true)}>+ Agregar actividad</Btn></div>}
      {showAdd && sel && <AddActModal dayId={sel.id} onClose={() => setShowAdd(false)} onAdded={a => {
        setActs(prev => ({ ...prev, [sel.id]: [...(prev[sel.id]||[]), a].sort((x,y) => (x.time||"").localeCompare(y.time||"")) }));
        setShowAdd(false);
      }}/>}
    </div>
  );
}

// ─── PLACES TAB ───────────────────────────────────────────────────────────────
function AddPlaceModal({ tripId, onClose, onAdded }) {
  const [name, setName] = useState("");
  const [cat, setCat] = useState("otro");
  const [desc, setDesc] = useState("");
  const [maps, setMaps] = useState("");
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!name) return;
    setLoading(true);
    try {
      const [p] = await sb("places", { method:"POST", body:JSON.stringify({ trip_id:tripId, name, category:cat, description:desc, maps_url:maps }) });
      onAdded(p);
    } catch(e) { alert(e.message); }
    setLoading(false);
  }

  return (
    <Modal title="Nuevo lugar" onClose={onClose}>
      <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Mercado Central"/>
      <Sel label="Categoria" value={cat} onChange={e => setCat(e.target.value)}>
        {Object.entries(CAT_ICONS).map(([k,v]) => <option key={k} value={k}>{v} {k[0].toUpperCase()+k.slice(1)}</option>)}
      </Sel>
      <Textarea label="Notas" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Tips, horarios..."/>
      <Input label="Google Maps" value={maps} onChange={e => setMaps(e.target.value)} placeholder="https://maps.google.com/..."/>
      <Btn onClick={add} loading={loading} disabled={loading||!name}>Agregar lugar</Btn>
    </Modal>
  );
}

function PlacesTab({ trip }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("todos");

  useEffect(() => { load(); }, [trip.id]);
  async function load() { setLoading(true); const ps = await sb(`places?trip_id=eq.${trip.id}&order=category.asc`); setPlaces(ps); setLoading(false); }
  async function del(id) { await sb(`places?id=eq.${id}`, { method:"DELETE", prefer:"" }); setPlaces(prev => prev.filter(p => p.id!==id)); }

  const cats = ["todos", ...new Set(places.map(p => p.category))];
  const filtered = filter==="todos" ? places : places.filter(p => p.category===filter);

  if (loading) return <Spinner/>;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {places.length>0 && (
        <div style={{ display:"flex", gap:6, overflowX:"auto", padding:"10px 12px", background:"white", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={{ flexShrink:0, border:"none", borderRadius:20, padding:"6px 14px", background:filter===c?"var(--dark)":"var(--bg)", color:filter===c?"white":"var(--muted)", fontSize:12, fontWeight:700, transition:"all 0.15s" }}>
              {c==="todos"?"Todos":`${CAT_ICONS[c]||"📍"} ${c[0].toUpperCase()+c.slice(1)}`}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px 16px" }}>
        {filtered.length===0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"var(--muted)" }}>
            <div style={{ fontSize:42, marginBottom:10 }}>🗺️</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Sin lugares todavia</div>
            <div style={{ fontSize:13, marginTop:4 }}>Guarda los spots que no queres perderte</div>
          </div>
        ) : filtered.map(p => (
          <div key={p.id} className="fade-up" style={{ background:"white", borderRadius:16, padding:"14px", boxShadow:"var(--shadow)", marginBottom:10, display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"var(--yellow-pale)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{CAT_ICONS[p.category]||"📍"}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{p.name}</div>
              {p.description && <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>{p.description}</div>}
              {p.maps_url && <a href={p.maps_url} target="_blank" rel="noopener" style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:6, fontSize:12, fontWeight:700, color:"var(--blue)", textDecoration:"none", background:"#EBF5FF", padding:"5px 12px", borderRadius:8 }}>Abrir en Maps</a>}
            </div>
            <button onClick={() => del(p.id)} style={{ background:"none", border:"none", color:"#ccc", fontSize:18, flexShrink:0, padding:0 }}>x</button>
          </div>
        ))}
      </div>

      <div style={{ padding:"0 16px 16px", flexShrink:0 }}><Btn onClick={() => setShowAdd(true)}>+ Agregar lugar</Btn></div>
      {showAdd && <AddPlaceModal tripId={trip.id} onClose={() => setShowAdd(false)} onAdded={p => { setPlaces(prev=>[...prev,p]); setShowAdd(false); }}/>}
    </div>
  );
}

// ─── DOCS TAB ─────────────────────────────────────────────────────────────────
function AddDocModal({ tripId, onClose, onAdded }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("otro");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!name) return;
    setLoading(true);
    try {
      const [d] = await sb("documents", { method:"POST", body:JSON.stringify({ trip_id:tripId, name, type, file_url:url }) });
      onAdded(d);
    } catch(e) { alert(e.message); }
    setLoading(false);
  }

  return (
    <Modal title="Nuevo documento" onClose={onClose}>
      <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Pasaje BUE - PTY"/>
      <Sel label="Tipo" value={type} onChange={e => setType(e.target.value)}>
        {Object.entries(DOC_ICONS).map(([k,v]) => <option key={k} value={k}>{v} {k[0].toUpperCase()+k.slice(1)}</option>)}
      </Sel>
      <Input label="URL (Drive, Dropbox, PDF...)" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."/>
      <Btn onClick={add} loading={loading} disabled={loading||!name}>Agregar</Btn>
    </Modal>
  );
}

function DocsTab({ trip }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { load(); }, [trip.id]);
  async function load() { setLoading(true); const ds = await sb(`documents?trip_id=eq.${trip.id}&order=type.asc`); setDocs(ds); setLoading(false); }
  async function del(id) { await sb(`documents?id=eq.${id}`, { method:"DELETE", prefer:"" }); setDocs(prev=>prev.filter(d=>d.id!==id)); }

  if (loading) return <Spinner/>;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px 16px" }}>
        {docs.length===0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"var(--muted)" }}>
            <div style={{ fontSize:42, marginBottom:10 }}>📁</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Sin documentos</div>
            <div style={{ fontSize:13, marginTop:4 }}>Pasajes, seguros, entradas — todo aca</div>
          </div>
        ) : docs.map(d => (
          <div key={d.id} className="fade-up" style={{ background:"white", borderRadius:16, padding:"16px", boxShadow:"var(--shadow)", marginBottom:10, display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:14, flexShrink:0, background:DOC_COLORS[d.type]||"#F5F5F5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>
              {DOC_ICONS[d.type]||"📄"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>{d.name}</div>
              <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em", marginTop:2 }}>{d.type}</div>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0, alignItems:"center" }}>
              {d.file_url && <a href={d.file_url} target="_blank" rel="noopener" style={{ fontSize:13, fontWeight:800, color:"var(--blue)", textDecoration:"none", padding:"8px 14px", background:"#EBF5FF", borderRadius:10 }}>Ver</a>}
              <button onClick={() => del(d.id)} style={{ background:"none", border:"none", color:"#ccc", fontSize:20, padding:0 }}>x</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:"0 16px 16px", flexShrink:0 }}><Btn onClick={() => setShowAdd(true)}>+ Agregar documento</Btn></div>
      {showAdd && <AddDocModal tripId={trip.id} onClose={() => setShowAdd(false)} onAdded={d => { setDocs(prev=>[...prev,d]); setShowAdd(false); }}/>}
    </div>
  );
}

// ─── MEMBERS TAB ──────────────────────────────────────────────────────────────
function MembersTab({ trip, session, onLogout }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, [trip.id]);
  async function load() { setLoading(true); try { const ms = await sb(`trip_members?trip_id=eq.${trip.id}&select=*,profiles(full_name)`); setMembers(ms); } catch(e) {} setLoading(false); }

  async function invite() {
    if (!email) return;
    setInviting(true);
    try {
      const ps = await sb(`profiles?email=eq.${encodeURIComponent(email)}`);
      if (!ps?.length) { setToast({ msg:"No se encontro ese usuario", type:"err" }); setInviting(false); return; }
      await sb("trip_members", { method:"POST", body:JSON.stringify({ trip_id:trip.id, user_id:ps[0].id, role:"viewer" }) });
      setToast({ msg:"Invitacion enviada!" });
      setEmail("");
      load();
    } catch(e) { setToast({ msg:e.message, type:"err" }); }
    setInviting(false);
  }

  if (loading) return <Spinner/>;

  return (
    <div style={{ padding:"16px", overflowY:"auto", height:"100%" }}>
      <div style={{ background:"white", borderRadius:16, padding:"16px", boxShadow:"var(--shadow)", marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>Invitar viajero</div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" type="email" style={{ flex:1, padding:"11px 13px", border:"1.5px solid var(--border)", borderRadius:10, fontSize:14, background:"white" }}/>
          <button onClick={invite} disabled={inviting||!email} style={{ background:"var(--yellow)", border:"none", borderRadius:10, padding:"11px 16px", fontWeight:800, fontSize:14, flexShrink:0 }}>{inviting?"...":"Invitar"}</button>
        </div>
      </div>

      <div style={{ fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>Viajeros ({members.length})</div>
      {members.map(m => (
        <div key={m.id} style={{ background:"white", borderRadius:14, padding:"12px 16px", boxShadow:"var(--shadow)", marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:"50%", background:"var(--yellow)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, flexShrink:0 }}>
            {(m.profiles?.full_name||"?")[0].toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>{m.profiles?.full_name||"Usuario"}</div>
            <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.04em" }}>{m.role==="owner"?"Organizador":"Viajero"}</div>
          </div>
          {m.user_id===session.user.id && <div style={{ fontSize:11, color:"var(--blue)", fontWeight:700 }}>Tu</div>}
        </div>
      ))}

      <button onClick={onLogout} style={{ width:"100%", marginTop:32, background:"#FEE2E2", border:"none", borderRadius:14, padding:"13px", fontSize:14, fontWeight:700, color:"var(--red)" }}>
        Cerrar sesion
      </button>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
    </div>
  );
}

// ─── TRIP SCREEN ──────────────────────────────────────────────────────────────
const TABS = [
  { id:"today",     icon:"☀️",  label:"Hoy" },
  { id:"itinerary", icon:"🗓️", label:"Plan" },
  { id:"places",    icon:"📍",  label:"Lugares" },
  { id:"docs",      icon:"📁",  label:"Docs" },
  { id:"members",   icon:"👥",  label:"Viajeros" },
];

function NavBtn({ tab, active, onClick }) {
  return (
    <button onClick={onClick} style={{ flex:1, border:"none", background:"transparent", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 2px 6px", position:"relative", WebkitTapHighlightColor:"transparent" }}>
      <div style={{ fontSize:20 }}>{tab.icon}</div>
      <div style={{ fontSize:10, fontWeight:active?800:600, color:active?"var(--dark)":"var(--muted)", marginTop:2 }}>{tab.label}</div>
      {active && <div style={{ position:"absolute", bottom:0, left:"20%", right:"20%", height:2.5, background:"var(--yellow-dark)", borderRadius:2 }}/>}
    </button>
  );
}

function TripScreen({ trip, session, onBack, onLogout }) {
  const [tab, setTab] = useState("today");
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [placesKey, setPlacesKey] = useState(0);
  const status = tripStatus(trip.start_date, trip.end_date);
  const ss = STATUS_STYLES[status];

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"var(--bg)", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ background:"white", borderBottom:"1px solid var(--border)", paddingTop:"calc(var(--sat) + 10px)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 16px 12px" }}>
          <button onClick={onBack} style={{ background:"var(--bg)", border:"none", borderRadius:10, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>←</button>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"Nunito", fontWeight:900, fontSize:19, letterSpacing:"-0.3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{trip.title}</div>
            <div style={{ fontSize:12, color:"var(--muted)" }}>{fmtDate(trip.start_date)} -> {fmtDate(trip.end_date)}</div>
          </div>
          <div style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, background:ss.bg, color:ss.color, flexShrink:0 }}>{ss.label}</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {tab==="today"     && <TodayTab trip={trip}/>}
        {tab==="itinerary" && <ItineraryTab trip={trip}/>}
        {tab==="places"    && <PlacesTab trip={trip} key={placesKey}/>}
        {tab==="docs"      && <DocsTab trip={trip}/>}
        {tab==="members"   && <MembersTab trip={trip} session={session} onLogout={onLogout}/>}
      </div>

      {/* Bottom nav */}
      <div style={{ background:"white", borderTop:"1px solid var(--border)", flexShrink:0, display:"flex", paddingBottom:"var(--sab)" }}>
        {TABS.slice(0,2).map(t => <NavBtn key={t.id} tab={t} active={tab===t.id} onClick={() => setTab(t.id)}/>)}
        {/* FAB */}
        <button onClick={() => setShowAddPlace(true)} style={{ flex:1, border:"none", background:"transparent", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8px 0 6px" }}>
          <div style={{ width:44, height:44, borderRadius:"50%", background:"var(--yellow)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:700, boxShadow:"0 4px 14px rgba(255,214,0,0.5)", marginTop:-16 }}>+</div>
        </button>
        {TABS.slice(2).map(t => <NavBtn key={t.id} tab={t} active={tab===t.id} onClick={() => setTab(t.id)}/>)}
      </div>

      {showAddPlace && (
        <AddPlaceModal tripId={trip.id} onClose={() => setShowAddPlace(false)} onAdded={() => {
          setShowAddPlace(false);
          setPlacesKey(k=>k+1);
          setTab("places");
        }}/>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("jd_session")||"null");
      if (s?.access_token) setSession(s);
    } catch(e) {}
  }, []);

  function logout() { localStorage.removeItem("jd_session"); setSession(null); setTrip(null); }

  if (!session) return <AuthScreen onAuth={s => { localStorage.setItem("jd_session", JSON.stringify(s)); setSession(s); }}/>;
  if (trip) return <TripScreen trip={trip} session={session} onBack={() => setTrip(null)} onLogout={logout}/>;
  return <TripsScreen session={session} onSelectTrip={setTrip}/>;
}
