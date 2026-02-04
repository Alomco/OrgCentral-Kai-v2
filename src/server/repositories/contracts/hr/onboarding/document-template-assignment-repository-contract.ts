import type {
    DocumentTemplateAssignmentCreateInput,
    DocumentTemplateAssignmentRecord,
    DocumentTemplateAssignmentUpdateInput,
} from '@/server/types/hr/document-template-assignments';

export interface DocumentTemplateAssignmentListFilters {
    employeeId?: string;
    templateId?: string;
}

export interface IDocumentTemplateAssignmentRepository {
    createAssignment(input: DocumentTemplateAssignmentCreateInput): Promise<DocumentTemplateAssignmentRecord>;
    updateAssignment(
        orgId: string,
        assignmentId: string,
        updates: DocumentTemplateAssignmentUpdateInput,
    ): Promise<DocumentTemplateAssignmentRecord>;
    getAssignment(orgId: string, assignmentId: string): Promise<DocumentTemplateAssignmentRecord | null>;
    listAssignments(
        orgId: string,
        filters?: DocumentTemplateAssignmentListFilters,
    ): Promise<DocumentTemplateAssignmentRecord[]>;
}
