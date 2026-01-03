import type { Metadata } from 'next';
import Link from 'next/link';

import { ThemeTogglePanel } from '../_components/theme-toggle-panel';
import { GlobalAdminPanel } from '../_components/global-admin-panel';
import { DataSeederPanel } from '../_components/data-seeder-panel';

export const metadata: Metadata = {
    title: 'Dev Admin Dashboard - OrgCentral',
    description: 'Development-only controls for platform diagnostics and tooling.',
};

export default function DevelopmentDashboardPage() {
    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/70">Dev admin</p>
                <h1 className="text-3xl font-semibold text-emerald-100">Development control center</h1>
                <p className="text-sm text-emerald-200/70">
                    Tools, diagnostics, and feature switches for the local environment.
                </p>
            </header>

            {/* Main Tool Panels */}
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <ThemeTogglePanel />
                <GlobalAdminPanel />
                <DataSeederPanel />
            </section>

            {/* Navigation */}
            <section className="rounded-2xl border border-emerald-900/70 bg-emerald-950/50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-emerald-100">Back to the employee UI</p>
                        <p className="text-xs text-emerald-200/70">Return to the standard workspace layout.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center rounded-full border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-600 hover:text-white"
                        >
                            Employee dashboard
                        </Link>
                        <Link
                            href="/org/profile"
                            className="inline-flex items-center justify-center rounded-full border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-600 hover:text-white"
                        >
                            Organization
                        </Link>
                        <Link
                            href="/hr/dashboard"
                            className="inline-flex items-center justify-center rounded-full border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-600 hover:text-white"
                        >
                            HR Dashboard
                        </Link>
                        <Link
                            href="/hr/employees"
                            className="inline-flex items-center justify-center rounded-full border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-600 hover:text-white"
                        >
                            Employees
                        </Link>
                        <Link
                            href="/admin/dashboard"
                            className="inline-flex items-center justify-center rounded-full border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-600 hover:text-white"
                        >
                            Admin Dashboard
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
