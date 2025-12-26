import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const MAX_LINES = 250;

const ROOTS = [
    'src/server/use-cases/hr',
    'src/server/services/hr',
    'src/server/actions/hr',
    'src/app/(app)/hr',
];

const EXTENSIONS = ['.ts', '.tsx'];

function countLines(filePath: string): number {
    const text = readFileSync(filePath, 'utf8');
    // Count lines in a Windows/Unix compatible way.
    return text.split(/\r\n|\r|\n/).length;
}

function isTargetFile(filePath: string): boolean {
    return EXTENSIONS.includes(path.extname(filePath));
}

function listFilesRecursively(directoryPath: string): string[] {
    const entries = readdirSync(directoryPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...listFilesRecursively(fullPath));
            continue;
        }

        if (entry.isFile()) {
            files.push(fullPath);
        }
    }

    return files;
}

function run(): void {
    const violations: { file: string; lines: number }[] = [];

    for (const root of ROOTS) {
        const absoluteRoot = path.resolve(root);
        if (!existsSync(absoluteRoot)) {
            continue;
        }

        const matches = listFilesRecursively(absoluteRoot);

        for (const file of matches) {
            if (!isTargetFile(file)) {
                continue;
            }

            const lines = countLines(file);
            if (lines > MAX_LINES) {
                violations.push({ file, lines });
            }
        }
    }

    if (violations.length === 0) {
        console.log(`HR LOC guard: OK (<= ${String(MAX_LINES)} lines per file).`);
        return;
    }

    violations.sort((a, b) => b.lines - a.lines);

    console.error(
        `HR LOC guard: ${String(violations.length)} file(s) exceed ${String(MAX_LINES)} lines:`,
    );
    for (const { file, lines } of violations) {
        console.error(`- ${file} (${String(lines)})`);
    }

    process.exitCode = 1;
}

run();
