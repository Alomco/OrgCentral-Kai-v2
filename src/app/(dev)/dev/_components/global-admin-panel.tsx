'use client';

import { useState, useTransition, useEffect } from 'react';
import { UserPlus, Users, RefreshCw } from 'lucide-react';
import { listGlobalAdmins, createGlobalAdmin, bootstrapDefaultAdmins } from '../_actions/admin-tools';

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
            return;
        }
        startTransition(async () => {
            const result = await createGlobalAdmin(email, displayName);
            setMessage(result.message);
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
            if (result.success) {
                loadAdmins();
            }
        });
    };

    return (
        <article className="rounded-2xl border border-emerald-900/70 bg-emerald-950/40 p-4 shadow-lg shadow-black/20">
            <Users className="h-5 w-5 text-emerald-200" />
            <h2 className="mt-3 text-lg font-semibold text-emerald-100">Global Admin Management</h2>
            <p className="mt-2 text-sm text-emerald-200/70">
                Bootstrap and manage global administrator accounts.
            </p>

            {/* Quick Bootstrap */}
            <div className="mt-4">
                <button
                    onClick={handleBootstrap}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-emerald-900/30 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-500 hover:bg-emerald-900/50 disabled:opacity-50"
                >
                    <UserPlus className="h-4 w-4" />
                    Bootstrap Default Admins
                </button>
                <p className="mt-1 text-xs text-emerald-200/50">
                    Creates: bdturag01@gmail.com (Global), aant1563@gmail.com (Dev)
                </p>
            </div>

            {/* Manual Create */}
            <div className="mt-4 space-y-2">
                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-emerald-800 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-100 placeholder-emerald-500 focus:border-emerald-600 focus:outline-none"
                />
                <input
                    type="text"
                    placeholder="Display name (optional)"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full rounded-lg border border-emerald-800 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-100 placeholder-emerald-500 focus:border-emerald-600 focus:outline-none"
                />
                <button
                    onClick={handleCreate}
                    disabled={isPending || !email.trim()}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-medium text-emerald-100 transition hover:border-emerald-500 disabled:opacity-50"
                >
                    <UserPlus className="h-4 w-4" />
                    Add Admin
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className="mt-3 rounded-lg border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
                    {message}
                </div>
            )}

            {/* Admin List */}
            <div className="mt-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-emerald-200">Current Admins</h3>
                    <button
                        onClick={loadAdmins}
                        disabled={isPending}
                        title="Refresh admin list"
                        className="p-1 text-emerald-400 hover:text-emerald-200 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                {admins.length === 0 ? (
                    <p className="mt-2 text-sm text-emerald-200/50">No admins found</p>
                ) : (
                    <ul className="mt-2 space-y-1">
                        {admins.map((admin) => (
                            <li
                                key={admin.id}
                                className="flex items-center justify-between rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-3 py-2 text-sm"
                            >
                                <div>
                                    <span className="text-emerald-100">{admin.email}</span>
                                    {admin.displayName && (
                                        <span className="ml-2 text-emerald-300/50">({admin.displayName})</span>
                                    )}
                                </div>
                                <span className="rounded-full border border-emerald-800 px-2 py-0.5 text-xs text-emerald-400">
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
