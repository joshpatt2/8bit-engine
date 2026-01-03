# Implementation Plan Checklist

This checklist provides a step-by-step guide for implementing the Screen/Scene refactoring.

## Prerequisites

- [x] Current architecture analyzed
- [x] Design document created (`SCREEN_SCENE_REFACTOR_DESIGN.md`)
- [x] Architecture comparison created (`ARCHITECTURE_COMPARISON.md`)
- [x] Quick reference created (`REFACTOR_QUICK_REFERENCE.md`)
- [ ] Design reviewed and approved by stakeholders
- [ ] Decision made on version numbering (recommend v2.0.0)
- [ ] Decision made on backward compatibility approach

## Phase 1: Create Internal Infrastructure (Non-Breaking)

**Goal:** Add new abstractions without breaking existing code.

### SceneRenderer Implementation

- [ ] Create `/src/engine/scene-renderer.ts`
  - [ ] Add `SceneRenderer` class with private THREE.js members
  - [ ] Implement `constructor(container, width, height, cameraConfig)`
  - [ ] Implement `render()` method
  - [ ] Implement `addObject(object)` method
  - [ ] Implement `removeObject(object)` method
  - [ ] Implement `clear()` method with proper disposal
  - [ ] Implement `setBackgroundColor(color)` method
  - [ ] Implement `addAmbientLight(intensity)` method
  - [ ] Implement `getThreeScene()` escape hatch
  - [ ] Implement `getCamera()` helper
  - [ ] Implement `getDomElement()` helper
  - [ ] Add JSDoc comments
  - [ ] Handle disposal/cleanup properly

### Engine Initialization

- [ ] Create `/src/engine/engine-init.ts`
  - [ ] Add `EngineConfig` interface
  - [ ] Add camera configuration options
  - [ ] Implement `Engine` class
  - [ ] Implement engine constructor
  - [ ] Create internal `SceneRenderer` instance
  - [ ] Create `Input` instance
  - [ ] Create `ScreenManager` instance
  - [ ] Create `GameLoop` instance
  - [ ] Implement `getRenderer()` method
  - [ ] Implement `getInput()` method
  - [ ] Implement `getScreenManager()` method
  - [ ] Implement `start()` method
  - [ ] Implement `stop()` method
  - [ ] Add JSDoc comments
  - [ ] Handle resize events

### Testing Phase 1

- [ ] Add unit tests for `SceneRenderer`
  - [ ] Test object add/remove
  - [ ] Test clear/disposal
  - [ ] Test background color
  - [ ] Test lighting
  - [ ] Test escape hatches
- [ ] Add unit tests for `Engine`
  - [ ] Test initialization
  - [ ] Test getter methods
  - [ ] Test start/stop
- [ ] Verify all existing tests still pass
- [ ] No regression in functionality

### Code Review Phase 1

- [ ] Self-review SceneRenderer implementation
- [ ] Self-review Engine implementation
- [ ] Check for memory leaks
- [ ] Check for proper disposal
- [ ] Verify no exports in `index.ts` yet

## Phase 2: Refactor BaseScreen (Breaking)

**Goal:** Update Screen API to use SceneRenderer instead of THREE.js directly.

### BaseScreen Refactoring

- [ ] Modify `/src/engine/screen.ts`
  - [ ] Update `BaseScreen` constructor signature
    - [ ] Remove `scene: THREE.Scene` parameter
    - [ ] Remove `camera: THREE.Camera` parameter
    - [ ] Remove `renderer: THREE.WebGLRenderer` parameter
    - [ ] Add `renderer: SceneRenderer` parameter
  - [ ] Update class members
    - [ ] Remove `protected scene: THREE.Scene`
    - [ ] Remove `protected camera: THREE.Camera`
    - [ ] Remove `protected renderer: THREE.WebGLRenderer`
    - [ ] Add `protected renderer: SceneRenderer`
  - [ ] Update `clearScene()` to use `renderer.clear()`
  - [ ] Update `setBackground()` to use `renderer.setBackgroundColor()`
  - [ ] Update `addAmbientLight()` to use `renderer.addAmbientLight()`
  - [ ] Add `addToScene(object)` helper method
  - [ ] Add `removeFromScene(object)` helper method
  - [ ] Update `onRender()` to use `renderer.render()`
  - [ ] Update `enableClickHandling()` to use SceneRenderer getters
  - [ ] Update JSDoc comments

### TitleScreen Refactoring

