"use client";

import React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { parsePlan, Plan } from "@/domain/subscription";
import { isDemoMode } from "@/lib/demo";
import { billing } from "@/lib/api/endpoints";

const PLAN_STORAGE_KEY = "findit_subscription_plan";
const SCAN_COUNT_STORAGE_KEY = "findit_scan_count";

interface SubscriptionState {
	plan: Plan;
	isLoading: boolean;
	scanCount: number;
	isScanCountLoading: boolean;
}

interface SubscriptionContextValue extends SubscriptionState {
	setPlan: (plan: Plan) => void;
	setScanCount: (count: number) => void;
	refresh: () => void;
}

const INITIAL_STATE: SubscriptionState = {
	plan: Plan.FREE,
	isLoading: true,
	scanCount: 0,
	isScanCountLoading: true,
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function readPlanFromStorage(): Plan {
	if (typeof window === "undefined") {
		return Plan.FREE;
	}

	if (isDemoMode()) {
		return Plan.PRO;
	}

	return parsePlan(window.localStorage.getItem(PLAN_STORAGE_KEY));
}

function readScanCountFromStorage(): number {
	if (typeof window === "undefined") {
		return 0;
	}

	const stored = window.localStorage.getItem(SCAN_COUNT_STORAGE_KEY);
	const value = Number(stored);
	if (!Number.isFinite(value) || value < 0) {
		return 0;
	}
	return value;
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<SubscriptionState>(INITIAL_STATE);
	const fetchedRef = useRef(false);

	// Hydrate immediately from localStorage for instant UI.
	const hydrate = useCallback(() => {
		const nextPlan = readPlanFromStorage();
		const nextScanCount = readScanCountFromStorage();

		if (typeof window !== "undefined") {
			window.localStorage.setItem(PLAN_STORAGE_KEY, nextPlan);
		}

		setState({
			plan: nextPlan,
			isLoading: false,
			scanCount: nextScanCount,
			isScanCountLoading: false,
		});
	}, []);

	// Fetch from server and update both state and localStorage.
	const fetchFromServer = useCallback(async () => {
		try {
			const result = await billing.getStatus();
			if (result.success && result.data) {
				// The server returns plan as uppercase (FREE/PRO/ENTERPRISE).
				const serverPlan = parsePlan(result.data.plan);

				if (typeof window !== "undefined") {
					window.localStorage.setItem(PLAN_STORAGE_KEY, serverPlan);
				}

				setState((prev) => ({
					...prev,
					plan: serverPlan,
					isLoading: false,
				}));
			}
		} catch {
			// Server unreachable — keep localStorage value.
			setState((prev) => ({ ...prev, isLoading: false }));
		}
	}, []);

	useEffect(() => {
		// Step 1: Instant hydration from localStorage.
		hydrate();

		// Step 2: Sync from server (single fetch on mount).
		if (!fetchedRef.current) {
			fetchedRef.current = true;
			fetchFromServer();
		}

		// Step 3: Listen for cross-tab localStorage changes.
		const onStorage = (event: StorageEvent) => {
			if (
				event.key === PLAN_STORAGE_KEY ||
				event.key === SCAN_COUNT_STORAGE_KEY
			) {
				hydrate();
			}
		};

		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [hydrate, fetchFromServer]);

	const setPlan = useCallback((plan: Plan) => {
		if (typeof window !== "undefined") {
			window.localStorage.setItem(PLAN_STORAGE_KEY, plan);
		}

		setState((prev) => ({ ...prev, plan, isLoading: false }));
	}, []);

	const setScanCount = useCallback((count: number) => {
		const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;
		if (typeof window !== "undefined") {
			window.localStorage.setItem(SCAN_COUNT_STORAGE_KEY, String(safeCount));
		}

		setState((prev) => ({
			...prev,
			scanCount: safeCount,
			isScanCountLoading: false,
		}));
	}, []);

	// refresh() re-fetches from server — use after Razorpay checkout success.
	const refresh = useCallback(() => {
		fetchFromServer();
	}, [fetchFromServer]);

	const value = useMemo<SubscriptionContextValue>(
		() => ({
			...state,
			setPlan,
			setScanCount,
			refresh,
		}),
		[state, setPlan, setScanCount, refresh],
	);

	return (
		<SubscriptionContext.Provider value={value}>
			{children}
		</SubscriptionContext.Provider>
	);
}

export function useSubscriptionContext(): SubscriptionContextValue {
	const context = useContext(SubscriptionContext);
	if (context) {
		return context;
	}

	return {
		...INITIAL_STATE,
		setPlan: () => undefined,
		setScanCount: () => undefined,
		refresh: () => undefined,
	};
}
