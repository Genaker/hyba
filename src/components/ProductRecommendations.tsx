'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { formatMoney } from '@/lib/format';
import { productUrl } from '@/lib/urls';
import type { Product } from '@/lib/types';

/**
 * One recommendation rail — CLIENT-side lazy: nothing is fetched or rendered
 * until the placeholder scrolls into view (IntersectionObserver), so this
 * non-critical content never blocks the server render or the critical path
 * (server.mjs buffers whole responses, so ANY server-side rail work would
 * delay the entire page). Zero-JS mode simply omits the rails — acceptable
 * for below-the-fold merchandising, by design.
 *
 * `mode` selects the engine ('ai'/'auto' = gateway embedding KNN with standard
 * fallback); the ✦ AI badge renders only when semantics actually served
 * (THEMING.md "The ✦ AI marker").
 */

type RecommendationResult = { mode: 'semantic' | 'standard'; items: Product[] };

export default function ProductRecommendations({
  productId,
  categoryPath,
  flavor,
  mode = 'auto',
  title,
  aiLabel,
  limit = 5,
}: {
  productId: number;
  categoryPath: string;
  flavor: 'similar' | 'accessories' | 'also-like';
  mode?: 'ai' | 'standard' | 'auto';
  title: string;
  aiLabel: string;
  limit?: number;
}) {
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || startedRef.current) return;
        startedRef.current = true;
        observer.disconnect();
        fetch(`/api/recommendations?id=${productId}&categoryPath=${encodeURIComponent(categoryPath)}&flavor=${flavor}&mode=${mode}&limit=${limit}`)
          .then((response) => (response.ok ? response.json() : null))
          .then((payload: RecommendationResult | null) => payload && setResult(payload))
          .catch(() => {});   // non-critical — a failed rail just stays absent
      },
      { rootMargin: '200px' },   // start fetching slightly before the rail is visible
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [productId, categoryPath, flavor, mode, limit]);

  if (result && result.items.length === 0) return null;

  return (
    <section className="product-recommendations mx-auto mt-12 max-w-7xl px-4" data-flavor={flavor} data-mode={result?.mode ?? 'pending'}>
      <div ref={sentinelRef} aria-hidden className="product-recommendations-sentinel" />
      {result && (
        <>
          <h2 className="product-recommendations-title mb-4 flex items-center gap-2 text-2xl font-bold">
            {title}
            {result.mode === 'semantic' && (
              <span
                className="product-recommendations-ai inline-flex items-center gap-0.5 rounded bg-brand-50 px-1.5 py-0.5 text-xs font-bold tracking-wide text-brand-700"
                title={aiLabel}
              >
                ✦ AI
              </span>
            )}
          </h2>
          <ul className="product-recommendations-items grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
            {result.items.map((item) => (
              <li key={item.id} className="product-recommendations-item">
                <a href={productUrl(item)} className="product-item block rounded-xl border border-mist p-3 transition-colors hover:border-brand-500">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={240}
                      height={240}
                      quality={70}
                      loading="lazy"
                      sizes="(max-width: 767px) 160px, 240px"
                      className="product-item-photo aspect-square w-full rounded-lg object-contain"
                    />
                  ) : (
                    <span aria-hidden className="product-item-photo block aspect-square w-full rounded-lg bg-mist" />
                  )}
                  <span className="product-item-sku mt-2 block text-xs text-gray-500">{item.sku}</span>
                  <span className="product-item-name block truncate text-sm font-medium text-ink">{item.title}</span>
                  <span className="price block text-sm font-semibold">{formatMoney(item.prices[0]?.amount ?? 0)}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
