import type { JsonValue } from '@/server/types/json';

export type DocumentType =
    | 'ONBOARDING'
    | 'POLICY'
    | 'CONTRACT'
    | 'EVIDENCE'
    | 'TRAINING'
    | 'PERFORMANCE'
    | 'COMPLIANCE'
    | 'MEDICAL'
    | 'FINANCIAL'
    | 'SECURITY'
    | 'OTHER';

export type SecurityClassification =
    | 'UNCLASSIFIED'
    | 'OFFICIAL'
    | 'OFFICIAL_SENSITIVE'
    | 'SECRET'
    | 'TOP_SECRET';

export type RetentionPolicy =
    | 'IMMEDIATE'
    | 'ONE_YEAR'
    | 'THREE_YEARS'
    | 'SEVEN_YEARS'
    | 'PERMANENT'
    | 'LEGAL_HOLD';

export interface DocumentVaultRecord {
    id: string;
    orgId: string;
    ownerOrgId?: string | null;
    ownerUserId?: string | null;
    type: DocumentType;
    classification: SecurityClassification;
    retentionPolicy: RetentionPolicy;
    retentionExpires?: Date | null;
    blobPointer: string;
    checksum: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
    fileName: string;
    version: number;
    latestVersionId?: string | null;
    encrypted: boolean;
    encryptedKeyRef?: string | null;
    sensitivityLevel: number;
    dataCategory?: string | null;
    lawfulBasis?: string | null;
    dataSubject?: JsonValue;
    metadata?: JsonValue;
    createdAt: Date;
}

export interface DocumentVaultFilters {
    orgId?: string;
    ownerUserId?: string;
    type?: DocumentType;
    classification?: SecurityClassification;
    retentionPolicy?: RetentionPolicy;
    fileName?: string;
}

export interface DocumentVaultCreationData {
    orgId: string;
    ownerOrgId?: string;
    ownerUserId?: string;
    type: DocumentType;
    classification: SecurityClassification;
    retentionPolicy: RetentionPolicy;
    retentionExpires?: Date;
    blobPointer: string;
    checksum: string;
    mimeType?: string;
    sizeBytes?: number;
    fileName: string;
    version?: number;
    latestVersionId?: string;
    encrypted?: boolean;
    encryptedKeyRef?: string;
    sensitivityLevel?: number;
    dataCategory?: string;
    lawfulBasis?: string;
    dataSubject?: Record<string, JsonValue> | JsonValue;
    metadata?: Record<string, JsonValue> | JsonValue;
}

export interface DocumentVaultUpdateData {
    version?: number;
    latestVersionId?: string;
    retentionExpires?: Date;
    encrypted?: boolean;
    encryptedKeyRef?: string;
    sensitivityLevel?: number;
    dataCategory?: string;
    lawfulBasis?: string;
    dataSubject?: Record<string, JsonValue> | JsonValue;
    metadata?: Record<string, JsonValue> | JsonValue;
}
