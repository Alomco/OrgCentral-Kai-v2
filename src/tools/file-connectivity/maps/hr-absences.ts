import { buildVectorCorpus, serializeVectorCorpus, type VectorBuilderInput } from '../vectorizer';
import {
    ABSENCE_USE_CASE_FILES,
    CORE_PATHS,
    HR_ABSENCE_DOMAIN,
    ROUTE_TO_CONTROLLER,
    apiDirectory,
    cacheLibraryPath,
    repoContractPath,
    routeBase,
    schemaTypesPath,
    securityPath,
    useCaseDirectory,
} from './hr-absences.map-data';
import {
    classifyPath,
    createRecord,
    deriveTags,
    getCoreRelations,
    summarizePath,
} from './hr-absences.map-helpers';

const records: VectorBuilderInput[] = [];

CORE_PATHS.forEach((path) => {
    records.push(
        createRecord({
            path,
            kind: classifyPath(path),
            summary: summarizePath(path),
            tags: deriveTags(path),
            volatility: path === schemaPath ? 'high' : 'medium',
            related: getCoreRelations(path),
            domain: HR_ABSENCE_DOMAIN,
        }),
    );
});

ABSENCE_USE_CASE_FILES.forEach((file) => {
    const useCasePath = `${useCaseDirectory}/${file}`;
    const controllerPath = `${apiDirectory}/${file}`;

    records.push(
        createRecord({
            path: useCasePath,
            kind: 'use-case',
            summary: `HR absence use-case ${file}`,
            tags: ['hr', 'absence', 'use-case'],
            volatility: 'medium',
            related: [repoContractPath, schemaTypesPath, cacheLibraryPath, securityPath],
            domain: HR_ABSENCE_DOMAIN,
        }),
    );

    records.push(
        createRecord({
            path: controllerPath,
            kind: 'api-controller',
            summary: `Controller delegating to ${file}`,
            tags: ['api', 'nextjs'],
            volatility: 'low',
            related: [useCasePath, schemaTypesPath],
            domain: HR_ABSENCE_DOMAIN,
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
            tags: ['nextjs', 'api'],
            volatility: 'low',
            related: controllers.map((file) => `${apiDirectory}/${file}`),
            domain: HR_ABSENCE_DOMAIN,
        }),
    );
});

export const hrAbsenceVectorCorpus = buildVectorCorpus({
    records,
});

export const hrAbsenceVectorJson = serializeVectorCorpus(hrAbsenceVectorCorpus);

