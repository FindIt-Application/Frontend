export type BillingPeriod = "monthly" | "yearly";

export interface PricingPlan {
	name: string;
	description: string;
	monthlyPrice: number | null;
	yearlyPrice: number | null;
	features: Array<{ label: string; locked?: boolean }>;
	cta: string;
	highlighted: boolean;
}

export const plans: PricingPlan[] = [
	{
		name: "FREE",
		description: "For individual reconnaissance workflows",
		monthlyPrice: 0,
		yearlyPrice: 0,
		features: [
			{ label: "Subdomain Enumeration" },
			{ label: "Header Analysis" },
			{ label: "Technology Detection" },
			{ label: "Up to 3 total scans" },
			{ label: "Port Scanning", locked: true },
			{ label: "Directory Bruteforcing", locked: true },
			{ label: "TLS Analysis", locked: true },
			{ label: "Cloud Enumeration", locked: true },
			{ label: "Vulnerability Scanning", locked: true },
			{ label: "Team Collaboration", locked: true },
		],
		cta: "Get Started",
		highlighted: false,
	},
	{
		name: "PRO",
		description: "For security teams running continuous scanning",
		monthlyPrice: 20,
		yearlyPrice: 200,
		features: [
			{ label: "Everything in Free" },
			{ label: "Unlimited scans" },
			{ label: "Port scanning" },
			{ label: "Directory bruteforcing" },
			{ label: "TLS analysis" },
			{ label: "Cloud enumeration" },
			{ label: "Vulnerability scanning" },
			{ label: "Team Collaboration", locked: true },
		],
		cta: "Upgrade to Pro",
		highlighted: true,
	},
	{
		name: "Enterprise",
		description: "For organizations with collaborative security operations",
		monthlyPrice: null,
		yearlyPrice: null,
		features: [
			{ label: "Everything in Pro" },
			{ label: "Team collaboration" },
			{ label: "Shared scan access" },
			{ label: "Multi-user collaboration" },
			{ label: "Enterprise onboarding" },
			{ label: "Dedicated support" },
			{ label: "Custom contract and SLA" },
		],
		cta: "Contact Us",
		highlighted: false,
	},
];
