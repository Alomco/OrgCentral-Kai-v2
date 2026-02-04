import type {
    DocumentTemplateCreateInput,
    DocumentTemplateRecord,
    DocumentTemplateUpdateInput,
} from '@/server/types/records/document-templates';

export interface DocumentTemplateListFilters {
    isActive?: boolean;
    type?: DocumentTemplateRecord['type'];
}

export interface IDocumentTemplateRepository {
    createTemplate(input: DocumentTemplateCreateInput): Promise<DocumentTemplateRecord>;
    updateTemplate(
        orgId: string,
        templateId: string,
        updates: DocumentTemplateUpdateInput,
    ): Promise<DocumentTemplateRecord>;
    getTemplate(orgId: string, templateId: string): Promise<DocumentTemplateRecord | null>;
    listTemplates(orgId: string, filters?: DocumentTemplateListFilters): Promise<DocumentTemplateRecord[]>;
}
