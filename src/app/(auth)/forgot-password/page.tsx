"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/GradientButton";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/api/endpoints";

export default function ForgotPasswordPage() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		await auth.forgotPassword({
			first_name: firstName,
			last_name: lastName,
			email,
		});
		setIsLoading(false);
		setIsSubmitted(true);
	};

	if (isSubmitted) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="shadow-input mx-auto w-full max-w-md rounded-none md:rounded-2xl p-4 md:p-8 bg-card text-center">
					<h2 className="text-2xl font-bold text-foreground">
						Check Your Email
					</h2>
					<p className="text-muted-foreground mt-4">
						If your details are valid, password reset instructions
						were sent.
					</p>
					<p className="text-[#8be9fd] font-medium mt-1">{email}</p>
					<Link
						href="/login"
						className="mt-8 inline-block text-sm text-[#8be9fd] hover:text-[#8be9fd]/80 font-medium transition-colors"
					>
						&larr; Back to Login
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="shadow-input mx-auto w-full max-w-md rounded-none md:rounded-2xl p-4 md:p-8 bg-card">
				<h2 className="text-3xl font-bold text-foreground text-center">
					Forgot Password?
				</h2>
				<p className="text-sm text-muted-foreground text-center mt-2">
					Enter first name, last name, and email.
				</p>
				<form className="my-8" onSubmit={handleSubmit}>
					<div className="grid grid-cols-2 gap-3 mb-4">
						<LabelInputContainer>
							<Label
								htmlFor="first_name"
								className="text-lg font-medium"
							>
								First Name
							</Label>
							<Input
								id="first_name"
								type="text"
								placeholder="Admin"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								className="text-foreground h-12 text-lg"
								required
							/>
						</LabelInputContainer>
						<LabelInputContainer>
							<Label
								htmlFor="last_name"
								className="text-lg font-medium"
							>
								Last Name
							</Label>
							<Input
								id="last_name"
								type="text"
								placeholder="FindIt"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								className="text-foreground h-12 text-lg"
								required
							/>
						</LabelInputContainer>
					</div>
					<LabelInputContainer className="mb-8">
						<Label htmlFor="email" className="text-lg font-medium">
							Email Address
						</Label>
						<Input
							id="email"
							placeholder="admin@findit.sec"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="text-foreground h-12 text-lg"
							required
						/>
					</LabelInputContainer>
					<GradientButton
						type="submit"
						disabled={isLoading}
						className="h-12"
					>
						{isLoading ? (
							<span className="flex items-center justify-center gap-2">
								<Loader2 className="animate-spin h-5 w-5" />
								Sending...
							</span>
						) : (
							<>Send Reset Link</>
						)}
					</GradientButton>
					<p className="mt-6 text-center text-sm text-muted-foreground">
						Remember your password?{" "}
						<Link
							href="/login"
							className="text-[#ff79c6] hover:text-[#ff79c6]/80 font-medium transition-colors"
						>
							Back to Login
						</Link>
					</p>
				</form>
			</div>
		</div>
	);
}

function LabelInputContainer({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex w-full flex-col space-y-2", className)}>
			{children}
		</div>
	);
}
