# Structured Logging and Telemetry Setup

This document explains how to set up and use structured logging with OpenTelemetry in the OrgCentral backend services.

## Components

### 1. OpenTelemetry Configuration (`src/server/telemetry/otel-config.ts`)

The OTel configuration sets up:
- Tracing with OTLP HTTP exporter
- Auto-instrumentation for common Node.js operations
- Service identification attributes
- Graceful shutdown handling

### 2. Structured Logger (`src/server/logging/structured-logger.ts`)

The structured logger provides:
- Context management with tenant and correlation IDs
- Structured JSON logging with consistent format
- OpenTelemetry span creation with tenant/correlation context
- Error handling and exception recording

### 3. Abstract Base Service (`src/server/services/abstract-base-service.ts`)

The abstract base service ensures:
- All services emit tenant and correlation IDs
- Consistent logging and tracing across services
- Proper error handling and metadata propagation
- Validation of required parameters

## Getting Started

### Initialize OpenTelemetry

In your application entry point (e.g., `src/server/index.ts` or equivalent):

```typescript
import { sdk } from './telemetry/otel-config';

// Initialize the OpenTelemetry SDK
sdk.start()
  .then(() => console.log('Tracing initialized'))
  .catch((error) => console.error('Error starting tracing', error));
```

### Create a Service

Extend the `AbstractBaseService` to create new services:

```typescript
import { AbstractBaseService } from './services/abstract-base-service';

export class MyService extends AbstractBaseService {
  constructor() {
    super('MyService'); // Provide a service name
  }

  async doSomething(tenantId: string, data: any, correlationId?: string) {
    return await this.executeInServiceContext(
      'doSomething',           // Operation name
      async (logger) => {     // Operation function
        // Your business logic here
        logger.info('Processing data', { data });
        return result;
      },
      tenantId,               // Required tenant ID
      correlationId,          // Optional correlation ID
      { additional: 'metadata' } // Optional additional metadata
    );
  }
}
```

## Usage Patterns

### 1. Basic Service Method

```typescript
async createEntity(tenantId: string, entityData: EntityData, correlationId?: string) {
  return await this.executeInServiceContext(
    'createEntity',
    async (logger) => {
      // Business logic
      const entity = await this.repository.create(entityData);
      logger.info('Entity created', { entityId: entity.id });
      return entity;
    },
    tenantId,
    correlationId,
    { entityType: 'example' }
  );
}
```

### 2. Child Spans for Complex Operations

```typescript
async complexOperation(tenantId: string, correlationId?: string) {
  return await this.executeInServiceContext(
    'complexOperation',
    async (logger) => {
      // Create child spans for sub-operations
      const step1Span = this.startChildSpan('validateInput');
      try {
        // Validate input
        step1Span.setStatus({ code: 0 });
      } finally {
        step1Span.end();
      }

      const step2Span = this.startChildSpan('processData');
      try {
        // Process data
        step2Span.setStatus({ code: 0 });
      } finally {
        step2Span.end();
      }

      return result;
    },
    tenantId,
    correlationId
  );
}
```

## Telemetry Output

The system generates:

1. **Structured Logs**: JSON-formatted with consistent fields:
   - `timestamp`: ISO string of when the log was created
   - `level`: Log level (info, warn, error, debug)
   - `service`: Service name
   - `message`: Log message
   - `tenantId`: Tenant identifier
   - `correlationId`: Request correlation identifier
   - Additional metadata as provided

2. **OpenTelemetry Spans**: With attributes:
   - `service.name`: Service identifier
   - `tenant.id`: Tenant identifier
   - `correlation.id`: Request correlation identifier
   - `operation.name`: Operation name
   - Additional custom attributes as provided

## Environment Configuration

Set the following environment variables for OpenTelemetry:

- `OTEL_EXPORTER_OTLP_ENDPOINT`: Endpoint for OTLP trace exporter (default: `http://localhost:4318/v1/traces`)

## Best Practices

1. Always use `executeInServiceContext` for service methods that need telemetry
2. Pass tenant ID as the first parameter to all service methods that operate on tenant data
3. Include relevant metadata in the metadata parameter
4. Use correlation IDs to trace requests across service boundaries
5. Validate tenant IDs using the provided validation method
6. Use child spans for complex operations with multiple steps

## Security Hardening Update (2026-02-17)

The logging and telemetry pipeline now includes stronger default protections:

1. **Centralized sanitization** is applied to structured log metadata, span attributes, and log message text before emission.
2. **Exception telemetry sanitization** is applied to span error status messages, and only sanitized exception content is recorded.
3. **Sensitive token handling** uses non-reversible diagnostics (e.g., hash prefix and token length) rather than raw token values.
4. **Prisma query debug logging** no longer emits raw query parameters; it emits redaction metadata only.

### Operational Guidance

- Do not attach raw secrets, credentials, or full tokens to service metadata.
- Prefer safe diagnostics such as lengths, prefixes, booleans, and classified error codes.
- Keep `PRISMA_QUERY_DEBUG` disabled outside controlled debugging environments.