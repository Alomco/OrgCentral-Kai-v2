import { Readable } from 'node:stream';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import { runPeopleSarExportJob } from '@/server/services/hr/people/sar/people-sar.jobs';
import type { PeopleSarExportOptions, SarExportFormat } from '@/server/services/hr/people/sar/people-sar-exporter.types';

export const dynamic = 'force-dynamic';

function parseBoolean(value: string | null, fallback: boolean): boolean {
    if (value === null) {
        return fallback;
    }
    return value === '1' || value === 'true' || value === 'on';
}

function normalizeFormat(value: string | null): SarExportFormat {
    return value === 'jsonl' ? 'jsonl' : 'csv';
}

export async function GET(request: Request) {
    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:admin:sar-export',
        action: HR_ACTION.LIST,
        resourceType: HR_RESOURCE.HR_EMPLOYEE_PROFILE,
    });

    const url = new URL(request.url);
    const format = normalizeFormat(url.searchParams.get('format'));
    const includeProfiles = parseBoolean(url.searchParams.get('includeProfiles'), true);
    const includeContracts = parseBoolean(url.searchParams.get('includeContracts'), true);

    const options: PeopleSarExportOptions = {
        format,
        includeProfiles,
        includeContracts,
        auditSource: 'ui:hr:admin:sar-export',
    };

    const result = await runPeopleSarExportJob(session.authorization, options);
    const filename = `people-sar-${new Date().toISOString().slice(0, 10)}.${format === 'csv' ? 'csv' : 'jsonl'}`;
    const contentType = format === 'csv' ? 'text/csv; charset=utf-8' : 'application/x-ndjson';

    const body = Readable.toWeb(result.stream) as ReadableStream<Uint8Array>;
    return new Response(body, {
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}
