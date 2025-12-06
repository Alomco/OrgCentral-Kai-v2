import type { GetSessionDependencies } from '@/server/use-cases/auth/sessions/get-session';
import type { IComplianceItemRepository } from '@/server/repositories/contracts/hr/compliance/compliance-item-repository-contract';
import { PrismaComplianceItemRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository';
import {
    getComplianceAssignmentService,
    type ComplianceAssignmentServiceContract,
} from '@/server/services/hr/compliance/compliance-assignment.service.provider';
import { readJson } from '@/server/api-adapters/http/request-utils';

export interface ResolvedComplianceControllerDependencies {
    session: GetSessionDependencies;
    complianceItemRepository: IComplianceItemRepository;
    assignmentService: ComplianceAssignmentServiceContract;
}

export type ComplianceControllerDependencies = Partial<ResolvedComplianceControllerDependencies>;

const complianceItemRepository = new PrismaComplianceItemRepository();
const assignmentService = getComplianceAssignmentService();

export const defaultComplianceControllerDependencies: ResolvedComplianceControllerDependencies = {
    session: {},
    complianceItemRepository,
    assignmentService,
};

export function resolveComplianceControllerDependencies(
    overrides?: ComplianceControllerDependencies,
): ResolvedComplianceControllerDependencies {
    if (!overrides) {
        return defaultComplianceControllerDependencies;
    }

    return {
        session: overrides.session ?? defaultComplianceControllerDependencies.session,
        complianceItemRepository:
            overrides.complianceItemRepository ?? defaultComplianceControllerDependencies.complianceItemRepository,
        assignmentService: overrides.assignmentService ?? defaultComplianceControllerDependencies.assignmentService,
    };
}

export { readJson };
