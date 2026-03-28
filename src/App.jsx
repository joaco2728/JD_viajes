import { useState, useEffect, useRef } from "react";

// ─── Supabase ───────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://kzkiktkcyaazubqagfaw.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6a2lrdGtjeWFhenVicWFnZmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjEyOTgsImV4cCI6MjA5MDI5NzI5OH0.vxn0EbPqtg8-L_xCHDz4Vm4aFBuKdbUkNWnof0gOMoM";

async function sb(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation",
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

async function sbAuth(path, body, method = "POST") {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function tripStatus(start, end) {
  const t = today();
  if (t < start) return "próximo";
  if (t > end) return "pasado";
  return "actual";
}

function fmtDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
}

function fmtDay(d) {
  if (!d) return "";
  const date = new Date(d + "T12:00:00");
  const days = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

const ACTIVITY_ICONS = {
  vuelo: "✈️", hotel: "🏨", restaurante: "🍽️", museo: "🏛️",
  naturaleza: "🌿", transporte: "🚗", compras: "🛍️", playa: "🌊",
  tour: "🗺️", otro: "📍",
};

const DOC_ICONS = {
  pasaje: "✈️", hotel: "🏨", seguro: "🛡️", entrada: "🎟️",
  reserva: "📋", otro: "📄",
};

// ─── LOGO SVG ────────────────────────────────────────────────────────────────
function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Wave base */}
      <circle cx="20" cy="20" r="20" fill="#FFD600"/>
      {/* Surfboard */}
      <ellipse cx="20" cy="22" rx="5" ry="13" fill="white" opacity="0.95"/>
      <ellipse cx="20" cy="22" rx="3" ry="11" fill="#FFD600"/>
      {/* Wave */}
      <path d="M6 20 Q10 15 14 20 Q17 24 20 20 Q24 15 28 20 Q31 24 34 20" 
        stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Fin */}
      <path d="M20 31 L23 27 L20 28 Z" fill="white" opacity="0.8"/>
    </svg>
  );
}

