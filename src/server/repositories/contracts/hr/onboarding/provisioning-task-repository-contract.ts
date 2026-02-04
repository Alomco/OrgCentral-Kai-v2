import type {
    ProvisioningTaskCreateInput,
    ProvisioningTaskRecord,
    ProvisioningTaskStatus,
    ProvisioningTaskUpdateInput,
} from '@/server/types/hr/provisioning-tasks';

export interface ProvisioningTaskListFilters {
    employeeId?: string;
    offboardingId?: string;
    status?: ProvisioningTaskStatus;
}

export interface IProvisioningTaskRepository {
    createTask(input: ProvisioningTaskCreateInput): Promise<ProvisioningTaskRecord>;
    updateTask(
        orgId: string,
        taskId: string,
        updates: ProvisioningTaskUpdateInput,
    ): Promise<ProvisioningTaskRecord>;
    getTask(orgId: string, taskId: string): Promise<ProvisioningTaskRecord | null>;
    listTasks(orgId: string, filters?: ProvisioningTaskListFilters): Promise<ProvisioningTaskRecord[]>;
}
