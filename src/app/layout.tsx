import type { Metadata } from 'next';
import Header from '@/theme/Header';
import Footer from '@/theme/Footer';
import GlobalScripts from '@/components/hyba/GlobalScripts';
import { storefrontConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: { default: storefrontConfig.site.title, template: `%s — ${storefrontConfig.site.name}` },
  description: storefrontConfig.site.metaDescription,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { fonts, site } = storefrontConfig;
  return (
    <html lang="en" className="h-full antialiased">
      {fonts.enabled && (
        <head>
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href={fonts.stylesheet} />
          {/* puts the configured family in front of the system stack */}
          <style>{`:root { --font-sans: "${fonts.family}", ui-sans-serif, system-ui, sans-serif; }`}</style>
        </head>
      )}
      {/* Header/Footer render directly (no Suspense): our data provider is
          synchronous in-memory JSON, so a boundary here buys no real
          streaming benefit — it only forces React to paint an empty
          placeholder first and pop the real content in later, causing
          layout shift. Suspense is worth it only around a genuine async gap. */}
      <body className="flex min-h-full flex-col" {...(site.theme ? { 'data-theme': site.theme } : {})}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* Chrome Alpine factories (once per page, see GlobalScripts' own comment), then the
            bootstrap module — every page's only <script src> tag once zero-JS stripping runs
            (data-island survives it). modulepreload (not preload+as=script, which server.mjs
            does strip) kills the import waterfall for /js/vendor/alpine.mjs. */}
        <GlobalScripts />
        <link rel="modulepreload" href="/js/vendor/alpine.mjs" />
        <script type="module" src="/js/hyva/bootstrap.mjs" data-island="" />
      </body>
    </html>
  );
}
