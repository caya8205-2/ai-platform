import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// mock data — nanti diganti dari real API
const genTokenData = () => Array.from({ length: 12 }, (_, i) => ({
    time: `${i * 5}m ago`,
    tokens: Math.floor(Math.random() * 2000 + 500),
    latency: Math.floor(Math.random() * 800 + 200),
})).reverse();

const genProviderData = () => [
    { name: "Groq", requests: Math.floor(Math.random() * 80 + 40), tokens: Math.floor(Math.random() * 8000 + 2000) },
    { name: "Anthropic", requests: Math.floor(Math.random() * 40 + 10), tokens: Math.floor(Math.random() * 5000 + 1000) },
    { name: "OpenAI", requests: Math.floor(Math.random() * 20 + 5), tokens: Math.floor(Math.random() * 3000 + 500) },
];

const s: Record<string, React.CSSProperties> = {
    page: { padding: 24, display: "flex", flexDirection: "column", gap: 20 },
    title: { fontSize: 15, fontWeight: 600 },
    grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
    statCard: { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 },
    statLabel: { fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
    statVal: { fontSize: 24, fontWeight: 700, color: "var(--text)" },
    statSub: { fontSize: 12, color: "var(--text-3)", marginTop: 4 },
    chartCard: { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 },
    chartTitle: { fontSize: 13, fontWeight: 600, marginBottom: 16, color: "var(--text-2)" },
    charts: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
};

const tooltipStyle = { background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };

export default function Stats() {
    const [tokenData, setTokenData] = useState(genTokenData());
    const [providerData, setProviderData] = useState(genProviderData());

    useEffect(() => {
        const iv = setInterval(() => {
            setTokenData(genTokenData());
            setProviderData(genProviderData());
        }, 10000);
        return () => clearInterval(iv);
    }, []);

    const totalReqs = providerData.reduce((a, b) => a + b.requests, 0);
    const totalTokens = providerData.reduce((a, b) => a + b.tokens, 0);
    const avgLatency = Math.floor(tokenData.reduce((a, b) => a + b.latency, 0) / tokenData.length);

    return (
        <div style={s.page}>
            <div style={s.title}>Stats</div>

            <div style={s.grid}>
                {[
                    { label: "Total Requests", val: totalReqs, sub: "last 24h" },
                    { label: "Total Tokens", val: totalTokens.toLocaleString(), sub: "all providers" },
                    { label: "Avg Latency", val: `${avgLatency}ms`, sub: "last hour" },
                    { label: "Active Provider", val: "Groq", sub: "default" },
                ].map(({ label, val, sub }) => (
                    <div key={label} style={s.statCard}>
                        <div style={s.statLabel}>{label}</div>
                        <div style={s.statVal}>{val}</div>
                        <div style={s.statSub}>{sub}</div>
                    </div>
                ))}
            </div>

            <div style={s.charts}>
                <div style={s.chartCard}>
                    <div style={s.chartTitle}>Token Usage</div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={tokenData}>
                            <defs>
                                <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7c6ff7" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#7c6ff7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" tick={{ fill: "#5a5a72", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#5a5a72", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="tokens" stroke="#7c6ff7" fill="url(#tGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={s.chartCard}>
                    <div style={s.chartTitle}>Latency (ms)</div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={tokenData}>
                            <defs>
                                <linearGradient id="lGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" tick={{ fill: "#5a5a72", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#5a5a72", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="latency" stroke="#4ade80" fill="url(#lGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ ...s.chartCard, gridColumn: "span 2" }}>
                    <div style={s.chartTitle}>Requests by Provider</div>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={providerData} barGap={8}>
                            <XAxis dataKey="name" tick={{ fill: "#5a5a72", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#5a5a72", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="requests" fill="#7c6ff7" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="tokens" fill="#4ade80" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}