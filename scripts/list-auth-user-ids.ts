import { prisma } from '../src/server/lib/prisma';

async function main(): Promise<void> {
    const users = await prisma.authUser.findMany({
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 25,
    });

    // Intentionally omit emails for privacy.
    console.table(users);
}

main()
    .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
