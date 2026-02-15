"use client";

/**
 * Scan WebSocket Hook
 * React hook for subscribing to scan events
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { createWSClient, WSClient } from "./client";
import type {
	WSConnectionStatus,
	ScanLogPayload,
	ScanProgressPayload,
	WorkerEventPayload,
	FindingEventPayload,
	ScanCompletedPayload,
} from "@/types";
import { isDemoMode } from "@/lib/demo/mode";
import { useDemoScanSocket } from "@/lib/demo/websocket";

/** Hook configuration */
export interface UseScanSocketOptions {
	scanId: string;
	enabled?: boolean;
	onLog?: (log: ScanLogPayload) => void;
	onProgress?: (progress: ScanProgressPayload) => void;
	onWorkerUpdate?: (worker: WorkerEventPayload) => void;
	onFinding?: (finding: FindingEventPayload) => void;
	onComplete?: (result: ScanCompletedPayload) => void;
	onError?: (error: { code: string; message: string }) => void;
}

/** Hook return value */
export interface UseScanSocketReturn {
	status: WSConnectionStatus;
	isConnected: boolean;
	logs: ScanLogPayload[];
	progress: ScanProgressPayload | null;
	workers: Map<string, WorkerEventPayload>;
	latestFinding: FindingEventPayload | null;
	connect: () => void;
	disconnect: () => void;
	clearLogs: () => void;
}

/** WebSocket URL builder */
function getWSUrl(scanId: string): string {
	const baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
	return `${baseUrl}/ws/scans/${scanId}`;
}

/** Max logs to keep in memory */
const MAX_LOGS = 1000;

function toWorkerType(value: string): WorkerEventPayload["type"] {
	const v = value.toUpperCase();
	if (
		v === "SUBDOMAIN" ||
		v === "PORT" ||
		v === "TECH" ||
		v === "HEADERS" ||
		v === "TLS" ||
		v === "DIRECTORY" ||
		v === "NUCLEI" ||
		v === "CLOUD" ||
		v === "AI"
	) {
		return v;
	}
	return "SUBDOMAIN";
}

