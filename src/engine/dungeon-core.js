// ==========================================================
// 1. MODULE IMPORTS
// ==========================================================
import { loadLdtkRuntimeLevel } from "../../js/ldtk-level-loader.js";
import { CombatFormulas } from "../systems/combat-formulas.js";
import { entityFactory } from "../data/entities/BaseEntity.js";
import { CLASS_DATA } from "../systems/character-creation.js";
import { monsterCatalog } from "../data/monsters/index.js";
import { InitiativeCore } from "../systems/initiative-core.js";


// ==========================================================
// 2. CANVAS & STATE DEFINITIONS
// ==========================================================
const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

let gameState = "CLASS_SELECT";
const activeInputBuffer = {};
let activeLevel = null;
const clearedEntityIids = new Set();
let lastFrameTime = null;

let player = {
  x: 5.5,
  y: 4.5,
  dir: 0,
  fov: Math.PI / 3,
  classchoice: null,
  gender: "male",
  name: "",
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  stamina: 100,
  maxStamina: 100,
  level: 1,
  experience: 0,
  gold: 0,
  stats: { str: 10, dex: 10, ac: 10, int: 10, wis: 10, agil: 10, char: 10 },
  inventory: [],
  equipment: [],
};

function getEntityField(entity, identifier) {
  return entity.fieldInstances?.find(
    (field) => field.__identifier === identifier,
  )?.__value;
}

function getRuntimeEntityKind(entity) {
  if (entity.__identifier === "NPC") return "npc";
  if (entity.__identifier === "CHEST") return "chest";
  if (
    typeof getEntityField(entity, "utilityType") === "string" &&
    getEntityField(entity, "utilityType").toLowerCase() === "merchant"
  ) {
    return "merchant";
  }
  return null;
}

function getActiveEntities(kind) {
  return (activeLevel?.entities ?? []).filter(
    (entity) =>
      !clearedEntityIids.has(entity.iid) &&
      getRuntimeEntityKind(entity) === kind,
  );
}

function getEntityAt(tileX, tileY) {
  return (activeLevel?.entities ?? []).find((entity) => {
    if (
      clearedEntityIids.has(entity.iid) ||
      getRuntimeEntityKind(entity) === null
    ) {
      return false;
    }
    const [entityX, entityY] = entity.__grid ?? [];
    return entityX === tileX && entityY === tileY;
  });
}

function isBlockedCell(tileX, tileY) {
  const terrain = activeLevel?.terrainGrid?.[tileY]?.[tileX];
  const collision = activeLevel?.collisionGrid?.[tileY]?.[tileX];
  return terrain == null || collision !== 0;
}

let party = {
  leader: player,
  members: [],
  entities: [],
  npcGenders: [],
  gold: 0,
  inventory: [
    { name: "Small Potion", type: "healing", value: 30, quantity: 2 },
    { name: "Travel Ration", type: "healing", value: 10, quantity: 3 },
  ],
};

let hoveredClassKey = null;
let selectedClassKey = null;
let selectedGender = "male";
let selectedRecruitSlotIndex = 0;
let activeEnemy = null;
let activeInteraction = null;
let selectedPartyIndex = 0;
let selectedTarget = { type: "enemy", index: 0 };
let activeEffect = null;
let combatLog = ["Explore the town and investigate marked locations."];
let lastTargetListKey = "";
let lastInventoryState = "";
let actedThisRound = new Set();
let combatInitiative = [];
let combatInitiativeCursor = -1;
let combatBillboardBounds = null;
const autoFightMembers = new Set();
const pointBuyProfiles = new Map();
const POINT_BUY_STATS = ["str", "agil", "int", "sta"];
const POINT_BUY_MIN = 2;
const POINT_BUY_CAP = 9;
const POINT_BUY_POOL = 15;

const heroLayouts = {};
const selectButtonLayout = { x: 110, y: 170, w: 100, h: 22 };
const maleBtnLayout = { x: 145, y: 135, w: 75, h: 16 };
const femaleBtnLayout = { x: 225, y: 135, w: 75, h: 16 };

function setupLayout() {
  let yOffset = 40;
  Object.keys(CLASS_DATA).forEach((key) => {
    heroLayouts[key] = { x: 15, y: yOffset, w: 110, h: 18 };
    yOffset += 21;
  });
}
setupLayout();

const creationCarousel = document.getElementById("creation-carousel-track");
const classCarousel = creationCarousel?.closest(".class-carousel");
const consoleHud = document.querySelector(".console-hud");
["combat-actions", "target-actions", "interaction-actions"].forEach((id) => {
  const panel = document.getElementById(id);
  if (consoleHud && panel) consoleHud.append(panel);
});
const eventLogPanel = document.querySelector(".event-log-panel");
if (consoleHud && eventLogPanel) consoleHud.append(eventLogPanel);
const sortedClassKeys = Object.keys(CLASS_DATA).sort((left, right) =>
  CLASS_DATA[left].name.localeCompare(CLASS_DATA[right].name),
);
selectedClassKey ||= sortedClassKeys[0] || null;
if (creationCarousel) {
  for (let index = 0; index < 3; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "creation-carousel-card";
    button.setAttribute("aria-pressed", "false");
    const portrait = document.createElement("img");
    portrait.alt = "";
    portrait.onerror = () => {
      portrait.onerror = null;
      portrait.src = "dungeon-img/Sprite-FighterMaleStatusOK.png";
    };
    const name = document.createElement("span");
    button.append(portrait, name);
    button.addEventListener("click", () => {
      if (button.dataset.classKey) chooseCarouselClass(button.dataset.classKey);
    });
    button.addEventListener("pointerenter", () => {
      hoveredClassKey = button.dataset.classKey || null;
    });
    button.addEventListener("pointerleave", () => {
      hoveredClassKey = null;
    });
    creationCarousel.append(button);
  }
}

function chooseCarouselClass(key) {
  if (!CLASS_DATA[key]) return;
  hoveredClassKey = key;
  selectedClassKey = key;
  if (gameState === "PARTY_RECRUIT") {
    if (key === player.classchoice) {
      showMessage("Your hero class cannot be selected as a companion.");
    } else if (party.members[selectedRecruitSlotIndex] === key) {
      party.members.splice(selectedRecruitSlotIndex, 1);
      party.npcGenders.splice(selectedRecruitSlotIndex, 1);
      selectedRecruitSlotIndex = Math.min(
        selectedRecruitSlotIndex,
        party.members.length,
      );
      renderRecruitChoices();
      updateDashboardUI();
    } else {
      const existingIndex = party.members.indexOf(key);
      const gender =
        existingIndex >= 0
          ? party.npcGenders[existingIndex]
          : Math.random() > 0.5
            ? "male"
            : "female";
      if (existingIndex >= 0) {
        party.members.splice(existingIndex, 1);
        party.npcGenders.splice(existingIndex, 1);
        if (existingIndex < selectedRecruitSlotIndex) {
          selectedRecruitSlotIndex -= 1;
        }
      }
      if (selectedRecruitSlotIndex < party.members.length) {
        party.members[selectedRecruitSlotIndex] = key;
        party.npcGenders[selectedRecruitSlotIndex] = gender;
      } else if (party.members.length < 3) {
        party.members.push(key);
        party.npcGenders.push(gender);
      } else {
        showMessage("Remove or replace a companion before adding another.");
      }
      const assignedIndex = party.members.indexOf(key);
      selectedRecruitSlotIndex = Math.min(
        assignedIndex + 1,
        party.members.length < 3
          ? party.members.length
          : party.members.length - 1,
      );
      selectedPartyIndex = selectedRecruitSlotIndex + 1;
      renderRecruitChoices();
      updateDashboardUI();
    }
  }
  updateCreationCarousel();
}

function updateCreationCarousel() {
  if (!creationCarousel) return;
  classCarousel.hidden =
    gameState !== "CLASS_SELECT" && gameState !== "PARTY_RECRUIT";
  creationCarousel.hidden = false;
  document.getElementById("name-entry-controls").hidden =
    gameState !== "NAME_INPUT";
  document.getElementById("recruit-actions").hidden =
    gameState !== "PARTY_RECRUIT";
  const embarkButton = document.getElementById("embark-party-btn");
  const pointBuy = getPointBuyStatus();
  if (embarkButton) embarkButton.disabled = party.members.length !== 3 || !pointBuy.valid;
  const selectedClass =
    gameState === "CLASS_SELECT"
      ? selectedClassKey
      : party.members[selectedRecruitSlotIndex] || selectedClassKey || player.classchoice;
  const selectedIndex = Math.max(0, sortedClassKeys.indexOf(selectedClass));
  const visibleKeys = [
    sortedClassKeys[(selectedIndex - 1 + sortedClassKeys.length) % sortedClassKeys.length],
    sortedClassKeys[selectedIndex],
    sortedClassKeys[(selectedIndex + 1) % sortedClassKeys.length],
  ];
  creationCarousel.querySelectorAll(".creation-carousel-card").forEach((button, index) => {
    const key = visibleKeys[index];
    const profile = CLASS_DATA[key];
    button.dataset.classKey = key;
    button.dataset.carouselPosition = ["previous", "center", "next"][index];
    const selected = key === selectedClass;
    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("active-card", index === 1);
    const portrait = button.querySelector("img");
    const name = button.querySelector("span");
    portrait.src = profile.portraits[selectedGender] || profile.portraits.male;
    name.textContent = profile.name;
  });
  updatePointBuyPanel();
  updateAbilityTabLabel(hoveredClassKey || selectedClass || player.classchoice);
}

