import { ApiClient } from '../helpers';
import { HTTP, NON_EXISTENT_UUID } from '../fixtures';

/**
 * Shared test scenarios for "not found" testing.
 * Use these to ensure consistent 404 handling across endpoints.
 */

type HttpMethod = 'GET' | 'PUT' | 'PATCH' | 'DELETE';

interface NotFoundOptions {
  /** Request body for PUT/PATCH requests */
  body?: Record<string, unknown>;
}

/**
 * Creates standard "not found" tests for resource endpoints.
 * 
 * Usage:
 * ```typescript
 * describeNotFound(
 *   () => api,
 *   'GET',
 *   (id) => `/tasks/${id}`,
 * );
 * ```
 */
export function describeNotFound(
  getApi: () => ApiClient,
  method: HttpMethod,
  endpointFn: (id: string) => string,
  options: NotFoundOptions = {},
): void {
  const { body } = options;

  describe('Not Found Errors', () => {
    it('should return 404 for non-existent resource', async () => {
      const api = getApi();
      const endpoint = endpointFn(NON_EXISTENT_UUID);

      let request;
      switch (method) {
        case 'GET':
          request = api.get(endpoint);
          break;
        case 'PUT':
          request = api.put(endpoint).send(body || {});
          break;
        case 'PATCH':
          request = api.patch(endpoint).send(body || {});
          break;
        case 'DELETE':
          request = api.delete(endpoint);
          break;
      }

      await request.expect(HTTP.NOT_FOUND);
    });
  });
}

/**
 * Tests resource isolation between users (user A can't access user B's resource).
 * 
 * Usage:
 * ```typescript
 * it('should not access other user resources', async () => {
 *   await testResourceIsolation(
 *     t, // BaseTest instance
 *     'GET',
 *     `/tasks/${otherUserTaskId}`,
 *   );
 * });
 * ```
 */
export async function testResourceIsolation(
  api: ApiClient,
  method: HttpMethod,
  endpoint: string,
  body?: Record<string, unknown>,
): Promise<void> {
  let request;
  switch (method) {
    case 'GET':
      request = api.get(endpoint);
      break;
    case 'PUT':
      request = api.put(endpoint).send(body || {});
      break;
    case 'PATCH':
      request = api.patch(endpoint).send(body || {});
      break;
    case 'DELETE':
      request = api.delete(endpoint);
      break;
  }

  await request.expect(HTTP.NOT_FOUND);
}

