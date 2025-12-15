import { Response } from 'supertest';

/**
 * Common test utilities and assertion helpers.
 * Use these to standardize assertions across all test files.
 */

// ============================================================================
// Response Validators
// ============================================================================

/**
 * Validates that a response contains a valid UUID.
 */
export function expectValidUuid(value: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  expect(value).toMatch(uuidRegex);
}

/**
 * Validates that a response contains a valid JWT token.
 */
export function expectValidJwt(token: string): void {
  const parts = token.split('.');
  expect(parts).toHaveLength(3);
  // Each part should be base64url encoded
  parts.forEach((part) => {
    expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
  });
}

/**
 * Validates that a response has the expected error structure.
 */
export function expectErrorResponse(
  response: Response,
  expectedStatus: number,
  expectedMessage?: string | RegExp,
): void {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('statusCode', expectedStatus);
  
  if (expectedMessage) {
    if (typeof expectedMessage === 'string') {
      expect(response.body.message).toContain(expectedMessage);
    } else {
      expect(response.body.message).toMatch(expectedMessage);
    }
  }
}

/**
 * Validates that a response contains pagination metadata.
 */
export function expectPaginatedResponse(
  response: Response,
  expectedProperties: {
    page?: number;
    limit?: number;
    total?: number;
  } = {},
): void {
  expect(response.body).toHaveProperty('data');
  expect(Array.isArray(response.body.data)).toBe(true);
  
  if (expectedProperties.page !== undefined) {
    expect(response.body.page).toBe(expectedProperties.page);
  }
  if (expectedProperties.limit !== undefined) {
    expect(response.body.limit).toBe(expectedProperties.limit);
  }
  if (expectedProperties.total !== undefined) {
    expect(response.body.total).toBe(expectedProperties.total);
  }
}

// ============================================================================
// Entity Validators
// ============================================================================

/**
 * Validates that an object has all required task properties.
 */
export function expectTaskShape(task: unknown): void {
  expect(task).toHaveProperty('id');
  expect(task).toHaveProperty('title');
  expect(task).toHaveProperty('description');
  expect(task).toHaveProperty('status');
  expectValidUuid((task as { id: string }).id);
}

/**
 * Validates that an object matches expected task data.
 */
export function expectTaskToMatch(
  task: unknown,
  expected: { title?: string; description?: string; status?: string },
): void {
  expectTaskShape(task);
  if (expected.title) {
    expect((task as { title: string }).title).toBe(expected.title);
  }
  if (expected.description) {
    expect((task as { description: string }).description).toBe(expected.description);
  }
  if (expected.status) {
    expect((task as { status: string }).status).toBe(expected.status);
  }
}

// ============================================================================
// Array Validators
// ============================================================================

/**
 * Validates that all items in an array have a specific property value.
 */
export function expectAllToHaveProperty<T>(
  items: T[],
  property: keyof T,
  value: T[keyof T],
): void {
  items.forEach((item) => {
    expect(item[property]).toBe(value);
  });
}

/**
 * Validates that an array contains an item matching the predicate.
 */
export function expectToContainMatching<T>(
  items: T[],
  predicate: (item: T) => boolean,
): void {
  const found = items.find(predicate);
  expect(found).toBeDefined();
}

// ============================================================================
// Timing Utilities
// ============================================================================

/**
 * Delays execution for the specified milliseconds.
 * Use sparingly - prefer deterministic tests.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async function until it succeeds or times out.
 * Useful for eventual consistency tests.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delayMs?: number } = {},
): Promise<T> {
  const { maxAttempts = 3, delayMs = 100 } = options;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

