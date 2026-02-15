import { describe, expect, it } from "vitest";
import { Feature, Plan, SubscriptionAccess } from "@/domain/subscription";

describe("SubscriptionAccess", () => {
	it("defaults to FREE for invalid plans", () => {
		const access = new SubscriptionAccess("unknown-plan");
		expect(access.has(Feature.SUBDOMAIN)).toBe(true);
		expect(access.has(Feature.PORT_SCAN)).toBe(false);
	});

	it("allows pro technical scanning features", () => {
		const access = new SubscriptionAccess(Plan.PRO);
		expect(access.has(Feature.PORT_SCAN)).toBe(true);
		expect(access.has(Feature.DIR_BRUTE)).toBe(true);
		expect(access.has(Feature.CLOUD_ENUM)).toBe(true);
		expect(access.has(Feature.TEAM_COLLAB)).toBe(false);
	});

	it("returns scan limits for each plan", () => {
		expect(new SubscriptionAccess(Plan.FREE).maxScans()).toBe(3);
		expect(new SubscriptionAccess(Plan.PRO).maxScans()).toBe("UNLIMITED");
		expect(new SubscriptionAccess(Plan.ENTERPRISE).maxScans()).toBe(
			"UNLIMITED",
		);
	});
});
