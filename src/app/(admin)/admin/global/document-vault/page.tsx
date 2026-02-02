import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';

import { PageContainer } from '@/components/theme/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import type { DocumentVaultFilters, DocumentVaultRecord } from '@/server/types/records/document-vault';
import { documentVaultListQuerySchema } from '@/server/types/records/document-vault-schemas';
import { listTenantDocumentsService } from '@/server/services/platform/admin/document-vault-service';
import {
    parseAdminDocumentVaultListQuery,
    type AdminDocumentVaultListQuery,
} from '@/server/validators/platform/admin/document-vault-validators';

import { DocumentVaultBreakGlassForm } from './_components/document-vault-break-glass-form';
import { DocumentVaultFilterForm } from './_components/document-vault-filter-form';
import { DocumentVaultTable } from './_components/document-vault-table';

export const metadata: Metadata = {
    title: 'Document Vault - OrgCentral',
    description: 'Tenant-scoped document vault access for global admins.',
};

interface DocumentVaultPageProps {
    searchParams?: Record<string, string | string[] | undefined>;
}

export default async function DocumentVaultAdminPage({ searchParams }: DocumentVaultPageProps) {
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformDocuments: ['read'] },
            auditSource: 'ui:admin:document-vault',
        },
    );

    const parsed = parseFilters(searchParams);
    const tenantId = parsed.values.tenantId;
    const breakGlassApprovalId = parsed.values.breakGlassApprovalId;

    let documents: DocumentVaultRecord[] = [];
    let loadError: string | null = parsed.error;

    if (tenantId && !breakGlassApprovalId && !loadError) {
        loadError = 'Break-glass approval is required to list documents.';
    }

    if (tenantId && breakGlassApprovalId && !loadError) {
        noStore();
        try {
            documents = await listTenantDocumentsService(
                authorization,
                tenantId,
                breakGlassApprovalId,
                toDocumentFilters(parsed.values),
            );
        } catch (error) {
            loadError = error instanceof Error ? error.message : 'Unable to load documents.';
        }
    }

    return (
        <PageContainer padding="lg" maxWidth="full" className="space-y-6">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">Document vault</h1>
                <p className="text-sm text-muted-foreground">
                    Tenant-scoped access to HR documents with break-glass approval for downloads.
                </p>
            </header>

            <DocumentVaultFilterForm values={parsed.values} />

            <DocumentVaultBreakGlassForm />

            {loadError ? (
                <Alert>
                    <AlertTitle>Unable to load documents</AlertTitle>
                    <AlertDescription>{loadError}</AlertDescription>
                </Alert>
            ) : null}

            <Card>
                <CardHeader>
                    <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!tenantId ? (
                        <p className="text-sm text-muted-foreground">
                            Enter a tenant ID to view document vault metadata.
                        </p>
                    ) : (
                        <DocumentVaultTable
                            documents={documents}
                            tenantId={tenantId}
                            breakGlassApprovalId={breakGlassApprovalId}
                        />
                    )}
                </CardContent>
            </Card>
        </PageContainer>
    );
}

function parseFilters(searchParams?: Record<string, string | string[] | undefined>): {
    values: AdminDocumentVaultListQuery;
    error: string | null;
} {
    const values: Record<string, string | undefined> = {
        tenantId: readParameter(searchParams, 'tenantId'),
        breakGlassApprovalId: readParameter(searchParams, 'breakGlassApprovalId'),
        ownerUserId: readParameter(searchParams, 'ownerUserId'),
        type: readParameter(searchParams, 'type'),
        classification: readParameter(searchParams, 'classification'),
        retentionPolicy: readParameter(searchParams, 'retentionPolicy'),
        fileName: readParameter(searchParams, 'fileName'),
    };

    try {
        const parsed = parseAdminDocumentVaultListQuery(values);
        return { values: parsed, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid filters provided.';
        return {
            values: {
                tenantId: values.tenantId,
                breakGlassApprovalId: values.breakGlassApprovalId,
                ownerUserId: values.ownerUserId,
                type: undefined,
                classification: undefined,
                retentionPolicy: undefined,
                fileName: values.fileName,
            },
            error: message,
        };
    }
}

function readParameter(
    searchParams: Record<string, string | string[] | undefined> | undefined,
    key: string,
): string | undefined {
    if (!searchParams) {
        return undefined;
    }
    const value = searchParams[key];
    const resolved = Array.isArray(value) ? value[0] : value;
    if (typeof resolved !== 'string') {
        return undefined;
    }
    const trimmed = resolved.trim();
    return trimmed.length ? trimmed : undefined;
}

function toDocumentFilters(values: AdminDocumentVaultListQuery): DocumentVaultFilters {
    const parsed = documentVaultListQuerySchema.safeParse(values);
    return parsed.success ? parsed.data : {};
}
