export const studioIdentity = Object.freeze({
  businessStructure: "sole proprietorship",
  proprietor: "Josh Wade",
  legalOwner: "Josh Wade",
  studio: "SSLLGGD&D\u2122",
});

export const TEXT_LOG_ELEMENT_ID = "event-log";
export const TEXT_LOG_MAX_LINES = 50;
export const TEXT_LOG_TEXT_SHADOW =
  "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, " +
  "1px 1px 0 #000, 0px 0px 6px rgba(0,0,0,0.9)";

export const COMBAT_LOG_EVENTS = Object.freeze({
  POSTURE_SHIFT: "POSTURE_SHIFT",
  INCAPACITATION: "INCAPACITATION",
  FORTRESS_BLOCK: "FORTRESS_BLOCK",
  POSITION_COLLAPSE: "POSITION_COLLAPSE",
  MECHANISM_JAM: "MECHANISM_JAM",
});

const EVENT_COLORS = Object.freeze({
  actor: "#79d7ff",
  ally: "#71e6a1",
  stance: "#ffd166",
  enemy: "#ff7777",
});

const logStates = new WeakMap();

function uppercase(value, fallback = "") {
  return String(value ?? fallback).toLocaleUpperCase();
}

function eventSegments(type, details = {}) {
  switch (uppercase(type)) {
    case COMBAT_LOG_EVENTS.POSTURE_SHIFT:
      return [
        { text: "\u{1F504} POSTURE SHIFT: " },
        { text: uppercase(details.actorName, "HERO"), color: EVENT_COLORS.actor },
        { text: " ADOPTS MUTUALLY EXCLUSIVE [" },
        { text: uppercase(details.stanceName, "NONE"), color: EVENT_COLORS.stance },
        { text: "] STANCE." },
      ];
    case COMBAT_LOG_EVENTS.INCAPACITATION:
      return [
        { text: "\u2620\uFE0F VOID CRISIS: " },
        { text: uppercase(details.companionName, "COMPANION"), color: EVENT_COLORS.ally },
        { text: " HAS SUCCUMBED TO STATUS ATTRITION AND COLLAPSED!" },
      ];
    case COMBAT_LOG_EVENTS.FORTRESS_BLOCK:
      return [
        { text: "\u{1F6E1}\uFE0F FORTRESS BLOCK: " },
        { text: uppercase(details.fighterName, "FIGHTER"), color: EVENT_COLORS.actor },
        { text: " SWALLOWS ATTACK VECTOR TO PROTECT " },
        { text: uppercase(details.allyName, "REAR ALLY"), color: EVENT_COLORS.ally },
        { text: ". -2 STAMINA." },
      ];
    case COMBAT_LOG_EVENTS.POSITION_COLLAPSE:
      return [
        { text: "\u274C POSITION COLLAPSE: POMMEL STRIKE CRUSHES " },
        { text: uppercase(details.enemyName, "FOE"), color: EVENT_COLORS.enemy },
        { text: " DISCIPLINE. ACTIVE STANCE RESET TO NONE. -4 AC." },
      ];
    case COMBAT_LOG_EVENTS.MECHANISM_JAM:
      return [
        { text: "\u{1F4A5} MECHANISM JAM: GEARS SNAP VIOLENTLY TO STARTING POSITION. " },
        { text: "-5 STAMINA FOR ALL ALLIES. +10 MINUTES PASSED." },
      ];
    default:
      throw new RangeError(`Unknown combat log event: ${String(type)}.`);
  }
}

function segmentsText(segments) {
  return segments.map((segment) => segment.text).join("");
}

function resolveLogElement({
  container,
  eventLog,
  documentRef = typeof document !== "undefined" ? document : null,
} = {}) {
  const element = container ?? eventLog ??
    documentRef?.getElementById(TEXT_LOG_ELEMENT_ID) ??
    null;
  if (!element || typeof element.append !== "function") {
    throw new TypeError("A text log DOM element with an append method is required.");
  }
  return { element, documentRef: element.ownerDocument ?? documentRef };
}

