import 'server-only';

/**
 * OAuth2 + JSON:API client for OroCommerce's storefront (frontend) REST API.
 *
 * Auth uses the OAuth2 password grant with Oro's documented `guest`/`guest`
 * credential (see vendor oro/oauth2-server .../Resources/doc/api_frontend/common.md
 * in the Oro app) — Oro creates a CustomerVisitor server-side per request, no
 * real secret involved. The real secrets are ORO_API_CLIENT_ID/SECRET, which
 * identify *this application* to Oro, not a user.
 */

const baseUrl = (process.env.ORO_API_BASE_URL ?? '').replace(/\/$/, '');
const clientId = process.env.ORO_API_CLIENT_ID ?? '';
const clientSecret = process.env.ORO_API_CLIENT_SECRET ?? '';

export function isOroApiConfigured(): boolean {
  return Boolean(baseUrl && clientId && clientSecret);
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let tokenPromise: Promise<CachedToken> | null = null;

async function requestToken(): Promise<CachedToken> {
  const response = await fetch(`${baseUrl}/oauth2-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username: 'guest',
      password: 'guest',
    }),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Oro OAuth2 token request failed: ${response.status} ${await response.text()}`);
  }
  const json = await response.json();
  return { accessToken: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 - 5000 };
}

async function getAccessToken(): Promise<string> {
  if (!tokenPromise) tokenPromise = requestToken();
  let token = await tokenPromise;
  if (token.expiresAt < Date.now()) {
    tokenPromise = requestToken();
    token = await tokenPromise;
  }
  return token.accessToken;
}

export interface JsonApiResource {
  type: string;
  id: string;
  attributes: Record<string, any>;
  relationships?: Record<string, { data: { type: string; id: string } | { type: string; id: string }[] | null }>;
}

export interface JsonApiDocument {
  data: JsonApiResource | JsonApiResource[];
  included?: JsonApiResource[];
  links?: { self?: string; next?: string };
  meta?: { totalCount?: number; aggregatedData?: Record<string, any> };
}

/** GET a storefront API resource. `path` starts with `/api/…`. Revalidates every 60s (catalog/CMS data is not per-request sensitive). */
export async function oroApiGet(path: string, searchParams?: Record<string, string>): Promise<JsonApiDocument> {
  if (!isOroApiConfigured()) {
    throw new Error('Oro API is not configured — set ORO_API_BASE_URL, ORO_API_CLIENT_ID, ORO_API_CLIENT_SECRET.');
  }
  const token = await getAccessToken();
  const url = new URL(baseUrl + path);
  for (const [key, value] of Object.entries(searchParams ?? {})) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.api+json',
      'X-Include': 'totalCount',
    },
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    throw new Error(`Oro API GET ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

/** GET a resource, returning `null` on a 404 instead of throwing (for by-slug/by-id lookups). */
export async function oroApiGetOrNull(path: string, searchParams?: Record<string, string>): Promise<JsonApiDocument | null> {
  try {
    return await oroApiGet(path, searchParams);
  } catch (error) {
    if (error instanceof Error && /failed: 404/.test(error.message)) return null;
    throw error;
  }
}
