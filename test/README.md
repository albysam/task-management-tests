# E2E Test Architecture

This test suite is designed to scale to **1000+ endpoints** with minimal boilerplate and maximum consistency.

## Directory Structure

```
test/
├── setup/                    # App lifecycle & base classes
│   ├── test-app.ts          # Creates/closes NestJS test app
│   ├── base-test.ts         # BaseTest class for all tests
│   ├── global-setup.ts      # Runs once before all suites
│   └── global-teardown.ts   # Runs once after all suites
│
├── helpers/                  # Reusable test utilities
│   ├── auth.helper.ts       # User creation & authentication
│   ├── request.helper.ts    # ApiClient for HTTP requests
│   ├── database.helper.ts   # Direct DB operations
│   └── test-utils.ts        # Assertions & validators
│
├── factories/                # Test data generation
│   ├── user.factory.ts      # User credential builders
│   └── task.factory.ts      # Task data builders
│
├── fixtures/                 # Constants & static data
│   └── constants.ts         # Endpoints, HTTP codes, UUIDs
│
├── shared/                   # Reusable test scenarios
│   ├── auth-guard.scenarios.ts    # Auth guard tests
│   ├── validation.scenarios.ts    # Validation tests
│   └── not-found.scenarios.ts     # 404 tests
│
├── auth/                     # Auth module tests
│   ├── signup.e2e-spec.ts
│   └── signin.e2e-spec.ts
│
├── tasks/                    # Tasks module tests
│   ├── create-task.e2e-spec.ts
│   ├── get-tasks.e2e-spec.ts
│   ├── get-task.e2e-spec.ts
│   ├── update-task-status.e2e-spec.ts
│   └── delete-task.e2e-spec.ts
│
└── jest-e2e.json            # Jest configuration
```

## Quick Start - Adding a New Endpoint Test

### 1. Create the test file

```typescript
// test/orders/create-order.e2e-spec.ts
import { BaseTest } from '../setup';
import { ENDPOINTS, HTTP } from '../fixtures';
import { buildCreateOrderData } from '../factories';
import { describeAuthGuard, describeValidation } from '../shared';

describe('Orders - Create (e2e)', () => {
  const t = new BaseTest();

  beforeAll(() => t.setup());
  afterAll(() => t.teardown());
  beforeEach(async () => {
    await t.reset();
    await t.asAuthenticatedUser();
  });

  describe('POST /orders', () => {
    it('should create an order', async () => {
      const data = buildCreateOrderData();
      
      const response = await t.api
        .post(ENDPOINTS.ORDERS.BASE)
        .send(data)
        .expect(HTTP.CREATED);

      expect(response.body.id).toBeDefined();
    });

    // Reusable auth guard tests (4 tests)
    describeAuthGuard(() => t.api, 'POST', ENDPOINTS.ORDERS.BASE, {
      body: buildCreateOrderData(),
    });

    // Reusable validation tests
    describeValidation(() => t.api, 'POST', ENDPOINTS.ORDERS.BASE, [
      { name: 'empty items', body: { items: [] } },
      { name: 'missing items', body: {} },
    ]);
  });
});
```

### 2. Add the endpoint to fixtures

```typescript
// test/fixtures/constants.ts
export const ENDPOINTS = {
  // ... existing
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
  },
} as const;
```

### 3. Create a factory

```typescript
// test/factories/order.factory.ts
let orderSequence = 0;

export function resetOrderSequence(): void {
  orderSequence = 0;
}

export function buildCreateOrderData(overrides = {}) {
  orderSequence++;
  return {
    items: [{ productId: 'prod-1', quantity: 1 }],
    shippingAddress: `Address ${orderSequence}`,
    ...overrides,
  };
}
```

### 4. Export from index files

```typescript
// test/factories/index.ts
export * from './order.factory';
```

## Key Concepts

### BaseTest Class

Reduces boilerplate in every test file:

```typescript
const t = new BaseTest();

beforeAll(() => t.setup());     // Initialize app
afterAll(() => t.teardown());   // Cleanup
beforeEach(() => t.reset());    // Reset DB between tests

// In tests:
await t.asAuthenticatedUser();  // Create & authenticate user
t.api.get('/endpoint');         // Make authenticated requests
t.asUnauthenticated();          // Test without auth
```

### Shared Scenarios

Reuse common test patterns across all endpoints:

```typescript
// Auth guard - 4 tests for unauthenticated access
describeAuthGuard(() => api, 'POST', '/endpoint', { body: {} });

// Validation - test each validation rule
describeValidation(() => api, 'POST', '/endpoint', [
  { name: 'empty field', body: { field: '' } },
]);

// Not found - 404 for missing resources
describeNotFound(() => api, 'GET', (id) => `/items/${id}`);
```

### Factories

Generate unique test data:

```typescript
// Auto-incrementing, unique data
const task1 = buildCreateTaskData(); // { title: 'Task 1', ... }
const task2 = buildCreateTaskData(); // { title: 'Task 2', ... }

// With overrides
const customTask = buildCreateTaskData({ title: 'Custom' });

// Invalid data for validation tests
const invalid = buildEmptyTitleTaskData();
```

### Test Utilities

Standardized assertions:

```typescript
import { expectValidUuid, expectTaskShape, expectValidJwt } from '../helpers';

expectValidUuid(response.body.id);
expectTaskShape(response.body);
expectValidJwt(token);
```

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific module
npm run test:e2e -- --testPathPattern=tasks

# Run specific file
npm run test:e2e -- --testPathPattern=create-task

# Run with coverage
npm run test:e2e -- --coverage

# Run in watch mode
npm run test:e2e -- --watch
```

## Best Practices

1. **One endpoint per file** - Easy to find and maintain
2. **Use shared scenarios** - Don't repeat auth/validation tests
3. **Use factories** - Never hardcode test data
4. **Use constants** - Endpoints, status codes from fixtures
5. **Reset between tests** - Call `t.reset()` in beforeEach
6. **Test isolation** - Each test should be independent

## Scaling to 1000+ Endpoints

With this architecture:

- **Adding an endpoint** = 1 test file + 1 factory function + 1 endpoint constant
- **Auth guard tests** = 1 line of code (shared scenario)
- **Validation tests** = Array of test cases
- **No copy-paste** = All patterns are reusable
- **Consistent structure** = Easy onboarding for new developers

