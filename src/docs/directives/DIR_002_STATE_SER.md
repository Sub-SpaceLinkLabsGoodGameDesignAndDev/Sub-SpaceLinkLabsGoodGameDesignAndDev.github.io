# DIRECTIVE 002: CRYP-TEXT BASE64 SAVE SYSTEM

## 1. TARGET ENGINE FILE
- `src/systems/state-preservation.js` (Populate this empty placeholder file exclusively)

## 2. STRUCTURAL MANDATES & SYSTEM LAWS
- **Sole Proprietorship Governance:** Operates under the sole ownership of Josh Wade (SSLLGGD&D™).
- **The Cryp-Text String Formula:** Implement a robust client-side text-key serialization pipeline using native web APIs:
  `ExportKeyString = btoa(unescape(encodeURIComponent(JSON.stringify(savePayload))))`
- **The Decoding Validation Guard:** Implement the corresponding extraction routine:
  `DecodedPayload = JSON.parse(decodeURIComponent(escape(atob(pastedKeyString))))`
- **Corruption Failure Check:** Wrap the decoding logic inside a strict `try/catch` block. If parsing throws an error or detects broken syntax, intercept the state shift immediately and print a high-visibility, ALL-CAPS alert notice: `"❌ EXTRACTION FAILURE: INVALID SAVE KEY STRING. DATA RECOVERY CANCELED."`
- **Total State Reset Flush Law:** Program the absolute data purge pipeline attached to the `[BEGIN NEW RUN]` interaction command. Clicking this node must completely flush all active volatile memory, set `player.totalCopper = 0`, set `party.renown = 0`, and smoothly shift the system state pointer natively to `"CLASS_SELECT"` to shield the runtime from historical footprint crashes.
- **Asymmetric Data Segregation:** Initialize a completely isolated, dormant tracking dictionary property inside the global save template structure: `"FUTURE_POLITICAL_FACTION_MATRIX": { "system_rules": [], "dormant_registers": {} }`. This block must be completely bypassed by active scripts during save/load cycles to protect future expansion continuity.

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] Export routines output a single portable, compact string block that can be safely copied to a notepad file.
- [ ] Incorporates zero hardcoded gameplay, MultiCurrencyEngine, or asset dependencies.
- [ ] Compiles cleanly with standard ES6 named exports with zero missing syntax hooks.