- [ ] Modify `/src/engine/title-screen.ts`
  - [ ] Update constructor signature
    - [ ] Remove THREE.js parameters
    - [ ] Add `renderer: SceneRenderer` parameter
  - [ ] Update super() call
  - [ ] Replace `this.scene.add()` with `this.addToScene()`
  - [ ] Replace `this.scene.remove()` with `this.removeFromScene()`
  - [ ] Update `onSetupVisuals` callback usage
    - [ ] Get THREE.Scene via `renderer.getThreeScene()`
    - [ ] Pass to callback
  - [ ] Update all scene manipulations
  - [ ] Update JSDoc comments

### MapScreen Refactoring

- [ ] Modify `/src/game/map-screen.ts`
  - [ ] Update constructor signature
  - [ ] Update super() call
  - [ ] Update WorldMap creation
    - [ ] Get THREE.Scene via `renderer.getThreeScene()`
    - [ ] Pass to WorldMap constructor
  - [ ] Replace scene manipulations with helpers
  - [ ] Update JSDoc comments

### Testing Phase 2

- [ ] Update Screen-related tests
  - [ ] Mock SceneRenderer instead of THREE.Scene
  - [ ] Test BaseScreen with new API
  - [ ] Test TitleScreen with new API
- [ ] Create integration tests
  - [ ] Test screen creation
  - [ ] Test screen transitions
  - [ ] Test rendering
- [ ] Verify all tests pass
- [ ] Manual testing
  - [ ] Run map-demo.ts (update it temporarily)
  - [ ] Verify TitleScreen renders correctly
  - [ ] Verify MapScreen renders correctly
  - [ ] Verify screen transitions work

### Code Review Phase 2

- [ ] Review BaseScreen changes
- [ ] Review TitleScreen changes
- [ ] Review MapScreen changes
- [ ] Check for API consistency
- [ ] Verify error handling
- [ ] Check memory management

## Phase 3: Update Game Layer (Breaking)

**Goal:** Remove Scene abstraction and use Screen directly.

### Delete Scene System

- [ ] Delete `/src/game/scenes.ts`
  - [ ] Remove `Scene` interface
  - [ ] Remove `SceneType` type
  - [ ] Remove `SceneManager` class

### Remove Scene Adapters

- [ ] Delete `/src/game/title-scene.ts`
  - [ ] Delete `createTitleScene` function
  - [ ] Remove all adapter code
- [ ] Delete `/src/game/map-scene.ts`
  - [ ] Delete `createMapScene` function
  - [ ] Remove all adapter code
- [ ] Delete `/src/game/level-scene.ts`
  - [ ] Delete `createLevelScene` function
  - [ ] Remove all adapter code

### Create Direct Screen Implementations

- [ ] Modify `/src/game/index.ts`
  - [ ] Remove Scene imports
  - [ ] Add Engine import
  - [ ] Create `Engine` instance
  - [ ] Create game-specific Screen classes
    - [ ] `GameTitleScreen extends BaseScreen`
      - [ ] Move title-scene.ts logic here
      - [ ] Use high-level API
    - [ ] `MapScreen extends BaseScreen`
      - [ ] Move map-scene.ts logic here
      - [ ] Use high-level API
    - [ ] `Level1Screen extends BaseScreen`
      - [ ] Move level-scene.ts logic here
      - [ ] Use high-level API
    - [ ] `Level2Screen extends BaseScreen`
    - [ ] `Level3Screen extends BaseScreen`
  - [ ] Register screens with ScreenManager
  - [ ] Use `engine.start()` instead of manual game loop
  - [ ] Remove THREE.js object creation
  - [ ] Update level status tracking
  - [ ] Test screen transitions

### Update Map Demo

- [ ] Modify `/src/map-demo.ts`
  - [ ] Remove THREE.js object creation
  - [ ] Use Engine initialization
  - [ ] Create MapScreen with new API
  - [ ] Use `engine.start()`
  - [ ] Test thoroughly

### Testing Phase 3

- [ ] Test demo game end-to-end
  - [ ] Title screen displays correctly
  - [ ] Press Start goes to map
  - [ ] Map navigation works
  - [ ] Level selection works
  - [ ] Levels play correctly
  - [ ] Level completion works
  - [ ] Back to map works
  - [ ] All transitions smooth
- [ ] Test map-demo.ts
  - [ ] Map displays correctly
  - [ ] Navigation works
  - [ ] Node selection works
- [ ] Performance testing
  - [ ] Check FPS
  - [ ] Check memory usage
  - [ ] Check for leaks
- [ ] Browser compatibility
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

### Code Review Phase 3

- [ ] Review game/index.ts changes
- [ ] Review Screen implementations
- [ ] Check for code duplication
- [ ] Verify clean separation of concerns
- [ ] Check error handling
- [ ] Verify all cleanup code

## Phase 4: Documentation and Finalization

**Goal:** Update all documentation and examples.

### Export Updates

