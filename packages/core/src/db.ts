import fs from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "../../../stats.json");

export interface UsageLog {
    provider: string;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    latency_ms: number;
    timestamp?: string;
}

// Fungsi bantu baca/tulis JSON
async function readLogs(): Promise<UsageLog[]> {
    try {
        const data = await fs.readFile(dbPath, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function writeLogs(logs: UsageLog[]): Promise<void> {
    await fs.writeFile(dbPath, JSON.stringify(logs, null, 2), "utf-8");
}

export async function logUsage(data: UsageLog): Promise<void> {
    const logs = await readLogs();
    logs.push({
        ...data,
        timestamp: new Date().toISOString()
    });
    // Simpan 1000 logs terakhir biar gak kegedean
    await writeLogs(logs.slice(-1000));
}

export async function getStats(): Promise<any> {
    const logs = await readLogs();
    
    // Agregat summary per provider
    const summaryMap: Record<string, any> = {};
    logs.forEach(log => {
        if (!summaryMap[log.provider]) {
            summaryMap[log.provider] = { provider: log.provider, total_requests: 0, total_tokens: 0, avg_latency: 0, _sum_latency: 0 };
        }
        const s = summaryMap[log.provider];
        s.total_requests++;
        s.total_tokens += log.total_tokens;
        s._sum_latency += log.latency_ms;
        s.avg_latency = s._sum_latency / s.total_requests;
    });

    // Agregat hourly (24 jam terakhir)
    const hourlyMap: Record<string, any> = {};
    const now = Date.now();
    logs.forEach(log => {
        const ts = new Date(log.timestamp!).getTime();
        if (now - ts > 24 * 60 * 60 * 1000) return;

        const hour = log.timestamp!.split("T")[1].slice(0, 2) + ":00";
        if (!hourlyMap[hour]) {
            hourlyMap[hour] = { time: hour, tokens: 0, latency: 0, _count: 0, _sum_latency: 0 };
        }
        const h = hourlyMap[hour];
        h.tokens += log.total_tokens;
        h._sum_latency += log.latency_ms;
        h._count++;
        h.latency = h._sum_latency / h._count;
    });

    return {
        summary: Object.values(summaryMap),
        hourlyUsage: Object.values(hourlyMap).sort((a: any, b: any) => a.time.localeCompare(b.time))
    };
}
