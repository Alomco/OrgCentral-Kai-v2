import { Prisma } from '@/server/types/prisma';
import type { PrismaClientInstance } from '@/server/types/prisma';
import { toPrismaInputJson, type JsonLike } from '@/server/repositories/prisma/helpers/prisma-utils';
import { ValidationError } from '@/server/errors';
import type { ZodType } from 'zod';

export interface PlatformJsonStoreDependencies {
    prisma: PrismaClientInstance;
}

export async function loadPlatformSettingJson<TValue>(
    deps: PlatformJsonStoreDependencies,
    key: string,
    schema: ZodType<TValue>,
    fallback: TValue,
): Promise<TValue> {
    const record = await deps.prisma.platformSetting.findUnique({ where: { id: key } });
    if (!record?.metadata) {
        return fallback;
    }

    const parsed = schema.safeParse(record.metadata);
    if (!parsed.success) {
        return fallback;
    }

    return parsed.data;
}

export async function savePlatformSettingJson(
    deps: PlatformJsonStoreDependencies,
    key: string,
    value: unknown,
): Promise<void> {
    const metadata = toPrismaInputJson(value as JsonLike) ?? Prisma.JsonNull;

    if (!metadata) {
        throw new ValidationError('Unable to persist platform metadata.');
    }

    await deps.prisma.platformSetting.upsert({
        where: { id: key },
        create: { id: key, metadata },
        update: { metadata },
    });
}
