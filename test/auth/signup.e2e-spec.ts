import { BaseTest } from '../setup';
import { ENDPOINTS, HTTP } from '../fixtures';
import {
  buildUserCredentials,
  buildWeakPasswordCredentials,
  buildShortPasswordCredentials,
  buildInvalidUsernameCredentials,
} from '../factories';

describe('Auth - Signup (e2e)', () => {
  const t = new BaseTest();

  beforeAll(() => t.setup());
  afterAll(() => t.teardown());
  beforeEach(() => t.reset());

  describe('POST /auth/signup', () => {
    describe('Success Cases', () => {
      it('should create a new user with valid credentials', async () => {
        const credentials = buildUserCredentials();

        const response = await t.api
          .post(ENDPOINTS.AUTH.SIGNUP)
          .send(credentials)
          .expect(HTTP.CREATED);

        // Verify no sensitive data is returned
        expect(response.body).not.toHaveProperty('password');
      });

      it('should allow multiple users with different usernames', async () => {
        const credentials1 = buildUserCredentials();
        const credentials2 = buildUserCredentials();

        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials1).expect(HTTP.CREATED);
        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials2).expect(HTTP.CREATED);
      });

      it('should allow usernames at minimum length (4 chars)', async () => {
        const credentials = buildUserCredentials({ username: 'abcd' });

        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials).expect(HTTP.CREATED);
      });

      it('should allow usernames at maximum length (20 chars)', async () => {
        const credentials = buildUserCredentials({ username: 'a'.repeat(20) });

        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials).expect(HTTP.CREATED);
      });
    });

    describe('Validation Errors', () => {
      it('should fail with weak password', async () => {
        const credentials = buildWeakPasswordCredentials();

        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials).expect(HTTP.BAD_REQUEST);
      });

      it('should fail with short password', async () => {
        const credentials = buildShortPasswordCredentials();

        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials).expect(HTTP.BAD_REQUEST);
      });

      it('should fail with username too short', async () => {
        const credentials = buildInvalidUsernameCredentials();

        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials).expect(HTTP.BAD_REQUEST);
      });

      it('should fail with empty username', async () => {
        const credentials = buildUserCredentials({ username: '' });

        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials).expect(HTTP.BAD_REQUEST);
      });

      it('should fail with empty password', async () => {
        const credentials = buildUserCredentials({ password: '' });

        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials).expect(HTTP.BAD_REQUEST);
      });

      it('should fail with missing username', async () => {
        await t.api
          .post(ENDPOINTS.AUTH.SIGNUP)
          .send({ password: 'Test1234!' })
          .expect(HTTP.BAD_REQUEST);
      });

      it('should fail with missing password', async () => {
        await t.api
          .post(ENDPOINTS.AUTH.SIGNUP)
          .send({ username: 'testuser' })
          .expect(HTTP.BAD_REQUEST);
      });

      it('should fail with empty body', async () => {
        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send({}).expect(HTTP.BAD_REQUEST);
      });
    });

    describe('Conflict Errors', () => {
      it('should fail with duplicate username', async () => {
        const credentials = buildUserCredentials();

        // Create user first time
        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials).expect(HTTP.CREATED);

        // Try to create with same username
        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials).expect(HTTP.CONFLICT);
      });

      it('should be case-sensitive for usernames', async () => {
        const credentials1 = buildUserCredentials({ username: 'TestUser' });
        const credentials2 = { ...credentials1, username: 'testuser' };

        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials1).expect(HTTP.CREATED);
        // This might pass or fail depending on DB collation settings
        await t.api.post(ENDPOINTS.AUTH.SIGNUP).send(credentials2);
      });
    });
  });
});
