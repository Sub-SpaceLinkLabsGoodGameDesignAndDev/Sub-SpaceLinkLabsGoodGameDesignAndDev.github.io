# Directive 020: Definitive Character Creation Overhaul, Viewport Inversion Fix, and Point-Buy Integration

## Objective
Tear out all obsolete UI clutter, restrict the character selection carousel view box, implement a functional 15-point attribute Point-Buy system, fix combat flex-scaling layout inversion, and dynamically rename magic tabs to class-appropriate skill sheets.

## System Modifications
1. **Target Files:** `dungeoncrawl.html`, `src/engine/dungeon-core.js`, `css/dungeon.css`, and `css/dungeon-creation-carousel.css`

2. **Hyper-Focused Character Carousel View:**
   - Modify `#creation-carousel-track` to hide the long, horizontal scrolling file track. 
   - Restrict the visible layout bounds to show **only three class cards at any given time**: the currently active center card, the alphanumerically previous card on the left, and the alphanumerically next card on the right, wrapped seamlessly around the 9-class array loop.

3. **Obsolete UI Clutter Removal:**
   - Permanently delete the redundant inventory button and stats button from the bottom margins of the character selection layout screen.
   - Wipe out the persistent, obsolete placeholder text boxes sitting below the character sheets.

4. **15-Point Attribute Point-Buy System:**
   - Integrate a functional Point-Buy panel into the character creation interface. 
   - Provide standard plus/minus (`+` / `-`) button triggers next to core character attributes (Strength, Agility, Intellect, Stamina).
   - Start attributes at a baseline of 8, capping individual point allocation at 15. The system must track a pool of **15 Attributes Points** total, preventing the player from clicking "Embark" until all 15 points are fully allocated across the party member profiles.

5. **Dynamic Magic Tab Label Renaming:**
   - Refactor the right-hand panel sheets template. If the currently highlighted or selected hero card belongs to a melee profile (e.g., Rogue, Fighter, Berserker), programmatically alter the tab header label text string from "Magic" to "Skills" or "Abilities".

6. **Combat Viewport Layout Inversion Fix (Anti-Shrink Matrix):**
   - Locate the flex/grid behavior triggered inside `css/dungeon.css` upon entry into the combat encounter state loop.
   - **Enforce Strict Max Bounds:** Clamp the text event log window container to a hard, fixed maximum height boundary (maximum `20%` or a locked side margin panel column).
   - Force the 3D raycaster viewport canvas element to maintain its dominant screen layout sizing and pristine 16:9 pixel aspect ratio permanently during battle loops, completely forbidding it from shrinking or collapsing.

## Constraints
Maintain strict ES module structure. Protect all background movement ticks, initiative combat orders, and attrition clock loops.
