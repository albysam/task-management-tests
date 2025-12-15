import { TestContext, createTestApp, closeTestApp, cleanDatabase } from './test-app';
import { ApiClient, createApiClient, createAuthenticatedUser, AuthenticatedUser } from '../helpers';
import { buildUserCredentials, resetUserSequence, resetTaskSequence } from '../factories';

/**
 * Base test context that provides common setup/teardown for all e2e tests.
 * Extend or use this to reduce boilerplate in test files.
 * 
 * Usage:
 * ```typescript
 * describe('My Module (e2e)', () => {
 *   const t = new BaseTest();
 *   
 *   beforeAll(() => t.setup());
 *   afterAll(() => t.teardown());
 *   beforeEach(() => t.reset());
 *   
 *   it('should work', async () => {
 *     await t.asAuthenticatedUser();
 *     const response = await t.api.get('/endpoint');
 *   });
 * });
 * ```
 */
export class BaseTest {
  private _ctx: TestContext | null = null;
  private _api: ApiClient | null = null;
  private _authUser: AuthenticatedUser | null = null;

  /**
   * Get the test context (app, repositories).
   */
  get ctx(): TestContext {
    if (!this._ctx) throw new Error('Call setup() before accessing ctx');
    return this._ctx;
  }

  /**
   * Get the API client for making requests.
   */
  get api(): ApiClient {
    if (!this._api) throw new Error('Call setup() before accessing api');
    return this._api;
  }

  /**
   * Get the current authenticated user (if authenticated).
   */
  get authUser(): AuthenticatedUser | null {
    return this._authUser;
  }

  /**
   * Get the app instance.
   */
  get app() {
    return this.ctx.app;
  }

  /**
   * Initialize the test app. Call in beforeAll().
   */
  async setup(): Promise<void> {
    this._ctx = await createTestApp();
    this._api = createApiClient(this._ctx.app);
  }

  /**
   * Clean up and close the app. Call in afterAll().
   */
  async teardown(): Promise<void> {
    if (this._ctx) {
      await cleanDatabase(this._ctx);
      await closeTestApp(this._ctx);
    }
    this._ctx = null;
    this._api = null;
    this._authUser = null;
  }

  /**
   * Reset database and factories between tests. Call in beforeEach().
   */
  async reset(): Promise<void> {
    await cleanDatabase(this.ctx);
    resetUserSequence();
    resetTaskSequence();
    this._authUser = null;
    this._api?.clearAuthToken();
  }

  /**
   * Create and authenticate a user, setting the auth token on the API client.
   * Returns the authenticated user for reference.
   */
  async asAuthenticatedUser(
    credentials = buildUserCredentials(),
  ): Promise<AuthenticatedUser> {
    this._authUser = await createAuthenticatedUser(this.ctx.app, credentials);
    this._api?.setAuthToken(this._authUser.accessToken);
    return this._authUser;
  }

  /**
   * Clear authentication (test as unauthenticated user).
   */
  asUnauthenticated(): void {
    this._authUser = null;
    this._api?.clearAuthToken();
  }

  /**
   * Set a specific auth token (for testing invalid tokens).
   */
  withToken(token: string): void {
    this._api?.setAuthToken(token);
  }
}

/**
 * Creates a configured BaseTest instance with lifecycle hooks.
 * Use this for the simplest setup.
 * 
 * Usage:
 * ```typescript
 * describe('My Module (e2e)', () => {
 *   const { t, beforeAllFn, afterAllFn, beforeEachFn } = createBaseTest();
 *   
 *   beforeAll(beforeAllFn);
 *   afterAll(afterAllFn);
 *   beforeEach(beforeEachFn);
 *   
 *   it('works', async () => {
 *     await t.asAuthenticatedUser();
 *     // test...
 *   });
 * });
 * ```
 */
export function createBaseTest() {
  const t = new BaseTest();
  return {
    t,
    beforeAllFn: () => t.setup(),
    afterAllFn: () => t.teardown(),
    beforeEachFn: () => t.reset(),
  };
}

