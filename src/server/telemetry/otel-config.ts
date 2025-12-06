// src/server/telemetry/otel-config.ts

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import type { Instrumentation } from '@opentelemetry/instrumentation';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

type InstrumentationLoader = () => unknown;
const autoInstrumentationLoader: InstrumentationLoader = getNodeAutoInstrumentations as InstrumentationLoader;

const loadInstrumentations = (): Instrumentation[] => {
  const candidate: unknown = autoInstrumentationLoader();
  if (Array.isArray(candidate)) {
    return candidate.filter(isInstrumentation);
  }
  return isInstrumentation(candidate) ? [candidate] : [];
};

const isInstrumentation = (value: unknown): value is Instrumentation =>
  Boolean(value) && typeof (value as Instrumentation).enable === 'function' && typeof (value as Instrumentation).disable === 'function';

// Set up diagnostic logging for debugging OpenTelemetry issues
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Create the OpenTelemetry SDK instance
const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'orgcentral-backend',
    [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: new OTLPTraceExporter({
    // Use environment variable for the collector endpoint or default to localhost
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
  }),
  instrumentations: loadInstrumentations(),
});

// Handle graceful shutdown - using process logger instead of console
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => {
      // Using standard process output for telemetry shutdown
      process.stdout.write('Tracing terminated\n');
    })
    .catch((error: unknown) => {
      // Using standard process error for telemetry errors
      process.stderr.write(`Error terminating tracing: ${error instanceof Error ? error.message : String(error)}\n`);
    })
    .finally(() => process.exit(0));
});

export { sdk };
