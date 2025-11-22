export type ServiceHealthResult = {
  reachable: boolean;
  httpStatus: number | null;
  payload: unknown | null;
  error?: string;
};

const DEFAULT_TIMEOUT_MS = 2_000;

async function fetchWithTimeout(url: string, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkServiceHealth(serviceName: string, baseUrl?: string): Promise<ServiceHealthResult> {
  if (!baseUrl) {
    return {
      reachable: false,
      httpStatus: null,
      payload: null,
      error: 'Service URL not configured',
    };
  }

  const healthUrl = `${baseUrl.replace(/\/$/, '')}/health`;

  try {
    const response = await fetchWithTimeout(healthUrl);
    const contentType = response.headers.get('content-type');
    let payload: unknown = null;

    if (contentType?.includes('application/json')) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }

    return {
      reachable: response.ok,
      httpStatus: response.status,
      payload,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return {
      reachable: false,
      httpStatus: null,
      payload: null,
      error: message,
    };
  }
}
