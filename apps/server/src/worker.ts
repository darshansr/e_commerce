import 'dotenv/config';
import 'reflect-metadata';
import { bootstrapWorker } from '@vendure/core';
import { config } from './vendure-config';

/**
 * Vendure **worker** process.
 *
 * In Vendure 3.x `bootstrap()` sets the process context to `'server'` and does
 * not start a worker, so the API process never processes background jobs. Any
 * queued job — notably the search `reindex` — therefore sits at `PENDING` for
 * ever, and the search index silently goes stale as products change.
 *
 * `startJobQueue()` is what actually begins consuming jobs.
 *
 * In development this runs alongside the API process automatically: see the
 * `with` key on the `dev` task in the root `turbo.json`.
 */
bootstrapWorker(config)
  .then((worker) => worker.startJobQueue())
  .then(() => {
    console.log('Vendure worker started — processing background jobs');
  })
  .catch((err: unknown) => {
    console.error('Failed to start Vendure worker:');
    console.error(err);
    process.exit(1);
  });
