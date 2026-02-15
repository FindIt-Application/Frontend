import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Feature, Plan } from "@/domain/subscription";
import { SubscriptionProvider } from "@/context/subscription/SubscriptionContext";
import { FeatureGate } from "@/components/subscription";

function TestHarness({
	plan,
	onClick,
}: {
	plan: Plan;
	onClick: () => void;
}) {
	window.localStorage.setItem("findit_subscription_plan", plan);

	return (
		<SubscriptionProvider>
			<FeatureGate feature={Feature.TEAM_COLLAB}>
				<button type="button" onClick={onClick}>
					Invite
				</button>
			</FeatureGate>
		</SubscriptionProvider>
	);
}

describe("FeatureGate", () => {
	it("blocks interaction when feature is locked", async () => {
		const onClick = vi.fn();
		render(<TestHarness plan={Plan.PRO} onClick={onClick} />);

		await waitFor(() => {
			expect(
				screen.getByText("Invite").closest('[aria-disabled="true"]'),
			).not.toBeNull();
		});

		await userEvent.click(screen.getByText("Invite"));
		expect(onClick).not.toHaveBeenCalled();
	});

	it("allows interaction when feature is available", async () => {
		const onClick = vi.fn();
		render(<TestHarness plan={Plan.ENTERPRISE} onClick={onClick} />);

		await userEvent.click(screen.getByRole("button", { name: "Invite" }));
		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
