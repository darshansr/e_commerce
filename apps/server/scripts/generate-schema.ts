/**
 * Introspects the running Vendure server and writes SDL schema files.
 *
 * Output (consumed by packages/shared/graphql-operations/tsconfig.json):
 *   apps/server/src/schema-shop.graphql
 *   apps/server/src/schema-admin.graphql
 *
 * Usage:
 *   1. Start Postgres:  pnpm docker:up
 *   2. Start Vendure:   pnpm --filter @meghana/server dev
 *   3. Generate:        pnpm --filter @meghana/server graphql:schema
 */
import 'dotenv/config';
import { writeFileSync } from 'fs';
import path from 'path';
import { buildClientSchema, getIntrospectionQuery, printSchema } from 'graphql';

const HOST = process.env.API_HOST ?? 'http://localhost:3000';

interface Target {
  name: string;
  route: string;
  outFile: string;
}

const targets: Target[] = [
  {
    name: 'shop',
    route: '/shop-api',
    outFile: path.join(__dirname, '..', 'src', 'schema-shop.graphql'),
  },
  {
    name: 'admin',
    route: '/admin-api',
    outFile: path.join(__dirname, '..', 'src', 'schema-admin.graphql'),
  },
];

async function introspect(target: Target): Promise<void> {
  const url = `${HOST}${target.route}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: getIntrospectionQuery({ descriptions: true }) }),
  });

  if (!res.ok) {
    throw new Error(`${target.name}: ${url} responded HTTP ${res.status}`);
  }

  const json = (await res.json()) as {
    data?: unknown;
    errors?: unknown;
  };

  if (json.errors) {
    throw new Error(`${target.name}: introspection failed: ${JSON.stringify(json.errors)}`);
  }
  if (!json.data) {
    throw new Error(`${target.name}: introspection returned no data`);
  }

  const schema = buildClientSchema(json.data as Parameters<typeof buildClientSchema>[0]);
  const sdl = printSchema(schema);
  writeFileSync(target.outFile, sdl, 'utf-8');
  console.log(`✓ ${target.name.padEnd(5)} -> ${path.relative(process.cwd(), target.outFile)}`);
}

async function main(): Promise<void> {
  const only = process.argv[2];
  const selected = only ? targets.filter((t) => t.name === only) : targets;
  if (selected.length === 0) {
    throw new Error(`Unknown target "${only}". Expected one of: ${targets.map((t) => t.name).join(', ')}`);
  }

  console.log(`Introspecting ${HOST} ...`);
  for (const target of selected) {
    await introspect(target);
  }
  console.log('Done. Schemas written.');
}

main().catch((err: unknown) => {
  console.error('Schema generation failed:');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
