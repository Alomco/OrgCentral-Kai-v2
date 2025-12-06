import { getLeaveService } from '@/server/services/hr/leave/leave-service.provider';
import { getComplianceStatusService } from '@/server/services/hr/compliance/compliance-status.service.provider';
import { getMembershipService } from '@/server/services/org/membership/membership-service.provider';
import { getPeopleService } from './people-service.provider';
import { getAbsenceService } from '@/server/services/hr/absences/absence-service.provider';
import { getComplianceAssignmentService } from '@/server/services/hr/compliance/compliance-assignment.service.provider';
import type { AbsenceService } from '@/server/services/hr/absences/absence-service';
import { PeopleOrchestrationService } from './people-orchestration.service';
import type { PeopleOrchestrationDependencies } from './people-orchestration.deps';
import { PrismaOnboardingInvitationRepository } from '@/server/repositories/prisma/hr/onboarding';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization/prisma-organization-repository';
import type { BasePrismaRepositoryOptions } from '@/server/repositories/prisma/base-prisma-repository';

export interface PeopleOrchestrationProviderOptions {
    absenceService?: AbsenceService;
    overrides?: Partial<PeopleOrchestrationDependencies>;
    prismaOptions?: Pick<BasePrismaRepositoryOptions, 'prisma' | 'trace' | 'onAfterWrite'>;
}

export function getPeopleOrchestrationService(options?: PeopleOrchestrationProviderOptions): PeopleOrchestrationService {
    const prismaOptions = options?.prismaOptions;
    const peopleService = options?.overrides?.peopleService ?? getPeopleService();
    const leaveService = options?.overrides?.leaveService ?? getLeaveService();
    const complianceStatusService =
        options?.overrides?.complianceStatusService ?? getComplianceStatusService();
    const membershipService = options?.overrides?.membershipService ?? getMembershipService();
    const absenceService = options?.overrides?.absenceService ?? options?.absenceService ?? getAbsenceService();
    const complianceAssignmentService =
        options?.overrides?.complianceAssignmentService ?? getComplianceAssignmentService();
    const onboardingInvitationRepository =
        options?.overrides?.onboardingInvitationRepository ??
        new PrismaOnboardingInvitationRepository(prismaOptions ?? {});
    const organizationRepository =
        options?.overrides?.organizationRepository ??
        new PrismaOrganizationRepository({ prisma: prismaOptions?.prisma, trace: prismaOptions?.trace });

    const deps: PeopleOrchestrationDependencies = {
        peopleService,
        leaveService,
        absenceService,
        complianceStatusService,
        membershipService,
        complianceAssignmentService,
        onboardingInvitationRepository,
        organizationRepository,
    };

    return new PeopleOrchestrationService(deps);
}
