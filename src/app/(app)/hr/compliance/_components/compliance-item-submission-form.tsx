'use client';

import { useActionState, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Save } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ComplianceAttachmentInput, ComplianceLogItem, ComplianceTemplateItem } from '@/server/types/compliance-types';
import type { YesNoValue } from './compliance-item-submission.helpers';
import {
    buildMetadataPayload,
    normalizeMetadata,
    parseSubmissionMetadata,
    toDateInputValue,
} from './compliance-item-submission.helpers';
import { buildComplianceItemQueryKey, COMPLIANCE_ITEMS_QUERY_KEY } from '../compliance-items-query';
import { ComplianceAttachmentsField } from './compliance-attachments-field';
import { submitComplianceItemAction, type ComplianceSubmissionActionState } from '../actions/submit-compliance-item';

interface ComplianceItemSubmissionFormProps {
    item: ComplianceLogItem;
    templateItem: ComplianceTemplateItem | null;
    canEdit: boolean;
}

const INITIAL_STATE: ComplianceSubmissionActionState = { status: 'idle' };

function toAttachmentInput(value: ComplianceAttachmentInput): ComplianceAttachmentInput {
    return value;
}

function mapExistingAttachments(item: ComplianceLogItem): ComplianceAttachmentInput[] {
    if (!item.attachments || item.attachments.length === 0) {
        return [];
    }
    return item.attachments.map((attachment) => ({
        ...attachment,
        uploadedAt: attachment.uploadedAt instanceof Date
            ? attachment.uploadedAt.toISOString()
            : new Date(attachment.uploadedAt).toISOString(),
    })) as ComplianceAttachmentInput[];
}

export function ComplianceItemSubmissionForm({
    item,
    templateItem,
    canEdit,
}: ComplianceItemSubmissionFormProps) {
    const queryClient = useQueryClient();
    const formReference = useRef<HTMLFormElement | null>(null);
    const initialMetadata = useMemo(() => parseSubmissionMetadata(item.metadata), [item.metadata]);

    const [notes, setNotes] = useState(item.notes ?? '');
    const [attachments, setAttachments] = useState<ComplianceAttachmentInput[]>(() => mapExistingAttachments(item));
    const [completedAt, setCompletedAt] = useState(toDateInputValue(item.completedAt));
    const [acknowledgementAccepted, setAcknowledgementAccepted] = useState(
        initialMetadata.acknowledgement?.accepted ?? false,
    );
    const [yesNoValue, setYesNoValue] = useState<YesNoValue | null>(
        initialMetadata.yesNo?.value ?? null,
    );
    const [uploading, setUploading] = useState(false);

    const [state, formAction, pending] = useActionState(submitComplianceItemAction, INITIAL_STATE);

    const itemType = templateItem?.type ?? null;
    const canSubmit = canEdit && !pending && !uploading;

    useEffect(() => {
        if (state.status === 'success') {
            void queryClient.invalidateQueries({ queryKey: buildComplianceItemQueryKey(item.id, item.userId) }).catch(() => null);
            void queryClient.invalidateQueries({ queryKey: COMPLIANCE_ITEMS_QUERY_KEY }).catch(() => null);
        }
    }, [item.id, item.userId, queryClient, state.status]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) {
            return;
        }

        const metadataPayload = buildMetadataPayload(
            normalizeMetadata(item.metadata),
            itemType,
            acknowledgementAccepted,
            yesNoValue,
            templateItem?.yesNoPrompt,
        );

        const formData = new FormData(event.currentTarget);
        formData.set('attachments', JSON.stringify(attachments.map(toAttachmentInput)));
        formData.set('metadata', metadataPayload ? JSON.stringify(metadataPayload) : '');

        formAction(formData);
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
        <form ref={formReference} onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="userId" value={item.userId} />
            <input type="hidden" name="itemId" value={item.id} />

            {(state.status === 'error' || state.status === 'success') ? (
                <Alert variant={state.status === 'error' ? 'destructive' : 'default'} role="status">
                    <AlertTitle>{state.status === 'error' ? 'Unable to submit' : 'Submission saved'}</AlertTitle>
                    <AlertDescription>{state.message ?? 'Submission sent for review.'}</AlertDescription>
                </Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
                {(itemType === 'DOCUMENT' || itemType === 'COMPLETION_DATE') ? (
                    <div className="space-y-2">
                        <Label htmlFor="compliance-completed-at">Completion date</Label>
                        <Input
                            id="compliance-completed-at"
                            name="completedAt"
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
                                    name="yesNoValue"
                                    value="YES"
                                    checked={yesNoValue === 'YES'}
                                    onChange={() => setYesNoValue('YES')}
                                />
                                Yes
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="yesNoValue"
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
                                name="acknowledgementAccepted"
                                checked={acknowledgementAccepted}
                                onChange={(event) => setAcknowledgementAccepted(event.target.checked)}
                            />
                            I acknowledge the guidance above.
                        </label>
                    </div>
                ) : null}
            </div>

            <ComplianceAttachmentsField
                itemType={itemType}
                value={attachments}
                onChange={setAttachments}
                ownerUserId={item.userId}
                allowedFileTypes={templateItem?.allowedFileTypes}
                disabled={pending}
                onBusyChange={setUploading}
            />

            <div className="space-y-2">
                <Label htmlFor="compliance-notes">Notes</Label>
                <Textarea
                    id="compliance-notes"
                    name="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add any supporting context for reviewers"
                    rows={4}
                />
            </div>

            <Button type="submit" disabled={!canSubmit}>
                {pending ? <Save className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                {pending ? 'Submitting...' : 'Submit for review'}
            </Button>
        </form>
    );
}
