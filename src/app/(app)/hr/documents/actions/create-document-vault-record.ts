'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { storeDocumentService } from '@/server/services/records/document-vault-service';
import { documentVaultStoreSchema } from '@/server/types/records/document-vault-schemas';
import { jsonValueSchema } from '@/server/types/notification-dispatch';
import type { DocumentVaultRecord } from '@/server/types/records/document-vault';

export interface DocumentVaultActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    document?: DocumentVaultRecord;
}

const formSchema = z.object({
    type: z.string().min(1),
    classification: z.string().min(1),
    retentionPolicy: z.string().min(1),
    blobPointer: z.string().min(1),
    checksum: z.string().min(1),
    fileName: z.string().min(1),
    mimeType: z.string().optional(),
    sizeBytes: z.string().optional(),
    version: z.string().optional(),
    latestVersionId: z.string().optional(),
    ownerUserId: z.string().optional(),
    dataCategory: z.string().optional(),
    lawfulBasis: z.string().optional(),
    metadata: z.string().optional(),
    dataSubject: z.string().optional(),
});

function parseJson(raw: string | undefined) {
    if (!raw) {
        return undefined;
    }
    try {
        const parsed: unknown = JSON.parse(raw);
        const validated = jsonValueSchema.safeParse(parsed);
        return validated.success ? validated.data : undefined;
    } catch {
        return undefined;
    }
}

export async function createDocumentVaultRecordAction(
    _previous: DocumentVaultActionState,
    formData: FormData,
): Promise<DocumentVaultActionState> {
    const parsed = formSchema.safeParse({
        type: formData.get('type'),
        classification: formData.get('classification'),
        retentionPolicy: formData.get('retentionPolicy'),
        blobPointer: formData.get('blobPointer'),
        checksum: formData.get('checksum'),
        fileName: formData.get('fileName'),
        mimeType: formData.get('mimeType') ?? undefined,
        sizeBytes: formData.get('sizeBytes') ?? undefined,
        version: formData.get('version') ?? undefined,
        latestVersionId: formData.get('latestVersionId') ?? undefined,
        ownerUserId: formData.get('ownerUserId') ?? undefined,
        dataCategory: formData.get('dataCategory') ?? undefined,
        lawfulBasis: formData.get('lawfulBasis') ?? undefined,
        metadata: formData.get('metadata') ?? undefined,
        dataSubject: formData.get('dataSubject') ?? undefined,
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid document payload.' };
    }

    const metadata = parseJson(parsed.data.metadata);
    const dataSubject = parseJson(parsed.data.dataSubject);

    const payload = documentVaultStoreSchema.safeParse({
        type: parsed.data.type,
        classification: parsed.data.classification,
        retentionPolicy: parsed.data.retentionPolicy,
        blobPointer: parsed.data.blobPointer,
        checksum: parsed.data.checksum,
        fileName: parsed.data.fileName,
        mimeType: parsed.data.mimeType,
        sizeBytes: parsed.data.sizeBytes,
        version: parsed.data.version,
        latestVersionId: parsed.data.latestVersionId,
        ownerUserId: parsed.data.ownerUserId,
        dataCategory: parsed.data.dataCategory,
        lawfulBasis: parsed.data.lawfulBasis,
        metadata,
        dataSubject,
    });

    if (!payload.success) {
        return { status: 'error', message: 'Document payload failed validation.' };
    }

    const headerStore = await headers();
    const baseAccess = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'ui:hr:documents:create',
            action: 'create',
            resourceType: 'records.document',
            resourceAttributes: {
                type: payload.data.type,
                classification: payload.data.classification,
                retentionPolicy: payload.data.retentionPolicy,
                ownerUserId: payload.data.ownerUserId ?? null,
            },
        },
    );

    let authorization = baseAccess.authorization;
    const ownerUserId = payload.data.ownerUserId ?? authorization.userId;
    if (ownerUserId !== authorization.userId) {
        const elevated = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:documents:create.elevated',
                action: 'create',
                resourceType: 'records.document',
                resourceAttributes: {
                    type: payload.data.type,
                    classification: payload.data.classification,
                    retentionPolicy: payload.data.retentionPolicy,
                    ownerUserId,
                },
            },
        );
        authorization = elevated.authorization;
    }

    try {
        const document = await storeDocumentService(authorization, {
            ...payload.data,
            orgId: authorization.orgId,
            ownerOrgId: authorization.orgId,
            ownerUserId,
        });

        return { status: 'success', message: 'Document stored.', document };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to store document.',
        };
    }
}
