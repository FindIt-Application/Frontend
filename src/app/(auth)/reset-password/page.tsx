"use client";

import React, { useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/api/endpoints";

function ResetPasswordContent() {
	const router = useRouter();
	const params = useSearchParams();
	const token = params.get("token") ?? "";
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (password !== confirm) {
			setError("Passwords do not match.");
			return;
		}
		if (password.length < 12) {
			setError("Password must be at least 12 characters.");
			return;
		}
		setLoading(true);
		const res = await auth.resetPassword({ token, password });
		setLoading(false);
		if (!res.success) {
			setError(res.error.message || "Invalid credentials");
			return;
		}
		router.push("/login");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background px-4">
			<div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border">
				<h1 className="text-2xl font-bold mb-2">Reset Password</h1>
				<p className="text-sm text-muted-foreground mb-6">Enter a new password for your account.</p>
				<form onSubmit={onSubmit} className="space-y-4">
					<input className="w-full h-11 rounded-lg border border-border bg-background px-3" type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
					<input className="w-full h-11 rounded-lg border border-border bg-background px-3" type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
					{error && <p className="text-sm text-[#ff5555]">{error}</p>}
					<button disabled={loading} className="w-full h-11 rounded-lg bg-[#ff79c6] text-black font-semibold disabled:opacity-70" type="submit">{loading ? "Updating..." : "Update Password"}</button>
				</form>
				<p className="text-sm mt-6">Back to <Link href="/login" className="text-[#ff79c6]">login</Link></p>
			</div>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>}>
			<ResetPasswordContent />
		</Suspense>
	);
}
