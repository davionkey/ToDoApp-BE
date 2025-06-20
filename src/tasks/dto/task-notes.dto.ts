import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddTaskNoteDto {
  @ApiProperty({
    description: 'Note content',
    example: 'Updated the requirements based on client feedback',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}

export class TaskNote {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
