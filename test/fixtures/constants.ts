import { TaskStatus } from '../../src/tasks/task-status.enum';

/**
 * Test constants and static fixtures.
 * Use these for consistent test data across all test files.
 */

// ============================================================================
// API Endpoints
// ============================================================================

export const ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    SIGNIN: '/auth/signin',
  },
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id: string) => `/tasks/${id}`,
    STATUS: (id: string) => `/tasks/${id}/status`,
  },
} as const;

// ============================================================================
// HTTP Status Codes (for readability)
// ============================================================================

export const HTTP = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

// ============================================================================
// Valid Test Data
// ============================================================================

export const VALID_CREDENTIALS = {
  username: 'validuser',
  password: 'ValidPass123!',
} as const;

export const VALID_TASK = {
  title: 'Valid Task Title',
  description: 'This is a valid task description',
} as const;

// ============================================================================
// Invalid Test Data (for validation tests)
// ============================================================================

export const INVALID_PASSWORDS = {
  TOO_SHORT: 'Short1!',
  TOO_WEAK: 'weakpassword',
  NO_UPPERCASE: 'password123!',
  NO_LOWERCASE: 'PASSWORD123!',
  NO_NUMBER: 'Password!',
  NO_SPECIAL: 'Password123',
} as const;

export const INVALID_USERNAMES = {
  TOO_SHORT: 'ab',
  EMPTY: '',
} as const;

// ============================================================================
// UUIDs for testing non-existent resources
// ============================================================================

export const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';
export const INVALID_UUID = 'not-a-uuid';

// ============================================================================
// Task Statuses
// ============================================================================

export const ALL_TASK_STATUSES = [
  TaskStatus.OPEN,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
] as const;

export const INVALID_TASK_STATUS = 'INVALID_STATUS';

// ============================================================================
// Test Timeouts
// ============================================================================

export const TIMEOUTS = {
  DEFAULT: 30000,
  LONG: 60000,
  SHORT: 5000,
} as const;

