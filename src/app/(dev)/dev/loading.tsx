import type { Metadata } from 'next';

const shimmer = 'animate-pulse bg-emerald-900/40';

export const metadata: Metadata = {
    title: 'Dev Admin Dashboard - Loading',
};

export default function DevelopmentDashboardLoading() {
    return (
        <div className="space-y-6 p-2">
            <header className="space-y-2">
                <div className={`${shimmer} h-3 w-28 rounded-full`} />
                <div className={`${shimmer} h-7 w-72 rounded`} />
                <div className={`${shimmer} h-4 w-80 rounded`} />
            </header>

            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((key) => (
                    <article
                        key={key}
                        className="rounded-2xl border border-emerald-900/70 bg-emerald-950/40 p-4 shadow-lg shadow-black/20"
                    >
                        <div className={`${shimmer} h-5 w-5 rounded`} />
                        <div className="mt-3 space-y-2">
                            <div className={`${shimmer} h-5 w-40 rounded`} />
                            <div className={`${shimmer} h-4 w-full rounded`} />
                            <div className={`${shimmer} h-4 w-3/4 rounded`} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {[1, 2, 3].map((chip) => (
                                <div
                                    key={chip}
                                    className={`${shimmer} h-8 w-28 rounded-full border border-emerald-900/70`}
                                />
                            ))}
                        </div>
                    </article>
                ))}
            </section>

            <section className="rounded-2xl border border-emerald-900/70 bg-emerald-950/50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <div className={`${shimmer} h-4 w-48 rounded`} />
                        <div className={`${shimmer} h-3 w-64 rounded`} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((link) => (
                            <div
                                key={link}
                                className={`${shimmer} h-8 w-32 rounded-full border border-emerald-900/70`}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
