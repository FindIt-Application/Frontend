import { SubscriptionAccess } from "./accessEngine";
import { parsePlan, Plan } from "./plan";

export interface ScanLimitState {
	plan: Plan;
	maxScans: number | "UNLIMITED";
	scanCount: number;
	remainingScans: number | "UNLIMITED";
	isLimitReached: boolean;
	canStartScan: boolean;
}

export function resolveScanLimitState(
	plan: Plan | string | null | undefined,
	scanCount: number | null | undefined,
	isScanCountLoading: boolean,
): ScanLimitState {
	const resolvedPlan = parsePlan(plan);
	const access = new SubscriptionAccess(resolvedPlan);
	const maxScans = access.maxScans();
	const safeScanCount = Number.isFinite(scanCount) ? Math.max(0, scanCount ?? 0) : 0;

	if (maxScans === "UNLIMITED") {
		return {
			plan: resolvedPlan,
			maxScans,
			scanCount: safeScanCount,
			remainingScans: "UNLIMITED",
			isLimitReached: false,
			canStartScan: !isScanCountLoading,
		};
	}

	const remaining = Math.max(0, maxScans - safeScanCount);
	const isLimitReached = !isScanCountLoading && safeScanCount >= maxScans;

	return {
		plan: resolvedPlan,
		maxScans,
		scanCount: safeScanCount,
		remainingScans: remaining,
		isLimitReached,
		canStartScan: !isScanCountLoading && !isLimitReached,
	};
}
