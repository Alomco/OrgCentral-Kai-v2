import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { appLogger } from '@/server/logging/structured-logger';
import { getTenantScopedModelConfig, type TenantScopedModelConfig } from '@/server/lib/prisma-tenant-scope';
import {
    enforceCreateScope,
    enforceStrictReadScope,
    enforceUpsertScope,
    isInputRecord,
    normalizeDataItems,
    setDefaultComplianceFields,
} from '@/server/lib/prisma-tenant-guards';

export type PrismaInputValue = Prisma.InputJsonValue | Date | null | undefined;
export interface PrismaInputRecord {
    [key: string]: PrismaInputValue | PrismaInputRecord | PrismaInputRecord[];
}
export interface PrismaOperationArguments {
    data?: PrismaInputRecord | PrismaInputRecord[];
    where?: PrismaInputRecord;
    create?: PrismaInputRecord;
}

type PrismaLogEvent = 'warn' | 'error' | 'query';
type PrismaClientInstance = PrismaClient<Prisma.PrismaClientOptions, PrismaLogEvent>;

const globalScope = globalThis as { prisma?: PrismaClientInstance };

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to initialize Prisma Client.');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const enableQueryDebug = process.env.PRISMA_QUERY_DEBUG === 'true';

const logDefinitions: Prisma.LogDefinition[] = [
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
];
if (enableQueryDebug) {
    logDefinitions.push({ level: 'query', emit: 'event' });
}

export const prisma = globalScope.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalScope.prisma = prisma;
}

function createPrismaClient(): PrismaClientInstance {
    const client = new PrismaClient<Prisma.PrismaClientOptions, PrismaLogEvent>({
        adapter,
        log: logDefinitions,
    });

    client.$on('warn', (event) => {
        appLogger.warn('prisma.warn', {
            message: normalizePrismaLogMessage(event.message),
            target: event.target,
            timestamp: event.timestamp,
        });
    });

    client.$on('error', (event) => {
        appLogger.error('prisma.error', {
            message: normalizePrismaLogMessage(event.message),
            target: event.target,
            timestamp: event.timestamp,
        });
    });

    if (enableQueryDebug) {
        client.$on('query', (event) => {
            const paramsLength = typeof event.params === 'string' ? event.params.length : 0;
            appLogger.debug('prisma.query', {
                target: event.target,
                query: event.query,
                paramsRedacted: true,
                paramsLength,
                durationMs: event.duration,
                timestamp: event.timestamp,
            });
        });
    }

    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const modelConfig = getTenantScopedModelConfig(model);
                    if (!modelConfig) {
                        return query(args);
                    }

                    const operationArguments = args as PrismaOperationArguments | undefined;
                    enforceOrgScope(modelConfig, operationArguments, model, operation);

                    if (operation === 'create' || operation === 'createMany' || operation === 'upsert') {
                        applyComplianceDefaults(modelConfig, operationArguments, operation);
                    }

                    return query(args);
                },
            },
        },
    }) as PrismaClientInstance;
}

function normalizePrismaLogMessage(message: unknown): string {
    if (typeof message === 'string') {
        return message;
    }

    if (message instanceof Error) {
        return message.message;
    }

    try {
        return JSON.stringify(message);
    } catch {
        return String(message);
    }
}

function enforceOrgScope(
    config: TenantScopedModelConfig,
    args: PrismaOperationArguments | undefined,
    model: string,
    action: Prisma.PrismaAction,
): void {
    if (!args || config.scopePolicy === 'none') {
        return;
    }

    if (action === 'create' || action === 'createMany') {
        enforceCreateScope(config, args, model, action);
        return;
    }

    if (action === 'upsert') {
        enforceUpsertScope(config, args, model, action);
        return;
    }

    if (config.scopePolicy !== 'strict') {
        return;
    }

    enforceStrictReadScope(config, args.where, model, action);
}

function applyComplianceDefaults(
    config: TenantScopedModelConfig,
    args: PrismaOperationArguments | undefined,
    action: Prisma.PrismaAction,
): void {
    if (!args) {
        return;
    }
    if (action === 'upsert') {
        const createData = args.create;
        if (createData && isInputRecord(createData)) {
            setDefaultComplianceFields(createData, config);
            args.create = createData;
        }
        return;
    }

    const dataItems = normalizeDataItems(args.data);
    if (dataItems.length === 0) {
        return;
    }

    dataItems.forEach((item) => setDefaultComplianceFields(item, config));

    if (Array.isArray(args.data)) {
        args.data = dataItems;
    } else {
        args.data = dataItems[0];
    }
}

