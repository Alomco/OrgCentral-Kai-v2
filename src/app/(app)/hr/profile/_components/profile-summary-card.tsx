import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { EmployeeProfile } from '@/server/types/hr-types';

import { HrStatusBadge } from '../../_components/hr-status-badge';
import {
    formatDate,
    formatEmployeeName,
    formatEmploymentType,
    formatOptionalText,
} from '../../employees/_components/employee-formatters';

export interface ProfileSummaryCardProps {
    profile: EmployeeProfile;
    fallbackEmail?: string | null;
    fallbackImageUrl?: string | null;
    className?: string;
}

function getInitials(profile: EmployeeProfile, fallbackEmail?: string | null): string {
    const name = formatEmployeeName(profile);
    const trimmed = name.trim();
    if (trimmed && trimmed !== 'Not set') {
        const parts = trimmed.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return trimmed.slice(0, 2).toUpperCase();
    }
    if (fallbackEmail) {
        return fallbackEmail.slice(0, 2).toUpperCase();
    }
    return 'ME';
}

export function ProfileSummaryCard({
    profile,
    fallbackEmail,
    fallbackImageUrl,
    className,
}: ProfileSummaryCardProps) {
    const imageUrl = profile.photoUrl ?? fallbackImageUrl ?? undefined;
    const displayName = formatEmployeeName(profile);
    const jobTitle = formatOptionalText(profile.jobTitle);
    const workEmail = formatOptionalText(profile.email ?? fallbackEmail);

    return (
        <Card className={cn(className)}>
            <CardHeader className="pb-4">
                <div className="flex flex-wrap items-start gap-4">
                    <Avatar className="h-14 w-14">
                        <AvatarImage src={imageUrl} alt={displayName} />
                        <AvatarFallback>{getInitials(profile, fallbackEmail)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl">{displayName}</CardTitle>
                        <CardDescription>{jobTitle}</CardDescription>
                        <div className="text-sm text-muted-foreground">{workEmail}</div>
                    </div>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <HrStatusBadge status={profile.employmentStatus} />
                        <Badge variant="outline">{formatEmploymentType(profile.employmentType)}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Employee number" value={profile.employeeNumber} />
                <DetailItem label="Department" value={formatOptionalText(profile.departmentId)} />
                <DetailItem label="Start date" value={formatDate(profile.startDate)} />
                <DetailItem label="Manager user ID" value={formatOptionalText(profile.managerUserId)} />
            </CardContent>
        </Card>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="text-sm">{value}</div>
        </div>
    );
}
