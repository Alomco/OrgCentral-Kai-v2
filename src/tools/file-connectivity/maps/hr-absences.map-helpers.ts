import type { VectorBuilderInput } from '../vectorizer';
import {
    ABSENCE_USE_CASE_FILES,
    apiDirectory,
    cacheLibraryPath,
    mapperPath,
    repoContractPath,
    repoImplPath,
    schemaPath,
    schemaTypesPath,
    securityPath,
    typePath,
    useCaseDirectory,
} from './hr-absences.map-data';

export function createRecord(options: {
    path: string;
    kind: string;
    summary: string;
    tags?: string[];
    volatility?: string;
    related?: string[];
    domain?: string;
}): VectorBuilderInput {
    const features = buildFeatures(options.path, options.kind, options.tags);
    return {
        path: options.path,
        metadata: {
            kind: options.kind,
            summary: options.summary,
            tags: options.tags,
            volatility: options.volatility,
        },
        features,
        related: options.related,
        domain: options.domain,
    };
}

export function buildFeatures(path: string, kind: string, tags: string[] = []): { key: string; weight?: number }[] {
    const directory = path.split('/').slice(0, -1).join('/') || '.';
    const filename = path.split('/').pop() ?? path;
    const extension = filename.split('.').pop() ?? '';
    const directoryTokens = directory.split('/');

    const baseFeatures = [
        { key: `kind:${kind}`, weight: 1.5 },
        { key: `ext:${extension}` },
        { key: `dir:${directory}` },
        ...directoryTokens.map((token) => ({ key: `segment:${token}` })),
        { key: `file:${filename}`, weight: 1.2 },
    ];

    const tagFeatures = tags.map((tag) => ({ key: `tag:${tag}`, weight: 0.8 }));
    return [...baseFeatures, ...tagFeatures];
}

export function classifyPath(path: string): string {
    if (path.startsWith('prisma')) {
        return 'schema';
    }
    if (path.includes('/repositories/prisma/')) {
        return 'repository';
    }
    if (path.includes('/repositories/contracts/')) {
        return 'repository-contract';
    }
    if (path.includes('/mappers/')) {
        return 'mapper';
    }
    if (path.includes('/types/')) {
        return 'type';
    }
    if (path.includes('/security/')) {
        return 'security';
    }
    if (path.includes('/lib/cache')) {
        return 'cache';
    }
    if (path.includes('/use-cases/')) {
        return 'use-case';
    }
    if (path.includes('/api-adapters/')) {
        return 'api-controller';
    }
    if (path.includes('/app/api/')) {
        return 'route';
    }
    return 'other';
}

export function summarizePath(path: string): string {
    if (path === schemaPath) {
        return 'HR Ops Prisma schema definitions';
    }
    if (path === repoContractPath) {
        return 'Repository interface for unplanned absences';
    }
    if (path === repoImplPath) {
        return 'Prisma implementation of unplanned absences repository';
    }
    if (path === mapperPath) {
        return 'Mapper translating Prisma records to domain absences';
    }
    if (path === typePath) {
        return 'Absence domain type declarations';
    }
    if (path === schemaTypesPath) {
        return 'Zod schemas for absence payloads';
    }
    if (path === securityPath) {
        return 'Authorization helpers for absence actions';
    }
    if (path === cacheLibraryPath) {
        return 'Cache tag utilities for absences';
    }
    return `Connectivity record for ${path}`;
}

export function deriveTags(path: string): string[] {
    if (path.startsWith('prisma')) {
        return ['prisma', 'db'];
    }
    if (path.includes('/repositories/prisma/')) {
        return ['prisma', 'repository'];
    }
    if (path.includes('/repositories/contracts/')) {
        return ['contract', 'repository'];
    }
    if (path.includes('/use-cases/')) {
        return ['use-case'];
    }
    if (path.includes('/api-adapters/')) {
        return ['api', 'controller'];
    }
    if (path.includes('/app/api/')) {
        return ['nextjs', 'route'];
    }
    if (path.includes('/types/')) {
        return ['types'];
    }
    if (path.includes('/security/')) {
        return ['security'];
    }
    if (path.includes('/lib/cache')) {
        return ['cache'];
    }
    return ['other'];
}

export function getCoreRelations(path: string): string[] {
    if (path === repoContractPath) {
        return [repoImplPath, `${useCaseDirectory}/get-absences.ts`, `${useCaseDirectory}/update-unplanned-absence.ts`];
    }
    if (path === repoImplPath) {
        return [schemaPath, mapperPath];
    }
    if (path === mapperPath) {
        return [typePath];
    }
    if (path === schemaTypesPath) {
        return [typePath, ...ABSENCE_USE_CASE_FILES.map((file) => `${apiDirectory}/${file}`)];
    }
    if (path === securityPath) {
        return ABSENCE_USE_CASE_FILES.map((file) => `${useCaseDirectory}/${file}`);
    }
    if (path === cacheLibraryPath) {
        return ABSENCE_USE_CASE_FILES.map((file) => `${useCaseDirectory}/${file}`);
    }
    return [];
}
