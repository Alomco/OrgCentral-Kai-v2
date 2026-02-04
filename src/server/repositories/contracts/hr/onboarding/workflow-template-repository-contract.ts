import type {
    OnboardingWorkflowRunCreateInput,
    OnboardingWorkflowRunRecord,
    OnboardingWorkflowRunUpdateInput,
    OnboardingWorkflowTemplateCreateInput,
    OnboardingWorkflowTemplateRecord,
    OnboardingWorkflowTemplateUpdateInput,
    WorkflowTemplateType,
} from '@/server/types/hr/onboarding-workflow-templates';

export interface WorkflowTemplateListFilters {
    templateType?: WorkflowTemplateType;
    isActive?: boolean;
}

export interface WorkflowRunListFilters {
    employeeId?: string;
    templateId?: string;
    status?: OnboardingWorkflowRunRecord['status'];
}

export interface IOnboardingWorkflowTemplateRepository {
    createTemplate(input: OnboardingWorkflowTemplateCreateInput): Promise<OnboardingWorkflowTemplateRecord>;
    updateTemplate(
        orgId: string,
        templateId: string,
        updates: OnboardingWorkflowTemplateUpdateInput,
    ): Promise<OnboardingWorkflowTemplateRecord>;
    getTemplate(orgId: string, templateId: string): Promise<OnboardingWorkflowTemplateRecord | null>;
    listTemplates(orgId: string, filters?: WorkflowTemplateListFilters): Promise<OnboardingWorkflowTemplateRecord[]>;
}

export interface IOnboardingWorkflowRunRepository {
    createRun(input: OnboardingWorkflowRunCreateInput): Promise<OnboardingWorkflowRunRecord>;
    updateRun(
        orgId: string,
        runId: string,
        updates: OnboardingWorkflowRunUpdateInput,
    ): Promise<OnboardingWorkflowRunRecord>;
    getRun(orgId: string, runId: string): Promise<OnboardingWorkflowRunRecord | null>;
    listRuns(orgId: string, filters?: WorkflowRunListFilters): Promise<OnboardingWorkflowRunRecord[]>;
}
