# CRITICAL BLUEPRINT ROUTING FENCES:
- Cross-reference design constants natively with Section 1-B of `src/docs/RoI_MASTER_BLUEPRINT.md`.
- Explicitly output clean, modular ES6 named exports so other scripts can `import { gameConfig } from './game-config.js';` seamlessly.

# DIRECTIVE 001: CORE CONFIGURATION UTILITIES

## 1. TARGET FILE
- `src/game-config.js` (Populate this empty placeholder file exclusively)

## 2. STRUCTURAL MANDATES & ENVIRONMENT FENCES
- Sole Proprietorship Configuration: Profile owner as Josh Wade (SSLLGGD&D™).
- Environmental Validation Block: Wrap all debug backdoors inside an explicit validation check testing for local vs live deployment layout variables:
  `if (process.env.NODE_ENV === "development") { initializeDevBackdoors(); }`
- Universal Time Register Initialization: Instantiate the default global calendar clock engine tracker to an absolute baseline layout:
  `window.worldTimeMinutes = 0;`
- Sandbox Customizer Allocation: Instantiate the volatile, in-memory configuration registry array:
  `window.sandboxParameters = {};`
- Suppress all character point allocation data, movement physics logic, and combat formulas.

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] File exports single-character configuration constraints using standard ES6 named exports.
- [ ] Contains exactly zero references to external multi-media assets, images, or sound files.
- [ ] Compiles fully without syntax errors or missing placeholder dependency references.