function getPointBuyClassKeys() {
  const heroClass =
    gameState === "CLASS_SELECT"
      ? selectedClassKey || player.classchoice
      : player.classchoice;
  return [...new Set([heroClass, ...party.members])].filter(
    (key) => Boolean(key && CLASS_DATA[key]),
  );
}

function getPointBuyClassKey() {
  if (gameState === "CLASS_SELECT") return selectedClassKey || player.classchoice;
  if (gameState === "PARTY_RECRUIT") {
    return party.members[selectedRecruitSlotIndex] || player.classchoice;
  }
  return player.classchoice;
}

function getPointBuyProfile(classKey) {
  if (!pointBuyProfiles.has(classKey)) {
    const classStats = CLASS_DATA[classKey].stats;
    pointBuyProfiles.set(classKey, Object.fromEntries(
      POINT_BUY_STATS.map((stat) => [
        stat,
        Math.min(
          POINT_BUY_CAP,
          Math.max(POINT_BUY_MIN, Math.round(classStats[stat] ?? POINT_BUY_MIN)),
        ),
      ]),
    ));
  }
  return pointBuyProfiles.get(classKey);
}

function getPointBuyStatus() {
  const classKeys = getPointBuyClassKeys();
  let spent = 0;
  let valid = classKeys.length > 0;
  for (const classKey of classKeys) {
    const profile = getPointBuyProfile(classKey);
    for (const stat of POINT_BUY_STATS) {
      const value = profile[stat];
      if (!Number.isInteger(value) || value < POINT_BUY_MIN || value > POINT_BUY_CAP) {
        valid = false;
        continue;
      }
      spent += value - getPointBuyBaseline(classKey, stat);
    }
  }
  return {
    spent,
    remaining: Math.min(POINT_BUY_POOL, POINT_BUY_POOL - spent),
    valid: valid && spent === POINT_BUY_POOL,
  };
}

function getPointBuyBaseline(classKey, stat) {
  return Math.min(
    POINT_BUY_CAP,
    Math.max(POINT_BUY_MIN, Math.round(CLASS_DATA[classKey].stats[stat] ?? POINT_BUY_MIN)),
  );
}

function getDerivedPools(classKey, attributes) {
  const classProfile = CLASS_DATA[classKey];
  const staminaDelta = attributes.sta - getPointBuyBaseline(classKey, "sta");
  const intellectDelta = attributes.int - getPointBuyBaseline(classKey, "int");
  return {
    hp: Math.max(
      0,
      (classProfile.baseHp ?? 10 + getPointBuyBaseline(classKey, "sta") * 2) +
        staminaDelta * 2,
    ),
    mp: Math.max(0, (classProfile.maxMp ?? 0) + intellectDelta),
    stamina: Math.max(0, (classProfile.maxStamina ?? attributes.sta * 2) + staminaDelta),
  };
}

function getAttributeSheetData() {
  if (gameState === "PLAYING") {
    const selectedMember = getSelectedPartyMember();
    if (selectedMember) {
      return {
        stats: Object.fromEntries(
          POINT_BUY_STATS.map((stat) => [stat, selectedMember.getModifiedStat(stat)]),
        ),
        pools: {
          hp: [selectedMember.hp, selectedMember.maxHp],
          mp: [selectedMember.mp, selectedMember.maxMp],
          stamina: [selectedMember.stamina, selectedMember.maxStamina],
        },
      };
    }
  }
  const classKey = getPointBuyClassKey();
  if (!classKey) return null;
  const attributes = getPointBuyProfile(classKey);
  const pools = getDerivedPools(classKey, attributes);
  return {
    stats: attributes,
    pools: {
      hp: [pools.hp, pools.hp],
      mp: [pools.mp, pools.mp],
      stamina: [pools.stamina, pools.stamina],
    },
  };
}

function renderAttributeSheet() {
  const data = getAttributeSheetData();
  if (!data) return;
  for (const stat of POINT_BUY_STATS) {
    const output = document.getElementById(`stat-${stat}`);
    if (output) output.textContent = String(data.stats[stat]);
  }
  for (const [poolName, elementId] of [
    ["hp", "resource-hp"],
    ["mp", "resource-mp"],
    ["stamina", "resource-stamina"],
  ]) {
    const output = document.getElementById(elementId);
    if (output) output.textContent = `${data.pools[poolName][0]}/${data.pools[poolName][1]}`;
  }
  drawAttributeRadar(data.stats);
}

function drawAttributeRadar(stats) {
  const radar = document.getElementById("attribute-radar");
  const radarContext = radar?.getContext("2d");
  if (!radar || !radarContext) return;
  const centerX = radar.width / 2;
  const centerY = radar.height / 2 + 5;
  const radius = Math.min(centerX - 30, centerY - 28);
  const axes = [
    { stat: "str", label: "STR", angle: -Math.PI / 2 },
    { stat: "agil", label: "AGI", angle: 0 },
    { stat: "int", label: "INT", angle: Math.PI / 2 },
    { stat: "sta", label: "STA", angle: Math.PI },
  ];
  radarContext.clearRect(0, 0, radar.width, radar.height);
  radarContext.font = "10px monospace";
  radarContext.textAlign = "center";
  radarContext.textBaseline = "middle";
  for (const scale of [0.25, 0.5, 0.75, 1]) {
    radarContext.beginPath();
    axes.forEach((axis, index) => {
      const x = centerX + Math.cos(axis.angle) * radius * scale;
      const y = centerY + Math.sin(axis.angle) * radius * scale;
      if (index === 0) radarContext.moveTo(x, y);
      else radarContext.lineTo(x, y);
    });
    radarContext.closePath();
    radarContext.strokeStyle = "#34344e";
    radarContext.stroke();
  }
  radarContext.beginPath();
  axes.forEach((axis, index) => {
    const value = Math.max(POINT_BUY_MIN, Math.min(POINT_BUY_CAP, stats[axis.stat]));
    const scale = (value - POINT_BUY_MIN) / (POINT_BUY_CAP - POINT_BUY_MIN);
    const x = centerX + Math.cos(axis.angle) * radius * scale;
    const y = centerY + Math.sin(axis.angle) * radius * scale;
    if (index === 0) radarContext.moveTo(x, y);
    else radarContext.lineTo(x, y);
  });
  radarContext.closePath();
  radarContext.fillStyle = "rgba(41, 171, 226, 0.28)";
  radarContext.strokeStyle = "#29abe2";
  radarContext.lineWidth = 2;
  radarContext.fill();
  radarContext.stroke();
  axes.forEach((axis) => {
    const x = centerX + Math.cos(axis.angle) * (radius + 18);
    const y = centerY + Math.sin(axis.angle) * (radius + 18);
    radarContext.fillStyle = "#d5d7e4";
    radarContext.fillText(axis.label, x, y);
  });
}

function updatePointBuyPanel() {
  const panel = document.getElementById("point-buy-panel");
  if (!panel) return;
  const visible = gameState === "CLASS_SELECT" || gameState === "PARTY_RECRUIT";
  panel.hidden = !visible;
  const classKey = getPointBuyClassKey();
  const profile = classKey ? getPointBuyProfile(classKey) : null;
  const status = getPointBuyStatus();
  const memberLabel = document.getElementById("point-buy-member");
  if (memberLabel) {
    memberLabel.textContent =
      classKey === player.classchoice || gameState === "CLASS_SELECT"
        ? "HERO"
        : CLASS_DATA[classKey]?.name.toUpperCase() || "HERO";
  }
  const remaining = document.getElementById("point-buy-remaining");
  if (remaining) remaining.textContent = String(status.remaining);
  const validation = document.getElementById("point-buy-validation");
  if (validation) {
    validation.textContent = status.valid
      ? "All 15 points allocated. Your party is ready to embark."
      : status.remaining < 0
        ? `${Math.abs(status.remaining)} points over budget. Reduce attributes before embarking.`
        : `${status.remaining} points remaining. Allocate all 15 before embarking.`;
    validation.dataset.valid = String(status.valid);
  }
  panel.querySelectorAll(".point-buy-row").forEach((row) => {
    const stat = row.dataset.pointBuyStat;
    const value = profile?.[stat] ?? POINT_BUY_MIN;
    const output = row.querySelector("output");
    if (output) output.textContent = String(value);
    row.querySelectorAll("button[data-point-buy-change]").forEach((button) => {
      const delta = Number(button.dataset.pointBuyChange);
      button.disabled =
        !classKey ||
        (delta > 0
          ? status.remaining <= 0 || value >= POINT_BUY_CAP
          : value <= POINT_BUY_MIN);
    });
  });
  renderAttributeSheet();
}

