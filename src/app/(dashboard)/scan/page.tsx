"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Radar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
	TargetInput,
	ScanTemplates,
	ScanModules,
	WordlistUpload,
	ScanPreview,
	ScanQuota,
	StartScanButton,
	getTemplateModules,
} from "@/components/scan/ScanCreate";
import type { ScanTemplate, WordlistFile } from "@/components/scan/ScanCreate";
import type { ScanModule } from "@/types/subscription";
import { LocalErrorBoundary } from "@/components/error";
import { usePermissions } from "@/hooks/usePermissions";
import { Plan } from "@/domain/subscription";
import { useSubscriptionContext } from "@/context/subscription/SubscriptionContext";
import { api } from "@/lib/api/client";

export default function ScanPage() {
	const router = useRouter();
	const {
		canUseModule,
		isScanLimitReached,
		plan,
		isLoading: permissionsLoading,
		scanCount,
	} = usePermissions();
	const { setScanCount } = useSubscriptionContext();

	// Form state
	const [target, setTarget] = useState("");
	const [targetValid, setTargetValid] = useState(false);
	const [template, setTemplate] = useState<ScanTemplate>("quick");
	const [selectedModules, setSelectedModules] = useState<ScanModule[]>([]);
	const [wordlist, setWordlist] = useState<WordlistFile | null>(null);
	const [loading, setLoading] = useState(false);

	// AI enabled check (based on selected modules)
	const aiEnabled = selectedModules.includes("vulnerability_scan");

	// Update modules when template changes
	useEffect(() => {
		if (template === "custom") {
			// Keep current selection for custom
			return;
		}
		const templateModules = getTemplateModules(template);
		// Filter to only include modules the user can access
		const accessibleModules = templateModules.filter((mod) =>
			canUseModule(mod),
		);
		setSelectedModules(accessibleModules);
	}, [template, canUseModule]);

	// Validation
	const isValidConfig = targetValid && selectedModules.length > 0;

	// Handle template change
	const handleTemplateChange = useCallback((newTemplate: ScanTemplate) => {
		setTemplate(newTemplate);
	}, []);

	// Handle modules change
	const handleModulesChange = useCallback(
		(modules: ScanModule[]) => {
			setSelectedModules(modules);
			// If user modifies modules, switch to custom template
			if (template !== "custom") {
				const templateModules = getTemplateModules(template);
				const isSame =
					modules.length === templateModules.length &&
					modules.every((m) => templateModules.includes(m));
				if (!isSame) {
					setTemplate("custom");
				}
			}
		},
		[template],
	);

	// Handle scan start
	const handleStartScan = useCallback(async () => {
		if (!isValidConfig || permissionsLoading || isScanLimitReached) return;

		setLoading(true);

		try {
			if (isScanLimitReached) {
				setLoading(false);
				return;
			}

			const scanType = template === "full" ? "full" : "quick";

			const has = (module: ScanModule) => selectedModules.includes(module);

			const payload = {
				target,
				type: scanType,
				modules: {
					subdomain: has("subdomain_enum"),
					header: has("dns_records") || has("whois"),
					portScan: has("port_scan"),
					dirBrute: has("directory_bruteforce"),
					tls: has("certificate"),
					cloud: has("cloud_enum"),
					vuln: has("vulnerability_scan") || aiEnabled,
				},
			};

			const response = await api.post<{ success: boolean; data?: { scanId?: string } }>(
				"/scans",
				payload,
			);

			if (!response.success || !response.data?.data?.scanId) {
				throw new Error(response.success ? "Failed to start scan" : response.error.message);
			}

			if (plan === Plan.FREE) {
				setScanCount(scanCount + 1);
			}

			// Navigate to scan results page
			router.push(`/scan/${response.data.data.scanId}`);
		} catch (error) {
			console.error("Scan start error:", error);
			// Error handling via error banner would go here
		} finally {
			setLoading(false);
		}
	}, [
		isValidConfig,
		permissionsLoading,
		isScanLimitReached,
		target,
		selectedModules,
		template,
		wordlist,
		aiEnabled,
		plan,
		scanCount,
		setScanCount,
		router,
	]);

	return (
		<div className="p-4 sm:p-6 space-y-6 min-h-screen bg-black">
			{plan === Plan.FREE && isScanLimitReached && (
				<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
					<p className="text-sm font-medium text-amber-300">
						Free plan scan limit reached
					</p>
					<p className="mt-1 text-xs text-amber-200/80">
						You have used your 3 total scans. Upgrade to Pro for
						unlimited scans.
					</p>
					<Link
						href="/pricing"
						className="mt-2 inline-block text-sm font-medium text-amber-200 underline decoration-amber-300/60 underline-offset-4"
					>
						View upgrade options
					</Link>
				</div>
			)}

			{/* Back Link */}
			<Link
				href="/dashboard"
				className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
			>
				<ArrowLeft className="w-4 h-4" />
				Back to Dashboard
			</Link>

			{/* Header */}
			<div className="flex items-center gap-4">
				<div className="p-3 rounded-xl bg-gradient-to-br from-[#FF79C6]/20 to-[#ff99cc]/20 border border-[#FF79C6]/30">
					<Radar className="h-6 w-6 text-[#FF79C6]" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-zinc-100">
						New Scan
					</h1>
					<p className="text-sm text-zinc-500">
						Configure and start a security scan
					</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column - Form */}
				<div className="lg:col-span-2 space-y-6">
					{/* Target Input */}
					<LocalErrorBoundary sectionName="Target Input">
						<div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
							<TargetInput
								value={target}
								onChange={setTarget}
								onValidationChange={setTargetValid}
							/>
						</div>
					</LocalErrorBoundary>

					{/* Scan Templates */}
					<LocalErrorBoundary sectionName="Scan Templates">
						<div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
							<ScanTemplates
								selected={template}
								onChange={handleTemplateChange}
							/>
						</div>
					</LocalErrorBoundary>

					{/* Scan Modules */}
					<LocalErrorBoundary sectionName="Scan Modules">
						<div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
							<ScanModules
								selectedModules={selectedModules}
								onChange={handleModulesChange}
								disabled={loading}
							/>
						</div>
					</LocalErrorBoundary>

					{/* Custom Wordlist */}
					<LocalErrorBoundary sectionName="Wordlist Upload">
						<div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
							<WordlistUpload
								file={wordlist}
								onFileChange={setWordlist}
							/>
						</div>
					</LocalErrorBoundary>
				</div>

				{/* Right Column - Preview & Actions */}
				<div className="space-y-6">
					{/* Quota */}
					<LocalErrorBoundary sectionName="Scan Quota">
						<ScanQuota />
					</LocalErrorBoundary>

					{/* Preview */}
					<LocalErrorBoundary sectionName="Scan Preview">
						<div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
							<ScanPreview
								target={target}
								template={template}
								selectedModules={selectedModules}
								wordlist={wordlist}
								aiEnabled={aiEnabled}
							/>
						</div>
					</LocalErrorBoundary>

					{/* Start Button */}
					<LocalErrorBoundary sectionName="Start Scan">
						<StartScanButton
							disabled={
								!isValidConfig || permissionsLoading || isScanLimitReached
							}
							loading={loading}
							onClick={handleStartScan}
							lockReason={
								plan === Plan.FREE && isScanLimitReached
									? "Upgrade to Pro for unlimited scans"
									: undefined
							}
						/>
					</LocalErrorBoundary>

					{/* Validation Helper */}
					{!isValidConfig && target && (
						<p className="text-xs text-zinc-500 text-center">
							{!targetValid
								? "Enter a valid target"
								: selectedModules.length === 0
									? "Select at least one module"
									: "Complete configuration to start scan"}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
