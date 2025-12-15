import { TestContext } from '../setup/test-app';
import { User } from '../../src/auth/user.entity';
import { Task } from '../../src/tasks/task.entity';
import { TaskStatus } from '../../src/tasks/task-status.enum';
import * as bcrypt from 'bcrypt';

/**
 * Database helper for direct database operations in tests.
 * Use these when you need to set up data without going through the API.
 */

/**
 * Creates a user directly in the database.
 * Useful for setting up test data without API calls.
 */
export async function createUserDirectly(
  ctx: TestContext,
  data: { username: string; password: string },
): Promise<User> {
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const user = ctx.userRepository.create({
    username: data.username,
    password: hashedPassword,
  });

  return ctx.userRepository.save(user);
}

/**
 * Creates a task directly in the database.
 * Useful for setting up test data without API calls.
 */
export async function createTaskDirectly(
  ctx: TestContext,
  data: {
    title: string;
    description: string;
    status?: TaskStatus;
    user: User;
  },
): Promise<Task> {
  const task = ctx.taskRepository.create({
    title: data.title,
    description: data.description,
    status: data.status || TaskStatus.OPEN,
    user: data.user,
  });

  return ctx.taskRepository.save(task);
}

/**
 * Creates multiple tasks directly in the database.
 */
export async function createTasksDirectly(
  ctx: TestContext,
  user: User,
  count: number,
  prefix: string = 'Task',
): Promise<Task[]> {
  const tasks: Task[] = [];

  for (let i = 1; i <= count; i++) {
    const task = await createTaskDirectly(ctx, {
      title: `${prefix} ${i}`,
      description: `Description for ${prefix} ${i}`,
      user,
    });
    tasks.push(task);
  }

  return tasks;
}

/**
 * Finds a user by username.
 */
export async function findUserByUsername(
  ctx: TestContext,
  username: string,
): Promise<User | null> {
  return ctx.userRepository.findOne({ username });
}

/**
 * Counts all users in the database.
 */
export async function countUsers(ctx: TestContext): Promise<number> {
  return ctx.userRepository.count();
}

/**
 * Counts all tasks for a specific user.
 */
export async function countUserTasks(
  ctx: TestContext,
  user: User,
): Promise<number> {
  return ctx.taskRepository.count({ where: { user: { id: user.id } } });
}

