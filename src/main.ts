import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { json, urlencoded } from 'express'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const port = configService.get<number>('PORT') || 3000
  
  app.setGlobalPrefix('api')
  app.enableShutdownHooks()

  app.use(json({ limit: '10mb' }))
  app.use(urlencoded({ limit: '10mb', extended: true }))

  app.enableCors({
    origin: true,
    credentials: true,
  })

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  )

  app.use(compression())
  app.use(cookieParser())
  app.use(morgan('dev'))

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle('StoreFlow POS API')
    .setDescription('StoreFlow POS Backend API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT',
    )
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(port)

  console.log('')
  console.log(`🚀 Server running on http://localhost:${port}/api`)
  console.log(`📚 Swagger docs on http://localhost:${port}/api/docs`)
  console.log('')
}

bootstrap()