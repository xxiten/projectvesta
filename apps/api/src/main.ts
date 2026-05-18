import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { loadConfig } from './platform/config';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.enableShutdownHooks();

  await app.listen(config.API_PORT);
  app.get(Logger).log(
    `Vesta API listening on :${config.API_PORT} ` +
      `(mode=${config.VESTA_DEPLOYMENT_MODE}, jurisdiction=${config.VESTA_DEFAULT_JURISDICTION})`,
  );
}

void bootstrap();
