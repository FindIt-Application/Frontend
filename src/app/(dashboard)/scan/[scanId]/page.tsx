"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Download, LockKeyhole } from "lucide-react";
import {
	ScanLogs,
	ScanHeader,
	ScanProgress,
	ScanTabs,
	PerspectiveToggle,
	SubdomainResults,
	PortResults,
	TechResults,
	HeadersResults,
	TLSResults,
	DirectoryResults,
	CloudResults,
	NucleiResults,
} from "@/components/scan";
import { LocalErrorBoundary, ConnectionBanner } from "@/components/error";
import { usePermissions } from "@/hooks/usePermissions";
import { useScanSocket } from "@/lib/websocket/useScanSocket";
import { scans } from "@/lib/api/endpoints";
import type { TabId, Perspective } from "@/components/scan";
import type {
	ScanState,
	ScanProgressPayload,
	FeatureFlags,
	WorkerState,
} from "@/types";
import type {
	SubdomainResultWithAI,
	PortResultWithAI,
	TechResultWithAI,
	HeaderResultWithAI,
	TLSResultWithAI,
	DirectoryResultWithAI,
	NucleiResultWithAI,
} from "@/types/ai-context";
import type { CloudResultWithAI } from "@/types/cloud";

interface ScanPageProps {
	params: Promise<{ scanId: string }>;
}

const perspectiveToMode: Record<Perspective, "standard" | "red" | "blue"> = {
	neutral: "standard",
	attacker: "red",
	defender: "blue",
};

// Initial workers state
const INITIAL_WORKERS: WorkerState[] = [
	{
		workerId: "subdomain-worker",
		type: "SUBDOMAIN",
		status: "PENDING",
		progress: 0,
	},
	{ workerId: "port-worker", type: "PORT", status: "PENDING", progress: 0 },
	{ workerId: "tech-worker", type: "TECH", status: "PENDING", progress: 0 },
	{
		workerId: "headers-worker",
		type: "HEADERS",
		status: "PENDING",
		progress: 0,
	},
	{ workerId: "tls-worker", type: "TLS", status: "PENDING", progress: 0 },
	{
		workerId: "directory-worker",
		type: "DIRECTORY",
		status: "PENDING",
		progress: 0,
	},
	{
		workerId: "nuclei-worker",
		type: "NUCLEI",
		status: "PENDING",
		progress: 0,
	},
];

// Placeholder feature flags
const PLACEHOLDER_FEATURES: FeatureFlags = {
	ai_analysis: false,
	report_export: true,
	branding_removal: false,
	deep_scan: false,
	custom_scan: false,
	custom_wordlist: false,
	cloud_enumeration: false,
};

function normalizeWorkerType(workerType: string): string {
	return workerType.toLowerCase().trim();
}

function toStatus(value: string | undefined):
	| "PENDING"
	| "RUNNING"
	| "COMPLETED"
	| "FAILED" {
	const v = (value || "").toUpperCase();
	if (v === "RUNNING") return "RUNNING";
	if (v === "COMPLETED") return "COMPLETED";
	if (v === "FAILED") return "FAILED";
	return "PENDING";
}

type ScanResultsTab =
	| "subdomains"
	| "ports"
	| "technologies"
	| "headers"
	| "tls"
	| "directories"
	| "cloud"
	| "vulnerabilities";

function mapWorkerTypeToTab(workerType: string): ScanResultsTab | null {
	const t = normalizeWorkerType(workerType);
	if (t === "subdomain") return "subdomains";
	if (t === "port") return "ports";
	if (t === "tech") return "technologies";
	if (t === "headers" || t === "header") return "headers";
	if (t === "tls") return "tls";
	if (t === "directory" || t === "dir_brute") return "directories";
	if (t === "cloud") return "cloud";
	if (t === "nuclei" || t === "vuln") return "vulnerabilities";
	return null;
}

const INITIAL_WORKERS_BY_TAB = {
	subdomains: [] as SubdomainResultWithAI[],
	ports: [] as PortResultWithAI[],
	technologies: [] as TechResultWithAI[],
	headers: [] as HeaderResultWithAI[],
	tls: [] as TLSResultWithAI[],
	directories: [] as DirectoryResultWithAI[],
	cloud: [] as CloudResultWithAI[],
	vulnerabilities: [] as NucleiResultWithAI[],
};

