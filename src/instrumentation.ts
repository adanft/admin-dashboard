import type { Instrumentation } from 'next';

type InstrumentationRequest = Parameters<Instrumentation.onRequestError>[1];
type InstrumentationContext = Parameters<Instrumentation.onRequestError>[2];

type InstrumentationErrorSummary = {
  digest?: string;
  message: string;
  method: string;
  path: string;
  routePath: string;
  routeType: InstrumentationContext['routeType'];
  routerKind: InstrumentationContext['routerKind'];
};

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  console.error('Next.js request error', summarizeInstrumentationError(error, request, context));
};

export function summarizeInstrumentationError(
  error: unknown,
  request: InstrumentationRequest,
  context: InstrumentationContext,
): InstrumentationErrorSummary {
  const errorRecord = isRecord(error) ? error : {};
  const digest = typeof errorRecord.digest === 'string' ? errorRecord.digest : undefined;

  return {
    ...(digest ? { digest } : {}),
    message: error instanceof Error ? error.message : 'Unhandled server request error',
    method: request.method,
    path: request.path,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
