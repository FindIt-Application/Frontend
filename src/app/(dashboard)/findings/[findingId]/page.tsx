"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
	FindingDetailTabs,
	OverviewTab,
	RedTeamTab,
	BlueTeamTab,
	ExecutiveSummaryTab,
} from "@/components/findings";
import type { FindingTabId } from "@/components/findings";
import { LocalErrorBoundary } from "@/components/error";
import { findings } from "@/lib/api/endpoints";
import type { Finding, AIFinding, FeatureFlags } from "@/types";

interface FindingDetailPageProps {
	params: Promise<{ findingId: string }>;
}

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

export default function FindingDetailPage({ params }: FindingDetailPageProps) {
	const [findingId, setFindingId] = useState<string>("");
	const [activeTab, setActiveTab] = useState<FindingTabId>("overview");
	const [features] = useState<FeatureFlags>(PLACEHOLDER_FEATURES);

	// Finding state - will come from API
	const [finding, setFinding] = useState<Finding | AIFinding | null>(null);
	const [loading, setLoading] = useState(true);

	// Resolve params
	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			const p = await params;
			if (cancelled) return;
			setFindingId(p.findingId);

			const res = await findings.get(p.findingId);
			if (cancelled) return;

			if (!res.success) {
				setFinding(null);
				setLoading(false);
				return;
			}

			const payload = res.data as unknown;
			const raw =
				typeof payload === "object" && payload !== null
					? (payload as Record<string, unknown>)
					: {};

			setFinding({
				id: String(raw.id || p.findingId),
				scanId: String(raw.scanId || ""),
				title: String(raw.asset || "Finding"),
				description: "Finding details from scan service",
				severity: "MEDIUM",
				category: "CONFIGURATION",
				source: String(raw.workerType || "TECH") as Finding["source"],
				asset: String(raw.asset || "unknown"),
				createdAt: String(raw.createdAt || new Date().toISOString()),
			});
			setLoading(false);
		};

		load().catch(() => {
			if (cancelled) return;
			setFinding(null);
			setLoading(false);
		});

		return () => {
			cancelled = true;
		};
	}, [params]);

	// Check if this is an AI finding
	const isAIFinding = finding && "aiAnalysis" in finding;
	const aiFinding = isAIFinding ? (finding as AIFinding) : null;
	const hasAIData = !!aiFinding?.aiAnalysis;

	if (loading) {
		return (
			<div className="p-6 space-y-6 min-h-screen bg-black">
				<div className="animate-pulse space-y-6">
					<div className="h-4 bg-zinc-800 rounded w-32" />
					<div className="h-32 bg-zinc-800 rounded-xl" />
					<div className="h-12 bg-zinc-800 rounded-lg w-96" />
					<div className="h-64 bg-zinc-800 rounded-xl" />
				</div>
			</div>
		);
	}

	if (!finding) {
		return (
			<div className="p-6 min-h-screen bg-black">
				<div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
					<h2 className="text-lg font-medium text-zinc-300">
						Finding not found
					</h2>
					<p className="text-zinc-500 mt-2">
						The requested finding could not be loaded
					</p>
					<Link
						href="/findings"
						className="inline-flex items-center gap-2 mt-4 text-violet-400 hover:text-violet-300"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Findings
					</Link>
				</div>
			</div>
		);
	}

	const renderTabContent = () => {
		switch (activeTab) {
			case "overview":
				return <OverviewTab finding={finding} />;
			case "red-team":
				return <RedTeamTab finding={aiFinding} />;
			case "blue-team":
				return <BlueTeamTab finding={aiFinding} />;
			case "executive":
				return <ExecutiveSummaryTab finding={aiFinding} />;
			default:
				return null;
		}
	};

	return (
		<div className="p-6 space-y-6 min-h-screen bg-black">
			{/* Back Link */}
			<Link
				href="/findings"
				className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
			>
				<ArrowLeft className="w-4 h-4" />
				Back to Findings
			</Link>

			{/* Tabs */}
			<FindingDetailTabs
				activeTab={activeTab}
				onTabChange={setActiveTab}
				hasAIData={hasAIData}
				features={features}
			/>

			{/* Tab Content */}
			<LocalErrorBoundary sectionName={`${activeTab} Tab`}>
				{renderTabContent()}
			</LocalErrorBoundary>
		</div>
	);
}
