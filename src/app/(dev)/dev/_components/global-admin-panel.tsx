'use client';

import { useState, useTransition, useEffect } from 'react';
import { UserPlus, Users, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listGlobalAdmins, createGlobalAdmin, bootstrapDefaultAdmins, runDevelopmentColdStart } from '../_actions/admin-tools';

interface AdminUser {
    id: string;
    email: string;
    displayName: string | null;
    roleKey: string;
    createdAt: Date;
}

export function GlobalAdminPanel() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [message, setMessage] = useState('');
    const [failures, setFailures] = useState<{ step: string; message: string }[]>([]);
    const [isPending, startTransition] = useTransition();

    const loadAdmins = () => {
        startTransition(async () => {
            const result = await listGlobalAdmins();
            setAdmins(result);
        });
    };

    useEffect(() => {
        loadAdmins();
    }, []);

    const handleCreate = () => {
        if (!email.trim()) {
            setMessage('Email is required');
            setFailures([]);
            return;
        }
        startTransition(async () => {
            const result = await createGlobalAdmin(email, displayName);
            setMessage(result.message);
            setFailures([]);
            if (result.success) {
                setEmail('');
                setDisplayName('');
                loadAdmins();
            }
        });
    };

    const handleBootstrap = () => {
        startTransition(async () => {
            const result = await bootstrapDefaultAdmins();
            setMessage(result.message);
            setFailures([]);
            if (result.success) {
                loadAdmins();
            }
        });
    };

    const handleColdStart = () => {
        startTransition(async () => {
            const result = await runDevelopmentColdStart();
            setMessage(result.message);
            setFailures(result.failures ?? []);
            if (result.success) {
                loadAdmins();
            }
        });
    };

    return (
        <article className="rounded-xl p-5" data-ui-surface="container">
            {/* Gradient icon box */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-primary to-accent text-white shadow-lg shadow-primary/25">
                <Users className="h-5 w-5" />
            </div>

            {/* Typography */}
            <h2 className="mt-4 text-lg font-semibold tracking-tight">Global Admin Management</h2>
            <p className="mt-1 text-sm text-muted-foreground/80">
                Bootstrap and manage global administrator accounts.
            </p>

            {/* Primary action button - glass style with glow */}
            <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleBootstrap}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary shadow-sm shadow-primary/15 transition-all duration-200 hover:bg-primary/20 hover:shadow-md hover:shadow-primary/25 disabled:opacity-50"
                    >
                        <UserPlus className="h-4 w-4" />
                        Bootstrap Default Admins
                    </button>
                    <button
                        onClick={handleColdStart}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-600 shadow-sm shadow-emerald-500/15 transition-all duration-200 hover:bg-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/25 disabled:opacity-50"
                    >
                        <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
                        Run Full Cold Start
                    </button>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground/70">
                    Bootstrap default admins or run full cold start (platform org, roles, permissions, and demo data).
                </p>
            </div>

            {/* Input fields - minimal style, focus ring via shadow */}
            <div className="mt-4 space-y-2">
                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-shadow duration-200 focus:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-slot="input"
                />
                <input
                    type="text"
                    placeholder="Display name (optional)"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-shadow duration-200 focus:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-slot="input"
                />
                <button
                    onClick={handleCreate}
                    disabled={isPending || !email.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted disabled:opacity-50"
                >
                    <UserPlus className="h-4 w-4" />
                    Add Admin
                </button>
            </div>

            {/* Message toast - accent colored */}
            {message && (
                <div className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground shadow-inner">
                    <p className="font-medium">{message}</p>
                    {failures.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-rose-600">
                            {failures.map((failure) => (
                                <li key={`${failure.step}-${failure.message}`} className="rounded-md bg-rose-500/10 px-2 py-1">
                                    <span className="font-semibold">{failure.step}</span>: {failure.message}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Admin list section */}
            <div className="mt-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground/90">Current Admins</h3>
                    <button
                        onClick={loadAdmins}
                        disabled={isPending}
                        title="Refresh admin list"
                        className="rounded-md p-1.5 text-primary/70 transition-colors hover:bg-muted/50 hover:text-primary disabled:opacity-50"
                    >
                        <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
                    </button>
                </div>

                {admins.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground/60">No admins found</p>
                ) : (
                    <ul className="mt-2 space-y-1">
                        {admins.map((admin) => (
                            <li
                                key={admin.id}
                                className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm"
                                data-ui-surface="item"
                            >
                                <div>
                                    <span className="font-medium">{admin.email}</span>
                                    {admin.displayName && (
                                        <span className="ml-2 text-muted-foreground/70">({admin.displayName})</span>
                                    )}
                                </div>
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    {admin.roleKey}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </article>
    );
}
