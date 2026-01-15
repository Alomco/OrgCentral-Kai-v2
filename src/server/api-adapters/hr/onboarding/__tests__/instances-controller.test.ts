import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

vi.mock('@/server/use-cases/auth/sessions/get-session', () => ({
    getSessionContext: vi.fn(() => Promise.resolve({
        authorization: {
            orgId: 'org-1',
            userId: 'actor-1',
            roleKey: 'member',
            dataResidency: 'UK_ONLY',
            dataClassification: 'OFFICIAL',
        },
    })),
}));

// Mock repositories and use-cases
const { listInstancesForEmployee, updateItems } = vi.hoisted(() => ({
    listInstancesForEmployee: vi.fn(),
    updateItems: vi.fn(),
}));

vi.mock('@/server/services/hr/onboarding/onboarding-controller-dependencies', () => ({
    getChecklistInstanceRepository: () => ({
        listInstancesForEmployee,
        updateItems,
    }),
}));

import { getEmployeeChecklistsController, updateChecklistInstanceController } from '../instances-controller';

// Helper to mock Request object (Web API)
function createMockRequest(url: string, method: string = 'GET', body?: unknown) {
    return new Request(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
}

describe('instances-controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getEmployeeChecklistsController', () => {
        it('returns instances for the authorized user', async () => {
            const mockInstances = [{ id: 'inst-1', status: 'IN_PROGRESS' }];
            listInstancesForEmployee.mockResolvedValue(mockInstances);

            const req = createMockRequest('http://localhost/api/hr/onboarding/instances?employeeId=user-1');

            const result = await getEmployeeChecklistsController(req);

            expect(result.success).toBe(true);
            expect(result.data.instances).toEqual(mockInstances);
            expect(listInstancesForEmployee).toHaveBeenCalledWith('org-1', 'user-1');
        });

        it('defaults to current user if no employeeId provided', async () => {
            const mockInstances = [{ id: 'inst-1' }];
            listInstancesForEmployee.mockResolvedValue(mockInstances);

            const req = createMockRequest('http://localhost/api/hr/onboarding/instances');

            const result = await getEmployeeChecklistsController(req);

            expect(result.data.instances).toEqual(mockInstances);
            expect(listInstancesForEmployee).toHaveBeenCalledWith('org-1', 'actor-1');
        });
    });

    describe('updateChecklistInstanceController', () => {
        it('updates instance items successfully', async () => {
            const mockInstance = { id: '33333333-3333-4333-8333-333333333333', items: [] };
            updateItems.mockResolvedValue(mockInstance);

            const updates = { items: [{ task: 'Task 1', completed: true }] };
            const req = createMockRequest(
                'http://localhost/api/hr/onboarding/instances/33333333-3333-4333-8333-333333333333',
                'PATCH',
                updates,
            );

            const result = await updateChecklistInstanceController(req, '33333333-3333-4333-8333-333333333333');

            expect(result.success).toBe(true);
            expect(result.data.instance).toEqual(mockInstance);
            expect(updateItems).toHaveBeenCalledWith('org-1', '33333333-3333-4333-8333-333333333333', updates);
        });

        it('throws error for invalid update payload', async () => {
            const updates = { items: 'invalid-array' };
            const req = createMockRequest(
                'http://localhost/api/hr/onboarding/instances/33333333-3333-4333-8333-333333333333',
                'PATCH',
                updates,
            );

            await expect(
                updateChecklistInstanceController(req, '33333333-3333-4333-8333-333333333333'),
            ).rejects.toThrow();
        });
    });
});