function makeLine(documentRef, segments) {
  const line = documentRef.createElement("div");
  line.className = "combat-log-line";
  line.setAttribute("role", "listitem");
  line.style.fontFamily = '"Courier New", monospace';
  line.style.fontSize = "clamp(9px, 1.2vw, 13px)";
  line.style.lineHeight = "1.25";
  line.style.whiteSpace = "pre-wrap";
  line.style.overflowWrap = "anywhere";
  line.style.textShadow = TEXT_LOG_TEXT_SHADOW;
  line.style.textTransform = "uppercase";

  for (const segment of segments) {
    if (!segment.color) {
      line.append(documentRef.createTextNode(segment.text));
      continue;
    }
    const highlighted = documentRef.createElement("span");
    highlighted.textContent = segment.text;
    highlighted.style.color = segment.color;
    highlighted.style.textShadow = TEXT_LOG_TEXT_SHADOW;
    line.append(highlighted);
  }
  return line;
}

function getLogState(element, documentRef) {
  let state = logStates.get(element);
  if (state) {
    return state;
  }

  const initialLines = String(element.textContent ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-TEXT_LOG_MAX_LINES)
    .map((text) => [{ text: uppercase(text) }]);
  state = { documentRef, lines: initialLines };
  logStates.set(element, state);
  element.replaceChildren();
  for (const segments of state.lines) {
    element.append(makeLine(documentRef, segments));
  }
  return state;
}

function appendSegments(segments, options = {}) {
  const { element, documentRef } = resolveLogElement(options);
  if (typeof documentRef?.createElement !== "function" ||
      typeof documentRef?.createTextNode !== "function") {
    throw new TypeError("The text log must belong to a document that can create elements.");
  }

  const state = getLogState(element, documentRef);
  state.lines.push(segments);
  if (state.lines.length > TEXT_LOG_MAX_LINES) {
    state.lines.splice(0, state.lines.length - TEXT_LOG_MAX_LINES);
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    for (const retainedSegments of state.lines) {
      element.append(makeLine(documentRef, retainedSegments));
    }
  } else {
    element.append(makeLine(documentRef, segments));
  }
  element.scrollTop = element.scrollHeight;
  return segmentsText(segments);
}

export function formatCombatLogMessage(type, details = {}) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    throw new TypeError("details must be an object.");
  }
  return segmentsText(eventSegments(type, details));
}

export function pushLog(message, options = {}) {
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new TypeError("message must be a non-empty string.");
  }
  return appendSegments([{ text: uppercase(message.trim()) }], options);
}

export function pushCombatLog(type, details = {}, options = {}) {
  return appendSegments(eventSegments(type, details), options);
}

export function mountTextLogHUD({
  documentRef = typeof document !== "undefined" ? document : null,
  container,
} = {}) {
  if (!documentRef || typeof documentRef.createElement !== "function") {
    throw new TypeError("A browser document is required to mount the text log HUD.");
  }
  const element = container ?? documentRef.getElementById(TEXT_LOG_ELEMENT_ID);
  if (!element) {
    throw new Error(`Unable to mount text log HUD: #${TEXT_LOG_ELEMENT_ID} was not found.`);
  }
  element.setAttribute("role", "list");
  element.setAttribute("aria-live", "polite");
  element.setAttribute("aria-relevant", "additions text");
  getLogState(element, documentRef);
  return element;
}

export function clearTextLog({
  documentRef = typeof document !== "undefined" ? document : null,
  container,
} = {}) {
  const element = container ?? documentRef?.getElementById(TEXT_LOG_ELEMENT_ID);
  if (!element || typeof element.replaceChildren !== "function") {
    throw new TypeError("A text log DOM element is required.");
  }
  element.replaceChildren();
  element.scrollTop = 0;
  logStates.set(element, {
    documentRef: element.ownerDocument ?? documentRef,
    lines: [],
  });
  return true;
}