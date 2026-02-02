"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAdminBootstrapStore } from './admin-bootstrap-store';
import { bootstrapAdmin } from './admin-bootstrap.api';

type BootstrapStatus = 'loading' | 'error' | 'success';

interface BootstrapState {
    status: BootstrapStatus;
    message?: string;
}

export function AdminBootstrapComplete() {
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [hasHydrated, setHasHydrated] = useState(() => useAdminBootstrapStore.persist.hasHydrated());
    const lastBootstrapToken = useRef<string | null>(null);
    const fallbackRedirectTimeout = useRef<number | null>(null);
    const clearToken = useAdminBootstrapStore((store) => store.clearToken);
    const token = useAdminBootstrapStore((store) => store.token);

    const { mutate, isSuccess } = useMutation({
        mutationFn: bootstrapAdmin,
        onMutate: () => {
            setErrorMessage(null);
        },
        onSuccess: (result) => {
            clearToken();
            const target = result.redirectTo ?? '/admin/dashboard';
            router.replace(target);
            if (typeof window !== 'undefined') {
                if (fallbackRedirectTimeout.current !== null) {
                    window.clearTimeout(fallbackRedirectTimeout.current);
                }
                fallbackRedirectTimeout.current = window.setTimeout(() => {
                    if (window.location.pathname.startsWith('/admin-signup/complete')) {
                        window.location.assign(target);
                    }
                }, 1500);
            }
        },
        onError: (error) => {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }
            const message = error instanceof Error ? error.message : 'Unexpected bootstrap error.';
            setErrorMessage(message);
        },
    });

    useEffect(() => {
        const unsubscribe = useAdminBootstrapStore.persist.onFinishHydration(() => {
            setHasHydrated(true);
        });

        if (!useAdminBootstrapStore.persist.hasHydrated()) {
            Promise.resolve(useAdminBootstrapStore.persist.rehydrate()).catch(() => {
                setHasHydrated(true);
            });
        }

        return () => {
            if (fallbackRedirectTimeout.current !== null) {
                window.clearTimeout(fallbackRedirectTimeout.current);
                fallbackRedirectTimeout.current = null;
            }
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!hasHydrated || !token) {
            return;
        }

        if (lastBootstrapToken.current === token) {
            return;
        }

        lastBootstrapToken.current = token;
        mutate({ token });
    }, [hasHydrated, token, mutate]);

    const missingToken = hasHydrated && !token;
    const state: BootstrapState = {
        status: missingToken || errorMessage ? 'error' : isSuccess ? 'success' : 'loading',
        message: missingToken
            ? 'Missing bootstrap secret. Start again and enter the secret before continuing.'
            : errorMessage ?? undefined,
    };

    if (state.status === 'error') {
        return (
            <div className="space-y-4">
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Bootstrap failed</AlertTitle>
                    <AlertDescription>
                        <p>{state.message ?? 'Something went wrong.'}</p>
                    </AlertDescription>
                </Alert>
                <div className="flex items-center justify-between gap-3">
                    <Button asChild variant="outline" className="rounded-xl">
                        <Link href="/admin-signup">Try again</Link>
                    </Button>
                    <Button asChild className="rounded-xl">
                        <Link href="/login">Go to login</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Alert>
                {state.status === 'success' ? (
                    <ShieldCheck className="h-4 w-4" />
                ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <AlertTitle>
                    {state.status === 'success' ? 'Provisioned' : 'Provisioning admin access'}
                </AlertTitle>
                <AlertDescription>
                    <p>
                        {state.status === 'success'
                            ? 'Redirecting to your dashboard...'
                            : 'Setting up your platform organization and permissions.'}
                    </p>
                </AlertDescription>
            </Alert>
        </div>
    );
}
