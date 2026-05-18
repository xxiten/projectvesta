import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';

/**
 * Outbox relay skeleton (Epic E0). The transactional outbox is written by the
 * API inside the same DB transaction as the domain change; this worker drains
 * integration-relevant events and dispatches them to connectors (see
 * docs/adr/0004). Connector dispatch + DB polling land in Epic E7.
 */
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const QUEUE = 'integration-outbox';

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

async function processOutboxJob(job: Job): Promise<void> {
  // Placeholder: real relay maps the canonical event to a connector OutboundPort
  // with idempotency + retry/backoff + dead-letter.
  console.warn(`[outbox] received job ${job.id} (${job.name}) — relay not yet implemented`);
}

const worker = new Worker(QUEUE, processOutboxJob, { connection });

worker.on('ready', () => console.warn(`[worker] listening on queue "${QUEUE}"`));
worker.on('failed', (job, err) =>
  console.error(`[worker] job ${job?.id} failed: ${err.message}`),
);

async function shutdown(signal: string): Promise<void> {
  console.warn(`[worker] ${signal} received, draining…`);
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
