import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import { countEmployeeProfiles } from '@/server/use-cases/hr/people/count-employee-profiles';
import { listEmployeeDirectory } from '@/server/use-cases/hr/people/list-employee-directory';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';

import {
    parseEmployeeDirectoryQueryFromSearchParams,
} from '../_components/employee-directory-helpers';
import {
    formatEmployeeName,
    formatEmploymentStatus,
    formatEmploymentType,
} from '../_components/employee-formatters';

export const dynamic = 'force-dynamic';

function formatCsvDate(value: Date | string | null | undefined): string {
    if (!value) {
        return '';
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return date.toISOString().slice(0, 10);
}

function optionalText(value: string | null | undefined): string {
    if (!value) {
        return '';
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '';
}

function escapeCsv(value: string): string {
    const escaped = value.replace(/"/g, '""');
    return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function buildCsvRow(values: string[]): string {
    return values.map(escapeCsv).join(',');
}

export async function GET(request: Request) {
    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:employees:export',
        action: HR_ACTION.LIST,
        resourceType: HR_RESOURCE.HR_EMPLOYEE_PROFILE,
    });

    const url = new URL(request.url);
    const query = parseEmployeeDirectoryQueryFromSearchParams(url.searchParams);

    const filters = {
        search: query.search,
        employmentStatus: query.status,
        employmentType: query.employmentType,
        departmentId: query.departmentId,
        managerUserId: query.managerUserId,
        startDate: query.startDate,
        endDate: query.endDate,
    };

    const employeeProfileRepository = new PrismaEmployeeProfileRepository();
    const { count } = await countEmployeeProfiles(
        { employeeProfileRepository },
        { authorization: session.authorization, filters },
    );

    const listResult = await listEmployeeDirectory(
        { employeeProfileRepository },
        {
            authorization: session.authorization,
            page: 1,
            pageSize: Math.max(1, count),
            sort: { key: query.sort, direction: query.direction },
            filters,
        },
    );
    const sorted = listResult.profiles;

    const headerRow = buildCsvRow([
        'Employee Number',
        'Name',
        'Work Email',
        'Personal Email',
        'Job Title',
        'Department',
        'Employment Type',
        'Employment Status',
        'Start Date',
        'End Date',
        'Manager User ID',
        'Cost Center',
    ]);

    const rows = sorted.map((profile) =>
        buildCsvRow([
            optionalText(profile.employeeNumber),
            formatEmployeeName(profile),
            optionalText(profile.email),
            optionalText(profile.personalEmail),
            optionalText(profile.jobTitle),
            optionalText(profile.departmentId),
            formatEmploymentType(profile.employmentType),
            formatEmploymentStatus(profile.employmentStatus),
            formatCsvDate(profile.startDate),
            formatCsvDate(profile.endDate),
            optionalText(profile.managerUserId),
            optionalText(profile.costCenter),
        ]),
    );

    const csv = [headerRow, ...rows].join('\n');
    const filename = `employee-directory-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}
