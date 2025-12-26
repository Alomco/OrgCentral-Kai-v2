export type Volatility = 'low' | 'medium' | 'high';

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

const UC_SUBMIT_LEAVE_REQUEST = 'submit-leave-request.ts';
const UC_APPROVE_LEAVE_REQUEST = 'approve-leave-request.ts';
const UC_REJECT_LEAVE_REQUEST = 'reject-leave-request.ts';
const UC_CANCEL_LEAVE_REQUEST = 'cancel-leave-request.ts';
const UC_GET_LEAVE_REQUESTS = 'get-leave-requests.ts';
const UC_GET_LEAVE_REQUEST = 'get-leave-request.ts';
const UC_GET_LEAVE_BALANCE = 'get-leave-balance.ts';
const UC_ENSURE_EMPLOYEE_BALANCES = 'ensure-employee-balances.ts';
const UC_CREATE_LEAVE_BALANCE = 'create-leave-balance.ts';

const LEAVE_USE_CASE_FILES = [
    UC_SUBMIT_LEAVE_REQUEST,
    UC_APPROVE_LEAVE_REQUEST,
    UC_REJECT_LEAVE_REQUEST,
    UC_CANCEL_LEAVE_REQUEST,
    UC_GET_LEAVE_REQUESTS,
    UC_GET_LEAVE_REQUEST,
    UC_GET_LEAVE_BALANCE,
    UC_ENSURE_EMPLOYEE_BALANCES,
    UC_CREATE_LEAVE_BALANCE,
];

const ROUTE_TO_CONTROLLER: Record<string, string[]> = {
    'route.ts': [UC_GET_LEAVE_REQUESTS, UC_SUBMIT_LEAVE_REQUEST],
    '[requestId]/route.ts': [UC_GET_LEAVE_REQUEST],
    '[requestId]/approve/route.ts': [UC_APPROVE_LEAVE_REQUEST],
    '[requestId]/reject/route.ts': [UC_REJECT_LEAVE_REQUEST],
    '[requestId]/cancel/route.ts': [UC_CANCEL_LEAVE_REQUEST],
    'balances/route.ts': [UC_GET_LEAVE_BALANCE, UC_CREATE_LEAVE_BALANCE],
    'balances/ensure/route.ts': [UC_ENSURE_EMPLOYEE_BALANCES],
};

const LEAVE_DOMAIN = 'hr-leave';
const leaveUseCasePaths = LEAVE_USE_CASE_FILES.map((file) => `${useCaseDirectory}/${file}`);
const requestUseCases = [
    UC_SUBMIT_LEAVE_REQUEST,
    UC_APPROVE_LEAVE_REQUEST,
    UC_REJECT_LEAVE_REQUEST,
    UC_CANCEL_LEAVE_REQUEST,
    UC_GET_LEAVE_REQUEST,
    UC_GET_LEAVE_REQUESTS,
];
const balanceUseCases = [UC_GET_LEAVE_BALANCE, UC_ENSURE_EMPLOYEE_BALANCES, UC_CREATE_LEAVE_BALANCE];
const policyUseCases = [UC_SUBMIT_LEAVE_REQUEST, UC_ENSURE_EMPLOYEE_BALANCES, UC_CREATE_LEAVE_BALANCE];
const policyAccrualUseCases = [UC_ENSURE_EMPLOYEE_BALANCES, UC_CREATE_LEAVE_BALANCE];

export interface CoreEntry {
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

export {
    apiDirectory,
    balanceUseCases,
    cacheLibraryPath,
    coreEntries,
    leaveUseCasePaths,
    LEAVE_DOMAIN,
    LEAVE_USE_CASE_FILES,
    mapperPaths,
    policyAccrualUseCases,
    policyUseCases,
    repositoryContracts,
    repositoryImplementations,
    requestUseCases,
    routeBase,
    ROUTE_TO_CONTROLLER,
    schemaPath,
    schemaTypesPath,
    securityPath,
    servicePath,
    serviceProviderPath,
    typePath,
    useCaseDirectory,
};
