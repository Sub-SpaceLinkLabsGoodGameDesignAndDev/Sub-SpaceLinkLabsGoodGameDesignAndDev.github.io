import { BaseEntity } from "../data/entities/BaseEntity.js";

export const studioIdentity = Object.freeze({
  businessStructure: "sole proprietorship",
  proprietor: "Josh Wade",
  legalOwner: "Josh Wade",
  studio: "SSLLGGD&D\u2122",
});

export const ATTRIBUTE_KEYS = Object.freeze([
  "str",
  "dex",
  "agil",
  "int",
  "wis",
  "char",
  "sta",
]);

export const FIGHTER_BASELINE = Object.freeze({
  str: 4,
  agil: 4,
  dex: 3,
  int: 2,
  wis: 1,
  char: 2,
  sta: 5,
});

export const ATTRIBUTE_DESCRIPTIONS = Object.freeze({
  str: Object.freeze({
    flavor: "VANGUARD STRENGTH TURNS RESOLVE INTO FORCE.",
    mechanics: "INCREASES PHYSICAL ATTACK POWER.",
  }),
  dex: Object.freeze({
    flavor: "DEXTERITY FINDS THE OPENING BEFORE IT CLOSES.",
    mechanics: "IMPROVES PRECISION AND RANGED ATTACKS.",
  }),
  agil: Object.freeze({
    flavor: "AGILITY CARRIES THE QUICK-FOOTED THROUGH DANGER.",
    mechanics: "IMPROVES SPEED AND EVASION.",
  }),
  int: Object.freeze({
    flavor: "INTELLECT UNRAVELS THE HIDDEN PATTERNS OF MAGIC.",
    mechanics: "IMPROVES ARCANE POWER AND KNOWLEDGE CHECKS.",
  }),
  wis: Object.freeze({
    flavor: "WISDOM HEARS THE WARNING BENEATH THE SILENCE.",
    mechanics: "IMPROVES DIVINE POWER AND PERCEPTION.",
  }),
  char: Object.freeze({
    flavor: "CHARISMA MAKES STRANGERS LISTEN AND ALLIES FOLLOW.",
    mechanics: "IMPROVES SOCIAL INFLUENCE.",
  }),
  sta: Object.freeze({
    flavor: "STAMINA KEEPS THE VANGUARD STANDING.",
    mechanics: "INCREASES MAXIMUM HP BY 2 PER POINT.",
  }),
});

export const ATTRIBUTE_NAME_LABELS = Object.freeze({
  str: "STR",
  dex: "DEX",
  agil: "AGIL",
  int: "INT",
  wis: "WIS",
  char: "CHAR",
  sta: "STA",
});

export const ATTRIBUTE_LOG_NAMES = Object.freeze({
  str: "STRENGTH",
  dex: "DEXTERITY",
  agil: "AGILITY",
  int: "INTELLIGENCE",
  wis: "WISDOM",
  char: "CHARISMA",
  sta: "STAMINA",
});

export const ATTRIBUTE_LOG_MESSAGES = Object.freeze({
  upgraded: "🟢 ATTRIBUTE UPGRADED: {STAT} INCREASED TO {VALUE}.",
  downgraded: "🔴 ATTRIBUTE DOWNGRADED: {STAT} DECREASED TO {VALUE}.",
});

export const IDENTITY_SUBMIT_BUTTON_ID = "input-submit-btn";
export const IDENTITY_INPUT_ID = "character-creation-name";
export const BONUS_POOL_LABEL = "BONUS ATTRIBUTE POINTS REMAINING";
export const MAX_CHARACTER_NAME_LENGTH = 12;

export let creationBonusPool = 5;
export let gameState = "CLASS_SELECT";

const DEFAULT_STAT_BASELINE = Object.freeze({
  str: 2,
  dex: 2,
  agil: 2,
  int: 2,
  wis: 2,
  char: 2,
  sta: 5,
});

const DEFAULT_STYLE = Object.freeze({
  color: "#f1f1f1",
  fontFamily: "monospace",
});

let activeController = null;

function applyStyles(element, styles) {
  Object.assign(element.style, styles);
}

function resolveBaseline(classKey, suppliedBaseline) {
  const source =
    suppliedBaseline ??
    (String(classKey).toLowerCase() === "fighter"
      ? FIGHTER_BASELINE
      : DEFAULT_STAT_BASELINE);
  const baseline = {};

  for (const key of ATTRIBUTE_KEYS) {
    const value = source[key];
    baseline[key] =
      typeof value === "number" && Number.isInteger(value) && value >= 0
        ? value
        : DEFAULT_STAT_BASELINE[key];
  }

  return baseline;
}

