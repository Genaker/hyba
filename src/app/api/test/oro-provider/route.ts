import { NextRequest, NextResponse } from 'next/server';
import { provider } from '@/lib/provider';
import type { ProductQuery } from '@/lib/types';

/**
 * Dispatches DataProvider calls over HTTP for tests/integration/oro-provider.test.ts.
 *
 * Exists only because `provider/oro/client.ts` imports `server-only` and the app uses
 * `@/…` path aliases — both need Next's real module resolution, so a plain `node --test`
 * import of the provider module tree isn't possible (see tests/e2e's `test-server.ts` for
 * the same reasoning: those tests boot the real server.mjs too). 404s unless the app is
 * actually running with DATA_PROVIDER=oro, so it's inert in the default `raw` deployment.
 */
export async function GET(request: NextRequest) {
  if (process.env.DATA_PROVIDER !== 'oro') return NextResponse.json({ error: 'not_in_oro_mode' }, { status: 404 });

  const params = request.nextUrl.searchParams;
  const action = params.get('action');

  switch (action) {
    case 'categories':
      return NextResponse.json(await provider.getCategories());

    case 'category':
      return NextResponse.json(await provider.getCategoryByPath(params.get('path') ?? ''));

    case 'menu':
      return NextResponse.json(await provider.getMenu());

    case 'products': {
      const query: ProductQuery = {};
      if (params.get('categoryPath')) query.categoryPath = params.get('categoryPath')!;
      if (params.get('search')) query.search = params.get('search')!;
      if (params.get('sort')) query.sort = params.get('sort') as ProductQuery['sort'];
      if (params.get('dir')) query.dir = params.get('dir') as ProductQuery['dir'];
      if (params.get('page')) query.page = Number(params.get('page'));
      if (params.get('pageSize')) query.pageSize = Number(params.get('pageSize'));
      if (params.get('minPrice')) query.minPrice = Number(params.get('minPrice'));
      if (params.get('maxPrice')) query.maxPrice = Number(params.get('maxPrice'));
      if (params.get('instock')) query.attributes = { ...query.attributes, instock: ['1'] };
      return NextResponse.json(await provider.getProducts(query));
    }

    case 'product-by-sku':
      return NextResponse.json(await provider.getProductBySku(params.get('sku') ?? ''));

    case 'product-by-slug':
      return NextResponse.json(await provider.getProductBySlug(params.get('slug') ?? ''));

    case 'related': {
      const product = await provider.getProductBySku(params.get('sku') ?? '');
      if (!product) return NextResponse.json({ error: 'product_not_found' }, { status: 404 });
      return NextResponse.json(await provider.getRelatedProducts(product, Number(params.get('limit') ?? 4)));
    }

    case 'cms':
      return NextResponse.json(await provider.getCmsPageBySlug(params.get('slug') ?? ''));

    case 'slides':
      return NextResponse.json(await provider.getSlides());

    case 'login':
      return NextResponse.json(await provider.findUser(params.get('email') ?? '', params.get('password') ?? ''));

    case 'user-by-email':
      return NextResponse.json(await provider.getUserByEmail(params.get('email') ?? ''));

    default:
      return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
  }
}
