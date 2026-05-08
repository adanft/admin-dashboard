import type { Instrumentation } from 'next';

type InstrumentationRequest = Parameters<Instrumentation.onRequestError>[1];
type InstrumentationContext = Parameters<Instrumentation.onRequestError>[2];

type InstrumentationErrorSummary = {
  code?: number | string;
  digest?: string;
  method: string;
  path: string;
  routePath: string;
  routeType: InstrumentationContext['routeType'];
  routerKind: InstrumentationContext['routerKind'];
  status?: number;
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
  const code = getSafeErrorCode(errorRecord.code);
  const status = getSafeStatus(errorRecord.status) ?? getSafeStatus(errorRecord.statusCode);

  return {
    ...(code !== undefined ? { code } : {}),
    ...(digest ? { digest } : {}),
    method: request.method,
    path: getPathname(request.path),
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    ...(status ? { status } : {}),
  };
}

function getPathname(path: string): string {
  try {
    return new URL(path, 'https://instrumentation.local').pathname;
  } catch {
    const [pathname = ''] = path.split(/[?#]/, 1);

    return pathname.startsWith('/') ? pathname : '/';
  }
}

function getSafeErrorCode(code: unknown): number | string | undefined {
  if (typeof code === 'number' && Number.isFinite(code)) {
    return code;
  }

  if (typeof code === 'string' && /^[A-Z0-9_-]{1,64}$/i.test(code)) {
    return code;
  }

  return undefined;
}

function getSafeStatus(status: unknown): number | undefined {
  if (typeof status !== 'number' || !Number.isInteger(status)) {
    return undefined;
  }

  return status >= 100 && status <= 599 ? status : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
