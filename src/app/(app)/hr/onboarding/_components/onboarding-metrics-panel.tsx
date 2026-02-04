import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getMetricDefinitionsForUi } from '@/server/use-cases/hr/onboarding/metrics/get-metric-definitions.cached';

import { OnboardingMetricsManager } from './onboarding-metrics-manager';

export interface OnboardingMetricsPanelProps {
    authorization: RepositoryAuthorizationContext;
}

export async function OnboardingMetricsPanel({ authorization }: OnboardingMetricsPanelProps) {
    const result = await getMetricDefinitionsForUi({ authorization });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Onboarding metrics</CardTitle>
                <CardDescription>
                    Track onboarding KPIs such as time to productivity and completion rates.
                </CardDescription>
            </CardHeader>
            {!result.canManageMetrics ? (
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        You do not have access to manage onboarding metrics in this organization.
                    </div>
                </CardContent>
            ) : (
                <OnboardingMetricsManager definitions={result.definitions} />
            )}
        </Card>
    );
}
