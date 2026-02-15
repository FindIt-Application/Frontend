"use client";

import { useMemo } from "react";
import { useSubscriptionContext } from "@/context/subscription/SubscriptionContext";
import {
	Feature,
	ModuleFeatureMap,
	SubscriptionAccess,
	TabFeatureMap,
	type ScanTabId,
	resolveScanLimitState,
	getUpgradeMessageForFeature,
	parsePlan,
	Plan,
} from "@/domain/subscription";
import type { ExportFormat, ScanModule } from "@/types/subscription";

interface UsePermissionsReturn {
	plan: Plan;
	isLoading: boolean;
	canScan: boolean;
	canUseModule: (module: ScanModule) => boolean;
	canExport: (format: ExportFormat) => boolean;
	hasApiAccess: boolean;
	hasContinuousMonitoring: boolean;
	remainingScans: number;
	scanCount: number;
	isScanLimitReached: boolean;
	isFeatureLocked: (feature: string) => boolean;
	getUpgradeMessage: (feature: string) => string;
	getDisabledScanTabs: () => ScanTabId[];
	hasFeature: (feature: Feature) => boolean;
}

const ALL_SCAN_TABS: ScanTabId[] = [
	"subdomains",
	"ports",
	"technologies",
	"headers",
	"tls",
	"directories",
	"cloud",
	"vulnerabilities",
];

const LEGACY_FEATURE_MAP: Record<string, Feature | null> = {
	api: Feature.TEAM_COLLAB,
	continuous_monitoring: Feature.TEAM_COLLAB,
	pdf_export: Feature.PORT_SCAN,
	vulnerability_scan: Feature.VULN_SCAN,
	scans: Feature.UNLIMITED_SCANS,
	ports: Feature.PORT_SCAN,
	technologies: Feature.TECH_DETECT,
	tls: Feature.TLS_ANALYSIS,
	directories: Feature.DIR_BRUTE,
	cloud: Feature.CLOUD_ENUM,
	vulnerabilities: Feature.VULN_SCAN,
};

export function usePermissions(): UsePermissionsReturn {
	const subscription = useSubscriptionContext();

	return useMemo(() => {
		const plan = parsePlan(subscription.plan);
		const access = new SubscriptionAccess(plan);
		const scanState = resolveScanLimitState(
			plan,
			subscription.scanCount,
			subscription.isScanCountLoading || subscription.isLoading,
		);

		const canUseModule = (module: ScanModule): boolean => {
			const mappedFeature = ModuleFeatureMap[module];
			if (!mappedFeature) {
				return false;
			}
			return access.has(mappedFeature);
		};

		const getUpgradeMessage = (feature: string): string => {
			const mappedFeature = LEGACY_FEATURE_MAP[feature];
			if (!mappedFeature) {
				return "Upgrade your plan to access this feature";
			}
			return getUpgradeMessageForFeature(mappedFeature);
		};

		return {
			plan,
			isLoading: subscription.isLoading,
			canScan: scanState.canStartScan,
			canUseModule,
			canExport: (_format: ExportFormat): boolean => true,
			hasApiAccess: access.has(Feature.TEAM_COLLAB),
			hasContinuousMonitoring: access.has(Feature.TEAM_COLLAB),
			remainingScans:
				scanState.remainingScans === "UNLIMITED"
					? -1
					: scanState.remainingScans,
			scanCount: scanState.scanCount,
			isScanLimitReached: scanState.isLimitReached,
			isFeatureLocked: (feature: string): boolean => {
				const mappedFeature = LEGACY_FEATURE_MAP[feature];
				if (!mappedFeature) {
					return true;
				}
				return !access.has(mappedFeature);
			},
			getUpgradeMessage,
			getDisabledScanTabs: () => {
				return ALL_SCAN_TABS.filter((tab) => {
					const feature = TabFeatureMap[tab];
					if (!feature) {
						return false;
					}
					return !access.has(feature);
				});
			},
			hasFeature: (feature: Feature) => access.has(feature),
		};
	}, [subscription]);
}

export type { ScanTabId };
