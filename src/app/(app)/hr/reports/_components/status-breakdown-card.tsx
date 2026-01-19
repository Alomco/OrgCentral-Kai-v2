import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { formatCount } from '../reports-utils';

export interface StatusBreakdownRow {
    label: string;
    count: number;
    tone: 'warning' | 'success' | 'neutral';
}

export interface StatusBreakdownCardProps {
    title: string;
    description: string;
    total: number;
    rows: StatusBreakdownRow[];
}

export function StatusBreakdownCard({ title, description, total, rows }: StatusBreakdownCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {rows.map((row) => {
                    const percent = total > 0 ? Math.round((row.count / total) * 100) : 0;
                    return (
                        <div key={row.label} className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{row.label}</span>
                                <span>{formatCount(row.count)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted">
                                <div
                                    className={`h-2 rounded-full ${toneClass(row.tone)}`}
                                    style={{ width: `${String(percent)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
                {total === 0 ? (
                    <p className="text-xs text-muted-foreground">No items recorded for this module yet.</p>
                ) : null}
            </CardContent>
        </Card>
    );
}

function toneClass(tone: 'warning' | 'success' | 'neutral'): string {
    if (tone === 'warning') {
        return 'bg-secondary';
    }
    if (tone === 'success') {
        return 'bg-accent';
    }
    return 'bg-muted-foreground';
}
