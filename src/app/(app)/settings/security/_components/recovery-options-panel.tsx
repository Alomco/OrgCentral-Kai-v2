import Link from 'next/link';
import { LifeBuoy, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function RecoveryOptionsPanel() {
    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                    </span>
                    Recovery options
                </CardTitle>
                <CardDescription>
                    Keep recovery codes stored safely. Contact support if you lose access to your primary factor.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
                    Recovery codes are provided during MFA setup. Save them in a secure password manager.
                </div>
                <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href="/two-factor/setup">
                        <LifeBuoy className="h-4 w-4" />
                        Review MFA setup
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
