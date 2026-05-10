import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { CSSProperties } from "react";

type Role = "user" | "assistant" | "system";
interface Message { role: Role; content: string; }
interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
}

const PROVIDERS = [
    { value: "groq", label: "Groq", models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"] },
    { value: "anthropic", label: "Anthropic", models: ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"] },
    { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini"] },
];

const s: Record<string, any> = {
    page: { display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" },
    chatContainer: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", background: "var(--bg)" },
    header: { padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-2)" },
    title: { fontSize: 14, fontWeight: 600, color: "var(--text)" },
    settingsSidebar: { width: 280, borderLeft: "1px solid var(--border)", background: "var(--bg-2)", display: "flex", flexDirection: "column", padding: 20, gap: 20, overflowY: "auto" },
    sectionLabel: { fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
    field: { display: "flex", flexDirection: "column", gap: 6 },
    select: { background: "var(--bg-3)", border: "1px solid var(--border-2)", color: "var(--text)", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer" },
    input: { background: "var(--bg-3)", border: "1px solid var(--border-2)", color: "var(--text)", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" },
    textarea: { background: "var(--bg-3)", border: "1px solid var(--border-2)", color: "var(--text)", borderRadius: 8, padding: "10px 14px", fontSize: 12, resize: "vertical", minHeight: 80, outline: "none", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 },
    messages: { flex: 1, overflowY: "auto", padding: "40px 15% 40px", display: "flex", flexDirection: "column", gap: 24 },
    inputWrapper: { padding: "20px 15%", borderTop: "1px solid var(--border)", background: "var(--bg)" },
    inputBox: { background: "var(--bg-2)", border: "1px solid var(--border-2)", borderRadius: 16, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 4px 20px #00000040" },
    chatTextarea: { background: "transparent", border: "none", color: "var(--text)", fontSize: 14, padding: "8px 4px", resize: "none", outline: "none", lineHeight: 1.6, minHeight: 44 },
    inputFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" },
};

const bubble = (role: Role): CSSProperties => ({
    maxWidth: "85%", alignSelf: role === "user" ? "flex-end" : "flex-start", display: "flex", flexDirection: "column", gap: 6,
});

const bubbleContent = (role: Role): CSSProperties => ({
    background: role === "user" ? "var(--accent)" : "var(--bg-2)",
    color: role === "user" ? "#fff" : "var(--text)",
    padding: "12px 18px", borderRadius: 18, border: role === "user" ? "none" : "1px solid var(--border)",
    fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
    boxShadow: role === "user" ? "0 4px 12px var(--accent-glow)" : "none",
    fontFamily: role === "assistant" ? "'JetBrains Mono', monospace" : "inherit",
});

const btn = (disabled: boolean, primary = true): CSSProperties => ({
    background: disabled ? "var(--bg-3)" : (primary ? "var(--accent)" : "var(--bg-3)"),
    color: disabled ? "var(--text-3)" : (primary ? "#fff" : "var(--text-2)"),
    border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s",
});

export default function Playground() {
    const { id: urlId } = useParams();
    const navigate = useNavigate();
    
    const [sessions, setSessions] = useState<ChatSession[]>(() => {
        const saved = localStorage.getItem("pg_sessions");
        return saved ? JSON.parse(saved) : [];
    });

    const [currentSessionId, setCurrentSessionId] = useState(urlId || "");

    // Auto-create or Auto-select session
    useEffect(() => {
        if (!urlId) {
            if (sessions.length > 0) {
                navigate(`/playground/${sessions[0].id}`, { replace: true });
            } else {
                const newId = Date.now().toString();
                const newSess = { id: newId, title: "New Chat", messages: [], timestamp: Date.now() };
                setSessions([newSess]);
                localStorage.setItem("pg_sessions", JSON.stringify([newSess]));
                navigate(`/playground/${newId}`, { replace: true });
            }
        } else {
            setCurrentSessionId(urlId);
        }
    }, [urlId, sessions.length, navigate]);

    const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId]);
    const messages = currentSession?.messages || [];

    const updateMessages = useCallback((newMsgs: Message[] | ((m: Message[]) => Message[])) => {
        setSessions(prev => {
            const updated = prev.map(s => {
                if (s.id === currentSessionId) {
                    const msgs = typeof newMsgs === "function" ? newMsgs(s.messages) : newMsgs;
                    let title = s.title;
                    if ((title === "New Chat" || title === "") && msgs.length > 0) {
                        const first = msgs.find(m => m.role === "user");
                        if (first) title = first.content.slice(0, 30) + (first.content.length > 30 ? "..." : "");
                    }
                    return { ...s, messages: msgs, title };
                }
                return s;
            });
            localStorage.setItem("pg_sessions", JSON.stringify(updated));
            return updated;
        });
    }, [currentSessionId]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Global Settings
    const [systemPrompt, setSystemPrompt] = useState(() => localStorage.getItem("pg_system") ?? "");
    const [provider, setProvider] = useState(() => localStorage.getItem("pg_provider") ?? "groq");
    const [model, setModel] = useState(() => localStorage.getItem("pg_model") ?? "llama-3.3-70b-versatile");
    const [temperature, setTemperature] = useState(() => parseFloat(localStorage.getItem("pg_temp") ?? "1"));
    const [maxTokens, setMaxTokens] = useState(() => parseInt(localStorage.getItem("pg_max") ?? "1024"));
    const [streaming, setStreaming] = useState(() => localStorage.getItem("pg_stream") === "true");

    useEffect(() => {
        localStorage.setItem("pg_system", systemPrompt);
        localStorage.setItem("pg_provider", provider);
        localStorage.setItem("pg_model", model);
        localStorage.setItem("pg_temp", temperature.toString());
        localStorage.setItem("pg_max", maxTokens.toString());
        localStorage.setItem("pg_stream", streaming.toString());
    }, [systemPrompt, provider, model, temperature, maxTokens, streaming]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = async (textOverride?: string) => {
        const textToContent = textOverride ?? input;
        if (!textToContent.trim() || loading || !currentSessionId) return;

        const userMsg: Message = { role: "user", content: textToContent.trim() };
        const contextMessages: Message[] = [
            ...(systemPrompt.trim() ? [{ role: "system" as Role, content: systemPrompt.trim() }] : []),
            ...messages,
            userMsg,
        ];
        if (!textOverride) {
            updateMessages(m => [...m, userMsg]);
            setInput("");
        } else {
            updateMessages([...messages, userMsg]);
        }
        setLoading(true);

        try {
            const res = await fetch(streaming ? "/v1/chat/stream" : "/v1/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: contextMessages, provider, model, temperature, maxTokens }),
            });

            if (!res.ok) throw new Error("Request failed");

            if (streaming) {
                updateMessages(m => [...m, { role: "assistant", content: "" }]);
                const reader = res.body!.getReader();
                const dec = new TextDecoder();
                let buf = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buf += dec.decode(value);
                    const lines = buf.split("\n");
                    buf = lines.pop() ?? "";
                    for (const line of lines) {
                        if (!line.startsWith("data: ")) continue;
                        const data = line.slice(6);
                        if (data === "[DONE]") break;
                        try {
                            const { text } = JSON.parse(data);
                            if (text) updateMessages(m => {
                                const last = m[m.length - 1];
                                return [...m.slice(0, -1), { ...last, content: last.content + text }];
                            });
                        } catch { }
                    }
                }
            } else {
                const data = await res.json();
                updateMessages(m => [...m, { role: "assistant", content: data.message.content }]);
            }
        } catch (err) {
            updateMessages(m => [...m, { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` }]);
        } finally {
            setLoading(false);
        }
    };

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const editMessage = (index: number) => {
        const msg = messages[index];
        setInput(msg.content);
        updateMessages(messages.slice(0, index));
    };

    const retryMessage = (index: number) => {
        const msg = messages[index];
        const prevMessages = messages.slice(0, index);
        // We need to update state and THEN send. 
        // To be safe, we'll call updateMessages and pass the context manually.
        setSessions(prev => {
            const updated = prev.map(s => {
                if (s.id === currentSessionId) {
                    const userMsg: Message = { role: "user", content: msg.content };
                    return { ...s, messages: [...prevMessages, userMsg] };
                }
                return s;
            });
            localStorage.setItem("pg_sessions", JSON.stringify(updated));
            return updated;
        });
        
        // Trigger send with the content
        setTimeout(() => send(msg.content), 50);
    };

    return (
        <div style={s.page}>
            <div style={s.chatContainer}>
                <div style={s.header}>
                    <div style={s.title}>{(!currentSession || messages.length === 0) ? "New Chat" : currentSession.title}</div>
                </div>

                <div style={s.messages}>
                    {messages.length === 0 && (
                        <div style={{ textAlign: "center", margin: "auto", color: "var(--text-3)" }}>
                            <div style={{ marginBottom: 20, opacity: 0.2, display: "flex", justifyContent: "center" }}>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>Tulis pesan di bawah untuk memulai percakapan.</div>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} style={bubble(m.role)} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, alignSelf: m.role === "user" ? "flex-end" : "flex-start", padding: "0 4px" }}>
                                {m.role}
                            </div>
                            <div style={bubbleContent(m.role)}>{m.content}</div>
                            
                            {m.role === "user" && (
                                <div style={{ 
                                    display: "flex", gap: 10, alignSelf: "flex-end", marginTop: 4, padding: "0 4px",
                                    opacity: hoveredIndex === i ? 1 : 0, transition: "opacity 0.2s"
                                }}>
                                    <div onClick={() => copyToClipboard(m.content)} title="Copy" style={{ color: "var(--text-3)", cursor: "pointer" }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </div>
                                    <div onClick={() => editMessage(i)} title="Edit" style={{ color: "var(--text-3)", cursor: "pointer" }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </div>
                                    <div onClick={() => retryMessage(i)} title="Retry" style={{ color: "var(--text-3)", cursor: "pointer" }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="1 4 1 10 7 10"></polyline>
                                            <polyline points="23 20 23 14 17 14"></polyline>
                                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && !streaming && (
                        <div style={bubble("assistant")}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1 }}>assistant</div>
                            <div style={{ ...bubbleContent("assistant"), color: "var(--text-3)", fontStyle: "italic" }}>berpikir...</div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div style={s.inputWrapper}>
                    <div style={s.inputBox}>
                        <textarea
                            style={s.chatTextarea}
                            placeholder="Tulis pesan..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                        />
                        <div style={s.inputFooter}>
                            <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                                {provider.toUpperCase()} / {model}
                            </div>
                            <button style={btn(loading || !input.trim())} onClick={() => send()}>
                                {loading ? "..." : "Kirim"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Kanan: Settings */}
            <aside style={s.settingsSidebar}>
                <div style={s.sectionLabel}>Model Configuration</div>
                <div style={s.field}>
                    <span style={{ fontSize: 12, color: "var(--text-2)" }}>Provider</span>
                    <select style={s.select} value={provider} onChange={e => {
                        setProvider(e.target.value);
                        setModel(PROVIDERS.find(x => x.value === e.target.value)!.models[0]);
                    }}>
                        {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </div>
                <div style={s.field}>
                    <span style={{ fontSize: 12, color: "var(--text-2)" }}>Model</span>
                    <select style={s.select} value={model} onChange={e => setModel(e.target.value)}>
                        {PROVIDERS.find(p => p.value === provider)?.models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>

                <div style={s.sectionLabel}>Parameters</div>
                <div style={s.field}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "var(--text-2)" }}>Temperature</span>
                        <span style={{ fontSize: 12, color: "var(--accent-2)" }}>{temperature}</span>
                    </div>
                    <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} />
                </div>
                <div style={s.field}>
                    <span style={{ fontSize: 12, color: "var(--text-2)" }}>Max Tokens</span>
                    <input type="number" style={s.input} value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value))} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13 }}>
                    <input type="checkbox" checked={streaming} onChange={e => setStreaming(e.target.checked)} />
                    Streaming Mode
                </label>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={s.sectionLabel}>System Prompt</div>
                    <textarea style={{ ...s.textarea, flex: 1 }} value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} />
                </div>
            </aside>
        </div>
    );
}