# Directive 024: Exploration HUD Infrastructure, Minimap Fog-of-War, and Quest Tracking

## Objective
Implement a dedicated exploration HUD matrix directly over or adjacent to the 16:9 Raycaster viewport. This moves coordinate/cardinal orientation out of the text log and into constantly updating visual indicators, alongside a persistent quest log tracking system.

## System Modifications
1. **Target Files:** `dungeoncrawl.html`, `src/engine/dungeon-core.js`, and `css/dungeon.css`

2. **Raycaster Viewport Floating HUD Matrix & Rolling Compass Window:**
   - Mount a dedicated, high-density HUD element container layer directly *inside* the 16:9 Raycaster viewport canvas bounds (anchored securely at either the absolute top or bottom margin edges).
   - **Dimensions & Backdrop Aesthetics:** Form the container layout as a short-height box window spanning roughly 3 to 5 times its width. Enforce a semi-transparent, weathered map/parchment tan background fill color (e.g., `rgba(210, 180, 140, 0.45)`).
   - **Horizontal Carousel Rolling Tape Loop:** As the player fluidly rotates across 360 degrees, the heading elements must glide seamlessly left and right across the window frame.
   - **FOV Rendering Constraint:** Enforce a strict **150-degree panoramic Field of View (FOV)** across the visible bounding window container. The rendering engine must calculate the heading projection math so that exactly 150 degrees of heading marks are distributed dynamically across the tape box at any given time.
   - **Font & Graphic Styles:** Render all text markers using a thick, bold, block/pixelated-style font colored in absolute white. 
   - **Hierarchical Text Sizing:** The main cardinal letters (**N, E, S, W**) must render **1.5 to 2 times larger** than the adjacent sub-degree numbers and intermediate tick markings to provide immediate visual tracking.
   - **Quest Navigation Pointer Routing Architecture:** Design the engine loop to accommodate floating, color-coded visual indicator dots or arrows overlaying the tape. These trackers will serve as active, dynamic navigational targets that guide the player toward locked quest pins or known coordinates.
   - **Coordinate Tracker:** Display active tile boundaries fluidly (e.g., `LOC: X12, Y04`) adjacent to the compass layout layer within the same floating HUD sub-panel framework.

3. **Minimap Layer with Fog-of-War Engine:**
   - Build a compact overlay minimap component in the exploration layout layer.
   - **Fog-of-War Logic:** Initialize a binary exploration array matching the active LDtk 32x32 dimensions (0 for unvisited, 1 for visited). All cells start hidden under a dark mask canvas layer.
   - **Uncover Loop:** Every time the player takes a successful movement step, mark their current cell coordinate—and a 1-cell radius slice around them—as visited, dynamically clearing the fog mask overlay.

4. **Quest Log Sub-Panel Ledger:**
   - Implement a compact, toggleable Quest Log container tab (`#quest-log-ledger`).
   - Wire a data-binding interface that tracks active mission triggers, completed objective indexes, and milestone narrative arcs defined in the master blueprint, scaling text fonts down to maintain strict screen visibility.
