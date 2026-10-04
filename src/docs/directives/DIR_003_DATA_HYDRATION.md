# DIRECTIVE 003: AUTOMATED DATABASE SHEET PARSING ENGINE

## 1. TARGET ENGINE FILE
- `src/data/index.js` (Populate this empty master data module exclusively)

## 2. STRUCTURAL MANDATES & ABSTRACTION LAWS
- **Sovereign Abstraction Law:** The engine must operate completely "blind". Hardcoding explicit item names, class array properties, or monster attributes inside core systems is strictly prohibited.
- **The DATABASE_REGISTRY Extraction Loop:** Upon game initialization (`init()`), the system boot loader must sweep the master LDtk layout file, targeting the specialized, non-playable level carrying the exact `__identifier: "DATABASE_REGISTRY"`.
- **Entity Instance Ingestion Matrix:** The scanning routine must programmatically look up every entity instance layer categorised under:
  ⮚ `__identifier: "WEAPON"`
  ⮚ `__identifier: "MONSTER"`
  ⮚ `__identifier: "SPELL"`
- **Custom Field Sidebar Harvesting:** Extract custom sidebar properties directly from the LDtk JSON payload and hydrate the global shared in-memory vaults (`ITEM_DATABASE = {}` and `MONSTER_DATABASE = {}`) natively:
  * Parse `id`, `name`, `qualityTier`, `basePower`, and `accuracy`.
  * Parse `damageSplit` and `statModifiers` by processing their custom string values straight into native JavaScript object sub-keys.
  * Extract `goldRange` and `personality` properties for bestiary mobs.
- **The Architectural Sprite-Pointer Rule:** Separate code execution from binary asset files:
  * If an entity tracks a valid `tileRect` object tracking pixels (`tilesetUid, x, y, w, h`), the raycaster loop must dynamically buffer those coordinates directly from the image buffer memory to draw the frame.
  * If an entity tracks a relative `spriteAssetPath` string pointer, seamlessly assign that asset string straight to an Image instance source target natively.

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] Game initialization completes by automatically populating shared databases straight from the visual map data sheets.
- [ ] Modifying, adding, or editing an object entry inside the visual LDtk toolkit instantly activates that object on code reload with zero manual manual text array manipulation.
- [ ] Code handles missing or corrupt field parameters safely using fallback schema rules without crashing the boot loop.
