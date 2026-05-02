import 'server-only';

export class ApiConfigurationError extends Error {}

export function getAdminApiBaseUrl() {
  const rawBaseUrl = process.env.ADMIN_API_BASE_URL?.trim();

  if (!rawBaseUrl) {
    throw new ApiConfigurationError('ADMIN_API_BASE_URL must be configured.');
  }

  let baseUrl: URL;

  try {
    baseUrl = new URL(rawBaseUrl);
  } catch {
    throw new ApiConfigurationError('ADMIN_API_BASE_URL must be an absolute URL.');
  }

  if (!['http:', 'https:'].includes(baseUrl.protocol)) {
    throw new ApiConfigurationError('ADMIN_API_BASE_URL must use http or https.');
  }

  return baseUrl.toString().replace(/\/$/, '');
}
