"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
	Navbar,
	NavBody,
	NavItems,
	MobileNav,
	MobileNavHeader,
	MobileNavMenu,
	MobileNavToggle,
	NavbarButton,
} from "@/components/ui/resizable-navbar";
import { useAuth } from "@/hooks/useAuth";

export function ResizableNavbar({
	hasBanner = false,
}: {
	hasBanner?: boolean;
}) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const { isAuthenticated, isLoading } = useAuth();

	const navItems = [
		{ name: "Home", link: "/" },
		{ name: "Pricing", link: "/pricing" },
		{ name: "Features", link: "/#features" },
		{ name: "Contact", link: "/#contact" },
	];

	return (
		<Navbar hasBanner={hasBanner}>
			{/* Desktop Navigation */}
			<NavBody>
				{/* Logo */}
				<Link
					href="/"
					className="relative z-20 mr-4 flex items-center gap-2 px-2 py-1 text-sm font-normal"
				>
					<Image
						src="/images/logo.png"
						alt="FindIt logo"
						width={24}
						height={24}
					/>
					<span className="text-sm font-medium text-white">FindIt</span>
				</Link>

				{/* Nav Items */}
				<NavItems items={navItems} />

				{/* Desktop Buttons */}
				<div className="flex items-center gap-4">
					{isLoading ? (
						<NavbarButton href="#" variant="secondary">
							Loading...
						</NavbarButton>
					) : isAuthenticated ? (
						<NavbarButton href="/dashboard" variant="gradient">
							Dashboard
						</NavbarButton>
					) : (
						<>
							<NavbarButton href="/login" variant="secondary">
								Login
							</NavbarButton>
							<NavbarButton href="/register" variant="gradient">
								Get Started
							</NavbarButton>
						</>
					)}
				</div>
			</NavBody>

			{/* Mobile Navigation */}
			<MobileNav>
				<MobileNavHeader>
					{/* Mobile Logo */}
					<Link
						href="/"
						className="relative z-20 flex items-center gap-2 px-2 py-1 text-sm font-normal"
					>
						<Image
							src="/images/logo.png"
							alt="FindIt logo"
							width={24}
							height={24}
						/>
						<span className="text-sm font-medium text-white">FindIt</span>
					</Link>

					{/* Mobile Menu Toggle */}
					<MobileNavToggle
						isOpen={isMobileMenuOpen}
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					/>
				</MobileNavHeader>

				{/* Mobile Menu */}
				<MobileNavMenu
					isOpen={isMobileMenuOpen}
					onClose={() => setIsMobileMenuOpen(false)}
				>
					{navItems.map((item, idx) => (
						<Link
							key={`mobile-link-${idx}`}
							href={item.link}
							className="relative text-neutral-600 dark:text-neutral-300"
							onClick={() => setIsMobileMenuOpen(false)}
						>
							{item.name}
						</Link>
					))}
					<div className="flex w-full flex-col gap-4 mt-4">
						{isLoading ? (
							<NavbarButton href="#" variant="secondary" className="w-full">
								Loading...
							</NavbarButton>
						) : isAuthenticated ? (
							<NavbarButton
								href="/dashboard"
								variant="gradient"
								className="w-full"
							>
								Dashboard
							</NavbarButton>
						) : (
							<>
								<NavbarButton
									href="/login"
									variant="secondary"
									className="w-full"
								>
									Login
								</NavbarButton>
								<NavbarButton
									href="/register"
									variant="gradient"
									className="w-full"
								>
									Get Started
								</NavbarButton>
							</>
						)}
					</div>
				</MobileNavMenu>
			</MobileNav>
		</Navbar>
	);
}
