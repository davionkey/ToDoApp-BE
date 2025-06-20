import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CategoryQueryDto {
  @ApiPropertyOptional({
    description: 'Search in category name',
    example: 'work',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: '1',
    default: '1',
  })
  @IsNumberString()
  @IsOptional()
  @Transform(({ value }) => value || '1')
  page?: string = '1';

  @ApiPropertyOptional({
    description: 'Number of items per page (1-100)',
    example: '10',
    default: '10',
  })
  @IsNumberString()
  @IsOptional()
  @Transform(({ value }) => value || '10')
  limit?: string = '10';

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['name', 'createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsString()
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: string = 'DESC';
}
