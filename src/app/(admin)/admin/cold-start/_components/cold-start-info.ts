import type { InfoSection } from '@/components/ui/info-button'

export const PLATFORM_ESSENTIALS_INFO: InfoSection[] = [
    { label: 'What', text: 'Core data for a working org.' },
    { label: 'Prereqs', text: 'Org ID and seeder access.' },
    { label: 'Next', text: 'Enable required categories first.' },
    { label: 'Compliance', text: 'Seeder writes are audited.' },
]

export const DEMO_DATA_INFO: InfoSection[] = [
    { label: 'What', text: 'Optional sample data for walkthroughs.' },
    { label: 'Prereqs', text: 'Platform essentials enabled.' },
    { label: 'Next', text: 'Choose dataset size before running.' },
    { label: 'Compliance', text: 'Demo data is tagged and auditable.' },
]

export const RUN_SEEDER_INFO: InfoSection[] = [
    { label: 'What', text: 'Run the selected seed plan.' },
    { label: 'Prereqs', text: 'Selections valid and dependencies met.' },
    { label: 'Next', text: 'Review the summary and step results.' },
    { label: 'Compliance', text: 'Seeder actions are logged for audit.' },
]

export function buildCategoryInfo(options: {
    description: string
    requiresEmployees?: boolean
}): InfoSection[] {
    return [
        { label: 'What', text: options.description },
        {
            label: 'Prereqs',
            text: options.requiresEmployees
                ? 'Employees must be seeded first.'
                : 'No special prerequisites.',
        },
        { label: 'Next', text: 'Select dataset size and count if available.' },
        { label: 'Compliance', text: 'Seeded data is logged with provenance.' },
    ]
}
