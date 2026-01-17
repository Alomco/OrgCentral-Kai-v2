// src/server/services/seeder/seed-employees.ts
import { faker } from '@faker-js/faker';
import { EmploymentStatus, EmploymentType, MembershipStatus } from '@/server/types/prisma';
import { buildDepartmentServiceDependencies } from '@/server/repositories/providers/org/department-service-dependencies';
import { buildMembershipRepositoryDependencies } from '@/server/repositories/providers/org/membership-service-dependencies';
import { buildUserServiceDependencies } from '@/server/repositories/providers/org/user-service-dependencies';
import {
    resolveSeederAuthorization,
    resolveSeedOrganization,
    type SeedContextOptions,
    getSeededMetadata,
    type SeedResult,
    UNKNOWN_ERROR_MESSAGE,
} from './utils';

const DEFAULT_ROLE = 'employee';

export async function seedFakeEmployeesInternal(count = 5, options?: SeedContextOptions): Promise<SeedResult> {
    try {
        const org = await resolveSeedOrganization(options);
        const authorization = resolveSeederAuthorization(org, options);
        const { userRepository } = buildUserServiceDependencies();
        const { membershipRepository, employeeProfileRepository } = buildMembershipRepositoryDependencies();
        const { departmentRepository } = buildDepartmentServiceDependencies();
        const departments = await departmentRepository.getDepartmentsByOrganization(authorization);

        let created = 0;
        for (let index = 0; index < count; index++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const displayName = `${firstName} ${lastName}`;
            const email = faker.internet.email({ firstName, lastName }).toLowerCase();
            const employmentType = faker.helpers.arrayElement(Object.values(EmploymentType));
            const jobTitle = faker.person.jobTitle();
            const employeeNumber = `EMP-${faker.string.alphanumeric(6).toUpperCase()}`;
            const startDate = faker.date.past({ years: 2 });

            const user = await userRepository.create({
                email,
                displayName,
            });

            await membershipRepository.createMembershipWithProfile(authorization, {
                userId: user.id,
                roles: [DEFAULT_ROLE],
                profile: {
                    orgId: org.id,
                    userId: user.id,
                    employeeNumber,
                    jobTitle,
                    employmentType,
                    startDate,
                    metadata: getSeededMetadata(),
                },
                userUpdate: {
                    email,
                    status: MembershipStatus.ACTIVE,
                    displayName,
                },
            });

            const profile = await employeeProfileRepository.getEmployeeProfileByUser(org.id, user.id);
            if (profile) {
                await employeeProfileRepository.updateEmployeeProfile(org.id, profile.id, {
                    firstName,
                    lastName,
                    displayName,
                    email,
                    jobTitle,
                    departmentId: departments.length
                        ? faker.helpers.arrayElement(departments).id
                        : undefined,
                    employmentStatus: EmploymentStatus.ACTIVE,
                    employmentType,
                    startDate,
                    niNumber: faker.string.alphanumeric(9).toUpperCase(),
                    salaryAmount: faker.number.float({ min: 25500, max: 120000, fractionDigits: 2 }),
                    salaryCurrency: 'GBP',
                    dataResidency: org.dataResidency,
                    dataClassification: org.dataClassification,
                    metadata: getSeededMetadata(),
                });
            }
            created++;
        }

        return { success: true, message: `Created ${String(created)} employees`, count: created };
    } catch (error_) {
        return { success: false, message: error_ instanceof Error ? error_.message : UNKNOWN_ERROR_MESSAGE };
    }
}
