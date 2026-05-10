import { useState, useCallback } from "react";
import type { CSSProperties } from "react";

interface Job {
    jobId: string;
    state: "waiting" | "active" | "completed" | "failed";
    result?: {
        response: string;
        usage: { promptTokens: number; completionTokens: number; totalTokens: number };
        latencyMs: number;
    };
}

const STATE_COLOR: Record<string, string> = {
    waiting: "var(--yellow)",
    active: "var(--accent-2)",
    completed: "var(--green)",
    failed: "var(--red)",
};

const badge = (state: string): CSSProperties => ({
    background: STATE_COLOR[state] + "22",
    color: STATE_COLOR[state],
    borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600,
});

const s: Record<string, CSSProperties> = {
    page: { padding: 24, display: "flex", flexDirection: "column", gap: 20 },
    header: { display: "flex", alignItems: "center", gap: 12 },
    title: { fontSize: 15, fontWeight: 600, flex: 1 },
    card: { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" },
    dispatchArea: { padding: 20, display: "flex", flexDirection: "column", gap: 12 },
    textarea: {
        background: "var(--bg-3)", border: "1px solid var(--border-2)", color: "var(--text)",
        borderRadius: 8, padding: "10px 14px", fontSize: 13, resize: "vertical", outline: "none",
        fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5,
    },
    row: { display: "flex", gap: 10, alignItems: "center" },
    select: { background: "var(--bg-3)", border: "1px solid var(--border-2)", color: "var(--text)", borderRadius: 8, padding: "6px 10px", fontSize: 13 },
    btn: { background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 13 },
    btnSm: { background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border-2)", borderRadius: 6, padding: "5px 12px", fontSize: 12 },
    jobList: { display: "flex", flexDirection: "column" },
    jobRow: { padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 },
    mono: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-3)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    sectionLabel: { padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 },
};

export default function Queue() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [prompt, setPrompt] = useState("");
    const [provider, setProvider] = useState("groq");
    const [model, setModel] = useState("llama-3.3-70b-versatile");
    const [dispatching, setDispatching] = useState(false);
    const [selected, setSelected] = useState<Job | null>(null);

    const pollJob = useCallback(async (jobId: string) => {
        const res = await fetch(`/v1/chat/job/${jobId}`);
        const data = await res.json();
        setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, ...data } : j));
        if (data.state === "waiting" || data.state === "active") {
            setTimeout(() => pollJob(jobId), 1500);
        }
    }, []);

    async function dispatch() {
        if (!prompt.trim()) return;
        setDispatching(true);
        const res = await fetch("/v1/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [{ role: "user", content: prompt }],
                provider, model, async: true,
            }),
        });
        const data = await res.json();
        const newJob: Job = { jobId: data.jobId, state: "waiting" };
        setJobs(prev => [newJob, ...prev]);
        setPrompt("");
        setDispatching(false);
        pollJob(data.jobId);
    }

    return (
        <div style={s.page}>
            <div style={s.header}>
                <span style={s.title}>Job Queue</span>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>{jobs.length} jobs</span>
            </div>

            <div style={s.card}>
                <div style={s.sectionLabel}>Dispatch Job</div>
                <div style={s.dispatchArea}>
                    <textarea style={s.textarea} rows={3} placeholder="Prompt..." value={prompt} onChange={e => setPrompt(e.target.value)} />
                    <div style={s.row}>
                        <select style={s.select} value={provider} onChange={e => setProvider(e.target.value)}>
                            <option value="groq">Groq</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="openai">OpenAI</option>
                        </select>
                        <input style={{ ...s.select, flex: 1 }} value={model} onChange={e => setModel(e.target.value)} placeholder="model" />
                        <button style={s.btn} onClick={dispatch} disabled={dispatching || !prompt.trim()}>
                            {dispatching ? "Dispatching..." : "Dispatch"}
                        </button>
                    </div>
                </div>
            </div>

            <div style={s.card}>
                <div style={s.sectionLabel}>Jobs</div>
                <div style={s.jobList}>
                    {jobs.length === 0 && (
                        <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)" }}>No jobs yet</div>
                    )}
                    {jobs.map(job => (
                        <div key={job.jobId} style={s.jobRow}>
                            <span style={badge(job.state)}>{job.state}</span>
                            <span style={s.mono}>{job.jobId}</span>
                            {job.result && (
                                <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                                    {job.result.latencyMs}ms · {job.result.usage.totalTokens} tokens
                                </span>
                            )}
                            <button style={s.btnSm} onClick={() => setSelected(job === selected ? null : job)}>
                                {job === selected ? "Hide" : "View"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {selected?.result && (
                <div style={s.card}>
                    <div style={s.sectionLabel}>Result — {selected.jobId}</div>
                    <div style={{ padding: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--text)" }}>
                        {selected.result.response}
                    </div>
                </div>
            )}
        </div>
    );
}