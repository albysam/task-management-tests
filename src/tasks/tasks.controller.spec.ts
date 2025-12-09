import { Test } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

const mockTasksService = () => ({
  getTasks: jest.fn(),
  getTaskById: jest.fn(),
  createTask: jest.fn(),
  deleteTask: jest.fn(),
  updateTaskStatus: jest.fn(),
});

const mockUser = {
  username: 'testuser',
  id: 'user-id',
  password: 'hashedPassword',
  tasks: [],
};

describe('TasksController', () => {
  let tasksController: TasksController;
  let tasksService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useFactory: mockTasksService,
        },
      ],
    }).compile();

    tasksController = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);
  });

  describe('getTasks', () => {
    it('calls TasksService.getTasks and returns the result', async () => {
      const mockTasks: any[] = [
        {
          id: '1',
          title: 'Test Task 1',
          description: 'Description 1',
          status: TaskStatus.OPEN,
        },
        {
          id: '2',
          title: 'Test Task 2',
          description: 'Description 2',
          status: TaskStatus.IN_PROGRESS,
        },
      ];

      const filterDto: GetTasksFilterDto = { status: TaskStatus.OPEN };
      tasksService.getTasks.mockResolvedValue(mockTasks);

      const result = await tasksController.getTasks(filterDto, mockUser);

      expect(tasksService.getTasks).toHaveBeenCalledWith(filterDto, mockUser);
      expect(result).toEqual(mockTasks);
    });
  });

  describe('getTaskById', () => {
    it('calls TasksService.getTaskById and returns the result', async () => {
      const mockTask = {
        id: 'task-id',
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.OPEN,
      };

      tasksService.getTaskById.mockResolvedValue(mockTask);

      const result = await tasksController.getTaskById('task-id', mockUser);

      expect(tasksService.getTaskById).toHaveBeenCalledWith(
        'task-id',
        mockUser,
      );
      expect(result).toEqual(mockTask);
    });
  });

  describe('createTask', () => {
    it('calls TasksService.createTask and returns the result', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'New Description',
      };

      const mockTask = {
        id: 'new-task-id',
        ...createTaskDto,
        status: TaskStatus.OPEN,
      };

      tasksService.createTask.mockResolvedValue(mockTask);

      const result = await tasksController.createTask(createTaskDto, mockUser);

      expect(tasksService.createTask).toHaveBeenCalledWith(
        createTaskDto,
        mockUser,
      );
      expect(result).toEqual(mockTask);
    });
  });

  describe('deleteTask', () => {
    it('calls TasksService.deleteTask', async () => {
      tasksService.deleteTask.mockResolvedValue(undefined);

      await tasksController.deleteTask('task-id', mockUser);

      expect(tasksService.deleteTask).toHaveBeenCalledWith('task-id', mockUser);
    });
  });

  describe('updateTaskStatus', () => {
    it('calls TasksService.updateTaskStatus and returns the result', async () => {
      const updateTaskStatusDto: UpdateTaskStatusDto = {
        status: TaskStatus.DONE,
      };

      const mockTask = {
        id: 'task-id',
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.DONE,
      };

      tasksService.updateTaskStatus.mockResolvedValue(mockTask);

      const result = await tasksController.updateTaskStatus(
        'task-id',
        updateTaskStatusDto,
        mockUser,
      );

      expect(tasksService.updateTaskStatus).toHaveBeenCalledWith(
        'task-id',
        TaskStatus.DONE,
        mockUser,
      );
      expect(result).toEqual(mockTask);
    });
  });
});
