# Directive 019: Character Creation Controls Polish and Viewport Proportional Realignment

## Objective
Fix layout scale inversion to maximize the 3D raycaster box, implement full back-out selection states, wire an explicit name confirmation button, implement functional random party array generation, and convert the character selection slider into a true clickable carousel tracker.

## System Modifications
1. **Target Files:** `dungeoncrawl.html`, `src/engine/dungeon-core.js`, `css/dungeon.css`, and `css/dungeon-creation-carousel.css`
2. **Proportion Alignment (Anti-Inversion):**
   - Refactor the primary desktop flex/grid layouts. Clamp the text log window to a fixed, compact maximum size (e.g., maximum height `25%` or a narrow right-side column).
   - Enlarge the primary 3D raycaster canvas box so it takes up the dominant layout area of the screen while preserving its crisp 16:9 pixel aspect ratio.
3. **Character Creation State Rules & Backing Out:**
   - Modify the creation selection logic to allow full rollbacks. The user must be able to click any previously selected character slot or class card to back out, modify, or change their selection at any point up until the final "Embark" button is clicked.
4. **Name Input & Button Binding:**
   - Add a physical `<button id="confirm-name-btn">Confirm Name</button>` right next to the text entry input box in `dungeoncrawl.html`.
   - Wire a click listener to this button in `dungeon-core.js` so it submits and stores the character name identically to pressing the "Enter" key.
5. **Functional Random Party Generator:**
   - Replace the fake text string suggestion inside the random party generation function.
   - It must dynamically roll and select random valid objects from `character-creation.js`, inject them directly into your active party selection state array, and force a visual UI render pass to instantly populate the active character roster slots below.
6. **Carousel Click-to-Center Selection:**
   - Update the `#creation-carousel-track` behavior. Clicking a class card must programmatically center that card in the viewport view track, update its CSS layout class to `active-card`, and set the active class selection state.

## Constraints
Maintain the clean ES module layout. Do not alter active combat, clock step-counts, or attrition loops.
