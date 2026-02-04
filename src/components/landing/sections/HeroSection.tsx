import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { HERO_SUBTITLE } from "@/components/landing/config/landing-content";
import { landingFont } from "@/components/landing/config/landing-typography";

export default function HeroSection() {
    return (
        <section
            className={cn(
                landingFont.className,
                "relative flex min-h-screen items-center justify-center px-8 pt-32 text-center bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900"
            )}
        >
            <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" aria-hidden />
            <div className="mx-auto max-w-4xl relative z-10">
                <h1 className="text-4xl font-extrabold leading-tight text-slate-900 dark:text-white md:text-6xl mb-6 animate-fade-in">
                    The Future of <span className="gradient-text">Organisation Management</span> is Here
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-600 dark:text-slate-300">{HERO_SUBTITLE}</p>
                <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                    <Button
                        asChild
                        size="lg"
                        className="btn-gradient h-auto rounded-full px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/50"
                    >
                        <Link href="#waitlist">Get Early Access</Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="h-auto rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-slate-800 dark:text-slate-200 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/10 dark:hover:bg-primary/20"
                    >
                        <Link href="#features">Explore Features</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
