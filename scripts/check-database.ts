import { stderr, stdout } from 'node:process';
import { prisma } from '../src/server/lib/prisma';

async function main() {
    try {
        const count = await prisma.organization.count();
        stdout.write(`organizations: ${String(count)}\n`);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.stack ?? error.message : String(error);
        stderr.write(`DB test error: ${message}\n`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    stderr.write(`DB test error: ${message}\n`);
    process.exitCode = 1;
});
