/**
 * Seeds the Vendure catalogue with sample books.
 *
 * Talks to the Admin API (not the database) so it exercises exactly the same
 * code path a real admin UI would.
 *
 * Usage (Vendure must be running):
 *   pnpm --filter @meghana/server db:seed
 *
 * Idempotent and self-healing — safe to re-run. It will:
 *   - create the `IN` country / tax zone / tax category / 5% GST rate if missing
 *   - force the channel's currency to INR (Vendure's bootstrap default is USD)
 *   - create any missing products and variants
 *   - repair products left without a variant by an interrupted run
 *   - repair variants whose price is not in INR
 */
import 'dotenv/config';
import { ADMIN_API_URL, admin, login } from './lib/admin-client';

const CHANNEL_TOKEN = '__default_channel__';
const CURRENCY = 'INR';

// ---------------------------------------------------------------------------
// Catalogue data
// ---------------------------------------------------------------------------

/** Prices are in minor units (paise), matching Vendure's `Money` scalar. */
interface BookSeed {
  title: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  genre: string;
  language: string;
}

const GENRES = ['Fiction', 'Non-Fiction', 'Academic', 'Children', 'Reference'] as const;
const LANGUAGES = ['English', 'Hindi'] as const;

const BOOKS: BookSeed[] = [
  {
    title: 'The Palace of Illusions',
    slug: 'the-palace-of-illusions',
    description:
      'A reimagining of the Mahabharata told through the eyes of Panchaali, giving one of mythology’s most quietly powerful figures her own voice.',
    price: 39900,
    stock: 24,
    genre: 'Fiction',
    language: 'English',
  },
  {
    title: 'Wings of Fire',
    slug: 'wings-of-fire',
    description:
      'The autobiography of A. P. J. Abdul Kalam, tracing a small-town boy’s path to becoming the Missile Man of India.',
    price: 29900,
    stock: 40,
    genre: 'Non-Fiction',
    language: 'English',
  },
  {
    title: 'Train to Pakistan',
    slug: 'train-to-pakistan',
    description:
      'Khushwant Singh’s spare, devastating novel set in a Punjab village during the upheaval of Partition.',
    price: 35000,
    stock: 18,
    genre: 'Fiction',
    language: 'English',
  },
  {
    title: 'Introduction to Algorithms',
    slug: 'introduction-to-algorithms',
    description:
      'The definitive reference for algorithm design and analysis, covering sorting, graphs, dynamic programming and NP-completeness.',
    price: 129900,
    stock: 8,
    genre: 'Academic',
    language: 'English',
  },
  {
    title: 'Indian Polity',
    slug: 'indian-polity',
    description:
      'A comprehensive study of the Indian Constitution, its institutions and constitutional bodies — a standard text for civil services aspirants.',
    price: 69900,
    stock: 32,
    genre: 'Academic',
    language: 'English',
  },
  {
    title: 'Panchatantra Tales',
    slug: 'panchatantra-tales',
    description:
      'Illustrated animal fables from the ancient Sanskrit tradition, retold for young readers with a moral in every tale.',
    price: 24900,
    stock: 55,
    genre: 'Children',
    language: 'English',
  },
  {
    title: 'Godaan',
    slug: 'godaan',
    description:
      'Premchand’s masterpiece on rural India, debt and dignity — widely regarded as the greatest Hindi novel ever written.',
    price: 32500,
    stock: 21,
    genre: 'Fiction',
    language: 'Hindi',
  },
  {
    title: 'The Discovery of India',
    slug: 'the-discovery-of-india',
    description:
      'Nehru’s sweeping reflection on Indian history and civilisation, written during his imprisonment at Ahmednagar Fort.',
    price: 49900,
    stock: 15,
    genre: 'Non-Fiction',
    language: 'English',
  },
  {
    title: 'Concepts of Physics',
    slug: 'concepts-of-physics',
    description:
      'H. C. Verma’s two-part classic, prized for building genuine physical intuition through carefully graded problems.',
    price: 89900,
    stock: 27,
    genre: 'Academic',
    language: 'English',
  },
  {
    title: 'Malgudi Days',
    slug: 'malgudi-days',
    description:
      'R. K. Narayan’s tender short stories from the invented South Indian town of Malgudi, by turns comic and quietly sad.',
    price: 27500,
    stock: 36,
    genre: 'Fiction',
    language: 'English',
  },
  {
    title: 'Chacha Chaudhary Collection',
    slug: 'chacha-chaudhary-collection',
    description:
      'A bumper volume of India’s best-loved comic, featuring Chacha Chaudhary, Sabu and a great deal of quick thinking.',
    price: 19900,
    stock: 60,
    genre: 'Children',
    language: 'Hindi',
  },
  {
    title: 'Oxford English Dictionary',
    slug: 'oxford-english-dictionary',
    description:
      'A compact edition of the world’s most authoritative dictionary of the English language, with etymologies and usage notes.',
    price: 159900,
    stock: 6,
    genre: 'Reference',
    language: 'English',
  },
];

