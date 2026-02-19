import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

import { PrismaComplianceItemRepository } from './prisma-compliance-item-repository';

describe('PrismaComplianceItemRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null and skips prisma lookup for invalid item id in getItem', async () => {
        const complianceLogItem = {
            findUnique: vi.fn(),
        };

        const repository = new PrismaComplianceItemRepository({
            prisma: {
                complianceLogItem,
            } as unknown as PrismaClient,
            complianceStatusRepository: {
                recalculateForUser: vi.fn(),
            },
        });

        const result = await repository.getItem('org-1', 'user-1', 'unknown-item');

        expect(result).toBeNull();
        expect(complianceLogItem.findUnique).not.toHaveBeenCalled();
    });
});
