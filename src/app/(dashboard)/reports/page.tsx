"use client";

import { useEffect, useState } from "react";
import { ReportsList } from "@/components/reports/ReportsList";
import { reports } from "@/lib/api/endpoints";
import { ReportSummary } from "@/types";

export default function ReportsPage() {
	const [reportItems, setReportItems] = useState<ReportSummary[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			const res = await reports.list();
			if (cancelled) return;
			if (!res.success) {
				setError((res.error as { userMessage?: string }).userMessage || res.error.message);
				setReportItems([]);
				return;
			}

			const payload = res.data as unknown;
			const items = Array.isArray(payload)
				? payload
				: (payload as { items?: ReportSummary[] })?.items || [];
			setReportItems(items);
		};

		load().catch((err) => {
			if (cancelled) return;
			setError(err instanceof Error ? err.message : "Failed to load reports");
			setReportItems([]);
		});

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className="p-6 space-y-6 min-h-screen bg-black">
			<div>
				<h1 className="text-2xl font-bold text-zinc-100">Reports</h1>
				<p className="text-zinc-400 mt-1">
					Access and download scan reports for compliance and audits
				</p>
				{error && (
					<p className="text-xs text-amber-400 mt-2">
						Report service response: {error}
					</p>
				)}
			</div>

			<ReportsList reports={reportItems} />
		</div>
	);
}