// ─── Global styles ───────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --yellow: #FFD600;
    --yellow-dark: #F0C800;
    --yellow-light: #FFF8CC;
    --yellow-pale: #FFFDE7;
    --blue: #1A73E8;
    --blue-dark: #1557B0;
    --green: #00A36C;
    --red: #E53935;
    --dark: #111;
    --mid: #444;
    --muted: #888;
    --border: #E8E8E8;
    --bg: #FAFAFA;
    --white: #fff;
    --radius: 14px;
    --shadow: 0 2px 12px rgba(0,0,0,0.08);
    --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
  }

  html, body { height: 100%; background: var(--bg); font-family: 'Space Grotesk', sans-serif; -webkit-font-smoothing: antialiased; }
  #root { height: 100%; }

  input, textarea, select {
    font-family: 'Space Grotesk', sans-serif;
    outline: none;
  }
  button { cursor: pointer; font-family: 'Space Grotesk', sans-serif; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .fade-up { animation: fadeUp 0.35s ease both; }
  .fade-up-2 { animation: fadeUp 0.35s 0.07s ease both; }
  .fade-up-3 { animation: fadeUp 0.35s 0.14s ease both; }
`;

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:40 }}>
      <div style={{ width:28, height:28, border:"3px solid var(--border)", borderTop:"3px solid var(--yellow-dark)", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
    </div>
  );
}

function Toast({ msg, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)",
      background: type === "error" ? "#333" : "#111",
      color:"white", padding:"12px 20px", borderRadius:12, fontSize:14,
      fontWeight:600, zIndex:9999, display:"flex", alignItems:"center", gap:8,
      boxShadow:"0 4px 20px rgba(0,0,0,0.25)", maxWidth:"90vw",
      animation:"fadeUp 0.2s ease",
    }}>
      {type === "error" ? "⚠️" : "✓"} {msg}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:"white", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480,
        maxHeight:"90vh", overflow:"auto", padding:"24px 20px 40px",
        animation:"fadeUp 0.25s ease",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:17, fontWeight:700 }}>{title}</div>
          <button onClick={onClose} style={{ background:"var(--border)", border:"none", borderRadius:8, width:32, height:32, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:12, fontWeight:600, color:"var(--muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</div>}
      <input style={{
        width:"100%", padding:"12px 14px", border:"1.5px solid var(--border)",
        borderRadius:10, fontSize:15, color:"var(--dark)", background:"white",
        transition:"border-color 0.2s",
      }} {...props}
        onFocus={e => e.target.style.borderColor = "var(--yellow-dark)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:12, fontWeight:600, color:"var(--muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</div>}
      <textarea style={{
        width:"100%", padding:"12px 14px", border:"1.5px solid var(--border)",
        borderRadius:10, fontSize:15, color:"var(--dark)", background:"white",
        resize:"vertical", minHeight:80,
      }} {...props}
        onFocus={e => e.target.style.borderColor = "var(--yellow-dark)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:12, fontWeight:600, color:"var(--muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</div>}
      <select style={{
        width:"100%", padding:"12px 14px", border:"1.5px solid var(--border)",
        borderRadius:10, fontSize:15, color:"var(--dark)", background:"white",
        appearance:"none",
      }} {...props}>{children}</select>
    </div>
  );
}

function Btn({ children, variant = "primary", style: s = {}, ...props }) {
  const base = {
    border:"none", borderRadius:12, padding:"13px 20px", fontSize:15, fontWeight:700,
    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
    transition:"all 0.15s", width:"100%", ...s,
  };
  const variants = {
    primary: { background:"var(--yellow)", color:"var(--dark)" },
    secondary: { background:"var(--bg)", border:"1.5px solid var(--border)", color:"var(--dark)" },
    danger: { background:"#FEE2E2", color:"var(--red)" },
    ghost: { background:"transparent", color:"var(--blue)", fontWeight:600 },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} {...props}>
      {children}
    </button>
  );
}

// ─── AUTH SCREEN ────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function handle() {
    setLoading(true); setError(""); setMsg("");
    try {
      if (mode === "login") {
        const r = await sbAuth("token?grant_type=password", { email, password });
        if (r.error) throw new Error(r.error_description || r.error);
        onAuth(r);
      } else {
        const r = await sbAuth("signup", { email, password, data: { full_name: name } });
        if (r.error) throw new Error(r.error_description || r.error);
        setMsg("¡Revisá tu email para confirmar la cuenta!");
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight:"100vh", background:"linear-gradient(160deg, #fff 0%, var(--yellow-pale) 100%)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:24,
    }}>
      {/* Header */}
      <div className="fade-up" style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:12 }}>
          <Logo size={52}/>
        </div>
        <div style={{ fontFamily:"Nunito", fontWeight:900, fontSize:34, letterSpacing:"-1px", color:"var(--dark)" }}>
          JD<span style={{ color:"var(--yellow-dark)" }}>_</span>viajes
        </div>
        <div style={{ color:"var(--muted)", fontSize:14, marginTop:4 }}>Tu compañero de viajes 🌊</div>
      </div>

      <div className="fade-up-2" style={{
        background:"white", borderRadius:20, padding:"28px 24px", width:"100%", maxWidth:380,
        boxShadow:"var(--shadow-lg)",
      }}>
        <div style={{ display:"flex", background:"var(--bg)", borderRadius:10, padding:3, marginBottom:22 }}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex:1, padding:"9px 0", borderRadius:8, border:"none", fontSize:14, fontWeight:700,
              background: mode === m ? "white" : "transparent",
              color: mode === m ? "var(--dark)" : "var(--muted)",
              boxShadow: mode === m ? "var(--shadow)" : "none",
              transition:"all 0.2s",
            }}>
              {m === "login" ? "Ingresar" : "Registrarse"}
            </button>
          ))}
        </div>

        {mode === "register" && (
          <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"/>
        )}
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"/>
        <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"/>

        {error && <div style={{ color:"var(--red)", fontSize:13, marginBottom:12, padding:"10px 14px", background:"#FEE2E2", borderRadius:8 }}>{error}</div>}
        {msg && <div style={{ color:"var(--green)", fontSize:13, marginBottom:12, padding:"10px 14px", background:"#D1FAE5", borderRadius:8 }}>{msg}</div>}

        <Btn onClick={handle} style={{ marginTop:4 }} disabled={loading}>
          {loading ? "..." : mode === "login" ? "Entrar" : "Crear cuenta"}
        </Btn>
      </div>
    </div>
  );
}

// ─── MY TRIPS SCREEN ─────────────────────────────────────────────────────────
const COVER_COLORS = ["#0a7c6e","#7c5c0a","#1A73E8","#5c0a2e","#2e5c8a","#6a4c93","#cc3f0c"];

const STATUS_STYLES = {
  próximo: { bg:"#E3F2FD", color:"#1565C0", label:"Próximo 🗓️" },
  actual:  { bg:"#FFD600", color:"#333",    label:"En curso 🌟" },
  pasado:  { bg:"#F5F5F5", color:"#757575", label:"Pasado ✓" },
};

function TripCard({ trip, onClick }) {
  const status = tripStatus(trip.start_date, trip.end_date);
  const ss = STATUS_STYLES[status];
  const colorIdx = trip.title.length % COVER_COLORS.length;

  return (
    <div onClick={onClick} className="fade-up" style={{
      background:"white", borderRadius:18, overflow:"hidden",
      boxShadow:"var(--shadow)", cursor:"pointer", marginBottom:16,
      transition:"transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
    >
      {/* Cover */}
      <div style={{
        height:140, background: trip.cover_url
          ? `url(${trip.cover_url}) center/cover`
          : `linear-gradient(135deg, ${COVER_COLORS[colorIdx]} 0%, ${COVER_COLORS[(colorIdx+2)%COVER_COLORS.length]} 100%)`,
        display:"flex", alignItems:"flex-end", padding:14, position:"relative",
      }}>
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)",
        }}/>
        <div style={{
          fontFamily:"Nunito", fontWeight:900, fontSize:22, color:"white",
          textShadow:"0 2px 8px rgba(0,0,0,0.3)", position:"relative", lineHeight:1.1,
        }}>
          {trip.title}
        </div>
      </div>
      {/* Info */}
      <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:13, color:"var(--muted)" }}>
          {fmtDate(trip.start_date)} → {fmtDate(trip.end_date)}
        </div>
        <div style={{
          fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20,
          background:ss.bg, color:ss.color,
        }}>
          {ss.label}
        </div>
      </div>
    </div>
  );
}

function AddTripModal({ onClose, onCreated, userId }) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!title || !startDate || !endDate) return;
    setLoading(true);
    try {
      const [trip] = await sb("trips", {
        method:"POST",
        body: JSON.stringify({ title, start_date: startDate, end_date: endDate, owner_id: userId, status:"active" }),
      });
      // Auto-generate days
      const d1 = new Date(startDate + "T12:00:00");
      const d2 = new Date(endDate + "T12:00:00");
      const days = [];
      for (let d = new Date(d1); d <= d2; d.setDate(d.getDate()+1)) {
        days.push({ trip_id: trip.id, date: d.toISOString().slice(0,10), title: "" });
      }
      if (days.length > 0) {
        await sb("days", { method:"POST", body: JSON.stringify(days) });
      }
      onCreated(trip);
    } catch(e) { alert(e.message); }
    setLoading(false);
  }

  return (
    <Modal title="Nuevo viaje ✈️" onClose={onClose}>
      <Input label="Destino / Título" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Panamá City"/>
      <Input label="Fecha de inicio" type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/>
      <Input label="Fecha de fin" type="date" value={endDate} onChange={e => setEndDate(e.target.value)}/>
      <Btn onClick={create} disabled={loading || !title || !startDate || !endDate}>
        {loading ? "Creando..." : "Crear viaje"}
      </Btn>
    </Modal>
  );
}

function TripsScreen({ session, onSelectTrip }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  async function loadTrips() {
    setLoading(true);
    try {
      // Own trips + member trips
      const own = await sb(`trips?owner_id=eq.${session.user.id}&order=start_date.desc`);
      const memberships = await sb(`trip_members?user_id=eq.${session.user.id}&select=trip_id`);
      const memberTripIds = memberships.map(m => m.trip_id);
      let memberTrips = [];
      if (memberTripIds.length > 0) {
        memberTrips = await sb(`trips?id=in.(${memberTripIds.join(",")})&order=start_date.desc`);
      }
      // Merge + deduplicate
      const seen = new Set();
      const all = [...own, ...memberTrips].filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
      all.sort((a,b) => {
        const order = { actual:0, próximo:1, pasado:2 };
        return (order[tripStatus(a.start_date, a.end_date)] ?? 3) - (order[tripStatus(b.start_date, b.end_date)] ?? 3);
      });
      setTrips(all);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", paddingBottom:24 }}>
      {/* Header */}
      <div style={{
        background:"white", padding:"52px 20px 20px", borderBottom:"1px solid var(--border)",
        position:"sticky", top:0, zIndex:10,
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Logo size={32}/>
            <div style={{ fontFamily:"Nunito", fontWeight:900, fontSize:22, letterSpacing:"-0.5px" }}>
              JD<span style={{ color:"var(--yellow-dark)" }}>_</span>viajes
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} style={{
            background:"var(--yellow)", border:"none", borderRadius:12,
            width:38, height:38, fontSize:22, display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 2px 8px rgba(255,214,0,0.4)",
          }}>+</button>
        </div>
      </div>

      <div style={{ padding:"20px 16px 0" }}>
        <div style={{ fontSize:13, fontWeight:600, color:"var(--muted)", marginBottom:14, textTransform:"uppercase", letterSpacing:"0.06em" }}>
          Mis viajes
        </div>
        {loading ? <Spinner/> : trips.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"var(--muted)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🌊</div>
            <div style={{ fontWeight:700, fontSize:16 }}>Todavía no hay viajes</div>
            <div style={{ fontSize:14, marginTop:4 }}>¡Creá tu primer aventura!</div>
          </div>
        ) : trips.map(t => (
          <TripCard key={t.id} trip={t} onClick={() => onSelectTrip(t)}/>
        ))}
      </div>

      {showAdd && (
        <AddTripModal
          userId={session.user.id}
          onClose={() => setShowAdd(false)}
          onCreated={trip => { setShowAdd(false); loadTrips(); }}
        />
      )}
    </div>
  );
}

// ─── ITINERARY TAB ───────────────────────────────────────────────────────────
function ActivityCard({ act, onDelete }) {
  const icon = ACTIVITY_ICONS[act.type] || "📍";
  return (
    <div style={{
      background:"white", borderRadius:14, overflow:"hidden",
      boxShadow:"var(--shadow)", marginBottom:10, display:"flex",
    }}>
      {/* Time column */}
      <div style={{
        width:68, background:"var(--yellow-pale)", borderRight:"1px solid var(--border)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"14px 6px", flexShrink:0,
      }}>
        <div style={{ fontSize:20 }}>{icon}</div>
        <div style={{ fontSize:11, fontWeight:600, color:"var(--muted)", textAlign:"center", marginTop:4, lineHeight:1.2 }}>
          {act.time || "—"}
        </div>
      </div>
      {/* Body */}
      <div style={{ padding:"12px 14px", flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:14, color:"var(--dark)", marginBottom:3 }}>{act.title}</div>
        {act.description && <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5, marginBottom:4 }}>{act.description}</div>}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {act.maps_url && (
            <a href={act.maps_url} target="_blank" rel="noopener" style={{
              fontSize:11, color:"var(--blue)", fontWeight:600, textDecoration:"none",
              display:"flex", alignItems:"center", gap:3,
            }}>📍 Maps</a>
          )}
        </div>
      </div>
      {/* Delete */}
      <button onClick={() => onDelete(act.id)} style={{
        background:"none", border:"none", padding:"0 14px", color:"#ccc", fontSize:18,
        flexShrink:0, display:"flex", alignItems:"center",
      }}>×</button>
    </div>
  );
}

function AddActivityModal({ dayId, onClose, onAdded }) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [type, setType] = useState("otro");
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!title) return;
    setLoading(true);
    try {
      const [act] = await sb("activities", {
        method:"POST",
        body: JSON.stringify({ day_id: dayId, title, time, description, maps_url: mapsUrl, type }),
      });
      onAdded(act);
    } catch(e) { alert(e.message); }
    setLoading(false);
  }

  return (
    <Modal title="Nueva actividad" onClose={onClose}>
      <Input label="Título" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Visita al museo"/>
      <Input label="Horario" value={time} onChange={e => setTime(e.target.value)} placeholder="Ej: 10:00 AM"/>
      <Select label="Tipo" value={type} onChange={e => setType(e.target.value)}>
        {Object.entries(ACTIVITY_ICONS).map(([k,v]) => <option key={k} value={k}>{v} {k.charAt(0).toUpperCase()+k.slice(1)}</option>)}
      </Select>
      <Textarea label="Descripción" value={description} onChange={e => setDescription(e.target.value)} placeholder="Notas, tips..."/>
      <Input label="Link Google Maps" value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/..."/>
      <Btn onClick={add} disabled={loading || !title}>{loading ? "Guardando..." : "Agregar"}</Btn>
    </Modal>
  );
}

function ItineraryTab({ trip }) {
  const [days, setDays] = useState([]);
  const [activities, setActivities] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAddAct, setShowAddAct] = useState(false);
  const [loading, setLoading] = useState(true);
  const dayBarRef = useRef(null);

  useEffect(() => { loadDays(); }, [trip.id]);

  async function loadDays() {
    setLoading(true);
    try {
      const ds = await sb(`days?trip_id=eq.${trip.id}&order=date.asc`);
      setDays(ds);
      // Auto-select today or first day
      const t = today();
      const todayDay = ds.find(d => d.date === t);
      const initial = todayDay || ds[0];
      if (initial) {
        setSelectedDay(initial);
        await loadActivities(initial.id);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function loadActivities(dayId) {
    try {
      const acts = await sb(`activities?day_id=eq.${dayId}&order=time.asc`);
      setActivities(prev => ({ ...prev, [dayId]: acts }));
    } catch(e) {}
  }

  async function handleSelectDay(day) {
    setSelectedDay(day);
    if (!activities[day.id]) await loadActivities(day.id);
  }

  async function deleteActivity(actId) {
    await sb(`activities?id=eq.${actId}`, { method:"DELETE", prefer:"" });
    if (selectedDay) {
      setActivities(prev => ({
        ...prev,
        [selectedDay.id]: (prev[selectedDay.id] || []).filter(a => a.id !== actId),
      }));
    }
  }

  // Scroll selected day into view
  useEffect(() => {
    if (!selectedDay || !dayBarRef.current) return;
    const btn = dayBarRef.current.querySelector(`[data-dayid="${selectedDay.id}"]`);
    if (btn) btn.scrollIntoView({ behavior:"smooth", block:"nearest", inline:"center" });
  }, [selectedDay]);

  const dayActs = selectedDay ? (activities[selectedDay.id] || []) : [];

  if (loading) return <Spinner/>;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Day tabs - horizontal scroll */}
      <div ref={dayBarRef} style={{
        display:"flex", gap:8, overflowX:"auto", padding:"12px 16px",
        background:"white", borderBottom:"1px solid var(--border)",
        scrollbarWidth:"none",
      }}>
        {days.map(d => {
          const isSelected = selectedDay?.id === d.id;
          const isToday = d.date === today();
          return (
            <button key={d.id} data-dayid={d.id} onClick={() => handleSelectDay(d)} style={{
              flexShrink:0, border:"none", borderRadius:12, padding:"8px 14px",
              background: isSelected ? "var(--yellow)" : "var(--bg)",
              color: isSelected ? "var(--dark)" : "var(--muted)",
              fontWeight: isSelected ? 800 : 600, fontSize:13,
              transition:"all 0.15s", position:"relative",
              outline: isToday && !isSelected ? "2px solid var(--yellow-dark)" : "none",
            }}>
              {fmtDay(d.date)}
              {isToday && <div style={{ position:"absolute", top:4, right:6, width:6, height:6, borderRadius:"50%", background:"var(--blue)" }}/>}
            </button>
          );
        })}
      </div>

      {/* Day title */}
      {selectedDay && (
        <div style={{ padding:"14px 16px 0" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>
            {fmtDay(selectedDay.date)} {selectedDay.date === today() ? "· Hoy" : ""}
          </div>
          {selectedDay.title && <div style={{ fontSize:17, fontWeight:700, color:"var(--dark)", marginTop:2 }}>{selectedDay.title}</div>}
        </div>
      )}

      {/* Activities */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px 16px" }}>
        {dayActs.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:"var(--muted)" }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📅</div>
            <div style={{ fontSize:14, fontWeight:600 }}>Sin actividades para este día</div>
            <div style={{ fontSize:12, marginTop:4 }}>Agregá la primera abajo 👇</div>
          </div>
        ) : dayActs.map(a => (
          <ActivityCard key={a.id} act={a} onDelete={deleteActivity}/>
        ))}
      </div>

      {/* Add button */}
      {selectedDay && (
        <div style={{ padding:"0 16px 16px" }}>
          <Btn onClick={() => setShowAddAct(true)} style={{ width:"100%" }}>
            + Agregar actividad
          </Btn>
        </div>
      )}

      {showAddAct && selectedDay && (
        <AddActivityModal
          dayId={selectedDay.id}
          onClose={() => setShowAddAct(false)}
          onAdded={act => {
            setActivities(prev => ({
              ...prev,
              [selectedDay.id]: [...(prev[selectedDay.id] || []), act].sort((a,b) => (a.time||"").localeCompare(b.time||"")),
            }));
            setShowAddAct(false);
          }}
        />
      )}
    </div>
  );
}

// ─── PLACES TAB ──────────────────────────────────────────────────────────────
const PLACE_CATEGORIES = ["restaurante","hotel","museo","naturaleza","playa","bar","compras","otro"];
const CAT_COLORS = {
  restaurante:"#FFF3E0", hotel:"#E8F5E9", museo:"#EDE7F6", naturaleza:"#E0F2F1",
  playa:"#E3F2FD", bar:"#FCE4EC", compras:"#FFF8E1", otro:"#F5F5F5",
};
const CAT_ICONS = {
  restaurante:"🍽️", hotel:"🏨", museo:"🏛️", naturaleza:"🌿",
  playa:"🏖️", bar:"🍻", compras:"🛍️", otro:"📍",
};

function PlaceCard({ place, onDelete }) {
  return (
    <div style={{
      background:"white", borderRadius:14, padding:"14px 16px", boxShadow:"var(--shadow)", marginBottom:10,
      display:"flex", gap:12, alignItems:"flex-start",
    }}>
      <div style={{
        width:42, height:42, borderRadius:12, flexShrink:0,
        background: CAT_COLORS[place.category] || "#F5F5F5",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
      }}>
        {CAT_ICONS[place.category] || "📍"}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:14 }}>{place.name}</div>
        {place.description && <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, lineHeight:1.4 }}>{place.description}</div>}
        {place.maps_url && (
          <a href={place.maps_url} target="_blank" rel="noopener" style={{ fontSize:11, color:"var(--blue)", fontWeight:600, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:3, marginTop:4 }}>
            📍 Ver en Maps
          </a>
        )}
      </div>
      <button onClick={() => onDelete(place.id)} style={{ background:"none", border:"none", color:"#ccc", fontSize:18, padding:0, flexShrink:0 }}>×</button>
    </div>
  );
}

function AddPlaceModal({ tripId, onClose, onAdded }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [category, setCategory] = useState("otro");
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!name) return;
    setLoading(true);
    try {
      const [place] = await sb("places", {
        method:"POST",
        body: JSON.stringify({ trip_id: tripId, name, description, maps_url: mapsUrl, category }),
      });
      onAdded(place);
    } catch(e) { alert(e.message); }
    setLoading(false);
  }

  return (
    <Modal title="Nuevo lugar de interés 📍" onClose={onClose}>
      <Input label="Nombre del lugar" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Mercado Central"/>
      <Select label="Categoría" value={category} onChange={e => setCategory(e.target.value)}>
        {PLACE_CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
      </Select>
      <Textarea label="Descripción / Notas" value={description} onChange={e => setDescription(e.target.value)} placeholder="Tips, horarios, precios..."/>
      <Input label="Link Google Maps" value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/..."/>
      <Btn onClick={add} disabled={loading || !name}>{loading ? "Guardando..." : "Agregar lugar"}</Btn>
    </Modal>
  );
}

function PlacesTab({ trip }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { load(); }, [trip.id]);

  async function load() {
    setLoading(true);
    const ps = await sb(`places?trip_id=eq.${trip.id}&order=category.asc`);
    setPlaces(ps);
    setLoading(false);
  }

  async function del(id) {
    await sb(`places?id=eq.${id}`, { method:"DELETE", prefer:"" });
    setPlaces(prev => prev.filter(p => p.id !== id));
  }

  if (loading) return <Spinner/>;

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 0" }}>
        {places.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"var(--muted)" }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🗺️</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Sin lugares todavía</div>
            <div style={{ fontSize:13, marginTop:4 }}>Guardá los spots que no querés perderte</div>
          </div>
        ) : places.map(p => <PlaceCard key={p.id} place={p} onDelete={del}/>)}
      </div>
      <div style={{ padding:"12px 16px 16px" }}>
        <Btn onClick={() => setShowAdd(true)}>+ Agregar lugar</Btn>
      </div>
      {showAdd && (
        <AddPlaceModal
          tripId={trip.id}
          onClose={() => setShowAdd(false)}
          onAdded={p => { setPlaces(prev => [...prev, p]); setShowAdd(false); }}
        />
      )}
    </div>
  );
}

// ─── DOCS TAB ────────────────────────────────────────────────────────────────
const DOC_TYPES = ["pasaje","hotel","seguro","entrada","reserva","otro"];

function DocCard({ doc, onDelete }) {
  return (
    <div style={{
      background:"white", borderRadius:14, padding:"14px 16px", boxShadow:"var(--shadow)", marginBottom:10,
      display:"flex", gap:12, alignItems:"center",
    }}>
      <div style={{ fontSize:28, flexShrink:0 }}>{DOC_ICONS[doc.type] || "📄"}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:14 }}>{doc.name}</div>
        <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.04em", marginTop:2 }}>{doc.type}</div>
      </div>
      <div style={{ display:"flex", gap:8, flexShrink:0 }}>
        {doc.file_url && (
          <a href={doc.file_url} target="_blank" rel="noopener" style={{
            fontSize:12, fontWeight:700, color:"var(--blue)", textDecoration:"none",
            padding:"6px 12px", background:"#EBF5FF", borderRadius:8,
          }}>Ver</a>
        )}
        <button onClick={() => onDelete(doc.id)} style={{ background:"none", border:"none", color:"#ccc", fontSize:18, padding:0 }}>×</button>
      </div>
    </div>
  );
}

function AddDocModal({ tripId, onClose, onAdded }) {
  const [name, setName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [type, setType] = useState("otro");
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!name) return;
    setLoading(true);
    try {
      const [doc] = await sb("documents", {
        method:"POST",
        body: JSON.stringify({ trip_id: tripId, name, file_url: fileUrl, type }),
      });
      onAdded(doc);
    } catch(e) { alert(e.message); }
    setLoading(false);
  }

  return (
    <Modal title="Nuevo documento 📄" onClose={onClose}>
      <Input label="Nombre del documento" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Pasaje Buenos Aires → Panamá"/>
      <Select label="Tipo" value={type} onChange={e => setType(e.target.value)}>
        {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_ICONS[t]} {t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
      </Select>
      <Input label="URL del archivo (Drive, Dropbox, etc.)" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..."/>
      <Btn onClick={add} disabled={loading || !name}>{loading ? "Guardando..." : "Agregar documento"}</Btn>
    </Modal>
  );
}

function DocsTab({ trip }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { load(); }, [trip.id]);

  async function load() {
    setLoading(true);
    const ds = await sb(`documents?trip_id=eq.${trip.id}&order=type.asc`);
    setDocs(ds);
    setLoading(false);
  }

  async function del(id) {
    await sb(`documents?id=eq.${id}`, { method:"DELETE", prefer:"" });
    setDocs(prev => prev.filter(d => d.id !== id));
  }

  if (loading) return <Spinner/>;

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 0" }}>
        {docs.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"var(--muted)" }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📁</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Sin documentos todavía</div>
            <div style={{ fontSize:13, marginTop:4 }}>Pasajes, seguros, entradas — todo acá</div>
          </div>
        ) : docs.map(d => <DocCard key={d.id} doc={d} onDelete={del}/>)}
      </div>
      <div style={{ padding:"12px 16px 16px" }}>
        <Btn onClick={() => setShowAdd(true)}>+ Agregar documento</Btn>
      </div>
      {showAdd && (
        <AddDocModal
          tripId={trip.id}
          onClose={() => setShowAdd(false)}
          onAdded={d => { setDocs(prev => [...prev, d]); setShowAdd(false); }}
        />
      )}
    </div>
  );
}

// ─── MEMBERS TAB ─────────────────────────────────────────────────────────────
function MembersTab({ trip, session }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, [trip.id]);

  async function load() {
    setLoading(true);
    try {
      const ms = await sb(`trip_members?trip_id=eq.${trip.id}&select=*,profiles(full_name)`);
      setMembers(ms);
    } catch(e) {}
    setLoading(false);
  }

  async function invite() {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      // Look up user by email via profiles (requires email match)
      // In a real app you'd use an edge function — here we just add by searching profiles
      const profiles = await sb(`profiles?email=eq.${encodeURIComponent(inviteEmail)}`);
      if (!profiles || profiles.length === 0) {
        setToast({ msg:"No se encontró un usuario con ese email", type:"error" });
        setInviting(false);
        return;
      }
      const invitedId = profiles[0].id;
      await sb("trip_members", {
        method:"POST",
        body: JSON.stringify({ trip_id: trip.id, user_id: invitedId, role:"viewer" }),
      });
      setToast({ msg:"¡Invitación enviada!", type:"success" });
      setInviteEmail("");
      load();
    } catch(e) {
      setToast({ msg:e.message, type:"error" });
    }
    setInviting(false);
  }

  if (loading) return <Spinner/>;

  return (
    <div style={{ padding:"16px" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>
          Invitar persona
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@ejemplo.com" type="email"
            style={{
              flex:1, padding:"12px 14px", border:"1.5px solid var(--border)",
              borderRadius:10, fontSize:14, background:"white",
            }}
          />
          <button onClick={invite} disabled={inviting || !inviteEmail} style={{
            background:"var(--yellow)", border:"none", borderRadius:10,
            padding:"12px 16px", fontWeight:700, fontSize:14, flexShrink:0,
          }}>
            {inviting ? "..." : "Invitar"}
          </button>
        </div>
      </div>

      <div style={{ fontSize:13, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>
        Viajeros ({members.length})
      </div>
      {members.map(m => (
        <div key={m.id} style={{
          background:"white", borderRadius:12, padding:"12px 14px",
          boxShadow:"var(--shadow)", marginBottom:8, display:"flex", alignItems:"center", gap:12,
        }}>
          <div style={{
            width:38, height:38, borderRadius:"50%", background:"var(--yellow)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:800, fontSize:15, color:"var(--dark)", flexShrink:0,
          }}>
            {(m.profiles?.full_name || "?").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>{m.profiles?.full_name || "Usuario"}</div>
            <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.04em" }}>
              {m.role === "owner" ? "Organizador" : "Viajero"}
            </div>
          </div>
          {m.user_id === session.user.id && (
            <div style={{ fontSize:11, color:"var(--blue)", fontWeight:700 }}>Tú</div>
          )}
        </div>
      ))}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
    </div>
  );
}

// ─── TRIP DETAIL SCREEN ───────────────────────────────────────────────────────
const TABS = [
  { id:"itinerary", icon:"🗓️", label:"Itinerario" },
  { id:"add_place", icon:"➕", label:"Lugar" },
  { id:"places",    icon:"🗺️", label:"Lugares" },
  { id:"docs",      icon:"📁", label:"Docs" },
];

function TripScreen({ trip, session, onBack }) {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [placesRefresh, setPlacesRefresh] = useState(0);

  const status = tripStatus(trip.start_date, trip.end_date);
  const ss = STATUS_STYLES[status];
  const colorIdx = trip.title.length % COVER_COLORS.length;

  function handleTab(id) {
    if (id === "add_place") {
      setShowAddPlace(true);
      return;
    }
    setActiveTab(id);
  }

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"var(--bg)" }}>
      {/* Header */}
      <div style={{
        background:"white", borderBottom:"1px solid var(--border)",
        paddingTop:48,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 16px 12px" }}>
          <button onClick={onBack} style={{
            background:"var(--bg)", border:"none", borderRadius:10,
            width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
          }}>←</button>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"Nunito", fontWeight:900, fontSize:18, letterSpacing:"-0.3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {trip.title}
            </div>
            <div style={{ fontSize:12, color:"var(--muted)" }}>
              {fmtDate(trip.start_date)} → {fmtDate(trip.end_date)}
            </div>
          </div>
          <div style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, background:ss.bg, color:ss.color, flexShrink:0 }}>
            {ss.label}
          </div>
        </div>

        {/* Tab label */}
        <div style={{ padding:"0 16px 10px", fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>
          {activeTab === "itinerary" && "Itinerario"}
          {activeTab === "places" && "Lugares de interés"}
          {activeTab === "docs" && "Documentos"}
          {activeTab === "members" && "Viajeros"}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", minHeight:0 }}>
        {activeTab === "itinerary" && <ItineraryTab trip={trip}/>}
        {activeTab === "places" && <PlacesTab trip={trip} key={placesRefresh}/>}
        {activeTab === "docs" && <DocsTab trip={trip}/>}
        {activeTab === "members" && <MembersTab trip={trip} session={session}/>}
      </div>

      {/* Bottom nav */}
      <div style={{
        background:"white", borderTop:"1px solid var(--border)",
        display:"flex", paddingBottom:"env(safe-area-inset-bottom, 8px)",
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id && tab.id !== "add_place";
          return (
            <button key={tab.id} onClick={() => handleTab(tab.id)} style={{
              flex:1, border:"none", background:"transparent",
              padding:"10px 4px 6px", display:"flex", flexDirection:"column",
              alignItems:"center", gap:2, position:"relative",
            }}>
              {tab.id === "add_place" ? (
                <div style={{
                  width:46, height:46, borderRadius:"50%", background:"var(--yellow)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:24, fontWeight:700, marginTop:-18,
                  boxShadow:"0 4px 12px rgba(255,214,0,0.5)",
                }}>+</div>
              ) : (
                <>
                  <div style={{ fontSize:20 }}>{tab.icon}</div>
                  <div style={{ fontSize:10, fontWeight:700, color: active ? "var(--dark)" : "var(--muted)" }}>
                    {tab.label}
                  </div>
                  {active && <div style={{ position:"absolute", bottom:0, left:"25%", right:"25%", height:2, background:"var(--yellow-dark)", borderRadius:1 }}/>}
                </>
              )}
            </button>
          );
        })}
        {/* Members icon */}
        <button onClick={() => setActiveTab("members")} style={{
          flex:1, border:"none", background:"transparent",
          padding:"10px 4px 6px", display:"flex", flexDirection:"column",
          alignItems:"center", gap:2, position:"relative",
        }}>
          <div style={{ fontSize:20 }}>👥</div>
          <div style={{ fontSize:10, fontWeight:700, color: activeTab === "members" ? "var(--dark)" : "var(--muted)" }}>
            Viajeros
          </div>
          {activeTab === "members" && <div style={{ position:"absolute", bottom:0, left:"25%", right:"25%", height:2, background:"var(--yellow-dark)", borderRadius:1 }}/>}
        </button>
      </div>

      {showAddPlace && (
        <AddPlaceModal
          tripId={trip.id}
          onClose={() => setShowAddPlace(false)}
          onAdded={() => {
            setShowAddPlace(false);
            setPlacesRefresh(n => n+1);
            setActiveTab("places");
          }}
        />
      )}
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [toast, setToast] = useState(null);

  // Inject styles
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("jd_session") || "null");
      if (s?.access_token) setSession(s);
    } catch(e) {}
  }, []);

  function handleAuth(s) {
    localStorage.setItem("jd_session", JSON.stringify(s));
    setSession(s);
  }

  function handleLogout() {
    localStorage.removeItem("jd_session");
    setSession(null);
    setSelectedTrip(null);
  }

  if (!session) return <AuthScreen onAuth={handleAuth}/>;
  if (selectedTrip) return (
    <TripScreen
      trip={selectedTrip}
      session={session}
      onBack={() => setSelectedTrip(null)}
    />
  );
  return (
    <>
      <TripsScreen session={session} onSelectTrip={setSelectedTrip}/>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
    </>
  );
}
