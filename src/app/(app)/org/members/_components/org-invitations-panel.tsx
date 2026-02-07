import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InfoButton } from '@/components/ui/info-button';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { listOrgInvitations } from '@/server/use-cases/auth/invitations/list-org-invitations';
import { PrismaInvitationRepository } from '@/server/repositories/prisma/auth/invitations';

import { formatHumanDateTime } from '../../../hr/_components/format-date';
import { ResendOrgInvitationForm } from './resend-org-invitation-form';
import { RevokeOrgInvitationForm } from './revoke-org-invitation-form';

export interface OrgInvitationsPanelProps {
    authorization: RepositoryAuthorizationContext;
}

function describeExpiry(expiresAt?: Date): string {
    if (!expiresAt) {
        return '-';
    }
    return formatHumanDateTime(expiresAt);
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === 'pending') {
        return 'secondary';
    }
    if (status === 'accepted') {
        return 'default';
    }
    if (status === 'revoked' || status === 'expired' || status === 'declined') {
        return 'destructive';
    }
    return 'outline';
}

export async function OrgInvitationsPanel({ authorization }: OrgInvitationsPanelProps) {
    const result = await listOrgInvitations(
        { invitationRepository: new PrismaInvitationRepository() },
        {
            authorization,
            status: 'pending',
            limit: 25,
        },
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <CardTitle>Invitations</CardTitle>
                    <InfoButton
                        label="Invitations"
                        sections={[
                            { label: 'What', text: 'Track pending invites and expiration.' },
                            { label: 'Prereqs', text: 'Tokens are hidden for security.' },
                            { label: 'Next', text: 'Resend or revoke as needed.' },
                            { label: 'Compliance', text: 'Invite actions are logged.' },
                        ]}
                    />
                </div>
                <CardDescription>Manage pending invitations. Tokens are hidden here.</CardDescription>
            </CardHeader>
            <CardContent>
                {result.invitations.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No pending invitations.</div>
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
                                            <Badge variant={statusBadgeVariant(invite.status)}>{invite.status}</Badge>
                                        </TableCell>
                                        <TableCell>{invite.createdAt ? formatHumanDateTime(invite.createdAt) : '-'}</TableCell>
                                        <TableCell>{describeExpiry(invite.expiresAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <ResendOrgInvitationForm token={invite.token} />
                                                <RevokeOrgInvitationForm token={invite.token} />
                                            </div>
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
