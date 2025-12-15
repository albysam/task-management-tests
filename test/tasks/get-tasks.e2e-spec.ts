import { BaseTest } from '../setup';
import { ENDPOINTS, HTTP } from '../fixtures';
import { TaskStatus } from '../../src/tasks/task-status.enum';
import { Task } from '../../src/tasks/task.entity';
import { buildCreateTaskData } from '../factories';
import { describeAuthGuard } from '../shared';

describe('Tasks - Get All (e2e)', () => {
  const t = new BaseTest();

  beforeAll(() => t.setup());
  afterAll(() => t.teardown());

  beforeEach(async () => {
    await t.reset();
    await t.asAuthenticatedUser();
  });

  describe('GET /tasks', () => {
    describe('Success Cases', () => {
      it('should return empty array when no tasks exist', async () => {
        const response = await t.api.get(ENDPOINTS.TASKS.BASE).expect(HTTP.OK);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(0);
      });

      it('should return all tasks for authenticated user', async () => {
        // Create multiple tasks
        await t.api.post(ENDPOINTS.TASKS.BASE).send(buildCreateTaskData()).expect(HTTP.CREATED);
        await t.api.post(ENDPOINTS.TASKS.BASE).send(buildCreateTaskData()).expect(HTTP.CREATED);
        await t.api.post(ENDPOINTS.TASKS.BASE).send(buildCreateTaskData()).expect(HTTP.CREATED);

        const response = await t.api.get(ENDPOINTS.TASKS.BASE).expect(HTTP.OK);

        expect(response.body).toHaveLength(3);
        response.body.forEach((task: Task) => {
          expect(task).toHaveProperty('id');
          expect(task).toHaveProperty('title');
          expect(task).toHaveProperty('description');
          expect(task).toHaveProperty('status');
        });
      });

      it('should return tasks with correct structure', async () => {
        const taskData = buildCreateTaskData();
        await t.api.post(ENDPOINTS.TASKS.BASE).send(taskData).expect(HTTP.CREATED);

        const response = await t.api.get(ENDPOINTS.TASKS.BASE).expect(HTTP.OK);

        const task = response.body[0];
        expect(task).toMatchObject({
          title: taskData.title,
          description: taskData.description,
          status: TaskStatus.OPEN,
        });
      });
    });

    describe('Filter by Status', () => {
      beforeEach(async () => {
        // Create tasks with different statuses
        const task1 = await t.api
          .post(ENDPOINTS.TASKS.BASE)
          .send(buildCreateTaskData())
          .expect(HTTP.CREATED);

        const task2 = await t.api
          .post(ENDPOINTS.TASKS.BASE)
          .send(buildCreateTaskData())
          .expect(HTTP.CREATED);

        const task3 = await t.api
          .post(ENDPOINTS.TASKS.BASE)
          .send(buildCreateTaskData())
          .expect(HTTP.CREATED);

        // Update task statuses
        await t.api
          .patch(ENDPOINTS.TASKS.STATUS(task2.body.id))
          .send({ status: TaskStatus.IN_PROGRESS })
          .expect(HTTP.OK);

        await t.api
          .patch(ENDPOINTS.TASKS.STATUS(task3.body.id))
          .send({ status: TaskStatus.DONE })
          .expect(HTTP.OK);
      });

      it('should filter tasks by OPEN status', async () => {
        const response = await t.api
          .get(ENDPOINTS.TASKS.BASE)
          .query({ status: TaskStatus.OPEN })
          .expect(HTTP.OK);

        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((task: Task) => {
          expect(task.status).toBe(TaskStatus.OPEN);
        });
      });

      it('should filter tasks by IN_PROGRESS status', async () => {
        const response = await t.api
          .get(ENDPOINTS.TASKS.BASE)
          .query({ status: TaskStatus.IN_PROGRESS })
          .expect(HTTP.OK);

        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((task: Task) => {
          expect(task.status).toBe(TaskStatus.IN_PROGRESS);
        });
      });

      it('should filter tasks by DONE status', async () => {
        const response = await t.api
          .get(ENDPOINTS.TASKS.BASE)
          .query({ status: TaskStatus.DONE })
          .expect(HTTP.OK);

        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((task: Task) => {
          expect(task.status).toBe(TaskStatus.DONE);
        });
      });
    });

    describe('Filter by Search', () => {
      beforeEach(async () => {
        await t.api
          .post(ENDPOINTS.TASKS.BASE)
          .send({ title: 'Shopping list', description: 'Buy groceries' })
          .expect(HTTP.CREATED);

        await t.api
          .post(ENDPOINTS.TASKS.BASE)
          .send({ title: 'Work project', description: 'Complete shopping app' })
          .expect(HTTP.CREATED);

        await t.api
          .post(ENDPOINTS.TASKS.BASE)
          .send({ title: 'Exercise', description: 'Go to gym' })
          .expect(HTTP.CREATED);
      });

      it('should filter tasks by title search', async () => {
        const response = await t.api
          .get(ENDPOINTS.TASKS.BASE)
          .query({ search: 'Shopping' })
          .expect(HTTP.OK);

        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((task: Task) => {
          const matchesTitle = task.title.toLowerCase().includes('shopping');
          const matchesDesc = task.description.toLowerCase().includes('shopping');
          expect(matchesTitle || matchesDesc).toBe(true);
        });
      });

      it('should filter tasks by description search', async () => {
        const response = await t.api
          .get(ENDPOINTS.TASKS.BASE)
          .query({ search: 'gym' })
          .expect(HTTP.OK);

        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].title).toBe('Exercise');
      });

      it('should return empty array for non-matching search', async () => {
        const response = await t.api
          .get(ENDPOINTS.TASKS.BASE)
          .query({ search: 'nonexistent' })
          .expect(HTTP.OK);

        expect(response.body).toHaveLength(0);
      });
    });

    describe('User Isolation', () => {
      it('should only return tasks belonging to authenticated user', async () => {
        // Create task for first user
        await t.api.post(ENDPOINTS.TASKS.BASE).send(buildCreateTaskData()).expect(HTTP.CREATED);

        // Switch to second user
        await t.asAuthenticatedUser();
        await t.api.post(ENDPOINTS.TASKS.BASE).send(buildCreateTaskData()).expect(HTTP.CREATED);

        // Get tasks - should only see second user's task
        const response = await t.api.get(ENDPOINTS.TASKS.BASE).expect(HTTP.OK);
        expect(response.body).toHaveLength(1);
      });
    });

    // Reusable auth guard tests
    describeAuthGuard(() => t.api, 'GET', ENDPOINTS.TASKS.BASE);
  });
});
