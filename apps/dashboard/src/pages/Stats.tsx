import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

// mock data generator
const genTokenData = () => Array.from({ length: 20 }, (_, i) => ({
    time: `${(19 - i) * 3}m`,
    tokens: Math.floor(Math.random() * 2000 + 500),
    latency: Math.floor(Math.random() * 800 + 200),
}));

const genProviderData = () => [
    { name: "Groq", req: Math.floor(Math.random() * 80 + 40), tkn: Math.floor(Math.random() * 8000 + 2000) },
    { name: "Anthropic", req: Math.floor(Math.random() * 40 + 10), tkn: Math.floor(Math.random() * 5000 + 1000) },
    { name: "OpenAI", req: Math.floor(Math.random() * 20 + 5), tkn: Math.floor(Math.random() * 3000 + 500) },
];

const s: Record<string, React.CSSProperties> = {
    page: { padding: "32px 40px", display: "flex", flexDirection: "column", gap: 32, maxWidth: 1400, margin: "0 auto" },
    header: { display: "flex", flexDirection: "column", gap: 4 },
    title: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" },
    sub: { fontSize: 13, color: "var(--text-3)" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 },
    card: { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, boxShadow: "0 4px 6px -1px #00000020" },
    statLabel: { fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 8 },
    statVal: { fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-1px" },
    statTrend: { fontSize: 12, color: "var(--green)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 },
    chartCard: { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 20 },
    chartTitle: { fontSize: 14, fontWeight: 600, color: "var(--text-2)" },
    charts: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
};

const tooltipStyle = { background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, boxShadow: "0 10px 15px -3px #000" };

export default function Stats() {
    const [tokenData, setTokenData] = useState<any[]>([]);
    const [summaryData, setSummaryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/v1/chat/stats");
            const data = await res.json();
            
            // Map hourly data
            setTokenData(data.hourlyUsage.map((h: any) => ({
                time: h.time,
                tokens: h.tokens,
                latency: Math.floor(h.latency)
            })));

            // Map provider summary
            setSummaryData(data.summary.map((s: any) => ({
                name: s.provider,
                req: s.total_requests,
                tkn: s.total_tokens
            })));
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const iv = setInterval(fetchData, 10000); // refresh every 10s
        return () => clearInterval(iv);
    }, [fetchData]);

    const totalReqs = summaryData.reduce((a, b) => a + b.req, 0);
    const totalTokens = summaryData.reduce((a, b) => a + b.tkn, 0);
    const avgLatency = tokenData.length > 0 
        ? Math.floor(tokenData.reduce((a, b) => a + b.latency, 0) / tokenData.length)
        : 0;

    if (loading && summaryData.length === 0) {
        return <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Loading metrics...</div>;
    }

    return (
        <div style={s.page}>
            <header style={s.header}>
                <div style={s.title}>System Analytics</div>
                <div style={s.sub}>Real-time monitoring from SQLite database</div>
            </header>

            {summaryData.length === 0 ? (
                <div style={{ ...s.card, textAlign: "center", padding: "80px 0", borderStyle: "dashed" }}>
                    <div style={{ marginBottom: 24, opacity: 0.2, display: "flex", justifyContent: "center" }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                    </div>
                    <div style={{ color: "var(--text-2)", fontWeight: 600, fontSize: 16 }}>Belum ada data penggunaan.</div>
                    <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 8 }}>Silakan gunakan Playground untuk mulai mencatat statistik.</div>
                </div>
            ) : (
                <>
                    <div style={s.grid}>
                        {[
                            { label: "Total Requests", val: totalReqs, trend: "Real-time", color: "var(--accent-2)" },
                            { label: "Tokens Processed", val: totalTokens.toLocaleString(), trend: "Cumulative", color: "var(--green)" },
                            { label: "Avg Latency", val: `${avgLatency}ms`, trend: "Last 24h", color: "var(--yellow)" },
                            { label: "Database", val: "SQLite", trend: "Connected", color: "var(--text-2)" },
                        ].map(({ label, val, trend, color }) => (
                            <div key={label} style={s.card}>
                                <div style={s.statLabel}>{label}</div>
                                <div style={{ ...s.statVal, color: color }}>{val}</div>
                                <div style={{ ...s.statTrend, color: "var(--text-3)" }}>{trend}</div>
                            </div>
                        ))}
                    </div>

                    <div style={s.charts}>
                        <div style={s.chartCard}>
                            <div style={s.chartTitle}>Token Usage (Hourly)</div>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={tokenData}>
                                    <defs>
                                        <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="time" tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Area type="monotone" dataKey="tokens" stroke="var(--accent)" fill="url(#tGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={s.chartCard}>
                            <div style={s.chartTitle}>Latency Trend (ms)</div>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={tokenData}>
                                    <defs>
                                        <linearGradient id="lGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="time" tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Area type="monotone" dataKey="latency" stroke="var(--green)" fill="url(#lGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ ...s.chartCard, gridColumn: "span 2" }}>
                            <div style={s.chartTitle}>Distribution by Provider</div>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={summaryData} barSize={40}>
                                    <XAxis dataKey="name" tick={{ fill: "var(--text-2)", fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="req" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}