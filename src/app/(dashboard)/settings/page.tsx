"use client";

import { Settings, AlertTriangle } from "lucide-react";
import {
	ProfileSection,
	FeatureAccessSection,
	PreferencesSection,
	ApiAccessSection,
} from "@/components/settings";
import { LocalErrorBoundary } from "@/components/error";
import { DemoBanner } from "@/components/demo";
import { isDemoMode } from "@/lib/demo";
import {
	DEMO_USER_PROFILE,
	DEMO_USER_PREFERENCES,
} from "@/lib/demo/data";
import { usePermissions } from "@/hooks/usePermissions";
import {
	Feature,
	FeatureDisplayName,
	FeatureRequiredPlan,
	Plan,
	isPlanAtLeast,
} from "@/domain/subscription";
import type { FeatureFlag } from "@/types/settings";

const SETTINGS_FEATURES: Feature[] = [
	Feature.SUBDOMAIN,
	Feature.HEADER_ANALYSIS,
	Feature.PORT_SCAN,
	Feature.DIR_BRUTE,
	Feature.TLS_ANALYSIS,
	Feature.CLOUD_ENUM,
	Feature.VULN_SCAN,
	Feature.TECH_DETECT,
	Feature.TEAM_COLLAB,
	Feature.UNLIMITED_SCANS,
];

const FEATURE_DESCRIPTIONS: Record<Feature, string> = {
	[Feature.SUBDOMAIN]: "Discover subdomains via DNS and OSINT",
	[Feature.HEADER_ANALYSIS]: "Analyze HTTP security headers",
	[Feature.TECH_DETECT]: "Identify web technologies and frameworks",
	[Feature.PORT_SCAN]: "Identify open ports and exposed services",
	[Feature.DIR_BRUTE]: "Discover hidden paths and files",
	[Feature.TLS_ANALYSIS]: "Validate SSL/TLS configuration",
	[Feature.CLOUD_ENUM]: "Find exposed cloud assets",
	[Feature.VULN_SCAN]: "Detect known vulnerabilities",
	[Feature.TEAM_COLLAB]: "Invite and collaborate with team members",
	[Feature.UNLIMITED_SCANS]: "Run unlimited scan operations",
};

function planTier(plan: Plan): "free" | "pro" | "enterprise" {
	if (plan === Plan.ENTERPRISE) {
		return "enterprise";
	}
	if (plan === Plan.PRO) {
		return "pro";
	}
	return "free";
}

export default function SettingsPage() {
	const isDemo = isDemoMode();
	const { plan } = usePermissions();

	// Use demo data
	const profile = DEMO_USER_PROFILE;
	const preferences = DEMO_USER_PREFERENCES;
	const features: FeatureFlag[] = SETTINGS_FEATURES.map((feature) => {
		const requiredPlan = FeatureRequiredPlan[feature];
		return {
			id: feature,
			name: FeatureDisplayName[feature],
			description: FEATURE_DESCRIPTIONS[feature],
			enabled: isPlanAtLeast(plan, requiredPlan),
			tier: planTier(requiredPlan),
		};
	});

	return (
		<div
			className={`p-4 sm:p-6 space-y-6 min-h-screen bg-black ${isDemo ? "pt-16" : ""}`}
		>
			{/* Demo Banner */}
			<DemoBanner />

			{/* Header */}
			<div className="flex items-center gap-4">
				<div className="p-3 rounded-xl bg-gradient-to-br from-[#FF79C6]/20 to-[#ff99cc]/20 border border-[#FF79C6]/30">
					<Settings className="h-6 w-6 text-[#FF79C6]" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-zinc-100">
						Settings
					</h1>
					<p className="text-sm text-zinc-500">
						Manage your account and preferences
					</p>
				</div>
			</div>

			{/* Demo Mode Warning */}
			{isDemo && (
				<div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
					<AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
					<div>
						<p className="text-sm font-medium text-amber-400">
							Demo Mode Active
						</p>
						<p className="text-xs text-amber-400/70">
							Settings are read-only. Changes will not be saved.
						</p>
					</div>
				</div>
			)}

			{/* Settings Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Profile Section */}
				<LocalErrorBoundary sectionName="Profile">
					<ProfileSection profile={profile} />
				</LocalErrorBoundary>

				{/* Preferences Section */}
				<LocalErrorBoundary sectionName="Preferences">
					<PreferencesSection
						preferences={preferences}
						isDemo={isDemo}
					/>
				</LocalErrorBoundary>

				{/* Feature Access Section - Full Width */}
				<div className="lg:col-span-2">
					<LocalErrorBoundary sectionName="Feature Access">
						<FeatureAccessSection features={features} />
					</LocalErrorBoundary>
				</div>

				{/* API Access Section */}
				<LocalErrorBoundary sectionName="API Access">
					<ApiAccessSection />
				</LocalErrorBoundary>
			</div>
		</div>
	);
}
