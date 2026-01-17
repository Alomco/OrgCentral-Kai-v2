import { ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TwoFactorSetupForm } from '@/components/auth/TwoFactorSetupForm';

interface MfaPanelProps {
    isMfaEnabled: boolean;
}

export function MfaPanel({ isMfaEnabled }: MfaPanelProps) {
    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    </span>
                    Multi-factor authentication
                </CardTitle>
                <CardDescription>
                    {isMfaEnabled
                        ? 'Your account uses MFA. Review your authenticator or recovery codes below.'
                        : 'Add MFA for stronger account protection.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <TwoFactorSetupForm />
            </CardContent>
        </Card>
    );
}
