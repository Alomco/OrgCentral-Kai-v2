import { unstable_noStore as noStore } from 'next/cache';
import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { PrismaComplianceItemRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository';
import { PrismaComplianceTemplateRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-template-repository';
import { PrismaComplianceCategoryRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-category-repository';
import { listComplianceTemplates } from '@/server/use-cases/hr/compliance/list-compliance-templates';
import { getEmployeeProfileByUserForUi } from '@/server/use-cases/hr/people/get-employee-profile-by-user.cached';
import type { EmployeeProfile } from '@/server/types/hr-types';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

import { buildTemplateItemLookup } from '../_components/compliance-template-lookup';
import { ComplianceItemDetailCards } from './compliance-item-detail-cards';
import { ComplianceItemDetailHeader } from './compliance-item-detail-header';

interface ComplianceItemDetailPageProps {
    params: Promise<{ itemId: string }>;
    searchParams?: Promise<{ userId?: string }>;
}

export default async function ComplianceItemDetailPage({
    params,
    searchParams,
}: ComplianceItemDetailPageProps) {
    const { itemId } = await params;
    const { userId: requestedUserId } = (await searchParams) ?? {};
    const headerStore = await nextHeaders();

    const baseAccess = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'ui:hr:compliance:detail',
            action: 'read',
            resourceType: 'hr.compliance',
            resourceAttributes: { itemId },
        },
    );

    const targetUserId = requestedUserId ?? baseAccess.authorization.userId;
    let authorization = baseAccess.authorization;

    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
    }

    if (targetUserId !== baseAccess.authorization.userId) {
        const elevated = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['read'] },
                auditSource: 'ui:hr:compliance:detail.elevated',
                action: 'read',
                resourceType: 'hr.compliance',
                resourceAttributes: { itemId, targetUserId },
            },
        );
        authorization = elevated.authorization;
    }

    const complianceItemRepository = new PrismaComplianceItemRepository();
    const complianceTemplateRepository = new PrismaComplianceTemplateRepository();
    const complianceCategoryRepository = new PrismaComplianceCategoryRepository();

    const [complianceItem, templates, categories, profileResult] = await Promise.all([
        complianceItemRepository.getItem(authorization.orgId, targetUserId, itemId),
        listComplianceTemplates({ complianceTemplateRepository }, { authorization }),
        complianceCategoryRepository.listCategories(authorization.orgId),
        getEmployeeProfileByUserForUi({ authorization, userId: targetUserId }),
    ]);

    if (!complianceItem) {
        notFound();
    }

    const templateLookup = buildTemplateItemLookup(templates);
    const templateMeta = templateLookup.get(complianceItem.templateItemId);
    const categoryLookup = new Map(categories.map((category) => [category.key, category.label] as const));
    const categoryLabel = complianceItem.categoryKey
        ? categoryLookup.get(complianceItem.categoryKey) ?? complianceItem.categoryKey
        : 'General';

    const itemTitle = templateMeta?.item.name ?? complianceItem.templateItemId;
    const itemGuidance = templateMeta?.item.guidanceText;
    const itemType = templateMeta?.item.type ?? 'DOCUMENT';
    const isInternalOnly = templateMeta?.item.isInternalOnly ?? false;
    const isSelfView = targetUserId === baseAccess.authorization.userId;

    if (isInternalOnly && isSelfView) {
        notFound();
    }

    const assignedProfile = profileResult.profile;
    const assignedName = resolveAssignedName(assignedProfile, complianceItem.userId);

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
                        <BreadcrumbLink asChild>
                            <Link href="/hr/compliance">Compliance</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{itemTitle}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <Button variant="ghost" size="sm" asChild>
                <Link href="/hr/compliance">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Compliance
                </Link>
            </Button>

            <ComplianceItemDetailHeader
                itemId={itemId}
                userId={targetUserId}
                initialItem={complianceItem}
                itemTitle={itemTitle}
                itemGuidance={itemGuidance ?? undefined}
                isInternalOnly={isInternalOnly}
            />

            <div className="grid gap-6 md:grid-cols-2">
                <ComplianceItemDetailCards
                    itemId={itemId}
                    userId={targetUserId}
                    initialItem={complianceItem}
                    categoryLabel={categoryLabel}
                    itemType={itemType}
                    assignedName={assignedName}
                    templateItem={templateMeta?.item ?? null}
                    canEdit={isSelfView}
                />
            </div>
        </div>
    );
}

function resolveAssignedName(profile: EmployeeProfile | null | undefined, fallback: string): string {
    if (!profile) {
        return fallback;
    }
    const displayName = profile.displayName?.trim();
    if (displayName) {
        return displayName;
    }
    const firstName = profile.firstName?.trim() ?? '';
    const lastName = profile.lastName?.trim() ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) {
        return fullName;
    }
    return profile.email ?? fallback;
}
