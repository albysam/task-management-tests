import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthenticatedUser {
  credentials: AuthCredentials;
  accessToken: string;
}

/**
 * Creates a new user via the signup endpoint.
 */
export async function createUser(
  app: INestApplication,
  credentials: AuthCredentials,
): Promise<void> {
  await request(app.getHttpServer())
    .post('/auth/signup')
    .send(credentials)
    .expect(201);
}

/**
 * Signs in a user and returns the access token.
 */
export async function signIn(
  app: INestApplication,
  credentials: AuthCredentials,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/signin')
    .send(credentials)
    .expect(200);

  return response.body.accessToken;
}

/**
 * Creates a user and signs them in, returning both credentials and token.
 * This is the most common pattern for authenticated test setup.
 */
export async function createAuthenticatedUser(
  app: INestApplication,
  credentials: AuthCredentials,
): Promise<AuthenticatedUser> {
  // Try to create user (ignore if already exists)
  try {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send(credentials);
  } catch {
    // User might already exist, continue to signin
  }

  const accessToken = await signIn(app, credentials);

  return {
    credentials,
    accessToken,
  };
}

/**
 * Generates unique credentials for test isolation.
 * Use a unique suffix to avoid collisions across parallel tests.
 */
export function generateCredentials(prefix: string = 'testuser'): AuthCredentials {
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  return {
    username: `${prefix}_${uniqueId}`,
    password: 'Test1234!',
  };
}

