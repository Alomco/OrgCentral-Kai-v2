import type { ComplianceTemplate, ComplianceTemplateItem } from '@/server/types/compliance-types';
import type { Prisma } from '@prisma/client';

export interface ComplianceTemplateCreateInput {
    orgId: string;
    name: string;
    items: ComplianceTemplateItem[];
    categoryKey?: string;
    version?: string;
    metadata?: Prisma.JsonValue;
}

export interface ComplianceTemplateUpdateInput {
    name?: string;
    items?: ComplianceTemplateItem[];
    categoryKey?: string;
    version?: string;
    metadata?: Prisma.JsonValue;
}

export interface IComplianceTemplateRepository {
    createTemplate(input: ComplianceTemplateCreateInput): Promise<ComplianceTemplate>;
    updateTemplate(orgId: string, templateId: string, updates: ComplianceTemplateUpdateInput): Promise<ComplianceTemplate>;
    deleteTemplate(orgId: string, templateId: string): Promise<void>;
    getTemplate(orgId: string, templateId: string): Promise<ComplianceTemplate | null>;
    listTemplates(orgId: string): Promise<ComplianceTemplate[]>;
}
