/**
 * Shared test scenarios that can be reused across all test files.
 * These provide consistent testing patterns for common scenarios.
 */

export { describeAuthGuard, testAuthGuard } from './auth-guard.scenarios';

export {
  describeValidation,
  requiredStringValidations,
  enumValidations,
  uuidValidations,
} from './validation.scenarios';

export { describeNotFound, testResourceIsolation } from './not-found.scenarios';

