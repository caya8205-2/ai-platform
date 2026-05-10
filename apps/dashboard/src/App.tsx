import { Routes, Route, NavLink, Navigate, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import Playground from "./pages/Playground";
import Queue from "./pages/Queue";
import Stats from "./pages/Stats";

const nav = [
    { 
        to: "/playground", 
        label: "Playground", 
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5"></polyline>
                <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
        ) 
    },
    { 
        to: "/queue", 
        label: "Job Queue", 
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <line x1="9" y1="4" x2="9" y2="22"></line>
            </svg>
        ) 
    },
    { 
        to: "/stats", 
        label: "Stats", 
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"></path>
                <path d="m19 9-5 5-4-4-3 3"></path>
            </svg>
        ) 
    },
];

export default function App() {
    const [sessions, setSessions] = useState<any[]>([]);
    const navigate = useNavigate();

    // Sync sessions from localStorage for the sidebar
    useEffect(() => {
        const load = () => {
            const saved = localStorage.getItem("pg_sessions");
            if (saved) setSessions(JSON.parse(saved));
        };
        load();
        window.addEventListener("storage", load);
        const iv = setInterval(load, 1000); // simple sync
        return () => {
            window.removeEventListener("storage", load);
            clearInterval(iv);
        };
    }, []);

    const createNewChat = () => {
        const id = Date.now().toString();
        const newSession = { id, title: "New Chat", messages: [], timestamp: Date.now() };
        const updated = [newSession, ...sessions];
        localStorage.setItem("pg_sessions", JSON.stringify(updated));
        localStorage.setItem("pg_current_session", id);
        navigate(`/playground/${id}`);
    };

    const sessionsSorted = useMemo(() => {
        return [...sessions].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.timestamp - a.timestamp;
        });
    }, [sessions]);

    const deleteSession = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Hapus chat ini?")) return;
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        localStorage.setItem("pg_sessions", JSON.stringify(updated));
        navigate("/playground");
    };

    const renameSession = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const current = sessions.find(s => s.id === id);
        const newTitle = prompt("Masukkan judul baru:", current?.title);
        if (!newTitle) return;
        const updated = sessions.map(s => s.id === id ? { ...s, title: newTitle } : s);
        setSessions(updated);
        localStorage.setItem("pg_sessions", JSON.stringify(updated));
        setActiveMenu(null);
    };

    const togglePin = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const updated = sessions.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s);
        setSessions(updated);
        localStorage.setItem("pg_sessions", JSON.stringify(updated));
        setActiveMenu(null);
    };

    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const { id: currentRouteId } = useParams();

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
            <aside style={{
                width: 240,
                background: "var(--bg-2)",
                borderRight: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                padding: "24px 12px",
                gap: 4,
                flexShrink: 0,
            }}>
                <div style={{ padding: "0 12px 24px", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-2)", letterSpacing: "-0.5px" }}>
                        ai-platform
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>dashboard</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 20 }}>
                    {nav.map(({ to, label, icon }) => (
                        <NavLink key={to} to={to} style={{ textDecoration: "none" }}>
                            {({ isActive }) => (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "9px 12px",
                                    borderRadius: 8,
                                    background: isActive ? "var(--accent-glow)" : "transparent",
                                    color: isActive ? "var(--accent-2)" : "var(--text-2)",
                                    fontWeight: isActive ? 600 : 400,
                                    transition: "all 0.15s",
                                }}>
                                    <span style={{ fontSize: 16 }}>{icon}</span>
                                    <span>{label}</span>
                                </div>
                            )}
                        </NavLink>
                    ))}
                </div>

                {/* Chat History in Sidebar */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, padding: "0 12px 8px" }}>
                        Recent Chats
                    </div>
                    <button onClick={createNewChat} style={{
                        margin: "0 8px 8px", background: "var(--bg-3)", border: "1px solid var(--border-2)",
                        color: "var(--text-2)", padding: "8px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600
                    }}>
                        + New Chat
                    </button>
                    {sessionsSorted.filter(sess => sess.messages && sess.messages.length > 0).map(sess => (
                        <NavLink key={sess.id} to={`/playground/${sess.id}`} style={{ textDecoration: "none" }}>
                            {({ isActive }) => (
                                <div 
                                    onMouseLeave={() => setActiveMenu(null)}
                                    style={{
                                        position: "relative",
                                        padding: "8px 12px", borderRadius: 8, fontSize: 13,
                                        color: isActive ? "var(--text)" : "var(--text-3)",
                                        background: isActive ? "var(--bg-3)" : "transparent",
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        gap: 8
                                    }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", flex: 1 }}>
                                        {sess.pinned && (
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--accent-2)" stroke="var(--accent-2)" strokeWidth="2">
                                                <path d="M21 10V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"></path>
                                                <path d="M7 10v4a2 2 0 0 1-2 2 1 1 0 0 0 0 2h14a1 1 0 0 0 0-2 2 2 0 0 1-2-2v-4"></path>
                                                <line x1="12" y1="18" x2="12" y2="22"></line>
                                            </svg>
                                        )}
                                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {sess.title}
                                        </span>
                                    </div>
                                    
                                    <div 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenu(activeMenu === sess.id ? null : sess.id); }}
                                        style={{ cursor: "pointer", padding: "2px", opacity: 0.5, display: "flex", alignItems: "center" }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="1"></circle>
                                            <circle cx="12" cy="5" r="1"></circle>
                                            <circle cx="12" cy="19" r="1"></circle>
                                        </svg>
                                    </div>

                                    {activeMenu === sess.id && (
                                        <div style={{
                                            position: "absolute", right: 8, top: 32, width: 120,
                                            background: "var(--bg-3)", border: "1px solid var(--border)",
                                            borderRadius: 8, padding: 4, zIndex: 100, boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                                        }}>
                                            <div onClick={(e) => togglePin(sess.id, e)} style={{ padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                                                {sess.pinned ? "Unpin" : "Pin"}
                                            </div>
                                            <div onClick={(e) => renameSession(sess.id, e)} style={{ padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                                                Rename
                                            </div>
                                            <div onClick={(e) => deleteSession(sess.id, e)} style={{ padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, color: "var(--red)" }}>
                                                Delete
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </div>
            </aside>

            <main style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
                <Routes>
                    <Route path="/" element={<Navigate to="/playground" replace />} />
                    <Route path="/playground" element={<Playground />} />
                    <Route path="/playground/:id" element={<Playground />} />
                    <Route path="/queue" element={<Queue />} />
                    <Route path="/stats" element={<Stats />} />
                </Routes>
            </main>
        </div>
    );
}