import { buildVectorCorpus, serializeVectorCorpus, type VectorBuilderInput } from '../vectorizer';

type Volatility = 'low' | 'medium' | 'high';

const schemaPath = 'prisma/modules/hr.prisma';
const repositoryContracts = {
    request: 'src/server/repositories/contracts/hr/leave/leave-request-repository-contract.ts',
    balance: 'src/server/repositories/contracts/hr/leave/leave-balance-repository-contract.ts',
    policy: 'src/server/repositories/contracts/hr/leave/leave-policy-repository-contract.ts',
    policyAccrual: 'src/server/repositories/contracts/hr/leave/leave-policy-accrual-repository-contract.ts',
};
const repositoryImplementations = {
    request: 'src/server/repositories/prisma/hr/leave/prisma-leave-request-repository.ts',
    balance: 'src/server/repositories/prisma/hr/leave/prisma-leave-balance-repository.ts',
    policy: 'src/server/repositories/prisma/hr/leave/prisma-leave-policy-repository.ts',
    policyAccrual: 'src/server/repositories/prisma/hr/leave/prisma-leave-policy-accrual-repository.ts',
};
const mapperPaths = [
    'src/server/repositories/mappers/hr/leave/leave-mapper.ts',
    'src/server/repositories/mappers/hr/leave/leave-policy-mapper.ts',
];
const typePath = 'src/server/types/leave-types.ts';
const schemaTypesPath = 'src/server/types/hr-leave-schemas.ts';
const servicePath = 'src/server/services/hr/leave/leave-service.ts';
const serviceProviderPath = 'src/server/services/hr/leave/leave-service.provider.ts';
const securityPath = 'src/server/security/guards.ts';
const cacheLibraryPath = 'src/server/lib/cache-tags.ts';
const useCaseDirectory = 'src/server/use-cases/hr/leave';
const apiDirectory = 'src/server/api-adapters/hr/leave';
const routeBase = 'src/app/api/hr/leave';

const getFileName = (path: string): string => path.split('/').pop() ?? path;

const LEAVE_USE_CASE_FILES = [
    'submit-leave-request.ts',
    'approve-leave-request.ts',
    'reject-leave-request.ts',
    'cancel-leave-request.ts',
    'get-leave-requests.ts',
    'get-leave-request.ts',
    'get-leave-balance.ts',
    'ensure-employee-balances.ts',
    'create-leave-balance.ts',
];

const ROUTE_TO_CONTROLLER: Record<string, string[]> = {
    'route.ts': ['get-leave-requests.ts', 'submit-leave-request.ts'],
    '[requestId]/route.ts': ['get-leave-request.ts'],
    '[requestId]/approve/route.ts': ['approve-leave-request.ts'],
    '[requestId]/reject/route.ts': ['reject-leave-request.ts'],
    '[requestId]/cancel/route.ts': ['cancel-leave-request.ts'],
    'balances/route.ts': ['get-leave-balance.ts', 'create-leave-balance.ts'],
    'balances/ensure/route.ts': ['ensure-employee-balances.ts'],
};

const LEAVE_DOMAIN = 'hr-leave';
const leaveUseCasePaths = LEAVE_USE_CASE_FILES.map((file) => `${useCaseDirectory}/${file}`);
const requestUseCases = ['submit-leave-request.ts', 'approve-leave-request.ts', 'reject-leave-request.ts', 'cancel-leave-request.ts', 'get-leave-request.ts', 'get-leave-requests.ts'];
const balanceUseCases = ['get-leave-balance.ts', 'ensure-employee-balances.ts', 'create-leave-balance.ts'];
const policyUseCases = ['submit-leave-request.ts', 'ensure-employee-balances.ts', 'create-leave-balance.ts'];
const policyAccrualUseCases = ['ensure-employee-balances.ts', 'create-leave-balance.ts'];

interface CoreEntry {
    path: string;
    kind: string;
    summary: string;
    tags?: string[];
    volatility?: Volatility;
    related?: string[];
}

