import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { validateEnvironment } from './common/startup-validator';
import { DataSource } from 'typeorm';

async function bootstrap() {
  validateEnvironment();

  const server = express();
  server.use('/uploads', express.static(process.cwd() + '/uploads'));

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  const logger = new Logger('Bootstrap');
  const ds = app.get(DataSource);
  if (ds.migrations.length > 0) {
    logger.log('Running pending migrations...');
    await ds.runMigrations();
    logger.log('Migrations complete');
  }

  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : '*';

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('WellMatch API')
    .setDescription('Privacy-first social wellness match platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`WellMatch API running on port ${port}`);
}

bootstrap();
