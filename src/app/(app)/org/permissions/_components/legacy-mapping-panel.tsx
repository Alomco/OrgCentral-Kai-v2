import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoButton } from '@/components/ui/info-button';

const legacyChecks = [
    {
        title: 'Role template alignment',
        description: 'Map legacy role keys to seeded templates and confirm inheritance rules.',
    },
    {
        title: 'Registry coverage',
        description: 'Ensure each legacy resource/action has a matching registry entry.',
    },
    {
        title: 'Guard compatibility',
        description: 'Verify hasPermission and guards support legacy keys during migration.',
    },
    {
        title: 'Policy consistency',
        description: 'Update ABAC templates to reference dot-notation resources.',
    },
    {
        title: 'Back-compat validation',
        description: 'Run role checks for manager/admin flows to confirm parity.',
    },
];

export function LegacyMappingPanel() {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <CardTitle>Legacy mapping checklist</CardTitle>
                        <InfoButton
                            label="Legacy mapping"
                            sections={[
                                { label: 'What', text: 'Checklist for migrating legacy permissions.' },
                                { label: 'Prereqs', text: 'Confirm parity with existing roles.' },
                                { label: 'Next', text: 'Complete checks before deprecations.' },
                                { label: 'Compliance', text: 'Migration steps must be auditable.' },
                            ]}
                        />
                    </div>
                    <Badge variant="outline">Pending</Badge>
                </div>
                <CardDescription>
                    Track migration from legacy permission keys to the registry and ABAC policies.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3 text-sm text-foreground">
                    {legacyChecks.map((check) => (
                        <li key={check.title} className="rounded-lg border border-dashed p-3">
                            <div className="font-medium">{check.title}</div>
                            <p className="text-xs text-muted-foreground">
                                {check.description}
                            </p>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                    Full checklist lives in `docs/hr-module-gap-analysis.md`.
                </p>
            </CardContent>
        </Card>
    );
}
