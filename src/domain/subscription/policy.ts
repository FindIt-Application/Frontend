import { Feature } from "./feature";
import { Plan } from "./plan";

export const FeatureRequiredPlan: Record<Feature, Plan> = {
	[Feature.SUBDOMAIN]: Plan.FREE,
	[Feature.HEADER_ANALYSIS]: Plan.FREE,
	[Feature.TECH_DETECT]: Plan.FREE,
	[Feature.PORT_SCAN]: Plan.PRO,
	[Feature.DIR_BRUTE]: Plan.PRO,
	[Feature.TLS_ANALYSIS]: Plan.PRO,
	[Feature.CLOUD_ENUM]: Plan.PRO,
	[Feature.VULN_SCAN]: Plan.PRO,
	[Feature.TEAM_COLLAB]: Plan.ENTERPRISE,
	[Feature.UNLIMITED_SCANS]: Plan.PRO,
};

export const FeatureDisplayName: Record<Feature, string> = {
	[Feature.SUBDOMAIN]: "Subdomain Enumeration",
	[Feature.HEADER_ANALYSIS]: "Header Analysis",
	[Feature.TECH_DETECT]: "Technology Detection",
	[Feature.PORT_SCAN]: "Port Scanning",
	[Feature.DIR_BRUTE]: "Directory Bruteforcing",
	[Feature.TLS_ANALYSIS]: "TLS Analysis",
	[Feature.CLOUD_ENUM]: "Cloud Enumeration",
	[Feature.VULN_SCAN]: "Vulnerability Scanning",
	[Feature.TEAM_COLLAB]: "Team Collaboration",
	[Feature.UNLIMITED_SCANS]: "Unlimited Scans",
};

export function getUpgradeMessageForFeature(feature: Feature): string {
	const required = FeatureRequiredPlan[feature];
	if (required === Plan.ENTERPRISE) {
		return "Upgrade to Enterprise to access this feature";
	}
	if (required === Plan.PRO) {
		return "Upgrade to Pro to access this feature";
	}
	return "This feature is available on your plan";
}
