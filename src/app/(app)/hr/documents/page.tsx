import type { Metadata } from 'next';
import Link from 'next/link';
import { headers as nextHeaders } from 'next/headers';
import { FileText } from 'lucide-react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { HrPageHeader } from '../_components/hr-page-header';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { listDocumentsForUi } from '@/server/use-cases/records/documents/list-documents.cached';
import { DocumentVaultPanel } from './_components/document-vault-panel';

export const metadata: Metadata = {
    title: 'Document Vault',
    description: 'Secure document vault with classification, retention, and version metadata.',
};

export default async function DocumentVaultPage() {
    const headerStore = await nextHeaders();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:hr:documents',
        },
    );

    const result = await listDocumentsForUi({ authorization }).catch(() => ({ documents: [] }));

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/hr">HR</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Documents</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Document vault"
                description="Secure evidence storage with classification, retention, and version tracking."
                icon={<FileText className="h-5 w-5" />}
            />

            <DocumentVaultPanel initialDocuments={result.documents} />
        </div>
    );
}
