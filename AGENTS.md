# Repository guide

- This is a dependency-free HTML5 Canvas game: there is no package manifest, build step, linter, or automated test suite.
- Run it by opening `index.html` directly, or serve the repository root with `npx serve .` (the README documents `http://localhost:3000`).
- `index.html` owns the fixed `800×600` `#canvas` and loads the entire game from `game.js`; keep those dimensions aligned with `W` and `H` in `game.js`.
- `game.js` is the single runtime unit: it contains input, entities, game state, rendering, and the `requestAnimationFrame` loop. Verify gameplay changes manually in a browser with arrow keys and Space.
- Game motion is frame-time based: update behavior through `update(dt)` and retain the `dt` cap in `loop()` to avoid large jumps after a stalled frame.
- Coordinates wrap through `wrap()` for the ship, bullets, and asteroids; preserve wrapping when adding moving game entities.
