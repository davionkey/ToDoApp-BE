import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksController } from './controllers/tasks.controller';
import { TasksService } from './services/tasks.service';
import { TasksServiceMock } from './services/tasks.service.mock';
import { Task } from './entities/task.entity';

@Module({
  imports: [
    // Conditionally import TypeORM module
    ...(process.env.SKIP_DB_CONNECTION !== 'true'
      ? [TypeOrmModule.forFeature([Task])]
      : []),
  ],
  controllers: [TasksController],
  providers: [
    {
      provide: TasksService,
      useFactory: (taskRepository?) => {
        if (process.env.SKIP_DB_CONNECTION === 'true') {
          return new TasksServiceMock();
        }

        const service = new TasksService();
        if (taskRepository) {
          service.setRepository(taskRepository);
        }
        return service;
      },
      inject: [
        ...(process.env.SKIP_DB_CONNECTION !== 'true'
          ? [getRepositoryToken(Task)]
          : []),
      ],
    },
  ],
  exports: [TasksService],
})
export class TasksModule {}
