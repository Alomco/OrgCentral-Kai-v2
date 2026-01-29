"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LANDING_NAV_LINKS } from "@/components/landing/config/landing-content";
import type { NavLinkConfig } from "@/components/landing/config/landing-content";
import { landingFont } from "@/components/landing/config/landing-typography";
import { ThemeToggle } from "@/components/landing/components/ThemeToggle";
import { subscribeGlobalEventListener } from "@/lib/dom/global-event-listeners";

export default function LandingNav() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };

        handleScroll();
        const unsubscribe = subscribeGlobalEventListener({
            key: "window:scroll:landing",
            target: window,
            type: "scroll",
            handler: handleScroll,
            options: { passive: true },
        });
        return () => unsubscribe();
    }, []);

    const scrollToSection = useCallback((target: string) => {
        const elementId = target.startsWith("#") ? target.slice(1) : target;
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    }, []);

    return (
        <header
            className={cn(
                landingFont.className,
                "fixed top-0 [z-index:var(--z-sticky)] w-full border-transparent py-4 transition-all duration-300",
                isScrolled && "border-b border-slate-200/20 bg-white/80 dark:bg-slate-950/90 dark:border-slate-800/50 backdrop-blur-xl shadow-sm dark:shadow-slate-900/50"
            )}
        >
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 md:px-8">
                <Link href="/" className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    <span className="gradient-text">Org</span>Central
                </Link>

                <nav className="hidden md:block" aria-label="Primary">
                    <ul className="flex items-center gap-8 text-base font-medium text-slate-600 dark:text-slate-300">
                        {LANDING_NAV_LINKS.map((link: NavLinkConfig) => (
                            <li key={link.href}>
                                <button
                                    type="button"
                                    onClick={() => scrollToSection(link.href)}
                                    className="relative text-base font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-800 dark:hover:text-white nav-underline"
                                >
                                    {link.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Button
                        asChild
                        className="btn-gradient h-auto rounded-full px-6 py-3 text-base font-semibold text-white"
                    >
                        <Link href="/login">Login</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
