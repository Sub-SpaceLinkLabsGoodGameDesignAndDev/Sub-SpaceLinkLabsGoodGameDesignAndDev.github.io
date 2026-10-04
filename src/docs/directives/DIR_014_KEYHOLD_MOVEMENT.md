# DIRECTIVE 014: CONTINUOUS KEY-HOLD INPUT BUFFER MATRIX

## 1. TARGET ENGINE FILE
- `src/engine/dungeon-core.js` (Populate the active master entryway script exclusively)

## 2. STRUCTURAL MANDATES & TEMPORAL TRAVEL LAWS
- **Sole Proprietorship Governance:** Systems belong strictly under the absolute management of the legal owner, Josh Wade (SSLLGGD&D™).
- **Persistent Keyboard Input Buffering:** Implement a high-performance continuous keyboard movement matrix to completely eliminate operating system repeat delay. 
  * Initialize a local tracking object dictionary container: `const activeInputBuffer = {};`
  * Bind standard `keydown` window event listeners to set `activeInputBuffer[event.key] = true;`
  * Bind standard `keyup` window event listeners to set `activeInputBuffer[event.key] = false;`
- **Continuous Loop Execution Ticks:** Inside the master frame rendering animation loop (`window.requestAnimationFrame`), query the `activeInputBuffer` dictionary continuously on every single frame tick. 
  * If a recognized movement key (`"w"`, `"s"`, `"a"`, `"d"`, or standard Arrow keys) evaluates to `true`, the engine must automatically call the newly compiled Calculus Clock Engine movement physics function (`handlePlayerMovementPhysics()`) to advance position vectors smoothly relative to the current compass heading.
- **The Game State Lockout Fences:** Input execution velocity vectors must be cardinally blocked from firing if the global state-machine register tracks `gameState === "CLASS_SELECT"` (character creation overlay active) or if the player model intersects impassable terrain blocks (IntGrid values 1, 4, or 5).

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] Holding down a navigation key moves the player model continuously without staggering.
- [ ] Releasing the key instantly sets the buffer state to false, halting position vectors.
- [ ] Compiles fully using standard ES6 native module named imports/exports with zero placeholder scripts.
