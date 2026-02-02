import { z } from 'zod';
import { documentVaultListQuerySchema } from '@/server/types/records/document-vault-schemas';

export const adminDocumentVaultListQuerySchema = documentVaultListQuerySchema.extend({
    tenantId: z.uuid().optional(),
    breakGlassApprovalId: z.uuid().optional(),
});

export const adminDocumentVaultDownloadQuerySchema = z.object({
    tenantId: z.uuid(),
    breakGlassApprovalId: z.uuid(),
});

export type AdminDocumentVaultListQuery = z.infer<typeof adminDocumentVaultListQuerySchema>;
export type AdminDocumentVaultDownloadQuery = z.infer<typeof adminDocumentVaultDownloadQuerySchema>;

export function parseAdminDocumentVaultListQuery(input: unknown): AdminDocumentVaultListQuery {
    return adminDocumentVaultListQuerySchema.parse(input);
}

export function parseAdminDocumentVaultDownloadQuery(input: unknown): AdminDocumentVaultDownloadQuery {
    return adminDocumentVaultDownloadQuerySchema.parse(input);
}
