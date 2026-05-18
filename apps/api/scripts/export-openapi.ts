/**
 * Exports the code-first OpenAPI document to packages/api-contracts/openapi.json
 * (the contract the frontend client is generated from). Uses Nest "preview"
 * mode so no provider side effects run — no DB/Redis needed in CI.
 *
 * Run: pnpm --filter @vesta/api openapi:export
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { buildOpenApiDocument } from '../src/platform/swagger';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { preview: true, logger: false });
  const doc = buildOpenApiDocument(app);
  const out = resolve(__dirname, '../../../packages/api-contracts/openapi.json');
  writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');
  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI written to ${out}`);
}

void main();
