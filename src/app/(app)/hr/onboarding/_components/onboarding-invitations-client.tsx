'use client';

import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { OnboardingInvitation } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';

import { formatHumanDateTime } from '../../_components/format-date';
import { onboardingInvitationStatusBadgeVariant } from '../../_components/hr-badge-variants';
import { OnboardingInvitationActions } from './onboarding-invitation-actions';
import { fetchOnboardingInvitations, invitationsKey } from '../onboarding-invitations-query';

interface OnboardingInvitationsClientProps {
    initialInvitations: OnboardingInvitation[];
}

function describeExpiry(invite: OnboardingInvitation): string {
    if (!invite.expiresAt) {
        return 'No expiry';
    }

    return formatHumanDateTime(invite.expiresAt);
}

function formatInvitationStatus(status: OnboardingInvitation['status']): string {
    return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export function OnboardingInvitationsClient({ initialInvitations }: OnboardingInvitationsClientProps) {
    const limitParam = typeof window !== 'undefined' ? Number(new URLSearchParams(window.location.search).get('limit') || '25') : 25;\n    const { data: invitations = initialInvitations } = useQuery({ queryKey: invitationsKey(limitParam), queryFn: () => fetchOnboardingInvitations(limitParam), initialData: initialInvitations });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invitations</CardTitle>
                <CardDescription>
                    Manage onboarding invitations. Tokens are not shown here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {invitations.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No invitations found.</div>
                ) : (
                    <div className="overflow-auto rounded-md border">
                        <Table className="min-w-[720px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[260px]">Email</TableHead>
                                    <TableHead className="w-[140px]">Status</TableHead>
                                    <TableHead className="w-[180px]">Created</TableHead>
                                    <TableHead className="w-[180px]">Expires</TableHead>
                                    <TableHead className="text-right w-[320px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invitations.map((invite) => (
                                    <TableRow key={invite.token}>
                                        <TableCell className="font-medium max-w-[260px]">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="block truncate">{invite.targetEmail}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{invite.targetEmail}</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={onboardingInvitationStatusBadgeVariant(invite.status)}>
                                                {formatInvitationStatus(invite.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatHumanDateTime(invite.createdAt)}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{describeExpiry(invite)}</TableCell>
                                        <TableCell className="text-right align-top">
                                            {invite.status === 'pending' ? (
                                                <OnboardingInvitationActions
                                                    token={invite.token}
                                                    email={invite.targetEmail}
                                                />
                                            ) : (
                                                <span className="text-xs text-muted-foreground">N/A</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

