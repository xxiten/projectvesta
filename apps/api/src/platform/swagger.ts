import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

/**
 * Code-first OpenAPI (ADR-0005 refined / ADR-0012). The document is the single
 * source of truth for the generated frontend client. Dev headers used by the
 * placeholder auth (see auth-port.ts) are declared so the contract is honest.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Vesta API')
    .setDescription('Project Vesta — hotel property-management platform')
    .setVersion('0.1.0')
    .addGlobalParameters(
      { name: 'x-tenant-id', in: 'header', required: false, schema: { type: 'string' } },
      { name: 'x-user-id', in: 'header', required: false, schema: { type: 'string' } },
    )
    .build();
  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup('docs', app, buildOpenApiDocument(app), {
    jsonDocumentUrl: 'docs-json',
  });
}
