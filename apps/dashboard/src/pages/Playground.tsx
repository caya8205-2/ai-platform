import { useState, useRef, useEffect } from "react";
import type { CSSProperties } from "react";

type Role = "user" | "assistant" | "system";
interface Message { role: Role; content: string; }

const PROVIDERS = [
    { value: "groq", label: "Groq", models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"] },
    { value: "anthropic", label: "Anthropic", models: ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"] },
    { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini"] },
];

const s: Record<string, CSSProperties> = {
    page: { display: "flex", flexDirection: "column", height: "100vh" },
    header: { padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
    title: { fontSize: 15, fontWeight: 600, marginRight: "auto" },
    select: { background: "var(--bg-3)", border: "1px solid var(--border-2)", color: "var(--text)", borderRadius: 8, padding: "6px 10px", fontSize: 13 },
    label: { fontSize: 12, color: "var(--text-3)", display: "flex", flexDirection: "column", gap: 4 },
    numInput: { background: "var(--bg-3)", border: "1px solid var(--border-2)", color: "var(--text)", borderRadius: 8, padding: "5px 8px", fontSize: 13, width: 72, outline: "none" },
    systemPrompt: { padding: "12px 24px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 },
    systemLabel: { fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 },
    systemTextarea: { background: "var(--bg-3)", border: "1px solid var(--border-2)", color: "var(--text-2)", borderRadius: 8, padding: "8px 12px", fontSize: 12, resize: "none", outline: "none", lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace" },
    messages: { flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 },
    roleTag: { fontSize: 10, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 },
    inputArea: { padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 },
    textarea: { flex: 1, background: "var(--bg-3)", border: "1px solid var(--border-2)", color: "var(--text)", borderRadius: 10, padding: "10px 14px", fontSize: 13, resize: "none", outline: "none", lineHeight: 1.5 },
};

const bubble = (role: Role): CSSProperties => ({
    background: role === "user" ? "var(--accent-glow)" : "var(--bg-3)",
    border: `1px solid ${role === "user" ? "var(--accent-glow)" : "var(--border)"}`,
    borderRadius: 12, padding: "10px 14px",
    color: role === "user" ? "var(--accent-2)" : "var(--text)",
    fontSize: 13, lineHeight: 1.6,
    fontFamily: role === "assistant" ? "'JetBrains Mono', monospace" : "inherit",
    whiteSpace: "pre-wrap",
});

const btn = (disabled: boolean): CSSProperties => ({
    background: disabled ? "var(--bg-3)" : "var(--accent)",
    color: disabled ? "var(--text-3)" : "#fff",
    border: "none", borderRadius: 10, padding: "0 20px",
    fontWeight: 600, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s",
});

export default function Playground() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [showSystem, setShowSystem] = useState(false);
    const [provider, setProvider] = useState("groq");
    const [model, setModel] = useState("llama-3.3-70b-versatile");
    const [temperature, setTemperature] = useState(1);
    const [maxTokens, setMaxTokens] = useState(1024);
    const [streaming, setStreaming] = useState(false);
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const providerObj = PROVIDERS.find(p => p.value === provider)!;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function send() {
        if (!input.trim() || loading) return;
        const userMsg: Message = { role: "user", content: input.trim() };
        const contextMessages: Message[] = [
            ...(systemPrompt.trim() ? [{ role: "system" as Role, content: systemPrompt.trim() }] : []),
            ...messages,
            userMsg,
        ];
        setMessages(m => [...m, userMsg]);
        setInput("");
        setLoading(true);

        try {
            if (streaming) {
                const res = await fetch("/v1/chat/stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: contextMessages, provider, model, temperature, maxTokens }),
                });

                setMessages(m => [...m, { role: "assistant", content: "" }]);
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
                            if (text) setMessages(m => {
                                const copy = [...m];
                                copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + text };
                                return copy;
                            });
                        } catch { }
                    }
                }
            } else {
                const res = await fetch("/v1/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: contextMessages, provider, model, temperature, maxTokens }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? "Server error");
                setMessages(m => [...m, { role: "assistant", content: data.message.content }]);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            setMessages(m => [...m, { role: "assistant", content: `⚠️ ${msg}` }]);
        }

        setLoading(false);
    }

    return (
        <div style={s.page}>
            {/* header */}
            <div style={s.header}>
                <span style={s.title}>Playground</span>

                <select style={s.select} value={provider} onChange={e => {
                    setProvider(e.target.value);
                    setModel(PROVIDERS.find(p => p.value === e.target.value)!.models[0]);
                }}>
                    {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>

                <select style={s.select} value={model} onChange={e => setModel(e.target.value)}>
                    {providerObj.models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>

                <label style={s.label}>
                    <span>Temp</span>
                    <input type="number" style={s.numInput} min={0} max={2} step={0.1} value={temperature}
                        onChange={e => setTemperature(parseFloat(e.target.value))} />
                </label>

                <label style={s.label}>
                    <span>Max tokens</span>
                    <input type="number" style={s.numInput} min={1} max={8192} step={128} value={maxTokens}
                        onChange={e => setMaxTokens(parseInt(e.target.value))} />
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-2)", fontSize: 13 }}>
                    <input type="checkbox" checked={streaming} onChange={e => setStreaming(e.target.checked)} />
                    Stream
                </label>

                <button style={{ ...btn(false), padding: "6px 12px" }}
                    onClick={() => setShowSystem(s => !s)}>
                    {showSystem ? "Hide System" : "System Prompt"}
                </button>

                <button style={{ ...btn(false), padding: "6px 12px" }} onClick={() => setMessages([])}>
                    Clear
                </button>
            </div>

            {/* system prompt */}
            {showSystem && (
                <div style={s.systemPrompt}>
                    <span style={s.systemLabel}>System Prompt</span>
                    <textarea style={s.systemTextarea} rows={3}
                        placeholder="You are a helpful assistant..."
                        value={systemPrompt}
                        onChange={e => setSystemPrompt(e.target.value)}
                    />
                </div>
            )}

            {/* messages */}
            <div style={s.messages}>
                {messages.length === 0 && (
                    <div style={{ textAlign: "center", color: "var(--text-3)", marginTop: 80 }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>⌘</div>
                        <div>Start a conversation</div>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                        <div style={s.roleTag}>{m.role}</div>
                        <div style={bubble(m.role)}>{m.content}</div>
                    </div>
                ))}
                {loading && !streaming && (
                    <div style={{ alignSelf: "flex-start" }}>
                        <div style={s.roleTag}>assistant</div>
                        <div style={{ ...bubble("assistant"), color: "var(--text-3)" }}>thinking...</div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* input */}
            <div style={s.inputArea}>
                <textarea style={s.textarea} rows={3} placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                />
                <button style={btn(loading || !input.trim())} onClick={send} disabled={loading || !input.trim()}>
                    {loading ? "..." : "Send"}
                </button>
            </div>
        </div>
    );
}