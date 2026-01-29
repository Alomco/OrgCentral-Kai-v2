"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
    const [state, setState] = useState<BootstrapState>({ status: 'loading' });
    const [hasHydrated, setHasHydrated] = useState(() => useAdminBootstrapStore.persist.hasHydrated());
    const clearToken = useAdminBootstrapStore((store) => store.clearToken);
    const token = useAdminBootstrapStore((store) => store.token);

    const mutation = useMutation({
        mutationFn: bootstrapAdmin,
        onSuccess: (result) => {
            clearToken();
            setState({ status: 'success' });
            router.replace(result.redirectTo ?? '/admin/dashboard');
        },
        onError: (error) => {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }
            const message = error instanceof Error ? error.message : 'Unexpected bootstrap error.';
            setState({ status: 'error', message });
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
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!hasHydrated) {
            return;
        }

        // Read token after hydration to avoid SSR/CSR markup drift.
        if (!token) {
            queueMicrotask(() => {
                setState({
                    status: 'error',
                    message: 'Missing bootstrap secret. Start again and enter the secret before continuing.',
                });
            });
            return;
        }

        const controller = new AbortController();

        setState({ status: 'loading' });
        void mutation.mutateAsync({ token, signal: controller.signal });

        return () => controller.abort();
    }, [clearToken, hasHydrated, mutation, token]);

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
