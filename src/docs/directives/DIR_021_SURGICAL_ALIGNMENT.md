# Directive 021: Surgical Stat Alignment, Chronological Initiative, and UI Overhaul

## Objective
Enforce absolute numerical constraints on point-buy systems, link interface gauges directly to true entity attributes, restore chronological turn tracking, eliminate layout redundancy, and lock text auto-scrolling to the bottom.

## System Modifications
1. **Target Files:** `dungeoncrawl.html`, `src/engine/dungeon-core.js`, `css/dungeon.css`, and `src/data/entities/BaseEntity.js`

2. **Attribute & Point-Buy Constraints:**
   - Tear out the placeholder stats panel (*Vitality 100, Gold*). Replace it with real dynamic data fields pulling from your core definitions: **Strength (STR), Agility (AGI), Intellect (INT), and Stamina (STA)**.
   - **Point-Buy Math Rule:** Each class must load its own unique baseline stats from `character-creation.js`. The minimum attribute floor is **2**, and the absolute maximum cap after buying is **9**. Clicking `+` / `-` must update the remaining pool, instantly recalculate dependent health pools (HP), mana pools (MP), and stamina tracks (ST), and dynamically redraw a canvas-based radar/web graphic polygon.

3. **UI Redundancy Cleanup Matrix:**
   - Delete the upper-left redundant randomize button that is blocking the lower layout names.
   - Delete the lower, inactive Embark button. Keep only the single, active upper Embark button next to the class lists.

4. **Chronological Initiative Turn Tracking:**
   - Fix the combat state engine in `dungeon-core.js`. Forbid the player from jumping between characters freely. 
   - Combat must follow a strict, chronological round loop sorted by Agility (AGI). The single actor (hero or monster) at the top of the initiative queue takes their turn, processes their action, updates the text log, and passes control to the next immediate actor in line.

5. **Combat UI Scale & Text Auto-Scroll:**
   - Shrink the oversized combat targeting buttons. Apply clean, compact, pixelated framing styles to them.
   - Fix the text event log container: enforce `overflow-y: scroll;` and force the script to execute `logWindow.scrollTop = logWindow.scrollHeight;` every time a new line is printed, ensuring the most current combat updates remain locked at the absolute bottom of the frame.
