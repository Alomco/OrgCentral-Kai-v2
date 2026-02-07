import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfile } from '@/server/types/hr-types';
import { PrismaChecklistInstanceRepository } from '@/server/repositories/prisma/hr/onboarding';
import { getActiveChecklistForEmployee } from '@/server/use-cases/hr/onboarding/checklists';
import { getComplianceStatusService } from '@/server/services/hr/compliance/compliance-status.service.provider';

import { ActiveChecklistCard } from '@/app/(app)/hr/onboarding/_components/active-checklist-card';
import { toggleChecklistItemAction, completeChecklistAction } from '@/app/(app)/hr/onboarding/actions';

import { HrStatusBadge } from '../../../_components/hr-status-badge';
import { complianceItemStatusBadgeVariant } from '../../../_components/hr-badge-variants';
import {
    formatDate,
    formatEmployeeName,
    formatEmploymentType,
    formatOptionalText,
    formatPhoneNumbers,
} from '../../_components/employee-formatters';
import { buildInitialEmployeeProfileFormState } from '../../form-state';
import { EmployeeProfileEditCard } from './employee-profile-edit-card';

export interface EmployeeOverviewTabProps {
    authorization: RepositoryAuthorizationContext;
    profile: EmployeeProfile;
}

export async function EmployeeOverviewTab({ authorization, profile }: EmployeeOverviewTabProps) {
    const complianceService = getComplianceStatusService();
    const checklistRepository = new PrismaChecklistInstanceRepository();
    const profileFormState = buildInitialEmployeeProfileFormState(profile);

    const [complianceStatus, checklistResult] = await Promise.all([
        complianceService.getStatusForUser(authorization, profile.userId).catch(() => null),
        getActiveChecklistForEmployee(
            { checklistInstanceRepository: checklistRepository },
            { authorization, employeeId: profile.id },
        ),
    ]);

    const checklist = checklistResult.instance;

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Profile details</CardTitle>
                        <CardDescription>Contact and personal information.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <DetailItem label="Name" value={formatEmployeeName(profile)} />
                        <DetailItem label="Employee number" value={profile.employeeNumber} />
                        <DetailItem label="Work email" value={formatOptionalText(profile.email)} />
                        <DetailItem label="Personal email" value={formatOptionalText(profile.personalEmail)} />
                        <DetailItem label="Phone" value={formatPhoneNumbers(profile.phone)} />
                        <DetailItem label="Cost center" value={formatOptionalText(profile.costCenter)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Employment</CardTitle>
                        <CardDescription>Role and status details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DetailItem label="Job title" value={formatOptionalText(profile.jobTitle)} />
                        <DetailItem label="Department" value={formatOptionalText(profile.departmentId)} />
                        <div>
                            <div className="text-xs font-medium text-muted-foreground">Employment type</div>
                            <div className="mt-1">
                                <Badge variant="outline">{formatEmploymentType(profile.employmentType)}</Badge>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-medium text-muted-foreground">Status</div>
                            <div className="mt-1">
                                <HrStatusBadge status={profile.employmentStatus} />
                            </div>
                        </div>
                        <DetailItem label="Start date" value={formatDate(profile.startDate)} />
                        <DetailItem label="End date" value={formatDate(profile.endDate)} />
                        <DetailItem label="Manager user" value={formatOptionalText(profile.managerUserId)} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Compliance status</CardTitle>
                        <CardDescription>Snapshot of assigned compliance items.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-3 text-sm">
                        {complianceStatus ? (
                            <>
                                <Badge variant={complianceItemStatusBadgeVariant(complianceStatus.status)}>
                                    {complianceStatus.status.replace(/_/g, ' ').toLowerCase()}
                                </Badge>
                                <span className="text-muted-foreground">
                                    {complianceStatus.itemCount} item(s) tracked
                                </span>
                            </>
                        ) : (
                            <span className="text-muted-foreground">No compliance status available.</span>
                        )}
                    </CardContent>
                </Card>

                {checklist ? (
                    <ActiveChecklistCard
                        instance={checklist}
                        onToggleItem={toggleChecklistItemAction}
                        onComplete={completeChecklistAction}
                    />
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Active checklist</CardTitle>
                            <CardDescription>Onboarding or offboarding tasks.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            No active checklist is assigned to this employee.
                        </CardContent>
                    </Card>
                )}
            </div>

            <EmployeeProfileEditCard initialState={profileFormState} />
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm wrap-break-word">{value}</div>
        </div>
    );
}
