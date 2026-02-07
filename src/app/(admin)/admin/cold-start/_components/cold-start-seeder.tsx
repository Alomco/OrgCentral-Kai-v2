'use client';

import { useMemo, useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoButton } from '@/components/ui/info-button';
import { runColdStartSeeder } from '../actions';
import {
    SEED_CATEGORY_DEFINITIONS,
    SEED_CATEGORY_MAP,
} from '@/lib/seed/cold-start-plan';
import { DEMO_DATA_INFO, PLATFORM_ESSENTIALS_INFO, RUN_SEEDER_INFO } from './cold-start-info';
import type {
    ColdStartSeedPlanResponse,
    SeedCategoryId,
    SeedDatasetSize,
} from '@/server/types/seeder/cold-start';
import { ColdStartCategoryRow } from './cold-start-category-row';
import { ColdStartStepRow } from './cold-start-step-row';
import {
    createInitialSelections,
    type SeedSelectionMap,
} from './cold-start-seeder.helpers';

interface ColdStartSeederProps {
    orgId: string;
}

export function ColdStartSeeder({ orgId }: ColdStartSeederProps) {
    const [selections, setSelections] = useState<SeedSelectionMap>(() => createInitialSelections());
    const [result, setResult] = useState<ColdStartSeedPlanResponse | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const platformCategories = useMemo(
        () => SEED_CATEGORY_DEFINITIONS.filter((category) => category.group === 'platform'),
        [],
    );
    const demoCategories = useMemo(
        () => SEED_CATEGORY_DEFINITIONS.filter((category) => category.group === 'demo'),
        [],
    );

    const employeesEnabled = selections.employees.enabled;

    const handleToggle = (id: SeedCategoryId, enabled: boolean) => {
        setSelections((current) => ({
            ...current,
            [id]: {
                ...current[id],
                enabled,
            },
        }));
    };

    const handleDatasetChange = (id: SeedCategoryId, dataset: SeedDatasetSize) => {
        const definition = SEED_CATEGORY_MAP[id];
        setSelections((current) => ({
            ...current,
            [id]: {
                ...current[id],
                dataset,
                count: definition.count ? definition.count.defaults[dataset] : current[id].count,
            },
        }));
    };

    const handleCountChange = (id: SeedCategoryId, value: string) => {
        const definition = SEED_CATEGORY_MAP[id];
        if (!definition.count) {
            return;
        }
        const parsed = Number.parseInt(value, 10);
        const clamped = Number.isNaN(parsed)
            ? definition.count.defaults[selections[id].dataset]
            : Math.min(Math.max(parsed, definition.count.min), definition.count.max);
        setSelections((current) => ({
            ...current,
            [id]: {
                ...current[id],
                count: clamped,
            },
        }));
    };

    const handleRun = () => {
        setErrorMessage(null);
        setResult(null);

        const payload = {
            platform: platformCategories.map((category) => selections[category.id]),
            demo: demoCategories.map((category) => selections[category.id]),
        };

        startTransition(async () => {
            const response = await runColdStartSeeder(payload);
            if (!response.success && response.message) {
                setErrorMessage(response.message);
            }
            setResult(response);
        });
    };

    const summaryTotals = result?.summary.totals ?? null;

    return (
        <div className="space-y-6">
            <Card className="border-border/60 bg-card/60">
                <CardHeader>
                    <CardTitle>Configure seed plan</CardTitle>
                    <CardDescription>
                        Select platform essentials and demo data. Dependencies are validated during execution.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Platform essentials</p>
                                    <InfoButton
                                        label="Platform essentials"
                                        sections={PLATFORM_ESSENTIALS_INFO}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">Baseline data for a working org.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {platformCategories.map((category) => (
                                <ColdStartCategoryRow
                                    key={category.id}
                                    selection={selections[category.id]}
                                    requiresEmployees={category.requiresEmployees}
                                    employeesEnabled={employeesEnabled}
                                    onToggle={handleToggle}
                                    onDatasetChange={handleDatasetChange}
                                    onCountChange={handleCountChange}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Demo data</p>
                                    <InfoButton
                                        label="Demo data"
                                        sections={DEMO_DATA_INFO}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">Optional sample data for walkthroughs.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {demoCategories.map((category) => (
                                <ColdStartCategoryRow
                                    key={category.id}
                                    selection={selections[category.id]}
                                    requiresEmployees={category.requiresEmployees}
                                    employeesEnabled={employeesEnabled}
                                    onToggle={handleToggle}
                                    onDatasetChange={handleDatasetChange}
                                    onCountChange={handleCountChange}
                                />
                            ))}
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 p-4">
                        <div>
                            <p className="text-sm font-medium">Target organization</p>
                            <p className="text-xs text-muted-foreground">Org ID: {orgId}</p>
                        </div>
                        <InfoButton
                            label="Run cold start seeder"
                            sections={RUN_SEEDER_INFO}
                        />
                        <Button onClick={handleRun} disabled={isPending} className="min-w-40">
                            {isPending ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Seeding...
                                </span>
                            ) : (
                                'Run cold start seeder'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {errorMessage ? (
                <Alert variant="destructive">
                    <AlertTitle>Unable to run seeding</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            ) : null}

            {result ? (
                <Card className="border-border/60 bg-card/60">
                    <CardHeader>
                        <CardTitle>Seed summary</CardTitle>
                        <CardDescription>
                            {result.success ? 'Seed plan completed.' : 'Seed plan completed with errors.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {result.message ? (
                            <div className="text-sm text-muted-foreground">{result.message}</div>
                        ) : null}
                        <div className="grid gap-3 sm:grid-cols-2">
                            {summaryTotals
                                ? Object.entries(summaryTotals)
                                    .filter(([, count]) => count > 0)
                                    .map(([key, count]) => (
                                        <div key={key} className="rounded-lg border border-border/50 p-3">
                                            <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                                                {SEED_CATEGORY_MAP[key as SeedCategoryId].label}
                                            </div>
                                            <div className="text-lg font-semibold">{count}</div>
                                        </div>
                                    ))
                                : null}
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-medium">Step results</p>
                            <div className="space-y-2">
                                {result.steps.map((step) => (
                                    <ColdStartStepRow key={`${step.id}-${step.status}`} step={step} />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}