function createElement(documentRef, tagName, options = {}) {
  const element = documentRef.createElement(tagName);
  if (options.id) element.id = options.id;
  if (options.className) element.className = options.className;
  if (options.text != null) element.textContent = options.text;
  if (options.type) element.type = options.type;
  if (options.attributes) {
    for (const [name, value] of Object.entries(options.attributes)) {
      element.setAttribute(name, value);
    }
  }
  return element;
}

function notifyLog(message, eventLog, onLog) {
  if (typeof onLog === "function") {
    onLog(message);
    return;
  }

  const target =
    eventLog ??
    (typeof document !== "undefined"
      ? document.getElementById("event-log")
      : null);
  if (target) {
    target.textContent = target.textContent
      ? `${target.textContent}\n${message}`
      : message;
  }
}

function setCreationState(nextState, setGameState) {
  gameState = nextState;
  if (typeof setGameState === "function") {
    setGameState(nextState);
  }
}

function createAttributeRow(documentRef, key, state, toggleDescription) {
  const row = createElement(documentRef, "div", {
    className: "creation-attribute-row",
  });
  applyStyles(row, {
    display: "grid",
    gridTemplateColumns: "minmax(5rem, 1fr) auto minmax(4rem, auto) auto auto",
    gap: "0.5rem",
    alignItems: "center",
  });

  const label = createElement(documentRef, "button", {
    className: "buy-btn",
    text: ATTRIBUTE_NAME_LABELS[key],
    type: "button",
  });
  label.setAttribute("aria-label", `${ATTRIBUTE_NAME_LABELS[key]} information`);
  label.addEventListener("click", () => toggleDescription(key));

  const description = createElement(documentRef, "span", {
    className: "creation-attribute-description",
    text: ATTRIBUTE_DESCRIPTIONS[key].flavor,
  });
  description.dataset.descriptionMode = "flavor";
  description.setAttribute("aria-live", "polite");

  const value = createElement(documentRef, "output", {
    className: "creation-attribute-value",
  });
  value.setAttribute("aria-label", `${ATTRIBUTE_NAME_LABELS[key]} value`);
  value.dataset.attributeValue = key;

  const decrement = createElement(documentRef, "button", {
    className: "buy-btn",
    text: "[-]",
    type: "button",
  });
  decrement.setAttribute(
    "aria-label",
    `Decrease ${ATTRIBUTE_NAME_LABELS[key]}`,
  );
  decrement.addEventListener("click", () => state.changeAttribute(key, -1));

  const increment = createElement(documentRef, "button", {
    className: "buy-btn",
    text: "[+]",
    type: "button",
  });
  increment.setAttribute(
    "aria-label",
    `Increase ${ATTRIBUTE_NAME_LABELS[key]}`,
  );
  increment.addEventListener("click", () => state.changeAttribute(key, 1));

  row.append(label, description, value, decrement, increment);
  return row;
}

function renderController(controller) {
  const { root, input, bonusPoolOutput, maxHpOutput, state } = controller;

  bonusPoolOutput.textContent = String(creationBonusPool);
  maxHpOutput.textContent = String(state.maxHp);
  input.value = state.name;

  for (const key of ATTRIBUTE_KEYS) {
    const output = root.querySelector(`[data-attribute-value="${key}"]`);
    if (output) {
      output.textContent = String(state.stats[key]);
    }
  }

  controller.submitButton.disabled = state.name.trim().length === 0;
}

function toggleDescription(controller, key) {
  const description = controller.root.querySelector(
    `[data-description-stat="${key}"]`,
  );
  if (!description) {
    return;
  }

  const showingFlavor = description.dataset.descriptionMode === "flavor";
  description.dataset.descriptionMode = showingFlavor ? "mechanics" : "flavor";
  description.textContent = showingFlavor
    ? ATTRIBUTE_DESCRIPTIONS[key].mechanics
    : ATTRIBUTE_DESCRIPTIONS[key].flavor;
}

function recalculateMaxHp(controller) {
  const entity = new BaseEntity({
    classKey: controller.state.classKey,
    className: controller.state.className,
    level: 1,
    baseStats: controller.state.stats,
  });
  controller.state.maxHp = entity.maxHp;
  controller.maxHpOutput.textContent = String(entity.maxHp);
  if (typeof controller.onMaxHpChange === "function") {
    controller.onMaxHpChange(entity.maxHp);
  }
}

