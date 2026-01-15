import { ShieldCheck } from 'lucide-react';

import { ThemeBadge } from '@/components/theme/primitives/interactive';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';

export function AdminDashboardHeader() {
    return (
        <div className="relative z-10 mb-8">
            <div className="flex flex-col gap-6 rounded-3xl border border-border/40 bg-card/40 p-6 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Global Admin</p>
                    <h1 className="text-4xl font-semibold bg-linear-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                        Control Center
                    </h1>
                    <p className="max-w-xl text-sm text-muted-foreground">
                        Real-time oversight of governance, security, and tenant health with action-ready insights.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeSwitcher />
                    <ThemeBadge variant="glow" size="lg">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Super Admin
                    </ThemeBadge>
                </div>
            </div>
        </div>
    );
}
