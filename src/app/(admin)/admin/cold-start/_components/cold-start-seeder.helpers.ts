import { SEED_CATEGORY_DEFINITIONS } from '@/lib/seed/cold-start-plan';
import type {
    SeedCategoryId,
    SeedCategorySelection,
    SeedDatasetSize,
} from '@/server/types/seeder/cold-start';

export type SeedSelectionMap = Record<SeedCategoryId, SeedCategorySelection>;

export const DATASET_LABELS: Record<SeedDatasetSize, string> = {
    minimal: 'Minimal',
    full: 'Full',
};

export function createInitialSelections(): SeedSelectionMap {
    return SEED_CATEGORY_DEFINITIONS.reduce<SeedSelectionMap>((accumulator, definition) => {
        accumulator[definition.id] = {
            id: definition.id,
            enabled: definition.group === 'platform',
            dataset: 'minimal',
            count: definition.count?.defaults.minimal,
        };
        return accumulator;
    }, {} as SeedSelectionMap);
}
