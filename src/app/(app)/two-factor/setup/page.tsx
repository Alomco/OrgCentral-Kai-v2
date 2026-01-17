import type { Metadata } from 'next';
import { headers as nextHeaders } from 'next/headers';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TwoFactorSetupForm } from '@/components/auth/TwoFactorSetupForm';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';

export const metadata: Metadata = {
    title: 'Set up MFA • OrgCentral',
    description: 'Enable multi-factor authentication for your OrgCentral account.',
};

export default async function TwoFactorSetupPage() {
    const headerStore = await nextHeaders();
    await getSessionContextOrRedirect({}, {
        headers: headerStore,
        auditSource: 'ui:security:mfa-setup',
    });

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Set up multi-factor authentication</CardTitle>
                    <CardDescription>
                        Add an authenticator app and confirm a 6-digit code to protect your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TwoFactorSetupForm />
                </CardContent>
            </Card>
        </div>
    );
}
