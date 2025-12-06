import { PrismaLeaveBalanceRepository, PrismaLeavePolicyRepository, PrismaLeaveRequestRepository } from '@/server/repositories/prisma/hr/leave';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people';
import { prisma } from '@/server/lib/prisma';
import { LeaveService, type LeaveServiceDependencies } from './leave-service';
import { getHrNotificationService } from '@/server/services/hr/notifications/hr-notification-service.provider';

const leaveRequestRepository = new PrismaLeaveRequestRepository();
const leaveBalanceRepository = new PrismaLeaveBalanceRepository();
const leavePolicyRepository = new PrismaLeavePolicyRepository();
const organizationRepository = new PrismaOrganizationRepository({ prisma });
const profileRepository = new PrismaEmployeeProfileRepository();
const defaultLeaveServiceDependencies: LeaveServiceDependencies = {
    leaveRequestRepository,
    leaveBalanceRepository,
    leavePolicyRepository,
    organizationRepository,
    profileRepository,
    hrNotificationService: getHrNotificationService(),
};

const sharedLeaveService = new LeaveService(defaultLeaveServiceDependencies);

export function getLeaveService(overrides?: Partial<LeaveServiceDependencies>): LeaveService {
    if (!overrides || Object.keys(overrides).length === 0) {
        return sharedLeaveService;
    }

    return new LeaveService({
        ...defaultLeaveServiceDependencies,
        ...overrides,
    });
}

export type LeaveServiceContract = Pick<
    LeaveService,
    | 'submitLeaveRequest'
    | 'approveLeaveRequest'
    | 'rejectLeaveRequest'
    | 'cancelLeaveRequest'
    | 'listLeaveRequests'
    | 'getLeaveRequest'
    | 'getLeaveBalance'
    | 'ensureEmployeeBalances'
    | 'createLeaveBalance'
>;

export interface LeaveServiceProvider {
    service: LeaveServiceContract;
}

export const defaultLeaveServiceProvider: LeaveServiceProvider = {
    service: getLeaveService(),
};
