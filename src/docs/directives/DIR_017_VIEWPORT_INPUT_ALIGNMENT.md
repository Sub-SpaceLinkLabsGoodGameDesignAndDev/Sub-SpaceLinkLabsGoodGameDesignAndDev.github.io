# Directive 017: Viewport Matrix Input Correction and UI Layout Realignment

## Objective
Restore physical camera rotation mechanics, separate strafe vectors from turning vectors, reintegrate click/touch navigation zones, and align the desktop/mobile interface layouts exactly to specification.

## Interface Architecture Layout Specification

### 1. Desktop Interface Layout (Flanked Grid Topology)
+-----------------------------------------------------------------------------+

| [NAV COMPASS HUD INDEX]   REALMS OF INFINITY - ALPHA CAMPAIGN  [E ──► EAST] |
+------------------------+------------------------------------+---------------+

| [ PORTRAIT COLUMN ]    |                                    | [ INIT QUEUE ]|
| +--------------------+ |    [ 3D RAYCASTER CANVAS VIEWBOX ] | ⮚ Rogue (AGL4)|
| | Hero 1: Valerie    | |    (16:9 Pixelated Window Screen)  | ⮚ Rat   (AGL4)|
| +--------------------+ |                                    | ⮚ Mage  (AGL3)|
| | Hero 2: Lysandra   | |    Foreground Captain Billboard:   +---------------+
| | [🩸 HP: 07/07]     | |    [ 512px Elite Skeleton ]        | [ TEXT LOGS ] |
| +--------------------+ |                                    +---------------+
| [ INVENTORY TRUNK  ] | |    Proximity Alpha Shield Trigger: |               |
| [ SKILLBOOK LEDGER ] | |    [ if (distance < 0.65) Alpha20% ]|               |
+------------------------+------------------------------------+---------------+

| [ LOWER ACTION BAR SLICE ]                                                  |
| ⮚ Melee: [Bash Maneuver I]  ⮚ Ammo: [Standard Bow]  ⮚ Magic: [Spark I]      |
+-----------------------------------------------------------------------------+

### 2. Mobile Responsive Interface Layout (390px Viewport Drop-Down)
+---------------------------------------+

| [ HUD COMPASS ANCHOR ]   [ N 👆 (N) ] |
+---------------------------------------+

|                                       |
|      [ 3D RAYCASTER VIEWPORT ]        |
|        (16:9 Canvas Viewer)           |
|                                       |
|    +-----------------------------+    |
|    |  [ 🎮 TRANSPARENT ZONES ]   |    |
|    |  Tap Left 25%: Look Left    |    |
|    |  Tap Right 25%: Look Right  |    |
|    |  Tap Center 50%: Move Fwd   |    |
|    +-----------------------------+    |
+---------------------------------------+

| [👤 TEAM GAUGE] [🎒 PACK] [📝 SYSTEM LOG] |  <── [ Hyper-Dense Sticky Tabs ]
+---------------------------------------+

|  [ D-PAD COMPACT NAV CLUSTER ]        |
|           [👆 FORWARD]                |
|    [👈 LEFT] [👇 AGENT] [👉 RIGHT]    |  <── [ Expanded Touch Targets ]
+---------------------------------------+

|  [ ACTIVE ACTION SLICE - DECK MODES ] |
|  [Maneuver I]  [Bow Rng]  [Spark I]   |  <── [ Super-Dense 2x2 Grid Menus ]
+---------------------------------------+

## System Modifications
1. **Target File:** `src/engine/dungeon-core.js` and `css/dungeon-creation-carousel.css`
2. **Keyboard Configuration Fix:** Separate turning code loops from horizontal sidestepping variables. Left/Right arrows must rotate player angle coordinates.
3. **Viewport Interaction Regions:** Click/Tap on the left 25% sectors must turn left, right 25% must turn right, and central 50% must step the player forward.
4. **CSS Bounds Fix:** Fix flex/grid dimensions so the lower action bar slice trays do not clip below the browser window margins on desktop screen layouts.
