# Directive 026: Interactive Inventory Paperdolls, Tavern Save States, and Global Zone Progression Loops

## Objective
Overhaul the text inventory layout into an interactive click-and-drop equipment grid, implement persistent Tavern save state engines, and establish boundary zoning data paths to enforce safe zones and randomized open-world encounters.

## System Modifications
1. **Target Files:** `dungeoncrawl.html`, `src/engine/dungeon-core.js`, `src/engine/map-router.js`, and `src/systems/state-preservation.js`

2. **Interactive Equipment Paperdoll & Tab Deck:**
   - Replace the legacy shared text item layout container. Build a visual, structural **Paperdoll Equipment Grid Panel** complete with explicitly mapped item slot zones (Head, Torso, Main Hand, Off Hand, Legs, Feet, etc...).
   - **Click-to-Equip Logic:** Wire interactive listeners so clicking an slot or drag-dropping an item from the trunk array attempts to assign it to that slot, validating attributes and re-rendering active party statistics instantly.
   - **Sub-Tab Navigation:** Integrate a toggle deck/drop-down inside the panel to seamlessly alternate views between the `[Equipment Paperdoll]` canvas and the `[Bag/Consumables Trunk]`.

3. **Safe Zone Protection & Boundary Map Zoning:**
   - Map explicit flags onto your LDtk parsed map data layers (`isSafeZone: true/false`).
   - **Zoning Pathing Logic:** Unblock player transitions allowing them to step out of the first safe zone town grid array, loading up adjacent combat maps through the level router layout.
   - **Random Encounter Spawning Engine:** 
     - Completely forbid combat initialization loop hooks inside designated Safe Zones.
     - In combat maps, completely remove visible enemy sprite pawns sitting rigidly on the map grid waiting. Instead, enforce a randomized step-count check on movement triggers. When an encounter triggers, dynamically roll a random monster group size (variable numbers of enemies) and sort them into active tactical rank-and-row battle lines.

4. **Tavern/Inn Save State & Defend Status Preservation:**
   - **Inn/Tavern Save Hooks:** Fully implement the Inn rest mechanism. Visiting the Inn serializes the active party states, inventory arrays, and level coordinates directly down to local storage (`localStorage`).
   - **Clean Wipe Interception:** When a party wipe happens, block game deletion loops. Prompt a clean restore modal confirmation frame: "Load Last Tavern Save Point" or "Reset to Fresh Run Layout".
