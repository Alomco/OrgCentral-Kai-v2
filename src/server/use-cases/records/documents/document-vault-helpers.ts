import type { DataClassificationLevel } from '@/server/types/tenant';
import type { SecurityClassification, RetentionPolicy } from '@/server/types/records/document-vault';

const DATA_CLASSIFICATION_RANK: Record<DataClassificationLevel, number> = {
    OFFICIAL: 1,
    OFFICIAL_SENSITIVE: 2,
    SECRET: 3,
    TOP_SECRET: 4,
};

const SECURITY_CLASSIFICATION_RANK: Record<SecurityClassification, number> = {
    UNCLASSIFIED: 0,
    OFFICIAL: 1,
    OFFICIAL_SENSITIVE: 2,
    SECRET: 3,
    TOP_SECRET: 4,
};

const RETENTION_POLICY_DAYS: Partial<Record<RetentionPolicy, number>> = {
    IMMEDIATE: 0,
    ONE_YEAR: 365,
    THREE_YEARS: 365 * 3,
    SEVEN_YEARS: 365 * 7,
};

export function toRequiredClassification(
    classification: SecurityClassification,
): DataClassificationLevel {
    switch (classification) {
        case 'UNCLASSIFIED':
            return 'OFFICIAL';
        case 'OFFICIAL':
            return 'OFFICIAL';
        case 'OFFICIAL_SENSITIVE':
            return 'OFFICIAL_SENSITIVE';
        case 'SECRET':
            return 'SECRET';
        case 'TOP_SECRET':
            return 'TOP_SECRET';
    }
}

export function isClassificationAllowed(
    documentClassification: SecurityClassification,
    contextClassification: DataClassificationLevel,
): boolean {
    const requiredRank = SECURITY_CLASSIFICATION_RANK[documentClassification];
    const contextRank = DATA_CLASSIFICATION_RANK[contextClassification];
    return contextRank >= requiredRank;
}

export function computeRetentionExpires(
    policy: RetentionPolicy,
    now = new Date(),
): Date | undefined {
    if (policy === 'PERMANENT' || policy === 'LEGAL_HOLD') {
        return undefined;
    }
    const days = RETENTION_POLICY_DAYS[policy];
    if (days === undefined) {
        return undefined;
    }
    const result = new Date(now);
    result.setDate(result.getDate() + days);
    return result;
}
