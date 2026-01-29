"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Input } from '@/components/ui/input';

export function PoliciesFiltersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const onChange = useCallback((value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value.trim().length > 0) {next.set('q', value);} else {next.delete('q');}
    startTransition(() => { router.replace(`?${next.toString()}`, { scroll: false }); });
  }, [router, searchParams]);

  return (
    <div className="w-full sm:w-80">
      <Input
        aria-label="Search policies"
        placeholder="Search policies..."
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={isPending}
        className="h-9"
      />
    </div>
  );
}