const coreEntries: CoreEntry[] = [
    {
        path: schemaPath,
        kind: 'schema',
        summary: 'HR Prisma module including leave tables and enums',
        tags: ['prisma', 'leave'],
        volatility: 'high',
    },
    ...Object.values(repositoryContracts).map((path) => ({
        path,
        kind: 'repository-contract',
        summary: `Leave repository contract ${getFileName(path)}`,
        tags: ['contract', 'repository', 'leave'],
        volatility: 'medium' as Volatility,
    })),
    ...Object.values(repositoryImplementations).map((path) => ({
        path,
        kind: 'repository',
        summary: `Prisma implementation ${getFileName(path)}`,
        tags: ['prisma', 'repository', 'leave'],
        volatility: 'medium' as Volatility,
    })),
    ...mapperPaths.map((path) => ({
        path,
        kind: 'mapper',
        summary: `Mapper for ${getFileName(path)}`,
        tags: ['mapper', 'leave'],
        volatility: 'medium' as Volatility,
    })),
    {
        path: typePath,
        kind: 'type',
        summary: 'Leave domain type declarations',
        tags: ['types', 'leave'],
        volatility: 'medium',
    },
    {
        path: schemaTypesPath,
        kind: 'schema-types',
        summary: 'Zod schemas for leave HTTP payloads',
        tags: ['schema', 'zod', 'leave'],
        volatility: 'medium',
    },
    {
        path: servicePath,
        kind: 'service',
        summary: 'Leave service orchestrating use-cases and notifications',
        tags: ['service', 'leave'],
        volatility: 'medium',
    },
    {
        path: serviceProviderPath,
        kind: 'service-provider',
        summary: 'Leave service provider wiring Prisma dependencies',
        tags: ['service', 'provider'],
        volatility: 'medium',
    },
    {
        path: securityPath,
        kind: 'security',
        summary: 'Guard utilities enforcing organization access',
        tags: ['security'],
        volatility: 'medium',
    },
    {
        path: cacheLibraryPath,
        kind: 'cache',
        summary: 'Cache tag utilities shared across leave flows',
        tags: ['cache'],
        volatility: 'medium',
    },
];

const records: VectorBuilderInput[] = [];

coreEntries.forEach((entry) => {
    records.push(
        createRecord({
            ...entry,
            related: getCoreRelations(entry.path),
            domain: LEAVE_DOMAIN,
        }),
    );
});

LEAVE_USE_CASE_FILES.forEach((file) => {
    const useCasePath = `${useCaseDirectory}/${file}`;
    const controllerPath = `${apiDirectory}/${file}`;
    records.push(
        createRecord({
            path: useCasePath,
            kind: 'use-case',
            summary: `Leave use-case ${file}`,
            tags: ['hr', 'leave', 'use-case'],
            volatility: 'medium',
            related: [
                typePath,
                schemaTypesPath,
                cacheLibraryPath,
                securityPath,
                ...relatedContractsForUseCase(file),
            ],
            domain: LEAVE_DOMAIN,
        }),
    );

    records.push(
        createRecord({
            path: controllerPath,
            kind: 'api-controller',
            summary: `HTTP controller delegating to ${file}`,
            tags: ['api', 'controller', 'leave'],
            volatility: 'low',
            related: [useCasePath, schemaTypesPath, servicePath],
            domain: LEAVE_DOMAIN,
        }),
    );
});

Object.entries(ROUTE_TO_CONTROLLER).forEach(([routeFile, controllers]) => {
    const routePath = `${routeBase}/${routeFile}`;
    records.push(
        createRecord({
            path: routePath,
            kind: 'route',
            summary: `Next.js route ${routeFile}`,
            tags: ['nextjs', 'api', 'leave'],
            volatility: 'low',
            related: controllers.map((file) => `${apiDirectory}/${file}`),
            domain: LEAVE_DOMAIN,
        }),
    );
});

export const hrLeaveVectorCorpus = buildVectorCorpus({
    records,
});

export const hrLeaveVectorJson = serializeVectorCorpus(hrLeaveVectorCorpus);

function createRecord(options: {
    path: string;
    kind: string;
    summary: string;
    tags?: string[];
    volatility?: Volatility;
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

function buildFeatures(path: string, kind: string, tags: string[] = []): { key: string; weight?: number }[] {
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

function relatedContractsForUseCase(file: string): string[] {
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

function getCoreRelations(path: string): string[] {
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
        return [typePath, ...LEAVE_USE_CASE_FILES.map((file) => `${apiDirectory}/${file}`)];
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

function pathsForFiles(files: string[]): string[] {
    return files.map((file) => `${useCaseDirectory}/${file}`);
}
