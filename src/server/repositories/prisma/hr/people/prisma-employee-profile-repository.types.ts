import type { Prisma, EmploymentType, HealthStatus } from '@prisma/client';

export interface EmployeeProfileFilters {
    orgId?: string;
    userId?: string;
    jobTitle?: string;
    employmentType?: EmploymentType;
    managerOrgId?: string;
    managerUserId?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface EmployeeProfileCreationData {
    orgId: string;
    userId: string;
    employeeNumber: string;
    jobTitle?: string;
    employmentType?: EmploymentType;
    startDate?: Date;
    endDate?: Date;
    managerOrgId?: string;
    managerUserId?: string;
    annualSalary?: number;
    hourlyRate?: number;
    costCenter?: string;
    location?: Prisma.InputJsonValue;
    niNumber?: string;
    emergencyContact?: Prisma.InputJsonValue;
    nextOfKin?: Prisma.InputJsonValue;
    healthStatus?: HealthStatus;
    workPermit?: Prisma.InputJsonValue;
    bankDetails?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
}

export interface EmployeeProfileUpdateData extends Partial<EmployeeProfileCreationData> {
    jobTitle?: string;
    employmentType?: EmploymentType;
    startDate?: Date;
    endDate?: Date;
    managerOrgId?: string;
    managerUserId?: string;
    annualSalary?: number;
    hourlyRate?: number;
    costCenter?: string;
    location?: Prisma.InputJsonValue;
    niNumber?: string;
    emergencyContact?: Prisma.InputJsonValue;
    nextOfKin?: Prisma.InputJsonValue;
    healthStatus?: HealthStatus;
    workPermit?: Prisma.InputJsonValue;
    bankDetails?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
}
