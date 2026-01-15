import { ShieldCheck, TrendingUp, Activity, AlertTriangle } from 'lucide-react';

import { ThemeBadge } from '@/components/theme/primitives/interactive';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';

export function ModernAdminDashboardHeader() {
    return (
        <div className="relative z-10 mb-8">
            <div className="flex flex-col gap-6 rounded-3xl border border-border/40 bg-gradient-to-br from-card/40 to-primary/5 p-6 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Global Admin</p>
                        <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-500">System Healthy</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                        Control Center
                    </h1>
                    <p className="max-w-xl text-sm text-muted-foreground">
                        Real-time oversight of governance, security, and tenant health with action-ready insights.
                    </p>
                    
                    {/* Stats Summary */}
                    <div className="flex gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <TrendingUp className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Active Users</p>
                                <p className="font-semibold">1,248</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-accent/10">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Alerts</p>
                                <p className="font-semibold">3</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-3">
                    <div className="flex justify-end">
                        <ThemeSwitcher />
                    </div>
                    <div className="flex justify-end">
                        <ThemeBadge variant="glow" size="lg" className="flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Super Admin</span>
                        </ThemeBadge>
                    </div>
                </div>
            </div>
        </div>
    );
}