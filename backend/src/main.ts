import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { validateEnv } from './config/env-validation';

async function bootstrap() {
  // Validate environment before creating the app.
  // In production: throws a fatal error if secrets are missing or weak.
  const env = validateEnv();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors({
    origin: env.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    credentials: true,
  });

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(env.port);

  console.log(`ToplineShop backend is running on: http://localhost:${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
  console.log(`CORS allowed origins: ${env.corsOrigins.join(', ')}`);
  console.log(`Cookie Secure flag: ${env.cookieSecure}`);
}
bootstrap();
