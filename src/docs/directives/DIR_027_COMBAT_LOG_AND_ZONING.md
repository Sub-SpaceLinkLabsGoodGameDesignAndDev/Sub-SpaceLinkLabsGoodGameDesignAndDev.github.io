# Directive 027: Initiative Parallelism, Surprise Mechanics, Gore Logging, Floor Loot, and Oakhaven Map Restrictions

## Objective
Enforce shared initiative rolling formulas across heroes and monsters, implement surprise round checks, inject gritty RPG combat narrative flavor, activate the FLOOR_LOOT entity loop, and restrict zoning boundaries strictly to Oakhaven and its connecting Sewer tracking networks.

## System Modifications
1. **Target Files:** `src/engine/dungeon-core.js`, `src/engine/map-router.js`, `src/systems/initiative-core.js`, and `src/data/entities/BaseEntity.js`

2. **Parallel Initiative & Surprise Round Evaluators:**
   - **Shared Mechanics Loop:** Force monsters to calculate active combat initiative rolls using the exact same mathematical agility-sorting formulas as your party heroes. No hardcoded priority bias values are permitted.
   - **Surprise Round Trigger:** Upon encounter initialization, run a comparative check between your party's average alertness attribute and the monster group's stealth configuration vector. If triggered, print a prominent warning banner inside the log window identifying which side secures the tactical surprise ambush loop phase.

3. **Gritty RPG Combat Text Log & Auto-Scroll Protection:**
   - **Log Layout Padding Fix:** Adjust CSS and appends to ensure the bottom edge of your log textbox container completely displays text strings without clipping or cutting off frames. 
   - **Exploration Noise Filtration:** Enforce total suppression of navigation ticks (coordinates, movement vectors, raw compass turns).
   - **Authorized Narrative Injection (Flavor & Gore Matrix):** Restrict text prints strictly to critical tactical milestones written with gritty RPG flavor:
     - Turn announcements ("Whose turn it currently is").
     - Actions, hits, damage calculations, and defenses.
     - Critical descriptions for Misses, Resists, Failures, Crits, Blocks, Dodges, and Ripostes.
     - Gritty monster skill warnings and dramatic, gory death messages.
     - Discoveries, inventory search execution alerts, and environment trap logs.

4. **FLOOR_LOOT Interaction Logic:**
   - Wire the engine collision loops to actively identify the **`FLOOR_LOOT`** entity layer placed within your map area.
   - Stepping onto a coordinate containing a `FLOOR_LOOT` entity must prompt an interactive container ledger tab, allowing items to be transferred directly to your active inventory trunk array.

5. **Strict Oakhaven & Sewer Testing Zoning Restraints:**
   - Restrict the level router configuration bounds strictly to the **Oakhaven Town hub (Safe Zone)** and its immediate connecting **Sewer system maps (Danger Zone)**. Disable all outer world exits leading beyond these clusters.
   - **Active Field Instance Transits:** Hardwire active scene-transition event hooks exclusively onto the following two LDtk point entities:
     - **`OakhavenToSewer_Down`** (located inside map layer `Oakhaven_3`) must dynamically unbind the surface layout and execute a downward load function straight into the `Oakhaven_SewerSystem_1` matrix.
     - **`SewerToOakhaven_Up`** (located inside map layer `Oakhaven_SewerSystem_1`) must execute the inverse upward transition back to the Oakhaven surface grid.
   - **Horizontal Butted Border Openings:** Allow seamless, tile-to-tile map stitching thresholds *only* for direct edge-sharing connections (e.g., surface town map directly to surface town map, or sewer network map directly to sewer network map). 
   - **Void Boundary Protection Matrix:** Freeze or block player movement tracking at any border perimeter opening that does not feature a corresponding, explicitly active butted map file or field entity instance. This completely forbids the player from stepping off the constructed world grid into unrendered emptiness.
   - **Dynamic Tile Terrain Attrition System:** Refactor the engine movement loop to dynamically query tile archetype layers directly from the active parsed LDtk cell data. Moving across cells painted with environmental hazard metadata (such as swamp, toxic sludge, or custom terrain types configured inside the LDtk workspace) must instantly map and trigger class-appropriate status attrition counters, resource damage calculations, and localized random monster group encounter weights to verify the party's survival loops.
