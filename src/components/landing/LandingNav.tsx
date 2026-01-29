"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LANDING_NAV_LINKS } from "@/components/landing/config/landing-content";
import { landingFont } from "@/components/landing/config/landing-typography";
import type { NavLinkConfig } from "@/components/landing/config/landing-content";
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
                "fixed top-0 w-full [z-index:var(--z-sticky)] py-4 transition-all duration-300",
                isScrolled && "bg-slate-50/95 backdrop-blur-xl border-b border-slate-200/20 shadow-sm"
            )}
        >
            <div className="max-w-6xl mx-auto px-8 flex justify-between items-center">
                <Link href="/" className="text-2xl font-extrabold gradient-text">
                    OrgCentral
                </Link>

                <nav className="hidden md:block" aria-label="Primary">
                    <ul className="flex space-x-8 text-slate-600 font-medium text-base">
                        {LANDING_NAV_LINKS.map((link: NavLinkConfig) => (
                            <li key={link.href}>
                                <button
                                    type="button"
                                    onClick={() => scrollToSection(link.href)}
                                    className="text-slate-600 font-medium text-base hover:text-slate-800 transition-colors relative nav-underline"
                                >
                                    {link.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <Button asChild className="btn-gradient text-white px-6! py-3! h-auto! rounded-full! text-base! font-semibold!">
                    <Link href="/login">Login</Link>
                </Button>
            </div>
        </header>
    );
}
