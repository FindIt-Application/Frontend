"use client";

import { useEffect, useMemo, useState } from "react";
import {
	KPICards,
	RecentScans,
	FindingsOverview,
	ActivityPanel,
} from "@/components/dashboard";
import { dashboard, type DashboardOverview, type DashboardActivity } from "@/lib/api/endpoints";
import { FindingSeverity, ScanStatus, ScanType } from "@/types";

const EMPTY_KPI: DashboardOverview = {
	totalScans: 0,
	activeScans: 0,
	criticalFindings: 0,
	highFindings: 0,
	reportsGenerated: 0,
	findingStats: {
		total: 0,
		bySeverity: {
			CRITICAL: 0,
			HIGH: 0,
			MEDIUM: 0,
			LOW: 0,
			INFO: 0,
		},
		byCategory: {
			WEB: 0,
			NETWORK: 0,
			CLOUD: 0,
			CONFIGURATION: 0,
			AUTHENTICATION: 0,
		},
	},
};

export default function DashboardPage() {
	const [kpiData, setKpiData] = useState(EMPTY_KPI);
	const [recentScans, setRecentScans] = useState<
		Array<{
			id: string;
			target: string;
			type: ScanType;
			status: ScanStatus;
			startedAt: string;
		}>
	>([]);
	const [activities, setActivities] = useState<DashboardActivity[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			const [overviewRes, recentRes, activityRes] = await Promise.all([
				dashboard.getOverview(),
				dashboard.getRecentScans(10),
				dashboard.getActivity(),
			]);

			if (cancelled) return;

			if (overviewRes.success && overviewRes.data) {
				setKpiData(overviewRes.data);
			}

			if (recentRes.success && Array.isArray(recentRes.data)) {
				setRecentScans(
					recentRes.data.map((scan) => ({
						id: scan.id,
						target: scan.target,
						type: scan.type,
						status: scan.status,
						startedAt: scan.startedAt || scan.createdAt,
					})),
				);
			}

			if (activityRes.success && Array.isArray(activityRes.data)) {
				setActivities(activityRes.data);
			}

			if (!overviewRes.success || !recentRes.success || !activityRes.success) {
				const getErrorMessage = (msg: { message: string } & { userMessage?: string }) =>
					msg.userMessage || msg.message;
				const nextError = !overviewRes.success
					? getErrorMessage(overviewRes.error as { message: string; userMessage?: string })
					: !recentRes.success
						? getErrorMessage(recentRes.error as { message: string; userMessage?: string })
						: !activityRes.success
							? getErrorMessage(activityRes.error as { message: string; userMessage?: string })
							: "Some dashboard services are unavailable";
				setError(nextError);
			}
		};

		load().catch((err) => {
			if (cancelled) return;
			setError(err instanceof Error ? err.message : "Failed to load dashboard");
		});

		return () => {
			cancelled = true;
		};
	}, []);

	const findingsData: Array<{ severity: FindingSeverity; count: number }> = useMemo(
		() => [
			{ severity: "CRITICAL", count: kpiData.findingStats.bySeverity.CRITICAL },
			{ severity: "HIGH", count: kpiData.findingStats.bySeverity.HIGH },
			{ severity: "MEDIUM", count: kpiData.findingStats.bySeverity.MEDIUM },
			{ severity: "LOW", count: kpiData.findingStats.bySeverity.LOW },
			{ severity: "INFO", count: kpiData.findingStats.bySeverity.INFO },
		],
		[kpiData],
	);

	return (
		<div className="p-6 space-y-6 min-h-screen bg-black">
			<div>
				<h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
				<p className="text-zinc-400 mt-1">Security operations overview</p>
				{error && (
					<p className="text-xs text-amber-400 mt-2">
						Some dashboard services are not available yet: {error}
					</p>
				)}
			</div>

			<KPICards data={kpiData} />

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<RecentScans scans={recentScans} />
				</div>
				<div className="space-y-6">
					<FindingsOverview data={findingsData} />
					<ActivityPanel activities={activities} />
				</div>
			</div>
		</div>
	);
}
