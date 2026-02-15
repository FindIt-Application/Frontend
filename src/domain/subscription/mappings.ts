import type { ScanModule } from "@/types/subscription";
import { Feature } from "./feature";

export type ScanTabId =
	| "subdomains"
	| "ports"
	| "technologies"
	| "headers"
	| "tls"
	| "directories"
	| "cloud"
	| "vulnerabilities";

export const ModuleFeatureMap: Partial<Record<ScanModule, Feature>> = {
	subdomain_enum: Feature.SUBDOMAIN,
	dns_records: Feature.HEADER_ANALYSIS,
	port_scan: Feature.PORT_SCAN,
	certificate: Feature.TLS_ANALYSIS,
	directory_bruteforce: Feature.DIR_BRUTE,
	cloud_enum: Feature.CLOUD_ENUM,
	vulnerability_scan: Feature.VULN_SCAN,
	tech_detect: Feature.TECH_DETECT,
	whois: Feature.SUBDOMAIN,
};

export const TabFeatureMap: Partial<Record<ScanTabId, Feature>> = {
	ports: Feature.PORT_SCAN,
	technologies: Feature.TECH_DETECT,
	tls: Feature.TLS_ANALYSIS,
	directories: Feature.DIR_BRUTE,
	cloud: Feature.CLOUD_ENUM,
	vulnerabilities: Feature.VULN_SCAN,
};
