export const studioIdentity = Object.freeze({
  businessStructure: "sole proprietorship",
  proprietor: "Josh Wade",
  legalOwner: "Josh Wade",
  studio: "SSLLGGD&D\u2122",
});

export const SAVE_EXTRACTION_FAILURE =
  "\u274c EXTRACTION FAILURE: INVALID SAVE KEY STRING. DATA RECOVERY CANCELED.";

export const savePayload = Object.freeze({
  FUTURE_POLITICAL_FACTION_MATRIX: Object.freeze({
    system_rules: Object.freeze([]),
    dormant_registers: Object.freeze({}),
  }),
});

export function serializeSaveKey(savePayload) {
  if (
    savePayload === null ||
    typeof savePayload !== "object" ||
    Array.isArray(savePayload)
  ) {
    throw new TypeError("Save payload must be a non-null object.");
  }

  return btoa(
    unescape(encodeURIComponent(JSON.stringify(savePayload))),
  );
}

export function recoverSaveKey(pastedKeyString) {
  try {
    if (typeof pastedKeyString !== "string" || pastedKeyString.length === 0) {
      throw new TypeError("Save key must be a non-empty string.");
    }

    const decodedPayload = JSON.parse(
      decodeURIComponent(escape(atob(pastedKeyString))),
    );

    if (
      decodedPayload === null ||
      typeof decodedPayload !== "object" ||
      Array.isArray(decodedPayload)
    ) {
      throw new TypeError("Decoded save payload must be an object.");
    }

    return decodedPayload;
  } catch {
    console.error(SAVE_EXTRACTION_FAILURE);
    return null;
  }
}

export function resetForNewRun({
  player,
  party,
  setGameState,
  storage = globalThis.localStorage,
} = {}) {
  if (player === null || typeof player !== "object") {
    throw new TypeError("A player state object is required.");
  }
  if (party === null || typeof party !== "object") {
    throw new TypeError("A party state object is required.");
  }
  if (typeof setGameState !== "function") {
    throw new TypeError("A game-state transition function is required.");
  }
  if (!storage || typeof storage.clear !== "function") {
    throw new TypeError("A storage object with a clear() method is required.");
  }

  storage.clear();
  player.totalCopper = 0;
  party.renown = 0;
  setGameState("CLASS_SELECT");
}