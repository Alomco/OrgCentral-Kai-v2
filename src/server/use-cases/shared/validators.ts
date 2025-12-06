/**
 * Shared validation and assertion utilities for use-cases.
 * Ensures consistent validation logic across the application.
 */

import { ValidationError, AuthorizationError } from '@/server/errors';

/**
 * Validates that a value is not empty after trimming.
 */
export function assertNonEmpty(value: string | undefined, fieldName: string): asserts value is string {
    const trimmed = value?.trim();
    if (!trimmed || trimmed.length === 0) {
        throw new ValidationError(`${fieldName} is required.`);
    }
}

/**
 * Validates that an email matches the expected email.
 */
export function assertEmailMatch(
    actualEmail: string,
    expectedEmail: string,
    context?: string,
): void {
    if (actualEmail.toLowerCase() !== expectedEmail.toLowerCase()) {
        throw new AuthorizationError(
            context ?? 'Email address does not match the expected value.',
        );
    }
}

/**
 * Validates that a date has not expired.
 */
export function assertNotExpired(
    expiresAt: Date | undefined,
    resourceType: string,
    context?: Record<string, unknown>,
): void {
    if (expiresAt && expiresAt.getTime() < Date.now()) {
        throw new ValidationError(`${resourceType} has expired.`, {
            expiredAt: expiresAt.toISOString(),
            ...context,
        });
    }
}

/**
 * Validates that a status matches the expected status.
 */
export function assertStatus<T extends string>(
    actualStatus: T,
    expectedStatus: T,
    resourceType: string,
    context?: Record<string, unknown>,
): void {
    if (actualStatus !== expectedStatus) {
        throw new ValidationError(
            `${resourceType} status must be '${expectedStatus}' but found '${actualStatus}'.`,
            { actualStatus, expectedStatus, ...context },
        );
    }
}

/**
 * Validates that a user has authenticated credentials.
 */
export function assertAuthenticated(
    userId: string | undefined,
    email: string | undefined,
): void {
    if (!userId?.trim()) {
        throw new AuthorizationError('Authenticated user ID is required.');
    }
    if (!email?.trim()) {
        throw new AuthorizationError('Authenticated user email is required.');
    }
}

/**
 * Validates that a required dependency is provided.
 */
export function assertDependency<T>(
    dependency: T | undefined,
    dependencyName: string,
): asserts dependency is T {
    if (!dependency) {
        throw new Error(`Required dependency '${dependencyName}' is not provided.`);
    }
}

/**
 * Validates that an array is not empty.
 */
export function assertNonEmptyArray<T>(
    array: T[] | undefined,
    fieldName: string,
): asserts array is T[] {
    if (!array || array.length === 0) {
        throw new ValidationError(`${fieldName} must contain at least one item.`);
    }
}

/**
 * Validates that a value is within a set of allowed values.
 */
export function assertInSet<T>(
    value: T,
    allowedValues: Set<T> | T[],
    fieldName: string,
): void {
    const allowed = Array.isArray(allowedValues) ? new Set(allowedValues) : allowedValues;
    if (!allowed.has(value)) {
        throw new ValidationError(
            `${fieldName} must be one of: ${Array.from(allowed).join(', ')}`,
            { value, allowedValues: Array.from(allowed) },
        );
    }
}
