"use client";

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { auth } from "@/lib/api/endpoints";

interface User {
	email: string;
	first_name: string;
	last_name: string;
}

interface AuthContextValue {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	register: (
		firstName: string,
		lastName: string,
		email: string,
		password: string,
	) => Promise<void>;
	refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function extractUser(payload: unknown): User | null {
	if (typeof payload !== "object" || payload === null) {
		return null;
	}
	const obj = payload as Record<string, unknown>;
	const nested =
		typeof obj.data === "object" && obj.data !== null
			? (obj.data as Record<string, unknown>)
			: null;
	const user =
		nested && typeof nested.user === "object" && nested.user !== null
			? (nested.user as Record<string, unknown>)
			: typeof obj.user === "object" && obj.user !== null
				? (obj.user as Record<string, unknown>)
				: null;

	if (!user) {
		return null;
	}

	if (
		typeof user.email !== "string" ||
		typeof user.first_name !== "string" ||
		typeof user.last_name !== "string"
	) {
		return null;
	}

	return {
		email: user.email,
		first_name: user.first_name,
		last_name: user.last_name,
	};
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const refresh = useCallback(async () => {
		const res = await auth.me();
		if (!res.success) {
			setUser(null);
			setIsLoading(false);
			return;
		}

		const nextUser = extractUser(res.data);
		setUser(nextUser);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		refresh().catch(() => {
			setUser(null);
			setIsLoading(false);
		});
	}, [refresh]);

	const login = useCallback(async (email: string, password: string) => {
		const res = await auth.login({ email, password });
		if (!res.success) {
			throw new Error(res.error.message || "Login failed");
		}
	}, []);

	const register = useCallback(
		async (
			firstName: string,
			lastName: string,
			email: string,
			password: string,
		) => {
			const res = await auth.register({
				first_name: firstName,
				last_name: lastName,
				email,
				password,
			});
			if (!res.success) {
				throw new Error(res.error.message || "Registration failed");
			}
		},
		[],
	);

	const logout = useCallback(async () => {
		await auth.logout();
		setUser(null);
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			isLoading,
			isAuthenticated: user !== null,
			login,
			logout,
			register,
			refresh,
		}),
		[user, isLoading, login, logout, register, refresh],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);

	if (!context) {
		return {
			user: null,
			isLoading: true,
			isAuthenticated: false,
			login: async () => {
				throw new Error("AuthProvider not mounted");
			},
			logout: async () => {
				throw new Error("AuthProvider not mounted");
			},
			register: async () => {
				throw new Error("AuthProvider not mounted");
			},
			refresh: async () => {
				throw new Error("AuthProvider not mounted");
			},
		};
	}

	return context;
}

export { AuthContext };
export type { User, AuthContextValue };
