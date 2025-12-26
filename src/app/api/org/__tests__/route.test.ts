import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthorizationError } from '@/server/errors';
import type { OrganizationData } from '@/server/types/leave-types';
import { normalizeLeaveYearStartDate } from '@/server/types/org/leave-year-start-date';

vi.mock('@/server/api-adapters/org/organization/organization-route-controllers', () => ({
    createOrganizationController: vi.fn(),
}));

import { createOrganizationController } from '@/server/api-adapters/org/organization/organization-route-controllers';
import { POST } from '../route';

function buildOrganizationData(): OrganizationData {
    return {
        id: 'org-1',
        slug: 'acme',
        name: 'Acme Corp',
        regionCode: 'UK-LON',
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'org-repository',
        auditBatchId: undefined,
        leaveEntitlements: { annual: 25 },
        primaryLeaveType: 'annual',
        leaveYearStartDate: normalizeLeaveYearStartDate('01-01'),
        leaveRoundingRule: 'half_day',
        createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
    };
}

describe('POST /api/org', () => {
    const mockedController = vi.mocked(createOrganizationController);

    beforeEach(() => {
        mockedController.mockReset();
    });

    it('returns 201 with the created organization', async () => {
        const organization = buildOrganizationData();
        mockedController.mockResolvedValue({ organization });

        const request = new Request('http://localhost/api/org', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        const payload = await response.json();

        expect(response.status).toBe(201);
        expect(payload).toEqual({ organization });
    });

    it('returns 403 when authorization fails', async () => {
        mockedController.mockRejectedValue(new AuthorizationError('Denied'));

        const request = new Request('http://localhost/api/org', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        const payload = await response.json();

        expect(response.status).toBe(403);
        expect(payload).toEqual(
            expect.objectContaining({
                error: expect.objectContaining({
                    code: 'AUTHORIZATION_ERROR',
                }),
            }),
        );
    });
});
