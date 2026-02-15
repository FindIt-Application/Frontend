"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { FindingsTable, FindingFilters } from "@/components/findings";
import { LocalErrorBoundary } from "@/components/error";
import { DemoBanner } from "@/components/demo";
import { isDemoMode, DEMO_FINDINGS_LIST } from "@/lib/demo";
import { findings } from "@/lib/api/endpoints";
import type {
	FindingListItem,
	FindingSeverity,
	FindingCategory,
} from "@/types";

export default function FindingsPage() {
	const [severity, setSeverity] = useState<FindingSeverity | null>(null);
	const [category, setCategory] = useState<FindingCategory | null>(null);
	const [scanId, setScanId] = useState<string | null>(null);

	const isDemo = isDemoMode();
	const [findingsData, setFindingsData] = useState<FindingListItem[]>(
		isDemo ? DEMO_FINDINGS_LIST : [],
	);
	const [loading, setLoading] = useState(!isDemo);
	const [error, setError] = useState<string | undefined>(undefined);

	useEffect(() => {
		if (isDemo) {
			setFindingsData(DEMO_FINDINGS_LIST);
			setLoading(false);
			setError(undefined);
			return;
		}

		let cancelled = false;

		const mapList = (items: Array<Record<string, unknown>>): FindingListItem[] => {
			return items.map((item, idx) => {
				const workerType = String(item.workerType || "TECH").toUpperCase();
				const raw =
					typeof item.rawData === "object" && item.rawData !== null
						? (item.rawData as Record<string, unknown>)
						: {};
				const title =
					typeof raw.title === "string"
						? raw.title
						: typeof raw.technology === "string"
							? `Technology detected: ${raw.technology}`
							: typeof item.path === "string"
								? `Endpoint discovered: ${item.path}`
								: `Finding ${idx + 1}`;

				return {
					id: String(item.id || `finding-${idx}`),
					scanId: String(item.scanId || ""),
					title,
					severity:
						(typeof raw.severity === "string"
							? raw.severity.toUpperCase()
							: "INFO") as FindingSeverity,
					category:
						(typeof raw.category === "string"
							? raw.category.toUpperCase()
							: "CONFIGURATION") as FindingCategory,
					source: workerType as FindingListItem["source"],
					asset: String(item.asset || "unknown"),
					createdAt: String(item.createdAt || new Date().toISOString()),
					hasAIAnalysis: Boolean(raw.ai || raw.aiAnalysis),
				};
			});
		};

		const load = async () => {
			setLoading(true);
			setError(undefined);

			if (scanId) {
				const res = await findings.byScan(scanId);
				if (cancelled) return;
				if (!res.success) {
					setFindingsData([]);
					setError((res.error as { userMessage?: string }).userMessage || res.error.message);
					setLoading(false);
					return;
				}
				setFindingsData(
					mapList((res.data || []) as Array<Record<string, unknown>>),
				);
				setLoading(false);
				return;
			}

			const res = await findings.list();
			if (cancelled) return;
			if (!res.success) {
				setFindingsData([]);
				setError((res.error as { userMessage?: string }).userMessage || res.error.message);
				setLoading(false);
				return;
			}

			const payload = res.data as unknown;
			const list = Array.isArray(payload)
				? payload
				: (payload as { items?: Array<Record<string, unknown>> })?.items || [];
			setFindingsData(mapList(list as Array<Record<string, unknown>>));
			setLoading(false);
		};

		load().catch((err) => {
			if (cancelled) return;
			setFindingsData([]);
			setError(err instanceof Error ? err.message : "Failed to load findings");
			setLoading(false);
		});

		return () => {
			cancelled = true;
		};
	}, [isDemo, scanId]);

	// Filter findings based on selected filters
	const filteredFindings = useMemo(() => findingsData.filter((f) => {
		if (severity && f.severity !== severity) return false;
		if (category && f.category !== category) return false;
		if (scanId && !f.scanId.includes(scanId)) return false;
		return true;
	}), [findingsData, severity, category, scanId]);

	const clearFilters = () => {
		setSeverity(null);
		setCategory(null);
		setScanId(null);
	};

	return (
		<div
			className={`p-3 sm:p-6 space-y-4 sm:space-y-6 min-h-screen bg-black ${isDemo ? "pt-16" : ""}`}
		>
			{/* Demo Banner */}
			<DemoBanner />

			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
						<BarChart3 className="w-5 h-5 text-violet-400" />
					</div>
					<div>
						<h1 className="text-lg sm:text-xl font-bold text-zinc-100">
							Findings
						</h1>
						<p className="text-xs sm:text-sm text-zinc-500">
							Security findings across all scans
							{isDemo && (
								<span className="ml-2 text-violet-400">
									(Demo Data)
								</span>
							)}
						</p>
					</div>
				</div>
			</div>

			{/* Filters */}
			<LocalErrorBoundary sectionName="Filters">
				<FindingFilters
					severity={severity}
					category={category}
					scanId={scanId}
					onSeverityChange={setSeverity}
					onCategoryChange={setCategory}
					onScanIdChange={setScanId}
					onClear={clearFilters}
				/>
			</LocalErrorBoundary>

			{/* Table */}
			<LocalErrorBoundary sectionName="Findings Table">
				<FindingsTable
					findings={filteredFindings}
					loading={loading}
					error={error}
				/>
			</LocalErrorBoundary>
		</div>
	);
}
