import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ...(process.env.SKIP_DB_CONNECTION !== 'true'
      ? [
          TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '5432'),
            username: process.env.DATABASE_USERNAME || 'todoapp',
            password: process.env.DATABASE_PASSWORD || 'todoapp123',
            database: process.env.DATABASE_NAME || 'todoapp_db',
            autoLoadEntities: true,
            synchronize: process.env.NODE_ENV === 'development',
            retryAttempts: 3,
            retryDelay: 3000,
          }),
        ]
      : []),
    CoreModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
