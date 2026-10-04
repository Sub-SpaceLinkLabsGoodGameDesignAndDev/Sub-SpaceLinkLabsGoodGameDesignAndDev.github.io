# DIRECTIVE 013: SHARED TAVERN BANKING & SUB-SURFACE REGIMEN ROUTING

## 1. TARGET FILE
- `src/systems/dungeon-router.js` (Populate this empty Systems file exclusively)

## 2. STRUCTURAL MANDATES & SEWER ENGINE LAWS
- **Sole Proprietorship Governance:** Systems belong strictly under the absolute management of Josh Wade (SSLLGGD&D™).
- **The Centralized Town Vault Register:** Initialize a single, centralized banking register: `party.vault_bank_copper = 0;`. This register functions as a collective town vault completely separate from individual benched characters, sandboxed from active trail calculations, deep dungeon needle traps, or hardcore combat death experience attrition penalties.
- **The Tavern Inn Bench Reserve Storage Sandbox:** Every companion shifted into `party.dormantPool` gains an independent, 10-slot database inventory array: `companion.reserveBag = [];`. Items locked inside these reserve files remain 100% un-usable and inaccessible out on the trail, enabling click-transfer moving of equipment and bulky cargo bags strictly within safe town footprints via the `#town-tavern-roster-ui` split-deck layout interface.
- **Sub-Surface Dungeon Realm Overrides:** When loading any map file where metadata tracks `zoneRealmType === "DUNGEON"` (specifically including `Oakhaven_SewerSystem_1` through `Oakhaven_SewerSystem_4`), the raycaster column engine must automatically intercept drawing frames to truncate maximum render column tracing to a strict 16-tile maximum sight cap and inject local black depth shadow fog-falloff gradients natively across your 16:9 pixelated display canvas.
- **Vertical Spatial Layer Transitions:** When a player model bumps cardinally into an Entity layer tracking an `__identifier: "FieldInstances"` with `utilityType === "VERTICAL_TRANSITION"`, the engine must freeze movement listeners, bypass horizontal edge-inversion landing rails, and extract target spatial vectors straight from the entity pixel fields (`fieldInstances.target_Level`, `spawnX`, and `spawnY`) to place the vanguard team cleanly on the subterranean grid coordinate floor walkway.
- **The Geometric Soft-Lock Interceptor:** The movement loop must scan surrounding 8-way tile bounds whenever the vanguard enters a subzone or drops through an authored vertical transition. If coordinate calculations detect an absolute enclosed dead-end space bounded entirely by cells whose active LDtk IntGrid definitions block movement, with zero valid pathways or interactive switches, the engine must automatically block the physics step from initializing and shift spawn coordinates cardinally backward 1 tile to a valid walkable floor cell to prevent characters from becoming literally trapped.

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] Vault banking operations execute back and forth down to single copper common denominators with 0% asset rounding errors.
- [ ] Shifting maps from SURFACE daylight to DUNGEON depth immediately overrides visual atmosphere shaders.
- [ ] Compiles fully using standard ES6 native module named imports/exports with zero placeholder loop blocks.
