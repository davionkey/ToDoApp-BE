import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './services/categories.service';
import { CategoriesServiceMock } from './services/categories.service.mock';
import { CategoriesController } from './controllers/categories.controller';
import { Category } from './entities/category.entity';

const skipDbConnection = process.env.SKIP_DB_CONNECTION === 'true';

@Module({
  imports: skipDbConnection ? [] : [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [
    {
      provide: CategoriesService,
      useClass: skipDbConnection ? CategoriesServiceMock : CategoriesService,
    },
  ],
  exports: [CategoriesService],
})
export class CategoriesModule {}
