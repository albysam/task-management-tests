import { ApiClient } from '../helpers';
import { HTTP } from '../fixtures';
import * as request from 'supertest';

/**
 * Shared test scenarios for authentication guard testing.
 * Use these to ensure consistent auth testing across all protected endpoints.
 * 
 * IMPORTANT: These tests use the raw supertest client to avoid modifying
 * the shared ApiClient state, which would affect other tests.
 * 
 * Usage:
 * ```typescript
 * import { describeAuthGuard } from '../shared/auth-guard.scenarios';
 * 
 * describe('My Endpoint (e2e)', () => {
 *   // ... setup ...
 *   
 *   describeAuthGuard(() => api, 'GET', '/my-endpoint');
 * });
 * ```
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface AuthGuardOptions {
  /** Request body for POST/PUT/PATCH requests */
  body?: Record<string, unknown>;
  /** Additional description suffix */
  descriptionSuffix?: string;
}

/**
 * Creates a describe block with standard auth guard tests.
 * Uses raw supertest to avoid modifying the shared ApiClient state.
 */
export function describeAuthGuard(
  getApi: () => ApiClient,
  method: HttpMethod,
  endpoint: string | (() => string),
  options: AuthGuardOptions = {},
): void {
  const { body, descriptionSuffix = '' } = options;

  // Support both static and dynamic endpoints
  const getEndpoint = typeof endpoint === 'function' ? endpoint : () => endpoint;

  describe(`Authentication Guard${descriptionSuffix}`, () => {
    it('should return 401 without authentication', async () => {
      const api = getApi();
      const currentEndpoint = getEndpoint();
      
      // Use raw supertest to avoid modifying shared state
      const req = request(api.getHttpServer());
      
      let response;
      switch (method) {
        case 'GET':
          response = await req.get(currentEndpoint);
          break;
        case 'POST':
          response = await req.post(currentEndpoint).send(body || {});
          break;
        case 'PUT':
          response = await req.put(currentEndpoint).send(body || {});
          break;
        case 'PATCH':
          response = await req.patch(currentEndpoint).send(body || {});
          break;
        case 'DELETE':
          response = await req.delete(currentEndpoint);
          break;
      }

      expect(response.status).toBe(HTTP.UNAUTHORIZED);
    });

    it('should return 401 with invalid token', async () => {
      const api = getApi();
      const currentEndpoint = getEndpoint();
      
      const req = request(api.getHttpServer());
      
      let response;
      switch (method) {
        case 'GET':
          response = await req.get(currentEndpoint).set('Authorization', 'Bearer invalid-token');
          break;
        case 'POST':
          response = await req.post(currentEndpoint).set('Authorization', 'Bearer invalid-token').send(body || {});
          break;
        case 'PUT':
          response = await req.put(currentEndpoint).set('Authorization', 'Bearer invalid-token').send(body || {});
          break;
        case 'PATCH':
          response = await req.patch(currentEndpoint).set('Authorization', 'Bearer invalid-token').send(body || {});
          break;
        case 'DELETE':
          response = await req.delete(currentEndpoint).set('Authorization', 'Bearer invalid-token');
          break;
      }

      expect(response.status).toBe(HTTP.UNAUTHORIZED);
    });

    it('should return 401 with malformed Bearer token', async () => {
      const api = getApi();
      const currentEndpoint = getEndpoint();
      
      const req = request(api.getHttpServer());
      
      let response;
      switch (method) {
        case 'GET':
          response = await req.get(currentEndpoint).set('Authorization', 'NotBearer token');
          break;
        case 'POST':
          response = await req.post(currentEndpoint).set('Authorization', 'NotBearer token').send(body || {});
          break;
        case 'PUT':
          response = await req.put(currentEndpoint).set('Authorization', 'NotBearer token').send(body || {});
          break;
        case 'PATCH':
          response = await req.patch(currentEndpoint).set('Authorization', 'NotBearer token').send(body || {});
          break;
        case 'DELETE':
          response = await req.delete(currentEndpoint).set('Authorization', 'NotBearer token');
          break;
      }

      expect(response.status).toBe(HTTP.UNAUTHORIZED);
    });
  });
}

/**
 * Runs auth guard tests inline (without creating a describe block).
 * Use when you want more control over test organization.
 */
export async function testAuthGuard(
  getApi: () => ApiClient,
  method: HttpMethod,
  endpoint: string,
  body?: Record<string, unknown>,
): Promise<void> {
  const api = getApi();
  api.clearAuthToken();

  let request;
  switch (method) {
    case 'GET':
      request = api.get(endpoint);
      break;
    case 'POST':
      request = api.post(endpoint).send(body || {});
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

  await request.expect(HTTP.UNAUTHORIZED);
}

