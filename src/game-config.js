export const studioIdentity = Object.freeze({
  businessStructure: "sole proprietorship",
  proprietor: "Josh Wade",
  legalOwner: "Josh Wade",
  studio: "SSLLGGD&D\u2122",
});

export const DEVELOPMENT_TEAM_WHITELIST = [];

export const DEVELOPMENT_BACKDOOR_HOTKEYS = Object.freeze([
  Object.freeze({ shortcut: "Ctrl+Shift+T", action: "time-dilation" }),
  Object.freeze({ shortcut: "Ctrl+Shift+L", action: "loot-forcing" }),
  Object.freeze({ shortcut: "Ctrl+Shift+C", action: "currency-injection" }),
  Object.freeze({ shortcut: "Ctrl+Shift+H", action: "hazard-immunity" }),
  Object.freeze({ shortcut: "Ctrl+Shift+X", action: "xp-minting" }),
]);

export const SANDBOX_ARCHETYPE_OPTIONS = Object.freeze([
  "Fighter",
  "Enchanter",
]);

export const gameConfig = Object.freeze({
  gameTitle: "Realms of Infinity",
  studioIdentity,
  timekeeping: Object.freeze({
    radix: 16,
    actionsPerWorldMinute: 16,
  }),
  sandboxArchetypeOptions: SANDBOX_ARCHETYPE_OPTIONS,
});

if (typeof window !== "undefined") {
  window.worldTimeMinutes = 0;
  window.sandboxParameters = {};
}

function initializeDevBackdoors() {
  if (
    typeof window === "undefined" ||
    !DEVELOPMENT_TEAM_WHITELIST.includes(window.developmentTeamToken)
  ) {
    return;
  }

  window.developmentBackdoorHotkeys = DEVELOPMENT_BACKDOOR_HOTKEYS;
}

if (
  typeof process !== "undefined" &&
  process.env.NODE_ENV === "development"
) {
  initializeDevBackdoors();
}