function changeAttribute(controller, key, direction) {
  if (
    !ATTRIBUTE_KEYS.includes(key) ||
    (direction !== 1 && direction !== -1)
  ) {
    throw new RangeError("A valid attribute and point-buy direction are required.");
  }

  const currentValue = controller.state.stats[key];
  const baseline = controller.state.baselineStats[key];
  if (direction > 0) {
    if (currentValue >= 9 || creationBonusPool <= 0) {
      return false;
    }
    controller.state.stats[key] = currentValue + 1;
    creationBonusPool -= 1;
    notifyLog(
      ATTRIBUTE_LOG_MESSAGES.upgraded
        .replace("{STAT}", ATTRIBUTE_LOG_NAMES[key])
        .replace("{VALUE}", String(controller.state.stats[key])),
      controller.eventLog,
      controller.onLog,
    );
  } else {
    if (currentValue <= 2 || currentValue - 1 < baseline) {
      return false;
    }
    controller.state.stats[key] = currentValue - 1;
    creationBonusPool += 1;
    notifyLog(
      ATTRIBUTE_LOG_MESSAGES.downgraded
        .replace("{STAT}", ATTRIBUTE_LOG_NAMES[key])
        .replace("{VALUE}", String(controller.state.stats[key])),
      controller.eventLog,
      controller.onLog,
    );
  }

  if (key === "sta") {
    recalculateMaxHp(controller);
  }
  renderController(controller);
  return true;
}

function normalizeName(inputName) {
  return String(inputName ?? "")
    .toUpperCase()
    .substring(0, 12);
}

function confirmIdentity(controller) {
  const name = normalizeName(controller.input.value).trim();
  if (name.length === 0) {
    controller.input.setCustomValidity("ENTER A CHARACTER NAME.");
    controller.input.reportValidity();
    return false;
  }

  controller.input.setCustomValidity("");
  controller.state.name = name;
  const character = {
    name,
    classKey: controller.state.classKey,
    className: controller.state.className,
    stats: { ...controller.state.stats },
    maxHp: controller.state.maxHp,
    creationBonusPool,
  };

  setCreationState("PARTY_RECRUIT", controller.setGameState);
  if (typeof controller.onConfirm === "function") {
    controller.onConfirm(character);
  }
  renderController(controller);
  return character;
}

function createCreationInterface(controller) {
  const { documentRef, shell, state } = controller;
  const overlay = createElement(documentRef, "section", {
    id: "character-creation-mainframe",
    className: "character-creation-mainframe",
    attributes: {
      "aria-label": "Character creation",
      "aria-modal": "true",
      role: "dialog",
    },
  });
  applyStyles(overlay, {
    position: "fixed",
    inset: "0",
    zIndex: "10000",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    padding: "1rem",
    backgroundColor: "rgba(0, 0, 0, 0.94)",
    color: DEFAULT_STYLE.color,
    fontFamily: DEFAULT_STYLE.fontFamily,
  });

  const panel = createElement(documentRef, "div", {
    className: "character-creation-panel",
  });
  applyStyles(panel, {
    display: "grid",
    gap: "0.75rem",
    width: "min(100%, 52rem)",
    maxHeight: "100%",
    overflow: "hidden",
    padding: "1rem",
    border: "2px solid currentColor",
    backgroundColor: "#0b0b10",
  });

  const heading = createElement(documentRef, "h1", {
    text: "CHARACTER CREATION",
  });
  applyStyles(heading, { margin: "0", textAlign: "center" });

  const nameLabel = createElement(documentRef, "label", {
    text: "CHARACTER NAME",
    attributes: { for: IDENTITY_INPUT_ID },
  });
  const input = createElement(documentRef, "input", {
    id: IDENTITY_INPUT_ID,
    className: "character-creation-name",
    type: "text",
    attributes: {
      maxlength: String(MAX_CHARACTER_NAME_LENGTH),
      autocomplete: "off",
      autocapitalize: "characters",
      "aria-label": "Character name",
    },
  });
  applyStyles(input, {
    width: "100%",
    minHeight: "2.75rem",
    font: "inherit",
    textTransform: "uppercase",
  });

  const submitButton = createElement(documentRef, "button", {
    id: IDENTITY_SUBMIT_BUTTON_ID,
    className: "buy-btn",
    text: "⮚ CONFIRM IDENTITY",
    type: "button",
  });
  applyStyles(submitButton, {
    width: "100%",
    minHeight: "2.75rem",
    font: "inherit",
    cursor: "pointer",
  });

  const statSection = createElement(documentRef, "section", {
    className: "creation-stat-column",
    attributes: { "aria-label": "Character attributes" },
  });
  applyStyles(statSection, {
    display: "grid",
    gap: "0.35rem",
    minWidth: "0",
  });

  const poolRow = createElement(documentRef, "div", {
    className: "creation-bonus-pool-row",
  });
  applyStyles(poolRow, {
    display: "grid",
    gridTemplateColumns: "minmax(5rem, 1fr) auto",
    gap: "0.5rem",
    alignItems: "center",
  });
  const poolLabel = createElement(documentRef, "strong", {
    text: BONUS_POOL_LABEL,
  });
  const bonusPoolOutput = createElement(documentRef, "output", {
    id: "creation-bonus-pool",
  });
  poolRow.append(poolLabel, bonusPoolOutput);

  const rows = createElement(documentRef, "div", {
    className: "creation-attribute-rows",
  });
  applyStyles(rows, {
    display: "grid",
    gap: "0.35rem",
  });

  const healthRow = createElement(documentRef, "div", {
    className: "creation-max-hp-row",
  });
  applyStyles(healthRow, {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.5rem",
  });
  const healthLabel = createElement(documentRef, "strong", {
    text: "MAX HP",
  });
  const maxHpOutput = createElement(documentRef, "output", {
    id: "creation-max-hp",
  });
  healthRow.append(healthLabel, maxHpOutput);

  const hint = createElement(documentRef, "p", {
    className: "creation-submit-hint",
    text: "USE THE CONFIRM IDENTITY BUTTON TO CONTINUE.",
  });
  applyStyles(hint, { margin: "0", textAlign: "center" });

  panel.append(heading, nameLabel, input, submitButton, statSection, hint);
  statSection.append(poolRow, rows, healthRow);
  overlay.append(panel);
  shell.append(overlay);

  controller.root = overlay;
  controller.panel = panel;
  controller.input = input;
  controller.submitButton = submitButton;
  controller.bonusPoolOutput = bonusPoolOutput;
  controller.maxHpOutput = maxHpOutput;
  controller.rows = rows;

  for (const key of ATTRIBUTE_KEYS) {
    const row = createAttributeRow(
      documentRef,
      key,
      state,
      (statKey) => toggleDescription(controller, statKey),
    );
    const description = row.querySelector(".creation-attribute-description");
    description.dataset.descriptionStat = key;
    rows.append(row);
  }

  input.addEventListener("input", () => {
    input.value = normalizeName(input.value);
    state.name = input.value;
    renderController(controller);
  });
  submitButton.addEventListener("click", () => confirmIdentity(controller));
  renderController(controller);
}