function skuFor(slug: string): string {
  return `MBH-${slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 24)}`;
}

// ---------------------------------------------------------------------------
// Channel / tax setup
// ---------------------------------------------------------------------------

/**
 * Vendure refuses to create a ProductVariant until the channel has a default
 * tax zone:
 *   "The active tax zone could not be determined."
 *
 * A bare `bootstrap()` creates the default channel but no country, zone, tax
 * category or tax rate — and it defaults the currency to USD. All of that has
 * to be set up explicitly.
 */
async function ensureChannelSetup(): Promise<void> {
  const channelData = await admin<{
    channels: {
      items: Array<{
        id: string;
        code: string;
        defaultCurrencyCode: string;
        defaultTaxZone: { id: string } | null;
      }>;
    };
  }>(`
    query SeedChannels {
      channels {
        items {
          id
          code
          defaultCurrencyCode
          defaultTaxZone {
            id
          }
        }
      }
    }
  `);

  const channel =
    channelData.channels.items.find((c) => c.code === CHANNEL_TOKEN) ??
    channelData.channels.items[0];

  if (!channel) {
    throw new Error('No channel found — has Vendure finished bootstrapping?');
  }

  let zoneId = channel.defaultTaxZone?.id;

  if (!zoneId) {
    const countryData = await admin<{ countries: { items: Array<{ id: string; code: string }> } }>(`
      query SeedCountries {
        countries {
          items {
            id
            code
          }
        }
      }
    `);

    let india = countryData.countries.items.find((c) => c.code === 'IN');

    if (!india) {
      const createdCountry = await admin<{ createCountry: { id: string; code: string } }>(
        `
          mutation SeedCreateCountry($input: CreateCountryInput!) {
            createCountry(input: $input) {
              id
              code
            }
          }
        `,
        {
          input: {
            code: 'IN',
            enabled: true,
            translations: [{ languageCode: 'en', name: 'India' }],
          },
        },
      );
      india = createdCountry.createCountry;
      console.log('✓ created country "India" (IN)');
    }

    const zoneData = await admin<{ createZone: { id: string; name: string } }>(
      `
        mutation SeedCreateZone($input: CreateZoneInput!) {
          createZone(input: $input) {
            id
            name
          }
        }
      `,
      { input: { name: 'India', memberIds: [india.id] } },
    );
    zoneId = zoneData.createZone.id;
    console.log(`✓ created zone "${zoneData.createZone.name}"`);
  }

  // Zones and currency must both be right before any variant is priced.
  const needsZone = !channel.defaultTaxZone;
  const needsCurrency = channel.defaultCurrencyCode !== CURRENCY;

  if (needsZone || needsCurrency) {
    const updated = await admin<{
      updateChannel: { __typename: string; errorCode?: string; message?: string };
    }>(
      `
        mutation SeedUpdateChannel($input: UpdateChannelInput!) {
          updateChannel(input: $input) {
            __typename
            ... on Channel {
              id
            }
            ... on ErrorResult {
              errorCode
              message
            }
          }
        }
      `,
      {
        input: {
          id: channel.id,
          ...(needsZone ? { defaultTaxZoneId: zoneId, defaultShippingZoneId: zoneId } : {}),
          ...(needsCurrency
            ? { defaultCurrencyCode: CURRENCY, availableCurrencyCodes: [CURRENCY] }
            : {}),
        },
      },
    );

    if (updated.updateChannel.__typename !== 'Channel') {
      throw new Error(
        `Could not update channel: ${updated.updateChannel.errorCode ?? ''} ${
          updated.updateChannel.message ?? ''
        }`.trim(),
      );
    }

    if (needsZone) {
      console.log(`✓ assigned zone to channel ${channel.code}`);
    }
    if (needsCurrency) {
      console.log(`✓ switched channel currency ${channel.defaultCurrencyCode} → ${CURRENCY}`);
    }
  }

  const categoryData = await admin<{
    taxCategories: { items: Array<{ id: string; isDefault: boolean }> };
  }>(`
    query SeedTaxCategories {
      taxCategories {
        items {
          id
          isDefault
        }
      }
    }
  `);

  let categoryId = categoryData.taxCategories.items.find((c) => c.isDefault)?.id;
  if (!categoryId) {
    const created = await admin<{ createTaxCategory: { id: string } }>(
      `
        mutation SeedCreateTaxCategory($input: CreateTaxCategoryInput!) {
          createTaxCategory(input: $input) {
            id
          }
        }
      `,
      { input: { name: 'Standard', isDefault: true } },
    );
    categoryId = created.createTaxCategory.id;
    console.log('✓ created default tax category');
  }

  const rateData = await admin<{ taxRates: { items: Array<{ id: string }> } }>(`
    query SeedTaxRates {
      taxRates {
        items {
          id
        }
      }
    }
  `);

  if (rateData.taxRates.items.length === 0) {
    await admin(
      `
        mutation SeedCreateTaxRate($input: CreateTaxRateInput!) {
          createTaxRate(input: $input) {
            id
          }
        }
      `,
      {
        input: {
          name: 'GST 5% (books)',
          enabled: true,
          value: 5,
          categoryId,
          zoneId,
        },
      },
    );
    console.log('✓ created 5% GST tax rate');
  }
}

