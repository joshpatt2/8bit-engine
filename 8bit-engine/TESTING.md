# 8bit-engine Test Suite

Unit tests for the 8bit-engine using Vitest.

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test -- --coverage
```

## Test Coverage

### Engine Components

#### Input System (`input.test.ts`)
- ✅ Keyboard input detection
- ✅ Key press/release events
- ✅ WASD to arrow key mapping
- ✅ Button mappings (Z→A, X→B, Enter→Start, Shift→Select)
- ✅ `justPressed()` - single-frame detection
- ✅ Multiple simultaneous key presses
- ✅ Edge cases (unknown keys, rapid presses)

**10 tests passing**

#### WorldMap System (`world-map.test.ts`)
- ✅ Map construction and initialization
- ✅ Start node validation
- ✅ Node navigation (locked/unlocked)
- ✅ Directional pathfinding
- ✅ Node status updates (unlock, complete)
- ✅ Input-based navigation
- ✅ Scene cleanup
- ✅ Branching paths
- ✅ Diagonal node navigation

**16 tests passing**

#### Bitmap Font (`bitmap-font.test.ts`)
- ✅ Text mesh creation
- ✅ Character rendering (letters, numbers, special chars)
- ✅ Empty string handling
- ✅ Custom styling (color, scale, alignment)
- ✅ Preset text styles (title, subtitle, small)
- ✅ Letter spacing
- ✅ Edge cases (long text, unsupported chars)

**23 tests passing**

## Test Structure

Tests are organized in `src/__tests__/` with the following structure:

```
src/__tests__/
├── input.test.ts           # Input system tests
├── world-map.test.ts       # WorldMap navigation tests
└── bitmap-font.test.ts     # Bitmap font rendering tests
```

## Writing New Tests

Tests use Vitest with the following patterns:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { YourComponent } from '../engine/your-component'

describe('YourComponent', () => {
  beforeEach(() => {
    // Setup code
  })

  it('should do something', () => {
    // Arrange
    const component = new YourComponent()
    
    // Act
    const result = component.doSomething()
    
    // Assert
    expect(result).toBe(expected)
  })
})
```

## Coverage Goals

Current coverage: **49 tests across 3 core modules**

Future test targets:
- [ ] UI Components (Button, Label, Menu, etc.)
- [ ] Click Handler
- [ ] Game Loop
- [ ] Screen System
- [ ] Scene Manager
- [ ] Integration tests

## CI/CD

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm run test:run
```

## Debugging Tests

Use VS Code's built-in debugging or Vitest UI for debugging:

```bash
npm run test:ui
```

Then open http://localhost:51204/__vitest__/ in your browser.
