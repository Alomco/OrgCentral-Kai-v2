import { buildVectorCorpus, serializeVectorCorpus, type VectorBuilderInput } from '../vectorizer';
import {
    apiDirectory,
    cacheLibraryPath,
    coreEntries,
    LEAVE_DOMAIN,
    LEAVE_USE_CASE_FILES,
    ROUTE_TO_CONTROLLER,
    routeBase,
    schemaTypesPath,
    securityPath,
    servicePath,
    typePath,
    useCaseDirectory,
} from './hr-leave.map-data';
import { createRecord, getCoreRelations, relatedContractsForUseCase } from './hr-leave.map-helpers';

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
            related: [typePath, schemaTypesPath, cacheLibraryPath, securityPath, ...relatedContractsForUseCase(file)],
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
