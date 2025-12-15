import { AuthCredentials } from '../helpers/auth.helper';

/**
 * Factory for generating user test data.
 * Use factories to create consistent, isolated test data.
 */

let userSequence = 0;

/**
 * Resets the user sequence counter.
 * Call this in beforeEach() if you need predictable usernames.
 */
export function resetUserSequence(): void {
  userSequence = 0;
}

/**
 * Builds valid user credentials with auto-incrementing username.
 */
export function buildUserCredentials(
  overrides: Partial<AuthCredentials> = {},
): AuthCredentials {
  userSequence++;
  return {
    username: `user_${userSequence}_${Date.now()}`,
    password: 'Test1234!',
    ...overrides,
  };
}

/**
 * Builds user credentials with a weak password (for validation tests).
 */
export function buildWeakPasswordCredentials(): AuthCredentials {
  return buildUserCredentials({ password: 'weak' });
}

/**
 * Builds user credentials with a short password (for validation tests).
 */
export function buildShortPasswordCredentials(): AuthCredentials {
  return buildUserCredentials({ password: 'Short1!' });
}

/**
 * Builds user credentials with an invalid username (for validation tests).
 */
export function buildInvalidUsernameCredentials(): AuthCredentials {
  return buildUserCredentials({ username: 'ab' }); // Too short
}

/**
 * Builds a batch of user credentials for bulk testing.
 */
export function buildUserCredentialsBatch(count: number): AuthCredentials[] {
  return Array.from({ length: count }, () => buildUserCredentials());
}

