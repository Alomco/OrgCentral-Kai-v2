import type {
    EmailSequenceDeliveryCreateInput,
    EmailSequenceDeliveryRecord,
    EmailSequenceDeliveryUpdateInput,
    EmailSequenceEnrollmentCreateInput,
    EmailSequenceEnrollmentRecord,
    EmailSequenceEnrollmentUpdateInput,
    EmailSequenceStatus,
    EmailSequenceTemplateCreateInput,
    EmailSequenceTemplateRecord,
    EmailSequenceTemplateUpdateInput,
    EmailSequenceTrigger,
} from '@/server/types/hr/onboarding-email-sequences';

export interface EmailSequenceTemplateListFilters {
    trigger?: EmailSequenceTrigger;
    isActive?: boolean;
}

export interface EmailSequenceEnrollmentListFilters {
    employeeId?: string;
    invitationToken?: string;
    status?: EmailSequenceStatus;
}

export interface EmailSequenceDeliveryListFilters {
    enrollmentId?: string;
    status?: EmailSequenceDeliveryRecord['status'];
    dueBefore?: Date;
}

export interface IEmailSequenceTemplateRepository {
    createTemplate(input: EmailSequenceTemplateCreateInput): Promise<EmailSequenceTemplateRecord>;
    updateTemplate(
        orgId: string,
        templateId: string,
        updates: EmailSequenceTemplateUpdateInput,
    ): Promise<EmailSequenceTemplateRecord>;
    getTemplate(orgId: string, templateId: string): Promise<EmailSequenceTemplateRecord | null>;
    listTemplates(orgId: string, filters?: EmailSequenceTemplateListFilters): Promise<EmailSequenceTemplateRecord[]>;
}

export interface IEmailSequenceEnrollmentRepository {
    createEnrollment(input: EmailSequenceEnrollmentCreateInput): Promise<EmailSequenceEnrollmentRecord>;
    updateEnrollment(
        orgId: string,
        enrollmentId: string,
        updates: EmailSequenceEnrollmentUpdateInput,
    ): Promise<EmailSequenceEnrollmentRecord>;
    getEnrollment(orgId: string, enrollmentId: string): Promise<EmailSequenceEnrollmentRecord | null>;
    listEnrollments(orgId: string, filters?: EmailSequenceEnrollmentListFilters): Promise<EmailSequenceEnrollmentRecord[]>;
}

export interface IEmailSequenceDeliveryRepository {
    createDelivery(input: EmailSequenceDeliveryCreateInput): Promise<EmailSequenceDeliveryRecord>;
    updateDelivery(
        orgId: string,
        deliveryId: string,
        updates: EmailSequenceDeliveryUpdateInput,
    ): Promise<EmailSequenceDeliveryRecord>;
    listDeliveries(orgId: string, filters?: EmailSequenceDeliveryListFilters): Promise<EmailSequenceDeliveryRecord[]>;
}
