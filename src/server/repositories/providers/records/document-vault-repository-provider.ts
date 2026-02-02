import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import { PrismaDocumentVaultRepository } from '@/server/repositories/prisma/records/documents/prisma-document-vault-repository';

let sharedRepository: IDocumentVaultRepository | null = null;

export function getDocumentVaultRepository(): IDocumentVaultRepository {
    sharedRepository ??= new PrismaDocumentVaultRepository();
    return sharedRepository;
}
