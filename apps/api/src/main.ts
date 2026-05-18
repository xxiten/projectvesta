import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { loadConfig } from './platform/config';
import { AllExceptionsFilter } from './platform/http-exception.filter';
import { setupSwagger } from './platform/swagger';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  setupSwagger(app);
  app.enableShutdownHooks();

  await app.listen(config.API_PORT);
  app
    .get(Logger)
    .log(
      `Vesta API listening on :${config.API_PORT} ` +
        `(mode=${config.VESTA_DEPLOYMENT_MODE}, jurisdiction=${config.VESTA_DEFAULT_JURISDICTION})`,
    );
}

void bootstrap();
