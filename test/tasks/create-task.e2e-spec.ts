import { BaseTest } from '../setup';
import { ENDPOINTS, HTTP } from '../fixtures';
import { TaskStatus } from '../../src/tasks/task-status.enum';
import {
  buildCreateTaskData,
  buildEmptyTitleTaskData,
  buildEmptyDescriptionTaskData,
  buildMissingDescriptionTaskData,
} from '../factories';
import { describeAuthGuard } from '../shared';
import { expectValidUuid } from '../helpers';

describe('Tasks - Create (e2e)', () => {
  const t = new BaseTest();

  beforeAll(() => t.setup());
  afterAll(() => t.teardown());

  beforeEach(async () => {
    await t.reset();
    await t.asAuthenticatedUser();
  });

  describe('POST /tasks', () => {
    describe('Success Cases', () => {
      it('should create a task with valid data', async () => {
        const taskData = buildCreateTaskData();

        const response = await t.api
          .post(ENDPOINTS.TASKS.BASE)
          .send(taskData)
          .expect(HTTP.CREATED);

        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe(taskData.title);
        expect(response.body.description).toBe(taskData.description);
        expect(response.body.status).toBe(TaskStatus.OPEN);
      });

      it('should create task with OPEN status by default', async () => {
        const taskData = buildCreateTaskData();

        const response = await t.api
          .post(ENDPOINTS.TASKS.BASE)
          .send(taskData)
          .expect(HTTP.CREATED);

        expect(response.body.status).toBe(TaskStatus.OPEN);
      });

      it('should create multiple tasks for same user', async () => {
        const task1 = buildCreateTaskData();
        const task2 = buildCreateTaskData();
        const task3 = buildCreateTaskData();

        await t.api.post(ENDPOINTS.TASKS.BASE).send(task1).expect(HTTP.CREATED);
        await t.api.post(ENDPOINTS.TASKS.BASE).send(task2).expect(HTTP.CREATED);
        await t.api.post(ENDPOINTS.TASKS.BASE).send(task3).expect(HTTP.CREATED);

        // Verify all tasks exist
        const response = await t.api.get(ENDPOINTS.TASKS.BASE).expect(HTTP.OK);
        expect(response.body).toHaveLength(3);
      });

      it('should return task with UUID id', async () => {
        const taskData = buildCreateTaskData();

        const response = await t.api
          .post(ENDPOINTS.TASKS.BASE)
          .send(taskData)
          .expect(HTTP.CREATED);

        expectValidUuid(response.body.id);
      });
    });

    describe('Validation Errors', () => {
      it('should fail with empty title', async () => {
        const taskData = buildEmptyTitleTaskData();

        await t.api.post(ENDPOINTS.TASKS.BASE).send(taskData).expect(HTTP.BAD_REQUEST);
      });

      it('should fail with empty description', async () => {
        const taskData = buildEmptyDescriptionTaskData();

        await t.api.post(ENDPOINTS.TASKS.BASE).send(taskData).expect(HTTP.BAD_REQUEST);
      });

      it('should fail with missing description', async () => {
        const taskData = buildMissingDescriptionTaskData();

        await t.api.post(ENDPOINTS.TASKS.BASE).send(taskData).expect(HTTP.BAD_REQUEST);
      });

      it('should fail with missing title', async () => {
        await t.api
          .post(ENDPOINTS.TASKS.BASE)
          .send({ description: 'Some description' })
          .expect(HTTP.BAD_REQUEST);
      });

      it('should fail with empty body', async () => {
        await t.api.post(ENDPOINTS.TASKS.BASE).send({}).expect(HTTP.BAD_REQUEST);
      });
    });

    // Reusable auth guard tests - generates 4 test cases automatically
    describeAuthGuard(() => t.api, 'POST', ENDPOINTS.TASKS.BASE, {
      body: { title: 'Test', description: 'Test' },
    });
  });
});
