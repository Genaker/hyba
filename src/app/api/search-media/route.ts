import { NextResponse } from 'next/server';
import { storefrontConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const MAX_MEDIA_BYTES = 4 * 1024 * 1024;   // ~3 MB of binary after base64 — plenty for a photo or short clip

const providerToDataset: Record<string, string> = {
  'raw-oro-data': 'oro',
  oro: 'oro',
  'raw-magento-data': 'magento',
  'raw-salesforce-data': 'salesforce',
};

/**
 * Same-origin proxy for multimodal quick search (photo / voice). The browser
 * posts base64 media here; the GATEWAY does the actual work — Gemini turns it
 * into a text query and runs the normal hybrid search — so no API key or
 * gateway URL is ever exposed to the client.
 */
export async function POST(request: Request) {
  const gatewayBaseUrl = process.env.GATEWAY_URL ?? 'http://127.0.0.1:8090';
  const body = (await request.json().catch(() => null)) as { media?: string; mimeType?: string; kind?: string } | null;
  if (!body?.media || !body.mimeType || (body.kind !== 'image' && body.kind !== 'voice')) {
    return NextResponse.json({ error: 'media, mimeType and kind (image|voice) are required' }, { status: 400 });
  }
  if (body.media.length > MAX_MEDIA_BYTES) {
    return NextResponse.json({ error: 'media too large' }, { status: 413 });
  }

  const dataset = providerToDataset[storefrontConfig.dataProvider.provider] ?? 'magento';
  const gatewayResponse = await fetch(`${gatewayBaseUrl}/api/search/${body.kind === 'image' ? 'image' : 'voice'}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ media: body.media, mimeType: body.mimeType, dataset }),
    cache: 'no-store',
  }).catch(() => null);

  if (!gatewayResponse?.ok) {
    return NextResponse.json({ error: 'search unavailable' }, { status: 502 });
  }
  const envelope = await gatewayResponse.json();
  return NextResponse.json(envelope.data);
}