export function useScanSocket(
	options: UseScanSocketOptions,
): UseScanSocketReturn {
	const {
		scanId,
		enabled = true,
		onLog,
		onProgress,
		onWorkerUpdate,
		onFinding,
		onComplete,
		onError,
	} = options;

	const isDemo = isDemoMode() || scanId === "scan-demo-001";

	// Demo socket hook (always called to respect rules of hooks)
	const demoSocket = useDemoScanSocket({
		scanId,
		onLog,
		onProgress,
		enabled: isDemo,
	});

	const [status, setStatus] = useState<WSConnectionStatus>("DISCONNECTED");
	const [logs, setLogs] = useState<ScanLogPayload[]>([]);
	const [progress, setProgress] = useState<ScanProgressPayload | null>(null);
	const [workers, setWorkers] = useState<Map<string, WorkerEventPayload>>(
		new Map(),
	);
	const [latestFinding, setLatestFinding] =
		useState<FindingEventPayload | null>(null);

	const clientRef = useRef<WSClient | null>(null);

	const appendLog = useCallback(
		(level: ScanLogPayload["level"], source: string, message: string) => {
			const line: ScanLogPayload = {
				scanId,
				level,
				source,
				message,
				timestamp: new Date().toISOString(),
			};
			setLogs((prev) => {
				const next = [...prev, line];
				return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
			});
		},
		[scanId],
	);

	// Connect function
	const connect = useCallback(() => {
		if (clientRef.current) return;

		const client = createWSClient({
			url: getWSUrl(scanId),
			reconnect: true,
		});

		// Status updates
		client.onStatusChange(setStatus);

		// Event handlers
		client.events.on("SCAN_LOG", (payload) => {
			setLogs((prev) => {
				const next = [...prev, payload];
				return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
			});
			onLog?.(payload);
		});

		client.events.on("SCAN_PROGRESS", (payload) => {
			if (payload.scanId === scanId) {
				setProgress(payload);
				onProgress?.(payload);
				appendLog(
					"INFO",
					"scan",
					`Progress ${payload.progress}% (${payload.workersCompleted}/${payload.workersTotal} workers)`
				);
			}
		});

		client.events.on("WORKER_STARTED", (payload) => {
			const normalized: WorkerEventPayload = {
				workerId: String((payload as { workerId?: string }).workerId || "unknown"),
				scanId: String((payload as { scanId?: string }).scanId || scanId),
				type: toWorkerType(
					String(
						(payload as { type?: string; workerType?: string }).type ||
							(payload as { workerType?: string }).workerType ||
							"SUBDOMAIN",
					),
				),
				status: "RUNNING",
				progress: 0,
				resultCount: 0,
			};
			setWorkers((prev) => new Map(prev).set(normalized.workerId, normalized));
			onWorkerUpdate?.(normalized);
			appendLog("INFO", normalized.type.toLowerCase(), `${normalized.type} worker started`);
		});

		client.events.on("WORKER_PROGRESS", (payload) => {
			const normalized: WorkerEventPayload = {
				workerId: String((payload as { workerId?: string }).workerId || "unknown"),
				scanId: String((payload as { scanId?: string }).scanId || scanId),
				type: toWorkerType(
					String(
						(payload as { type?: string; workerType?: string }).type ||
							(payload as { workerType?: string }).workerType ||
							"SUBDOMAIN",
					),
				),
				status: "RUNNING",
				progress: Number((payload as { progress?: number }).progress || 0),
				resultCount: Number((payload as { resultCount?: number }).resultCount || 0),
			};
			setWorkers((prev) => new Map(prev).set(normalized.workerId, normalized));
			onWorkerUpdate?.(normalized);
			const progressValue = normalized.progress ?? 0;
			if (progressValue % 25 === 0 || progressValue === 100) {
				appendLog(
					"DEBUG",
					normalized.type.toLowerCase(),
					`${normalized.type} ${progressValue}% (${normalized.resultCount || 0} findings)`
				);
			}
		});

		client.events.on("WORKER_FINISHED", (payload) => {
			const normalized: WorkerEventPayload = {
				workerId: String((payload as { workerId?: string }).workerId || "unknown"),
				scanId: String((payload as { scanId?: string }).scanId || scanId),
				type: toWorkerType(
					String(
						(payload as { type?: string; workerType?: string }).type ||
							(payload as { workerType?: string }).workerType ||
							"SUBDOMAIN",
					),
				),
				status: "COMPLETED",
				progress: 100,
				resultCount: Number((payload as { resultCount?: number }).resultCount || 0),
			};
			setWorkers((prev) => new Map(prev).set(normalized.workerId, normalized));
			onWorkerUpdate?.(normalized);
			appendLog(
				"INFO",
				normalized.type.toLowerCase(),
				`${normalized.type} completed (${normalized.resultCount || 0} findings)`
			);
		});

		client.events.on("WORKER_COMPLETED", (payload) => {
			const normalized: WorkerEventPayload = {
				workerId: String((payload as { workerId?: string }).workerId || "unknown"),
				scanId: String((payload as { scanId?: string }).scanId || scanId),
				type: toWorkerType(
					String(
						(payload as { type?: string; workerType?: string }).type ||
							(payload as { workerType?: string }).workerType ||
							"SUBDOMAIN",
					),
				),
				status: "COMPLETED",
				progress: Number((payload as { progress?: number }).progress || 100),
				resultCount: Number((payload as { resultCount?: number }).resultCount || 0),
			};
			setWorkers((prev) => new Map(prev).set(normalized.workerId, normalized));
			onWorkerUpdate?.(normalized);
			appendLog(
				"INFO",
				normalized.type.toLowerCase(),
				`${normalized.type} completed (${normalized.resultCount || 0} findings)`
			);
		});

		client.events.on("WORKER_FAILED", (payload) => {
			const normalized: WorkerEventPayload = {
				workerId: String((payload as { workerId?: string }).workerId || "unknown"),
				scanId: String((payload as { scanId?: string }).scanId || scanId),
				type: toWorkerType(
					String(
						(payload as { type?: string; workerType?: string }).type ||
							(payload as { workerType?: string }).workerType ||
							"SUBDOMAIN",
					),
				),
				status: "FAILED",
				progress: Number((payload as { progress?: number }).progress || 0),
				resultCount: Number((payload as { resultCount?: number }).resultCount || 0),
				error: (payload as { error?: string }).error,
			};
			setWorkers((prev) => new Map(prev).set(normalized.workerId, normalized));
			onWorkerUpdate?.(normalized);
			appendLog(
				"ERROR",
				normalized.type.toLowerCase(),
				`${normalized.type} failed${normalized.error ? `: ${normalized.error}` : ""}`
			);
		});

		client.events.on("FINDING_DISCOVERED", (payload) => {
			const normalized: FindingEventPayload = {
				scanId: String((payload as { scanId?: string }).scanId || scanId),
				findingId:
					String((payload as { findingId?: string }).findingId || "") ||
					`${scanId}-${Date.now()}`,
				title:
					String((payload as { title?: string }).title || "") ||
					`Finding from ${String((payload as { workerType?: string }).workerType || "worker")}`,
				severity:
					(String((payload as { severity?: string }).severity || "INFO").toUpperCase() as FindingEventPayload["severity"]),
				asset: String((payload as { asset?: string }).asset || "unknown"),
				source: String((payload as { source?: string; workerType?: string }).source || (payload as { workerType?: string }).workerType || "worker"),
			};
			setLatestFinding(normalized);
			onFinding?.(normalized);
			appendLog("INFO", "finding", `Finding discovered on ${normalized.asset}`);
		});

		client.events.on("SCAN_COMPLETED", (payload) => {
			if (payload.scanId === scanId) {
				appendLog("INFO", "scan", `Scan completed with ${payload.findingCount} findings`);
				onComplete?.(payload);
			}
		});

		client.events.on("ERROR", (payload) => {
			appendLog("ERROR", "socket", payload.message || "WebSocket error");
			onError?.(payload);
		});

		client.connect();
		clientRef.current = client;
	}, [
		scanId,
		appendLog,
		onLog,
		onProgress,
		onWorkerUpdate,
		onFinding,
		onComplete,
		onError,
	]);

	// Disconnect function
	const disconnect = useCallback(() => {
		if (clientRef.current) {
			clientRef.current.disconnect();
			clientRef.current = null;
		}
		setStatus("DISCONNECTED");
	}, []);

	// Clear logs
	const clearLogs = useCallback(() => {
		setLogs([]);
	}, []);

	// Auto-connect/disconnect based on enabled flag
	useEffect(() => {
		if (enabled && scanId && !isDemo) {
			connect();
		}

		return () => {
			disconnect();
		};
	}, [enabled, scanId, connect, disconnect]);

	if (isDemo) {
		return {
			status: demoSocket.isConnected ? "CONNECTED" : "CONNECTING",
			isConnected: demoSocket.isConnected,
			logs: demoSocket.logs,
			progress: demoSocket.progress,
			workers: new Map(
				demoSocket.workers.map((w) => [
					w.workerId,
					{ ...w, scanId } as WorkerEventPayload,
				]),
			),
			latestFinding: null,
			connect: () => {},
			disconnect: () => {},
			clearLogs: () => {},
		};
	}

	return {
		status,
		isConnected: status === "CONNECTED",
		logs,
		progress,
		workers,
		latestFinding,
		connect,
		disconnect,
		clearLogs,
	};
}