document.getElementById("point-buy-panel")?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-point-buy-change]");
  if (!button) return;
  const classKey = getPointBuyClassKey();
  const row = button.closest("[data-point-buy-stat]");
  const stat = row?.dataset.pointBuyStat;
  const delta = Number(button.dataset.pointBuyChange);
  if (!classKey || !POINT_BUY_STATS.includes(stat) || ![-1, 1].includes(delta)) return;
  const profile = getPointBuyProfile(classKey);
  const nextValue = profile[stat] + delta;
  if (nextValue < POINT_BUY_MIN || nextValue > POINT_BUY_CAP) return;
  if (delta > 0 && getPointBuyStatus().remaining <= 0) return;
  profile[stat] = nextValue;
  updateCreationCarousel();
});

function updateAbilityTabLabel(classKey) {
  const label = document.getElementById("ability-tab-label");
  if (!label) return;
  const profile = CLASS_DATA[classKey];
  if (!profile) {
    label.textContent = "MAGIC";
    return;
  }
  const spells = profile.progression?.[1]?.spells || profile.spells || [];
  const hasSpells = spells.length > 0;
  label.textContent = hasSpells ? "MAGIC" : "SKILLS / ABILITIES";
  const sheet = document.getElementById("tab-spells");
  if (!sheet || sheet.dataset.classKey === classKey) return;
  sheet.dataset.classKey = classKey;
  const list = document.createElement("ul");
  list.className = "item-list";
  const abilities = hasSpells ? spells.map((spell) => spell.name) : profile.abilities || [];
  abilities.forEach((ability) => {
    const item = document.createElement("li");
    item.textContent = ability;
    list.append(item);
  });
  sheet.replaceChildren(list);
}

document.getElementById("class-carousel-prev")?.addEventListener("click", () => {
  const currentIndex = sortedClassKeys.indexOf(selectedClassKey);
  chooseCarouselClass(
    sortedClassKeys[(Math.max(0, currentIndex) - 1 + sortedClassKeys.length) % sortedClassKeys.length],
  );
});
document.getElementById("class-carousel-next")?.addEventListener("click", () => {
  const currentIndex = sortedClassKeys.indexOf(selectedClassKey);
  chooseCarouselClass(
    sortedClassKeys[(Math.max(0, currentIndex) + 1) % sortedClassKeys.length],
  );
});

// ==========================================================
// 3. UI TAB PANEL & HUD RENDERING SYNCS
// ==========================================================
function switchTab(tabId, event) {
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.remove("active-content"));
  document
    .querySelectorAll(".tab-link")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById(`tab-${tabId}`).classList.add("active-content");
  const activeButton =
    event?.currentTarget ||
    document.querySelector(`.tab-link[onclick*="switchTab('${tabId}'"]`);
  activeButton?.classList.add("active");
}
window.switchTab = switchTab;

const fsBtn = document.getElementById("fullscreen-btn");
if (fsBtn) {
  fsBtn.addEventListener("click", () => {
    const shell = document.getElementById("arcade-shell");
    if (!document.fullscreenElement) {
      shell.requestFullscreen().catch((err) => console.log(err));
      fsBtn.innerText = "❌ EXIT FULLSCREEN";
    } else {
      document.exitFullscreen();
      fsBtn.innerText = "📺 FULLSCREEN";
    }
  });
}

function updateDashboardUI() {
  if (!player.classchoice) {
    renderInventoryTab();
    return;
  }

  document.getElementById("hud-name").innerText =
    `${(player.name || "Hero").toUpperCase()} (${CLASS_DATA[player.classchoice].name.substring(0, 4)})`;
  document.getElementById("hud-img-p0").src =
    CLASS_DATA[player.classchoice].portraits[player.gender];

  for (let i = 1; i <= 3; i++) {
    const titleEl = document.getElementById(`hud-npc${i}`);
    const imgEl = document.getElementById(`hud-img-p${i}`);
    const memberKey = party.members[i - 1];

    if (memberKey) {
      if (titleEl) titleEl.innerText = CLASS_DATA[memberKey].name.toUpperCase();
      if (imgEl)
        imgEl.src = CLASS_DATA[memberKey].portraits[party.npcGenders[i - 1]];
    } else {
      if (titleEl) titleEl.innerText = `SLOT ${i + 1} EMPTY`;
      if (imgEl)
        imgEl.src =
          "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACAA==";
    }
  }

  document.getElementById("stat-gold").innerText = player.gold;
  document.getElementById("stat-xp").innerText = player.experience;
  document.getElementById("stat-lvl").innerText = player.level;
  document.getElementById("hp-bar-p0").style.width =
    `${Math.max(0, player.hp / player.maxHp) * 100}%`;

  const combatActions = document.getElementById("combat-actions");
  if (combatActions) combatActions.hidden = !activeEnemy;
  const targetActions = document.getElementById("target-actions");
  if (targetActions) targetActions.hidden = !activeEnemy;
  const recruitPanel = document.getElementById("recruit-panel");
  if (recruitPanel) recruitPanel.hidden = gameState !== "PARTY_RECRUIT";
  document.querySelectorAll(".party-slot").forEach((slot) => {
    slot.classList.toggle("selected", Number(slot.dataset.partyIndex) === selectedPartyIndex);
  });
  [party.leader, ...party.entities].forEach((member, index) => {
    const bar = document.getElementById(`hp-bar-p${index}`);
    if (bar && member) bar.style.width = `${Math.max(0, member.hp / member.maxHp) * 100}%`;
  });
  renderInventoryTab();
  renderAttributeSheet();
  renderTargetList();
  renderInteractionActions();
  updateCombatTurnLabel();
  updateRuntimeStatus();
}

function getSelectedPartyMember() {
  if (selectedPartyIndex === 0) return party.leader;
  return party.entities[selectedPartyIndex - 1] || null;
}

function renderInventoryTab() {
  const list = document.getElementById("inventory-items");
  if (!list) return;
  const inventoryState = party.inventory
    .map((item) => `${item.name}:${item.quantity}`)
    .join("|");
  if (inventoryState === lastInventoryState) return;
  lastInventoryState = inventoryState;
  list.replaceChildren();
  party.inventory.forEach((item, index) => {
    if (item.quantity <= 0) return;
    const row = document.createElement("li");
    row.className = "inventory-entry";
    const label = document.createElement("span");
    label.textContent = `${item.name} x${item.quantity}`;
    const useButton = document.createElement("button");
    useButton.type = "button";
    useButton.className = "inventory-use-btn";
    useButton.textContent = "USE";
    useButton.addEventListener("click", () => useSharedItem(index));
    row.append(label, useButton);
    list.append(row);
  });
  if (list.childElementCount === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No shared items.";
    list.append(empty);
  }
}

function renderInteractionActions() {
  const panel = document.getElementById("interaction-actions");
  if (!panel) return;
  panel.hidden = !activeInteraction;
  if (activeInteraction) {
    document.getElementById("interaction-title").textContent = activeInteraction.title;
    document.getElementById("interaction-message").textContent = activeInteraction.message;
  }
}

function updateCombatTurnLabel() {
  const label = document.getElementById("combat-turn-label");
  if (!label || !activeEnemy) return;
  const actor = combatInitiative[combatInitiativeCursor];
  if (actor === activeEnemy) {
    label.textContent = "TURN: ENEMY";
    return;
  }
  const index = getPartyEntities().indexOf(actor);
  label.textContent =
    index >= 0
      ? `TURN: ${actor.name.toUpperCase()}${autoFightMembers.has(index) ? " (AUTO)" : ""}`
      : "TURN: WAITING";
}

function getPartyEntities() {
  return [party.leader, ...party.entities].filter(Boolean);
}

function prepareRecruitPanel() {
  const eligibleClasses = Object.keys(CLASS_DATA).filter(
    (key) => key !== player.classchoice,
  );
  party.members = party.members
    .filter(
      (key, index, members) =>
        eligibleClasses.includes(key) && members.indexOf(key) === index,
    )
    .slice(0, 3);
  while (party.members.length < 3) {
    const nextClass = eligibleClasses.find(
      (key) => !party.members.includes(key),
    );
    if (!nextClass) break;
    party.members.push(nextClass);
  }
  party.npcGenders = party.members.map(
    (_, index) => party.npcGenders[index] || "male",
  );

  const classOptions = Object.entries(CLASS_DATA)
    .filter(([key]) => key !== player.classchoice)
    .map(([key, data]) => `<option value="${key}">${data.name}</option>`)
    .join("");
  for (let index = 1; index <= 3; index++) {
    const classSelect = document.getElementById(`recruit-${index}-class`);
    const genderSelect = document.getElementById(`recruit-${index}-gender`);
    if (!classSelect || !genderSelect) continue;
    classSelect.innerHTML = classOptions;
    classSelect.value = party.members[index - 1];
    genderSelect.value = party.npcGenders[index - 1] || "male";
    classSelect.onchange = syncRecruitChoices;
    genderSelect.onchange = syncRecruitChoices;
  }
  syncRecruitChoices();
  updateDashboardUI();
  updateCreationCarousel();
}

