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
                "relative flex min-h-screen items-center justify-center px-8 pt-32 text-center"
            )}
        >
            <div className="mx-auto max-w-4xl">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                    The Future of <span className="gradient-text">Organisation Management</span> is Here
                </h1>
                <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">{HERO_SUBTITLE}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        asChild
                        size="lg"
                        className="btn-gradient rounded-full text-lg h-auto py-4 px-8 text-white transition-all duration-300 hover:-translate-y-1"
                    >
                        <Link href="#waitlist">Get Early Access</Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="bg-transparent border-2 border-slate-200 backdrop-blur-md hover:bg-primary/10 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 rounded-full text-lg h-auto py-4 px-8 text-slate-800"
                    >
                        <Link href="#features">Explore Features</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
