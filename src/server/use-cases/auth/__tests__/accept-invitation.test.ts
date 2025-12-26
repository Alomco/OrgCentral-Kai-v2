import { describe, it, expect, vi } from 'vitest';
import { acceptInvitation, type AcceptInvitationDependencies } from '../accept-invitation';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IChecklistTemplateRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-template-repository-contract';
import type { IChecklistInstanceRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type { EmployeeProfileDTO } from '@/server/types/hr/people';
import type { ChecklistTemplate } from '@/server/types/onboarding-types';
import type { InvitationRecord } from '@/server/repositories/contracts/auth/invitations/invitation-repository.types';
import {
    actor,
    baseInvitation,
    buildInvitationRepository,
    buildMembershipRepository,
    buildOrganizationRepository,
    buildUserRepository,
} from './accept-invitation.fixtures';

describe('acceptInvitation onboarding integration', () => {
    it('links an existing pre-boarding profile to the accepted user', async () => {
        const profile: EmployeeProfileDTO = {
            id: 'profile-1',
            orgId: 'org-1',
            userId: 'placeholder-user',
            employeeNumber: 'EMP-100',
            employmentType: 'FULL_TIME',
            employmentStatus: 'ACTIVE',
            jobTitle: 'Analyst',
            departmentId: null,
            startDate: new Date('2024-01-01'),
            endDate: null,
            managerOrgId: null,
            managerUserId: null,
            annualSalary: null,
            hourlyRate: null,
            salaryAmount: null,
            salaryCurrency: null,
            salaryFrequency: null,
            salaryBasis: null,
            paySchedule: null,
            costCenter: null,
            location: null,
            niNumber: null,
            emergencyContact: null,
            nextOfKin: null,
            healthStatus: 'FIT_FOR_WORK',
            workPermit: null,
            bankDetails: null,
            metadata: { preboarding: true },
            phone: null,
            address: null,
            roles: [],
            eligibleLeaveTypes: [],
            employmentPeriods: null,
            salaryDetails: null,
            skills: null,
            certifications: null,
            dataResidency: 'UK_ONLY',
            dataClassification: 'OFFICIAL',
            auditSource: 'test',
            correlationId: null,
            schemaVersion: 1,
            createdBy: null,
            updatedBy: null,
            retentionPolicy: null,
            retentionExpiresAt: null,
            erasureRequestedAt: null,
            erasureCompletedAt: null,
            erasureReason: null,
            erasureActorOrgId: null,
            erasureActorUserId: null,
            archivedAt: null,
            deletedAt: null,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            personalEmail: null,
            email: actor.email,
            displayName: 'Invitee Example',
            photoUrl: null,
        };

        const employeeProfileRepository = ({
            findByEmployeeNumber: vi.fn(async () => profile),
            linkProfileToUser: vi.fn(async () => undefined),
            createEmployeeProfile: vi.fn(),
            updateEmployeeProfile: vi.fn(),
            getEmployeeProfile: vi.fn(),
            getEmployeeProfileByUser: vi.fn(),
            getEmployeeProfilesByOrganization: vi.fn(),
            findByEmail: vi.fn(),
            updateComplianceStatus: vi.fn(),
            deleteEmployeeProfile: vi.fn(),
        }) as unknown as IEmployeeProfileRepository;

        const invitationWithPreboarding: InvitationRecord = {
            ...baseInvitation,
            onboardingData: {
                ...baseInvitation.onboardingData,
                employeeId: 'EMP-100',
            },
        };

        const deps: AcceptInvitationDependencies = {
            invitationRepository: buildInvitationRepository(invitationWithPreboarding),
            userRepository: buildUserRepository(),
            membershipRepository: buildMembershipRepository(),
            organizationRepository: buildOrganizationRepository(),
            employeeProfileRepository,
        };

        const result = await acceptInvitation(deps, { token: baseInvitation.token, actor });

        expect(result.employeeNumber).toBe('EMP-100');
        expect(employeeProfileRepository.linkProfileToUser).toHaveBeenCalledWith('org-1', 'EMP-100', actor.userId);
        const membershipRepo = deps.membershipRepository as ReturnType<typeof buildMembershipRepository>;
        expect(membershipRepo.createMembershipWithProfile).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
                userId: actor.userId,
                profile: expect.objectContaining({ employeeNumber: 'EMP-100' }),
            }),
        );
    });

    it('instantiates a checklist when a template is provided', async () => {
        const invitation: InvitationRecord = {
            ...baseInvitation,
            onboardingData: {
                ...baseInvitation.onboardingData,
                employeeId: 'EMP-200',
                onboardingTemplateId: 'tmpl-1',
            },
        };

        const template: ChecklistTemplate = {
            id: 'tmpl-1',
            orgId: 'org-1',
            name: 'Onboarding',
            type: 'onboarding',
            items: [
                { id: 'item-1', label: 'Upload ID' },
                { id: 'item-2', label: 'Sign contract', order: 2 },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const checklistTemplateRepository: IChecklistTemplateRepository = ({
            createTemplate: vi.fn(),
            updateTemplate: vi.fn(),
            deleteTemplate: vi.fn(),
            getTemplate: vi.fn(async () => template),
            listTemplates: vi.fn(),
        }) as unknown as IChecklistTemplateRepository;

        const checklistInstanceRepository: IChecklistInstanceRepository = ({
            createInstance: vi.fn(async () => ({
                id: 'instance-1',
                orgId: 'org-1',
                employeeId: 'EMP-200',
                templateId: 'tmpl-1',
                status: 'IN_PROGRESS',
                items: [],
                startedAt: new Date(),
            })),
            getInstance: vi.fn(),
            getActiveInstanceForEmployee: vi.fn(async () => null),
            listInstancesForEmployee: vi.fn(),
            updateItems: vi.fn(),
            completeInstance: vi.fn(),
            cancelInstance: vi.fn(),
        }) as unknown as IChecklistInstanceRepository;

        const deps: AcceptInvitationDependencies = {
            invitationRepository: buildInvitationRepository(invitation),
            userRepository: buildUserRepository(),
            membershipRepository: buildMembershipRepository(),
            organizationRepository: buildOrganizationRepository(),
            checklistTemplateRepository,
            checklistInstanceRepository,
        };

        const result = await acceptInvitation(deps, { token: invitation.token, actor });

        expect(result.employeeNumber).toBe('EMP-200');
        expect(checklistInstanceRepository.createInstance).toHaveBeenCalledWith(
            expect.objectContaining({ employeeId: 'EMP-200', templateId: 'tmpl-1' }),
        );
    });
});
