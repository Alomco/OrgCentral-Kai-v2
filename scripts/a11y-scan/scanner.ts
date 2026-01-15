import type { Browser, Page } from 'playwright';
import { injectAxe } from 'axe-playwright';
import { a11yLogger } from './logger';
import type { A11yImpact, ScanResult } from './types';
import {
    closeBrowser,
    createPage,
    launchBrowser,
    resolveTimeouts,
    type ScanSession,
} from './session';

const AXE_RULES = {
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: true },
    'image-alt': { enabled: true },
    'label': { enabled: true },
    'button-name': { enabled: true },
    'link-name': { enabled: true },
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'heading-order': { enabled: true },
    'html-has-lang': { enabled: true },
    'landmark-one-main': { enabled: true },
    'meta-viewport': { enabled: true },
    'page-has-heading-one': { enabled: true },
} as const;

interface AxeRunConfig {
    runOnly: {
        type: 'tag';
        values: string[];
    };
    rules: typeof AXE_RULES;
}

interface AxeRunResult {
    violations: {
        id: string;
        impact?: A11yImpact;
        description: string;
        help: string;
        helpUrl: string;
        nodes: {
            html: string;
            target: string[];
            failureSummary?: string;
        }[];
    }[];
    passes: { id: string }[];
    incomplete: { id: string }[];
}

async function runAxeScan(page: Page, url: string): Promise<ScanResult> {
    const timeouts = resolveTimeouts();
    const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: timeouts.pageTimeoutMs,
    });

    if (!response || response.status() >= 400) {
        a11yLogger.warn('a11y.scan.page-response-warning', {
            url,
            status: response?.status() ?? 'unknown',
        });
    }

    await page.waitForTimeout(timeouts.postLoadDelayMs);
    await injectAxe(page);

    const results = await page.evaluate<AxeRunResult, typeof AXE_RULES>((rules) => {
        const axeRunner = (globalThis as unknown as {
            axe: { run: (config: AxeRunConfig) => Promise<AxeRunResult> };
        }).axe;
        return axeRunner.run({
            runOnly: {
                type: 'tag',
                values: ['wcag2aa', 'wcag21aa', 'wcag2aaa', 'best-practice'],
            },
            rules,
        });
    }, AXE_RULES);

    const normalizedViolations = results.violations.map((violation) => ({
        ...violation,
        impact: violation.impact ?? 'minor',
    }));

    return {
        url,
        timestamp: new Date().toISOString(),
        violations: normalizedViolations,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
    };
}

export async function scanPageWithSession(session: ScanSession, url: string): Promise<ScanResult> {
    a11yLogger.info('a11y.scan.page-start', { url });
    const page = await session.context.newPage();

    try {
        const result = await runAxeScan(page, url);
        a11yLogger.info('a11y.scan.page-complete', {
            url,
            violations: result.violations.length,
            passes: result.passes,
        });
        return result;
    } catch (error) {
        a11yLogger.error('a11y.scan.page-failed', { url, error });
        return {
            url,
            timestamp: new Date().toISOString(),
            violations: [],
            passes: 0,
            incomplete: 0,
        };
    } finally {
        await page.close();
    }
}

export async function scanPage(url: string): Promise<ScanResult> {
    a11yLogger.info('a11y.scan.page-start', { url });
    let browser: Browser | null = null;

    try {
        browser = await launchBrowser(false);
        const page = await createPage(browser);
        const result = await runAxeScan(page, url);
        await page.close();

        a11yLogger.info('a11y.scan.page-complete', {
            url,
            violations: result.violations.length,
            passes: result.passes,
        });

        return result;
    } catch (error) {
        a11yLogger.error('a11y.scan.page-failed', { url, error });
        return {
            url,
            timestamp: new Date().toISOString(),
            violations: [],
            passes: 0,
            incomplete: 0,
        };
    } finally {
        await closeBrowser(browser);
    }
}

export {
    awaitAdminBootstrap,
    checkServerRunning,
    closeScanSession,
    createScanSession,
} from './session';

export type { ScanSession } from './session';
