export async function readJson<T = unknown>(request: Request): Promise<T | Record<string, never>> {
    try {
        return (await request.json()) as T;
    } catch {
        return {};
    }
}