export default function ScanResultsPage({ params }: ScanPageProps) {
	const [scanId, setScanId] = useState<string>("");
	const [activeTab, setActiveTab] = useState<TabId>("subdomains");
	const [perspective, setPerspective] = useState<Perspective>("neutral");
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	// Get permissions from subscription
	const { getDisabledScanTabs } = usePermissions();

	const [features] = useState<FeatureFlags>(PLACEHOLDER_FEATURES);

	const canExportReport = features.report_export !== false;

	const handleDownloadReport = () => {
		if (!scanId || !canExportReport) {
			return;
		}

		if (!isScanComplete) {
			setToastMessage("wait! Scanning is in Progress");
			return;
		}
		const mode = perspectiveToMode[perspective];
		const params = new URLSearchParams({ format: "pdf", mode });
		const apiBase = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(
			/\/$/,
			"",
		);
		const url = `${apiBase}/scans/${scanId}/report?${params.toString()}`;
		window.open(url, "_blank", "noopener,noreferrer");
	};

	useEffect(() => {
		if (!toastMessage) {
			return;
		}

		const timeout = window.setTimeout(() => {
			setToastMessage(null);
		}, 2200);

		return () => window.clearTimeout(timeout);
	}, [toastMessage]);

	// Scan state
	const [scan, setScan] = useState<ScanState>({
		id: "",
		target: "Loading...",
		status: "QUEUED",
		type: "QUICK",
		progress: 0,
		startedAt: new Date().toISOString(),
		findingCount: 0,
		workers: INITIAL_WORKERS,
		createdAt: new Date().toISOString(),
	});

	const [progress, setProgress] = useState<ScanProgressPayload>({
		scanId: "",
		progress: 0,
		status: "QUEUED",
		workersCompleted: 0,
		workersTotal: 7,
	});

	const isScanComplete =
		scan.status === "COMPLETED" || progress.status === "COMPLETED";
	const canDownloadReport = canExportReport && Boolean(scanId) && isScanComplete;

	// Results state (with AI context support)
	const [results, setResults] = useState(INITIAL_WORKERS_BY_TAB);

	// Loading states per worker
	const [loading, setLoading] = useState({
		subdomains: true,
		ports: true,
		technologies: true,
		headers: true,
		tls: true,
		directories: true,
		cloud: true,
		vulnerabilities: true,
	});

	// Error states per worker
	const [errors, setErrors] = useState<Record<string, string | undefined>>(
		{},
	);

	// WebSocket Hook
	const socket = useScanSocket({
		scanId,
		enabled: !!scanId,
	});

	// Sync logs and connection status
	const isConnected = socket.isConnected;
	const logs = socket.logs;
	const latestFinding = socket.latestFinding;

	const refreshInFlightRef = useRef(false);
	const refreshTimerRef = useRef<number | null>(null);

	const applyResultsPayload = useCallback((resultsPayload: {
		workers?: Record<string, { status?: string; progress?: number; results?: unknown[] }>;
		scan?: { progress?: number; status?: string; target?: string; scanType?: string };
		summary?: { findingCount?: number };
	}) => {
		const workers = resultsPayload.workers || {};
		const nextResults = { ...INITIAL_WORKERS_BY_TAB };
		const nextLoading = {
			subdomains: false,
			ports: false,
			technologies: false,
			headers: false,
			tls: false,
			directories: false,
			cloud: false,
			vulnerabilities: false,
		};

		const nextWorkers: WorkerState[] = [];

		for (const [workerType, workerData] of Object.entries(workers)) {
			const tab = mapWorkerTypeToTab(workerType);
			if (!tab) continue;

			const workerResults = workerData.results || [];
			nextWorkers.push({
				workerId: `${workerType}-worker`,
				type: (workerType.toUpperCase() as WorkerState["type"]) || "SUBDOMAIN",
				status: toStatus(workerData.status),
				progress: typeof workerData.progress === "number" ? workerData.progress : 0,
				resultCount: workerResults.length,
			});

			if (tab === "subdomains") {
				nextResults.subdomains = workerResults.map((r) => {
					const item = r as Record<string, unknown>;
					const raw = (item.rawData || {}) as Record<string, unknown>;
					return {
						subdomain: String(raw.subdomain || item.asset || ""),
						ip: typeof raw.ip === "string" ? raw.ip : undefined,
						alive: raw.alive === true,
					};
				});
			}

			if (tab === "ports") {
				nextResults.ports = workerResults.map((r) => {
					const item = r as Record<string, unknown>;
					const raw = (item.rawData || {}) as Record<string, unknown>;
					const rawState = String(raw.state || "open");
					return {
						port: Number(raw.port || 0),
						protocol: String(raw.protocol || "tcp"),
						service: typeof raw.service === "string" ? raw.service : undefined,
						version: typeof raw.version === "string" ? raw.version : undefined,
						state:
							rawState === "closed" || rawState === "filtered"
								? (rawState as "closed" | "filtered")
								: "open",
					};
				});
			}

			if (tab === "technologies") {
				nextResults.technologies = workerResults.map((r) => {
					const item = r as Record<string, unknown>;
					const raw = (item.rawData || {}) as Record<string, unknown>;
					return {
						technology: String(raw.technology || raw.name || item.asset || "Unknown"),
						category: String(raw.category || "general"),
						version: typeof raw.version === "string" ? raw.version : undefined,
					};
				});
			}

			if (tab === "headers") {
				nextResults.headers = workerResults.map((r) => {
					const item = r as Record<string, unknown>;
					const raw = (item.rawData || {}) as Record<string, unknown>;
					const headers = (raw.headers || {}) as Record<string, unknown>;
					const firstHeader = Object.entries(headers)[0];
					return {
						name: firstHeader ? String(firstHeader[0]) : "server",
						value: firstHeader ? String(firstHeader[1] || "") : undefined,
						present: firstHeader !== undefined,
					};
				});
			}

			if (tab === "tls") {
				nextResults.tls = workerResults.map((r) => {
					const item = r as Record<string, unknown>;
					const raw = (item.rawData || {}) as Record<string, unknown>;
					return {
						version: String(raw.version || "unknown"),
						issuer: String(raw.issuer || "unknown"),
						subject: String(raw.subject || "unknown"),
						expiry: String(raw.expiry || new Date().toISOString()),
						valid: raw.valid !== false,
						daysUntilExpiry:
							typeof raw.daysUntilExpiry === "number" ? raw.daysUntilExpiry : undefined,
					};
				});
			}

			if (tab === "directories") {
				nextResults.directories = workerResults.map((r) => {
					const item = r as Record<string, unknown>;
					const raw = (item.rawData || {}) as Record<string, unknown>;
					return {
						path: String(item.path || raw.path || "/"),
						statusCode: Number(item.statusCode || raw.statusCode || 0),
						contentLength:
							typeof raw.contentLength === "number" ? raw.contentLength : undefined,
						contentType:
							typeof raw.contentType === "string" ? raw.contentType : undefined,
					};
				});
			}

			if (tab === "vulnerabilities") {
				nextResults.vulnerabilities = workerResults.map((r) => {
					const item = r as Record<string, unknown>;
					const raw = (item.rawData || {}) as Record<string, unknown>;
					return {
						templateId: String(raw.templateId || item.id || "template"),
						severity: String(raw.severity || "info"),
						matchedUrl: String(raw.matchedUrl || item.asset || ""),
						evidence: typeof raw.evidence === "string" ? raw.evidence : undefined,
						tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : undefined,
					};
				});
			}
		}

		setResults(nextResults);
		setLoading(nextLoading);

		setScan((prev) => ({
			...prev,
			target: resultsPayload.scan?.target || prev.target,
			status: (resultsPayload.scan?.status?.toUpperCase() as ScanState["status"]) || prev.status,
			progress:
				typeof resultsPayload.scan?.progress === "number"
					? resultsPayload.scan.progress
					: prev.progress,
			findingCount: resultsPayload.summary?.findingCount || prev.findingCount,
			workers: nextWorkers.length > 0 ? nextWorkers : prev.workers,
		}));
	}, []);

	const refreshResults = useCallback(async (id: string) => {
		if (!id || refreshInFlightRef.current) return;
		refreshInFlightRef.current = true;
		try {
			const resultsRes = await scans.getResults(id);
			if (!resultsRes.success) return;
			const resultsEnvelope = resultsRes.data as { data?: unknown };
			const resultsPayload = (resultsEnvelope?.data || resultsEnvelope) as {
				workers?: Record<string, { status?: string; progress?: number; results?: unknown[] }>;
				scan?: { progress?: number; status?: string; target?: string; scanType?: string };
				summary?: { findingCount?: number };
			};
			applyResultsPayload(resultsPayload);
		} finally {
			refreshInFlightRef.current = false;
		}
	}, [applyResultsPayload]);

	// Sync progress
	useEffect(() => {
		if (socket.progress) {
			setProgress(socket.progress);
		}
	}, [socket.progress]);

	// Resolve params and load scan state/results.
	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			const p = await params;
			if (cancelled) return;

			setScanId(p.scanId);
			setScan((prev) => ({ ...prev, id: p.scanId }));
			setProgress((prev) => ({ ...prev, scanId: p.scanId }));

			const [scanRes, resultsRes] = await Promise.all([
				scans.get(p.scanId),
				scans.getResults(p.scanId),
			]);

			if (cancelled) return;

			const scanEnvelope = scanRes.success ? (scanRes.data as { data?: unknown }) : null;
			const scanPayload = (scanEnvelope?.data || scanEnvelope) as
				| {
					id?: string;
					scanId?: string;
					target?: string;
					status?: string;
					type?: string;
					scanType?: string;
					progress?: number;
					startedAt?: string;
					started_at?: string;
					createdAt?: string;
					workerStates?:
						| Array<{
							workerId?: string;
							type?: string;
							status?: string;
							progress?: number;
						  }>
						| undefined;
				}
				| null;

			if (scanPayload) {
				const workerStates = scanPayload.workerStates || [];
				setScan((prev) => ({
					...prev,
					id: scanPayload.id || scanPayload.scanId || p.scanId,
					target: scanPayload.target || prev.target,
					status: (scanPayload.status?.toUpperCase() as ScanState["status"]) || prev.status,
					type: (scanPayload.type?.toUpperCase() as ScanState["type"]) ||
						(scanPayload.scanType?.toUpperCase() as ScanState["type"]) ||
						prev.type,
					progress: typeof scanPayload.progress === "number" ? scanPayload.progress : prev.progress,
					startedAt:
						scanPayload.startedAt ||
						scanPayload.started_at ||
						scanPayload.createdAt ||
						prev.startedAt,
					workers:
						workerStates.length > 0
							? workerStates.map((w, idx) => ({
								workerId: w.workerId || `${w.type || "worker"}-${idx}`,
								type: (w.type?.toUpperCase() as WorkerState["type"]) || "SUBDOMAIN",
								status: toStatus(w.status),
								progress: typeof w.progress === "number" ? w.progress : 0,
							}))
							: prev.workers,
				}));
			}

			if (!resultsRes.success) {
				setErrors((prev) => ({
					...prev,
					results:
						(resultsRes.error as { userMessage?: string }).userMessage ||
						resultsRes.error.message ||
						"Failed to load scan results",
				}));
				setLoading({
					subdomains: false,
					ports: false,
					technologies: false,
					headers: false,
					tls: false,
					directories: false,
					cloud: false,
					vulnerabilities: false,
				});
				return;
			}

			const resultsEnvelope = resultsRes.data as { data?: unknown };
			const resultsPayload = (resultsEnvelope?.data || resultsEnvelope) as {
				workers?: Record<string, { status?: string; progress?: number; results?: unknown[] }>;
				scan?: { progress?: number; status?: string; target?: string; scanType?: string };
				summary?: { findingCount?: number };
			};
			applyResultsPayload(resultsPayload);
		};

		load().catch((err) => {
			if (cancelled) return;
			setErrors((prev) => ({
				...prev,
				results: err instanceof Error ? err.message : "Failed to load scan data",
			}));
			setLoading({
				subdomains: false,
				ports: false,
				technologies: false,
				headers: false,
				tls: false,
				directories: false,
				cloud: false,
				vulnerabilities: false,
			});
		});

		return () => {
			cancelled = true;
		};
	}, [params, applyResultsPayload]);

	// Keep results and findings fresh while scan runs.
	useEffect(() => {
		if (!scanId) return;
		let cancelled = false;

		const run = async () => {
			if (cancelled) return;
			await refreshResults(scanId);
		};

		run();

		const isTerminal =
			scan.status === "COMPLETED" ||
			scan.status === "FAILED" ||
			scan.status === "CANCELLED";
		if (isTerminal) {
			return () => {
				cancelled = true;
			};
		}

		const intervalId = window.setInterval(run, 4000);
		return () => {
			cancelled = true;
			window.clearInterval(intervalId);
		};
	}, [scanId, scan.status, refreshResults]);

	// Trigger a near-real-time refresh when a new finding arrives.
	useEffect(() => {
		if (!scanId || !latestFinding) return;
		if (refreshTimerRef.current) {
			window.clearTimeout(refreshTimerRef.current);
		}
		refreshTimerRef.current = window.setTimeout(() => {
			refreshResults(scanId);
		}, 350);

		return () => {
			if (refreshTimerRef.current) {
				window.clearTimeout(refreshTimerRef.current);
			}
		};
	}, [latestFinding, scanId, refreshResults]);

	// Convert workers to format expected by ScanProgress
	const workersForProgress = scan.workers.map((w) => ({
		name: w.workerId,
		status: w.status.toLowerCase() as
			| "pending"
			| "running"
			| "completed"
			| "failed",
	}));

	const renderTabContent = () => {
		switch (activeTab) {
			case "subdomains":
				return (
					<SubdomainResults
						results={results.subdomains}
						perspective={perspective}
						loading={loading.subdomains}
						error={errors.subdomains}
					/>
				);
			case "ports":
				return (
					<PortResults
						results={results.ports}
						perspective={perspective}
						loading={loading.ports}
						error={errors.ports}
					/>
				);
			case "technologies":
				return (
					<TechResults
						results={results.technologies}
						perspective={perspective}
						loading={loading.technologies}
						error={errors.technologies}
					/>
				);
			case "headers":
				return (
					<HeadersResults
						results={results.headers}
						perspective={perspective}
						loading={loading.headers}
						error={errors.headers}
					/>
				);
			case "tls":
				return (
					<TLSResults
						results={results.tls}
						perspective={perspective}
						loading={loading.tls}
						error={errors.tls}
					/>
				);
			case "directories":
				return (
					<DirectoryResults
						results={results.directories}
						perspective={perspective}
						loading={loading.directories}
						error={errors.directories}
					/>
				);
			case "cloud":
				return (
					<CloudResults
						results={results.cloud}
						perspective={perspective}
						loading={loading.cloud}
						error={errors.cloud}
					/>
				);
			case "vulnerabilities":
				return (
					<NucleiResults
						results={results.vulnerabilities}
						perspective={perspective}
						loading={loading.vulnerabilities}
						error={errors.vulnerabilities}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div className="p-3 sm:p-6 space-y-4 sm:space-y-6 min-h-screen bg-black">
			{toastMessage && (
				<div className="fixed right-4 top-4 z-[140] rounded-lg border border-amber-400/30 bg-zinc-900 px-4 py-3 text-sm text-amber-200 shadow-xl">
					{toastMessage}
				</div>
			)}

			{/* Connection Banner */}
			<ConnectionBanner isConnected={isConnected} />

			{/* Header */}
			<LocalErrorBoundary sectionName="Scan Header">
				<ScanHeader scan={scan} />
			</LocalErrorBoundary>

			{/* Progress */}
			<LocalErrorBoundary sectionName="Scan Progress">
				<ScanProgress
					progress={progress}
					workers={workersForProgress}
				/>
			</LocalErrorBoundary>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left: Terminal */}
				<div className="lg:col-span-2">
					<LocalErrorBoundary sectionName="Scan Logs">
						<ScanLogs logs={logs} isConnected={isConnected} />
					</LocalErrorBoundary>
				</div>

				{/* Right: Perspective Toggle */}
				<div>
					<PerspectiveToggle
						value={perspective}
						onChange={setPerspective}
						features={features}
					/>
					<button
						onClick={handleDownloadReport}
						disabled={!canExportReport || !scanId}
						className={`mt-4 w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
							canDownloadReport
								? "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
								: "bg-zinc-800 text-zinc-500 cursor-not-allowed"
						}`}
						title={
							canDownloadReport
								? `Download PDF report (${perspectiveToMode[perspective]} mode)`
								: !isScanComplete
									? "wait! Scanning is in Progress"
									: "Upgrade to export reports"
						}
					>
						{isScanComplete ? (
							<Download className="w-4 h-4" />
						) : (
							<LockKeyhole className="w-4 h-4" />
						)}
						Download Report PDF
					</button>
				</div>
			</div>

			{/* Tabs */}
			<ScanTabs
				activeTab={activeTab}
				onTabChange={setActiveTab}
				counts={{
					subdomains: results.subdomains.length,
					ports: results.ports.length,
					technologies: results.technologies.length,
					headers: results.headers.length,
					tls: results.tls.length,
					directories: results.directories.length,
					cloud: results.cloud.length,
					vulnerabilities: results.vulnerabilities.length,
				}}
				disabledTabs={getDisabledScanTabs()}
			/>

			{/* Tab Content - Each worker wrapped independently */}
			<LocalErrorBoundary sectionName={`${activeTab} Results`}>
				{renderTabContent()}
			</LocalErrorBoundary>
		</div>
	);
}
