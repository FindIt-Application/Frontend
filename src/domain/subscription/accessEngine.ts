import { AccessMatrixSet } from "./accessMatrix";
import { Feature } from "./feature";
import { parsePlan, Plan } from "./plan";

export class SubscriptionAccess {
	private readonly plan: Plan;

	constructor(plan?: Plan | string | null) {
		this.plan = parsePlan(plan);
	}

	has(feature: Feature): boolean {
		const planSet = AccessMatrixSet[this.plan];
		return planSet.has(feature);
	}

	isLimited(feature: Feature): boolean {
		if (feature !== Feature.UNLIMITED_SCANS) {
			return !this.has(feature);
		}

		return !this.has(Feature.UNLIMITED_SCANS);
	}

	maxScans(): number | "UNLIMITED" {
		return this.has(Feature.UNLIMITED_SCANS) ? "UNLIMITED" : 3;
	}

	getPlan(): Plan {
		return this.plan;
	}
}
