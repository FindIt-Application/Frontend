import { Feature } from "./feature";
import { Plan } from "./plan";

export const AccessMatrix: Record<Plan, Feature[]> = {
	[Plan.FREE]: [Feature.SUBDOMAIN, Feature.HEADER_ANALYSIS, Feature.TECH_DETECT],
	[Plan.PRO]: [
		Feature.SUBDOMAIN,
		Feature.HEADER_ANALYSIS,
		Feature.TECH_DETECT,
		Feature.PORT_SCAN,
		Feature.DIR_BRUTE,
		Feature.TLS_ANALYSIS,
		Feature.CLOUD_ENUM,
		Feature.VULN_SCAN,
		Feature.UNLIMITED_SCANS,
	],
	[Plan.ENTERPRISE]: [
		Feature.SUBDOMAIN,
		Feature.HEADER_ANALYSIS,
		Feature.TECH_DETECT,
		Feature.PORT_SCAN,
		Feature.DIR_BRUTE,
		Feature.TLS_ANALYSIS,
		Feature.CLOUD_ENUM,
		Feature.VULN_SCAN,
		Feature.UNLIMITED_SCANS,
		Feature.TEAM_COLLAB,
	],
};

export const AccessMatrixSet: Record<Plan, ReadonlySet<Feature>> = {
	[Plan.FREE]: new Set(AccessMatrix[Plan.FREE]),
	[Plan.PRO]: new Set(AccessMatrix[Plan.PRO]),
	[Plan.ENTERPRISE]: new Set(AccessMatrix[Plan.ENTERPRISE]),
};
