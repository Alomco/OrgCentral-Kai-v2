import type { ComplianceTemplate } from '@/server/types/compliance-types';
import type { IComplianceCategoryRepository } from '@/server/repositories/contracts/hr/compliance/compliance-category-repository-contract';
import type { IComplianceTemplateRepository } from '@/server/repositories/contracts/hr/compliance/compliance-template-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

const DEFAULT_SEED_KEY = 'uk-employment';
const DEFAULT_SEED_VERSION = '1';

export interface SeedDefaultComplianceTemplatesInput {
    authorization: RepositoryAuthorizationContext;
    force?: boolean;
}

export interface SeedDefaultComplianceTemplatesDependencies {
    complianceTemplateRepository: IComplianceTemplateRepository;
    complianceCategoryRepository?: IComplianceCategoryRepository;
}

export interface SeedDefaultComplianceTemplatesResult {
    success: true;
    created: boolean;
    template: ComplianceTemplate;
}

export async function seedDefaultComplianceTemplates(
    deps: SeedDefaultComplianceTemplatesDependencies,
    input: SeedDefaultComplianceTemplatesInput,
): Promise<SeedDefaultComplianceTemplatesResult> {
    const existing = await deps.complianceTemplateRepository
        .listTemplates(input.authorization.orgId)
        .then((templates) =>
            templates.find((template) => {
                const metadata = template.metadata as unknown;
                if (!metadata || typeof metadata !== 'object') {
                    return false;
                }

                const seedKey = (metadata as { seedKey?: unknown }).seedKey;
                const seedVersion = (metadata as { seedVersion?: unknown }).seedVersion;

                return seedKey === DEFAULT_SEED_KEY && seedVersion === DEFAULT_SEED_VERSION;
            }),
        );

    if (existing && !input.force) {
        if (existing.categoryKey && deps.complianceCategoryRepository) {
            await deps.complianceCategoryRepository.upsertCategory({
                orgId: input.authorization.orgId,
                key: existing.categoryKey,
                label: 'UK Employment',
                sortOrder: 100,
                metadata: { regulatoryRefs: ['UK_GDPR'] },
            });
        }
        return { success: true, created: false, template: existing };
    }

    const template = await deps.complianceTemplateRepository.createTemplate({
        orgId: input.authorization.orgId,
        name: 'UK Employment (Default)',
        categoryKey: 'uk_employment',
        version: DEFAULT_SEED_VERSION,
        metadata: {
            seedKey: DEFAULT_SEED_KEY,
            seedVersion: DEFAULT_SEED_VERSION,
            seededAt: new Date().toISOString(),
            source: 'orgcentral',
        },
        items: [
            {
                id: 'uk_employment.right_to_work',
                name: 'Right to work check',
                type: 'DOCUMENT',
                isMandatory: true,
                guidanceText: 'Upload evidence that confirms the employee has the right to work.',
                allowedFileTypes: ['pdf', 'jpg', 'png'],
                reminderDaysBeforeExpiry: 30,
                expiryDurationDays: 365,
                regulatoryRefs: ['UK_GDPR'],
            },
            {
                id: 'uk_employment.contract_signed',
                name: 'Signed employment contract',
                type: 'DOCUMENT',
                isMandatory: true,
                guidanceText: 'Upload the signed employment contract.',
                allowedFileTypes: ['pdf', 'docx'],
                regulatoryRefs: ['UK_GDPR'],
            },
            {
                id: 'uk_employment.privacy_ack',
                name: 'Privacy notice acknowledgement',
                type: 'ACKNOWLEDGEMENT',
                isMandatory: true,
                acknowledgementText: 'I acknowledge that I have read the privacy notice.',
                regulatoryRefs: ['UK_GDPR'],
            },
        ],
    });

    if (template.categoryKey && deps.complianceCategoryRepository) {
        await deps.complianceCategoryRepository.upsertCategory({
            orgId: input.authorization.orgId,
            key: template.categoryKey,
            label: 'UK Employment',
            sortOrder: 100,
            metadata: { regulatoryRefs: ['UK_GDPR'] },
        });
    }

    return { success: true, created: true, template };
}
