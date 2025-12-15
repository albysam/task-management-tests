import { TaskStatus } from '../../src/tasks/task-status.enum';

/**
 * Factory for generating task test data.
 */

export interface CreateTaskData {
  title: string;
  description: string;
}

export interface TaskData extends CreateTaskData {
  status: TaskStatus;
}

let taskSequence = 0;

/**
 * Resets the task sequence counter.
 * Call this in beforeEach() if you need predictable task titles.
 */
export function resetTaskSequence(): void {
  taskSequence = 0;
}

/**
 * Builds valid task creation data.
 */
export function buildCreateTaskData(
  overrides: Partial<CreateTaskData> = {},
): CreateTaskData {
  taskSequence++;
  return {
    title: `Task ${taskSequence}`,
    description: `Description for task ${taskSequence}`,
    ...overrides,
  };
}

/**
 * Builds task data with a specific status.
 */
export function buildTaskData(
  status: TaskStatus = TaskStatus.OPEN,
  overrides: Partial<CreateTaskData> = {},
): TaskData {
  return {
    ...buildCreateTaskData(overrides),
    status,
  };
}

/**
 * Builds task data with empty title (for validation tests).
 */
export function buildEmptyTitleTaskData(): CreateTaskData {
  return buildCreateTaskData({ title: '' });
}

/**
 * Builds task data with empty description (for validation tests).
 */
export function buildEmptyDescriptionTaskData(): CreateTaskData {
  return buildCreateTaskData({ description: '' });
}

/**
 * Builds task data with only title (missing description).
 */
export function buildMissingDescriptionTaskData(): Partial<CreateTaskData> {
  taskSequence++;
  return { title: `Task ${taskSequence}` };
}

/**
 * Builds a batch of task creation data for bulk testing.
 */
export function buildCreateTaskDataBatch(count: number): CreateTaskData[] {
  return Array.from({ length: count }, () => buildCreateTaskData());
}

/**
 * Builds task data for each status type.
 */
export function buildTasksForAllStatuses(): TaskData[] {
  return [
    buildTaskData(TaskStatus.OPEN),
    buildTaskData(TaskStatus.IN_PROGRESS),
    buildTaskData(TaskStatus.DONE),
  ];
}

