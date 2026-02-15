"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionContext } from "@/context/subscription/SubscriptionContext";
import { Plan } from "@/domain/subscription";
import { type PricingCardName } from "@/lib/pricing/planCta";

function isCurrentPlanCard(
	cardName: PricingCardName,
	currentPlan: Plan,
): boolean {
	if (cardName === "FREE") return currentPlan === Plan.FREE;
	if (cardName === "PRO") return currentPlan === Plan.PRO;
	if (cardName === "Enterprise") return currentPlan === Plan.ENTERPRISE;
	return false;
}

import { type BillingPeriod, plans } from "@/lib/data/pricing";

export function PricingSection() {
	const [billingPeriod, setBillingPeriod] =
		useState<BillingPeriod>("monthly");
	const { isAuthenticated } = useAuth();
	const { refresh, plan } = useSubscriptionContext();

	useEffect(() => {
		if (isAuthenticated) {
			refresh();
		}
	}, [isAuthenticated, refresh]);

	return (
		<section className="w-full py-20 bg-black">
			{/* Header */}
			<div className="text-center mb-12">
				<motion.h2
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-3xl md:text-4xl font-bold text-white mb-4"
				>
					Choose your FindIt subscription tier
				</motion.h2>
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: 0.1 }}
					className="text-sm text-gray-400 max-w-2xl mx-auto px-4"
				>
					Free for core reconnaissance, Pro for advanced scanning,
					Enterprise for collaborative security teams.
				</motion.p>

				{/* Billing Toggle */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: 0.2 }}
					className="mt-8 flex items-center justify-center"
				>
					<div className="relative inline-flex items-center bg-[#1a1a1a] rounded-full p-1">
						{/* Animated background indicator */}
						<motion.div
							className="absolute top-1 bottom-1 bg-[#ff79c6] rounded-full"
							initial={false}
							animate={{
								left: billingPeriod === "monthly" ? 4 : "50%",
								right: billingPeriod === "monthly" ? "50%" : 4,
							}}
							transition={{
								type: "spring",
								stiffness: 400,
								damping: 30,
							}}
						/>
						<button
							onClick={() => setBillingPeriod("monthly")}
							className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
								billingPeriod === "monthly"
									? "text-white"
									: "text-gray-400 hover:text-white"
							}`}
						>
							Monthly
						</button>
						<button
							onClick={() => setBillingPeriod("yearly")}
							className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
								billingPeriod === "yearly"
									? "text-white"
									: "text-gray-400 hover:text-white"
							}`}
						>
							Yearly
						</button>
					</div>
				</motion.div>
			</div>

			{/* Divider */}
			<div className="max-w-6xl mx-auto px-4">
				<div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-16" />
			</div>

			{/* Pricing Cards */}
			<div className="max-w-6xl mx-auto px-4">
				<div className="grid md:grid-cols-3 gap-0">
					{plans.map((planItem, index) => {
						const price =
							billingPeriod === "monthly"
								? planItem.monthlyPrice
								: planItem.yearlyPrice;
						const isCurrent =
							isAuthenticated &&
							isCurrentPlanCard(
								planItem.name as PricingCardName,
								plan || Plan.FREE,
							);

						return (
							<motion.div
								key={planItem.name}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: 0.1 * index }}
								className={`relative p-8 ${
									planItem.highlighted
										? "bg-gradient-to-b from-[#1a1a2e] via-[#16162a] to-[#0d0d1a] border-x border-t border-b border-pink-900/30"
										: "bg-[#0a0a0a] border-t border-b border-gray-800/50"
								} ${index === 0 ? "md:rounded-l-xl border-l" : ""} ${
									index === 2
										? "md:rounded-r-xl border-r"
										: ""
								}`}
							>
								{/* Pink glow effect for highlighted card */}
								{planItem.highlighted && (
									<div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 via-purple-200/5 to-transparent rounded-xl pointer-events-none" />
								)}

								<div className="relative z-10 flex flex-col h-full">
									<h3 className="text-lg font-semibold text-white mb-2">
										{planItem.name}
									</h3>
									{isCurrent && (
										<span className="inline-flex w-fit items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300 mb-3">
											Current Plan
										</span>
									)}

									<div className="mb-2 h-12 flex items-center">
										<AnimatePresence mode="wait">
											{price !== null ? (
												<motion.div
													key={`${planItem.name}-${billingPeriod}`}
													initial={{
														opacity: 0,
														y: -10,
													}}
													animate={{
														opacity: 1,
														y: 0,
													}}
													exit={{ opacity: 0, y: 10 }}
													transition={{
														duration: 0.2,
													}}
													className="flex items-baseline"
												>
													<span className="text-4xl font-bold text-white">
														${price}
													</span>
													<span className="text-gray-400 text-lg ml-1">
														/
														{billingPeriod ===
														"monthly"
															? "mo"
															: "yr"}
													</span>
												</motion.div>
											) : (
												<motion.span
													key="contact"
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													className="text-3xl font-bold text-white"
												>
													Contact Us
												</motion.span>
											)}
										</AnimatePresence>
									</div>

									<p className="text-gray-500 text-sm mb-8">
										{planItem.description}
									</p>

									<div className="space-y-4 mb-8 flex-1">
										{planItem.features.map((feature) => (
											<div
												key={feature.label}
												className="flex items-start gap-3"
											>
												<div
													className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
														feature.locked
															? "bg-[#ff79c6]/20"
															: planItem.highlighted
																? "bg-blue-500/20"
																: "bg-gray-700/50"
													}`}
												>
													{feature.locked ? (
														<LockKeyhole className="w-3 h-3 text-[#ff79c6]" />
													) : (
														<Check
															className={`w-3 h-3 ${
																planItem.highlighted
																	? "text-blue-400"
																	: "text-gray-400"
															}`}
														/>
													)}
												</div>
												<span
													className={`text-sm ${
														feature.locked
															? "text-[#ff79c6]/80"
															: "text-gray-300"
													}`}
												>
													{feature.label}
												</span>
											</div>
										))}
									</div>

									<div className="mt-auto" />
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>

			{/* View all plans link */}
			<div className="text-center mt-12">
				<Link
					href="/pricing"
					className="text-[#ff79c6] hover:text-[#ff9bd4] text-sm font-medium transition-colors"
				>
					See full pricing →
				</Link>
			</div>
		</section>
	);
}
