import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { OnboardingInvitation } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getOnboardingInvitationsForUi } from '@/server/use-cases/hr/onboarding/invitations/get-onboarding-invitations.cached';

import { formatHumanDateTime } from '../../_components/format-date';
import { onboardingInvitationStatusBadgeVariant } from '../../_components/hr-badge-variants';
import { RevokeOnboardingInvitationForm } from './revoke-onboarding-invitation-form';

export interface OnboardingInvitationsPanelProps {
    authorization: RepositoryAuthorizationContext;
}

function describeExpiry(invite: OnboardingInvitation): string {
    if (!invite.expiresAt) {
        return '—';
    }

    return formatHumanDateTime(invite.expiresAt);
}

export async function OnboardingInvitationsPanel({ authorization }: OnboardingInvitationsPanelProps) {
    const result = await getOnboardingInvitationsForUi({ authorization, limit: 25 });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invitations</CardTitle>
                <CardDescription>
                    Manage onboarding invitations. Tokens are not shown here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {result.invitations.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No invitations found.</div>
                ) : (
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.invitations.map((invite) => (
                                    <TableRow key={invite.token}>
                                        <TableCell className="font-medium">{invite.targetEmail}</TableCell>
                                        <TableCell>
                                            <Badge variant={onboardingInvitationStatusBadgeVariant(invite.status)}>{invite.status}</Badge>
                                        </TableCell>
                                        <TableCell>{formatHumanDateTime(invite.createdAt)}</TableCell>
                                        <TableCell>{describeExpiry(invite)}</TableCell>
                                        <TableCell className="text-right">
                                            {invite.status === 'pending' ? (
                                                <RevokeOnboardingInvitationForm token={invite.token} />
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
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
