import type { Prisma } from '../../../../../generated/client';
import type { ContractTypeCode } from '@/server/types/hr/people';

export interface EmploymentContractFilters {
    orgId?: string;
    userId?: string;
    contractType?: ContractTypeCode;
    departmentId?: string;
    active?: boolean;
    startDate?: string;
    endDate?: string;
}

export type EmploymentContractCreationData = Prisma.EmploymentContractUncheckedCreateInput;
export type EmploymentContractUpdateData = Prisma.EmploymentContractUncheckedUpdateInput;
