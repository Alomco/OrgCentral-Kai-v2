/**
 * Prisma Repository implementation template.
 * Copy and rename to the appropriate domain (prisma/<domain>/...) and adapt to your model.
 */
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { getCustomDelegate } from '@/server/repositories/prisma/helpers/prisma-utils';
// Replace with your contract and mapper imports
export interface ExampleDomainType { id: string; orgId?: string }
export interface ExamplePrismaModel { id: string; orgId?: string }
export interface IExampleRepository {
    findById(id: string): Promise<ExampleDomainType | null>;
    findAll(filters?: { orgId?: string }): Promise<ExampleDomainType[]>;
    create(data: Partial<ExampleDomainType>): Promise<void>;
    update(id: string, data: Partial<ExampleDomainType>): Promise<void>;
    delete(id: string): Promise<void>;
}

interface ExampleDelegate {
    findUnique(args: { where: { id: string } }): Promise<ExamplePrismaModel | null>;
    findMany(args: { where?: { orgId?: string } }): Promise<ExamplePrismaModel[]>;
    create(args: { data: Record<string, unknown> }): Promise<ExamplePrismaModel>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<ExamplePrismaModel>;
    delete(args: { where: { id: string } }): Promise<void>;
}

export class PrismaExampleRepository extends BasePrismaRepository implements IExampleRepository {
    private delegate(): ExampleDelegate {
        return getCustomDelegate<ExampleDelegate>(this.prisma as unknown as Record<string, ExampleDelegate>, 'example');
    }

    async findById(id: string): Promise<ExampleDomainType | null> {
        const rec = await this.delegate().findUnique({ where: { id } });
        if (!rec) { return null; }
        return rec as ExampleDomainType;
    }

    async findAll(filters?: { orgId?: string }): Promise<ExampleDomainType[]> {
        const where: { orgId?: string } = {};
        if (filters?.orgId) { where.orgId = filters.orgId; }
        const recs = await this.delegate().findMany({ where });
        return recs as ExampleDomainType[];
    }

    async create(data: Partial<ExampleDomainType>): Promise<void> {
        await this.delegate().create({ data: data as Record<string, unknown> });
    }

    async update(id: string, data: Partial<ExampleDomainType>): Promise<void> {
        await this.delegate().update({ where: { id }, data: data as Record<string, unknown> });
    }

    async delete(id: string): Promise<void> {
        await this.delegate().delete({ where: { id } });
    }
}
