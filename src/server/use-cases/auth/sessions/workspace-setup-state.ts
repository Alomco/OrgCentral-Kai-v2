import { AuthorizationError } from '@/server/errors';
import { createAuthAccountRepository } from '@/server/repositories/providers/auth/auth-account-repository-provider';
import { buildPeopleServiceDependencies } from '@/server/repositories/providers/hr/people-service-dependencies';

const PASSWORD_SETUP_PATH_PREFIXES = ['/two-factor', '/two-factor/setup'] as const;
const PROFILE_SETUP_PATH_PREFIXES = ['/hr/profile'] as const;
const PROFILE_REQUIRED_FIELDS = ['firstName', 'lastName'] as const;

type ProfileRequiredField = (typeof PROFILE_REQUIRED_FIELDS)[number];

interface EmployeeProfileSnapshot {
    firstName: string | null;
    lastName: string | null;
}

export interface WorkspaceSetupState {
    requiresPasswordSetup: boolean;
    requiresProfileSetup: boolean;
    missingProfileFields: ProfileRequiredField[];
    isReady: boolean;
}

export interface WorkspaceSetupDependencies {
    hasCredentialPassword(authUserId: string): Promise<boolean>;
    getEmployeeProfile(orgId: string, userId: string): Promise<EmployeeProfileSnapshot | null>;
}

export interface WorkspaceSetupSubject {
    authUserId: string;
    orgId: string;
    userId: string;
    roleKey?: string | null;
}

export interface EnforceWorkspaceSetupStateInput {
    subject: WorkspaceSetupSubject;
    requestPath?: string | null;
}

const defaultWorkspaceSetupDependencies: WorkspaceSetupDependencies = {
    async hasCredentialPassword(authUserId) {
        return defaultAuthAccountRepository.hasCredentialPassword(authUserId);
    },
    async getEmployeeProfile(orgId, userId) {
        const profile = await defaultEmployeeProfileRepository.getEmployeeProfileByUser(orgId, userId);
        if (!profile) {
            return null;
        }

        return {
            firstName: profile.firstName ?? null,
            lastName: profile.lastName ?? null,
        };
    },
};

const defaultAuthAccountRepository = createAuthAccountRepository();
const defaultEmployeeProfileRepository = buildPeopleServiceDependencies().profileRepo;

export async function resolveWorkspaceSetupState(
    subject: WorkspaceSetupSubject,
    deps: WorkspaceSetupDependencies = defaultWorkspaceSetupDependencies,
): Promise<WorkspaceSetupState> {
    const shouldCheckProfile = shouldRequireProfileSetup(subject.roleKey);

    const [hasPassword, profile] = await Promise.all([
        deps.hasCredentialPassword(subject.authUserId),
        shouldCheckProfile
            ? deps.getEmployeeProfile(subject.orgId, subject.userId)
            : Promise.resolve(null),
    ]);

    const missingProfileFields = shouldCheckProfile
        ? resolveMissingProfileFields(profile)
        : [];

    const state: WorkspaceSetupState = {
        requiresPasswordSetup: !hasPassword,
        requiresProfileSetup: missingProfileFields.length > 0,
        missingProfileFields,
        isReady: hasPassword && missingProfileFields.length === 0,
    };

    return state;
}

export async function enforceWorkspaceSetupState(
    input: EnforceWorkspaceSetupStateInput,
    deps: WorkspaceSetupDependencies = defaultWorkspaceSetupDependencies,
): Promise<void> {
    const state = await resolveWorkspaceSetupState(input.subject, deps);
    const path = normalizePath(input.requestPath);
    if (!path) {
        return;
    }

    if (state.requiresPasswordSetup && !isAllowedSetupPath(path, PASSWORD_SETUP_PATH_PREFIXES)) {
        throw new AuthorizationError(
            'Password setup is required before accessing this workspace.',
            { reason: 'password_setup_required' },
        );
    }

    if (state.requiresProfileSetup && !isAllowedSetupPath(path, PROFILE_SETUP_PATH_PREFIXES)) {
        throw new AuthorizationError(
            'Complete your profile before accessing this workspace.',
            {
                reason: 'profile_setup_required',
                missingFields: state.missingProfileFields,
            },
        );
    }
}

function shouldRequireProfileSetup(roleKey: string | null | undefined): boolean {
    return roleKey !== 'globalAdmin';
}

function resolveMissingProfileFields(
    profile: EmployeeProfileSnapshot | null,
): ProfileRequiredField[] {
    if (!profile) {
        return [...PROFILE_REQUIRED_FIELDS];
    }

    return PROFILE_REQUIRED_FIELDS.filter((field) => !normalizeText(profile[field]));
}

function normalizeText(value: string | null | undefined): string {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizePath(path: string | null | undefined): string {
    if (typeof path !== 'string') {
        return '';
    }
    const trimmed = path.trim();
    if (!trimmed.startsWith('/')) {
        return '';
    }
    try {
        const parsed = new URL(trimmed, 'http://localhost');
        return parsed.pathname;
    } catch {
        return trimmed;
    }
}

function isAllowedSetupPath(path: string, prefixes: readonly string[]): boolean {
    if (!path) {
        return false;
    }
    return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
