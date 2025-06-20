import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Work',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Work-related tasks and projects',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category color (hex code)',
    example: '#6366F1',
    pattern: '^#[A-Fa-f0-9]{6}$',
  })
  @IsString()
  @IsOptional()
  @Matches(/^#[A-Fa-f0-9]{6}$/, {
    message: 'Color must be a valid hex color code (e.g., #6366F1)',
  })
  color?: string;
}
