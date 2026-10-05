# Directive 016: Data and Combat Module Wiring Architecture

## Objective
Populate the missing system dependencies and export definitions to resolve module resolution failures and allow the engine to complete its browser startup sequence.

## System Modifications
1. **Target Files:** 
   - `src/systems/combat-formulas.js` (Currently empty)
   - `src/systems/initiative-core.js` (Currently empty)
   - `src/data/entities/BaseEntity.js` (Needs to export entityFactory)
   - `src/systems/character-creation.js` (Needs to export CLASS_DATA)
   - `src/data/monsters/index.js` (Needs to export monsterCatalog)

2. **Implementation Requirements:**
   - **combat-formulas.js**: Export a `CombatFormulas` object/class implementing standard calculations for base damage, hit modification, and stat scaling.
   - **initiative-core.js**: Export an initiative sorting framework to track combat turn order.
   - **BaseEntity.js**: Add and export an `entityFactory` method that takes an LDtk entity definition (IID, type, custom fields) and instantiates a new entity actor.
   - **character-creation.js**: Export `CLASS_DATA` containing structural arrays for starter classes, attributes, and panel slice-tray baseline properties.
   - **monsters/index.js**: Export `monsterCatalog` containing data structures for monster tiers matching the LDtk layout profiles.

3. **Constraints:** Do not introduce feature scope creep. Maintain strict compatibility with the variable signatures currently expected by `src/engine/dungeon-core.js`.
