import { Plan } from "@/domain/subscription";

export type PricingCardName = "FREE" | "PRO" | "Enterprise";

export type PricingAction =
	| "login"
	| "dashboard"
	| "checkout_pro"
	| "contact"
	| "none";

export interface PricingCtaState {
	hidden: boolean;
	disabled: boolean;
	label: string;
	action: PricingAction;
}

export function resolvePricingCtaState(
	cardName: PricingCardName,
	isAuthenticated: boolean,
	currentPlan: Plan,
	defaultLabel: string,
): PricingCtaState {
	if (!isAuthenticated) {
		return {
			hidden: false,
			disabled: false,
			label: defaultLabel,
			action: "login",
		};
	}

	if (cardName === "FREE") {
		if (currentPlan === Plan.FREE) {
			return {
				hidden: false,
				disabled: false,
				label: defaultLabel,
				action: "dashboard",
			};
		}
		return {
			hidden: true,
			disabled: true,
			label: defaultLabel,
			action: "none",
		};
	}

	if (cardName === "PRO") {
		if (currentPlan === Plan.FREE) {
			return {
				hidden: false,
				disabled: false,
				label: defaultLabel,
				action: "checkout_pro",
			};
		}

		if (currentPlan === Plan.PRO) {
			return {
				hidden: false,
				disabled: false,
				label: "Extend Plan",
				action: "checkout_pro",
			};
		}

		return {
			hidden: false,
			disabled: true,
			label: "Included in Enterprise",
			action: "none",
		};
	}

	return {
		hidden: false,
		disabled: false,
		label: defaultLabel,
		action: "contact",
	};
}
