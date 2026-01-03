import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { EmployeeProfile } from '@/server/types/hr-types';
import type { PostalAddress } from '@/server/types/hr/people';

import {
    formatOptionalText,
} from '../../employees/_components/employee-formatters';

export interface ProfileContactCardProps {
    profile: EmployeeProfile;
}

function formatAddress(address: PostalAddress | null | undefined): string {
    if (!address) {
        return 'Not set';
    }
    const parts = [
        address.street,
        address.city,
        address.state,
        address.postalCode,
        address.country,
    ].filter((part): part is string => typeof part === 'string' && part.trim().length > 0);

    return parts.length > 0 ? parts.join(', ') : 'Not set';
}

export function ProfileContactCard({ profile }: ProfileContactCardProps) {
    const emergency = profile.emergencyContact;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Contact details</CardTitle>
                <CardDescription>Personal contact, address, and emergency contact.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
                <section className="grid gap-4 sm:grid-cols-2">
                    <DetailItem label="Work phone" value={formatOptionalText(profile.phone?.work)} />
                    <DetailItem label="Mobile phone" value={formatOptionalText(profile.phone?.mobile)} />
                    <DetailItem label="Home phone" value={formatOptionalText(profile.phone?.home)} />
                    <DetailItem label="Personal email" value={formatOptionalText(profile.personalEmail)} />
                </section>

                <section className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Address</div>
                    <div>{formatAddress(profile.address)}</div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                    <DetailItem label="Emergency contact" value={formatOptionalText(emergency?.name)} />
                    <DetailItem label="Relationship" value={formatOptionalText(emergency?.relationship)} />
                    <DetailItem label="Emergency phone" value={formatOptionalText(emergency?.phone)} />
                    <DetailItem label="Emergency email" value={formatOptionalText(emergency?.email ?? undefined)} />
                </section>
            </CardContent>
        </Card>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div>{value}</div>
        </div>
    );
}
