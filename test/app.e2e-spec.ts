import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersRepository } from '../src/auth/users.repository';
import { TasksRepository } from '../src/tasks/tasks.repository';
import { User } from '../src/auth/user.entity';
import { Task } from '../src/tasks/task.entity';
import { TaskStatus } from '../src/tasks/task-status.enum';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let userRepository: UsersRepository;
  let taskRepository: TasksRepository;
  let authToken: string;
  let testUser: User;
  let testTask: Task;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userRepository = moduleFixture.get<UsersRepository>(
      getRepositoryToken(UsersRepository),
    );
    taskRepository = moduleFixture.get<TasksRepository>(
      getRepositoryToken(TasksRepository),
    );
  });

  afterAll(async () => {
    // Clean up test data
    if (taskRepository) {
      await taskRepository.delete({});
    }
    if (userRepository) {
      await userRepository.delete({});
    }
    await app.close();
  });

  describe('Auth Endpoints', () => {
    describe('POST /auth/signup', () => {
      it('should create a new user successfully', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            username: 'testuser',
            password: 'Test1234!',
          })
          .expect(201);
      });

      it('should fail with weak password', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            username: 'testuser2',
            password: 'weak',
          })
          .expect(400);
      });

      it('should fail with short password', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            username: 'testuser3',
            password: 'Short1!',
          })
          .expect(400);
      });

      it('should fail with invalid username length', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            username: 'ab',
            password: 'Test1234!',
          })
          .expect(400);
      });

      it('should fail with duplicate username', async () => {
        await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            username: 'duplicateuser',
            password: 'Test1234!',
          })
          .expect(201);

        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            username: 'duplicateuser',
            password: 'Test1234!',
          })
          .expect(409);
      });
    });

    describe('POST /auth/signin', () => {
      beforeEach(async () => {
        // Clean up any existing user first
        const existingUser = await userRepository.findOne({
          username: 'signinuser',
        });
        if (existingUser) {
          await userRepository.delete({ username: 'signinuser' });
        }

        // Create a user for signin tests
        await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            username: 'signinuser',
            password: 'Test1234!',
          })
          .expect(201);
      });

      it('should sign in successfully and return access token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/signin')
          .send({
            username: 'signinuser',
            password: 'Test1234!',
          })
          .expect(200);

        expect(response.body).toHaveProperty('accessToken');
        expect(typeof response.body.accessToken).toBe('string');
        authToken = response.body.accessToken;
      });

      it('should fail with wrong password', () => {
        return request(app.getHttpServer())
          .post('/auth/signin')
          .send({
            username: 'signinuser',
            password: 'WrongPass123!',
          })
          .expect(401);
      });

      it('should fail with non-existent user', () => {
        return request(app.getHttpServer())
          .post('/auth/signin')
          .send({
            username: 'nonexistent',
            password: 'Test1234!',
          })
          .expect(401);
      });

      it('should fail with invalid credentials format', () => {
        return request(app.getHttpServer())
          .post('/auth/signin')
          .send({
            username: 'signinuser',
            password: 'weak',
          })
          .expect(400);
      });
    });
  });

  describe('Tasks Endpoints', () => {
    beforeEach(async () => {
      // Create a user and get auth token for task tests
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'taskuser',
          password: 'Test1234!',
        });

      const signInResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          username: 'taskuser',
          password: 'Test1234!',
        });

      authToken = signInResponse.body.accessToken;

      // Get the user from database
      testUser = await userRepository.findOne({ username: 'taskuser' });
    });

    describe('POST /tasks', () => {
      it('should create a task successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Task',
            description: 'This is a test task',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe('Test Task');
        expect(response.body.description).toBe('This is a test task');
        expect(response.body.status).toBe(TaskStatus.OPEN);
        testTask = response.body;
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .post('/tasks')
          .send({
            title: 'Test Task',
            description: 'This is a test task',
          })
          .expect(401);
      });

      it('should fail with empty title', () => {
        return request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: '',
            description: 'This is a test task',
          })
          .expect(400);
      });

      it('should fail with empty description', () => {
        return request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Task',
            description: '',
          })
          .expect(400);
      });

      it('should fail with missing fields', () => {
        return request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Task',
          })
          .expect(400);
      });
    });

    describe('GET /tasks', () => {
      beforeEach(async () => {
        // Create multiple tasks for testing
        await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Task 1',
            description: 'Description 1',
          });

        await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Task 2',
            description: 'Description 2',
          });

        await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Task 3',
            description: 'Description 3',
          });
      });

      it('should get all tasks for authenticated user', async () => {
        const response = await request(app.getHttpServer())
          .get('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((task: Task) => {
          expect(task).toHaveProperty('id');
          expect(task).toHaveProperty('title');
          expect(task).toHaveProperty('description');
          expect(task).toHaveProperty('status');
        });
      });

      it('should filter tasks by status', async () => {
        // Update one task to IN_PROGRESS
        const tasksResponse = await request(app.getHttpServer())
          .get('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (tasksResponse.body.length > 0) {
          const taskId = tasksResponse.body[0].id;
          await request(app.getHttpServer())
            .patch(`/tasks/${taskId}/status`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ status: TaskStatus.IN_PROGRESS })
            .expect(200);

          const filteredResponse = await request(app.getHttpServer())
            .get('/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .query({ status: TaskStatus.IN_PROGRESS })
            .expect(200);

          filteredResponse.body.forEach((task: Task) => {
            expect(task.status).toBe(TaskStatus.IN_PROGRESS);
          });
        }
      });

      it('should filter tasks by search term', async () => {
        const response = await request(app.getHttpServer())
          .get('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ search: 'Task 1' })
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach((task: Task) => {
          const titleMatch = task.title.toLowerCase().includes('task 1');
          const descMatch = task.description.toLowerCase().includes('task 1');
          expect(titleMatch || descMatch).toBe(true);
        });
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .get('/tasks')
          .expect(401);
      });
    });

    describe('GET /tasks/:id', () => {
      let createdTask: Task;

      beforeEach(async () => {
        const response = await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Get Task Test',
            description: 'Test description',
          });
        createdTask = response.body;
      });

      it('should get a task by id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/tasks/${createdTask.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(createdTask.id);
        expect(response.body.title).toBe('Get Task Test');
        expect(response.body.description).toBe('Test description');
      });

      it('should fail with non-existent task id', () => {
        return request(app.getHttpServer())
          .get('/tasks/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .get(`/tasks/${createdTask.id}`)
          .expect(401);
      });

      it('should not return task from another user', async () => {
        // Create another user
        await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            username: 'otheruser',
            password: 'Test1234!',
          });

        const otherUserResponse = await request(app.getHttpServer())
          .post('/auth/signin')
          .send({
            username: 'otheruser',
            password: 'Test1234!',
          });

        const otherUserToken = otherUserResponse.body.accessToken;

        // Try to access first user's task
        return request(app.getHttpServer())
          .get(`/tasks/${createdTask.id}`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .expect(404);
      });
    });

    describe('PATCH /tasks/:id/status', () => {
      let createdTask: Task;

      beforeEach(async () => {
        const response = await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Update Status Task',
            description: 'Test description',
          });
        createdTask = response.body;
      });

      it('should update task status to IN_PROGRESS', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/tasks/${createdTask.id}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: TaskStatus.IN_PROGRESS })
          .expect(200);

        expect(response.body.status).toBe(TaskStatus.IN_PROGRESS);
        expect(response.body.id).toBe(createdTask.id);
      });

      it('should update task status to DONE', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/tasks/${createdTask.id}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: TaskStatus.DONE })
          .expect(200);

        expect(response.body.status).toBe(TaskStatus.DONE);
      });

      it('should fail with invalid status', () => {
        return request(app.getHttpServer())
          .patch(`/tasks/${createdTask.id}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: 'INVALID_STATUS' })
          .expect(400);
      });

      it('should fail with non-existent task id', () => {
        return request(app.getHttpServer())
          .patch('/tasks/00000000-0000-0000-0000-000000000000/status')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: TaskStatus.DONE })
          .expect(404);
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .patch(`/tasks/${createdTask.id}/status`)
          .send({ status: TaskStatus.DONE })
          .expect(401);
      });
    });

    describe('DELETE /tasks/:id', () => {
      let createdTask: Task;

      beforeEach(async () => {
        const response = await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Delete Task Test',
            description: 'Test description',
          });
        createdTask = response.body;
      });

      it('should delete a task successfully', async () => {
        await request(app.getHttpServer())
          .delete(`/tasks/${createdTask.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Verify task is deleted
        await request(app.getHttpServer())
          .get(`/tasks/${createdTask.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      it('should fail with non-existent task id', () => {
        return request(app.getHttpServer())
          .delete('/tasks/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .delete(`/tasks/${createdTask.id}`)
          .expect(401);
      });

      it('should not delete task from another user', async () => {
        // Create another user
        await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            username: 'deleteuser',
            password: 'Test1234!',
          });

        const otherUserResponse = await request(app.getHttpServer())
          .post('/auth/signin')
          .send({
            username: 'deleteuser',
            password: 'Test1234!',
          });

        const otherUserToken = otherUserResponse.body.accessToken;

        // Try to delete first user's task
        return request(app.getHttpServer())
          .delete(`/tasks/${createdTask.id}`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .expect(404);
      });
    });
  });
});

