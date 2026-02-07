import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { InfoButton } from '@/components/ui/info-button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SEED_CATEGORY_MAP } from '@/lib/seed/cold-start-plan';
import type {
    SeedCategoryId,
    SeedCategorySelection,
    SeedDatasetSize,
} from '@/server/types/seeder/cold-start';
import { DATASET_LABELS } from './cold-start-seeder.helpers';
import { buildCategoryInfo } from './cold-start-info';

interface CategoryRowProps {
    selection: SeedCategorySelection;
    requiresEmployees?: boolean;
    employeesEnabled: boolean;
    onToggle: (id: SeedCategoryId, enabled: boolean) => void;
    onDatasetChange: (id: SeedCategoryId, dataset: SeedDatasetSize) => void;
    onCountChange: (id: SeedCategoryId, value: string) => void;
}

export function ColdStartCategoryRow({
    selection,
    requiresEmployees,
    employeesEnabled,
    onToggle,
    onDatasetChange,
    onCountChange,
}: CategoryRowProps) {
    const definition = SEED_CATEGORY_MAP[selection.id];
    const showDependencyWarning = Boolean(requiresEmployees && !employeesEnabled && selection.enabled);

    return (
        <div className="rounded-xl border border-border/50 bg-background/60 p-4">
            <div className="flex flex-wrap items-start gap-4">
                <label className="flex flex-1 items-start gap-3">
                    <Checkbox
                        checked={selection.enabled}
                        onCheckedChange={(checked) => onToggle(selection.id, checked === true)}
                    />
                    <span className="space-y-1">
                        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                            {definition.label}
                            <InfoButton
                                label={definition.label}
                                sections={buildCategoryInfo({
                                    description: definition.description,
                                    requiresEmployees,
                                })}
                            />
                        </span>
                        <span className="block text-xs text-muted-foreground">{definition.description}</span>
                        {showDependencyWarning ? (
                            <span className="block text-xs text-amber-600">
                                Requires employees to be seeded first.
                            </span>
                        ) : null}
                    </span>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        value={selection.dataset}
                        onValueChange={(value) => onDatasetChange(selection.id, value as SeedDatasetSize)}
                        disabled={!selection.enabled}
                    >
                        <SelectTrigger className="min-w-[120px]">
                            <SelectValue placeholder="Dataset" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(DATASET_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {definition.count ? (
                        <div className="min-w-[140px]">
                            <Input
                                type="number"
                                min={definition.count.min}
                                max={definition.count.max}
                                value={selection.count ?? ''}
                                onChange={(event) => onCountChange(selection.id, event.target.value)}
                                disabled={!selection.enabled}
                            />
                            <p className="mt-1 text-[10px] text-muted-foreground">
                                Range {definition.count.min}–{definition.count.max}
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
