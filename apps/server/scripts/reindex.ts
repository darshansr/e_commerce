/**
 * Rebuilds the Vendure search index.
 *
 * `DefaultSearchPlugin` (see `src/vendure-config.ts`) backs the `search` query,
 * but it only returns products that are present in its index. Incremental
 * indexing keeps the index in step with ordinary product edits; however a fresh
 * database — or a plugin that has just been enabled — starts with an empty
 * index, and then every search returns `totalItems: 0`.
 *
 * Run this after seeding, and after enabling or changing search configuration.
 *
 * Usage:
 *   1. Start Postgres:  pnpm docker:up
 *   2. Start Vendure:   pnpm --filter @meghana/server dev
 *   3. Reindex:         pnpm --filter @meghana/server search:reindex
 */
import 'dotenv/config';
import { ADMIN_API_URL, admin, login } from './lib/admin-client';

const SHOP_API_URL = process.env.VENDURE_SHOP_API_URL ?? 'http://localhost:3000/shop-api';

/** How long to wait for the reindex job to settle before giving up. */
const JOB_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 1_000;

async function triggerReindex(): Promise<string> {
  const data = await admin<{ reindex: { id: string; state: string } }>(
    `
      mutation TriggerReindex {
        reindex {
          id
          state
        }
      }
    `,
  );
  return data.reindex.id;
}

async function waitForSettledJob(jobId: string): Promise<string> {
  const deadline = Date.now() + JOB_TIMEOUT_MS;
  let lastState = 'UNKNOWN';

  while (Date.now() < deadline) {
    const data = await admin<{ job: { id: string; state: string; isSettled: boolean } | null }>(
      `
        query ReindexJobState($jobId: ID!) {
          job(jobId: $jobId) {
            id
            state
            isSettled
          }
        }
      `,
      { jobId },
    );

    if (!data.job) {
      throw new Error(`Reindex job ${jobId} disappeared before it settled`);
    }

    lastState = data.job.state;
    if (data.job.isSettled) {
      return lastState;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(
    `Reindex job ${jobId} did not settle within ${JOB_TIMEOUT_MS}ms (last state: ${lastState})`,
  );
}

/** Confirms the index is actually serving results, rather than trusting the job state. */
async function countSearchableProducts(): Promise<number> {
  const response = await fetch(SHOP_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: '{ search(input: { groupByProduct: true, take: 1 }) { totalItems } }',
    }),
  });

  const body = (await response.json()) as {
    data?: { search: { totalItems: number } };
    errors?: Array<{ message: string }>;
  };

  if (body.errors?.length) {
    throw new Error(`Shop API error: ${body.errors.map((e) => e.message).join('; ')}`);
  }
  if (!body.data) {
    throw new Error('Shop API returned no data');
  }
  return body.data.search.totalItems;
}

async function main(): Promise<void> {
  console.log(`Reindexing catalogue via ${ADMIN_API_URL}`);
  await login();

  const jobId = await triggerReindex();
  console.log(`✓ reindex job queued (id ${jobId})`);

  const state = await waitForSettledJob(jobId);
  console.log(`✓ reindex job settled (state ${state})`);

  const total = await countSearchableProducts();
  console.log(`✓ ${total} product(s) are now searchable`);
}

main().catch((error: unknown) => {
  console.error('Reindex failed:');
  console.error(error);
  process.exit(1);
});
