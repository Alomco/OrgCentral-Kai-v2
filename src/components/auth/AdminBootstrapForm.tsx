"use client";

import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { signIn } from '@/lib/auth-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminBootstrapStore } from './admin-bootstrap-store';

type OAuthProvider = 'google' | 'microsoft';

export function AdminBootstrapForm() {
    const [secret, setSecret] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
    const setToken = useAdminBootstrapStore((state) => state.setToken);

    const handleOAuthSignIn = async (provider: OAuthProvider) => {
        const token = secret.trim();
        if (!token) {
            setError('Bootstrap secret is required.');
            return;
        }

        setError(null);
        setToken(token);

        setOauthLoading(provider);
        try {
            await signIn.social({
                provider,
                callbackURL: '/admin-signup/complete',
            });
        } finally {
            setOauthLoading(null);
        }
    };

    return (
        <div className="space-y-4">
            <Alert className="border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Temporary bootstrap</AlertTitle>
                <AlertDescription>
                    <p>Use this only for initial platform setup. Disable it after provisioning.</p>
                </AlertDescription>
            </Alert>

            <div className="space-y-1.5">
                <Label htmlFor="adminBootstrapSecret" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Bootstrap secret
                </Label>
                <Input
                    id="adminBootstrapSecret"
                    type="password"
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                    autoComplete="one-time-code"
                    placeholder="Enter the admin bootstrap secret"
                    className="h-11 rounded-xl border-slate-200 bg-white text-sm shadow-sm transition-all duration-200 placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-400/20 dark:border-slate-700/80 dark:bg-slate-800/50 dark:placeholder:text-slate-500 dark:focus-visible:border-indigo-500 dark:focus-visible:ring-indigo-500/20"
                />
                {error ? <p className="text-xs text-rose-500">{error}</p> : null}
            </div>

            <div className="grid gap-2.5 md:grid-cols-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
                    disabled={oauthLoading !== null}
                    onClick={() => handleOAuthSignIn('google')}
                >
                    {oauthLoading === 'google' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    )}
                    Google
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
                    disabled={oauthLoading !== null}
                    onClick={() => handleOAuthSignIn('microsoft')}
                >
                    {oauthLoading === 'microsoft' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23" aria-hidden>
                            <path fill="#f35325" d="M0 0h11v11H0z" />
                            <path fill="#81bc06" d="M12 0h11v11H12z" />
                            <path fill="#05a6f0" d="M0 12h11v11H0z" />
                            <path fill="#ffba08" d="M12 12h11v11H12z" />
                        </svg>
                    )}
                    Microsoft
                </Button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
                After OAuth sign-in, OrgCentral provisions you as platform owner and redirects to the dashboard.
            </p>
        </div>
    );
}

