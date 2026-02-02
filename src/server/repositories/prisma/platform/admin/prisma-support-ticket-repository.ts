import type { ISupportTicketRepository } from '@/server/repositories/contracts/platform/admin/support-ticket-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { SupportTicket } from '@/server/types/platform/support-tickets';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { supportTicketSchema } from '@/server/validators/platform/admin/support-ticket-validators';
import { loadPlatformSettingJson, savePlatformSettingJson } from '@/server/repositories/prisma/platform/settings/platform-settings-json-store';

const SUPPORT_TICKETS_KEY = 'platform-support-tickets';

export class PrismaSupportTicketRepository extends BasePrismaRepository implements ISupportTicketRepository {
    async listTickets(context: RepositoryAuthorizationContext): Promise<SupportTicket[]> {
        const tickets = await loadPlatformSettingJson(
            { prisma: this.prisma },
            SUPPORT_TICKETS_KEY,
            supportTicketSchema.array(),
            [],
        );
        return tickets.filter((ticket) => ticket.orgId === context.orgId);
    }

    async getTicket(context: RepositoryAuthorizationContext, ticketId: string): Promise<SupportTicket | null> {
        const tickets = await this.listTickets(context);
        return tickets.find((ticket) => ticket.id === ticketId) ?? null;
    }

    async createTicket(context: RepositoryAuthorizationContext, ticket: SupportTicket): Promise<SupportTicket> {
        const tickets = await this.listTickets(context);
        const next = [ticket, ...tickets];
        await savePlatformSettingJson({ prisma: this.prisma }, SUPPORT_TICKETS_KEY, next);
        return ticket;
    }

    async updateTicket(context: RepositoryAuthorizationContext, ticket: SupportTicket): Promise<SupportTicket> {
        const tickets = await this.listTickets(context);
        const next = tickets.map((item) => (item.id === ticket.id ? ticket : item));
        await savePlatformSettingJson({ prisma: this.prisma }, SUPPORT_TICKETS_KEY, next);
        return ticket;
    }
}
