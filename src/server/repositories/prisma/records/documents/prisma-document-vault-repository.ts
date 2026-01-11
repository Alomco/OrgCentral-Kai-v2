import type { DocumentVault, SecurityClassification } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import { getModelDelegate, toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { DocumentVaultFilters, DocumentVaultCreationData, DocumentVaultUpdateData } from './prisma-document-vault-repository.types';

export class PrismaDocumentVaultRepository extends BasePrismaRepository implements IDocumentVaultRepository {
  async findById(id: string): Promise<DocumentVault | null> {
    return getModelDelegate(this.prisma, 'documentVault').findUnique({
      where: { id },
    });
  }

  async findByBlobPointer(blobPointer: string): Promise<DocumentVault | null> {
    return getModelDelegate(this.prisma, 'documentVault').findFirst({ where: { blobPointer } });
  }

  async findAll(filters?: DocumentVaultFilters): Promise<DocumentVault[]> {
    const whereClause: Prisma.DocumentVaultWhereInput = {};

    if (filters?.orgId) {
      whereClause.orgId = filters.orgId;
    }

    if (filters?.ownerUserId) {
      whereClause.ownerUserId = filters.ownerUserId;
    }

    if (filters?.type) {
      whereClause.type = filters.type;
    }

    if (filters?.classification) {
      whereClause.classification = filters.classification as SecurityClassification;
    }

    if (filters?.retentionPolicy) {
      whereClause.retentionPolicy = filters.retentionPolicy;
    }

    if (filters?.fileName) {
      whereClause.fileName = { contains: filters.fileName, mode: 'insensitive' };
    }

    return getModelDelegate(this.prisma, 'documentVault').findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: DocumentVaultCreationData): Promise<DocumentVault> {
    return getModelDelegate(this.prisma, 'documentVault').create({
      data: {
        ...data,
        version: data.version ?? 1,
        encrypted: data.encrypted ?? false,
        sensitivityLevel: data.sensitivityLevel ?? 0,
        dataSubject: data.dataSubject ? toPrismaInputJson(data.dataSubject) as Prisma.InputJsonValue : undefined,
        metadata: data.metadata ? toPrismaInputJson(data.metadata) as Prisma.InputJsonValue : undefined,
      },
    });
  }

  async update(id: string, data: DocumentVaultUpdateData): Promise<DocumentVault> {
    const updateData = {
      ...data,
      dataSubject: data.dataSubject !== undefined ? (toPrismaInputJson(data.dataSubject) as Prisma.InputJsonValue) : undefined,
      metadata: data.metadata !== undefined ? (toPrismaInputJson(data.metadata) as Prisma.InputJsonValue) : undefined,
    };
    return getModelDelegate(this.prisma, 'documentVault').update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<DocumentVault> {
    return getModelDelegate(this.prisma, 'documentVault').delete({
      where: { id },
    });
  }
}
