import type { EmployeeProfile, EmploymentContract } from '@/server/types/hr-types';

/**
 * Domain events for HR people operations
 */
export interface DomainEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export interface ProfileCreatedEvent extends DomainEvent {
  type: 'ProfileCreated';
  payload: {
    orgId: string;
    profileId: string;
    userId: string;
    jobTitle: string;
  };
}

export interface ProfileUpdatedEvent extends DomainEvent {
  type: 'ProfileUpdated';
  payload: {
    orgId: string;
    profileId: string;
    userId: string;
    updatedFields: string[];
  };
}

export interface ProfileDeletedEvent extends DomainEvent {
  type: 'ProfileDeleted';
  payload: {
    orgId: string;
    profileId: string;
    userId: string;
  };
}

export interface ContractCreatedEvent extends DomainEvent {
  type: 'ContractCreated';
  payload: {
    orgId: string;
    contractId: string;
    userId: string;
    contractType: string;
  };
}

export interface ContractUpdatedEvent extends DomainEvent {
  type: 'ContractUpdated';
  payload: {
    orgId: string;
    contractId: string;
    userId: string;
    updatedFields: string[];
  };
}

export interface ContractDeletedEvent extends DomainEvent {
  type: 'ContractDeleted';
  payload: {
    orgId: string;
    contractId: string;
    userId: string;
  };
}

export type PeopleDomainEvent =
  | ProfileCreatedEvent
  | ProfileUpdatedEvent
  | ProfileDeletedEvent
  | ContractCreatedEvent
  | ContractUpdatedEvent
  | ContractDeletedEvent;

export type ProfileCreatedEventHandler = (
  orgId: string,
  profileId: string,
  profile: EmployeeProfile,
) => Promise<void>;

export type ProfileUpdatedEventHandler = (
  orgId: string,
  profileId: string,
  profile: EmployeeProfile,
  updatedFields: string[],
) => Promise<void>;

export type ContractCreatedEventHandler = (
  orgId: string,
  contractId: string,
  contract: EmploymentContract,
) => Promise<void>;

export type ContractUpdatedEventHandler = (
  orgId: string,
  contractId: string,
  contract: EmploymentContract,
  updatedFields: string[],
) => Promise<void>;
