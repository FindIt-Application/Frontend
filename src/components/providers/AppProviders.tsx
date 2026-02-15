"use client";

import React from "react";
import { SubscriptionProvider } from "@/context/subscription/SubscriptionContext";
import { AuthProvider } from "@/hooks/useAuth";

export function AppProviders({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<SubscriptionProvider>{children}</SubscriptionProvider>
		</AuthProvider>
	);
}
