"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Status = "loading" | "success" | "error";

function VerifyEmailContent() {
	const params = useSearchParams();
	const token = params.get("token") || "";
	const [status, setStatus] = useState<Status>("loading");
	const [message, setMessage] = useState("Verifying your email...");

	useEffect(() => {
		let cancelled = false;
		const verify = async () => {
			if (!token) {
				setStatus("error");
				setMessage("Verification token is missing.");
				return;
			}

			try {
				const base = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(/\/$/, "");
				const res = await fetch(`${base}/auth/verify-email?token=${encodeURIComponent(token)}`, {
					method: "GET",
					credentials: "include",
				});

				if (cancelled) return;
				if (!res.ok) {
					setStatus("error");
					setMessage("Verification link is invalid or expired.");
					return;
				}

				setStatus("success");
				setMessage("Email verified successfully. You can now log in.");
			} catch {
				if (cancelled) return;
				setStatus("error");
				setMessage("Unable to verify email right now. Please try again.");
			}
		};

		verify();
		return () => {
			cancelled = true;
		};
	}, [token]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-black p-6">
			<div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
				<h1 className="text-xl font-semibold text-zinc-100">Email Verification</h1>
				<p
					className={`mt-3 text-sm ${
						status === "success"
							? "text-emerald-400"
							: status === "error"
								? "text-red-400"
								: "text-zinc-400"
					}`}
				>
					{message}
				</p>
				<div className="mt-6">
					<Link href="/login" className="text-[#ff79c6] hover:text-[#ff79c6]/80">
						Go to login
					</Link>
				</div>
			</div>
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-black p-6">
					<div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
						<h1 className="text-xl font-semibold text-zinc-100">Email Verification</h1>
						<p className="mt-3 text-sm text-zinc-400">Verifying your email...</p>
					</div>
				</div>
			}
		>
			<VerifyEmailContent />
		</Suspense>
	);
}