function syncRecruitChoices() {
  party.members = [];
  party.npcGenders = [];
  for (let index = 1; index <= 3; index++) {
    const classSelect = document.getElementById(`recruit-${index}-class`);
    const genderSelect = document.getElementById(`recruit-${index}-gender`);
    const classKey = classSelect?.value;
    if (!CLASS_DATA[classKey] || classKey === player.classchoice) continue;
    if (!party.members.includes(classKey)) {
      party.members.push(classKey);
      party.npcGenders.push(genderSelect?.value || "male");
    }
  }
  selectedRecruitSlotIndex = Math.min(selectedRecruitSlotIndex, party.members.length);
  renderRecruitChoices();
  updateDashboardUI();
  updateCreationCarousel();
}

function renderRecruitChoices() {
  const availableClasses = Object.entries(CLASS_DATA).filter(
    ([key]) => key !== player.classchoice,
  );
  const options = availableClasses
    .map(([key, profile]) => `<option value="${key}">${profile.name}</option>`)
    .join("");
  for (let index = 0; index < 3; index++) {
    const classSelect = document.getElementById(`recruit-${index + 1}-class`);
    const genderSelect = document.getElementById(`recruit-${index + 1}-gender`);
    if (!classSelect || !genderSelect) continue;
    classSelect.innerHTML = options;
    classSelect.value =
      party.members[index] ||
      availableClasses.find(
        ([key]) => !party.members.includes(key),
      )?.[0] ||
      availableClasses[0]?.[0];
    genderSelect.value = party.npcGenders[index] || "male";
    classSelect.onchange = syncRecruitChoices;
    genderSelect.onchange = syncRecruitChoices;
  }
}

function randomizeParty() {
  const candidates = Object.keys(CLASS_DATA).filter(
    (key) => key !== player.classchoice,
  );
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[randomIndex]] = [
      candidates[randomIndex],
      candidates[index],
    ];
  }
  party.members = candidates.slice(0, 3);
  party.npcGenders = party.members.map(() =>
    Math.random() > 0.5 ? "male" : "female",
  );
  selectedRecruitSlotIndex = 0;
  selectedPartyIndex = 1;
  renderRecruitChoices();
  updateDashboardUI();
  updateCreationCarousel();
}

// ==========================================================
// 4. HARDWARE INPUT CONTROLLER REGISTRATIONS
// ==========================================================
window.addEventListener("keydown", (event) => {
  activeInputBuffer[event.key] = true;
  if (gameState === "PLAYING" && event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
  handleKeyboardInput(event);
});
window.addEventListener("keyup", (event) => {
  activeInputBuffer[event.key] = false;
});
window.addEventListener("blur", () => {
  for (const key of Object.keys(activeInputBuffer)) {
    activeInputBuffer[key] = false;
  }
});

function bindTouchButton(elementId, keyToken) {
  const btn = document.getElementById(elementId);
  if (!btn) return;
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (gameState === "PLAYING" && ["w", "s", "a", "d"].includes(keyToken)) {
      moveOneTile(keyToken);
      return;
    }
    if (gameState === "PLAYING" && ["turnLeft", "turnRight"].includes(keyToken)) {
      turnOneQuarter(keyToken === "turnLeft" ? -1 : 1);
      return;
    }
    activeInputBuffer[keyToken] = true;
  });
  btn.addEventListener("pointerup", (e) => {
    e.preventDefault();
    activeInputBuffer[keyToken] = false;
  });
  btn.addEventListener("pointercancel", (e) => {
    e.preventDefault();
    activeInputBuffer[keyToken] = false;
  });
}
bindTouchButton("touch-w", "w");
bindTouchButton("touch-a", "a");
bindTouchButton("touch-s", "s");
bindTouchButton("touch-d", "d");
bindTouchButton("touch-turn-left", "turnLeft");
bindTouchButton("touch-turn-right", "turnRight");

function submitCharacterName() {
  const nameInput = document.getElementById("character-name-field");
  const submittedName = (nameInput?.value || player.name).trim().slice(0, 12);
  if (!submittedName) {
    showMessage("Enter a character name before continuing.");
    nameInput?.focus();
    return false;
  }
  player.name = submittedName;
  if (nameInput) nameInput.value = submittedName;
  gameState = "PARTY_RECRUIT";
  selectedRecruitSlotIndex = 0;
  prepareRecruitPanel();
  updateCreationCarousel();
  return true;
}

function handleKeyboardInput(e) {
  const classKeys = Object.keys(CLASS_DATA);
  if (gameState === "NAME_INPUT" && e.target?.id === "character-name-field") {
    if (e.key === "Enter") {
      e.preventDefault();
      submitCharacterName();
    }
    return;
  }
  if (gameState === "CLASS_SELECT") {
    const classIndex = Number(e.key) - 1;
    if (classIndex >= 0 && classIndex < classKeys.length) {
      chooseCarouselClass(classKeys[classIndex]);
    }
    if (e.key === "Enter" && selectedClassKey) {
      player.classchoice = selectedClassKey;
      player.gender = selectedGender;
      gameState = "NAME_INPUT";
      const nameInput = document.getElementById("character-name-field");
      if (nameInput) nameInput.value = player.name;
      updateCreationCarousel();
      nameInput?.focus();
    }
    return;
  }
  if (gameState === "PARTY_RECRUIT") {
    const recruitIndex = Number(e.key) - 1;
    const recruitKey = classKeys[recruitIndex];
    if (recruitKey && recruitKey !== player.classchoice)
      chooseCarouselClass(recruitKey);
    if (e.key === "Enter" && party.members.length === 3) {
      startExpedition();
    }
    return;
  }
  if (gameState === "PLAYING" && !e.repeat) {
    if (e.key === " " || e.key === "1" || e.key === "2" || e.key === "3") {
      performCombatAction(e.key);
      return;
    }
  }
  if (gameState === "NAME_INPUT") {
    if (e.key === "Enter") {
      submitCharacterName();
    }
  }
}

document
  .getElementById("confirm-name-btn")
  ?.addEventListener("click", submitCharacterName);
document
  .getElementById("character-name-field")
  ?.addEventListener("input", (event) => {
    player.name = event.currentTarget.value
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .slice(0, 12);
    event.currentTarget.value = player.name;
  });
document
  .getElementById("randomize-party-btn")
  ?.addEventListener("click", randomizeParty);
document.getElementById("embark-party-btn")?.addEventListener("click", () => {
  if (party.members.length === 3) startExpedition();
});

// ==========================================================
// 5. MAZE MOVEMENT & WALL PHYSICS COLLISION LOGIC
// ==========================================================

function showMessage(message) {
  combatLog.push(message);
  combatLog = combatLog.slice(-8);
  const eventLog = document.getElementById("event-log");
  if (eventLog) {
    eventLog.textContent = combatLog.join("\n");
    eventLog.scrollTop = eventLog.scrollHeight;
  }
}

function updateRuntimeStatus() {
  const eventLog = document.getElementById("event-log");
  if (eventLog) {
    eventLog.dataset.phase = activeEnemy ? "COMBAT" : activeInteraction ? "INTERACTION" : gameState;
  }
}

function turnOneQuarter(direction) {
  player.dir += direction * Math.PI / 2;
  showMessage(`You turn ${direction < 0 ? "left" : "right"}.`);
}

function moveOneTile(input) {
  if (gameState !== "PLAYING" || activeEnemy || activeInteraction) return;
  const step = 1;
  const forwardX = Math.round(Math.cos(player.dir)) * step;
  const forwardY = Math.round(Math.sin(player.dir)) * step;
  let deltaX = forwardX;
  let deltaY = forwardY;
  if (input === "ArrowDown" || input === "s" || input === "S") {
    deltaX *= -1;
    deltaY *= -1;
  } else if (input === "a" || input === "A") {
    deltaX = -forwardY;
    deltaY = forwardX;
  } else if (input === "d" || input === "D") {
    deltaX = forwardY;
    deltaY = -forwardX;
  }
  const targetX = Math.floor(player.x + deltaX) + 0.5;
  const targetY = Math.floor(player.y + deltaY) + 0.5;
  if (handlePlayerMovement(targetX, targetY)) {
    player.x = targetX;
    player.y = targetY;
    showMessage(`Moved to tile ${Math.floor(player.x)},${Math.floor(player.y)}.`);
  }
}

