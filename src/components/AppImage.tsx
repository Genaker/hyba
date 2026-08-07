import Image from 'next/image';

// Inlined by next.config.ts from config.yaml's images.retina — a plain constant
// so this component works in server AND client trees (the fs-backed config
// object cannot be imported into a client bundle).
const RETINA_ENABLED = process.env.NEXT_PUBLIC_IMAGES_RETINA === '1';

/**
 * Image wrapper that honours `images.retina` in config.yaml.
 *
 * Retina ON  → a normal next/image: a full srcset, so HiDPI screens download
 *              2x/3x variants.
 * Retina OFF → ONE optimized source at the 1x design width and no srcset at
 *              all, so every device gets the same file. `sizes`-based srcsets
 *              can't express this: the browser multiplies by devicePixelRatio
 *              and always picks a larger candidate, which is exactly the
 *              "750x931 for a 378x469 box" waste we're avoiding. Fewer distinct
 *              widths also means fewer on-demand sharp transforms on the box.
 *
 * `displayWidth` is the 1x width actually rendered, and must be one of the
 * widths in next.config.ts's deviceSizes/imageSizes — the optimizer rejects
 * anything else.
 */
export default function AppImage({
  src,
  alt,
  width,
  height,
  displayWidth,
  sizes,
  className,
  priority = false,
  loading,
  quality = 75,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** The 1x width served when retina is off (must be a configured image size). */
  displayWidth: number;
  /** Only used when retina is on (drives srcset selection). */
  sizes?: string;
  className?: string;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
  quality?: number;
}) {
  if (RETINA_ENABLED) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        fetchPriority={priority ? 'high' : undefined}
        loading={loading}
        quality={quality}
        className={className}
      />
    );
  }

  const optimized = `/_next/image?url=${encodeURIComponent(src)}&w=${displayWidth}&q=${quality}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- deliberate: one fixed 1x source, no srcset (see above)
    <img
      src={optimized}
      alt={alt}
      width={width}
      height={height}
      decoding="async"
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      fetchPriority={priority ? 'high' : undefined}
      className={className}
    />
  );
}
