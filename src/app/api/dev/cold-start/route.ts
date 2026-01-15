import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { AuthorizationError } from '@/server/errors';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { runFullColdStart } from '@/server/services/platform/bootstrap/full-cold-start';

const countsSchema = z.object({
    employees: z.number().int().min(1).max(200).optional(),
    absences: z.number().int().min(1).max(500).optional(),
    timeEntries: z.number().int().min(1).max(500).optional(),
    training: z.number().int().min(1).max(200).optional(),
    performance: z.number().int().min(1).max(200).optional(),
    notifications: z.number().int().min(1).max(500).optional(),
    securityEvents: z.number().int().min(1).max(1000).optional(),
});

const coldStartConfigSchema = z.object({
    platformOrgSlug: z.string().min(1).optional(),
    platformOrgName: z.string().min(1).optional(),
    platformTenantId: z.string().min(1).optional(),
    platformRegionCode: z.string().min(1).optional(),
    globalAdminEmail: z.email().optional(),
    globalAdminName: z.string().min(1).optional(),
    developmentAdminEmail: z.email().optional(),
    developmentAdminName: z.string().min(1).optional(),
    roleName: z.string().min(1).optional(),
});

const requestSchema = z.object({
    token: z.string().min(1),
    includeDemoData: z.boolean().optional(),
    counts: countsSchema.optional(),
    forceComplianceTemplates: z.boolean().optional(),
    coldStart: coldStartConfigSchema.optional(),
});

export async function POST(request: NextRequest): Promise<Response> {
    try {
        assertColdStartEnabled();
        const payload = requestSchema.parse(await request.json());
        assertColdStartToken(payload.token);

        const result = await runFullColdStart({
            coldStart: payload.coldStart,
            includeDemoData: payload.includeDemoData,
            counts: payload.counts,
            forceComplianceTemplates: payload.forceComplianceTemplates,
        });

        return NextResponse.json(result, {
            status: 200,
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        return buildErrorResponse(error);
    }
}

function assertColdStartEnabled(): void {
    const enabled = process.env.NODE_ENV === 'development' || process.env.ENABLE_COLD_START === 'true';
    if (!enabled) {
        throw new AuthorizationError('Cold start is disabled.');
    }
}

function assertColdStartToken(token: string): void {
    const expected = process.env.COLD_START_SECRET ?? process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!expected || expected.trim().length === 0) {
        throw new AuthorizationError('Cold start is disabled.');
    }
    if (token.trim() !== expected) {
        throw new AuthorizationError('Invalid cold start token.');
    }
}