import { z } from 'zod';

/**
 * Environment is validated once at boot. Invalid/missing config fails fast
 * (no half-configured process). Portable across SaaS and self-host:
 * everything comes from env, no cloud-specific SDKs at this layer.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VESTA_DEPLOYMENT_MODE: z.enum(['saas', 'self-host']).default('self-host'),
  VESTA_DEFAULT_JURISDICTION: z.string().default('IT-BZ'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  AUTH_JWT_SECRET: z.string().min(32),
  AUTH_JWT_TTL: z.coerce.number().int().positive().default(3600),
});

export type AppConfig = z.infer<typeof schema>;

export const APP_CONFIG = Symbol('APP_CONFIG');

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
