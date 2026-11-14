import crypto from 'crypto';

export const BACKEND_URL =
  process.env.INTERNAL_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://digicast-backend.vercel.app';

export const BACKEND_SERVICE_SECRET =
  process.env.BACKEND_SERVICE_SECRET ||
  process.env.DIGICAST_HMAC_SECRET ||
  'digicast_super_secure_hmac_secret_key_prod_2026';

/**
 * Generates an HMAC-SHA256 signature for any string or JSON payload.
 */
export function generateServiceSignature(payload: string | object, secret: string = BACKEND_SERVICE_SECRET): string {
  const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(content).digest('hex');
}

/**
 * Secure inter-service fetch wrapper for communication between dieme-web and dieme-backend.
 */
export async function callBackendService<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    timeoutMs?: number;
  } = {}
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const { method = 'GET', body, headers = {}, timeoutMs = 8000 } = options;
  const targetUrl = `${BACKEND_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  const requestHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...headers,
  };

  let serializedBody: string | undefined = undefined;
  if (body !== undefined && method !== 'GET') {
    serializedBody = typeof body === 'string' ? body : JSON.stringify(body);
    requestHeaders['Content-Type'] = 'application/json';
    requestHeaders['x-digicast-hmac'] = generateServiceSignature(serializedBody);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(targetUrl, {
      method,
      headers: requestHeaders,
      body: serializedBody,
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timer);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: data?.message || data?.error || `Backend responded with HTTP ${res.status}`,
        data,
      };
    }

    return {
      ok: true,
      status: res.status,
      data,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      ok: false,
      status: err.name === 'AbortError' ? 504 : 502,
      error: err.name === 'AbortError' ? 'Backend request timed out' : (err.message || 'Failed to reach backend service'),
    };
  }
}

/**
 * Health check & diagnostic test for the inter-service bridge.
 */
export async function testBackendBridge(): Promise<{
  health: boolean;
  authenticatedHandshake: boolean;
  latencyMs: number;
  details?: any;
}> {
  const start = Date.now();
  const healthRes = await callBackendService('api/health', { method: 'GET' });
  const latencyMs = Date.now() - start;

  if (!healthRes.ok) {
    return {
      health: false,
      authenticatedHandshake: false,
      latencyMs,
      details: healthRes.error,
    };
  }

  const testPayload = { action: 'ping', timestamp: Date.now() };
  const verifyRes = await callBackendService('api/security/verify', {
    method: 'POST',
    body: testPayload,
  });

  return {
    health: healthRes.ok,
    authenticatedHandshake: verifyRes.ok && verifyRes.data?.verified === true,
    latencyMs,
    details: {
      health: healthRes.data,
      verification: verifyRes.data,
    },
  };
}
