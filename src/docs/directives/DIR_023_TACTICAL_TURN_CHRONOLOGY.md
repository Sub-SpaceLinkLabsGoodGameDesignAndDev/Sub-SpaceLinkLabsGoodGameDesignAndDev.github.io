# Directive 023: Tactical Turn Queue Planning, Action Bar Command Modes, and Exploration Log De-Cluttering

## Objective
Enforce strict chronological round sequence planning where player intent is batched before execution, introduce class-appropriate ability decks, and route exploration grid tracking components away from the central message log box.

## System Modifications
1. **Target Files:** `dungeoncrawl.html` and `src/engine/dungeon-core.js`

2. **Pre-Planned Turn Chronology Loop (Command Batching Phase):**
   - Completely disable the ability to hop between character frames out of order or take turns whenever desired.
   - **The Command Selection Phase Loop:** The engine sequences through active party members based on their **Agility (AGI) sorted initiative order**. For each character prompt, the player chooses an action option (Attack, Skill, Defend, or Item). Selecting an action must automatically advance the UI selection frame to the next character in the initiative queue. Provide a drop-down or button menu selection for "Back" to go back and alter selected actions before they commit.
   - **The Execution Phase ("End Turn" Rule):** The "End Turn" button handles the *player's* phase completion, not individual characters. Clicking "End Turn" executes the batched choices chronologically alongside active enemy turns, prints results down to the log window, and advances to the next battle round.

3. **Class-Appropriate Menus & Actions:**
   - Replace the static "Magic" label text strings. If the active character's profile is classified as a martial class (Fighter, Berserker, Rogue), programmatically transform the tab header label to display **"Skills"** or **"Abilities"**.
   - Implement a functional **"Defend"** command mode option deck button. Choosing Defend flags the actor with a mitigation modifier status property during the active execution round.

4. **Exploration HUD Refactoring & Log Filter Matrix:**
   - **Log Suppression:** Completely eliminate all automated print messages stating "Moved to grid location [X,Y]" or "You turned left/right" from the central scrolling message text box.
   - **HUD Anchor Redirection:** Create a static, tiny, fluidly-updating layout element label container inside the viewport corner layout grid to house active coordinate positions constantly. 
   - *Note:* Directional tracking and mapping data are permanently redirected to the upcoming Compass and Minimap Fog-of-War overlay components.

5. **Text Log Layout Assembly Fixes:**
   - Enforce an absolute auto-scroll snap rule: every single time an execution pass appends an action row to the log text box element, force `logWindow.scrollTop = logWindow.scrollHeight;` to lock the view block strictly to the bottom line entries without clipping text frames.
   - Print a bold header string tracking **whose turn it currently is** at the top of every single action queue pass to guide the player's choices clearly.
