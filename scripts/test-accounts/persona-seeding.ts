import type { PrismaClient } from '@prisma/client';
import { syncBetterAuthUserToPrisma } from '@/server/lib/auth-sync';
import { PERSONA_SEEDS } from './personas';
import { resolvePersonaEmail } from './config';
import {
    syncCredentialAccount,
    syncMembershipState,
    upsertAuthUser,
} from './persona-seeding.helpers';
import type {
    OrganizationActorMap,
    PersonaCatalogRecord,
    SeedRuntimeConfig,
    SeededOrgRecord,
} from './types';

type OrgMap = Record<SeededOrgRecord['key'], SeededOrgRecord>;

export async function seedPersonas(
    prisma: PrismaClient,
    orgs: OrgMap,
    config: SeedRuntimeConfig,
): Promise<{ catalog: PersonaCatalogRecord[]; actors: OrganizationActorMap }> {
    const catalog: PersonaCatalogRecord[] = [];
    const actors: Partial<OrganizationActorMap> = {};
    let profileSequence = 1000;

    for (const persona of PERSONA_SEEDS) {
        const email = resolvePersonaEmail(persona.emailLocalPart, config);
        const user = await upsertAuthUser(prisma, persona, email);
        await syncBetterAuthUserToPrisma({
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            updatedAt: new Date(),
            lastSignInAt: new Date(),
        });

        await syncCredentialAccount(prisma, user.id, config, persona.hasPassword);
        const organization = persona.organizationKey ? orgs[persona.organizationKey] : null;
        await syncMembershipState(prisma, persona, organization, user.id, email, profileSequence);
        profileSequence += 1;

        if (organization && !actors[organization.key] && persona.membershipMode === 'ACTIVE') {
            actors[organization.key] = {
                userId: user.id,
                roleKey: persona.roleKey === 'globalAdmin' ? 'globalAdmin' : 'owner',
            };
        }

        catalog.push({
            key: persona.key,
            state: persona.state,
            email,
            password: persona.hasPassword ? config.password : null,
            displayName: persona.displayName,
            roleKey: persona.roleKey,
            organizationSlug: organization?.slug ?? null,
            membershipMode: persona.membershipMode,
            profileMode: persona.profileMode,
            twoFactorEnabled: persona.twoFactorEnabled,
            notes: persona.notes,
            expectedResult: EXPECTED_RESULT_BY_STATE[persona.state],
        });
    }

    assertActorsComplete(actors);
    return { catalog, actors };
}

const EXPECTED_RESULT_BY_STATE = {
    ready: 'Should reach assigned dashboard after /api/auth/post-login.',
    password_setup_required: 'Should be redirected to /two-factor/setup (password setup gate).',
    profile_setup_required: 'Should be redirected to /hr/profile.',
    mfa_setup_required: 'Should be redirected to /two-factor/setup due to org MFA requirement.',
    suspended: 'Should fail org guard with inactive membership.',
    no_membership: 'Should redirect to /not-invited.',
} as const;

function assertActorsComplete(actors: Partial<OrganizationActorMap>): asserts actors is OrganizationActorMap {
    if (!actors.platform || !actors.alpha || !actors.beta) {
        throw new Error('Unable to resolve active actor users for all organizations.');
    }
}

