import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersRepository } from '../../src/auth/users.repository';
import { TasksRepository } from '../../src/tasks/tasks.repository';

export interface TestContext {
  app: INestApplication;
  userRepository: UsersRepository;
  taskRepository: TasksRepository;
  moduleFixture: TestingModule;
}

/**
 * Creates and initializes a NestJS test application.
 * Use this in beforeAll() hooks to bootstrap the app for e2e tests.
 */
export async function createTestApp(): Promise<TestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  // Apply the same pipes/guards as production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  const userRepository = moduleFixture.get<UsersRepository>(
    getRepositoryToken(UsersRepository),
  );
  const taskRepository = moduleFixture.get<TasksRepository>(
    getRepositoryToken(TasksRepository),
  );

  return {
    app,
    userRepository,
    taskRepository,
    moduleFixture,
  };
}

/**
 * Closes the test application and cleans up resources.
 * Use this in afterAll() hooks.
 */
export async function closeTestApp(ctx: TestContext): Promise<void> {
  if (ctx.app) {
    await ctx.app.close();
  }
}

/**
 * Cleans all test data from the database.
 * Use this between tests to ensure isolation.
 */
export async function cleanDatabase(ctx: TestContext): Promise<void> {
  // Order matters due to foreign key constraints
  if (ctx.taskRepository) {
    await ctx.taskRepository.delete({});
  }
  if (ctx.userRepository) {
    await ctx.userRepository.delete({});
  }
}

