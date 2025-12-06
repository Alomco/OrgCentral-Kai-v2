declare module '@opentelemetry/instrumentation' {
    export interface Instrumentation {
        enable(): void;
        disable(): void;
    }
}

declare module '@opentelemetry/auto-instrumentations-node' {
    import type { Instrumentation } from '@opentelemetry/instrumentation';
    export function getNodeAutoInstrumentations(): Instrumentation[];
}
