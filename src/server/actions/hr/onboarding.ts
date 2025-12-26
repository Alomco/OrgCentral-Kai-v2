'use server';

import { PrismaChecklistTemplateRepository, PrismaOnboardingInvitationRepository } from '@/server/repositories/prisma/hr/onboarding';
import type { ChecklistTemplate, ChecklistTemplateCreatePayload, ChecklistTemplateListFilters, ChecklistTemplateUpdatePayload } from '@/server/types/onboarding-types';
import type { ActionState } from '@/server/actions/action-state';
import { authAction } from '@/server/actions/auth-action';
import { toActionState } from '@/server/actions/action-state';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_CHECKLIST_TEMPLATES, CACHE_SCOPE_ONBOARDING_INVITATIONS } from '@/server/repositories/cache-scopes';
import { listChecklistTemplates } from '@/server/use-cases/hr/onboarding/templates/list-checklist-templates';
import { createChecklistTemplate } from '@/server/use-cases/hr/onboarding/templates/create-checklist-template';
import { updateChecklistTemplate } from '@/server/use-cases/hr/onboarding/templates/update-checklist-template';
import { deleteChecklistTemplate } from '@/server/use-cases/hr/onboarding/templates/delete-checklist-template';
import type { OnboardingInvitation, OnboardingInvitationStatus } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import { listOnboardingInvitations } from '@/server/use-cases/hr/onboarding/invitations/list-onboarding-invitations';
import { revokeOnboardingInvitation } from '@/server/use-cases/hr/onboarding/invitations/revoke-onboarding-invitation';
import {
    parseChecklistTemplateListFilters,
    parseChecklistTemplateUpdatePayload,
    parseChecklistTemplateIdentifier,
    parseChecklistTemplateCreatePayload,
} from '@/server/validators/hr/onboarding/checklist-template-validators';

const checklistTemplateRepository = new PrismaChecklistTemplateRepository();
const onboardingInvitationRepository = new PrismaOnboardingInvitationRepository();

const RESOURCE_TYPE = 'hr.onboarding';

export async function listChecklistTemplatesAction(
    filters: ChecklistTemplateListFilters | undefined,
): Promise<ActionState<ChecklistTemplate[]>> {
    return toActionState(() =>
        authAction(
            {
                requiredPermissions: { organization: ['read'] },
                auditSource: 'action:hr:onboarding:templates:list',
                action: 'read',
                resourceType: RESOURCE_TYPE,
                resourceAttributes: { scope: 'templates' },
            },
            async ({ authorization }) => {
                const parsedFilters = parseChecklistTemplateListFilters(filters ?? {});
                const result = await listChecklistTemplates(
                    { checklistTemplateRepository },
                    { authorization, type: parsedFilters.type },
                );
                return result.templates;
            },
        ),
    );
}

export async function createChecklistTemplateAction(
    template: ChecklistTemplateCreatePayload,
): Promise<ActionState<ChecklistTemplate>> {
    return toActionState(() =>
        authAction(
            {
                requiredPermissions: { organization: ['update'] },
                auditSource: 'action:hr:onboarding:templates:create',
                action: 'create',
                resourceType: RESOURCE_TYPE,
                resourceAttributes: { scope: 'templates' },
            },
            async ({ authorization }) => {
                const parsedTemplate = parseChecklistTemplateCreatePayload(template);
                const result = await createChecklistTemplate(
                    { checklistTemplateRepository },
                    { authorization, template: parsedTemplate },
                );

                await invalidateOrgCache(
                    authorization.orgId,
                    CACHE_SCOPE_CHECKLIST_TEMPLATES,
                    authorization.dataClassification,
                    authorization.dataResidency,
                );

                return result.template;
            },
        ),
    );
}

export async function updateChecklistTemplateAction(input: {
    templateId: string;
    updates: ChecklistTemplateUpdatePayload;
}): Promise<ActionState<ChecklistTemplate>> {
    return toActionState(() =>
        authAction(
            {
                requiredPermissions: { organization: ['update'] },
                auditSource: 'action:hr:onboarding:templates:update',
                action: 'update',
                resourceType: RESOURCE_TYPE,
                resourceAttributes: { scope: 'templates', templateId: input.templateId },
            },
            async ({ authorization }) => {
                const templateId = parseChecklistTemplateIdentifier(input.templateId);
                const updates = parseChecklistTemplateUpdatePayload(input.updates);
                const result = await updateChecklistTemplate(
                    { checklistTemplateRepository },
                    { authorization, templateId, updates },
                );

                await invalidateOrgCache(
                    authorization.orgId,
                    CACHE_SCOPE_CHECKLIST_TEMPLATES,
                    authorization.dataClassification,
                    authorization.dataResidency,
                );

                return result.template;
            },
        ),
    );
}

export async function deleteChecklistTemplateAction(input: {
    templateId: string;
}): Promise<ActionState<{ success: true }>> {
    return toActionState(() =>
        authAction(
            {
                requiredPermissions: { organization: ['update'] },
                auditSource: 'action:hr:onboarding:templates:delete',
                action: 'delete',
                resourceType: RESOURCE_TYPE,
                resourceAttributes: { scope: 'templates', templateId: input.templateId },
            },
            async ({ authorization }) => {
                const templateId = parseChecklistTemplateIdentifier(input.templateId);
                await deleteChecklistTemplate(
                    { checklistTemplateRepository },
                    { authorization, templateId },
                );

                await invalidateOrgCache(
                    authorization.orgId,
                    CACHE_SCOPE_CHECKLIST_TEMPLATES,
                    authorization.dataClassification,
                    authorization.dataResidency,
                );

                return { success: true };
            },
        ),
    );
}

export async function listOnboardingInvitationsAction(input?: {
    status?: OnboardingInvitationStatus;
    limit?: number;
}): Promise<ActionState<OnboardingInvitation[]>> {
    return toActionState(() =>
        authAction(
            {
                requiredPermissions: { member: ['invite'] },
                auditSource: 'action:hr:onboarding:invitations:list',
                action: 'read',
                resourceType: RESOURCE_TYPE,
                resourceAttributes: { scope: 'invitations' },
            },
            async ({ authorization }) => {
                const result = await listOnboardingInvitations(
                    { onboardingInvitationRepository },
                    {
                        authorization,
                        status: input?.status,
                        limit: input?.limit,
                    },
                );
                return result.invitations;
            },
        ),
    );
}

export async function revokeOnboardingInvitationAction(input: {
    token: string;
    reason?: string;
}): Promise<ActionState<{ success: true }>> {
    return toActionState(() =>
        authAction(
            {
                requiredPermissions: { member: ['invite'] },
                auditSource: 'action:hr:onboarding:invitations:revoke',
                action: 'update',
                resourceType: RESOURCE_TYPE,
                resourceAttributes: { scope: 'invitations', token: input.token },
            },
            async ({ authorization }) => {
                await revokeOnboardingInvitation(
                    { onboardingInvitationRepository },
                    {
                        authorization,
                        token: input.token,
                        revokedByUserId: authorization.userId,
                        reason: input.reason,
                    },
                );

                await invalidateOrgCache(
                    authorization.orgId,
                    CACHE_SCOPE_ONBOARDING_INVITATIONS,
                    authorization.dataClassification,
                    authorization.dataResidency,
                );

                return { success: true };
            },
        ),
    );
}
