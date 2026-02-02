import { ValidationError } from '@/server/errors';

const ALLOWED_CONTENT_TYPES = new Set(['application/pdf']);
const DOCUMENT_VAULT_CONTENT_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const IMAGE_PREFIX = 'image/';

export function assertAllowedAttachmentContentType(contentType: string): void {
    const normalized = contentType.trim().toLowerCase();
    if (normalized.length === 0) {
        throw new ValidationError('Attachment content type is required.');
    }
    if (normalized.startsWith(IMAGE_PREFIX)) {
        return;
    }
    if (!ALLOWED_CONTENT_TYPES.has(normalized)) {
        throw new ValidationError('Attachments must be PDF or image files.');
    }
}

export function assertAttachmentSizeWithinLimit(fileSize: number, maxBytes: number): void {
    if (fileSize <= maxBytes) {
        return;
    }
    const maxFileSizeMb = Math.floor(maxBytes / 1024 / 1024).toString();
    throw new ValidationError(`Attachment exceeds maximum size of ${maxFileSizeMb} MB.`);
}

export function assertAllowedDocumentVaultContentType(contentType: string): void {
    const normalized = contentType.trim().toLowerCase();
    if (normalized.length === 0) {
        throw new ValidationError('Document content type is required.');
    }
    if (normalized.startsWith(IMAGE_PREFIX)) {
        return;
    }
    if (!DOCUMENT_VAULT_CONTENT_TYPES.has(normalized)) {
        throw new ValidationError('Documents must be PDF, DOC/DOCX, or image files.');
    }
}
