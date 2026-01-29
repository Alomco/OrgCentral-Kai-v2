'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Paperclip, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ComplianceLogItem, ComplianceTemplateItem } from '@/server/types/compliance-types';
import type { YesNoValue } from './compliance-item-submission.helpers';
import {
    buildMetadataPayload,
    normalizeMetadata,
    parseSubmissionMetadata,
    toDateInputValue,
} from './compliance-item-submission.helpers';
import { buildComplianceItemQueryKey, COMPLIANCE_ITEMS_QUERY_KEY } from '../compliance-items-query';

interface ComplianceItemSubmissionFormProps {
    item: ComplianceLogItem;
    templateItem: ComplianceTemplateItem | null;
    canEdit: boolean;
}

export function ComplianceItemSubmissionForm({
    item,
    templateItem,
    canEdit,
}: ComplianceItemSubmissionFormProps) {
    const queryClient = useQueryClient();
    const initialMetadata = useMemo(
        () => parseSubmissionMetadata(item.metadata),
        [item.metadata],
    );
    const [notes, setNotes] = useState(item.notes ?? '');
    const [attachments, setAttachments] = useState<string[]>(item.attachments ?? []);
    const [attachmentInput, setAttachmentInput] = useState('');
    const [completedAt, setCompletedAt] = useState(toDateInputValue(item.completedAt));
    const [acknowledgementAccepted, setAcknowledgementAccepted] = useState(
        initialMetadata.acknowledgement?.accepted ?? false,
    );
    const [yesNoValue, setYesNoValue] = useState<YesNoValue | null>(
        initialMetadata.yesNo?.value ?? null,
    );
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const itemType = templateItem?.type ?? null;
    const canSubmit = canEdit && status !== 'saving';

    const handleAddAttachment = () => {
        const trimmed = attachmentInput.trim();
        if (!trimmed || attachments.includes(trimmed) || attachments.length >= 10) {
            return;
        }
        setAttachments((previous) => [...previous, trimmed]);
        setAttachmentInput('');
    };

    const handleRemoveAttachment = (value: string) => {
        setAttachments((previous) => previous.filter((itemEntry) => itemEntry !== value));
    };

    const handleSubmit = async () => {
        if (!canEdit) {
            return;
        }

        setStatus('saving');
        setMessage('');

        const metadataPayload = buildMetadataPayload(
            normalizeMetadata(item.metadata),
            itemType,
            acknowledgementAccepted,
            yesNoValue,
            templateItem?.yesNoPrompt,
        );

        const updates = {
            status: 'PENDING_REVIEW',
            notes: notes.trim().length > 0 ? notes.trim() : null,
            attachments: attachments.length > 0 ? attachments : null,
            completedAt: completedAt ? new Date(completedAt).toISOString() : null,
            metadata: metadataPayload,
        };

        try {
            const response = await fetch('/api/hr/compliance/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: item.userId,
                    itemId: item.id,
                    updates,
                }),
            });

            if (!response.ok) {
                const payload = (await response.json()) as { error?: string } | null;
                throw new Error(payload?.error ?? 'Unable to update compliance item.');
            }

            setStatus('success');
            setMessage('Submission sent for review.');
            void queryClient.invalidateQueries({ queryKey: buildComplianceItemQueryKey(item.id, item.userId) }).catch(() => null);
            void queryClient.invalidateQueries({ queryKey: COMPLIANCE_ITEMS_QUERY_KEY }).catch(() => null);
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Unable to update compliance item.');
        }
    };

    if (!canEdit) {
        return (
            <Alert>
                <AlertTitle>Submissions locked</AlertTitle>
                <AlertDescription>
                    You do not have access to update this compliance item.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {status === 'error' || status === 'success' ? (
                <Alert variant={status === 'error' ? 'destructive' : 'default'} role="status">
                    <AlertTitle>{status === 'error' ? 'Unable to submit' : 'Submission saved'}</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                </Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
                {(itemType === 'DOCUMENT' || itemType === 'COMPLETION_DATE') ? (
                    <div className="space-y-2">
                        <Label htmlFor="compliance-completed-at">Completion date</Label>
                        <Input
                            id="compliance-completed-at"
                            type="date"
                            value={completedAt}
                            onChange={(event) => setCompletedAt(event.target.value)}
                        />
                    </div>
                ) : null}

                {itemType === 'YES_NO' ? (
                    <div className="space-y-2">
                        <Label>Response</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="compliance-yes-no"
                                    value="YES"
                                    checked={yesNoValue === 'YES'}
                                    onChange={() => setYesNoValue('YES')}
                                />
                                Yes
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="compliance-yes-no"
                                    value="NO"
                                    checked={yesNoValue === 'NO'}
                                    onChange={() => setYesNoValue('NO')}
                                />
                                No
                            </label>
                        </div>
                    </div>
                ) : null}

                {itemType === 'ACKNOWLEDGEMENT' ? (
                    <div className="space-y-2">
                        <Label>Acknowledgement</Label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={acknowledgementAccepted}
                                onChange={(event) => setAcknowledgementAccepted(event.target.checked)}
                            />
                            I acknowledge the guidance above.
                        </label>
                    </div>
                ) : null}
            </div>

            {itemType === 'DOCUMENT' ? (
                <div className="space-y-2">
                    <Label>Attachments</Label>
                    <div className="flex flex-wrap gap-2">
                        <Input
                            placeholder="Paste a document link"
                            value={attachmentInput}
                            onChange={(event) => setAttachmentInput(event.target.value)}
                        />
                        <Button type="button" variant="outline" onClick={handleAddAttachment}>
                            <Paperclip className="mr-2 h-4 w-4" />
                            Add
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {attachments.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No attachments added.</p>
                        ) : (
                            attachments.map((value) => (
                                <div
                                    key={value}
                                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                                >
                                    <span className="truncate">{value}</span>
                                    <button
                                        type="button"
                                        className="text-xs text-muted-foreground underline"
                                        onClick={() => handleRemoveAttachment(value)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : null}

            <div className="space-y-2">
                <Label htmlFor="compliance-notes">Notes</Label>
                <Textarea
                    id="compliance-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add any supporting context for reviewers"
                    rows={4}
                />
            </div>

            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
                {status === 'saving'
                    ? <Save className="mr-2 h-4 w-4 animate-spin" />
                    : <Check className="mr-2 h-4 w-4" />}
                {status === 'saving' ? 'Submitting...' : 'Submit for review'}
            </Button>
        </div>
    );
}
