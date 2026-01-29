import { ValidationError } from "@/server/errors";
import { readJson } from "@/server/api-adapters/http/request-utils";

function normalizeCategoryQuery(value?: string) {
    if (!value) {return undefined;}
    const k = value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const map: Record<string, typeof import("@/server/services/hr/policies/hr-policy-schemas").POLICY_CATEGORY_VALUES[number]> = {
        // Benefits
        benefits: "BENEFITS",
        benefit: "BENEFITS",
        beneficios: "BENEFITS",
        // Code of Conduct / Ethics / Behaviour
        codeofconduct: "CODE_OF_CONDUCT",
        conduct: "CODE_OF_CONDUCT",
        ethics: "CODE_OF_CONDUCT",
        behaviour: "CODE_OF_CONDUCT",
        behavior: "CODE_OF_CONDUCT",
        codigoodeconducta: "CODE_OF_CONDUCT",
        // IT Security / Security
        itsecurity: "IT_SECURITY",
        itsafety: "IT_SECURITY",
        security: "IT_SECURITY",
        seguridad: "IT_SECURITY",
        securite: "IT_SECURITY",
        // Health & Safety
        healthsafety: "HEALTH_SAFETY",
        safety: "HEALTH_SAFETY",
        health: "HEALTH_SAFETY",
        salud: "HEALTH_SAFETY",
        sante: "HEALTH_SAFETY",
        // HR Policies / Procedures / Compliance / Other
        hrpolicies: "HR_POLICIES",
        hrpolicy: "HR_POLICIES",
        procedures: "PROCEDURES",
        procedure: "PROCEDURES",
        compliance: "COMPLIANCE",
        other: "OTHER",
    };
    return map[k];
}

import {
    assignHrPolicyController,
    createHrPolicyController,
    getHrPolicyController,
    listHrPoliciesController,
    updateHrPolicyController,
} from "@/server/api-adapters/hr/policies";

import { isRecord } from "./utils";

const POLICY_ID_REQUIRED_MESSAGE = "Policy id is required.";

export function listHrPoliciesRouteController(request: Request) {
    const url = new URL(request.url);

    const status = url.searchParams.get("status") ?? undefined;
    const categoryRaw = url.searchParams.get("category") ?? undefined;
    const q = url.searchParams.get("q") ?? undefined;
    const noCat = (url.searchParams.get("nocat") ?? "").toLowerCase();
    const disableAutoCategory = noCat === "1" || noCat === "true";
    const category = categoryRaw ?? (disableAutoCategory ? undefined : normalizeCategoryQuery(q));
    const filters = status || category || q ? { status, category, q } : undefined;

    return listHrPoliciesController({
        headers: request.headers,
        input: { filters },
        auditSource: "api:hr:policies:list",
    });
}

export async function createHrPolicyRouteController(request: Request) {
    return createHrPolicyController({
        headers: request.headers,
        input: await readJson(request),
        auditSource: "api:hr:policies:create",
    });
}

export function getHrPolicyRouteController(request: Request, policyId: string) {
    if (!policyId) {
        throw new ValidationError(POLICY_ID_REQUIRED_MESSAGE);
    }

    return getHrPolicyController({
        headers: request.headers,
        input: { policyId },
        auditSource: "api:hr:policies:get",
    });
}

export async function updateHrPolicyRouteController(request: Request, policyId: string) {
    if (!policyId) {
        throw new ValidationError(POLICY_ID_REQUIRED_MESSAGE);
    }

    const body: unknown = await readJson(request);

    return updateHrPolicyController({
        headers: request.headers,
        input: {
            ...(isRecord(body) ? body : {}),
            policyId,
        },
        auditSource: "api:hr:policies:update",
    });
}

export async function assignHrPolicyRouteController(request: Request, policyId: string) {
    if (!policyId) {
        throw new ValidationError(POLICY_ID_REQUIRED_MESSAGE);
    }

    const body: unknown = await readJson(request);

    return assignHrPolicyController({
        headers: request.headers,
        input: {
            ...(isRecord(body) ? body : {}),
            policyId,
        },
        auditSource: "api:hr:policies:assign",
    });
}
