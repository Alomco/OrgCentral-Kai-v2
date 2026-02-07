'use client';

import { useEffect, useRef, useState } from 'react';
import { UserPlus } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { EmployeeInvitationDialog } from './employee-invitation-dialog';
import { EmployeeInvitationTabs } from './employee-invitation-tabs';
import type { InvitationFormData, PendingInvite } from './employee-invitation-types';

interface EmployeeInvitationPanelProps {
    departments?: string[];
    roles?: string[];
    pendingInvites?: PendingInvite[];
    onSendInvite?: (data: InvitationFormData) => Promise<void>;
    onResendInvite?: (id: string) => Promise<void>;
    onCancelInvite?: (id: string) => Promise<void>;
}

const DEFAULT_ROLES = ['Employee', 'Manager', 'HR Admin'];

export function EmployeeInvitationPanel({
    departments = [],
    roles = DEFAULT_ROLES,
    pendingInvites = [],
    onSendInvite,
    onResendInvite,
    onCancelInvite,
}: EmployeeInvitationPanelProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    const copiedTimeoutReference = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [formData, setFormData] = useState<InvitationFormData>({
        email: '',
        firstName: '',
        lastName: '',
        department: '',
        role: 'Employee',
    });

    const updateFormData = (updates: Partial<InvitationFormData>) => {
        setFormData((previous) => ({ ...previous, ...updates }));
    };

    useEffect(() => () => {
        if (copiedTimeoutReference.current !== null) {
            clearTimeout(copiedTimeoutReference.current);
            copiedTimeoutReference.current = null;
        }
    }, []);

    const handleSubmit = async () => {
        if (!formData.email || !formData.firstName || !onSendInvite) { return; }

        setIsSubmitting(true);
        try {
            await onSendInvite(formData);
            setDialogOpen(false);
            setFormData({
                email: '',
                firstName: '',
                lastName: '',
                department: '',
                role: 'Employee',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyLink = async () => {
        // Placeholder - would copy actual invite link
        await navigator.clipboard.writeText(`${window.location.origin}/invite/sample-token`);
        setCopied(true);
        if (copiedTimeoutReference.current !== null) {
            clearTimeout(copiedTimeoutReference.current);
        }
        copiedTimeoutReference.current = setTimeout(() => {
            setCopied(false);
            copiedTimeoutReference.current = null;
        }, 2000);
    };

    const activeInvites = pendingInvites.filter((index) => index.status === 'pending');
    const expiredInvites = pendingInvites.filter((index) => index.status === 'expired');

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Employee Invitations
                    </CardTitle>
                    <CardDescription>
                        Invite new employees to join your organization
                    </CardDescription>
                </div>
                <EmployeeInvitationDialog
                    dialogOpen={dialogOpen}
                    onDialogOpenChange={setDialogOpen}
                    formData={formData}
                    onFormDataChange={updateFormData}
                    departments={departments}
                    roles={roles}
                    copied={copied}
                    isSubmitting={isSubmitting}
                    onCopyLink={handleCopyLink}
                    onSubmit={handleSubmit}
                />
            </CardHeader>

            <CardContent>
                <EmployeeInvitationTabs
                    activeInvites={activeInvites}
                    expiredInvites={expiredInvites}
                    onResendInvite={onResendInvite}
                    onCancelInvite={onCancelInvite}
                />
            </CardContent>
        </Card>
    );
}
