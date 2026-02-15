"use client";

import React from "react";
import { LockKeyhole } from "lucide-react";
import { useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import {
	Feature,
	FeatureRequiredPlan,
	getPlanLabel,
	getUpgradeMessageForFeature,
} from "@/domain/subscription";
import { cn } from "@/lib/utils";

interface FeatureGateProps {
	feature: Feature;
	children: React.ReactNode;
	className?: string;
	lockedLabel?: string;
}

export function FeatureGate({
	feature,
	children,
	className,
	lockedLabel,
}: FeatureGateProps) {
	const { hasFeature } = usePermissions();
	const allowed = hasFeature(feature);

	const tooltipMessage = useMemo(() => {
		if (lockedLabel) {
			return lockedLabel;
		}
		return getUpgradeMessageForFeature(feature);
	}, [feature, lockedLabel]);

	if (allowed) {
		return <>{children}</>;
	}

	const requiredPlan = FeatureRequiredPlan[feature];

	return (
		<div
			className={cn("relative", className)}
			aria-disabled="true"
			onClickCapture={(event) => {
				event.preventDefault();
				event.stopPropagation();
			}}
			onKeyDownCapture={(event) => {
				event.preventDefault();
				event.stopPropagation();
			}}
		>
			<div className="pointer-events-none select-none blur-[1.5px] opacity-65 saturate-50">
				{children}
			</div>

			<div
				className="absolute inset-0 z-10 rounded-xl"
				title={tooltipMessage}
				tabIndex={0}
				onClickCapture={(event) => {
					event.preventDefault();
					event.stopPropagation();
				}}
				onKeyDownCapture={(event) => {
					event.preventDefault();
					event.stopPropagation();
				}}
			>
				<div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-black/70 px-2 py-1 text-[11px] font-medium text-amber-300">
					<LockKeyhole className="h-3 w-3" />
					<span>{getPlanLabel(requiredPlan)}</span>
				</div>

				<div className="absolute inset-x-3 bottom-3 rounded-lg border border-zinc-700 bg-black/70 px-3 py-2 text-center text-xs text-zinc-200">
					{tooltipMessage}
				</div>
			</div>
		</div>
	);
}
