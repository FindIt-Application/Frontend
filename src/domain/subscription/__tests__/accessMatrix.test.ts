import { describe, expect, it } from "vitest";
import { AccessMatrix, Feature, Plan } from "@/domain/subscription";

describe("AccessMatrix", () => {
	it("matches free plan permissions", () => {
		expect(AccessMatrix[Plan.FREE]).toEqual([
			Feature.SUBDOMAIN,
			Feature.HEADER_ANALYSIS,
		]);
	});

	it("keeps enterprise superset coverage", () => {
		const enterprise = new Set(AccessMatrix[Plan.ENTERPRISE]);
		for (const feature of AccessMatrix[Plan.PRO]) {
			expect(enterprise.has(feature)).toBe(true);
		}
	});
});
