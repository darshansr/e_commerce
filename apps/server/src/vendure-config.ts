import path from 'path';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import {
  DefaultJobQueuePlugin,
  DefaultSchedulerPlugin,
  DefaultSearchPlugin,
  VendureConfig,
} from '@vendure/core';
import { cashOnDeliveryHandler } from './payment/cash-on-delivery-handler';

/**
 * Vendure server configuration.
 *
 * Everything is env-driven with local development defaults so the server can
 * boot against the Docker Postgres defined in
 * `infrastructure/docker/docker-compose.yml` with no extra setup.
 *
 * Ports:
 *   3000 -> Vendure (this server)   3001 -> storefront
 *   3002 -> pos-pwa (planned)       3003 -> b2b-portal (planned)
 */
export const config: VendureConfig = {
  apiOptions: {
    hostname: 'localhost',
    port: Number(process.env.PORT ?? 3000),
    adminApiPath: 'admin-api',
    shopApiPath: 'shop-api',
    cors: {
      origin: [
        'http://localhost:3001', // storefront
        'http://localhost:3002', // pos-pwa (planned)
        'http://localhost:3003', // b2b-portal (planned)
      ],
      credentials: true,
    },
  },

  authOptions: {
    tokenMethod: ['bearer', 'cookie'],
    requireVerification: false,
    cookieOptions: {
      secret: process.env.COOKIE_SECRET ?? 'dev-only-cookie-secret-change-me',
    },
    superadminCredentials: {
      identifier: process.env.SUPERADMIN_USERNAME ?? 'superadmin',
      password: process.env.SUPERADMIN_PASSWORD ?? 'superadmin',
    },
  },

  dbConnectionOptions: {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    username: process.env.DB_USERNAME ?? 'meghana',
    password: process.env.DB_PASSWORD ?? 'meghana',
    database: process.env.DB_DATABASE ?? 'meghana_pos',
    /**
     * DEV ONLY. `synchronize: true` lets TypeORM alter the schema on boot,
     * which is convenient locally but must never be used in production.
     * Generate real migrations before deploying.
     */
    synchronize: true,
    migrations: [path.join(__dirname, 'migrations/*.js')],
  },

  paymentOptions: {
    /**
     * Vendure ships NO payment handler by default, and without one you cannot
     * create a `PaymentMethod` — so `addPaymentToOrder` always fails and checkout
     * can never complete. See the handler for why the payments plugin is not used.
     */
    paymentMethodHandlers: [cashOnDeliveryHandler],
  },

  /**
   * `AssetServerPlugin` is required for `createAssets` — without it the
   * mutation exists in the schema but has no storage to write uploaded files
   * to, so product cover images cannot be set.
   */
  plugins: [
    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(__dirname, '..', 'static', 'assets'),
      assetUrlPrefix: `http://localhost:${process.env.PORT ?? 3000}/assets/`,
    }),

    /**
     * REQUIRED for queued jobs to run at all.
     *
     * Vendure otherwise falls back to `InMemoryJobQueueStrategy`, which only
     * processes jobs when `JobQueueService.start()` is called explicitly from the
     * server process — it never is, so every queued job (including the search
     * `reindex`) sits at PENDING for ever. This persists jobs in the database via
     * `SqlJobQueueStrategy`, so they also survive a restart.
     */
    DefaultJobQueuePlugin,

    /**
     * Without this Vendure logs "No scheduler strategy is configured!", and any
     * plugin relying on `@ScheduledTask` would silently never run.
     */
    DefaultSchedulerPlugin.init(),

    /**
     * REQUIRED for the storefront's catalogue filtering.
     *
     * Facet filtering and price sorting are only reachable through the `search`
     * query: `ProductFilterParameter` has no facet field and
     * `ProductSortParameter` has no `price`. Without this plugin `search` fails
     * with "No search plugin has been configured", and the `facets` query alone
     * cannot filter anything.
     *
     * `indexStockStatus` adds `inStock` to search results (needs a DB sync).
     * `bufferUpdates` is deliberately left off so product edits re-index
     * immediately instead of waiting for `runPendingSearchIndexUpdates`.
     */
    DefaultSearchPlugin.init({
      indexStockStatus: true,
    }),
  ],
};
