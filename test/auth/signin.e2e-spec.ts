import { BaseTest } from '../setup';
import { createUser, expectValidJwt } from '../helpers';
import { ENDPOINTS, HTTP } from '../fixtures';
import { buildUserCredentials } from '../factories';

describe('Auth - Signin (e2e)', () => {
  const t = new BaseTest();

  beforeAll(() => t.setup());
  afterAll(() => t.teardown());
  beforeEach(() => t.reset());

  describe('POST /auth/signin', () => {
    describe('Success Cases', () => {
      it('should sign in and return access token', async () => {
        const credentials = buildUserCredentials();
        await createUser(t.app, credentials);

        const response = await t.api
          .post(ENDPOINTS.AUTH.SIGNIN)
          .send(credentials)
          .expect(HTTP.OK);

        expect(response.body).toHaveProperty('accessToken');
        expect(typeof response.body.accessToken).toBe('string');
        expect(response.body.accessToken.length).toBeGreaterThan(0);
      });

      it('should return JWT format token', async () => {
        const credentials = buildUserCredentials();
        await createUser(t.app, credentials);

        const response = await t.api
          .post(ENDPOINTS.AUTH.SIGNIN)
          .send(credentials)
          .expect(HTTP.OK);

        expectValidJwt(response.body.accessToken);
      });

      it('should allow multiple sign-ins for same user', async () => {
        const credentials = buildUserCredentials();
        await createUser(t.app, credentials);

        const response1 = await t.api
          .post(ENDPOINTS.AUTH.SIGNIN)
          .send(credentials)
          .expect(HTTP.OK);

        const response2 = await t.api
          .post(ENDPOINTS.AUTH.SIGNIN)
          .send(credentials)
          .expect(HTTP.OK);

        // Both tokens should be valid JWTs
        expectValidJwt(response1.body.accessToken);
        expectValidJwt(response2.body.accessToken);
      });
    });

    describe('Authentication Errors', () => {
      it('should fail with wrong password', async () => {
        const credentials = buildUserCredentials();
        await createUser(t.app, credentials);

        await t.api
          .post(ENDPOINTS.AUTH.SIGNIN)
          .send({ ...credentials, password: 'WrongPass123!' })
          .expect(HTTP.UNAUTHORIZED);
      });

      it('should fail with non-existent user', async () => {
        await t.api
          .post(ENDPOINTS.AUTH.SIGNIN)
          .send({ username: 'nonexistent', password: 'Test1234!' })
          .expect(HTTP.UNAUTHORIZED);
      });

      it('should fail with case-mismatched username', async () => {
        const credentials = buildUserCredentials({ username: 'TestUser' });
        await createUser(t.app, credentials);

        // Try to signin with lowercase - should fail if case-sensitive
        await t.api
          .post(ENDPOINTS.AUTH.SIGNIN)
          .send({ ...credentials, username: 'testuser' })
          .expect(HTTP.UNAUTHORIZED);
      });
    });

    describe('Validation Errors', () => {
      it('should fail with empty credentials', async () => {
        await t.api.post(ENDPOINTS.AUTH.SIGNIN).send({}).expect(HTTP.BAD_REQUEST);
      });

      it('should fail with missing username', async () => {
        await t.api
          .post(ENDPOINTS.AUTH.SIGNIN)
          .send({ password: 'Test1234!' })
          .expect(HTTP.BAD_REQUEST);
      });

      it('should fail with missing password', async () => {
        await t.api
          .post(ENDPOINTS.AUTH.SIGNIN)
          .send({ username: 'testuser' })
          .expect(HTTP.BAD_REQUEST);
      });

      it('should fail with invalid password format', async () => {
        const credentials = buildUserCredentials();
        await createUser(t.app, credentials);

        await t.api
          .post(ENDPOINTS.AUTH.SIGNIN)
          .send({ ...credentials, password: 'weak' })
          .expect(HTTP.BAD_REQUEST);
      });
    });
  });
});
