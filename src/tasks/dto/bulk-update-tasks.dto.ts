import {
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '../entities/task.entity';

export class BulkTaskIdsDto {
  @ApiProperty({
    description: 'Array of task IDs to update',
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  taskIds: string[];
}

export class BulkUpdateTasksDto extends BulkTaskIdsDto {
  @ApiPropertyOptional({
    description: 'New status for all tasks',
    enum: TaskStatus,
    example: TaskStatus.COMPLETED,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'New priority for all tasks',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'New category ID for all tasks',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}

export class BulkDeleteTasksDto extends BulkTaskIdsDto {}
