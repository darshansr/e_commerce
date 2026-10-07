/**
 * Generates and uploads cover images for every product that lacks one.
 *
 * There are no real book cover photographs to hand, so each cover is composed
 * as an SVG (title, genre, gradient keyed to the genre) and rasterised to PNG
 * with `sharp`, then uploaded to Vendure via the `createAssets` multipart
 * mutation and assigned as the product's `featuredAsset`.
 *
 * Requires `AssetServerPlugin` to be enabled in `vendure-config.ts`.
 *
 * Usage (Vendure must be running):
 *   pnpm --filter @meghana/server db:seed:covers
 *
 * Idempotent — products that already have a featuredAsset are skipped.
 */
import 'dotenv/config';
import sharp from 'sharp';
import { admin, login } from './lib/admin-client';

const WIDTH = 600;
const HEIGHT = 800;

// ---------------------------------------------------------------------------
// Cover artwork
// ---------------------------------------------------------------------------

/** Gradient pairs keyed by genre, so shelves read as visually distinct. */
const GENRE_PALETTE: Record<string, { from: string; to: string; accent: string }> = {
  Fiction: { from: '#312e81', to: '#0f172a', accent: '#a5b4fc' },
  'Non-Fiction': { from: '#134e4a', to: '#0f172a', accent: '#5eead4' },
  Academic: { from: '#4c1d95', to: '#111827', accent: '#c4b5fd' },
  Children: { from: '#9a3412', to: '#1c1917', accent: '#fdba74' },
  Reference: { from: '#065f46', to: '#0f172a', accent: '#6ee7b7' },
};

const DEFAULT_PALETTE = { from: '#1e3a8a', to: '#0f172a', accent: '#93c5fd' };

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapTitle(title: string, maxChars = 16): string[] {
  const lines: string[] = [];
  let current = '';

  for (const word of title.split(/\s+/)) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.slice(0, 4);
}

function buildCoverSvg(title: string, genre: string | undefined): string {
  const palette = (genre && GENRE_PALETTE[genre]) || DEFAULT_PALETTE;
  const lines = wrapTitle(title);

  // Shrink the type when the title needs more lines.
  const fontSize = lines.length >= 4 ? 40 : lines.length === 3 ? 44 : 48;
  const lineHeight = Math.round(fontSize * 1.18);
  const blockHeight = lines.length * lineHeight;
  const firstBaseline = Math.round((HEIGHT - blockHeight) / 2) + Math.round(lineHeight * 0.75);

  const titleTspans = lines
    .map((line, i) => `<text x="56" y="${firstBaseline + i * lineHeight}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="bold" fill="#ffffff">${escapeXml(line)}</text>`)
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.from}"/>
      <stop offset="100%" stop-color="${palette.to}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="0" y="0" width="10" height="${HEIGHT}" fill="${palette.accent}"/>
  <circle cx="${WIDTH - 60}" cy="90" r="120" fill="${palette.accent}" opacity="0.12"/>
  ${titleTspans}
  <line x1="56" y1="${HEIGHT - 96}" x2="${WIDTH - 56}" y2="${HEIGHT - 96}" stroke="${palette.accent}" stroke-width="2" opacity="0.5"/>
  <text x="56" y="${HEIGHT - 62}" font-family="Helvetica, Arial, sans-serif" font-size="20" letter-spacing="3" fill="${palette.accent}">${escapeXml((genre ?? 'BOOK').toUpperCase())}</text>
  <text x="56" y="${HEIGHT - 34}" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#ffffff" opacity="0.55">MEGHANA BOOK HOUSE</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

const CREATE_ASSETS = `
  mutation SeedCreateAssets($input: [CreateAssetInput!]!) {
    createAssets(input: $input) {
      __typename
      ... on Asset {
        id
        name
        preview
      }
      ... on MimeTypeError {
        message
        fileName
      }
    }
  }
`;

/** Uploads one PNG using the GraphQL multipart request spec. */
async function uploadAsset(png: Buffer, filename: string, tags: string[]): Promise<string> {
  const form = new FormData();
  form.append(
    'operations',
    JSON.stringify({
      query: CREATE_ASSETS,
      variables: { input: [{ file: null, tags }] },
    }),
  );
  form.append('map', JSON.stringify({ '0': ['variables.input.0.file'] }));
  form.append('0', new Blob([new Uint8Array(png)], { type: 'image/png' }), filename);

  const data = await admin<{
    createAssets: Array<{ __typename: string; id?: string; message?: string }>;
  }>(CREATE_ASSETS, undefined, { form });

  const [result] = data.createAssets;
  if (!result || result.__typename !== 'Asset' || !result.id) {
    throw new Error(`Upload rejected: ${result?.message ?? 'unknown error'}`);
  }
  return result.id;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const PRODUCTS_QUERY = `
  query SeedProductsWithAssets($take: Int!) {
    products(options: { take: $take }) {
      totalItems
      items {
        id
        name
        slug
        featuredAsset {
          id
        }
        facetValues {
          name
          facet {
            code
          }
        }
      }
    }
  }
`;

const UPDATE_PRODUCT = `
  mutation SeedSetFeaturedAsset($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      featuredAsset {
        id
        preview
      }
    }
  }
`;

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  featuredAsset: { id: string } | null;
  facetValues: Array<{ name: string; facet: { code: string } }>;
};

async function main(): Promise<void> {
  console.log(`Generating covers via ${ADMIN_API_URL}`);
  await login();

  const { products } = await admin<{ products: { totalItems: number; items: ProductRow[] } }>(
    PRODUCTS_QUERY,
    { take: 500 },
  );

  const needCovers = products.items.filter((p) => !p.featuredAsset);
  console.log(
    `${products.totalItems} products, ${needCovers.length} without a cover, ${
      products.totalItems - needCovers.length
    } already have one`,
  );

  let uploaded = 0;
  let failed = 0;

  for (const product of needCovers) {
    const genre = product.facetValues.find((fv) => fv.facet.code === 'genre')?.name;

    try {
      const svg = buildCoverSvg(product.name, genre);
      const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
      const assetId = await uploadAsset(png, `${product.slug}.png`, ['cover', product.slug]);

      const updated = await admin<{ updateProduct: { featuredAsset: { preview: string } | null } }>(
        UPDATE_PRODUCT,
        { input: { id: product.id, featuredAssetId: assetId } },
      );

      uploaded += 1;
      console.log(
        `  + ${product.name.padEnd(30)} ${genre ?? '—'}  ${(png.length / 1024).toFixed(0)} KB  ${updated.updateProduct.featuredAsset?.preview ?? ''}`,
      );
    } catch (error) {
      failed += 1;
      console.warn(
        `  ! ${product.name} — ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log('');
  console.log(`Done. uploaded: ${uploaded}, failed: ${failed}, skipped: ${products.totalItems - needCovers.length}`);
}

main().catch((error: unknown) => {
  console.error('Cover seeding failed:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