function handlePlayerMovementPhysics(deltaSeconds) {
  if (
    gameState !== "PLAYING" ||
    activeEnemy ||
    activeInteraction ||
    !activeLevel
  ) {
    return;
  }

  const forward =
    Number(
      Boolean(activeInputBuffer.w || activeInputBuffer.W || activeInputBuffer.ArrowUp),
    ) -
    Number(
      Boolean(activeInputBuffer.s || activeInputBuffer.S || activeInputBuffer.ArrowDown),
    );
  const turn =
    Number(Boolean(activeInputBuffer.ArrowRight)) -
    Number(Boolean(activeInputBuffer.ArrowLeft));
  const strafe =
    Number(Boolean(activeInputBuffer.d || activeInputBuffer.D)) -
    Number(Boolean(activeInputBuffer.a || activeInputBuffer.A));
  if (forward === 0 && strafe === 0 && turn === 0) return;

  const turnSpeed = 2.5;
  player.dir += turn * turnSpeed * deltaSeconds;
  while (player.dir > Math.PI) player.dir -= Math.PI * 2;
  while (player.dir < -Math.PI) player.dir += Math.PI * 2;

  if (forward === 0 && strafe === 0) return;

  const magnitude = Math.hypot(forward, strafe);
  const normalizedForward = forward / magnitude;
  const normalizedStrafe = strafe / magnitude;

  const speed = 3.5;
  const forwardX = Math.cos(player.dir);
  const forwardY = Math.sin(player.dir);
  const deltaX =
    (forwardX * normalizedForward + forwardY * normalizedStrafe) *
    speed *
    deltaSeconds;
  const deltaY =
    (forwardY * normalizedForward - forwardX * normalizedStrafe) *
    speed *
    deltaSeconds;

  const canEnterPosition = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    if (isBlockedCell(tileX, tileY)) return false;

    const currentTileX = Math.floor(player.x);
    const currentTileY = Math.floor(player.y);
    if (tileX !== currentTileX || tileY !== currentTileY) {
      return handlePlayerMovement(x, y);
    }
    return true;
  };

  const nextX = player.x + deltaX;
  if (canEnterPosition(nextX, player.y)) player.x = nextX;

  const nextY = player.y + deltaY;
  if (canEnterPosition(player.x, nextY)) player.y = nextY;
}

function showSpellEffect(actionName) {
  activeEffect = { actionName, startedAt: performance.now(), target: { ...selectedTarget } };
}

function beginCombat(entity) {
  const [monsterX, monsterY] = entity.__grid ?? [];
  if (
    Number.isInteger(monsterX) &&
    Number.isInteger(monsterY) &&
    getEntityField(entity, "surpriseRound") !== true
  ) {
    player.dir = Math.atan2(monsterY + 0.5 - player.y, monsterX + 0.5 - player.x);
    while (player.dir > Math.PI) player.dir -= Math.PI * 2;
    while (player.dir < -Math.PI) player.dir += Math.PI * 2;
  }

  activeEnemy = entityFactory.monster({
    ...Object.values(monsterCatalog)[0],
    classKey: "fighter",
    level: 1,
    startingWeaponKey: "iron_shortsword",
  });
  activeEnemy.mapTile = { x: entity.__grid[0], y: entity.__grid[1] };
  activeEnemy.mapEntity = entity;
  activeInteraction = null;
  actedThisRound = new Set();
  selectedTarget = { type: "enemy", index: 0 };
  combatInitiative = InitiativeCore.sort([...getPartyEntities(), activeEnemy]);
  combatInitiativeCursor = -1;
  showMessage(`${activeEnemy.name} blocks the way. Choose an action.`);
  advanceCombatTurn();
}

function startExpedition() {
  const pointBuyStatus = getPointBuyStatus();
  if (party.members.length !== 3 || !pointBuyStatus.valid) {
    showMessage(
      `Embark requires three companions and all 15 attribute points allocated (${Math.max(0, pointBuyStatus.remaining)} remaining).`,
    );
    updateCreationCarousel();
    return;
  }
  syncRecruitChoices();
  const statsForClass = (classKey) => ({
    ...CLASS_DATA[classKey].stats,
    ...getPointBuyProfile(classKey),
  });
  const baseHpForClass = (classKey) => {
    const profile = CLASS_DATA[classKey];
    return typeof profile.baseHp === "number"
      ? profile.baseHp +
        (getPointBuyProfile(classKey).sta -
          getPointBuyBaseline(classKey, "sta")) * 2
      : undefined;
  };
  party.leader = entityFactory.player({
    name: player.name || "Hero",
    classKey: player.classchoice,
    gender: player.gender,
    stats: statsForClass(player.classchoice),
    baseHp: baseHpForClass(player.classchoice),
    maxMp: CLASS_DATA[player.classchoice].maxMp,
    maxStamina: CLASS_DATA[player.classchoice].maxStamina,
    resourceBaselineStats: {
      int: getPointBuyBaseline(player.classchoice, "int"),
      sta: getPointBuyBaseline(player.classchoice, "sta"),
    },
    spellbook: CLASS_DATA[player.classchoice].progression?.[1]?.spells || [],
    startingWeaponKey: "iron_shortsword",
  });
  party.entities = party.members.map((classKey, index) =>
    entityFactory.companion({
      name: CLASS_DATA[classKey].name,
      classKey,
      gender: party.npcGenders[index],
      stats: statsForClass(classKey),
      baseHp: baseHpForClass(classKey),
      maxMp: CLASS_DATA[classKey].maxMp,
      maxStamina: CLASS_DATA[classKey].maxStamina,
      resourceBaselineStats: {
        int: getPointBuyBaseline(classKey, "int"),
        sta: getPointBuyBaseline(classKey, "sta"),
      },
      spellbook: CLASS_DATA[classKey].progression?.[1]?.spells || [],
    }),
  );
  player.hp = party.leader.hp;
  player.maxHp = party.leader.maxHp;
  updateCombatButtons();
  gameState = "PLAYING";
  updateAbilityTabLabel(player.classchoice);
  updateCreationCarousel();
}

function renderTargetList() {
  const list = document.getElementById("target-list");
  if (!list) return;
  if (!activeEnemy) {
    list.innerHTML = "";
    lastTargetListKey = "empty";
    return;
  }
  const targetKey = `${activeEnemy.hp}:${selectedTarget.type}:${selectedTarget.index}:${getPartyEntities().map((member) => `${member.name}:${member.hp}`).join("|")}`;
  if (targetKey === lastTargetListKey) return;
  lastTargetListKey = targetKey;
  const targets = [{ type: "enemy", index: 0, name: `${activeEnemy.name} (${activeEnemy.hp}/${activeEnemy.maxHp})` }, ...getPartyEntities().map((member, index) => ({ type: "party", index, name: `${member.name} (${member.hp}/${member.maxHp})` }))];
  list.innerHTML = targets.map((target) => `<button class="target-btn${selectedTarget.type === target.type && selectedTarget.index === target.index ? " selected" : ""}" data-target-type="${target.type}" data-target-index="${target.index}" type="button">${target.name}</button>`).join("");
  list.querySelectorAll(".target-btn").forEach((button) => button.addEventListener("click", () => {
    selectedTarget = { type: button.dataset.targetType, index: Number(button.dataset.targetIndex) };
    showMessage(`Target selected: ${button.textContent}.`);
    renderTargetList();
  }));
}

function finishCombat() {
  clearedEntityIids.add(activeEnemy.mapEntity.iid);
  // add dropTables = DROP_TABLES.monsterType.level.Rarity use drop tables for gold and exp too.
  player.experience += 25;
  player.gold += 8;
  showMessage(`Victory! +25 XP and +8 gold. The path is clear.`);
  activeEnemy = null;
  activeEffect = null;
  actedThisRound = new Set();
  combatInitiative = [];
  combatInitiativeCursor = -1;
}

function performCombatAction(input) {
  if (!activeEnemy) return;
  const actor = combatInitiative[combatInitiativeCursor];
  const partyIndex = getPartyEntities().indexOf(actor);
  if (
    partyIndex < 0 ||
    actor.hp <= 0 ||
    actedThisRound.has(partyIndex)
  ) {
    return;
  }
  const spells = actor.spellbook || [];
  const action = input === " " ? "Melee Attack" : spells[Number(input) - 1]?.name;
  if (!action) {
    showMessage(`${actor.name} has no spell assigned to slot ${input}.`);
    return;
  }
  const selectedSpell = spells.find((spell) => spell.name === action);
  const target = selectedTarget.type === "party"
    ? getPartyEntities()[selectedTarget.index]
    : activeEnemy;
  if (!target) return;
  const result = CombatFormulas.executeClassAction(
    actor,
    target,
    action,
    CLASS_DATA,
  );
  if (result.status === "SUCCESS" || result.status === "HIT") {
    showSpellEffect(action);
  }
  showMessage(result.log);
  if (activeEnemy.hp <= 0) {
    finishCombat();
    return;
  }
  actedThisRound.add(partyIndex);
  advanceCombatTurn();
}
window.performCombatAction = performCombatAction;

