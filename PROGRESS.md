# Meghana Book House - Vendure Implementation Progress

## Project Overview
- **Project**: Meghana Book House POS + Headless Commerce Platform
- **Framework**: Vendure Core (TypeScript, NestJS, GraphQL)
- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind CSS
- **Architecture**: Monorepo with Turborepo + pnpm workspaces

---

## ✅ Completed: Monorepo Foundation

### Root Configuration
- [x] `package.json` - Workspace configuration with all scripts
- [x] `pnpm-workspace.yaml` - Package catalog with version pinning
- [x] `turbo.json` - Turborepo pipeline configuration
- [x] `tsconfig.json` - Base TypeScript config with path aliases
- [x] Directory structure created

### Shared Packages (`packages/shared/`)
| Package | Status | Description |
|---------|--------|-------------|
| `@meghana/shared-types` | ✅ Complete | Product, Cart, Customer, Order, POS, B2B types |
| `@meghana/shared-graphql-operations` | ✅ Complete | gql.tada config for type-safe GraphQL |
| `@meghana/shared-ui-components` | ✅ Partial | Button, Input, Badge, Dialog, CartDrawer, ProductCard, BarcodeScanner |
| `@meghana/shared-utils` | ✅ Complete | Currency formatting, date utils, cn() helper |

### Infrastructure (`infrastructure/`)
| Component | Status | Description |
|-----------|--------|-------------|
| Docker | ⏳ Pending | docker-compose.yml for local dev |
| Kubernetes | ⏳ Pending | K8s manifests for production |
| Terraform | ⏳ Pending | Cloud infrastructure as code |

---

## ✅ Completed: Storefront Application (`apps/storefront/`)

### Configuration
- [x] `package.json` - Dependencies with catalog references
- [x] `next.config.js` - Image optimization, rewrites, headers
- [x] `tsconfig.json` - Next.js specific config
- [x] `tailwind.config.ts` - Design system tokens

### Core Layout & Providers
- [x] `src/app/providers.tsx` - QueryClient, Auth, Cart, Locale, Toast providers
- [x] `src/app/(shop)/layout.tsx` - Root layout with Header/Footer
- [x] `src/app/globals.css` - Tailwind base + CSS variables + utilities

### Feature Providers
- [x] `src/features/cart/cart-provider.tsx` - Full cart state management (add, update, remove, coupons)
- [x] `src/features/auth/auth-provider.tsx` - Authentication (login, register, logout, password reset)

### UI Components
- [x] `src/components/ui/toast-provider.tsx` - Radix UI toast system
- [x] `src/components/locale-provider.tsx` - Multi-language (12 Indian languages) + currency
- [x] `src/components/layout/header.tsx` - Full header with search, cart drawer, user menu, mobile nav
- [x] `src/components/layout/footer.tsx` - Complete footer with links, newsletter, trust badges

### Shared UI Components (in `@meghana/shared-ui-components`)
- [x] `Button` - Multiple variants (default, pos, pos-danger, ghost, etc.)
- [x] `Input` - With label, error, hint support
- [x] `Badge` - Multiple variants and sizes
- [x] `Dialog` - Radix UI dialog wrapper
- [x] `ProductCard` - Feature-rich product display with badges, quick actions
- [x] `ProductGrid` - Responsive grid layout
- [x] `CartDrawer` - Slide-over cart with quantity controls, coupons, checkout
- [x] `BarcodeScanner` - Camera + hardware scanner + manual entry for POS

---

## � Repair Log — 2026-10-06

**Status: `corepack pnpm install` and `corepack pnpm build` are now GREEN — 5/5 packages.**

The build had never once succeeded before this session. Fixes applied, grouped by cause.

### Toolchain — install was impossible
| Fix | Detail |
|---|---|
| pnpm version | `packageManager` `9.0.0` → `9.15.0`. **pnpm 9.0.0 cannot resolve `catalog:`** (needs >=9.5). Always run `corepack pnpm <cmd>`, not bare `pnpm`, or you get `ERR_PNPM_SPEC_NOT_SUPPORTED_BY_ANY_RESOLVER`. |
| Workspace globs | Added `packages/shared/*`. `packages/*` matched only empty dirs, so **none** of the shared packages were workspace members. |
| Catalog gaps | Added 10 missing entries: `class-variance-authority`, `@tanstack/react-query-devtools`, and 9 Radix packages. |
| Phantom dependency | Removed `@radix-ui/react-badge` — **it does not exist**; Radix has no Badge primitive. |
| React types | `@types/react` / `@types/react-dom` `^18.3.0` → `^19.0.0` to match React 19. |
| Missing manifest | Created `packages/shared/utils/package.json` (the package had only `src/`). |
| Workspace protocol | `*` → `workspace:*` in storefront deps — `*` resolved against npm and 404'd. |

### Build config — `tsc` was compiling the entire monorepo
No shared package had a `tsconfig.json`, so bare `tsc` walked up to the root config and tried to compile every file in the repo (that is why errors appeared in *sibling* packages). Added per-package `tsconfig.json` for `types`, `utils`, `ui-components`, `graphql-operations`.

### `packages/shared/types` — had never compiled once
- **Created `src/common.ts`**: `CurrencyCode`, `LanguageCode`, `Coordinate`, `Tag`, `Asset`, `Country`, `CountryTranslation`, `Address`.
- **Created `src/order.ts`**: `OrderState`, `PaymentState`, `RefundState`, `TransactionKind`, `TransactionState`, `FulfillmentState`, `TaxLine`.
- Removed **24 duplicate exports** that produced TS2308 re-export collisions across `cart`, `customer`, `product`, `pos`, `b2b`.
- Resolved **divergent duplicate shapes** by adopting the fuller Vendure-shaped definitions (3 different `Address`, 3 `Asset`, 2 `Customer`, 2 `ProductVariant`).
- Added **missing imports** — `cart.ts` and `b2b.ts` referenced `Customer`, `Product`, `ProductVariant`, `Asset`, `OrderSummary` without ever importing them.

