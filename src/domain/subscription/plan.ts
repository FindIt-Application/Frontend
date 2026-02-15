export enum Plan {
	FREE = "FREE",
	PRO = "PRO",
	ENTERPRISE = "ENTERPRISE",
}

export const PLAN_ORDER: Record<Plan, number> = {
	[Plan.FREE]: 0,
	[Plan.PRO]: 1,
	[Plan.ENTERPRISE]: 2,
};

export function parsePlan(value: unknown): Plan {
	if (typeof value !== "string") {
		return Plan.FREE;
	}

	const normalized = value.trim().toUpperCase();
	if (normalized === Plan.PRO) {
		return Plan.PRO;
	}
	if (normalized === Plan.ENTERPRISE) {
		return Plan.ENTERPRISE;
	}
	return Plan.FREE;
}

export function getPlanLabel(plan: Plan): string {
	return plan.toLowerCase().replace(/^./, (value) => value.toUpperCase());
}

export function isPlanAtLeast(plan: Plan, required: Plan): boolean {
	return PLAN_ORDER[plan] >= PLAN_ORDER[required];
}