function advanceCombatTurn() {
  if (!activeEnemy || combatInitiative.length === 0) return;

  const members = getPartyEntities();
  for (let checked = 0; checked < combatInitiative.length; checked += 1) {
    const previousCursor = combatInitiativeCursor;
    combatInitiativeCursor = (combatInitiativeCursor + 1) % combatInitiative.length;
    if (combatInitiativeCursor <= previousCursor) {
      actedThisRound = new Set();
    }

    const actor = combatInitiative[combatInitiativeCursor];
    if (actor === activeEnemy) {
      updateCombatButtons();
      if (members.every((member) => member.hp <= 0)) {
        retreatAfterDefeat();
        return;
      }
      enemyTurn();
      if (!activeEnemy || gameState !== "PLAYING") return;
      advanceCombatTurn();
      return;
    }

    const partyIndex = members.indexOf(actor);
    if (
      partyIndex < 0 ||
      actor.hp <= 0 ||
      actedThisRound.has(partyIndex)
    ) {
      continue;
    }
    selectedPartyIndex = partyIndex;
    updateCombatButtons();
    if (autoFightMembers.has(partyIndex)) {
      if (actor.spellbook?.length) {
        const affordableSpellIndex = actor.spellbook.findIndex(
          (spell) =>
            spell.costType !== "mp" ||
            (actor.mp ?? 0) >= (spell.cost ?? 0),
        );
        performCombatAction(
          affordableSpellIndex >= 0 ? String(affordableSpellIndex + 1) : " ",
        );
      } else {
        performCombatAction(" ");
      }
      return;
    }
    return;
  }
}

function retreatAfterDefeat() {
  activeEnemy = null;
  gameState = "CLASS_SELECT";
  selectedClassKey = null;
  party.members = [];
  party.entities = [];
  combatInitiative = [];
  combatInitiativeCursor = -1;
  actedThisRound = new Set();
  showMessage("The party is defeated and retreats to town.");
  updateCreationCarousel();
}

function enemyTurn() {
  const members = getPartyEntities();
  const livingMembers = members.filter((member) => member.hp > 0);
  if (livingMembers.length === 0) return;
  const target = livingMembers[Math.floor(Math.random() * livingMembers.length)];
  const result = CombatFormulas.executeClassAction(
    activeEnemy,
    target,
    "Melee Attack",
    CLASS_DATA,
  );
  showMessage(`ENEMY TURN: ${result.log}`);
  if (target === party.leader) {
    player.hp = party.leader.hp;
    player.mp = party.leader.mp;
    player.stamina = party.leader.stamina;
  }
  if (members.every((member) => member.hp <= 0)) retreatAfterDefeat();
}

function endCombatTurn() {
  if (!activeEnemy) return;
  const actor = combatInitiative[combatInitiativeCursor];
  const partyIndex = getPartyEntities().indexOf(actor);
  if (partyIndex < 0 || actedThisRound.has(partyIndex)) return;
  showMessage(`${actor.name} waits.`);
  actedThisRound.add(partyIndex);
  advanceCombatTurn();
}

function useSharedItem(itemIndex) {
  const item = party.inventory[itemIndex];
  const actor = activeEnemy
    ? combatInitiative[combatInitiativeCursor]
    : getSelectedPartyMember();
  const actorIndex = getPartyEntities().indexOf(actor);
  const target = activeEnemy ? actor : getSelectedPartyMember();
  if (!item || item.quantity <= 0 || !target) return;
  if (activeEnemy && (actorIndex < 0 || actedThisRound.has(actorIndex))) return;
  if (item.type === "healing") {
    const restored = Math.min(item.value, target.maxHp - target.hp);
    target.hp += restored;
    item.quantity -= 1;
    renderInventoryTab();
    if (target === party.leader) player.hp = target.hp;
    showMessage(`${target.name} uses ${item.name} and restores ${restored} HP.`);
  }
  if (activeEnemy) {
    actedThisRound.add(actorIndex);
    advanceCombatTurn();
  }
}

function selectPartyMember(index) {
  if (activeEnemy) {
    selectedTarget = { type: "party", index };
    renderTargetList();
    return;
  }
  selectedPartyIndex = index;
  updateCombatButtons();
  renderInventoryTab();
  renderAttributeSheet();
}

document.querySelectorAll(".party-slot").forEach((slot) => {
  slot.addEventListener("click", () => {
    const partyIndex = Number(slot.dataset.partyIndex);
    if (gameState === "PARTY_RECRUIT" && partyIndex === 0) {
      gameState = "CLASS_SELECT";
      selectedClassKey = player.classchoice;
      updateCreationCarousel();
      return;
    }
    if (gameState === "PARTY_RECRUIT" && partyIndex > 0) {
      selectedRecruitSlotIndex = Math.min(
        partyIndex - 1,
        party.members.length,
      );
      selectedPartyIndex = selectedRecruitSlotIndex + 1;
      updateDashboardUI();
      updateCreationCarousel();
      return;
    }
    selectPartyMember(partyIndex);
  });
});

function updateCombatButtons() {
  const actor = combatInitiative[combatInitiativeCursor];
  const actorIndex = getPartyEntities().indexOf(actor);
  const isPartyTurn = actorIndex >= 0 && !actedThisRound.has(actorIndex);
  const spells = actor?.spellbook || [];
  const attackButton = document.getElementById("attack-btn");
  const endTurnButton = document.getElementById("end-turn-btn");
  const useItemButton = document.getElementById("use-item-btn");
  const autoFightToggle = document.getElementById("auto-fight-toggle");
  if (attackButton) attackButton.disabled = !isPartyTurn;
  if (endTurnButton) endTurnButton.disabled = !isPartyTurn;
  if (useItemButton) useItemButton.disabled = !isPartyTurn;
  if (autoFightToggle) {
    autoFightToggle.disabled = !isPartyTurn;
    autoFightToggle.checked = actorIndex >= 0 && autoFightMembers.has(actorIndex);
  }
  [1, 2, 3].forEach((slot) => {
    const button = document.getElementById(`spell-${slot}-btn`);
    if (!button) return;
    const spell = spells[slot - 1];
    button.textContent = spell ? `${slot} ${spell.name}` : `${slot} EMPTY`;
    button.disabled = !isPartyTurn || !spell;
  });
  updateCombatTurnLabel();
}

function resetExpedition() {
  window.location.reload();
}

document.getElementById("attack-btn")?.addEventListener("click", () => performCombatAction(" "));
document.getElementById("end-turn-btn")?.addEventListener("click", endCombatTurn);
document.getElementById("use-item-btn")?.addEventListener("click", () => {
  switchTab("inventory");
});
document.getElementById("auto-fight-toggle")?.addEventListener("change", (event) => {
  if (event.target.checked) autoFightMembers.add(selectedPartyIndex);
  else autoFightMembers.delete(selectedPartyIndex);
  updateCombatTurnLabel();
});
document.getElementById("reset-btn")?.addEventListener("click", resetExpedition);
[1, 2, 3].forEach((slot) => {
  document.getElementById(`spell-${slot}-btn`)?.addEventListener("click", () => performCombatAction(String(slot)));
});

document.getElementById("interaction-talk")?.addEventListener("click", () => {
  if (activeInteraction) {
    activeInteraction.message = "The merchant gestures toward shelves of future wares.";
    renderInteractionActions();
  }
});
document.getElementById("interaction-buy")?.addEventListener("click", () => {
  if (activeInteraction) {
    activeInteraction.message = "Buying is reserved for the merchant catalog pass.";
    renderInteractionActions();
  }
});
document.getElementById("interaction-sell")?.addEventListener("click", () => {
  if (activeInteraction) {
    activeInteraction.message = "Selling is reserved for the shared inventory pass.";
    renderInteractionActions();
  }
});
document.getElementById("interaction-exit")?.addEventListener("click", () => {
  activeInteraction = null;
  renderInteractionActions();
});

function interactWithTile(tileX, tileY) {
  const entity = getEntityAt(tileX, tileY);
  if (!entity) return;

  const entityKind = getRuntimeEntityKind(entity);
  if (entityKind === "npc") {
    beginCombat(entity);
  } else if (entityKind === "merchant") {
    activeInteraction = {
      title:
        getEntityField(entity, "identity")?.toString().toUpperCase() ||
        "TRAVELLING MERCHANT",
      message: "A travelling merchant offers equipment.",
    };
    showMessage(activeInteraction.message);
  } else if (entityKind === "chest") {
    player.gold += 15;
    clearedEntityIids.add(entity.iid);
    showMessage("Chest opened: +15 gold.");
  }
}

const mapEntitySprites = {
  NPC: "dungeon-img/Sprite-PossessedSkeleton-sheet.png",
  UTILITY_NPC: "dungeon-img/Sprite-MushroomMan1-sheet.png",
};
const loadedMapSprites = new Map();
const effectSpritePaths = [
  "dungeon-img/Sprite-Fireball-sheet.png",
  "dungeon-img/Sprite-Meteorite1-sheet.png",
  "dungeon-img/Sprite-Heal1-sheet.png",
];

