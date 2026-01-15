import Link from 'next/link';
import { Zap } from 'lucide-react';

import { ThemeCard } from '@/components/theme/cards/theme-card';
import { ThemeGrid } from '@/components/theme/layout/primitives';
import { GradientAccent } from '@/components/theme/primitives/surfaces';
import { QUICK_ACTIONS } from '../quick-actions';

export function AdminQuickActionsGrid() {
    return (
        <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick actions
            </h2>
            <ThemeGrid cols={4} gap="md" className="items-stretch">
                {QUICK_ACTIONS.map((action) => (
                    <Link key={action.href} href={action.href} className="h-full">
                        <ThemeCard
                            variant="glass"
                            hover="lift"
                            padding="lg"
                            className="h-full cursor-pointer group border border-border/30"
                        >
                            <div className="flex items-start gap-4">
                                <GradientAccent
                                    variant="vibrant"
                                    rounded="lg"
                                    className="p-3 group-hover:scale-110 transition-transform"
                                >
                                    <action.icon className="h-5 w-5 text-white" />
                                </GradientAccent>
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {action.description}
                                    </p>
                                </div>
                            </div>
                        </ThemeCard>
                    </Link>
                ))}
            </ThemeGrid>
        </div>
    );
}
