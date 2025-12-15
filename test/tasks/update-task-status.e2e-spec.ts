import { BaseTest } from '../setup';
import { ENDPOINTS, HTTP, NON_EXISTENT_UUID, INVALID_TASK_STATUS, ALL_TASK_STATUSES } from '../fixtures';
import { TaskStatus } from '../../src/tasks/task-status.enum';
import { buildCreateTaskData } from '../factories';
import { describeAuthGuard } from '../shared';

describe('Tasks - Update Status (e2e)', () => {
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

  describe('PATCH /tasks/:id/status', () => {
    describe('Success Cases', () => {
      it('should update task status to IN_PROGRESS', async () => {
        const response = await t.api
          .patch(ENDPOINTS.TASKS.STATUS(taskId))
          .send({ status: TaskStatus.IN_PROGRESS })
          .expect(HTTP.OK);

        expect(response.body.status).toBe(TaskStatus.IN_PROGRESS);
        expect(response.body.id).toBe(taskId);
      });

      it('should update task status to DONE', async () => {
        const response = await t.api
          .patch(ENDPOINTS.TASKS.STATUS(taskId))
          .send({ status: TaskStatus.DONE })
          .expect(HTTP.OK);

        expect(response.body.status).toBe(TaskStatus.DONE);
      });

      it('should update task status back to OPEN', async () => {
        // First move to DONE
        await t.api
          .patch(ENDPOINTS.TASKS.STATUS(taskId))
          .send({ status: TaskStatus.DONE })
          .expect(HTTP.OK);

        // Then back to OPEN
        const response = await t.api
          .patch(ENDPOINTS.TASKS.STATUS(taskId))
          .send({ status: TaskStatus.OPEN })
          .expect(HTTP.OK);

        expect(response.body.status).toBe(TaskStatus.OPEN);
      });

      it.each(ALL_TASK_STATUSES)(
        'should successfully set status to %s',
        async (status) => {
          const response = await t.api
            .patch(ENDPOINTS.TASKS.STATUS(taskId))
            .send({ status })
            .expect(HTTP.OK);

          expect(response.body.status).toBe(status);
        },
      );

      it('should persist status change', async () => {
        await t.api
          .patch(ENDPOINTS.TASKS.STATUS(taskId))
          .send({ status: TaskStatus.DONE })
          .expect(HTTP.OK);

        // Verify by fetching the task
        const response = await t.api
          .get(ENDPOINTS.TASKS.BY_ID(taskId))
          .expect(HTTP.OK);

        expect(response.body.status).toBe(TaskStatus.DONE);
      });
    });

    describe('Validation Errors', () => {
      it('should fail with invalid status', async () => {
        await t.api
          .patch(ENDPOINTS.TASKS.STATUS(taskId))
          .send({ status: INVALID_TASK_STATUS })
          .expect(HTTP.BAD_REQUEST);
      });

      it('should fail with empty status', async () => {
        await t.api
          .patch(ENDPOINTS.TASKS.STATUS(taskId))
          .send({ status: '' })
          .expect(HTTP.BAD_REQUEST);
      });

      it('should fail with missing status', async () => {
        await t.api
          .patch(ENDPOINTS.TASKS.STATUS(taskId))
          .send({})
          .expect(HTTP.BAD_REQUEST);
      });
    });

    describe('Not Found Errors', () => {
      it('should fail with non-existent task', async () => {
        await t.api
          .patch(ENDPOINTS.TASKS.STATUS(NON_EXISTENT_UUID))
          .send({ status: TaskStatus.DONE })
          .expect(HTTP.NOT_FOUND);
      });

      it('should not update task belonging to another user', async () => {
        await t.asAuthenticatedUser();

        await t.api
          .patch(ENDPOINTS.TASKS.STATUS(taskId))
          .send({ status: TaskStatus.DONE })
          .expect(HTTP.NOT_FOUND);
      });
    });

    // Reusable auth guard tests - pass function for dynamic taskId
    describeAuthGuard(() => t.api, 'PATCH', () => ENDPOINTS.TASKS.STATUS(taskId), {
      body: { status: TaskStatus.DONE },
    });
  });
});