- [ ] Modify `/src/engine/index.ts`
  - [ ] Export `Engine` class
  - [ ] Export `EngineConfig` interface
  - [ ] DO NOT export `SceneRenderer` (keep internal)
  - [ ] Verify all necessary types exported
  - [ ] Remove any Scene-related exports

### README Updates

- [ ] Modify `README.md`
  - [ ] Update "Quick Start" section
    - [ ] Show Engine initialization
    - [ ] Show new Screen creation
  - [ ] Update "Screen System" section
    - [ ] Remove Scene references
    - [ ] Document new API
    - [ ] Add Engine documentation
    - [ ] Add SceneRenderer escape hatch docs
  - [ ] Update "State Management" section
    - [ ] Remove "Scenes: Legacy" note
    - [ ] Recommend Screen system only
  - [ ] Update code examples throughout
  - [ ] Update Architecture Decisions section
  - [ ] Add migration guide link
  - [ ] Update version number

### Create Migration Guide

- [ ] Create `MIGRATION_V1_TO_V2.md`
  - [ ] Document breaking changes
  - [ ] Provide before/after examples
  - [ ] List all API changes
  - [ ] Provide step-by-step migration
  - [ ] Add troubleshooting section
  - [ ] Add FAQ

### Update Other Documentation

- [ ] Check `SPRITES.md`
  - [ ] Update any Screen/Scene references
  - [ ] Update code examples
- [ ] Check `WORLD_MAP.md`
  - [ ] Update any Screen/Scene references
  - [ ] Update code examples
- [ ] Check `TESTING.md`
  - [ ] Update test examples
- [ ] Update package.json
  - [ ] Bump version to 2.0.0
  - [ ] Update description if needed

### Testing Documentation

- [ ] Test all code examples in README
- [ ] Test Quick Start guide
- [ ] Test migration guide steps
- [ ] Verify all links work
- [ ] Check for typos

### Code Review Phase 4

- [ ] Review all documentation changes
- [ ] Verify accuracy of examples
- [ ] Check for consistency
- [ ] Verify migration guide is complete

## Phase 5: Final Testing and Release

**Goal:** Comprehensive testing before release.

### Final Test Suite

- [ ] Run full test suite
  - [ ] All unit tests pass
  - [ ] All integration tests pass
  - [ ] Code coverage acceptable
- [ ] Run demo game extensively
  - [ ] Play through all levels
  - [ ] Test all transitions
  - [ ] Test pause/resume
  - [ ] Look for visual glitches
  - [ ] Check performance
- [ ] Run map-demo.ts
  - [ ] Full functionality check
- [ ] Manual testing checklist
  - [ ] Create new screen works
  - [ ] Engine initialization works
  - [ ] Screen transitions work
  - [ ] WorldMap integration works
  - [ ] Input handling works
  - [ ] Rendering works
  - [ ] Cleanup/disposal works

### Performance Testing

- [ ] FPS testing
  - [ ] Maintain 60 FPS target
  - [ ] No frame drops
- [ ] Memory testing
  - [ ] No memory leaks
  - [ ] Proper disposal
  - [ ] Multiple screen transitions ok
- [ ] Load testing
  - [ ] Multiple Engine instances
  - [ ] Rapid screen switching

### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Chrome (mobile)
- [ ] Safari (mobile)

### Pre-Release Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] No console warnings
- [ ] Documentation complete
- [ ] Examples work
- [ ] Migration guide complete
- [ ] Version number updated
- [ ] CHANGELOG updated
- [ ] Git tags created

### Release

- [ ] Merge to main branch
- [ ] Create GitHub release
- [ ] Tag version 2.0.0
- [ ] Publish release notes
- [ ] Announce breaking changes
- [ ] Update any dependent projects

## Rollback Plan

If critical issues are found:

- [ ] Document the issue
- [ ] Assess severity
- [ ] If critical:
  - [ ] Revert merge
  - [ ] Create hotfix branch
  - [ ] Fix issue
  - [ ] Re-test
  - [ ] Re-release

## Success Criteria

- [ ] ✅ No THREE.js in Screen interface
- [ ] ✅ No THREE.js in BaseScreen constructor
- [ ] ✅ Single abstraction: Screen (no Scene)
- [ ] ✅ Game code doesn't create THREE objects
- [ ] ✅ All existing tests pass
- [ ] ✅ Demo game works identically
- [ ] ✅ map-demo works
- [ ] ✅ Performance maintained
- [ ] ✅ Documentation complete
- [ ] ✅ Migration guide created
- [ ] ✅ Code cleaner than before

## Notes

- Keep this checklist updated as work progresses
- Mark items complete with dates
- Document any deviations from plan
- Note any issues discovered
- Track time spent per phase

---

**Status:** Planning Complete, Ready for Implementation  
**Version:** 1.0  
**Last Updated:** 2026-01-03
