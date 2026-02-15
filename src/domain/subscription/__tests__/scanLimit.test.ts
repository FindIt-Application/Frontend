import { describe, expect, it } from "vitest";
import { Plan, resolveScanLimitState } from "@/domain/subscription";

describe("resolveScanLimitState", () => {
	it("blocks free users at 3 scans", () => {
		const state = resolveScanLimitState(Plan.FREE, 3, false);
		expect(state.isLimitReached).toBe(true);
		expect(state.canStartScan).toBe(false);
		expect(state.remainingScans).toBe(0);
	});

	it("allows free users below limit", () => {
		const state = resolveScanLimitState(Plan.FREE, 2, false);
		expect(state.isLimitReached).toBe(false);
		expect(state.canStartScan).toBe(true);
		expect(state.remainingScans).toBe(1);
	});

	it("keeps pro users unlimited", () => {
		const state = resolveScanLimitState(Plan.PRO, 500, false);
		expect(state.isLimitReached).toBe(false);
		expect(state.canStartScan).toBe(true);
		expect(state.remainingScans).toBe("UNLIMITED");
	});
});
