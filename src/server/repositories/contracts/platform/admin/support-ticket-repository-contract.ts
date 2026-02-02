import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { SupportTicket } from '@/server/types/platform/support-tickets';

export interface ISupportTicketRepository {
    listTickets(context: RepositoryAuthorizationContext): Promise<SupportTicket[]>;
    getTicket(context: RepositoryAuthorizationContext, ticketId: string): Promise<SupportTicket | null>;
    createTicket(context: RepositoryAuthorizationContext, ticket: SupportTicket): Promise<SupportTicket>;
    updateTicket(context: RepositoryAuthorizationContext, ticket: SupportTicket): Promise<SupportTicket>;
}
