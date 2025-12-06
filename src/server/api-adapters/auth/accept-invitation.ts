import { z } from 'zod';
import { PrismaInvitationRepository } from '@/server/repositories/prisma/auth/invitations';
import { PrismaUserRepository } from '@/server/repositories/prisma/org/users';
import { PrismaMembershipRepository } from '@/server/repositories/prisma/org/membership';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import { PrismaChecklistTemplateRepository } from '@/server/repositories/prisma/hr/onboarding/prisma-checklist-template-repository';
import { PrismaChecklistInstanceRepository } from '@/server/repositories/prisma/hr/onboarding/prisma-checklist-instance-repository';
import { prisma } from '@/server/lib/prisma';
import {
    acceptInvitation,
    type AcceptInvitationDependencies,
    type AcceptInvitationResult,
} from '@/server/use-cases/auth/accept-invitation';

const invitationRepository = new PrismaInvitationRepository();
const userRepository = new PrismaUserRepository();
const membershipRepository = new PrismaMembershipRepository();
const organizationRepository = new PrismaOrganizationRepository({ prisma });
const employeeProfileRepository = new PrismaEmployeeProfileRepository();
const checklistTemplateRepository = new PrismaChecklistTemplateRepository();
const checklistInstanceRepository = new PrismaChecklistInstanceRepository();

const AcceptInvitationPayloadSchema = z.object({
    token: z.string().min(1, 'An invitation token is required'),
});

const AcceptInvitationActorSchema = z.object({
    userId: z.string().min(1, 'Authenticated user id is required'),
    email: z.email({ message: 'Authenticated user email is required' }),
});

const defaultDependencies: AcceptInvitationDependencies = {
    invitationRepository,
    userRepository,
    membershipRepository,
    organizationRepository,
    employeeProfileRepository,
    checklistTemplateRepository,
    checklistInstanceRepository,
};

export type AcceptInvitationPayload = z.infer<typeof AcceptInvitationPayloadSchema>;
export type AcceptInvitationActor = z.infer<typeof AcceptInvitationActorSchema>;

export async function acceptInvitationController(
    payload: unknown,
    actor: unknown,
    dependencies: AcceptInvitationDependencies = defaultDependencies,
): Promise<AcceptInvitationResult> {
    const { token } = AcceptInvitationPayloadSchema.parse(payload);
    const actorContext = AcceptInvitationActorSchema.parse(actor);

    return acceptInvitation(dependencies, {
        token,
        actor: actorContext,
    });
}
