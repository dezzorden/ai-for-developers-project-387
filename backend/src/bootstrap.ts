import { BadRequestException, type INestApplication, ValidationPipe } from '@nestjs/common';

export function configureApp(app: INestApplication): void {
  const origins = process.env.FRONTEND_ORIGIN?.split(',').map((origin) => origin.trim()) ?? [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.enableCors({ origin: origins });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: () =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Запрос не соответствует API-контракту',
        }),
    }),
  );
}
