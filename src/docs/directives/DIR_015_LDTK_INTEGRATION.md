# Directive 015: Dynamic LDtk Map Integration and Legacy Asset Deprecation

## Objective
Completely decouple the core engine from hardcoded grid structures and migrate all level construction, tile collision handling, and entity population tracking strictly to dynamic LDtk data feeds.

## System Modifications
1. **Target File:** `src/engine/dungeon-core.js`
2. **Deprecations:** Eliminate all `import` hooks and runtime calculations looking for the obsolete variables `town1Map` and `TILE_TYPES`.
3. **Implementation:** 
   - Initialize and utilize the `LdtkLevelLoader` class instance to ingest level layer boundaries directly from `src/data/world/realms_of_infinity.ldtk`.
   - Update engine cell collision functions to dynamically query the parsed LDtk wall and floor grid arrays.
   - Replace manual tile ID checks for NPCs with runtime entity property queries processed through the LDtk map bundle data.
   - Resolve an initial player spawn from the LDtk `ZONE_IN_LOCATION` entity whose `Zone_In` field is `PLAYER_SPAWN`; validate its definition, grid bounds, and walkability.
   - If the authored spawn marker is absent, ambiguous, or invalid, choose the nearest walkable cell from a data-derived anchor and report the fallback. Do not add hardcoded per-level spawn coordinates.
   - Keep transition destinations and connections authored in LDtk; the engine should resolve them from level/entity data and use recovery behavior only when authored data is missing or invalid.
4. **Constraints:** Maintain standard ES module architecture. Do not inject static array code blocks or legacy configuration fallbacks.
