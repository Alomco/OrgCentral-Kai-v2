import { authorizePlatformRequest } from '@/server/api-adapters/platform/admin/authorize-platform-request';
import {
    listSupportTicketsService,
    createSupportTicketService,
    updateSupportTicketService,
} from '@/server/services/platform/admin/support-ticket-service';
import type { SupportTicket } from '@/server/types/platform/support-tickets';
import { parseSupportTicketCreate, parseSupportTicketUpdate } from '@/server/validators/platform/admin/support-ticket-validators';

interface SupportTicketListResponse {
    success: true;
    data: SupportTicket[];
}

interface SupportTicketResponse {
    success: true;
    data: SupportTicket;
}

export async function listSupportTicketsController(request: Request): Promise<SupportTicketListResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformSupport: ['read'] },
        auditSource: 'api:platform:support:list',
        action: 'list',
        resourceType: 'platformSupportTicket',
    });

    const data = await listSupportTicketsService(authorization);
    return { success: true, data };
}

export async function createSupportTicketController(request: Request): Promise<SupportTicketResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformSupport: ['create'] },
        auditSource: 'api:platform:support:create',
        action: 'create',
        resourceType: 'platformSupportTicket',
    });

    const payload = parseSupportTicketCreate(await request.json());
    const data = await createSupportTicketService(authorization, payload);
    return { success: true, data };
}

export async function updateSupportTicketController(request: Request): Promise<SupportTicketResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformSupport: ['update'] },
        auditSource: 'api:platform:support:update',
        action: 'update',
        resourceType: 'platformSupportTicket',
    });

    const payload = parseSupportTicketUpdate(await request.json());
    const data = await updateSupportTicketService(authorization, payload);
    return { success: true, data };
}
