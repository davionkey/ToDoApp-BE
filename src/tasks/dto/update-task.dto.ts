import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { TaskStatus } from '../entities/task.entity';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Whether the task is completed',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
}
