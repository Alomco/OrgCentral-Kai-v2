import { authorizePlatformRequest } from '@/server/api-adapters/platform/admin/authorize-platform-request';
import {
    listBillingPlansService,
    createBillingPlanService,
    updateBillingPlanService,
    assignBillingPlanService,
    listBillingAssignmentsService,
} from '@/server/services/platform/admin/billing-plan-service';
import type { BillingPlan, BillingPlanAssignment } from '@/server/types/platform/billing-plan';
import {
    parseBillingPlanCreate,
    parseBillingPlanUpdate,
    parseBillingPlanAssign,
} from '@/server/validators/platform/admin/billing-plan-validators';

interface BillingPlanListResponse {
    success: true;
    data: BillingPlan[];
}

interface BillingPlanResponse {
    success: true;
    data: BillingPlan;
}

interface BillingAssignmentListResponse {
    success: true;
    data: BillingPlanAssignment[];
}

interface BillingAssignmentResponse {
    success: true;
    data: BillingPlanAssignment;
}

export async function listBillingPlansController(request: Request): Promise<BillingPlanListResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformBillingPlans: ['read'] },
        auditSource: 'api:platform:billing:plans:list',
        action: 'list',
        resourceType: 'platformBillingPlan',
    });

    const data = await listBillingPlansService(authorization);
    return { success: true, data };
}

export async function createBillingPlanController(request: Request): Promise<BillingPlanResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformBillingPlans: ['create'] },
        auditSource: 'api:platform:billing:plans:create',
        action: 'create',
        resourceType: 'platformBillingPlan',
    });

    const payload = parseBillingPlanCreate(await request.json());
    const data = await createBillingPlanService(authorization, payload);
    return { success: true, data };
}

export async function updateBillingPlanController(request: Request): Promise<BillingPlanResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformBillingPlans: ['update'] },
        auditSource: 'api:platform:billing:plans:update',
        action: 'update',
        resourceType: 'platformBillingPlan',
    });

    const payload = parseBillingPlanUpdate(await request.json());
    const data = await updateBillingPlanService(authorization, payload);
    return { success: true, data };
}

export async function listBillingAssignmentsController(request: Request): Promise<BillingAssignmentListResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformBillingPlans: ['read'] },
        auditSource: 'api:platform:billing:assignments:list',
        action: 'list',
        resourceType: 'platformBillingAssignment',
    });

    const data = await listBillingAssignmentsService(authorization);
    return { success: true, data };
}

export async function assignBillingPlanController(request: Request): Promise<BillingAssignmentResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformBillingPlans: ['assign'] },
        auditSource: 'api:platform:billing:assignments:create',
        action: 'assign',
        resourceType: 'platformBillingAssignment',
    });

    const payload = parseBillingPlanAssign(await request.json());
    const data = await assignBillingPlanService(authorization, payload);
    return { success: true, data };
}
