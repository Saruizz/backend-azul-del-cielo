import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://azuldelcielo.saruizp.com',
      'http://localhost:4200',
      'http://localhost:3000'
    ],
    credentials: true,
  }); // Habilitar peticiones desde el frontend oficial y desarrollo
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
