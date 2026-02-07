'use client';

import { useActionState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoButton } from '@/components/ui/info-button';
import { cn } from '@/lib/utils';
import { uiStylePresets, type UiStyleKey } from '@/server/theme/ui-style-presets';
import { updateOrgUiStyleAction } from '../actions-ui-style';
import { initialThemeState } from '../actions.state';

interface OrgUiStyleCardProps {
    orgId: string;
    currentUiStyleId?: UiStyleKey;
}

const uiStyleOptions = Object.values(uiStylePresets);

export function OrgUiStyleCard({ orgId, currentUiStyleId }: OrgUiStyleCardProps) {
    const boundUiStyleAction = updateOrgUiStyleAction.bind(null, orgId);
    const [uiStyleState, uiStyleAction, isUiStylePending] = useActionState(
        boundUiStyleAction,
        initialThemeState,
    );

    return (
        <Card className="overflow-hidden border-0 bg-background/80 shadow-xl backdrop-blur-xl">
            <CardHeader className="border-b border-[oklch(var(--primary)/0.11)] bg-linear-to-r from-[oklch(var(--primary)/0.04)] to-transparent">
                <CardTitle className="flex items-center justify-between text-lg">
                    <span>UI Style</span>
                    <InfoButton
                        label="UI Style"
                        sections={[
                            { label: 'What', text: 'Default surface style for cards and panels.' },
                            { label: 'Prereqs', text: 'Org theme access.' },
                            { label: 'Next', text: 'Preview key screens, then apply.' },
                            { label: 'Compliance', text: 'Changes are logged for tenant audit history.' },
                        ]}
                    />
                </CardTitle>
                <CardDescription>Set the default surface style for this organization</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <form action={uiStyleAction}>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {uiStyleOptions.map((style) => (
                            <label
                                key={style.id}
                                className={cn(
                                    'group relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200',
                                    'hover:border-[oklch(var(--primary)/0.45)] hover:shadow-lg hover:shadow-[oklch(var(--primary)/0.08)]',
                                    currentUiStyleId === style.id
                                        ? 'border-primary bg-[oklch(var(--primary)/0.04)] shadow-md'
                                        : 'border-border bg-card/50',
                                )}
                            >
                                <input
                                    type="radio"
                                    name="uiStyleId"
                                    value={style.id}
                                    defaultChecked={currentUiStyleId === style.id}
                                    className="sr-only"
                                />
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{style.emoji}</span>
                                    <div className="flex-1">
                                        <p className="font-semibold">{style.name}</p>
                                        <p className="text-xs text-muted-foreground">{style.description}</p>
                                    </div>
                                    {currentUiStyleId === style.id ? (
                                        <Check className="h-5 w-5 text-primary" />
                                    ) : null}
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                        <Button
                            type="submit"
                            disabled={isUiStylePending}
                            className="bg-linear-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Apply UI Style
                        </Button>
                        {uiStyleState.status === 'success' ? (
                            <span className="text-sm text-emerald-600">{uiStyleState.message}</span>
                        ) : null}
                        {uiStyleState.status === 'error' ? (
                            <span className="text-sm text-rose-600">{uiStyleState.message}</span>
                        ) : null}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
