# DIRECTIVE 005: BASE-16 CALCULATION CLOCK ENGINE & MOVEMENT PHYSICS

## 1. TARGET ENGINE FILE
- `src/engine/map-router.js` & `handlePlayerMovementPhysics()` (Populate these script rows exclusively)

## 2. STRUCTURAL MANDATES & TEMPORAL CALCULATION LOOPS
- **Sole Proprietorship Governance:** Systems belong strictly under the absolute management of legal owner Josh Wade (SSLLGGD&D™).
- **Asymmetric Grid Dimension Extraction:** The physics and raycasting engines are strictly prohibited from assuming static map size constants. Dimensions must be queried fluidly from the actively loaded level payload array upon transition hops:
  `Active Map Height = currentMapData.length;`
  `Active Map Width = currentMapData[0].length;`
- **Base-16 Symmetrical Pacing Equation:** The global world clock engine register (`window.worldTimeMinutes`) must increment by exactly +1 Game World Minute the precise millisecond any combination of 16 collective action ticks (traversal steps, tactical combat turns, or manual search item operations) is successfully logged by the manager.
- **The Tri-Pool Innate Regeneration Pulse:** The exact millisecond a Game World Minute register advances, trigger the global recovery sweep across all active traveling vanguard companion slots:
  * Restoring +1 HP, +1 MP, and +3 Stamina Points while navigating Hazardous Territories.
  * Scaling up to restore +3 HP, +3 MP, and +6 Stamina Points simultaneously while resting inside Safe-Zone Town Footprints (`Safe_Zone: true` field instance checked).
- **The Shared Traversal Attrition Squeeze:** If an individual companion siphons their personal Stamina register down to absolute 0, append a persistent +15% Localized Commotion Noise Penalty to the step counter per exhausted head, aggressively multiplying random bestiary encounter frequencies across lawless overworld paths.
- **Asymmetric Branching Boundary Portal Routing:** When a character's position vector breaches an outer map layout coordinate index line (X < 0, X > width, Y < 0, Y > height), the map router must asynchronously launch the promise chain loader to fetch the target level destination specified inside the active metadata parameters, applying the Fluid Landing Rail Clamping smoothly to prevent characters from clipping into structural walls.

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] World time updates natively relative to active travel progress with zero baseline reliance on background hardware clocks.
- [ ] Short conversational dialogue text options and town merchant storefront operations safely freeze temporal advance (0 minutes consumed).
- [ ] Compiles fully without syntax errors or missing placeholder dependency references.
