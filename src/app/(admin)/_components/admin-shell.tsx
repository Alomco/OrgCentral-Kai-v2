/**
 * 🐚 Admin Shell Layout
 * 
 * Reusable wrapper for Admin and Dev layouts providing the "futuristic" aesthetic
 * with FloatingParticles, GradientOrbs, and consistent container structure.
 * 
 * @module app/(admin)/_components/admin-shell
 */

import { type ReactNode } from 'react';
import { FloatingParticles } from '@/components/theme/decorative/particles';
import { GradientOrb } from '@/components/theme/decorative/effects';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';

interface AdminShellProps {
    children: ReactNode;
    navigation: ReactNode;
    orbColor?: 'primary' | 'accent' | 'multi';
    particleCount?: 4 | 6 | 8;
    className?: string;
    /** Whether to show the theme switcher in the shell (default: true) */
    showThemeSwitcher?: boolean;
    /** Optional id for skip-link focus target */
    mainId?: string;
    /** Tab index for the main focus target (default: -1 when mainId is provided) */
    mainTabIndex?: number;
}

export function AdminShell({
    children,
    navigation,
    orbColor = 'primary',
    particleCount = 6,
    className,
    showThemeSwitcher = true,
    mainId,
    mainTabIndex,
}: AdminShellProps) {
    const resolvedTabIndex = typeof mainTabIndex === 'number' ? mainTabIndex : mainId ? -1 : undefined;

    return (
        <div className={cn("relative min-h-screen flex flex-col overflow-hidden bg-background text-foreground transition-colors duration-300", className)}>
            {/* 🌌 Background Decoration */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <FloatingParticles count={particleCount} />
                <GradientOrb position="top-right" color={orbColor} className="opacity-50" />
                <GradientOrb position="bottom-left" color="accent" className="opacity-30" />
            </div>

            {/* 🧭 Navigation Slot (Topbar) */}
            <div className="relative z-20">
                {navigation}

                {/* 🎨 Theme Switcher (Floating if not in nav) */}
                {showThemeSwitcher && (
                    <div className="fixed bottom-24 left-6 z-(--z-toast) animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="rounded-full shadow-lg shadow-primary/10 backdrop-blur-md bg-background/50 border border-border/50">
                            <ThemeSwitcher />
                        </div>
                    </div>
                )}
            </div>

            {/* 📦 Main Content */}
            <main id={mainId} tabIndex={resolvedTabIndex} className="relative z-10 flex-1 flex flex-col">
                {children}
            </main>
        </div>
    );
}
