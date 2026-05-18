#!/usr/bin/env node
/**
 * One-shot local bootstrap: infra up → migrate → seed.
 * Usage: pnpm bootstrap
 */
import { spawnSync } from 'node:child_process';

const steps = [
  ['docker', ['compose', '-f', 'infra/docker-compose.yml', 'up', '-d']],
  ['pnpm', ['--filter', '@vesta/api', 'prisma:deploy']],
  ['pnpm', ['--filter', '@vesta/api', 'db:seed']],
];

for (const [cmd, args] of steps) {
  console.log(`\n▶ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) {
    console.error(`✗ step failed: ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}
console.log('\n✓ Bootstrap done — pnpm dev, then http://localhost:3000 (Demo-Login)');
