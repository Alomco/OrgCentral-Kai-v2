import { emitHrNotification } from '@/server/use-cases/hr/notifications/notification-emitter';
import {
  buildNotificationFromEvent,
  buildSyntheticAuthorization,
} from './notification-helpers.builders';
import type {
  PeopleDomainEvent,
  ProfileCreatedEvent,
  ProfileCreatedEventHandler,
  ProfileUpdatedEvent,
  ProfileUpdatedEventHandler,
  ContractCreatedEvent,
  ContractCreatedEventHandler,
  ContractUpdatedEvent,
  ContractUpdatedEventHandler,
} from './notification-helpers.types';

export type {
  PeopleDomainEvent,
  ProfileCreatedEvent,
  ProfileCreatedEventHandler,
  ProfileUpdatedEvent,
  ProfileUpdatedEventHandler,
  ContractCreatedEvent,
  ContractCreatedEventHandler,
  ContractUpdatedEvent,
  ContractUpdatedEventHandler,
} from './notification-helpers.types';

/**
 * Emit a domain event
 */
export async function emitDomainEvent(event: PeopleDomainEvent): Promise<void> {
  const notification = buildNotificationFromEvent(event);
  if (!notification) {
    return;
  }

  const authorization = buildSyntheticAuthorization(event.payload.orgId, notification.userId);

  await emitHrNotification(
    {},
    {
      authorization,
      notification: {
        ...notification,
        dataClassification: authorization.dataClassification,
        residencyTag: authorization.dataResidency,
        correlationId: authorization.correlationId,
        createdByUserId: authorization.userId,
      },
    },
  );
}

/**
 * Emit a profile created event
 */
export const emitProfileCreatedEvent: ProfileCreatedEventHandler = async (
  orgId,
  profileId,
  profile,
) => {
  const event: ProfileCreatedEvent = {
    type: 'ProfileCreated',
    payload: {
      orgId,
      profileId,
      userId: profile.userId,
      jobTitle: profile.jobTitle ?? 'N/A',
    },
    timestamp: new Date(),
  };

  await emitDomainEvent(event);
};

/**
 * Emit a profile updated event
 */
export const emitProfileUpdatedEvent: ProfileUpdatedEventHandler = async (
  orgId,
  profileId,
  profile,
  updatedFields,
) => {
  const event: ProfileUpdatedEvent = {
    type: 'ProfileUpdated',
    payload: {
      orgId,
      profileId,
      userId: profile.userId,
      updatedFields,
    },
    timestamp: new Date(),
  };

  await emitDomainEvent(event);
};

/**
 * Emit a contract created event
 */
export const emitContractCreatedEvent: ContractCreatedEventHandler = async (
  orgId,
  contractId,
  contract,
) => {
  const event: ContractCreatedEvent = {
    type: 'ContractCreated',
    payload: {
      orgId,
      contractId,
      userId: contract.userId,
      contractType: contract.contractType,
    },
    timestamp: new Date(),
  };

  await emitDomainEvent(event);
};

/**
 * Emit a contract updated event
 */
export const emitContractUpdatedEvent: ContractUpdatedEventHandler = async (
  orgId,
  contractId,
  contract,
  updatedFields,
) => {
  const event: ContractUpdatedEvent = {
    type: 'ContractUpdated',
    payload: {
      orgId,
      contractId,
      userId: contract.userId,
      updatedFields,
    },
    timestamp: new Date(),
  };

  await emitDomainEvent(event);
};
