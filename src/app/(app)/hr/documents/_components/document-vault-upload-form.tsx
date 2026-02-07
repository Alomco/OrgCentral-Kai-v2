'use client';

import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react';
import { UploadCloud } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoButton } from '@/components/ui/info-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useDocumentVaultUpload } from '@/app/(app)/hr/_components/document-vault/use-document-vault-upload';
import { createDocumentVaultRecordAction, type DocumentVaultActionState } from '../actions/create-document-vault-record';
import { DOCUMENT_TYPE_VALUES, RETENTION_POLICY_VALUES, SECURITY_CLASSIFICATION_VALUES } from '@/server/types/records/document-vault-schemas';

interface DocumentVaultUploadFormProps {
    onUploaded?: () => void;
}

const INITIAL_STATE: DocumentVaultActionState = { status: 'idle' };

export function DocumentVaultUploadForm({ onUploaded }: DocumentVaultUploadFormProps) {
    const [state, formAction, pending] = useActionState(createDocumentVaultRecordAction, INITIAL_STATE);
    const { uploadFile, uploading, uploadError, resetUploadError } = useDocumentVaultUpload();
    const [localError, setLocalError] = useState<string | null>(null);
    const formReference = useRef<HTMLFormElement | null>(null);
    const fileInputReference = useRef<HTMLInputElement | null>(null);
    const errorMessage = uploadError ?? localError ?? (state.status === 'error' ? state.message : null);
    const successMessage = state.status === 'success' ? (state.message ?? 'Document stored.') : null;

    useEffect(() => {
        if (state.status === 'success') {
            formReference.current?.reset();
            if (fileInputReference.current) {
                fileInputReference.current.value = '';
            }
            onUploaded?.();
        }
    }, [onUploaded, state.status]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (pending || uploading) {
            return;
        }
        const file = fileInputReference.current?.files?.[0];
        if (!file) {
            setLocalError('Select a document to upload.');
            return;
        }

        setLocalError(null);
        resetUploadError();

        const uploadResult = await uploadFile(file);
        if (!uploadResult) {
            return;
        }

        const formData = new FormData(event.currentTarget);
        formData.set('blobPointer', uploadResult.blobPointer);
        formData.set('checksum', uploadResult.checksum);
        formData.set('fileName', uploadResult.fileName);
        formData.set('mimeType', uploadResult.mimeType);
        formData.set('sizeBytes', String(uploadResult.sizeBytes));
        formData.set('metadata', JSON.stringify({
            source: 'hr.documents',
            documentKey: uploadResult.documentKey,
        }));

        formAction(formData);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload to document vault</CardTitle>
                <CardDescription>Store evidence with classification, retention, and version metadata.</CardDescription>
            </CardHeader>
            <form ref={formReference} onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <fieldset disabled={pending || uploading} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="document-file">Document</Label>
                            <Input id="document-file" type="file" ref={fileInputReference} />
                        </div>

                        <div className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Classification & retention
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="document-type">Type</Label>
                                <select
                                    id="document-type"
                                    name="type"
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                    defaultValue="COMPLIANCE"
                                >
                                    {DOCUMENT_TYPE_VALUES.map((value) => (
                                        <option key={value} value={value}>{value}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="document-classification">Classification</Label>
                                    <InfoButton
                                        label="Classification"
                                        sections={[
                                            { label: 'What', text: 'Security level for document access.' },
                                            { label: 'Prereqs', text: 'Must match tenant policy.' },
                                            { label: 'Next', text: 'Choose the lowest level that fits.' },
                                            { label: 'Compliance', text: 'Higher levels restrict access.' },
                                        ]}
                                    />
                                </div>
                                <select
                                    id="document-classification"
                                    name="classification"
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                    defaultValue="OFFICIAL"
                                >
                                    {SECURITY_CLASSIFICATION_VALUES.map((value) => (
                                        <option key={value} value={value}>{value}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="document-retention">Retention policy</Label>
                                    <InfoButton
                                        label="Retention policy"
                                        sections={[
                                            { label: 'What', text: 'How long the document is kept.' },
                                            { label: 'Prereqs', text: 'Align with legal requirements.' },
                                            { label: 'Next', text: 'Pick the required retention period.' },
                                            { label: 'Compliance', text: 'Retention affects legal obligations.' },
                                        ]}
                                    />
                                </div>
                                <select
                                    id="document-retention"
                                    name="retentionPolicy"
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                    defaultValue="SEVEN_YEARS"
                                >
                                    {RETENTION_POLICY_VALUES.map((value) => (
                                        <option key={value} value={value}>{value.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="document-version">Version</Label>
                                <Input id="document-version" name="version" type="number" min={1} max={999} defaultValue="1" />
                            </div>
                        </div>

                        <div className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Ownership & lineage
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="document-owner">Owner user ID (optional)</Label>
                                <Input id="document-owner" name="ownerUserId" placeholder="User UUID" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="document-latest">Previous version ID (optional)</Label>
                                <Input id="document-latest" name="latestVersionId" placeholder="Document UUID" />
                            </div>
                        </div>

                        <div className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Legal basis
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="document-category">Data category (optional)</Label>
                                    <InfoButton
                                        label="Data category"
                                        sections={[
                                            { label: 'What', text: 'Category used for legal basis reporting.' },
                                            { label: 'Prereqs', text: 'Use approved HR categories.' },
                                            { label: 'Next', text: 'Keep it broad but accurate.' },
                                            { label: 'Compliance', text: 'Used in compliance reporting.' },
                                        ]}
                                    />
                                </div>
                                <Input id="document-category" name="dataCategory" placeholder="e.g. Employment" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="document-lawful">Lawful basis (optional)</Label>
                                    <InfoButton
                                        label="Lawful basis"
                                        sections={[
                                            { label: 'What', text: 'Legal basis for processing.' },
                                            { label: 'Prereqs', text: 'Select the applicable basis.' },
                                            { label: 'Next', text: 'Ensure documentation exists.' },
                                            { label: 'Compliance', text: 'Audited in compliance reviews.' },
                                        ]}
                                    />
                                </div>
                                <Input id="document-lawful" name="lawfulBasis" placeholder="e.g. Contractual necessity" />
                            </div>
                        </div>
                    </fieldset>

                    {errorMessage ? (
                        <p className="text-xs text-destructive">
                            {errorMessage}
                        </p>
                    ) : successMessage ? (
                        <p className="text-xs text-emerald-600">{successMessage}</p>
                    ) : null}
                </CardContent>
                <CardFooter className="border-t justify-end">
                    <Button type="submit" disabled={pending || uploading} className="gap-2">
                        {pending || uploading ? <Spinner className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                        {pending || uploading ? 'Uploading...' : 'Upload document'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
