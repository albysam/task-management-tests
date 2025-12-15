import { BaseTest } from '../setup';
import { ENDPOINTS, HTTP, NON_EXISTENT_UUID } from '../fixtures';
import { TaskStatus } from '../../src/tasks/task-status.enum';
import { buildCreateTaskData } from '../factories';
import { describeAuthGuard } from '../shared';

describe('Tasks - Get Single (e2e)', () => {
  const t = new BaseTest();
  let taskId: string;

  beforeAll(() => t.setup());
  afterAll(() => t.teardown());

  beforeEach(async () => {
    await t.reset();
    await t.asAuthenticatedUser();

    // Create a task for testing
    const response = await t.api
      .post(ENDPOINTS.TASKS.BASE)
      .send(buildCreateTaskData())
      .expect(HTTP.CREATED);
    taskId = response.body.id;
  });

  describe('GET /tasks/:id', () => {
    describe('Success Cases', () => {
      it('should return task by id', async () => {
        const response = await t.api
          .get(ENDPOINTS.TASKS.BY_ID(taskId))
          .expect(HTTP.OK);

        expect(response.body.id).toBe(taskId);
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('description');
        expect(response.body).toHaveProperty('status');
      });

      it('should return task with correct status', async () => {
        const response = await t.api
          .get(ENDPOINTS.TASKS.BY_ID(taskId))
          .expect(HTTP.OK);

        expect(response.body.status).toBe(TaskStatus.OPEN);
      });
    });

    describe('Not Found Errors', () => {
      it('should return 404 for non-existent task', async () => {
        await t.api
          .get(ENDPOINTS.TASKS.BY_ID(NON_EXISTENT_UUID))
          .expect(HTTP.NOT_FOUND);
      });

      it('should not return task belonging to another user', async () => {
        // Switch to another user
        await t.asAuthenticatedUser();

        // Try to access first user's task
        await t.api
          .get(ENDPOINTS.TASKS.BY_ID(taskId))
          .expect(HTTP.NOT_FOUND);
      });
    });

    // Reusable auth guard tests - pass function for dynamic taskId
    describeAuthGuard(() => t.api, 'GET', () => ENDPOINTS.TASKS.BY_ID(taskId));
  });
});
