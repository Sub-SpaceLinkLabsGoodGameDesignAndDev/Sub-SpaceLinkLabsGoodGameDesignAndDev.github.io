# Directive 018: Character Creation Carousel, Encounter Camera Snapping, Turn Queue Processing, and Viewport Targeting

## Objective
Overhaul character selection layouts, implement automatic encounter camera-snapping, isolate combat targeting click events, force active monster turn processing, and clamp desktop layout dimensions while fully protecting clock and attrition counters.

## System Modifications
1. **Target Files:** `dungeoncrawl.html`, `src/engine/dungeon-core.js`, and `css/dungeon-creation-carousel.css`
2. **Character Creation Overhaul:**
   - Replace static hero selection containers inside `dungeoncrawl.html` with a horizontal scrolling flex track (`#creation-carousel-track`).
   - Fix layout bounds so all selectable classes (including the Rogue) display completely without edge clipping.
3. **Encounter Camera Snapping & Clock/Attrition Protection:**
   - In `dungeon-core.js`, hook camera centering directly into the entry point of the combat initialization sequence.
   - Calculate the angle between the player and monster vectors, snapping the player's view matrix to face the target dead-center (exclude surprise rounds).
   - **CRITICAL RESTRICTION:** This camera realignment must be treated as a visual post-process effect. It must NOT reset the game step-counter, alter the round tick-count, or clear active attrition/status decay listeners.
4. **Active Monster Turn Processing:**
   - Refactor the combat loop in `dungeon-core.js`. Do not force the combat state to hang indefinitely waiting for manual player skips if the action queue dictates the monster holds initiative.
   - When a monster's initiative tick is active, process its combat profile attack automatically, log the output, and hand turn state back to the player.
5. **Combat Targeting Isolation:**
   - If combat is active and the user clicks the monster sprite billboard, bypass the canvas 25%/50%/25% movement overlays and route the input directly to the combat selection logic.
6. **Layout Clamping:**
   - Clamp the maximum height of the primary desktop viewport container to `100vh` to eliminate page scrolling.

## Constraints
Maintain the active ES module structure. Keep running asset path image placeholders stable if custom artwork files are missing.
