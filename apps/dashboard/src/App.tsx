import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { clsx } from "clsx";
import Playground from "./pages/Playground";
import Queue from "./pages/Queue";
import Stats from "./pages/Stats";

const nav = [
    { to: "/playground", label: "Playground", icon: "⌘" },
    { to: "/queue", label: "Job Queue", icon: "⚡" },
    { to: "/stats", label: "Stats", icon: "◈" },
];

export default function App() {
    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
            <aside style={{
                width: 220,
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

                {nav.map(({ to, label, icon }) => (
                    <NavLink key={to} to={to} style={{ textDecoration: "none" }}>
                        {({ isActive }) => (
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "9px 12px",
                                borderRadius: "var(--radius)",
                                background: isActive ? "var(--accent-glow)" : "transparent",
                                color: isActive ? "var(--accent-2)" : "var(--text-2)",
                                fontWeight: isActive ? 600 : 400,
                                transition: "all 0.15s",
                                border: isActive ? "1px solid var(--accent-glow)" : "1px solid transparent",
                            }}>
                                <span style={{ fontSize: 16 }}>{icon}</span>
                                <span>{label}</span>
                            </div>
                        )}
                    </NavLink>
                ))}
            </aside>

            <main style={{ flex: 1, overflow: "auto", background: "var(--bg)" }}>
                <Routes>
                    <Route path="/" element={<Navigate to="/playground" replace />} />
                    <Route path="/playground" element={<Playground />} />
                    <Route path="/queue" element={<Queue />} />
                    <Route path="/stats" element={<Stats />} />
                </Routes>
            </main>
        </div>
    );
}