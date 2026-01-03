/**
 * HR Guards Module Index
 *
 * Barrel file re-exporting all domain-specific HR guards.
 *
 * @module hr-guards
 */

// Core guard infrastructure
export {
    assertHrAccess,
    hasPermission,
    hasAnyPermission,
    assertActorOrPrivileged,
    assertPrivileged,
    type HrGuardRequest,
    type HrGuardRequestWithTarget,
    type HrGuardRequestWithAction,
} from './core';

// Domain-specific guards
export * from './absence';
export * from './leave';
export * from './compliance';
export * from './time-tracking';
export * from './training';
export * from './people';
export * from './policy';
export * from './onboarding';
export * from './performance';
export * from './notifications';
export * from './settings';
