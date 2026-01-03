/**
 * Shared builder utilities for use-cases.
 * Provides reusable patterns for constructing complex objects.
 */

import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import type { OrgPermissionMap, OrgRoleKey } from '@/server/security/access-control';
import { resolveRoleTemplate } from '@/server/security/role-templates';

/**
 * Builds a repository authorization context.
 */
export interface BuildAuthContextOptions {
    orgId: string;
    userId: string;
    roleKey?: OrgRoleKey | 'custom';
    roleName?: string | null;
    roleId?: string | null;
    permissions?: OrgPermissionMap;
    dataResidency: DataResidencyZone;
    dataClassification: DataClassificationLevel;
    auditSource: string;
    auditBatchId?: string;
    correlationId?: string;
    tenantScope: {
        orgId: string;
        dataResidency: DataResidencyZone;
        dataClassification: DataClassificationLevel;
        auditSource: string;
        auditBatchId?: string;
    };
}

export function buildAuthorizationContext(
    options: BuildAuthContextOptions,
): RepositoryAuthorizationContext {
    const resolvedRoleKey = options.roleKey ?? 'custom';
    const permissions = options.permissions ??
        (resolvedRoleKey === 'custom' ? {} : resolveRoleTemplate(resolvedRoleKey).permissions);

    return {
        orgId: options.orgId,
        userId: options.userId,
        roleKey: resolvedRoleKey,
        roleName: options.roleName ?? undefined,
        roleId: options.roleId ?? undefined,
        permissions,
        dataResidency: options.dataResidency,
        dataClassification: options.dataClassification,
        auditSource: options.auditSource,
        auditBatchId: options.auditBatchId ?? options.tenantScope.auditBatchId ?? undefined,
        correlationId: options.correlationId ?? randomUUID(),
        tenantScope: options.tenantScope,
    };
}

/**
 * Builds Prisma JSON metadata object.
 */
export function buildMetadata(
    data: Record<string, unknown>,
): Prisma.JsonObject {
    return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
            key,
            value === undefined ? null : value,
        ]),
    ) as Prisma.JsonObject;
}

/**
 * Builds a consistent timestamp object for audit trails.
 */
export interface TimestampFields {
    createdAt: Date;
    updatedAt: Date;
}

export function buildTimestamps(now: Date = new Date()): TimestampFields {
    return {
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Builds an update timestamp field.
 */
export function buildUpdateTimestamp(now: Date = new Date()): Pick<TimestampFields, 'updatedAt'> {
    return { updatedAt: now };
}

/**
 * Generates a unique employee number with timestamp-based format.
 */
export function generateEmployeeNumber(prefix = 'EMP'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${timestamp.slice(-6).padStart(6, '0')}`;
}

/**
 * Generates a unique identifier with a prefix.
 */
export function generatePrefixedId(prefix: string): string {
    return `${prefix}-${randomUUID()}`;
}

/**
 * Builds a default value object for optional fields.
 */
export function buildDefaults<T extends Record<string, unknown>>(
    input: Partial<T>,
    defaults: T,
): T {
    return { ...defaults, ...input };
}

/**
 * Filters out undefined and null values from an object.
 */
export function compactObject<T extends Record<string, unknown>>(
    input: T,
): Partial<T> {
    return Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined && value !== null),
    ) as Partial<T>;
}

/**
 * Merges multiple objects, with later objects taking precedence.
 */
export function mergeObjects<T extends Record<string, unknown>>(
    ...objects: Partial<T>[]
): Partial<T> {
    return objects.reduce<Partial<T>>(
        (accumulator, current) => ({ ...accumulator, ...current }),
        {},
    );
}