### `packages/shared/ui-components`
- **Genuine syntax error**: unquoted hyphenated object keys in `button.tsx` (`pos-secondary`, `pos-danger`, `pos-sm`) — invalid JS producing 18 × TS1005.
- Wrong relative imports in `product-card.tsx` (`./button` → `../ui/button`, `./badge` → `../ui/badge`).
- Missing `Input` import in `barcode-scanner.tsx`.
- `React.useRef<T>()` → `useRef<T | undefined>(undefined)` — React 19 requires an initial value.
- Added undeclared dependencies `class-variance-authority` and `next`.
- Added the 5 barrel `index.ts` files and fixed the `exports` map (removed the nonexistent `./forms` target; subpaths now point at `dist/*/index.js`).

### `packages/shared/graphql-operations`
- `gql.tada.ts` was a **hand-written config calling a non-existent `defineConfig` export**. gql.tada v1 has no such API — configuration lives in `tsconfig.json` under `compilerOptions.plugins`.
- Rewrote it as a generated-output placeholder and moved schema config into `tsconfig.json` as a `schemas: []` plugin entry (`shop` + `admin`).
- Fixed scripts: `gql-tada` → `gql.tada generate-output --tsconfig ./tsconfig.json` (real v1 CLI surface — there is no `--watch`).

