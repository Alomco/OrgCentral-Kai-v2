'use client';

import { useState, useTransition, useEffect } from 'react';
import { Database, Users, Calendar, Building2, Trash2, RefreshCw, ShieldCheck } from 'lucide-react';
import {
    seedFakeEmployees,
    seedFakeLeaveRequests,
    seedFakeDepartments,
    clearSeededData,
    getSeededDataStats,
    seedAbacPolicies,
    getAbacPolicyStatus,
} from '../_actions/seed-fake-data';

export function DataSeederPanel() {
    const [stats, setStats] = useState({ employees: 0, leaveRequests: 0, departments: 0 });
    const [abacStatus, setAbacStatus] = useState({ hasAbacPolicies: false, policyCount: 0 });
    const [message, setMessage] = useState('');
    const [isPending, startTransition] = useTransition();

    const loadStats = () => {
        startTransition(async () => {
            const [dataStats, abac] = await Promise.all([
                getSeededDataStats(),
                getAbacPolicyStatus(),
            ]);
            setStats(dataStats);
            setAbacStatus(abac);
        });
    };

    useEffect(() => {
        loadStats();
    }, []);

    const handleSeedEmployees = (count: number) => {
        startTransition(async () => {
            const result = await seedFakeEmployees(count);
            setMessage(result.message);
            if (result.success) { loadStats(); }
        });
    };

    const handleSeedLeave = (count: number) => {
        startTransition(async () => {
            const result = await seedFakeLeaveRequests(count);
            setMessage(result.message);
            if (result.success) { loadStats(); }
        });
    };

    const handleSeedDepartments = (count: number) => {
        startTransition(async () => {
            const result = await seedFakeDepartments(count);
            setMessage(result.message);
            if (result.success) { loadStats(); }
        });
    };

    const handleClear = () => {
        startTransition(async () => {
            const result = await clearSeededData();
            setMessage(result.message);
            if (result.success) { loadStats(); }
        });
    };

    const handleSeedAbac = () => {
        startTransition(async () => {
            const result = await seedAbacPolicies();
            setMessage(result.message);
            if (result.success) { loadStats(); }
        });
    };

    const seedButtons = [
        { label: '5 Employees', onClick: () => handleSeedEmployees(5), icon: Users },
        { label: '10 Employees', onClick: () => handleSeedEmployees(10), icon: Users },
        { label: '25 Employees', onClick: () => handleSeedEmployees(25), icon: Users },
        { label: '5 Departments', onClick: () => handleSeedDepartments(5), icon: Building2 },
        { label: '10 Leave Requests', onClick: () => handleSeedLeave(10), icon: Calendar },
        { label: '25 Leave Requests', onClick: () => handleSeedLeave(25), icon: Calendar },
    ];

    return (
        <article className="rounded-2xl border border-emerald-900/70 bg-emerald-950/40 p-4 shadow-lg shadow-black/20">
            <Database className="h-5 w-5 text-emerald-200" />
            <h2 className="mt-3 text-lg font-semibold text-emerald-100">Data Seeder</h2>
            <p className="mt-2 text-sm text-emerald-200/70">
                Generate fake data using Faker for testing.
            </p>

            {/* Stats */}
            <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full border border-emerald-800 px-3 py-1 text-sm">
                    <Users className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-100">{stats.employees} employees</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-800 px-3 py-1 text-sm">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-100">{stats.leaveRequests} leave requests</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-800 px-3 py-1 text-sm">
                    <Building2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-100">{stats.departments} departments</span>
                </div>
                <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${abacStatus.hasAbacPolicies ? 'border-emerald-600 bg-emerald-900/30' : 'border-amber-700 bg-amber-950/30'}`}>
                    <ShieldCheck className={`h-4 w-4 ${abacStatus.hasAbacPolicies ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className={abacStatus.hasAbacPolicies ? 'text-emerald-100' : 'text-amber-200'}>
                        {abacStatus.hasAbacPolicies ? `${String(abacStatus.policyCount)} ABAC policies` : 'No ABAC policies'}
                    </span>
                </div>
                <button
                    onClick={loadStats}
                    disabled={isPending}
                    className="p-1 text-emerald-400 hover:text-emerald-200 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Seed Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
                {seedButtons.map(({ label, onClick, icon: Icon }) => (
                    <button
                        key={label}
                        onClick={onClick}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-800 px-3 py-1.5 text-sm font-medium text-emerald-200 transition hover:border-emerald-600 hover:text-emerald-100 disabled:opacity-50"
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Clear & ABAC Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    onClick={handleSeedAbac}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg border border-sky-700 px-3 py-1.5 text-sm font-medium text-sky-200 transition hover:border-sky-500 hover:bg-sky-950/30 hover:text-sky-100 disabled:opacity-50"
                >
                    <ShieldCheck className="h-4 w-4" />
                    Seed ABAC Policies
                </button>
                <button
                    onClick={handleClear}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-800 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:border-red-600 hover:bg-red-950/30 hover:text-red-200 disabled:opacity-50"
                >
                    <Trash2 className="h-4 w-4" />
                    Clear All Seeded Data
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className="mt-3 rounded-lg border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
                    {message}
                </div>
            )}
        </article>
    );
}
