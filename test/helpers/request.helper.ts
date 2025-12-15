import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Test } from 'supertest';

/**
 * A wrapper around supertest that provides convenient methods
 * for authenticated requests and common patterns.
 */
export class ApiClient {
  private authToken: string | null = null;

  constructor(private readonly app: INestApplication) {}

  /**
   * Sets the authentication token for subsequent requests.
   */
  setAuthToken(token: string): this {
    this.authToken = token;
    return this;
  }

  /**
   * Clears the authentication token.
   */
  clearAuthToken(): this {
    this.authToken = null;
    return this;
  }

  /**
   * Makes a GET request, automatically adding auth header if token is set.
   */
  get(url: string): Test {
    const req = request(this.app.getHttpServer()).get(url);
    return this.applyAuth(req);
  }

  /**
   * Makes a POST request, automatically adding auth header if token is set.
   */
  post(url: string): Test {
    const req = request(this.app.getHttpServer()).post(url);
    return this.applyAuth(req);
  }

  /**
   * Makes a PATCH request, automatically adding auth header if token is set.
   */
  patch(url: string): Test {
    const req = request(this.app.getHttpServer()).patch(url);
    return this.applyAuth(req);
  }

  /**
   * Makes a PUT request, automatically adding auth header if token is set.
   */
  put(url: string): Test {
    const req = request(this.app.getHttpServer()).put(url);
    return this.applyAuth(req);
  }

  /**
   * Makes a DELETE request, automatically adding auth header if token is set.
   */
  delete(url: string): Test {
    const req = request(this.app.getHttpServer()).delete(url);
    return this.applyAuth(req);
  }

  /**
   * Gets the raw supertest instance for custom requests.
   */
  raw(): ReturnType<typeof request> & { app: ReturnType<INestApplication['getHttpServer']> } {
    const instance = request(this.app.getHttpServer()) as ReturnType<typeof request> & {
      app: ReturnType<INestApplication['getHttpServer']>;
    };
    instance.app = this.app.getHttpServer();
    return instance;
  }

  /**
   * Gets the HTTP server for raw supertest usage.
   */
  getHttpServer(): ReturnType<INestApplication['getHttpServer']> {
    return this.app.getHttpServer();
  }

  private applyAuth(req: Test): Test {
    if (this.authToken) {
      return req.set('Authorization', `Bearer ${this.authToken}`);
    }
    return req;
  }
}

/**
 * Creates an API client for the given app instance.
 */
export function createApiClient(app: INestApplication): ApiClient {
  return new ApiClient(app);
}

