import { useState, useCallback, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";

interface Job {
    jobId: string;
    state: "waiting" | "active" | "completed" | "failed";
    prompt?: string;
    provider?: string;
    model?: string;
    result?: {
        response: string;
        usage: { promptTokens: number; completionTokens: number; totalTokens: number };
        latencyMs: number;
    };
}

const s: Record<string, any> = {
    page: { padding: "32px 40px", display: "flex", flexDirection: "column", gap: 32, maxWidth: 1200, margin: "0 auto" },
    header: { display: "flex", flexDirection: "column", gap: 4 },
    title: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" },
    sub: { fontSize: 13, color: "var(--text-3)" },
    
    // Dispatch Card
    dispatchCard: { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 4px 20px #00000040" },
    sectionLabel: { fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1 },
    textarea: { background: "var(--bg-3)", border: "1px solid var(--border-2)", color: "var(--text)", borderRadius: 12, padding: "14px", fontSize: 14, resize: "none", outline: "none", lineHeight: 1.5 },
    controls: { display: "flex", gap: 12, alignItems: "center" },
    select: { background: "var(--bg-3)", border: "1px solid var(--border-2)", color: "var(--text)", borderRadius: 8, padding: "10px 14px", fontSize: 13, outline: "none", flex: 1 },
    btn: (disabled: boolean) => ({
        background: disabled ? "var(--bg-3)" : "var(--accent)",
        color: disabled ? "var(--text-3)" : "#fff",
        border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 600, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s"
    }),

    // Job List
    jobList: { display: "flex", flexDirection: "column", gap: 12 },
    jobCard: { 
        background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 20px", 
        display: "flex", alignItems: "center", gap: 20, transition: "all 0.2s", cursor: "pointer"
    },
    jobId: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-3)", width: 120 },
    jobInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
    jobPrompt: { fontSize: 13, color: "var(--text)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    jobMeta: { fontSize: 11, color: "var(--text-3)", display: "flex", gap: 12 },
    status: (state: string) => ({
        fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "4px 10px", borderRadius: 20,
        background: state === "completed" ? "#10b98120" : state === "failed" ? "#ef444420" : "#3b82f620",
        color: state === "completed" ? "#10b981" : state === "failed" ? "#ef4444" : "#3b82f6",
        border: `1px solid ${state === "completed" ? "#10b98140" : state === "failed" ? "#ef444440" : "#3b82f640"}`,
    }),

    // Result Overlay
    resultCard: { background: "var(--bg-3)", border: "1px solid var(--accent)", borderRadius: 20, padding: 24, marginTop: 20, display: "flex", flexDirection: "column", gap: 16 },
    resultText: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--text-2)" }
};

export default function Queue() {
    const [jobs, setJobs] = useState<Job[]>(() => {
        const saved = localStorage.getItem("pg_jobs");
        return saved ? JSON.parse(saved) : [];
    });
    const [prompt, setPrompt] = useState("");
    const [provider, setProvider] = useState("groq");
    const [model, setModel] = useState("llama-3.3-70b-versatile");
    const [dispatching, setDispatching] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    const selectedJob = useMemo(() => jobs.find(j => j.jobId === selectedJobId), [jobs, selectedJobId]);

    useEffect(() => {
        localStorage.setItem("pg_jobs", JSON.stringify(jobs));
    }, [jobs]);

    useEffect(() => {
        // restart polling for incomplete jobs
        jobs.forEach(job => {
            if (job.state === "waiting" || job.state === "active") {
                pollJob(job.jobId);
            }
        });
    }, []); // on mount only
    const pollJob = useCallback(async (jobId: string) => {
        try {
            const res = await fetch(`/v1/chat/job/${jobId}`);
            const data = await res.json();
            setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, ...data } : j));
            if (data.state === "waiting" || data.state === "active") {
                setTimeout(() => pollJob(jobId), 2000);
            }
        } catch (err) {
            console.error("Polling error:", err);
        }
    }, []);

    const dispatch = async () => {
        if (!prompt.trim()) return;
        setDispatching(true);
        try {
            const res = await fetch("/v1/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: prompt }],
                    provider, model, async: true,
                }),
            });
            const data = await res.json();
            const newJob: Job = { jobId: data.jobId, state: "waiting", prompt: prompt.trim(), provider, model };
            setJobs(prev => [newJob, ...prev]);
            setPrompt("");
            pollJob(data.jobId);
        } catch (err) {
            alert("Failed to dispatch job");
        } finally {
            setDispatching(false);
        }
    };

    return (
        <div style={s.page}>
            <header style={s.header}>
                <div style={s.title}>Asynchronous Tasks</div>
                <div style={s.sub}>Dispatch long-running LLM jobs and monitor their progress</div>
            </header>

            {/* Dispatch Section */}
            <div style={s.dispatchCard}>
                <div style={s.sectionLabel}>New Background Task</div>
                <textarea 
                    style={s.textarea} 
                    rows={4} 
                    placeholder="Enter your prompt for a background task..." 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                />
                <div style={s.controls}>
                    <select style={s.select} value={provider} onChange={e => setProvider(e.target.value)}>
                        <option value="groq">Groq</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="openai">OpenAI</option>
                    </select>
                    <input 
                        style={{ ...s.select, flex: 2 }} 
                        value={model} 
                        onChange={e => setModel(e.target.value)} 
                        placeholder="Model identifier (e.g. llama-3.3-70b-versatile)" 
                    />
                    <button style={s.btn(dispatching || !prompt.trim())} onClick={dispatch} disabled={dispatching || !prompt.trim()}>
                        {dispatching ? "Dispatching..." : "Run in Background"}
                    </button>
                </div>
            </div>

            {/* Jobs List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={s.sectionLabel}>Recent Tasks</div>
                <div style={s.jobList}>
                    {jobs.length === 0 && (
                        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-3)", border: "1px dashed var(--border)", borderRadius: 16 }}>
                            No background tasks yet.
                        </div>
                    )}
                    {jobs.map(job => (
                        <div key={job.jobId} style={s.jobCard} 
                             onClick={() => setSelectedJobId(selectedJobId === job.jobId ? null : job.jobId)}
                             onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-2)"}
                             onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                            <div style={s.jobId}>#{job.jobId.slice(0, 8)}...</div>
                            <div style={s.jobInfo}>
                                <div style={s.jobPrompt}>{job.prompt || "Async Task"}</div>
                                <div style={s.jobMeta}>
                                    <span>{job.provider?.toUpperCase()}</span>
                                    <span>•</span>
                                    <span>{job.model}</span>
                                    {job.result && (
                                        <>
                                            <span>•</span>
                                            <span style={{ color: "var(--green)" }}>{job.result.latencyMs}ms</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div style={s.status(job.state)}>{job.state}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selection Result */}
            {selectedJob && (
                <div style={s.resultCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={s.sectionLabel}>Result — {selectedJob.jobId}</div>
                        <button style={{ background: "transparent", border: "none", color: "var(--text-3)", cursor: "pointer" }} onClick={() => setSelectedJobId(null)}>Close</button>
                    </div>
                    {selectedJob.state === "completed" ? (
                        <>
                            <div style={s.resultText}>{selectedJob.result?.response}</div>
                            <div style={{ display: "flex", gap: 20, paddingTop: 16, borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-3)" }}>
                                <span>Tokens: {selectedJob.result?.usage.totalTokens}</span>
                                <span>Latency: {selectedJob.result?.latencyMs}ms</span>
                            </div>
                        </>
                    ) : selectedJob.state === "failed" ? (
                        <div style={{ ...s.resultText, color: "var(--red)" }}>Task execution failed. Please check backend logs.</div>
                    ) : (
                        <div style={{ ...s.resultText, color: "var(--accent-2)" }}>Task is currently {selectedJob.state}...</div>
                    )}
                </div>
            )}
        </div>
    );
}