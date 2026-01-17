import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SEED_CATEGORY_MAP } from '@/lib/seed/cold-start-plan';
import type { SeedStepResult } from '@/server/types/seeder/cold-start';

export function ColdStartStepRow({ step }: { step: SeedStepResult }) {
    const statusStyles = {
        success: 'text-emerald-600',
        failed: 'text-rose-600',
        skipped: 'text-amber-600',
    } as const;

    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/40 px-3 py-2 text-sm">
            <div>
                <div className="font-medium text-foreground">{SEED_CATEGORY_MAP[step.id].label}</div>
                <div className="text-xs text-muted-foreground">{step.message}</div>
            </div>
            <div className={cn('flex items-center gap-2 text-xs font-semibold', statusStyles[step.status])}>
                {step.status === 'success' ? <CheckCircle2 className="h-4 w-4" /> : null}
                {step.status !== 'success' ? <AlertTriangle className="h-4 w-4" /> : null}
                <span>{step.status.toUpperCase()}</span>
                {step.count !== undefined && step.count > 0 ? (
                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-mono text-foreground">
                        {step.count}
                    </span>
                ) : null}
            </div>
        </div>
    );
}