function drawMapEntities() {
  const halfFov = player.fov / 2;
  const visibleEntities = [];
  combatBillboardBounds = null;
  for (const entity of activeLevel?.entities ?? []) {
    if (clearedEntityIids.has(entity.iid)) continue;
    const kind = getRuntimeEntityKind(entity);
    if (!kind) continue;

    const [tileX, tileY] = entity.__grid ?? [];
    if (!Number.isInteger(tileX) || !Number.isInteger(tileY)) continue;
    const dx = tileX + 0.5 - player.x;
    const dy = tileY + 0.5 - player.y;
    const distance = Math.hypot(dx, dy);
    let relativeAngle = Math.atan2(dy, dx) - player.dir;
    while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
    while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;
    if (Math.abs(relativeAngle) > halfFov || distance < 0.25) continue;
    if (!hasLineOfSight(tileX + 0.5, tileY + 0.5)) continue;

    visibleEntities.push({
      entity,
      kind,
      tileX,
      tileY,
      distance,
      relativeAngle,
    });
  }

  visibleEntities.sort((first, second) => second.distance - first.distance);
  visibleEntities.forEach(({ entity, kind, distance, relativeAngle }) => {

      const screenX = canvas.width / 2 + (relativeAngle / player.fov) * canvas.width;
      const size = Math.min(canvas.height * 1.4, canvas.height / distance);
          const groundY = canvas.height / 2 + Math.min(canvas.height * 0.36, size * 0.45);
          const screenY = groundY - size;
      if (activeEnemy?.mapEntity === entity) {
        combatBillboardBounds = {
          left: screenX - size / 2,
          right: screenX + size / 2,
          top: screenY,
          bottom: screenY + size,
        };
      }
      const imagePath =
        kind === "merchant"
          ? mapEntitySprites.UTILITY_NPC
          : mapEntitySprites[entity.__identifier];
      const image = imagePath ? loadedMapSprites.get(imagePath) : null;

      if (image?.complete && image.naturalWidth > 0) {
        const frameSize = 64;
        const frameCount = Math.max(1, Math.floor(image.naturalWidth / frameSize));
        const frame = Math.floor(Date.now() / 180) % frameCount;
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.ellipse(screenX, groundY, size * 0.22, size * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(image, frame * frameSize, 0, frameSize, frameSize, screenX - size / 2, screenY, size, size);
      } else {
        ctx.fillStyle =
          kind === "npc"
            ? "#d14b4b"
            : kind === "merchant"
              ? "#d1a84b"
              : "#29abe2";
        ctx.fillRect(screenX - size / 4, screenY + size / 4, size / 2, size / 2);
      }
  });
}

function drawCombatEffect() {
  if (!activeEffect || performance.now() - activeEffect.startedAt > 900) {
    activeEffect = null;
    return;
  }
  const target = activeEffect.target.type === "enemy" ? activeEnemy?.mapTile : { x: player.x, y: player.y };
  if (!target) return;
  const dx = target.x + 0.5 - player.x;
  const dy = target.y + 0.5 - player.y;
  const distance = Math.hypot(dx, dy);
  let angle = Math.atan2(dy, dx) - player.dir;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  if (Math.abs(angle) > player.fov / 2) return;
  const imagePath = activeEffect.actionName.toLowerCase().includes("meteorite")
    ? "dungeon-img/Sprite-Meteorite1-sheet.png"
    : activeEffect.actionName.toLowerCase().includes("heal")
      ? "dungeon-img/Sprite-Heal1-sheet.png"
      : "dungeon-img/Sprite-Fireball-sheet.png";
  const image = loadedMapSprites.get(imagePath) || loadedMapSprites.get("dungeon-img/Sprite-Fireball-sheet.png");
  if (!image?.complete || !image.naturalWidth) return;
  const frame = Math.floor((performance.now() - activeEffect.startedAt) / 120) % Math.floor(image.naturalWidth / 32);
  const size = Math.min(150, canvas.height / Math.max(distance, 0.7));
  const screenX = canvas.width / 2 + (angle / player.fov) * canvas.width;
  const groundY = canvas.height / 2 + Math.min(canvas.height * 0.36, size * 0.45);
  ctx.drawImage(image, frame * 32, 0, 32, 32, screenX - size / 2, groundY - size, size, size);
}

function hasLineOfSight(targetX, targetY) {
  const distance = Math.hypot(targetX - player.x, targetY - player.y);
  const steps = Math.ceil(distance / 0.1);
  for (let step = 1; step < steps; step++) {
    const progress = step / steps;
    const checkX = Math.floor(player.x + (targetX - player.x) * progress);
    const checkY = Math.floor(player.y + (targetY - player.y) * progress);
    if (isBlockedCell(checkX, checkY)) return false;
  }
  return true;
}

Object.values(mapEntitySprites).forEach((path) => {
  const image = new Image();
  image.src = path;
  loadedMapSprites.set(path, image);
});
effectSpritePaths.forEach((path) => {
  const image = new Image();
  image.src = path;
  loadedMapSprites.set(path, image);
});

function handlePlayerMovement(targetX, targetY) {
  const mapH = activeLevel?.height ?? 0;
  const mapW = activeLevel?.width ?? 0;

  if (targetX < 0 || targetX >= mapW || targetY < 0 || targetY >= mapH)
    return false;

  const tileX = Math.floor(targetX);
  const tileY = Math.floor(targetY);

  if (activeEnemy || activeInteraction) return false;
  if (isBlockedCell(tileX, tileY)) return false;

  interactWithTile(tileX, tileY);
  return !activeEnemy;
}

function updateGameLogic() {
  if (gameState !== "PLAYING") return;

  if (activeEnemy || activeInteraction) return;
  for (const entity of getActiveEntities("npc")) {
    const [tileX, tileY] = entity.__grid ?? [];
    if (
      Number.isInteger(tileX) &&
      Number.isInteger(tileY) &&
      Math.hypot(tileX + 0.5 - player.x, tileY + 0.5 - player.y) < 1.25
    ) {
      beginCombat(entity);
      return;
    }
  }

}

// ==========================================================
// 6. SCREEN Presentation RENDER ENGINE
// ==========================================================
function drawTextWrap(text, x, y, maxWidth, lineHeight) {
  ctx.font = "9px monospace";
  let words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + " ";
    let metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function drawFloorPlane() {
  const horizon = canvas.height / 2;
  ctx.strokeStyle = "rgba(92, 96, 112, 0.28)";
  ctx.lineWidth = 1;
  for (let row = 1; row <= 7; row++) {
    const y = horizon + (canvas.height / 2) * (1 - 1 / (row + 1));
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  for (let column = -5; column <= 5; column++) {
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, horizon);
    ctx.lineTo(canvas.width / 2 + column * canvas.width * 0.28, canvas.height);
    ctx.stroke();
  }
}

function renderEngine(timestamp = performance.now()) {
  updateCreationCarousel();
  const deltaSeconds =
    lastFrameTime === null
      ? 0
      : Math.min(Math.max((timestamp - lastFrameTime) / 1000, 0), 0.05);
  lastFrameTime = timestamp;
  handlePlayerMovementPhysics(deltaSeconds);
  updateGameLogic();
  updateDashboardUI();

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState === "CLASS_SELECT") {
    ctx.fillStyle = "#fff";
    ctx.font = "10px monospace";
    ctx.fillText("CHOOSE YOUR HERO", 15, 25);

    ctx.strokeStyle = "#444";
    ctx.strokeRect(140, 35, 165, 120);
    ctx.fillStyle = "#222";
    ctx.fillRect(140, 35, 165, 120);

    let activeKey = hoveredClassKey || selectedClassKey;
    if (activeKey) {
      ctx.fillStyle = CLASS_DATA[activeKey].color;
      ctx.font = "bold 10px monospace";
      ctx.fillText(CLASS_DATA[activeKey].name.toUpperCase(), 150, 52);
      ctx.fillStyle = "#bbb";
      drawTextWrap(CLASS_DATA[activeKey].desc, 150, 66, 145, 11);

      ctx.fillStyle = selectedGender === "male" ? "#444" : "#111";
      ctx.fillRect(
        maleBtnLayout.x,
        maleBtnLayout.y,
        maleBtnLayout.w,
        maleBtnLayout.h,
      );
      ctx.strokeStyle =
        selectedGender === "male" ? CLASS_DATA[activeKey].color : "#333";
      ctx.strokeRect(
        maleBtnLayout.x,
        maleBtnLayout.y,
        maleBtnLayout.w,
        maleBtnLayout.h,
      );
      ctx.fillStyle = "#fff";
      ctx.font = "9px monospace";
      ctx.fillText("♂ MALE", maleBtnLayout.x + 18, maleBtnLayout.y + 11);

      ctx.fillStyle = selectedGender === "female" ? "#444" : "#111";
      ctx.fillRect(
        femaleBtnLayout.x,
        femaleBtnLayout.y,
        femaleBtnLayout.w,
        femaleBtnLayout.h,
      );
      ctx.strokeStyle =
        selectedGender === "female" ? CLASS_DATA[activeKey].color : "#333";
      ctx.strokeRect(
        femaleBtnLayout.x,
        femaleBtnLayout.y,
        femaleBtnLayout.w,
        femaleBtnLayout.h,
      );
      ctx.fillStyle = "#fff";
      ctx.fillText("♀ FEMALE", femaleBtnLayout.x + 12, femaleBtnLayout.y + 11);
    } else {
      ctx.fillStyle = "#666";
      ctx.font = "9px monospace";
      ctx.fillText("Select a class below", 155, 95);
    }

    if (selectedClassKey) {
      ctx.fillStyle = "#0055ff";
      ctx.fillRect(
        selectButtonLayout.x,
        selectButtonLayout.y,
        selectButtonLayout.w,
        selectButtonLayout.h,
      );
      ctx.fillStyle = "#fff";
      ctx.font = "9px monospace";
      ctx.fillText(
        "CONFIRM HERO",
        selectButtonLayout.x + 12,
        selectButtonLayout.y + 14,
      );
    }
  } else if (gameState === "NAME_INPUT") {
    ctx.fillStyle = "#fff";
    ctx.font = "12px monospace";
    ctx.fillText("ENTER CHARACTER NAME:", 40, 60);
    ctx.strokeRect(40, 80, 240, 30);
    let cursor = Math.floor(Date.now() / 400) % 2 === 0 ? "_" : " ";
    ctx.fillText(player.name + cursor, 55, 100);
    ctx.fillStyle = "#666";
    ctx.font = "9px monospace";
    ctx.fillText("Press ENTER to continue", 40, 140);
  } else if (gameState === "PARTY_RECRUIT") {
    ctx.fillStyle = "#fff";
    ctx.font = "10px monospace";
    // FIXED: Added missing template literal backticks to anchor statistics counts safely
    ctx.fillText(`RECRUIT 3 COMPANIONS (${party.members.length}/3)`, 15, 25);

    Object.keys(CLASS_DATA).forEach((key) => {
      let box = heroLayouts[key];
      if (key === player.classchoice) {
        ctx.fillStyle = "#1e1e1e";
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.fillStyle = "#555";
        // FIXED: Restored template strings execution layer
        ctx.fillText(`${CLASS_DATA[key].name} (Hero)`, box.x + 8, box.y + 13);
      } else if (party.members.includes(key)) {
        ctx.fillStyle = "#004411";
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.fillStyle = "#fff";
        ctx.fillText(CLASS_DATA[key].name, box.x + 8, box.y + 13);
      } else {
        if (key === hoveredClassKey) {
          ctx.fillStyle = "#222";
          ctx.fillRect(box.x, box.y, box.w, box.h);
        }
        ctx.fillStyle = key === hoveredClassKey ? "#fff" : "#aaa";
        ctx.fillText(CLASS_DATA[key].name, box.x + 8, box.y + 13);
      }
    });

  } else if (gameState === "PLAYING") {
    ctx.fillStyle = "#181822";
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    ctx.fillStyle = "#282830";
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
    drawFloorPlane();

    let numRays = canvas.width;
    for (let i = 0; i < numRays; i++) {
      let rayAngle = player.dir - player.fov / 2 + (i / numRays) * player.fov;
      let distance = 0;
      let hitWall = false;

      const mapHeight = activeLevel?.height ?? 0;
      const mapWidth = activeLevel?.width ?? 0;

      while (!hitWall && distance < 12) {
        distance += 0.08;
        let checkX = Math.floor(player.x + Math.cos(rayAngle) * distance);
        let checkY = Math.floor(player.y + Math.sin(rayAngle) * distance);

        if (
          checkX < 0 ||
          checkX >= mapWidth ||
          checkY < 0 ||
          checkY >= mapHeight ||
          isBlockedCell(checkX, checkY)
        ) {
          hitWall = true;
        }
      }

      distance *= Math.cos(rayAngle - player.dir);
      let wallHeight = Math.min(canvas.height, canvas.height / distance);
      let shade = Math.max(0, 200 - distance * 22);
      // FIXED: Restored complete template styling color syntax strings
      ctx.strokeStyle = `rgb(0, ${shade}, ${shade * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(i, (canvas.height - wallHeight) / 2);
      ctx.lineTo(i, (canvas.height + wallHeight) / 2);
      ctx.stroke();
    }

    drawMapEntities();
    drawCombatEffect();

  }
  window.requestAnimationFrame(renderEngine);
}

// ==========================================================
// 7. MOUSE BOUNDARY TRIGGERS & MOBILE KEYBOARD PROXY
// ==========================================================
const nameInput = document.getElementById("character-name-field");

function getMousePos(e) {
  let rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener("mousemove", (e) => {
  let mouse = getMousePos(e);
  if (gameState !== "PARTY_RECRUIT") return;
  hoveredClassKey = null;
  let layouts = heroLayouts;
  Object.keys(layouts).forEach((key) => {
    let b = layouts[key];
    if (
      mouse.x >= b.x &&
      mouse.x <= b.x + b.w &&
      mouse.y >= b.y &&
      mouse.y <= b.y + b.h
    )
      hoveredClassKey = key;
  });
});

canvas.addEventListener("click", (e) => {
  let mouse = getMousePos(e);

  if (gameState === "PLAYING") {
    if (activeEnemy) {
      const bounds = combatBillboardBounds;
      if (
        bounds &&
        mouse.x >= bounds.left &&
        mouse.x <= bounds.right &&
        mouse.y >= bounds.top &&
        mouse.y <= bounds.bottom
      ) {
        selectedTarget = { type: "enemy", index: 0 };
        showMessage(`Target selected: ${activeEnemy.name}.`);
        renderTargetList();
      }
    } else if (!activeInteraction) {
      const horizontalPosition = mouse.x / canvas.width;
      if (horizontalPosition < 0.25) {
        turnOneQuarter(-1);
      } else if (horizontalPosition >= 0.75) {
        turnOneQuarter(1);
      } else {
        moveOneTile("w");
      }
    }
    e.preventDefault();
    return;
  }

  // NEW: Handle touch targeting inside the text entry phase
  if (gameState === "NAME_INPUT" && nameInput) {
    if (mouse.x >= 40 && mouse.x <= 280 && mouse.y >= 80 && mouse.y <= 110) {
      nameInput.value = player.name;
      nameInput.focus();
    }
    return;
  }

  if (gameState === "CLASS_SELECT") {
    if (selectedClassKey) {
      if (
        mouse.x >= maleBtnLayout.x &&
        mouse.x <= maleBtnLayout.x + maleBtnLayout.w &&
        mouse.y >= maleBtnLayout.y &&
        mouse.y <= maleBtnLayout.y + maleBtnLayout.h
      ) {
        selectedGender = "male";
      }
      if (
        mouse.x >= femaleBtnLayout.x &&
        mouse.x <= femaleBtnLayout.x + femaleBtnLayout.w &&
        mouse.y >= femaleBtnLayout.y &&
        mouse.y <= femaleBtnLayout.y + femaleBtnLayout.h
      ) {
        selectedGender = "female";
      }
    }

    let btn = selectButtonLayout;
    if (
      selectedClassKey &&
      mouse.x >= btn.x &&
      mouse.x <= btn.x + btn.w &&
      mouse.y >= btn.y &&
      mouse.y <= btn.y + btn.h
    ) {
      player.classchoice = selectedClassKey;
      player.gender = selectedGender;
      gameState = "NAME_INPUT";
      nameInput.value = player.name;
      updateCreationCarousel();
      nameInput.focus();
    }
  } else if (gameState === "PARTY_RECRUIT") {
    Object.keys(heroLayouts).forEach((key) => {
      let b = heroLayouts[key];
      if (
        mouse.x >= b.x &&
        mouse.x <= b.x + b.w &&
        mouse.y >= b.y &&
        mouse.y <= b.y + b.h &&
        key !== player.classchoice
      ) {
        let idx = party.members.indexOf(key);
        if (idx > -1) {
          party.members.splice(idx, 1);
          party.npcGenders.splice(idx, 1);
        } else if (party.members.length < 3) {
          party.members.push(key);
          party.npcGenders.push(Math.random() > 0.5 ? "male" : "female");
        }
      }
    });

    renderRecruitChoices();
    updateDashboardUI();
    updateCreationCarousel();
  }
});

loadLdtkRuntimeLevel()
  .then((level) => {
    activeLevel = level;
    player.x = level.spawn.x;
    player.y = level.spawn.y;
    renderEngine();
  })
  .catch((error) => {
    console.error("Unable to initialize the LDtk runtime level.", error);
    showMessage(`Unable to load level: ${error.message}`);
    renderEngine();
  });