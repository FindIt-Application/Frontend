"use client";

import { useCallback, useRef, useState } from "react";
import { billing } from "@/lib/api/endpoints";

declare global {
	interface Window {
		Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
	}
}

interface RazorpayOptions {
	key: string;
	subscription_id: string;
	name: string;
	description: string;
	prefill?: { email?: string };
	theme?: { color?: string };
	handler: (response: RazorpaySuccessResponse) => void;
	modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
	open: () => void;
	close: () => void;
}

interface RazorpaySuccessResponse {
	razorpay_payment_id: string;
	razorpay_subscription_id: string;
	razorpay_signature: string;
}

interface UseRazorpayReturn {
	subscribe: (plan: "pro" | "enterprise") => Promise<void>;
	isLoading: boolean;
	error: string | null;
}

/**
 * Loads the Razorpay checkout.js script once.
 */
function loadRazorpayScript(): Promise<void> {
	return new Promise((resolve, reject) => {
		if (typeof window !== "undefined" && window.Razorpay) {
			resolve();
			return;
		}
		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
		document.head.appendChild(script);
	});
}

/**
 * Hook to handle Razorpay subscription checkout.
 *
 * Flow:
 * 1. Call POST /billing/subscribe to create a Razorpay subscription
 * 2. Open Razorpay Checkout with the subscription_id
 * 3. On success callback, call onSuccess (the webhook is the real truth)
 * 4. On dismiss, call onDismiss
 */
export function useRazorpay(options?: {
	onSuccess?: () => void;
	onDismiss?: () => void;
}): UseRazorpayReturn {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const rzpRef = useRef<RazorpayInstance | null>(null);

	const subscribe = useCallback(
		async (plan: "pro" | "enterprise") => {
			setIsLoading(true);
			setError(null);

			try {
				// 1. Create subscription on backend
				const result = await billing.subscribe({ plan });

				if (!result.success) {
					const msg = result.error?.message ?? "Failed to create subscription";
					setError(msg);
					setIsLoading(false);
					return;
				}

				const { subscription_id, razorpay_key_id, customer_email } =
					result.data;

				// 2. Load Razorpay SDK
				await loadRazorpayScript();

				// 3. Open Checkout
				const rzp = new window.Razorpay({
					key: razorpay_key_id,
					subscription_id,
					name: "FindIt",
					description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
					prefill: { email: customer_email },
					theme: { color: "#ff79c6" },
					handler: () => {
						// Payment succeeded on frontend — but webhook is the real truth.
						// We just notify the caller to refresh billing status.
						setIsLoading(false);
						options?.onSuccess?.();
					},
					modal: {
						ondismiss: () => {
							setIsLoading(false);
							options?.onDismiss?.();
						},
					},
				});

				rzpRef.current = rzp;
				rzp.open();
			} catch (err) {
				const msg =
					err instanceof Error ? err.message : "Checkout failed";
				setError(msg);
				setIsLoading(false);
			}
		},
		[options],
	);

	return { subscribe, isLoading, error };
}
