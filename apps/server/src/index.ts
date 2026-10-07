import 'dotenv/config';
import 'reflect-metadata';
import { bootstrap } from '@vendure/core';
import { config } from './vendure-config';

bootstrap(config)
  .then(() => {
    const port = config.apiOptions.port;
    console.log(`Vendure server listening on http://localhost:${port}`);
    console.log(`  Shop API:  http://localhost:${port}/shop-api`);
    console.log(`  Admin API: http://localhost:${port}/admin-api`);
  })
  .catch((err: unknown) => {
    console.error('Failed to start Vendure server:');
    console.error(err);
    process.exit(1);
  });
