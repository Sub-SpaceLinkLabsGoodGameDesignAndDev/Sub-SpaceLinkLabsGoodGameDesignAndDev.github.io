# Directive 025: Space Optimization, Drop-Down Architectures, and System Menus

## Objective
Reclaim wasted layout real estate by systematically downsizing buttons, implementing structural drop-down asset menus, tearing out redundant overlay buttons, and introducing a centralized System/Game menu tab.

## System Modifications
1. **Target Files:** `dungeoncrawl.html`, `css/dungeon.css`

2. **Button Scaling and Screen Real Estate Optimization:**
   - Systematically scale down all oversized action buttons, combat overlays, and panel triggers to highly compact, pixel-dense layout footprints.
   - Eliminate all empty, wasted, or unassigned dead space zones across the core layout grid framework.

3. **Drop-Down Architecture Implementations:**
   - Migrate cluttered static command lists into compact, interactive drop-down configuration selectors to maximize visible workspace bounds.
   - Ensure the structural UI accommodates future expansions and drop-down menu selections seamlessly without forcing massive rewrites to the layout coordinates later on.

4. **Centralized System / Game Operations Menu:**
   - **Button Deletions:** Permanently delete the massive, standalone "Restart" and "Full Screen" overlay utility buttons from the primary gameplay layout screen.
   - **System Drop-Down Tab:** Introduce a sleek, global `[System/Game]` toolbar option tab or drop-down link. 
   - **Menu Sub-Anchors:** Nest a functional, compact **"Restart Game Loop"** trigger, a **"Toggle Full Screen"** selector (with matching native keyboard short-key listeners wired to bypass manual clicking), and an **"Options/Settings Sub-Menu"** wrapper directly inside this single drop-down dashboard.
