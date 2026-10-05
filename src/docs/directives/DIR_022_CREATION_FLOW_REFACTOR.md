# Directive 022: Character Creation Isolation, Step-by-Step Flow, and Point-Buy Restructuring

## Objective
De-clutter the unified creation screen by breaking it down into an isolated, sequential three-step workflow (Hero Choice -> Companion Recruitment -> Independent Point-Buy). Enforce precise, class-specific statistical baselines and update mathematical outputs dynamically on an absolute 2-to-9 range.

## System Modifications
1. **Target Files:** `dungeoncrawl.html`, `src/engine/dungeon-core.js`, and `src/systems/character-creation.js`

2. **Sequential Stage Segregation (Anti-Cramming Matrix):**
   - **Stage 1 (Hero Selection):** Render *only* the main hero alphanumeric wrapped class carousel, character name input field, and a dedicated **"Confirm Name & Lock Class"** button. The player cannot view or interact with companion slots or stat allocations yet.
   - **Stage 2 (Companion Recruitment):** Upon Hero confirmation, transition the interface to render recruitment selection slots. Provide option buttons allowing the user to explicitly proceed Solo, Duo, Trio, or with a Full 4-Member party. Generate a warning modal confirmation dialog window if a smaller party size is chosen before advancing.
   - **Stage 3 (Isolated Stat Point-Buy):** Transition to a dedicated attribute window. Move the canvas-based radar/web graphic polygon window up into the highly noticeable upper-left menu window space alongside the active class name.

3. **Strict Point-Buy & Real Attribute Integration:**
   - Eliminate all placeholder strings (*Vitality 100, Gold*). 
   - Expose the true structural attribute array: **Strength (STR), Agility (AGI), Intellect (INT), Stamina (STA), Dexterity (DEX), Charisma (CHA), and Wisdom (WIS)**.
   - **Numerical Calibration Rules:** 
     - Each class loads its unique baseline statistics from `character-creation.js`.
     - Point allocation pool is strictly capped at **5 attribute points per individual character**, rather than a shared party pool.
     - The absolute minimum attribute floor is **2**, and the maximum hard cap after buying is **9**. 
     - Clicking `+` / `-` adjustments must alter the 5-point local pool, dynamically redraw the multi-colored radar web polygon graphic, and instantly recalculate dependent resources (Max HP, Max MP, and Max Stamina tracks) visible on screen.

4. **Flexible Gated Embarking & Clean Resets:**
   - Allow full backward navigation choices: the player can click a previously configured slot card to clear or modify it any time before final initialization.
   - Allow the user to press **"Embark"** before spending all 5 character points if they prefer. Present a clear warning notice modal dialog ("Are you sure you want to embark with unspent points?") before final processing.
   - **Wipe Sequence Fix:** Upon a party wipe out, intercept the loop to execute a complete data sweep. Wipe dead actors at 0 HP and negative structural artifact residue, restoring clean default base states while prompting the user via a clean choice dialog frame: "Retry with exact same configuration" or "Reset to fresh start".