### `apps/storefront`
- `(shop)/layout.tsx` imported `./providers`; correct path is `../providers`.
- **Both** layouts rendered `<html>`/`<body>` — illegal for a route-group layout. `(shop)/layout.tsx` now renders only Header/main/Footer; metadata de-duplicated into the root layout.
- `<html class=…>` → `className`.
- `YouTube` → `Youtube` (lucide naming) in both the import and the icon reference.
- Deep imports (`@meghana/shared-ui-components/ui/button`) bypassed the `exports` map → routed through barrels.
- `ToastAction` now receives the required `altText`.
- `React.ReactElement<typeof ToastAction>` → `React.ReactElement<React.ComponentProps<typeof ToastAction>>` (React 19 changed this generic's meaning).

### Still open after the repair
- `lint` and `test` have **not** been verified.
- `apps/pos-pwa` and `apps/b2b-portal` remain empty.
- Vendure runs with **no plugins** — no asset uploads yet.
- The catalogue has **no seed data**, so product grids render their empty state.

---

## ✅ Vendure Backend + gql.tada Pipeline — 2026-10-06

The backend now exists, boots, and produces live GraphQL schemas.

### Local infrastructure (`infrastructure/docker/docker-compose.yml`)
Created from scratch. Three services, all with healthchecks:

| Service | Container | Host port |
|---|---|---|
| Postgres 16 | `meghana-postgres` | **5433** |
| Redis 7 | `meghana-redis` | 6379 |
| Meilisearch v1.10 | `meghana-meilisearch` | 7700 |

⚠️ **Postgres is on host port 5433, not 5432.** A locally-installed Postgres already
listens on `127.0.0.1:5432` and shadows the container for `localhost` connections —
this produced `role "meghana" does not exist` even though the role *did* exist inside
the container. Keep `DB_PORT` in sync with the compose mapping.

### `apps/server` (was an empty directory)
| File | Purpose |
|---|---|
| `package.json` | `@meghana/server` — Vendure + TypeORM + `pg` + `tsx` |
| `tsconfig.json` | CommonJS + `experimentalDecorators` + `emitDecoratorMetadata`, and critically **`useDefineForClassFields: false`** (the ES2022 default silently breaks TypeORM decorators) |
| `src/vendure-config.ts` | env-driven `VendureConfig`; CORS for storefront:3001, pos-pwa:3002, b2b-portal:3003; `synchronize: true` (dev only) |
| `src/index.ts` | `bootstrap(config)` |
| `scripts/generate-schema.ts` | introspects the running server and writes the SDL files |
| `.env.example` | every variable, with working local defaults |

**Verified boot:**
```
Vendure server (v3.7.4) now running on port 3000
Shop API:  http://localhost:3000/shop-api
Admin API: http://localhost:3000/admin-api
```

### Schema + gql.tada pipeline (previously impossible)

```bash
pnpm docker:up                                                    # Postgres/Redis/Meilisearch
pnpm --filter @meghana/server dev                                 # Vendure on :3000
pnpm --filter @meghana/server graphql:schema                      # -> apps/server/src/schema-{shop,admin}.graphql
pnpm --filter @meghana/shared-graphql-operations graphql:generate # -> src/gql.tada{,.admin}.ts
```

Generated artefacts: `schema-shop.graphql` (3,949 lines / 142 types),
`schema-admin.graphql` (6,739 lines), `src/gql.tada.ts` (454 KB),
`src/gql.tada.admin.ts` (936 KB).

`src/index.ts` now exports a real typed client:
```ts
export const graphql = initGraphQLTada<{ introspection: typeof introspection }>();
```

**Verified live** against the running server:
```
POST http://localhost:3000/shop-api
-> activeChannel, activeCustomer, activeOrder, products, product, search,
   collections, facets, eligibleShippingMethods, eligiblePaymentMethods, ...
```

### Gotcha for future work
Generated outputs live in `src/` (not the package root) so that `rootDir: src` holds and
`main: dist/index.js` stays correct. Changing `tadaOutputLocation` will **not** move
existing files — delete the old ones and regenerate.

---

## ✅ Storefront Pages — 2026-10-06

The 404 is resolved. `next build` now reports real App Router routes:

```
Route (app)                                 Revalidate
┌ ○ /            173 B   111 kB                 1m
├ ○ /_not-found  993 B   104 kB
└ ○ /books       173 B   111 kB                 1m
```

### Data layer (modelled on the official Vendure Next.js starter)
| File | Purpose |
|---|---|
| `src/lib/vendure/graphql.ts` | Re-exports the typed client — `graphql`, `readFragment`, `FragmentOf`, `ResultOf` |
| `src/lib/vendure/api.ts` | Server-side `query()`: `print()`s the gql.tada document, sends the `vendure-token` channel header, adds `languageCode`/`currencyCode` params, and wires Next cache `tags` + `revalidate` |
| `src/features/products/graphql.ts` | `ProductCardFragment` + `GetFeaturedProductsQuery` |

### Pages
- `src/app/(shop)/page.tsx` — home: `HeroSection` + `Suspense`-streamed `FeaturedProducts`
- `src/app/(shop)/books/page.tsx` — minimal catalogue listing (*facets, sorting and pagination still pending*)
- `src/features/home/hero-section.tsx`, `src/features/products/featured-products.tsx`, `src/features/products/components/product-card.tsx`

Both pages are **resilient**: if Vendure is unreachable they render an explanatory
notice rather than failing the build — important because `next build` prerenders them.

### Shop API gotchas discovered the hard way
- **`ProductVariant.stockLevel` is `String!`, not `Int`** in the Shop API. It can be a
  numeric string, `'IN_STOCK'` or `'OUT_OF_STOCK'` — handle all three shapes.
- **`ProductVariant` has no `trackInventory` field** in the Shop API (Admin-only).
  Requesting it makes the whole query invalid.
- Prices are `Money` (integer minor units); `formatCurrency` divides by 100.
- **gql.tada fragment masking is enabled**: you cannot read fields off a `FragmentOf`
  value directly. Use `readFragment(Fragment, value)` — including when you only need an
  `id` for a React key.

### Styling was completely broken (found by looking at a screenshot)
The first render had **zero CSS** — unstyled HTML with full-size icons. Two compounding causes:

1. **`apps/storefront/postcss.config.js` did not exist.** Without it, Next ships the raw
   `@tailwind base/components/utilities` directives straight to the browser, which ignores
   them. Tailwind was never invoked at all — which is also why the second problem stayed hidden.
2. **`tailwind.config.ts` requires `tailwindcss-animate`, which was never installed.** Once
   PostCSS was wired up, the build failed with `Cannot find module 'tailwindcss-animate'`.

`postcss` and `autoprefixer` were also not declared anywhere.

Fixed by adding `postcss.config.js` and adding `postcss`, `autoprefixer` and
`tailwindcss-animate` to the catalog + storefront deps.

Verified: built CSS went from **3,704 bytes** (raw directives, `@tailwind` ×1) to
**37,593 bytes**, 0 raw directives, real compiled rules (`.flex{display:flex}`, preflight
reset present).

### Current state
The catalogue is **empty** (fresh database, no seed data), so product grids correctly
render their "no books yet" state. Seed products in Vendure to see cards.

### Verified
```
/                  -> 200   hero ("Your gateway to knowledge"), highlights, both CTAs
/books             -> 200   listing, empty-state messaging
/does-not-exist    -> 404   real 404s still work
Vendure shop-api   -> 200
```

Critically, the home page rendered the **"no books yet"** state rather than the
**"catalogue unavailable"** state — proving the server-side `query()` actually reached
Vendure and parsed a valid response.

Visually confirmed in the browser: styled top bar, header, hero, trust highlights,
Featured books section and footer.

---

## ✅ Seeded Catalogue — 2026-10-07

`apps/server/scripts/seed.ts` seeds 12 real books through the **Admin API** (not direct
DB writes), so it exercises the same path the dashboard would.

```bash
pnpm --filter @meghana/server db:seed
```

Idempotent and self-healing — it will:
- create the `IN` country, zone, tax category and 5% GST rate if missing
- force the channel currency to **INR**
- create missing products and variants
- repair products left without a variant by an interrupted run
- repair variants whose price is not in INR

**Verified result:** `12 titles available`, 12 cards on `/books`, 8 on the home page,
every price rendered in ₹ (e.g. ₹418.95 = ₹399.00 + 5% GST).

### Vendure bootstrap gotchas (all found by hitting them)
1. **The `countries` table is empty.** A bare `bootstrap()` ships no countries, so a zone
   cannot reference one. The seed now creates `IN` via `createCountry`.
2. **No default tax zone exists.** Variant creation fails with
   *"The active tax zone could not be determined."* Requires a `Zone` **and**
   `updateChannel({ defaultTaxZoneId, defaultShippingZoneId })`.
3. **The channel currency defaults to `USD`.** Prices rendered as `$418.95` on an Indian
   bookstore. Fixed with `updateChannel({ defaultCurrencyCode: 'INR' })`.
4. **`updateChannel` returns a union** (`UpdateChannelResult`), not `Channel` — you need an
   inline fragment or the query fails validation. `createZone`/`createTaxRate` return
   their types directly.
5. **No seed data means no tax category or tax rate** either — the seed creates both.
6. `ProductVariant.stockLevel` really does return `'IN_STOCK'` (confirmed against seeded
   data), validating the defensive parsing in `product-card.tsx`.

### Next.js caching gotcha
Next persists a **fetch cache in `.next/cache`** across builds (94 MB here). After seeding,
a rebuild still rendered the old *"catalogue is empty"* page because the build reused the
cached `products` response. When data changes during development:

```bash
rm -rf apps/storefront/.next && pnpm --filter @meghana/storefront build
```

In production the `revalidate: 60` window handles this.

### Cover images
Every product now has a `featuredAsset` — see the "Generated Cover Images" section below.

---

## ✅ Generated Cover Images — 2026-10-07

Every product now has a real `featuredAsset`, so cards render actual artwork instead of the
placeholder icon.

```bash
pnpm --filter @meghana/server db:seed:covers
```

`apps/server/scripts/seed-covers.ts` composes each cover as an **SVG** (title, genre,
gradient) and rasterises it to PNG with **`sharp`**, then uploads it and assigns it as the
product's `featuredAsset`.

Design: 600×800 (3:4, matching the card's `aspect-[3/4]`), with a gradient keyed to the
product's `genre` facet value — Fiction indigo, Non-Fiction teal, Academic violet, Children
amber, Reference emerald — plus a wrapped serif title, a genre label and the shop name.

Idempotent — products that already have a `featuredAsset` are skipped.

**Verified:** 12/12 covers uploaded; assets served at `HTTP 200 image/png`; the Shop API
returns `featuredAsset 600x800`; 12/12 card images load on `/books` and 8/8 on the home
page (`naturalWidth > 0`).

### What this required
1. **`AssetServerPlugin` had to be enabled.** Without it `createAssets` exists in the
   schema but has nowhere to write, so uploads fail. Configured with
   `{ route: 'assets', assetUploadDir: 'apps/server/static/assets', assetUrlPrefix }`.
2. **`AssetServerPlugin` is a separate package** — it is *not* exported from
   `@vendure/core`. Added `@vendure/asset-server-plugin` to the server's dependencies.
3. **`sharp`** was already in the pnpm store as a Next.js dependency; declared it
   explicitly for the server so the script can resolve it.

### Upload contract (easy to get wrong)
```graphql
mutation { createAssets(input: [CreateAssetInput!]!) { ... } }
# CreateAssetInput = { file: Upload!, tags: [String!], translations, customFields }
```
It is a **GraphQL multipart request**: three form fields — `operations` (the JSON body with
`file: null`), `map` (`{ "0": ["variables.input.0.file"] }`) and the file under key `"0"`.
Critically, **do not set `Content-Type` yourself** — `fetch` must add the multipart
boundary, and overriding it breaks the parse with a confusing error.

### Note on `sharp` + text
`sharp` rasterises SVG `<text>` correctly on macOS (it uses system fonts), which is what
makes titled covers possible without shipping a font library.

---

## ✅ Product Detail Pages — 2026-10-07

`/books/[slug]` is live, so the links on the grid no longer 404.

```
Route (app)
├ ○ /books              173 B   111 kB   1m
└ ● /books/[slug]      3.83 kB  115 kB          (SSG via generateStaticParams)
```

All 12 books are prerendered as static HTML. `generateStaticParams` falls back to
on-demand rendering if the API is unreachable during a build, so a CI build cannot break.

### Files
| File | Purpose |
|---|---|
| `src/app/(shop)/books/[slug]/page.tsx` | Breadcrumb, cover, genre/language badges, price, stock, description, related books |
| `src/features/products/components/add-to-cart.tsx` | Client component — quantity stepper + add to cart |
| `src/features/products/stock.ts` | Shared `isInStock` / `stockQuantity` (the Shop API returns `stockLevel` as a **String**) |
| `src/features/products/graphql.ts` | Added `GetProductDetailQuery` — deliberately fragment-free so the result is unmasked |

`generateMetadata` sets a per-book title, description and OG image; the layout's
`%s | Meghana Book House` template applies. A genuine miss calls `notFound()`; a backend
failure renders a recoverable notice instead, so a 404 and an outage are distinguishable.

**Verified:** valid slugs → 200, unknown slug → 404, and the page renders title, genre,
language, SKU, ₹ price, stock state, description, Add to cart, trust list, cover image and
the "More from the shelves" section.

---

## ✅ Cart repaired — schema-derived types (was: Add to cart returned HTTP 400)

Clicking **Add to cart** returned HTTP 400. The button was wired correctly; the fault was in
`apps/storefront/src/features/cart/cart-provider.tsx`, whose documents were written against
the fabricated `ActiveOrder` / `OrderLine` types in `@meghana/shared-types` instead of the
schema. What the live Shop API rejected:

**`GET_ACTIVE_ORDER` — 8 invalid fields:**
```
Cannot query field "nextStates" on type "Order"
Cannot query field "modifications" on type "Order"
Cannot query field "trackInventory" on type "ProductVariant"
Cannot query field "product" on type "OrderLine"        <-- structural
Cannot query field "items" on type "OrderLine"
Cannot query field "adjustments" on type "OrderLine"
Cannot query field "promotions" on type "OrderLine"
Cannot query field "id" on type "OrderAddress"
```

**`ADD_ITEM_TO_CART` — 2 errors:**
```
Unknown type "CustomFieldInput"
Unknown argument "customFields" on field "Mutation.addItemToOrder"
```

`OrderLine` has **no `product` field at all** — the product is reached through
`line.productVariant.product` — so this was never a one-field patch.

### What the fix involved

1. `packages/shared/graphql-operations/src/client.ts` — the `initGraphQLTada` instance moved
   out of `index.ts` so `cart.ts` can use `graphql` without a circular import.
2. `.../src/cart.ts` — `CartLineFragment`, `CartFragment` and the five cart operations
   authored against the real schema. Types are **derived, never hand-written**: `readCart`,
   `readCartLine`, `readCartLines`, with `Cart` / `CartLine` as their return types.
3. `cart-provider.tsx` — same-origin `/shop-api` (a cross-origin call would drop the
   `SameSite` session cookie), and **mutations return the updated `Order`**, so no refetch.
4. `cart-drawer.tsx` — rewritten against the derived types: `cart.couponCodes`,
   `cart.discounts`, `line.productVariant.product`.

### The root cause worth remembering

**gql.tada types cannot cross a `.d.ts` boundary.** The `$tada` namespace holding the
fragment-ref symbol is *module-scoped*, yet `tsc` emits fragment masks into `.d.ts` as a bare
`[$tada.fragmentRefs]` — a name no consumer can resolve. Consumers then see
`{ [x: number]: … }` instead of the mask, and every `FragmentOf` assignment fails with the
bewildering "Property '[$tada.fragmentRefs]' is missing".

Concretely: `dist/cart.d.ts` contained **9** textual `$tada` references, while
`ui-components/dist` contained **zero** — because it only ever refers to *named* type aliases,
which `tsc` emits by name without expanding them.

Fix: make `@meghana/shared-graphql-operations` a **source-first (just-in-time) package** —
`main` / `types` / `exports` point at `src/index.ts`, `build` is `tsc --noEmit`, and the
storefront (which already listed it in `transpilePackages`) compiles the source directly. No
other shared package needs this, since none of them export gql.tada documents.

This also explains why `ProductCard` always worked: its documents live in the app source, so
they never crossed a package boundary.

### Verified in the browser (2026-10-07)

- Add to cart → **HTTP 200** (was 400), header badge increments
- Cart **survives a reload** → the session cookie round-trips correctly
- Drawer renders cover, linked title, ₹418.95, and decrement disabled at quantity 1
- Increase → 2 items, **₹837.90**, badge 2
- Invalid coupon → inline `role="alert"` reading `Coupon code "NOPE123" is not valid`, with
  **zero console and zero page errors**. An earlier revision leaked this as an *unhandled
  rejection* — the provider rethrows (so `AddToCart` can show its error state) while the
  drawer discarded the promise; the drawer now catches and renders it.
- Remove → empty state, totals ₹0.00, checkout disabled

### Left open by this work
- **`/checkout` does not exist.** `onCheckout` only closes the drawer.
- `shared-types/cart.ts` still carries the now-unused fabricated entities.

---

## ✅ Catalogue Search — facets, sorting, pagination — 2026-10-07

`/books` was a placeholder grid. It is now a real faceted catalogue, but only after unblocking
three things, because **facet filtering and price sorting are impossible with a default Vendure
setup**:

```
input ProductFilterParameter {   # no facet field at all
  id, createdAt, updatedAt, languageCode, name, slug, description, enabled, _and, _or
}
input ProductSortParameter {     # no price field
  id, createdAt, updatedAt, name, slug, description
}
```

Both are only reachable through the `search` query, which requires `DefaultSearchPlugin`.

### 1. `search` did not exist, even though the stored schema said it did

`apps/server/src/schema-shop.graphql` advertised `search(input: SearchInput!): SearchResponse!`,
yet the running server answered:

```
{"errors":[{"message":"No search plugin has been configured"}]}
```

The schema generator **introspects the live server**, so that file was generated against a
differently-configured server. Lesson: the stored schema is trustworthy for core types only —
verify anything plugin-provided against the API before designing around it.

### 2. `DefaultSearchPlugin`

Registered in `apps/server/src/vendure-config.ts` with `indexStockStatus: true` so results carry
`inStock`. `bufferUpdates` is left off, so product edits re-index immediately.

### 3. Queued jobs never ran — two independent causes

Registering the plugin was not enough; `reindex` sat at `PENDING` for ever.

- **No worker process.** In Vendure 3.x `bootstrap()` sets `processContext = 'server'` and does
  **not** start a worker — only `bootstrapWorker()` does. Added `apps/server/src/worker.ts`,
  which calls `worker.startJobQueue()`.
- **No job queue plugin.** The default is `InMemoryJobQueueStrategy`, whose own docs say it "can
  only be used when the JobQueueService is started from the main server process". Added
  `DefaultJobQueuePlugin` (database-backed via `SqlJobQueueStrategy`) and
  `DefaultSchedulerPlugin`, which also clears the "No scheduler strategy is configured!" warning.

`turbo.json` now declares `dev:worker`, and `dev` carries
`"with": ["@meghana/server#dev:worker"]` so `pnpm dev` starts both processes.

| Command | Purpose |
|---------|---------|
| `pnpm --filter @meghana/server search:reindex` | Rebuild the index; awaits the job and asserts the result |
| `pnpm --filter @meghana/server dev:worker` | The worker process (also started by `pnpm dev`) |

The Admin-API auth code duplicated between `seed.ts` and `seed-covers.ts` was extracted to
`apps/server/scripts/lib/admin-client.ts` before a third copy could be added.

### The page

Catalogue state lives entirely in the URL, so every view is linkable and server-rendered:

```
/books?genre=1,2&language=6&sort=price-asc&page=2&q=palace
```

`sort`, `page` and `q` are reserved; **any other parameter is a facet filter keyed by the facet
`code`**, so adding a facet in Vendure needs no code change. Values within one facet are OR'd;
different facets are AND'd, matching Vendure's `facetValueFilters` semantics.

New files: `catalog-params.ts` (pure parse/build), `components/facet-sidebar.tsx`,
`components/pagination.tsx`, `components/sort-select.tsx`, `components/book-card.tsx`.

### Two decisions worth keeping

- **The sidebar queries `facets`, not only `search`.** `SearchResponse.facetValues` describes just
  the *filtered* result set — verified: filtering to Fiction returned only
  `Fiction 4, English 3, Hindi 1`. A sidebar built from that alone loses every other genre the
  moment you filter, so the complete list comes from `facets` and counts are merged in by id.
  Values with no matches render as 0 instead of vanishing.
- **`ProductCard` was split.** The markup moved to a presentational `BookCard` taking plain
  values, leaving `ProductCard` as the fragment adapter. A `SearchResult` is not a `Product`, so
  the catalogue needed the same card over different data — duplicating the markup would have
  created a second thing to drift.

### Verified in the browser

- Unfiltered: 12 titles, facet counts summing correctly (4+2+3+2+1 genres, 10+2 languages)
- `?genre=1` → 4 titles, an active chip, and the other genres still listed (at 0) and clickable
- `?sort=price-asc` → ₹208.95 → ₹523.95 strictly ascending; page 2 continues ₹733.95 → ₹1,678.95
- Page 2 preserves the sort; prev/next correctly drop the stale `page` parameter

### Two header bugs found by measuring, not by reading

Both were invisible in review and only surfaced from bounding boxes:

- **The desktop search bar was invisible at every width.** `hidden lg:flex-1` — `lg:flex-1` only
  sets flex-grow, so `hidden` was never undone. It needs `lg:flex`.
- **At 390 px the cart button was entirely off-screen** (x 504–540 in a 390 px viewport), so it
  could not be clicked at all. The logo's text is `shrink-0` and the mobile search field could not
  shrink. Fixed with a `sm:`-gated logo label, `min-w-0` on the search wrapper, and an icon-only
  search button on phones. The cart now sits at 262–298 and a plain click opens the drawer.

---

## ✅ Checkout — guest flow with cash on delivery — 2026-10-07

The funnel used to dead-end at the cart. It now completes: browse → detail → cart → checkout →
**order placed**. Three blockers had to be cleared, and each one hid the next.

### 1. Vendure ships no payment handler at all

`paymentOptions.paymentMethodHandlers` defaults to `[]`, and without a registered handler you
cannot create a `PaymentMethod`, so `addPaymentToOrder` can never succeed.

`@vendure/payments-plugin` is **not** the answer here: in 3.x it exports no dummy handler, and it
would drag in `stripe`, `braintree` and `@mollie/api-client` peers. It was installed, inspected,
and removed again.

Instead `apps/server/src/payment/cash-on-delivery-handler.ts` — about 40 lines, authorising on
`createPayment` and succeeding on `settlePayment`, which is what a courier taking cash amounts
to. A real gateway later registers alongside it; nothing in the checkout flow changes.

### 2. No shipping or payment method existed

`scripts/seed.ts` created a country, zone and tax rate but no `ShippingMethod` and no
`PaymentMethod`, so `eligibleShippingMethods` came back empty and an order could never leave
`AddingItems`.

### 3. Configurable args: `defaultValue` is not a substitute for storing a value

The sharpest trap in this task, and it fails **silently**.

`ConfigArgDefinition.defaultValue` does **not** apply when the stored `arguments` array omits the
argument. The value is `undefined`, and the symptom is invisible:

| Stored checker arguments | Result |
|---|---|
| `[]` | ineligible for **every** order — `eligibleShippingMethods: []` |
| `[{ orderMinimum: '0' }]` | eligible |
| `[{ orderMinimum: '100000' }]` | ineligible (correct: the order was ₹837.90) |

The same bug on the calculator: omitting `includesTax` makes `getPriceIncludesTax()` return
`undefined`, so the resolver falls through to `grossPriceOf(4900, undefined)` and **every quote is
`NaN`** — surfacing only as `Money cannot represent non numeric value: NaN`.

Both were pinned down with the Admin API's own `testShippingMethod` /
`testEligibleShippingMethods`, which report the outcome directly rather than leaving you to infer
it from an empty array. The seed now stores every argument explicitly, and self-heals a method
whose arguments are missing.

Also worth recording: the fulfillment handler code is **`manual-fulfillment`**, not the
frequently-cited `default-fulfillment-handler`. Read it from the `fulfillmentHandlers` query,
and note `ConfigArgInput.value` is JSON-encoded, so a string argument carries its own quotes
(`'"exclude"'`) while numeric ones do not.

### The flow

Guest checkout, four steps, each a precondition for the next:

```
setCustomerForOrder → setOrderShippingAddress → setOrderShippingMethod
                    → transitionOrderToState('ArrangingPayment') → addPaymentToOrder
```

The explicit transition is required: `addPaymentToOrder` is rejected with
`ORDER_PAYMENT_STATE_ERROR` unless the order is already in `ArrangingPayment`.

New files:

| File | Role |
|------|------|
| `packages/shared/graphql-operations/src/checkout.ts` | Checkout documents and derived types |
| `apps/storefront/src/features/checkout/checkout-flow.tsx` | The four-step client flow |
| `apps/storefront/src/app/(shop)/checkout/page.tsx` | Route + metadata |
| `apps/storefront/src/lib/vendure/client.ts` | Browser request helper, extracted from `cart-provider.tsx` |

`CartDrawer`'s checkout button is now a real link to `/checkout`, and its `onCheckout` prop —
which only closed the drawer — is gone. The drawer also no longer claims "Secure checkout powered
by Stripe", since there is no Stripe and the only method is cash on delivery.

### Verified in the browser

- Contact → address → delivery → payment, each step advancing
- Country select populated from `availableCountries` ("India")
- Delivery shows "Standard delivery, ₹51.45" (₹49.00 + 5% GST)
- Payment shows "Cash on delivery"; the button reads "Place order — ₹784.35"
  (2 × ₹367.50 + ₹51.45)
- Result: **"Order placed"**, reference `MSEGVLYEQ9QZUUFX`, `PaymentAuthorized`, and the header
  cart badge back to "Empty"
- Confirmed in the Admin API: the order persists with its COD payment and delivery line
- Zero page errors

### Known gaps in this flow

- The order ends at `PaymentAuthorized`, not `PaymentSettled` — correct for cash on delivery,
  since nothing has been collected. Settling is an admin action.
- **No confirmation email is sent** (no `EmailPlugin` configured), so the success screen
  deliberately does not claim one was.
- No `/cart` page and no account/login flow — guest checkout only.
- Abandoned checkouts accumulate as `AddingItems` orders; there is no cleanup job.

## 🐛 Known Defects

> **Verified 2026-10-06** by static inspection of the working tree.
> ⚠️ **Most defects below were subsequently fixed — see the Repair Log above for current status.**
> These are **not** speculative tech debt — several items marked ✅ above are internally
> broken. Fix these **before** attempting `pnpm install` / `pnpm build`, otherwise the
> failure modes will look unrelated to their real cause.

### Blockers — prevent install or build

| # | Defect | File(s) | Impact |
|---|--------|---------|--------|
| 1 | Turbo config uses `"pipeline"`; Turbo 2.x requires `"tasks"` | `turbo.json` | Every `turbo run dev/build/lint/test` fails |
| 2 | `index.ts` **and** `package.json` export `./order`, but `order.ts` does not exist | `packages/shared/types/src/index.ts`, `packages/shared/types/package.json` | `tsc` build of `@meghana/shared-types` fails |
| 3 | No barrel files (`src/index.ts`, `src/ui/index.ts`, `src/product/index.ts`, `src/cart/index.ts`, `src/pos/index.ts`), yet `main`/`exports` point to `dist/index.js`, `dist/product.js`, `dist/ui.js`, `dist/forms.js`, `dist/pos.js` | `packages/shared/ui-components/**` | Entry points can never be emitted; every consumer import breaks |
| 4 | Packages referenced via the `catalog:` protocol are missing from the catalog | `pnpm-workspace.yaml` | `pnpm install` aborts with "no catalog entry found" |
| 5 | `gql.tada.ts` reads two schema files that do not exist | `packages/shared/graphql-operations/gql.tada.ts` → `apps/server/src/schema-{shop,admin}.graphql` | `graphql:generate` fails |
| 6 | Imports `@tanstack/react-query-devtools`, which is undeclared | `apps/storefront/src/app/providers.tsx` | Module-not-found on build |
| 7 | `docker:*` scripts target a compose file that was never created | root `package.json` → `infrastructure/docker/docker-compose.yml` | `pnpm docker:up` fails |

#### Defect #4 in detail — missing catalog entries

Referenced with `catalog:` but **absent** from `pnpm-workspace.yaml`:

`@radix-ui/react-avatar` · `@radix-ui/react-separator` · `@radix-ui/react-tooltip` · `@radix-ui/react-switch` · `@radix-ui/react-checkbox` · `@radix-ui/react-radio-group` · `@radix-ui/react-select` · `@radix-ui/react-popover` · `@radix-ui/react-progress`

⚠️ **`@radix-ui/react-badge` does not exist.** It is referenced by both
`apps/storefront/package.json` and `packages/shared/ui-components/package.json`, but Radix
has no Badge primitive. Replace with the local `src/ui/badge.tsx` component (or a different
library) and remove it from dependencies.

### Configuration errors

| # | Defect | File(s) | Impact |
|---|--------|---------|--------|
| 8 | `react`/`react-dom` pinned to `^19.0.0` but `@types/react`/`@types/react-dom` pinned to `^18.3.0` | `pnpm-workspace.yaml` | Large volume of type errors once install succeeds |
| 9 | `gql.tada` `defineConfig` receives `react.hooks`, `typescript.output`, and `scalars` in a shape that is not the gql.tada API | `packages/shared/graphql-operations/gql.tada.ts` | Config is ignored or errors; needs rewriting against gql.tada docs |
| 10 | Alias `@meghana/shared/*` does not match actual package names (`@meghana/shared-types`, `-utils`, …) | root + storefront `tsconfig.json` | Alias is dead; resolution relies entirely on workspace symlinks |
| 11 | `environment/` and `vendure-config/` are empty, yet `@meghana/config/*` is aliased | `packages/config/**` | No env validation, no Vendure config source |

### Dangling architecture references

Not defects yet — they will become defects. Paths are declared/aliased but the targets are empty:

- `apps/server/` · `apps/pos-pwa/` · `apps/b2b-portal/`
- `infrastructure/{docker,kubernetes,terraform}/`
- `packages/shared/graphql-operations/{fragments,queries}/`
- `packages/config/{environment,vendure-config}/`

### Caveats on this register

- **No build has ever been run** in the auditing environment — these findings come from
  static reading. A real `pnpm install && pnpm build` will likely surface additional errors.
- `.early.coverage/javascript/coverage.json` reports every metric as `null` with empty
  `testables`: coverage tooling ran, but **no tests exist**.
- No `.env.example` or `.env.*` exists anywhere in the repo.

---

## ⏳ In Progress / Next Steps

### Storefront Pages (Priority: High)
| Page | Status | Notes |
|------|--------|-------|
| Home Page (`/`) | ✅ Done | Hero + Suspense'd featured products |
| Catalogue (`/books`) | ✅ Done | Facet filters, sorting, pagination, search — see below |
| Product Detail (`/books/[slug]`) | ✅ Done | SSG, related books, add to cart |
| Cart | ✅ Done | Drawer only — there is **no `/cart` page** |
| Checkout (`/checkout`) | ✅ Done | Guest checkout, cash on delivery — see below |
| Account Pages | ⏳ Later | Orders, addresses, profile, wishlist |
| Site-wide search | ⏳ Later | `/books?q=` works, but the header search box is not wired to it |

### POS PWA Application (`apps/pos-pwa/`) (Priority: High)
| Component | Status | Notes |
|-----------|--------|-------|
| Project Setup | ⏳ Next | Next.js PWA with Workbox |
| Offline Engine | ⏳ Next | IndexedDB (Dexie) + Background Sync |
| Scan Interface | ⏳ Next | Camera + hardware scanner integration |
| Cart/Payment | ⏳ Next | Touch-optimized, split tender |
| Hardware Integration | ⏳ Later | Receipt printer, cash drawer, customer display |
| Shift Management | ⏳ Later | Open/close register, Z-reports |

### Vendure Backend (`apps/server/`) (Priority: High)
| Component | Status | Notes |
|-----------|--------|-------|
| Project Scaffold | ⏳ Next | Run `npx @vendure/create` |
| Book Catalog Plugin | ⏳ Next | ISBN, Author, Publisher, Series, Subject entities |
| Inventory Sync Plugin | ⏳ Next | Multi-location stock, reservations |
| Loyalty Plugin | ⏳ Next | Points, tiers, store credit |
| POS Offline Sync Plugin | ⏳ Next | Conflict resolution, background sync |
| B2B Quotes Plugin | ⏳ Conditional | Only if SRS requires quotes/approvals |

### B2B Portal (`apps/b2b-portal/`) (Priority: Conditional)
| Component | Status | Notes |
|-----------|--------|-------|
| Project Setup | ⏳ Later | Only if institutional sales needed |
| Company Dashboard | ⏳ Later | Orders, credit, approvals |
| Quick Order | ⏳ Later | CSV upload, SKU paste |
| Quote Workflow | ⏳ Later | Negotiation, approval chains |

---

## 📋 Pending: Configuration & DevOps

### Environment & Secrets
- [ ] `.env.example` - Template for all environments
- [ ] `.env.local` - Local development overrides
- [ ] GitHub Actions secrets configuration
- [ ] Vercel/Netlify environment variables

### CI/CD Pipeline
- [ ] GitHub Actions workflow for:
  - [ ] Lint + TypeCheck
  - [ ] Unit Tests
  - [ ] Build all packages
  - [ ] E2E Tests (Playwright)
  - [ ] Docker Build & Push
  - [ ] Deploy to Staging
  - [ ] Deploy to Production

### Database & Search
- [ ] PostgreSQL schema initialization
- [ ] TypeORM migrations setup
- [ ] Meilisearch index configuration
- [ ] Seed data for development

### Monitoring & Observability
- [ ] Error tracking (Sentry)
- [ ] APM (Datadog/New Relic)
- [ ] Logging aggregation
- [ ] Uptime monitoring
- [ ] Performance budgets

---

## 🎯 Immediate Next Actions

> Items 1, 3 and 4 of the previous version of this list (scaffold Vendure, build the home page,
> set up Docker + introspection + gql.tada) are all **done** — this list had gone stale and was
> still describing work that finished days earlier.

1. **Book Catalog Plugin** — custom entities for `Author`, `Publisher`, `BookSeries`,
   `BookSubject`, plus ISBN. The seed puts genre/language on facets, which is a reasonable
   interim shape but not a substitute for real bibliographic fields.

3. **Wire the header search box** to `/books?q=` — the query parameter already works end to end;
   only the header input is inert.

4. **Delete the dead types in `shared-types/cart.ts`** (`ActiveOrder`, `OrderLine`,
   `OrderModification`, `Adjustment`, `ShippingLine`, `Payment`, …). They are unused now that the
   cart derives its types from the schema. Grep for remaining importers first.

5. **Deschedule / reposition Meilisearch** — the container runs on :7700 but **zero application
   code references it**. Since `DefaultSearchPlugin` indexes into Postgres, decide whether
   Meilisearch is still wanted before it silently becomes dead infrastructure.

6. **Configure CI/CD** — nothing has ever run `lint` or `test` in this repo; both are wired in
   `turbo.json` but unverified. Add a GitHub Actions workflow (lint + typecheck + build) before
   more code lands.

---

## 📊 Code Statistics (Estimated)

| Metric | Count |
|--------|-------|
| TypeScript Files | ~45 |
| React Components | ~25 |
| GraphQL Operations | ~15 |
| Shared Types | 6 domain files |
| Lines of Code | ~8,000+ |

---

## 🔗 Key References

- **Vendure Docs**: https://docs.vendure.io
- **Next.js 15 Docs**: https://nextjs.org/docs
- **gql.tada**: https://github.com/0no-co/gql.tada
- **Turborepo**: https://turbo.build/repo/docs
- **Radix UI**: https://www.radix-ui.com
- **Tailwind CSS**: https://tailwindcss.com

---

## 📝 Notes & Decisions

### Architecture Decisions
1. **Plugin-first approach** - Never fork Vendure core, extend via plugins
2. **Monorepo** - Single repo for backend + all frontends + shared code
3. **Type-safe GraphQL** - gql.tada for end-to-end type safety
4. **PWA for POS** - Offline-first with background sync
5. **12 Indian languages** - Built-in i18n support from day one

### Technical Debt to Address
- [ ] Add unit tests for shared utilities
- [ ] Add Storybook for UI components
- [ ] Implement proper error boundaries
- [ ] Add loading skeletons for all async components
- [ ] Optimize bundle size analysis

---

*Last Updated: 2026-10-06*
*Generated by: Kilo AI Assistant*