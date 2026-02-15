"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
	Building2,
	Users,
	UserPlus,
	LockKeyhole,
	Check,
	Save,
	UsersRound,
} from "lucide-react";
import { Feature, Plan } from "@/domain/subscription";
import { usePermissions } from "@/hooks/usePermissions";
import { plans } from "@/lib/data/pricing";
import { GradientButton } from "@/components/ui/GradientButton";

export default function TeamPage() {
	const router = useRouter();
	const { plan, hasFeature } = usePermissions();
	const hasTeamCollab = hasFeature(Feature.TEAM_COLLAB);
	const [hasChanges, setHasChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const handleUpgrade = () => {
		router.push("/pricing");
	};

	const handleSaveTeam = async () => {
		if (!hasTeamCollab || !hasChanges) return;

		setIsSaving(true);
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));
		setIsSaving(false);
		setHasChanges(false);
	};

	return (
		<div className="min-h-screen space-y-6 bg-black p-4 sm:p-6">
			{/* Header Card */}
			<div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
				<div className="flex items-center gap-4">
					<div className="p-3 rounded-xl bg-gradient-to-br from-[#FF79C6]/20 to-[#ff99cc]/20 border border-[#FF79C6]/30">
						<Building2 className="h-6 w-6 text-[#FF79C6]" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-zinc-100">
							Team Collaboration
						</h1>
						<p className="text-sm text-zinc-500">
							Shared access for scans, findings, and triage
							workflows
						</p>
					</div>
				</div>

				<div className="mt-4 flex flex-wrap items-center gap-2">
					<span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
						Current Plan: {plan}
					</span>
					{!hasTeamCollab && (
						<span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
							Enterprise required for team collaboration
						</span>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				{/* Main Content */}
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					className="xl:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
				>
					<div className="mb-4 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5 text-[#FF79C6]" />
							<h2 className="text-lg font-semibold text-zinc-100">
								Team Workspace
							</h2>
						</div>
						<span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
							Enterprise
						</span>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						{/* Invite Members Card */}
						<div
							className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 cursor-pointer hover:border-[#FF79C6]/30 transition-colors"
							onClick={() => hasTeamCollab && setHasChanges(true)}
						>
							<p className="text-sm font-medium text-zinc-200">
								Invite Members
							</p>
							<p className="mt-1 text-xs text-zinc-500">
								Add teammates to shared investigations and
								triage.
							</p>
							<button
								type="button"
								disabled={!hasTeamCollab}
								onClick={(e) => {
									e.stopPropagation();
									if (!hasTeamCollab) {
										handleUpgrade();
									} else {
										setHasChanges(true);
									}
								}}
								className={`mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
									hasTeamCollab
										? "bg-[#FF79C6] text-black hover:bg-[#ff99cc]"
										: "cursor-not-allowed border border-zinc-700 bg-zinc-800 text-zinc-500"
								}`}
							>
								<UserPlus className="h-4 w-4" /> Invite Member
							</button>
						</div>

						{/* Shared Scan Access Card */}
						<div
							className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 cursor-pointer hover:border-[#FF79C6]/30 transition-colors"
							onClick={() => hasTeamCollab && setHasChanges(true)}
						>
							<p className="text-sm font-medium text-zinc-200">
								Shared Scan Access
							</p>
							<p className="mt-1 text-xs text-zinc-500">
								Create multi-user workspaces with role-based
								visibility.
							</p>
							<button
								type="button"
								disabled={!hasTeamCollab}
								onClick={(e) => {
									e.stopPropagation();
									if (!hasTeamCollab) {
										handleUpgrade();
									} else {
										setHasChanges(true);
									}
								}}
								className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors border ${
									hasTeamCollab
										? "border-[#FF79C6] text-[#FF79C6] hover:bg-[#FF79C6]/10"
										: "cursor-not-allowed border-zinc-700 text-zinc-500"
								}`}
							>
								Create Team Workspace
							</button>
						</div>
					</div>

					{/* Upgrade Banner */}
					{!hasTeamCollab && (
						<div className="mt-4 rounded-xl px-4 py-3">
							<div className="flex items-center gap-2 text-pink-400">
								<LockKeyhole className="h-4 w-4" />
								<span className="text-sm font-medium">
									Upgrade to Enterprise to enable
									collaboration
								</span>
							</div>
							<GradientButton
								type="button"
								onClick={handleUpgrade}
								className="mt-3 rounded-lgpx-4 py-2 text-sm font-semibold transition-colors"
							>
								Upgrade to Enterprise
							</GradientButton>
						</div>
					)}

					{/* Save Team Settings */}
					{hasTeamCollab && (
						<div className="mt-6 pt-6 border-t border-zinc-800">
							<GradientButton
								onClick={handleSaveTeam}
								disabled={!hasChanges || isSaving}
								title={
									!hasTeamCollab
										? "Enterprise plan required"
										: !hasChanges
											? "No changes to save"
											: undefined
								}
							>
								<span className="flex items-center justify-center gap-2">
									{isSaving ? (
										<>
											<span className="animate-spin">
												⌛
											</span>
											Saving...
										</>
									) : (
										<>
											<Save className="h-4 w-4" />
											Save Team Settings
										</>
									)}
								</span>
							</GradientButton>
						</div>
					)}
				</motion.div>

				{/* Plans Snapshot */}
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.05 }}
					className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
				>
					<p className="mb-4 text-sm font-medium text-zinc-300">
						Plans Snapshot
					</p>
					<div className="space-y-3">
						{plans.map((pricingPlan) => (
							<div
								key={pricingPlan.name}
								className={`rounded-xl border p-3 ${
									pricingPlan.name.toUpperCase() === plan
										? "border-[#FF79C6]/40 bg-[#FF79C6]/10"
										: "border-zinc-800 bg-zinc-900"
								}`}
							>
								<p className="text-sm font-semibold text-zinc-100">
									{pricingPlan.name}
								</p>
								<ul className="mt-2 space-y-1">
									{pricingPlan.features
										.slice(0, 3)
										.map((feature) => (
											<li
												key={`${pricingPlan.name}-${feature.label}`}
												className="flex items-center gap-2 text-xs"
											>
												{feature.locked ? (
													<LockKeyhole className="h-3.5 w-3.5 text-amber-400" />
												) : (
													<Check className="h-3.5 w-3.5 text-emerald-400" />
												)}
												<span className="text-zinc-400">
													{feature.label}
												</span>
											</li>
										))}
								</ul>
							</div>
						))}
					</div>
				</motion.div>
			</div>
		</div>
	);
}
