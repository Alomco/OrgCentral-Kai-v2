import { randomUUID } from 'node:crypto';
import type { HRNotificationCreateDTO } from '@/server/types/hr/notifications';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { PeopleDomainEvent } from './notification-helpers.types';

const PEOPLE_NOTIFICATION_TYPE: HRNotificationCreateDTO['type'] = 'system-announcement';
const PEOPLE_ACTION_URL = '/hr/people';

export function buildSyntheticAuthorization(
  orgId: string,
  userId: string,
): RepositoryAuthorizationContext {
  const correlationId = randomUUID();
  return {
    orgId,
    userId,
    roleKey: 'custom',
    permissions: {},
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'people-notifications',
    correlationId,
    tenantScope: {
      orgId,
      dataResidency: 'UK_ONLY',
      dataClassification: 'OFFICIAL',
      auditSource: 'people-notifications',
    },
  };
}

export function buildNotificationFromEvent(
  event: PeopleDomainEvent,
): Omit<
  HRNotificationCreateDTO,
  'orgId' | 'dataClassification' | 'residencyTag' | 'createdByUserId' | 'correlationId'
> & { orgId: string } | null {
  switch (event.type) {
    case 'ProfileCreated':
      return {
        orgId: event.payload.orgId,
        userId: event.payload.userId,
        title: 'Profile created',
        message: `Your profile was created${event.payload.jobTitle ? ` as ${event.payload.jobTitle}` : ''}.`,
        type: PEOPLE_NOTIFICATION_TYPE,
        priority: 'medium',
        actionUrl: PEOPLE_ACTION_URL,
        metadata: event.payload,
      };
    case 'ProfileUpdated':
      return {
        orgId: event.payload.orgId,
        userId: event.payload.userId,
        title: 'Profile updated',
        message: `Your profile was updated: ${event.payload.updatedFields.join(', ') || 'details changed'}.`,
        type: PEOPLE_NOTIFICATION_TYPE,
        priority: 'low',
        actionUrl: PEOPLE_ACTION_URL,
        metadata: event.payload,
      };
    case 'ContractCreated':
      return {
        orgId: event.payload.orgId,
        userId: event.payload.userId,
        title: 'Employment contract created',
        message: `Your ${event.payload.contractType.toLowerCase()} contract was created.`,
        type: PEOPLE_NOTIFICATION_TYPE,
        priority: 'medium',
        actionUrl: PEOPLE_ACTION_URL,
        metadata: event.payload,
      };
    case 'ContractUpdated':
      return {
        orgId: event.payload.orgId,
        userId: event.payload.userId,
        title: 'Employment contract updated',
        message: `Your contract was updated: ${event.payload.updatedFields.join(', ') || 'details changed'}.`,
        type: PEOPLE_NOTIFICATION_TYPE,
        priority: 'low',
        actionUrl: PEOPLE_ACTION_URL,
        metadata: event.payload,
      };
    case 'ProfileDeleted':
    case 'ContractDeleted':
    default:
      return null;
  }
}
