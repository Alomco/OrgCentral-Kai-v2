/**
 * ABAC Policies - Compliance Tier
 *
 * Policies for compliance officers.
 *
 * @module abac-policies/compliance
 */
import type { AbacPolicy } from '../abac-types';

/** Resources compliance officers can read. */
const COMPLIANCE_READ_RESOURCES = [
    'hr.compliance.item',
    'hr.compliance.template',
    'hr.compliance.review',
    'hr.policy',
    'hr.policy.acknowledgment',
    'employeeProfile',
];

/** Resources compliance officers can fully manage. */
const COMPLIANCE_MANAGE_RESOURCES = [
    'hr.compliance.item',
    'hr.compliance.template',
    'hr.compliance.review',
];

/**
 * Compliance officer policies.
 * Priority: 700
 */
export const COMPLIANCE_POLICIES: AbacPolicy[] = [
    {
        id: 'default:abac:compliance:read-all',
        description: 'Compliance officers can read all compliance-related resources.',
        effect: 'allow',
        actions: ['read', 'list'],
        resources: COMPLIANCE_READ_RESOURCES,
        condition: { subject: { roles: ['compliance'] } },
        priority: 700,
    },
    {
        id: 'default:abac:compliance:manage-compliance',
        description: 'Compliance officers have full compliance management access.',
        effect: 'allow',
        actions: ['*'],
        resources: COMPLIANCE_MANAGE_RESOURCES,
        condition: { subject: { roles: ['compliance'] } },
        priority: 700,
    },
];
