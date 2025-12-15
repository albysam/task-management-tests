import { ApiClient } from '../helpers';
import { HTTP } from '../fixtures';

/**
 * Shared test scenarios for validation testing.
 * Use these to ensure consistent validation testing across endpoints.
 */

interface ValidationTestCase {
  name: string;
  body: Record<string, unknown>;
  expectedStatus?: number;
}

/**
 * Creates tests for common validation scenarios on a POST/PUT/PATCH endpoint.
 * 
 * Usage:
 * ```typescript
 * describeValidation(
 *   () => api,
 *   'POST',
 *   '/tasks',
 *   [
 *     { name: 'empty title', body: { title: '', description: 'valid' } },
 *     { name: 'missing title', body: { description: 'valid' } },
 *   ]
 * );
 * ```
 */
export function describeValidation(
  getApi: () => ApiClient,
  method: 'POST' | 'PUT' | 'PATCH',
  endpoint: string,
  testCases: ValidationTestCase[],
): void {
  describe('Validation Errors', () => {
    testCases.forEach(({ name, body, expectedStatus = HTTP.BAD_REQUEST }) => {
      it(`should fail with ${name}`, async () => {
        const api = getApi();

        let request;
        switch (method) {
          case 'POST':
            request = api.post(endpoint);
            break;
          case 'PUT':
            request = api.put(endpoint);
            break;
          case 'PATCH':
            request = api.patch(endpoint);
            break;
        }

        await request.send(body).expect(expectedStatus);
      });
    });
  });
}

/**
 * Standard validation test cases for "required string" fields.
 */
export function requiredStringValidations(
  fieldName: string,
  validBody: Record<string, unknown>,
): ValidationTestCase[] {
  const bodyWithEmpty = { ...validBody, [fieldName]: '' };
  const bodyWithMissing = { ...validBody };
  delete bodyWithMissing[fieldName];
  const bodyWithNull = { ...validBody, [fieldName]: null };
  const bodyWithNumber = { ...validBody, [fieldName]: 123 };

  return [
    { name: `empty ${fieldName}`, body: bodyWithEmpty },
    { name: `missing ${fieldName}`, body: bodyWithMissing },
    { name: `null ${fieldName}`, body: bodyWithNull },
    { name: `numeric ${fieldName}`, body: bodyWithNumber },
  ];
}

/**
 * Standard validation test cases for enum fields.
 */
export function enumValidations(
  fieldName: string,
  validBody: Record<string, unknown>,
  invalidValue: string = 'INVALID_VALUE',
): ValidationTestCase[] {
  const bodyWithInvalid = { ...validBody, [fieldName]: invalidValue };
  const bodyWithEmpty = { ...validBody, [fieldName]: '' };
  const bodyWithNumber = { ...validBody, [fieldName]: 123 };

  return [
    { name: `invalid ${fieldName}`, body: bodyWithInvalid },
    { name: `empty ${fieldName}`, body: bodyWithEmpty },
    { name: `numeric ${fieldName}`, body: bodyWithNumber },
  ];
}

/**
 * Standard validation test cases for UUID parameters.
 */
export function uuidValidations(
  getApi: () => ApiClient,
  method: 'GET' | 'PATCH' | 'DELETE',
  endpointFn: (id: string) => string,
  body?: Record<string, unknown>,
): void {
  describe('UUID Validation', () => {
    const invalidUuids = [
      { name: 'invalid format', value: 'not-a-uuid' },
      { name: 'too short', value: '12345' },
      { name: 'empty', value: '' },
      { name: 'special chars', value: '!@#$%^&*()' },
    ];

    invalidUuids.forEach(({ name, value }) => {
      it(`should fail with ${name} UUID`, async () => {
        const api = getApi();
        const endpoint = endpointFn(value);

        let request;
        switch (method) {
          case 'GET':
            request = api.get(endpoint);
            break;
          case 'PATCH':
            request = api.patch(endpoint).send(body || {});
            break;
          case 'DELETE':
            request = api.delete(endpoint);
            break;
        }

        // Could be 400 or 404 depending on implementation
        const response = await request;
        expect([HTTP.BAD_REQUEST, HTTP.NOT_FOUND]).toContain(response.status);
      });
    });
  });
}

