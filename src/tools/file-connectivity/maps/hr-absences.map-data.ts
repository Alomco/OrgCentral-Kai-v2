export type Volatility = 'low' | 'medium' | 'high';

const schemaPath = 'prisma/modules/hr_ops.prisma';
const repoContractPath =
    'src/server/repositories/contracts/hr/absences/unplanned-absence-repository-contract.ts';
const repoImplPath = 'src/server/repositories/prisma/hr/absences/prisma-unplanned-absence-repository.ts';
const mapperPath = 'src/server/repositories/mappers/hr/absences/absences-mapper.ts';
const typePath = 'src/server/types/hr-ops-types.ts';
const schemaTypesPath = 'src/server/types/hr-absence-schemas.ts';
const securityPath = 'src/server/security/authorization/absences.ts';
const cacheLibraryPath = 'src/server/lib/cache-tags.ts';
const useCaseDirectory = 'src/server/use-cases/hr/absences';
const apiDirectory = 'src/server/api-adapters/hr/absences';
const routeBase = 'src/app/api/hr/absences';

const ABSENCE_USE_CASE_FILES = [
    'report-unplanned-absence.ts',
    'get-absences.ts',
    'approve-unplanned-absence.ts',
    'update-unplanned-absence.ts',
    'record-return-to-work.ts',
    'add-absence-attachments.ts',
    'remove-absence-attachment.ts',
    'delete-unplanned-absence.ts',
];

const ROUTE_TO_CONTROLLER: Record<string, string[]> = {
    'route.ts': ['report-unplanned-absence.ts', 'get-absences.ts'],
    '[absenceId]/route.ts': ['update-unplanned-absence.ts', 'delete-unplanned-absence.ts'],
    '[absenceId]/approve/route.ts': ['approve-unplanned-absence.ts'],
    '[absenceId]/return-to-work/route.ts': ['record-return-to-work.ts'],
    '[absenceId]/attachments/route.ts': ['add-absence-attachments.ts', 'remove-absence-attachment.ts'],
};

const CORE_PATHS = [
    schemaPath,
    repoContractPath,
    repoImplPath,
    mapperPath,
    typePath,
    schemaTypesPath,
    securityPath,
    cacheLibraryPath,
];

const HR_ABSENCE_DOMAIN = 'hr-absences';

export {
    ABSENCE_USE_CASE_FILES,
    CORE_PATHS,
    HR_ABSENCE_DOMAIN,
    ROUTE_TO_CONTROLLER,
    apiDirectory,
    cacheLibraryPath,
    mapperPath,
    repoContractPath,
    repoImplPath,
    routeBase,
    schemaPath,
    schemaTypesPath,
    securityPath,
    typePath,
    useCaseDirectory,
};
