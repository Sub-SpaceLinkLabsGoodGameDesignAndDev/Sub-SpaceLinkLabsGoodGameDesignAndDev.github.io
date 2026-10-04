import { BaseEntity } from "../data/entities/BaseEntity.js";

export const studioIdentity = Object.freeze({
  businessStructure: "sole proprietorship",
  proprietor: "Josh Wade",
  legalOwner: "Josh Wade",
  studio: "SSLLGGD&D\u2122",
});

export const FIGHTER_SLICE_TRAY_ID = "fighter-posture-slice-tray";

export const FIGHTER_STANCES = Object.freeze([
  "BULWARK",
  "RETALIATORY",
  "AGGRESSIVE",
  "DEFENSIVE",
  "BALANCED",
]);

const STANCE_ICONS = Object.freeze({
  BULWARK: "\u{1F6E1}\uFE0F",
  RETALIATORY: "\u2694\uFE0F",
  AGGRESSIVE: "\u{1F525}",
  DEFENSIVE: "\u{1F9D8}",
  BALANCED: "\u2696\uFE0F",
});

let mountedTray = null;

function resolveActiveCharacter({ party, selectedCharacter, getActiveCharacter }) {
  if (typeof getActiveCharacter === "function") {
    return getActiveCharacter() ?? null;
  }
  if (selectedCharacter) {
    return selectedCharacter;
  }
  if (!party || typeof party !== "object") {
    return null;
  }

  const selectedIndex =
    Number.isInteger(party.selectedPartyIndex) && party.selectedPartyIndex > 0
      ? party.selectedPartyIndex
      : 0;
  if (selectedIndex === 0) {
    return party.leader ?? party.entities?.[0] ?? party.members?.[0] ?? null;
  }
  return (
    party.entities?.[selectedIndex - 1] ??
    party.members?.[selectedIndex - 1] ??
    null
  );
}

function findCanvasBaseline(documentRef, canvas) {
  if (canvas?.parentElement) {
    return canvas.parentElement;
  }

  const screenBox = documentRef.querySelector(".screen-box");
  if (screenBox) {
    return screenBox;
  }

  const screen = documentRef.getElementById("screen");
  return screen?.parentElement ?? null;
}

function ensureTray(documentRef, canvas) {
  let tray = documentRef.getElementById(FIGHTER_SLICE_TRAY_ID);
  if (tray) {
    return tray;
  }

  const baseline = findCanvasBaseline(documentRef, canvas);
  if (!baseline?.parentNode) {
    throw new Error(
      "Unable to mount fighter posture tray: canvas baseline container was not found.",
    );
  }

  tray = documentRef.createElement("section");
  tray.id = FIGHTER_SLICE_TRAY_ID;
  tray.setAttribute("aria-label", "Fighter postures");
  tray.hidden = true;
  baseline.parentNode.insertBefore(tray, baseline.nextSibling);
  return tray;
}

function redrawCharacterCalculations(character, recalculateAttributes) {
  if (typeof recalculateAttributes === "function") {
    return recalculateAttributes(character);
  }

  return new BaseEntity({
    id: character.id ?? "",
    name: character.name ?? "",
    classKey: character.classKey,
    className: character.className ?? character.classKey,
    level: character.level ?? 1,
    baseStats: character.baseStats ?? character.stats ?? {},
    trainedStats: character.trainedStats ?? {},
    equipmentSlots: character.equipmentSlots,
  });
}

function renderStanceButtons(tray, character, updateDashboardUI, recalculateAttributes) {
  const activeStance = FIGHTER_STANCES.includes(character.activeStance)
    ? character.activeStance
    : "BALANCED";
  const fragment = tray.ownerDocument.createDocumentFragment();

  for (const stance of FIGHTER_STANCES) {
    const button = tray.ownerDocument.createElement("button");
    button.type = "button";
    button.className = "fighter-posture-card";
    button.dataset.stance = stance;
    button.setAttribute("aria-pressed", String(stance === activeStance));
    button.textContent = `${STANCE_ICONS[stance]} ${stance}`;
    button.addEventListener("click", () => {
      character.activeStance = "";
      character.activeStance = stance;
      redrawCharacterCalculations(character, recalculateAttributes);
      renderStanceButtons(
        tray,
        character,
        updateDashboardUI,
        recalculateAttributes,
      );
      if (typeof updateDashboardUI === "function") {
        updateDashboardUI();
      }
    });
    fragment.append(button);
  }

  tray.replaceChildren(fragment);
}

export function mountFighterSliceUI({
  documentRef = typeof document !== "undefined" ? document : null,
  canvas,
  party,
  selectedCharacter,
  getActiveCharacter,
  updateDashboardUI,
  recalculateAttributes,
} = {}) {
  if (!documentRef || typeof documentRef.createElement !== "function") {
    throw new TypeError("A browser document is required to mount the fighter UI.");
  }

  const activeCharacter = resolveActiveCharacter({
    party,
    selectedCharacter,
    getActiveCharacter,
  });
  const activeCanvas =
    canvas ?? documentRef.getElementById("screen");
  const tray = ensureTray(documentRef, activeCanvas);

  if (!activeCharacter || activeCharacter.classKey !== "fighter") {
    tray.hidden = true;
    tray.replaceChildren();
    mountedTray = tray;
    return tray;
  }

  tray.hidden = false;
  renderStanceButtons(
    tray,
    activeCharacter,
    updateDashboardUI,
    recalculateAttributes,
  );
  mountedTray = tray;
  return tray;
}

export function hideFighterSliceUI({
  documentRef = typeof document !== "undefined" ? document : null,
} = {}) {
  const tray =
    mountedTray ??
    documentRef?.getElementById(FIGHTER_SLICE_TRAY_ID) ??
    null;
  if (!tray) {
    return false;
  }

  tray.hidden = true;
  tray.replaceChildren();
  mountedTray = null;
  return true;
}