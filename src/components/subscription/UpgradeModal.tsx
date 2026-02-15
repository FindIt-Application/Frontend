"use client";

import React from "react";
import { X, Check } from "lucide-react";
import { Feature, getPlanLabel, Plan } from "@/domain/subscription";

interface UpgradeModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentPlan: Plan;
	requiredPlan: Plan;
	feature?: Feature;
	onUpgradeClick?: () => void;
}

const PLAN_BENEFITS: Record<Plan, string[]> = {
	[Plan.FREE]: [
		"Subdomain Enumeration",
		"Header Analysis",
		"Technology Detection",
		"Up to 3 total scans",
	],
	[Plan.PRO]: [
		"Everything in Free",
		"Port, TLS, Cloud, Directory, Vulnerability scanning",
		"Unlimited scans",
	],
	[Plan.ENTERPRISE]: [
		"Everything in Pro",
		"Team collaboration",
		"Shared scan access and multi-user workflows",
	],
};

const PLAN_ORDER: Plan[] = [Plan.FREE, Plan.PRO, Plan.ENTERPRISE];

export function UpgradeModal({
	isOpen,
	onClose,
	currentPlan,
	requiredPlan,
	feature,
	onUpgradeClick,
}: UpgradeModalProps) {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Upgrade subscription"
				className="w-full max-w-3xl rounded-2xl border border-zinc-700 bg-zinc-950"
			>
				<div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
					<div>
						<p className="text-sm text-zinc-400">Subscription Upgrade</p>
						<h2 className="text-lg font-semibold text-zinc-100">
							Upgrade to {getPlanLabel(requiredPlan)}
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
						aria-label="Close upgrade modal"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="space-y-4 px-6 py-5">
					<p className="text-sm text-zinc-300">
						Current plan: {getPlanLabel(currentPlan)}
						{feature ? " . This feature requires a higher tier." : ""}
					</p>

					<div className="grid gap-3 md:grid-cols-3">
						{PLAN_ORDER.map((plan) => (
							<div
								key={plan}
								className={`rounded-xl border p-4 ${
									plan === requiredPlan
										? "border-emerald-400/50 bg-emerald-500/10"
										: "border-zinc-800 bg-zinc-900/60"
								}`}
							>
								<p className="mb-2 text-sm font-semibold text-zinc-100">
									{getPlanLabel(plan)}
								</p>
								<ul className="space-y-1.5 text-xs text-zinc-300">
									{PLAN_BENEFITS[plan].map((item) => (
										<li key={item} className="flex items-start gap-2">
											<Check className="mt-0.5 h-3.5 w-3.5 text-emerald-400" />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				<div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
					>
						Not now
					</button>
					<button
						type="button"
						onClick={onUpgradeClick}
						className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
					>
						Upgrade Plan
					</button>
				</div>
			</div>
		</div>
	);
}
