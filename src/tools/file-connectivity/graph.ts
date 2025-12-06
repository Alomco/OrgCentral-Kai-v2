export type FileKind =
    | 'schema'
    | 'repository'
    | 'mapper'
    | 'use-case'
    | 'api-adapter'
    | 'route'
    | 'security'
    | 'doc'
    | 'type'
    | 'config'
    | 'other';

export type ImpactLevel = 'low' | 'medium' | 'high';

export type RelationshipType =
    | 'depends-on'
    | 'validated-by'
    | 'implemented-by'
    | 'exposes'
    | 'documents'
    | 'guards'
    | 'transforms'
    | 'shares-types';

export interface FileConnectivityNode {
    path: string;
    kind: FileKind;
    description: string;
    tags?: string[];
    volatility?: ImpactLevel;
}

export interface FileConnectivityEdge {
    source: string;
    target: string;
    relationship: RelationshipType;
    impact: ImpactLevel;
    rationale: string;
    bidirectional?: boolean;
}

export interface ConnectivityVectorEntry {
    path: string;
    relationship: RelationshipType;
    impact: ImpactLevel;
    rationale: string;
}

export interface ConnectivityVector {
    path: string;
    node: FileConnectivityNode;
    related: ConnectivityVectorEntry[];
}

export abstract class AbstractConnectivityRegistry {
    abstract registerNode(node: FileConnectivityNode): void;
    abstract connect(edge: FileConnectivityEdge): void;
    abstract getVector(path: string): ConnectivityVector | undefined;
    abstract getRelatedFiles(path: string, level?: ImpactLevel): string[];
    abstract toJSON(): string;
}

export class FileConnectivityRegistry extends AbstractConnectivityRegistry {
    private readonly nodes = new Map<string, FileConnectivityNode>();
    private readonly adjacency = new Map<string, Map<string, ConnectivityVectorEntry>>();

    registerNode(node: FileConnectivityNode): void {
        this.nodes.set(normalize(node.path), node);
    }

    connect(edge: FileConnectivityEdge): void {
        const normalizedSource = normalize(edge.source);
        const normalizedTarget = normalize(edge.target);
        this.assertNodeExists(normalizedSource);
        this.assertNodeExists(normalizedTarget);

        this.insertEdge(normalizedSource, normalizedTarget, edge);
        if (edge.bidirectional) {
            this.insertEdge(normalizedTarget, normalizedSource, {
                ...edge,
                source: normalizedTarget,
                target: normalizedSource,
            });
        }
    }

    getVector(path: string): ConnectivityVector | undefined {
        const normalizedPath = normalize(path);
        const node = this.nodes.get(normalizedPath);
        if (!node) {
            return undefined;
        }

        const related = Array.from(this.adjacency.get(normalizedPath)?.values() ?? []);
        return { path: normalizedPath, node, related };
    }

    getRelatedFiles(path: string, level: ImpactLevel = 'low'): string[] {
        const vector = this.getVector(path);
        if (!vector) {
            return [];
        }

        const allowed = impactRank(level);
        return vector.related
            .filter((entry) => impactRank(entry.impact) >= allowed)
            .map((entry) => entry.path);
    }

    toJSON(): string {
        const payload = {
            nodes: Array.from(this.nodes.values()),
            edges: Array.from(this.adjacency.entries()).flatMap(([source, targets]) =>
                Array.from(targets.values()).map((entry) => ({
                    source,
                    ...entry,
                })),
            ),
        };

        return JSON.stringify(payload, null, 2);
    }

    private insertEdge(source: string, target: string, edge: FileConnectivityEdge): void {
        const entry: ConnectivityVectorEntry = {
            path: target,
            relationship: edge.relationship,
            impact: edge.impact,
            rationale: edge.rationale,
        };

        const targetMap = this.adjacency.get(source) ?? new Map<string, ConnectivityVectorEntry>();
        targetMap.set(target, entry);
        this.adjacency.set(source, targetMap);
    }

    private assertNodeExists(path: string): void {
        if (!this.nodes.has(path)) {
            throw new Error(`Connectivity node missing for path: ${path}`);
        }
    }
}

function normalize(path: string): string {
    return path.replace(/\\/g, '/');
}

function assertUnreachable(value: never): never {
    throw new Error(`Unhandled impact level: ${String(value)}`);
}

function impactRank(level: ImpactLevel): number {
    switch (level) {
        case 'high':
            return 3;
        case 'medium':
            return 2;
        case 'low':
            return 1;
        default:
            return assertUnreachable(level);
    }
}
