// src/server/services/seeder/seed-compliance.ts
import { faker } from '@faker-js/faker';
import { buildComplianceRepositoryDependencies } from '@/server/repositories/providers/hr/compliance-repository-dependencies';
import { buildOnboardingServiceDependencies } from '@/server/repositories/providers/hr/onboarding-service-dependencies';
import {
    resolveSeederAuthorization,
    resolveSeedOrganization,
    type SeedContextOptions,
    getSeededMetadata,
    type SeedResult,
    UNKNOWN_ERROR_MESSAGE,
} from './utils';

export async function seedComplianceDataInternal(options?: SeedContextOptions): Promise<SeedResult> {
    try {
        const org = await resolveSeedOrganization(options);
        const authorization = resolveSeederAuthorization(org, options);
        const { checklistTemplateRepository, checklistInstanceRepository, employeeProfileRepository } =
            buildOnboardingServiceDependencies();
        const { complianceTemplateRepository, complianceItemRepository } = buildComplianceRepositoryDependencies();

        // Fetch real employees to link checklists to
        const employees = await employeeProfileRepository.getEmployeeProfilesByOrganization(org.id);
        if (employees.length === 0) {
            return { success: false, message: 'No employees found. Please seed employees first.' };
        }

        const metadata = getSeededMetadata();

        // 1. Checklist Templates
        const template = await checklistTemplateRepository.createTemplate({
            orgId: org.id,
            name: 'New Hire Onboarding',
            type: 'onboarding',
            items: [
                { id: '1', label: 'Sign Contract', order: 1 },
                { id: '2', label: 'IT Setup', order: 2 },
                { id: '3', label: 'Discord Invite', order: 3 },
            ],
        });

        // 2. Checklist Instances (Assign to random employees)
        for (const emp of employees.slice(0, 5)) {
            await checklistInstanceRepository.createInstance({
                orgId: org.id,
                employeeId: emp.id,
                templateId: template.id,
                templateName: template.name,
                items: template.items.map((item) => ({
                    task: item.label,
                    completed: false,
                })),
                metadata,
            });
        }

        // 3. Compliance Templates and Log Items
        const complianceTemplate = await complianceTemplateRepository.createTemplate({
            orgId: org.id,
            name: 'Core Compliance',
            items: [
                { id: 'doc-1', name: 'Signed Contract', type: 'DOCUMENT', isMandatory: true },
                { id: 'doc-2', name: 'Safety Training', type: 'ACKNOWLEDGEMENT', isMandatory: false },
            ],
            metadata: getSeededMetadata(),
        });

        const members = employees.slice(0, 10);
        for (const member of members) {
            await complianceItemRepository.assignItems({
                orgId: org.id,
                userId: member.userId,
                templateId: complianceTemplate.id,
                templateItemIds: complianceTemplate.items.map((item) => item.id),
                assignedBy: authorization.userId,
                dueDate: faker.date.future(),
                metadata: getSeededMetadata(),
            });
        }

        return { success: true, message: 'Seeded Compliance (Checklists, Logs).' };
    } catch (error_) {
        return { success: false, message: error_ instanceof Error ? error_.message : UNKNOWN_ERROR_MESSAGE };
    }
}
