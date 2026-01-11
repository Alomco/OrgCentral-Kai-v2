import { type RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { DocumentExpiryPayload } from './document-expiry.types';
import {
    buildDocumentExpiryDependencies,
    processDocumentExpiry,
    type DocumentExpiryDependencies,
    type DocumentExpiryResult,
} from '@/server/use-cases/hr/compliance/process-document-expiry';

export class DocumentExpiryProcessor {
    private readonly deps: DocumentExpiryDependencies;

    constructor(deps: Partial<DocumentExpiryDependencies> = {}) {
        this.deps = buildDocumentExpiryDependencies(deps);
    }

    async process(
        payload: DocumentExpiryPayload,
        context: RepositoryAuthorizationContext,
    ): Promise<DocumentExpiryResult> {
        return processDocumentExpiry(this.deps, {
            authorization: context,
            payload,
        });
    }
}
