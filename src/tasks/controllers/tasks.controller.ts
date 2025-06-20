import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from '../services/tasks.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskQueryDto } from '../dto/task-query.dto';
import {
  TaskResponse,
  TaskListResponse,
  TaskStatsResponse,
} from '../types/task.types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserResponse } from '../../auth/types/auth.types';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Test endpoint for tasks module' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tasks module test successful',
  })
  @Public()
  @Get('test')
  async test(): Promise<{
    message: string;
    timestamp: string;
    status: string;
  }> {
    return {
      message: 'Tasks module is working',
      timestamp: new Date().toISOString(),
      status: 'Phase 3: Task management implemented successfully',
    };
  }

  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Task successfully created',
    type: 'TaskResponse',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @Post()
  async createTask(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: UserResponse,
  ): Promise<TaskResponse> {
    return this.tasksService.createTask(createTaskDto, user.id);
  }

  @ApiOperation({ summary: 'Get all tasks for the current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tasks retrieved successfully',
    type: 'TaskListResponse',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    description: 'Filter by priority',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title and description',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @Get()
  async getTasks(
    @Query() queryDto: TaskQueryDto,
    @CurrentUser() user: UserResponse,
  ): Promise<TaskListResponse> {
    return this.tasksService.findUserTasks(user.id, queryDto);
  }

  @ApiOperation({ summary: 'Get task statistics for the current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task statistics retrieved successfully',
    type: 'TaskStatsResponse',
  })
  @Get('stats')
  async getTaskStats(
    @CurrentUser() user: UserResponse,
  ): Promise<TaskStatsResponse> {
    return this.tasksService.getTaskStats(user.id);
  }

  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task retrieved successfully',
    type: 'TaskResponse',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Task ID',
    type: 'string',
    format: 'uuid',
  })
  @Get(':id')
  async getTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserResponse,
  ): Promise<TaskResponse> {
    return this.tasksService.findTaskById(id, user.id);
  }

  @ApiOperation({ summary: 'Update a specific task' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task updated successfully',
    type: 'TaskResponse',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiParam({
    name: 'id',
    description: 'Task ID',
    type: 'string',
    format: 'uuid',
  })
  @Put(':id')
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: UserResponse,
  ): Promise<TaskResponse> {
    return this.tasksService.updateTask(id, updateTaskDto, user.id);
  }

  @ApiOperation({ summary: 'Delete a specific task' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Task deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Task ID',
    type: 'string',
    format: 'uuid',
  })
  @Delete(':id')
  async deleteTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserResponse,
  ): Promise<void> {
    return this.tasksService.deleteTask(id, user.id);
  }
}