export function initializeCharacterCreation({
  shell =
    typeof document !== "undefined"
      ? document.getElementById("arcade-shell")
      : null,
  documentRef = typeof document !== "undefined" ? document : null,
  classKey = "fighter",
  className,
  baselineStats,
  initialStats,
  initialName = "",
  eventLog,
  setGameState,
  onConfirm,
  onLog,
  onMaxHpChange,
} = {}) {
  if (!documentRef || typeof documentRef.createElement !== "function") {
    throw new TypeError("A browser document is required for character creation.");
  }
  if (!shell || typeof shell.append !== "function") {
    throw new TypeError("The #arcade-shell container is required.");
  }
  if (typeof classKey !== "string" || classKey.length === 0) {
    throw new TypeError("classKey must be a non-empty string.");
  }

  const baseline = resolveBaseline(classKey, baselineStats);
  const suppliedStats = initialStats ?? baseline;
  const stats = {};
  for (const key of ATTRIBUTE_KEYS) {
    const value = suppliedStats[key] ?? baseline[key];
    if (!Number.isInteger(value) || value < 0 || value > 9) {
      throw new RangeError(`${key} must be an integer between 0 and 9.`);
    }
    stats[key] = value;
  }

  activeController?.root?.remove();
  creationBonusPool = 5;
  setCreationState("CLASS_SELECT", setGameState);

  const controller = {
    documentRef,
    shell,
    eventLog: eventLog ?? documentRef.getElementById("event-log"),
    setGameState,
    onConfirm,
    onLog,
    onMaxHpChange,
    state: {
      classKey,
      className: className ?? classKey,
      baselineStats: baseline,
      stats,
      name: normalizeName(initialName),
      maxHp: 10 + stats.sta * 2,
      changeAttribute(key, direction) {
        return changeAttribute(controller, key, direction);
      },
    },
  };

  createCreationInterface(controller);
  recalculateMaxHp(controller);
  activeController = controller;

  return Object.freeze({
    root: controller.root,
    state: controller.state,
    confirmIdentity: () => confirmIdentity(controller),
    destroy() {
      controller.root.remove();
      if (activeController === controller) {
        activeController = null;
      }
    },
  });
}

export function getCharacterCreationController() {
  return activeController;
}

export function submitCharacterIdentity() {
  if (!activeController) {
    throw new Error("Character creation has not been initialized.");
  }
  return confirmIdentity(activeController);
}