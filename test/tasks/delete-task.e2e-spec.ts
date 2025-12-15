import { BaseTest } from '../setup';
import { ENDPOINTS, HTTP } from '../fixtures';
import { buildCreateTaskData } from '../factories';
import { describeAuthGuard } from '../shared';

/**
 * DELETE /tasks/:id - Delete a task
 * 
 * This test file demonstrates the simplified pattern using:
 * - BaseTest class for setup/teardown
 * - Shared scenarios for common test patterns
 */
describe('Tasks - Delete (e2e)', () => {
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

  describe('DELETE /tasks/:id', () => {
    describe('Success Cases', () => {
      it('should delete task successfully', async () => {
        await t.api
          .delete(ENDPOINTS.TASKS.BY_ID(taskId))
          .expect(HTTP.OK);

        // Verify task is deleted
        await t.api
          .get(ENDPOINTS.TASKS.BY_ID(taskId))
          .expect(HTTP.NOT_FOUND);
      });

      it('should only delete specified task', async () => {
        // Create another task
        const anotherTask = await t.api
          .post(ENDPOINTS.TASKS.BASE)
          .send(buildCreateTaskData())
          .expect(HTTP.CREATED);

        // Delete first task
        await t.api
          .delete(ENDPOINTS.TASKS.BY_ID(taskId))
          .expect(HTTP.OK);

        // Verify other task still exists
        await t.api
          .get(ENDPOINTS.TASKS.BY_ID(anotherTask.body.id))
          .expect(HTTP.OK);
      });

      it('should reduce task count after deletion', async () => {
        // Get initial count
        const beforeResponse = await t.api.get(ENDPOINTS.TASKS.BASE).expect(HTTP.OK);
        const initialCount = beforeResponse.body.length;

        // Delete task
        await t.api.delete(ENDPOINTS.TASKS.BY_ID(taskId)).expect(HTTP.OK);

        // Get count after deletion
        const afterResponse = await t.api.get(ENDPOINTS.TASKS.BASE).expect(HTTP.OK);
        expect(afterResponse.body.length).toBe(initialCount - 1);
      });
    });

    describe('Not Found Errors', () => {
      it('should fail with non-existent task', async () => {
        await t.api
          .delete(ENDPOINTS.TASKS.BY_ID('00000000-0000-0000-0000-000000000000'))
          .expect(HTTP.NOT_FOUND);
      });

      it('should fail when trying to delete twice', async () => {
        // Delete first time
        await t.api.delete(ENDPOINTS.TASKS.BY_ID(taskId)).expect(HTTP.OK);

        // Try to delete again
        await t.api
          .delete(ENDPOINTS.TASKS.BY_ID(taskId))
          .expect(HTTP.NOT_FOUND);
      });

      it('should not delete task belonging to another user', async () => {
        // Create another user and try to delete first user's task
        const originalToken = t.authUser?.accessToken;
        await t.asAuthenticatedUser();

        await t.api
          .delete(ENDPOINTS.TASKS.BY_ID(taskId))
          .expect(HTTP.NOT_FOUND);

        // Verify task still exists for original user
        t.withToken(originalToken!);
        await t.api
          .get(ENDPOINTS.TASKS.BY_ID(taskId))
          .expect(HTTP.OK);
      });
    });

    // Use shared auth guard scenario - tests 3 common auth failure cases
    // Pass a function to get the dynamic taskId
    describeAuthGuard(() => t.api, 'DELETE', () => ENDPOINTS.TASKS.BY_ID(taskId));
  });
});
