#!/usr/bin/env tsx
/**
 * Seed script for tenant theme presets
 * 
 * This script populates the Organization.settings.theme field with
 * professional, vibrant theme presets for development and testing.
 * 
 * Usage:
 *   pnpm tsx prisma/scripts/seed-tenant-themes.ts
 */

/* eslint-disable no-console */

import { PrismaClient } from '@prisma/client';
import { themePresets, getPresetOptions } from '../../src/server/theme/theme-presets';

const prisma = new PrismaClient();

type ThemePresetId = keyof typeof themePresets;

interface TenantThemeAssignment {
    orgId: string;
    orgName: string;
    presetId: ThemePresetId;
}

function normalizeSettings(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return value as Record<string, unknown>;
}

/**
 * Demo tenant theme assignments
 * Maps organizations to their theme presets
 */
const themeAssignments: TenantThemeAssignment[] = [
    {
        orgId: 'demo-corp',
        orgName: 'Demo Corporation',
        presetId: 'cyberpunk-purple',
    },
    {
        orgId: 'tech-innovations',
        orgName: 'Tech Innovations Ltd',
        presetId: 'ocean-depths',
    },
    {
        orgId: 'creative-studio',
        orgName: 'Creative Studio Inc',
        presetId: 'sunset-blaze',
    },
    {
        orgId: 'green-energy',
        orgName: 'Green Energy Solutions',
        presetId: 'forest-emerald',
    },
    {
        orgId: 'digital-matrix',
        orgName: 'Digital Matrix Systems',
        presetId: 'neon-electric',
    },
    {
        orgId: 'luxury-brands',
        orgName: 'Luxury Brands Group',
        presetId: 'royal-velvet',
    },
    {
        orgId: 'fire-tech',
        orgName: 'FireTech Enterprises',
        presetId: 'inferno-red',
    },
    {
        orgId: 'wellness-spa',
        orgName: 'Wellness & Spa Co',
        presetId: 'cherry-blossom',
    },
    {
        orgId: 'space-ventures',
        orgName: 'Space Ventures LLC',
        presetId: 'galaxy-indigo',
    },
    {
        orgId: 'citrus-marketing',
        orgName: 'Citrus Marketing Agency',
        presetId: 'tangerine-dream',
    },
    {
        orgId: 'ruby-consulting',
        orgName: 'Ruby Consulting Group',
        presetId: 'ruby-matrix',
    },
];

/**
 * Seed a single organization with theme preset
 */
async function seedOrganizationTheme(assignment: TenantThemeAssignment): Promise<void> {
    const { orgId, orgName, presetId } = assignment;
    const preset = themePresets[presetId];

    // Check if org exists (use slug; Organization.id is a UUID)
    const existing = await prisma.organization.findUnique({
        where: { slug: orgId },
        select: { id: true, name: true, settings: true },
    });

    if (existing) {
        // Update existing organization theme
        const currentSettings = normalizeSettings(existing.settings);

        await prisma.organization.update({
            where: { slug: orgId },
            data: {
                settings: {
                    ...currentSettings,
                    theme: {
                        presetId,
                        customOverrides: {},
                        updatedAt: new Date().toISOString(),
                    },
                },
            },
        });

        console.log(`✅ Updated theme for existing org: ${existing.name} → ${preset.emoji} ${preset.name}`);
    } else {
        // Create new demo organization with theme
        await prisma.organization.create({
            data: {
                slug: orgId,
                name: orgName,
                dataResidency: 'UK_ONLY',
                dataClassification: 'OFFICIAL',
                regionCode: 'GB',
                tenantId: orgId,
                settings: {
                    theme: {
                        presetId,
                        customOverrides: {},
                        updatedAt: new Date().toISOString(),
                    },
                },
            },
        });

        console.log(`🎨 Created new org with theme: ${orgName} → ${preset.emoji} ${preset.name}`);
    }
}

/**
 * Main seed function
 */
async function main() {
    console.log('🎨 Starting tenant theme seed...\n');

    const presetOptions = getPresetOptions();
    console.log(`📦 Available theme presets (${String(presetOptions.length)}):`);
    presetOptions.forEach(({ emoji, name, description }) => {
        console.log(`   ${emoji} ${name} - ${description}`);
    });
    console.log('');

    console.log(`🏢 Seeding ${String(themeAssignments.length)} organizations with themes...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const assignment of themeAssignments) {
        try {
            await seedOrganizationTheme(assignment);
            successCount++;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`❌ Failed to seed ${assignment.orgName}: ${message}`);
            errorCount++;
        }
    }

    console.log('');
    console.log('📊 Seed Summary:');
    console.log(`   ✅ Success: ${String(successCount)}`);
    console.log(`   ❌ Errors: ${String(errorCount)}`);
    console.log(`   📦 Total themes: ${String(presetOptions.length)}`);
    console.log('');
    console.log('✨ Theme seed complete!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Start dev server: pnpm dev');
    console.log('   2. Switch organizations to see different themes');
    console.log('   3. Use DevToolsThemeWidget to test themes in real-time');
}

async function run() {
    try {
        await main();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ Seed failed: ${message}`);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

void run().catch(() => {
    process.exit(1);
});
