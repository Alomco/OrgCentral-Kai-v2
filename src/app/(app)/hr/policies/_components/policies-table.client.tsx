"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import type { HRPolicy } from '@/server/types/hr-ops-types';
import { listPoliciesQuery } from './policies.api';
import { Badge } from '@/components/ui/badge';
import { formatHumanDate } from '../../_components/format-date';
import { usePoliciesUiStore } from './policies-ui.store';

function sortByEffectiveDateDesc(policies: HRPolicy[]): HRPolicy[] {
  return [...policies].sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());
}

export function PoliciesTableClient({ initial }: { initial: HRPolicy[] }) {
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim();
  const nocat = ((searchParams.get('nocat') ?? '').toLowerCase() === '1' || (searchParams.get('nocat') ?? '').toLowerCase() === 'true');
  const { data = initial } = useQuery({ ...listPoliciesQuery(q || undefined, nocat), initialData: initial });
  const policies = sortByEffectiveDateDesc(data);
  const density = usePoliciesUiStore((s) => s.density);
  const rowPad = density === 'compact' ? 'py-1' : 'py-2';

  if (policies.length === 0) {
    return <div className="text-sm text-muted-foreground">No policies are available yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[720px] w-full text-sm">
        <thead className="border-b text-left">
          <tr>
            <th className={`px-2 ${rowPad} font-medium`}>Title</th>
            <th className={`px-2 ${rowPad} font-medium`}>Category</th>
            <th className={`px-2 ${rowPad} font-medium`}>Version</th>
            <th className={`px-2 ${rowPad} font-medium`}>Effective</th>
            <th className={`px-2 ${rowPad} font-medium`}>Status</th>
            <th className={`px-2 ${rowPad} font-medium`}>Ack</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((policy) => (
            <tr key={policy.id} className="border-b last:border-b-0 hover:bg-muted/50">
              <td className={`px-2 ${rowPad} min-w-0 max-w-[280px]`}>
                <Link
                  href={`/hr/policies/${policy.id}`}
                  className="block truncate font-medium underline underline-offset-4"
                  title={policy.title}
                >
                  {policy.title}
                </Link>
              </td>
              <td className={`px-2 ${rowPad} max-w-[180px] truncate text-muted-foreground`}>
                {policy.category}
              </td>
              <td className={`px-2 ${rowPad} text-muted-foreground`}>{policy.version}</td>
              <td className={`px-2 ${rowPad} whitespace-nowrap text-muted-foreground`}>
                {formatHumanDate(policy.effectiveDate)}
              </td>
              <td className={`px-2 ${rowPad}`}>
                <Badge variant="outline">{policy.status}</Badge>
              </td>
              <td className={`px-2 ${rowPad}`}>
                <Badge variant={policy.requiresAcknowledgment ? 'secondary' : 'outline'}>
                  {policy.requiresAcknowledgment ? 'Required' : 'Optional'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
