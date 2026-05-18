import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@vesta/api-contracts';

@Controller('health')
export class HealthController {
  @Get()
  health(): HealthStatus {
    return { status: 'ok', version: process.env.npm_package_version ?? '0.0.0' };
  }
}