// ---------------------------------------------------------------------------
// Facets
// ---------------------------------------------------------------------------

type FacetValueMap = Map<string, string>; // `${facetCode}:${valueName}` -> id

/**
 * Facets are a nice-to-have: the storefront grid does not use them yet, so a
 * failure here should not abort the whole seed.
 */
async function ensureFacets(): Promise<FacetValueMap> {
  const map: FacetValueMap = new Map();

  const existing = await admin<{
    facets: { items: Array<{ id: string; code: string; values: Array<{ id: string; name: string }> }> };
  }>(`
    query SeedFacets {
      facets {
        items {
          id
          code
          values {
            id
            name
          }
        }
      }
    }
  `);

  const byCode = new Map(existing.facets.items.map((f) => [f.code, f]));

  for (const [code, names] of [
    ['genre', GENRES],
    ['language', LANGUAGES],
  ] as const) {
    let facet = byCode.get(code);

    if (!facet) {
      const created = await admin<{
        createFacet: {
          id: string;
          code: string;
          values: Array<{ id: string; code: string; name: string }>;
        };
      }>(
        `
          mutation SeedCreateFacet($input: CreateFacetInput!) {
            createFacet(input: $input) {
              id
              code
              values {
                id
                code
                name
              }
            }
          }
        `,
        {
          input: {
            code,
            isPrivate: false,
            translations: [{ languageCode: 'en', name: code === 'genre' ? 'Genre' : 'Language' }],
            values: names.map((name) => ({
              code: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              translations: [{ languageCode: 'en', name }],
            })),
          },
        },
      );
      facet = created.createFacet;
    }

    for (const value of facet.values) {
      map.set(`${code}:${value.name.toLowerCase()}`, value.id);
    }
  }

  console.log(`✓ facets ready (${map.size} values)`);
  return map;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const EXISTING_PRODUCTS = `
  query SeedExistingProducts($take: Int!) {
    products(options: { take: $take }) {
      totalItems
      items {
        id
        slug
        variants {
          id
          sku
          prices {
            currencyCode
            price
          }
        }
      }
    }
  }
`;

const CREATE_PRODUCT = `
  mutation SeedCreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      slug
    }
  }
`;

const CREATE_VARIANTS = `
  mutation SeedCreateVariants($input: [CreateProductVariantInput!]!) {
    createProductVariants(input: $input) {
      id
      sku
    }
  }
`;

const UPDATE_VARIANTS = `
  mutation SeedUpdateVariants($input: [UpdateProductVariantInput!]!) {
    updateProductVariants(input: $input) {
      id
      sku
    }
  }
`;

type ExistingVariant = {
  id: string;
  sku: string;
  prices: Array<{ currencyCode: string; price: number }>;
};

type ExistingProduct = { id: string; slug: string; variants: ExistingVariant[] };

// ---------------------------------------------------------------------------
// Shipping + payment methods
// ---------------------------------------------------------------------------

const SHIPPING_METHOD_CODE = 'standard-delivery';
const PAYMENT_METHOD_CODE = 'cash-on-delivery';

/**
 * The default shipping eligibility checker's `orderMinimum` **must be stored
 * explicitly**.
 *
 * With `arguments: []` Vendure does not fall back to the argument's
 * `defaultValue`, so the value is `undefined` and `order.totalWithTax >= undefined`
 * is `false`. The method is then silently ineligible for every order,
 * `eligibleShippingMethods` comes back empty, and checkout cannot proceed — with
 * no error anywhere. Measured against the Admin API's `testShippingMethod`:
 *
 *   arguments: []                  -> eligible: false
 *   [{ orderMinimum: '0' }]        -> eligible: true
 *   [{ orderMinimum: '100000' }]   -> eligible: false   (correct: order was ₹837.90)
 *
 * `ConfigArgInput.value` is a JSON-stringified value, so an int is the string `'0'`
 * (and a string argument would have to be quoted, e.g. `'"auto"'` — which is why
 * the other calculator arguments are left to their defaults).
 */
const SHIPPING_CHECKER = {
  code: 'default-shipping-eligibility-checker',
  arguments: [{ name: 'orderMinimum', value: '0' }],
};

/**
 * Every argument is stored explicitly.
 *
 * `defaultValue` in the argument definition is **not** a substitute for storing a
 * value: `includesTax` left unset makes `getPriceIncludesTax()` return `undefined`,
 * so the resolver falls through to `grossPriceOf(4900, undefined)` and the shipping
 * quote comes back as `NaN` — which surfaces as the opaque error
 * "Money cannot represent non numeric value: NaN".
 *
 * `ConfigArgInput.value` is JSON-encoded, so a string argument's value carries its
 * own quotes (`'"exclude"'`) while numeric ones do not.
 *
 * `rate` and `taxRate` are in minor units / percent: 4900 @ 5% => ₹49.00 + ₹2.45.
 */
const SHIPPING_CALCULATOR = {
  code: 'default-shipping-calculator',
  arguments: [
    { name: 'rate', value: '4900' },
    { name: 'includesTax', value: '"exclude"' },
    { name: 'taxRate', value: '5' },
  ],
};

/** Arguments that must be present on the stored calculator for it to produce a number. */
const REQUIRED_CALCULATOR_ARGS = ['rate', 'includesTax', 'taxRate'];

/**
 * Shared by create *and* update: `UpdateShippingMethodInput.translations` is
 * required, not optional, so the repair path below must send them too.
 */
const SHIPPING_TRANSLATIONS = [
  {
    languageCode: 'en',
    name: 'Standard delivery',
    description: 'Dispatched within 2 working days; arrives in 3-5.',
  },
];

/**
 * Creates the shipping and payment methods that checkout requires.
 *
 * Without an eligible shipping method an order can never be advanced past
 * `AddingItems`, and without an eligible payment method it can never leave
 * `ArrangingPayment` — so `addPaymentToOrder` fails no matter what the storefront
 * does. Neither existed before this was added.
 *
 * Idempotent: an existing code is left untouched.
 */
async function ensureCommerceMethods(): Promise<void> {
  const existing = await admin<{
    shippingMethods: {
      items: Array<{
        id: string;
        code: string;
        checker: { code: string; args: Array<{ name: string; value: string }> };
        calculator: { code: string; args: Array<{ name: string; value: string }> };
      }>;
    };
    paymentMethods: { items: Array<{ id: string; code: string }> };
  }>(`
    query SeedCommerceMethods {
      shippingMethods {
        items {
          id
          code
          checker {
            code
            args {
              name
              value
            }
          }
          calculator {
            code
            args {
              name
              value
            }
          }
        }
      }
      paymentMethods { items { id code } }
    }
  `);

  const existingShipping = existing.shippingMethods.items.find(
    (m) => m.code === SHIPPING_METHOD_CODE,
  );

  if (!existingShipping) {
    await admin(
      `
        mutation SeedShipping($input: CreateShippingMethodInput!) {
          createShippingMethod(input: $input) {
            id
            code
          }
        }
      `,
      {
        input: {
          code: SHIPPING_METHOD_CODE,
          // Verified against the Admin API's `fulfillmentHandlers` query — the code
          // really is `manual-fulfillment`, not `default-fulfillment-handler`.
          fulfillmentHandler: 'manual-fulfillment',
          checker: SHIPPING_CHECKER,
          calculator: SHIPPING_CALCULATOR,
          translations: SHIPPING_TRANSLATIONS,
        },
      },
    );
    console.log(`  + shipping method "${SHIPPING_METHOD_CODE}" created`);
  } else if (
    !existingShipping.checker.args.some((arg) => arg.name === 'orderMinimum') ||
    !REQUIRED_CALCULATOR_ARGS.every((name) =>
      existingShipping.calculator.args.some((arg) => arg.name === name),
    )
  ) {
    // Self-heal: an earlier run stored these with missing arguments, which either
    // made the method ineligible or priced it as NaN.
    await admin(
      `
        mutation RepairShipping($input: UpdateShippingMethodInput!) {
          updateShippingMethod(input: $input) {
            id
            code
          }
        }
      `,
      {
        input: {
          id: existingShipping.id,
          checker: SHIPPING_CHECKER,
          calculator: SHIPPING_CALCULATOR,
          translations: SHIPPING_TRANSLATIONS,
        },
      },
    );
    console.log(
      `  ~ shipping method "${SHIPPING_METHOD_CODE}" — repaired missing checker/calculator arguments`,
    );
  } else {
    console.log(`  · shipping method "${SHIPPING_METHOD_CODE}" — already present, skipping`);
  }

  if (existing.paymentMethods.items.some((m) => m.code === PAYMENT_METHOD_CODE)) {
    console.log(`  · payment method "${PAYMENT_METHOD_CODE}" — already present, skipping`);
  } else {
    await admin(
      `
        mutation SeedPayment($input: CreatePaymentMethodInput!) {
          createPaymentMethod(input: $input) {
            id
            code
          }
        }
      `,
      {
        input: {
          code: PAYMENT_METHOD_CODE,
          enabled: true,
          // No checker: `checker` is optional and `paymentMethodEligibilityCheckers`
          // is empty by default, so this stays eligible for every order.
          handler: { code: 'cash-on-delivery', arguments: [] },
          translations: [
            {
              languageCode: 'en',
              name: 'Cash on delivery',
              description: 'Pay the courier when your order arrives.',
            },
          ],
        },
      },
    );
    console.log(`  + payment method "${PAYMENT_METHOD_CODE}" created`);
  }
}

async function main(): Promise<void> {
  console.log(`Seeding catalogue via ${ADMIN_API_URL}`);
  await login();
  await ensureChannelSetup();
  await ensureCommerceMethods();

  let facetValues: FacetValueMap = new Map();
  try {
    facetValues = await ensureFacets();
  } catch (error) {
    console.warn(
      `! facet setup skipped (${
        error instanceof Error ? error.message : String(error)
      }) — continuing without facets`,
    );
  }

  const existing = await admin<{
    products: { totalItems: number; items: ExistingProduct[] };
  }>(EXISTING_PRODUCTS, { take: 500 });
  const existingBySlug = new Map(existing.products.items.map((p) => [p.slug, p]));

  let created = 0;
  let skipped = 0;
  let repaired = 0;
  let failed = 0;

  for (const book of BOOKS) {
    const found = existingBySlug.get(book.slug);
    const variant = found?.variants[0];
    const hasInrPrice = variant?.prices.some((p) => p.currencyCode === CURRENCY) ?? false;

    if (found && variant && hasInrPrice) {
      skipped += 1;
      console.log(`  · ${book.title} — already seeded, skipping`);
      continue;
    }

    const facetValueIds = [
      facetValues.get(`genre:${book.genre.toLowerCase()}`),
      facetValues.get(`language:${book.language.toLowerCase()}`),
    ].filter((id): id is string => Boolean(id));

    try {
      // Variant exists but was priced in another currency (e.g. USD prices set
      // before the channel was switched to INR) — just add the INR price.
      if (found && variant) {
        await admin(UPDATE_VARIANTS, {
          input: [{ id: variant.id, prices: [{ currencyCode: CURRENCY, price: book.price }] }],
        });
        repaired += 1;
        console.log(`  ~ ${book.title} — added missing ${CURRENCY} price`);
        continue;
      }

      let productId: string;

      if (found) {
        // Self-heal: an interrupted run can leave a product with no variant.
        productId = found.id;
        console.log(`  ~ ${book.title} — product exists but has no variant, repairing`);
      } else {
        const productResult = await admin<{ createProduct: { id: string } }>(CREATE_PRODUCT, {
          input: {
            enabled: true,
            facetValueIds,
            translations: [
              {
                languageCode: 'en',
                name: book.title,
                slug: book.slug,
                description: book.description,
              },
            ],
          },
        });
        productId = productResult.createProduct.id;
      }

      await admin(CREATE_VARIANTS, {
        input: [
          {
            productId,
            enabled: true,
            sku: skuFor(book.slug),
            price: book.price,
            prices: [{ currencyCode: CURRENCY, price: book.price }],
            stockOnHand: book.stock,
            trackInventory: 'TRUE',
            translations: [{ languageCode: 'en', name: book.title }],
          },
        ],
      });

      created += 1;
      console.log(`  + ${book.title} (₹${(book.price / 100).toFixed(2)}, ${book.stock} in stock)`);
    } catch (error) {
      failed += 1;
      console.warn(`  ! ${book.title} — ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const after = await admin<{ products: { totalItems: number } }>(EXISTING_PRODUCTS, { take: 1 });

  console.log('');
  console.log(
    `Done. created: ${created}, repaired: ${repaired}, skipped: ${skipped}, failed: ${failed}, total products: ${after.products.totalItems}`,
  );
}

main().catch((error: unknown) => {
  console.error('Seed failed:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
