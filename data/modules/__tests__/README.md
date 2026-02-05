# Nakama JavaScript Module Tests

Unit tests for the Nakama JavaScript runtime modules.

## Setup

```bash
cd data/modules
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

## Test Structure

Tests are organized by feature:

- **Wallet Validation** - Amount validation, limits, sanitization
- **Achievement System** - Progress tracking, unlocks, rewards
- **Tournament System** - Ranking, rewards calculation
- **Daily Challenge** - Score tracking, leaderboards
- **Lucky Spin** - Prize selection, daily limits
- **Referral System** - Code generation, bonuses
- **Admin Permission** - Authorization checks
- **Shop Purchase** - Currency deduction
- **Season Pass** - Premium upgrades
- **Input Validation** - UUID, JSON, required fields
- **Array Safety** - Null pointer prevention (bug fixes)

## Mock Objects

Tests use mock implementations of Nakama runtime objects:

- `mockNk` - Mock Nakama runtime with storage, wallet, tournaments
- `mockLogger` - Mock logger for capturing log calls
- `createMockContext()` - Helper to create user context

## Adding New Tests

1. Create test file in `__tests__/` directory
2. Import mock objects from `index.test.js`
3. Use Jest's `describe`/`test` structure
4. Call `resetMocks()` in `beforeEach`

Example:
```javascript
describe('MyFeature', function() {
    beforeEach(resetMocks);
    
    test('should do something', function() {
        var ctx = createMockContext('user-123');
        // ... test logic
        expect(result).toBe(expected);
    });
});
```

## Coverage

Run `npm run test:coverage` to generate coverage reports in the `coverage/` directory.
