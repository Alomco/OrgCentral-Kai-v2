'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { CancelAbsenceDialog } from '@/app/(app)/hr/absence/_components/cancel-absence-dialog';

interface AbsenceManagementRowActionsProps {
    authorization: RepositoryAuthorizationContext;
    absenceId: string;
    canCancel: boolean;
}

export function AbsenceManagementRowActions({
    authorization,
    absenceId,
    canCancel,
}: AbsenceManagementRowActionsProps) {
    const [open, setOpen] = useState(false);

    if (!canCancel) {
        return null;
    }

    return (
        <>
            <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => setOpen(true)}
                aria-label="Cancel absence"
            >
                <X className="h-3.5 w-3.5" />
                Cancel
            </Button>

            <CancelAbsenceDialog
                authorization={authorization}
                absenceId={absenceId}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}
