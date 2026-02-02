"use client";

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { listPoliciesQuery, policyKeys } from './policies.api';
import { usePoliciesUiStore } from './policies-ui.store';
import { useRouter, useSearchParams } from 'next/navigation';

function normalizeCategoryQuery(value?: string) {
  if (!value) {
    return undefined;
  }
  const k = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const map: Record<string, 'BENEFITS' | 'CODE_OF_CONDUCT' | 'IT_SECURITY' | 'HEALTH_SAFETY' | 'HR_POLICIES' | 'PROCEDURES' | 'COMPLIANCE' | 'OTHER'> = {
    benefits: 'BENEFITS', benefit: 'BENEFITS', beneficios: 'BENEFITS',
    codeofconduct: 'CODE_OF_CONDUCT', conduct: 'CODE_OF_CONDUCT', ethics: 'CODE_OF_CONDUCT', behaviour: 'CODE_OF_CONDUCT', behavior: 'CODE_OF_CONDUCT', codigoodeconducta: 'CODE_OF_CONDUCT',
    itsecurity: 'IT_SECURITY', itsafety: 'IT_SECURITY', security: 'IT_SECURITY', seguridad: 'IT_SECURITY', securite: 'IT_SECURITY',
    healthsafety: 'HEALTH_SAFETY', safety: 'HEALTH_SAFETY', health: 'HEALTH_SAFETY', salud: 'HEALTH_SAFETY', sante: 'HEALTH_SAFETY',
    hrpolicies: 'HR_POLICIES', hrpolicy: 'HR_POLICIES', procedures: 'PROCEDURES', procedure: 'PROCEDURES', compliance: 'COMPLIANCE', other: 'OTHER'
  };
  return map[k];
}

const CATEGORY_LABEL: Record<string, string> = {
  BENEFITS: 'Benefits', CODE_OF_CONDUCT: 'Code of Conduct', IT_SECURITY: 'IT Security', HEALTH_SAFETY: 'Health & Safety', HR_POLICIES: 'HR Policies', PROCEDURES: 'Procedures', COMPLIANCE: 'Compliance', OTHER: 'Other'
};

export function PoliciesHeaderClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = (searchParams.get('q') ?? '').trim();
  const nocatParameter = (searchParams.get('nocat') ?? '').toLowerCase();
  const nocatPref = usePoliciesUiStore((s) => s.nocatDefault);
  const nocat = nocatParameter === '1' || nocatParameter === 'true' || (nocatParameter === '' && nocatPref);
  const autoCategory = !nocat ? normalizeCategoryQuery(q) : undefined;
  const queryClient = useQueryClient();
  const { data = [] } = useQuery(listPoliciesQuery(q || undefined, nocat));
  const density = usePoliciesUiStore((s) => s.density);
  const setDensity = usePoliciesUiStore((s) => s.setDensity);
  const nextDensity = density === 'comfortable' ? 'compact' : 'comfortable';

  useEffect(() => {
    let last: number | null = null;
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'g') {
        return;
      }
      const now = Date.now();
      if (last && now - last < 450) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        last = null;
      } else {
        last = now;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: policyKeys.list(q || undefined, nocat) }).catch(() => null);
  };
  const onClearCategoryMap = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('nocat', '1');
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span id="policies-kbd-gg-hint" className="sr-only">Keyboard: press g twice to jump to the top.</span>
      <Badge variant="secondary">{data.length} {q ? 'matching' : 'total'}</Badge>
      {autoCategory ? (
        <Badge variant="outline" aria-label={`Auto-mapped category ${CATEGORY_LABEL[autoCategory]}`}>Category: {CATEGORY_LABEL[autoCategory]}</Badge>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 px-2"
        onClick={onRefresh}
        aria-label="Refresh policies"
      >
        Refresh
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 px-2"
        aria-label={`Switch to ${nextDensity} density`}
        onClick={() => setDensity(nextDensity)}
      >
        {density === 'comfortable' ? 'Compact' : 'Comfortable'}
      </Button>
      {autoCategory ? (
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={onClearCategoryMap} aria-label="Disable category auto-mapping">Clear</Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 px-2"
        onClick={() => {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }}
        aria-label="Jump to Top"
        aria-describedby="policies-kbd-gg-hint"
      >
        Top
      </Button>
    </div>
  );
}
