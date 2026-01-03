import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';
import { PrismaChecklistInstanceRepository } from '@/server/repositories/prisma/hr/onboarding';
import { listChecklistInstancesForEmployee } from '@/server/use-cases/hr/onboarding/checklists';

import { ActiveChecklistCard } from '@/app/(app)/hr/onboarding/_components/active-checklist-card';
import { toggleChecklistItemAction, completeChecklistAction } from '@/app/(app)/hr/onboarding/actions';
import { EmployeeChecklistHistoryCard } from './employee-checklist-history-card';

export interface EmployeeChecklistsTabProps {
    authorization: RepositoryAuthorizationContext;
    profile: EmployeeProfile;
}

export async function EmployeeChecklistsTab({ authorization, profile }: EmployeeChecklistsTabProps) {
    const checklistRepository = new PrismaChecklistInstanceRepository();
    const { instances } = await listChecklistInstancesForEmployee(
        { checklistInstanceRepository: checklistRepository },
        { authorization, employeeId: profile.employeeNumber },
    );

    const activeInstance = instances.find((instance) => instance.status === 'IN_PROGRESS') ?? null;
    const historyInstances = instances.filter((instance) => instance.status !== 'IN_PROGRESS');

    return (
        <div className="space-y-6">
            {activeInstance ? (
                <ActiveChecklistCard
                    instance={activeInstance}
                    onToggleItem={toggleChecklistItemAction}
                    onComplete={completeChecklistAction}
                />
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Active checklist</CardTitle>
                        <CardDescription>No onboarding or offboarding tasks are active.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        This employee does not have an active checklist right now.
                    </CardContent>
                </Card>
            )}
            <EmployeeChecklistHistoryCard instances={historyInstances} />
        </div>
    );
}
