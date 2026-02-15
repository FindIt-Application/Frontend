"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/api/endpoints";

type OTPStatus = "idle" | "verifying" | "success" | "error";

function OTPVerificationContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const email = searchParams.get("email") || "";
	const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
	const [status, setStatus] = useState<OTPStatus>("idle");
	const [resendTimer, setResendTimer] = useState(30);
	const [errorMessage, setErrorMessage] = useState("");
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [resendTimer]);

	useEffect(() => {
		inputRefs.current[0]?.focus();
	}, []);

	const handleChange = (index: number, value: string) => {
		const sanitized = value.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
		if (!sanitized && value !== "") return;
		const next = [...otp];
		next[index] = sanitized;
		setOtp(next);
		setStatus("idle");
		setErrorMessage("");
		if (sanitized && index < 7) inputRefs.current[index + 1]?.focus();
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
		if (e.key === "Backspace" && !otp[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		const value = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
		if (!value) return;
		const next = [...otp];
		for (let i = 0; i < value.length && i < 8; i++) next[i] = value[i];
		setOtp(next);
		inputRefs.current[Math.min(value.length, 7)]?.focus();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const otpCode = otp.join("");
		if (otpCode.length !== 8) {
			setStatus("error");
			setErrorMessage("Invalid credentials");
			return;
		}
		setStatus("verifying");
		const res = await auth.verifyOtp({ email, otp: otpCode });
		if (!res.success) {
			setStatus("error");
			setErrorMessage(res.error.message || "Invalid credentials");
			return;
		}
		setStatus("success");
		setTimeout(() => router.push("/dashboard"), 700);
	};

	const handleResend = async () => {
		if (resendTimer > 0) return;
		setResendTimer(30);
		setOtp(["", "", "", "", "", "", "", ""]);
		setStatus("idle");
		setErrorMessage("");
		await auth.resendOtp({ email });
		inputRefs.current[0]?.focus();
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
			<h2 className="text-3xl font-bold text-foreground text-center mb-8 tracking-wide">One Time Token</h2>
			<form onSubmit={handleSubmit}>
				<div className="flex items-center gap-3 mb-6">
					<div className="flex gap-2">
						{[0, 1, 2, 3].map((index) => (
							<input key={index} ref={(el) => { inputRefs.current[index] = el; }} type="text" maxLength={1} value={otp[index]} onChange={(e) => handleChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)} onPaste={index === 0 ? handlePaste : undefined} disabled={status === "verifying" || status === "success"} className={cn("w-12 h-14 text-center text-xl font-medium rounded-lg border-2 transition-all focus:outline-none focus:border-[#ff79c6] border-[#44475a] bg-black text-[#f8f8f2]")} />
						))}
					</div>
					<span className="text-[#ff79c6] text-2xl font-light px-1">—</span>
					<div className="flex gap-2">
						{[4, 5, 6, 7].map((index) => (
							<input key={index} ref={(el) => { inputRefs.current[index] = el; }} type="text" maxLength={1} value={otp[index]} onChange={(e) => handleChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)} disabled={status === "verifying" || status === "success"} className={cn("w-12 h-14 text-center text-xl font-medium rounded-lg border-2 transition-all focus:outline-none focus:border-[#ff79c6] border-[#44475a] bg-black text-[#f8f8f2]")} />
						))}
					</div>
				</div>

				{errorMessage && <p className="text-[#ff5555] text-sm text-center mb-4">{errorMessage}</p>}
				{status === "success" && <p className="text-[#50fa7b] text-sm text-center mb-4">Verified! Redirecting...</p>}

				<button className="group/btn relative block h-12 w-full rounded-xl font-medium text-[#f8f8f2] bg-[#282a36] hover:bg-[#44475a] border border-[#44475a] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" type="submit" disabled={status === "verifying" || status === "success" || otp.join("").length !== 8}>
					{status === "verifying" ? "Verifying..." : status === "success" ? "Success!" : "Verify"}
				</button>

				<div className="mt-6 text-center">
					<p className="text-sm text-[#6272a4]">Didn't receive the code? {resendTimer > 0 ? <span className="text-[#44475a]">Resend in {resendTimer}s</span> : <button type="button" onClick={handleResend} className="text-[#ff79c6] hover:text-[#ff79c6]/80 font-medium transition-colors">Resend OTP</button>}</p>
				</div>

				<p className="mt-6 text-center text-sm"><Link href="/login" className="text-[#8be9fd] hover:text-[#8be9fd]/80 transition-colors">&larr; Back to Login</Link></p>
			</form>
		</div>
	);
}

export default function VerifyOTPPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">Loading...</div>}>
			<OTPVerificationContent />
		</Suspense>
	);
}
