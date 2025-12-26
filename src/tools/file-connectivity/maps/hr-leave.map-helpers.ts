import type { VectorBuilderInput } from '../vectorizer';
import {
    apiDirectory,
    balanceUseCases,
    cacheLibraryPath,
    leaveUseCasePaths,
    mapperPaths,
    policyAccrualUseCases,
    policyUseCases,
    repositoryContracts,
    repositoryImplementations,
    requestUseCases,
    schemaPath,
    schemaTypesPath,
    securityPath,
    servicePath,
    serviceProviderPath,
    typePath,
    useCaseDirectory,
} from './hr-leave.map-data';

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

export function relatedContractsForUseCase(file: string): string[] {
    if (requestUseCases.includes(file)) {
        return [repositoryContracts.request];
    }
    if (balanceUseCases.includes(file)) {
        return [repositoryContracts.balance];
    }
    if (policyUseCases.includes(file)) {
        return [repositoryContracts.policy];
    }
    if (policyAccrualUseCases.includes(file)) {
        return [repositoryContracts.policyAccrual];
    }
    return [];
}

export function getCoreRelations(path: string): string[] {
    if (path === repositoryContracts.request) {
        return [repositoryImplementations.request, ...pathsForFiles(requestUseCases)];
    }
    if (path === repositoryContracts.balance) {
        return [repositoryImplementations.balance, ...pathsForFiles(balanceUseCases)];
    }
    if (path === repositoryContracts.policy) {
        return [repositoryImplementations.policy, ...pathsForFiles(policyUseCases)];
    }
    if (path === repositoryContracts.policyAccrual) {
        return [repositoryImplementations.policyAccrual, ...pathsForFiles(policyAccrualUseCases)];
    }
    if (Object.values(repositoryImplementations).includes(path)) {
        return [schemaPath, ...mapperPaths];
    }
    if (mapperPaths.includes(path)) {
        return [typePath];
    }
    if (path === schemaTypesPath) {
        return [typePath, ...requestUseCases.map((file) => `${apiDirectory}/${file}`)];
    }
    if (path === securityPath || path === cacheLibraryPath) {
        return leaveUseCasePaths;
    }
    if (path === servicePath) {
        return [serviceProviderPath, ...leaveUseCasePaths];
    }
    if (path === serviceProviderPath) {
        return [servicePath, ...Object.values(repositoryImplementations)];
    }
    if (path === typePath) {
        return [schemaPath, ...leaveUseCasePaths];
    }
    return [];
}

export function pathsForFiles(files: string[]): string[] {
    return files.map((file) => `${useCaseDirectory}/${file}`);
}
