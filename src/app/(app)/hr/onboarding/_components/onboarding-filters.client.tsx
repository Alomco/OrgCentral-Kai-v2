"use client";

import { parseAsInteger, useQueryState } from 'nuqs';

export function OnboardingFiltersClient() {
  const [limit, setLimit] = useQueryState('limit', parseAsInteger.withDefault(25).withOptions({ shallow: false }));
  return (
    <div className="flex items-center gap-2 text-xs">
      <label className="flex items-center gap-2">
        <span className="text-muted-foreground">Limit</span>
        <input
          className="h-8 w-20 rounded-md border bg-background px-2"
          type="number"
          min={1}
          max={200}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value) || 25)}
          aria-label="Invitation list size"
        />
      </label>
    </div>
  );
}
