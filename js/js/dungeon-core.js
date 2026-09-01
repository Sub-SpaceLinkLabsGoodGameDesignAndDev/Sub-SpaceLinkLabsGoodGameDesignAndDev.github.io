// ==========================================================
// 1. MODULE IMPORTS
// ==========================================================
import {
  CLASS_DATA,
  monsterCatalog,
  town1Map,
  TILE_TYPES,
} from "./dungeon-data.js";
import { CombatFormulas, entityFactory } from "./dungeon-combat.js";

// ==========================================================
// 2. CANVAS & STATE DEFINITIONS
// ==========================================================
const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

let gameState = "CLASS_SELECT";
const keys = {};

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
let activeEnemy = null;
let activeInteraction = null;
let selectedPartyIndex = 0;
let selectedTarget = { type: "enemy", index: 0 };
let detailPanelMode = "none";
let activeEffect = null;
let combatLog = ["Explore the town and investigate marked locations."];
let lastPartyDetailsKey = "";
let lastTargetListKey = "";
let combatTurnIndex = 0;
let actedThisRound = new Set();
const autoFightMembers = new Set();

const classLayouts = {};
const heroLayouts = {};
const selectButtonLayout = { x: 110, y: 170, w: 100, h: 22 };
const randomButtonLayout = { x: 30, y: 170, w: 120, h: 22 };
const embarkButtonLayout = { x: 170, y: 170, w: 120, h: 22 };
const maleBtnLayout = { x: 145, y: 135, w: 75, h: 16 };
const femaleBtnLayout = { x: 225, y: 135, w: 75, h: 16 };

function setupLayout() {
  let yOffset = 40;
  Object.keys(CLASS_DATA).forEach((key) => {
    classLayouts[key] = { x: 15, y: yOffset, w: 110, h: 18 };
    heroLayouts[key] = { x: 15, y: yOffset, w: 110, h: 18 };
    yOffset += 21;
  });
}
setupLayout();

// ==========================================================
// 3. UI TAB PANEL & HUD RENDERING SYNCS
// ==========================================================
function switchTab(tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.remove("active-content"));
  document
    .querySelectorAll(".tab-link")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById(`tab-${tabId}`).classList.add("active-content");
  if (window.event) window.event.currentTarget.classList.add("active");
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
  if (!player.classchoice) return;

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
  document.getElementById("stat-vit").innerText = `${player.hp}/${player.maxHp}`;
  document.getElementById("hp-bar-p0").style.width = `${Math.max(0, player.hp / player.maxHp) * 100}%`;

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
  renderPartyDetails();
  renderTargetList();
  renderInteractionActions();
  updateCombatTurnLabel();
  updateRuntimeStatus();
}

function getSelectedPartyMember() {
  if (selectedPartyIndex === 0) return party.leader;
  return party.entities[selectedPartyIndex - 1] || null;
}

function renderPartyDetails() {
  const member = getSelectedPartyMember();
  const nameEl = document.getElementById("party-detail-name");
  const classEl = document.getElementById("party-detail-class");
  const statsEl = document.getElementById("party-detail-stats");
  const abilitiesEl = document.getElementById("party-detail-abilities");
  const equipmentEl = document.getElementById("party-detail-equipment");
  if (!nameEl || !classEl || !statsEl || !abilitiesEl || !equipmentEl) return;
  const detailPanel = document.querySelector(".party-detail-panel");
  if (detailPanel) detailPanel.hidden = detailPanelMode === "none";
  const inventoryKey = detailPanelMode === "inventory" ? party.inventory.map((item) => `${item.name}:${item.quantity}`).join("|") : "hidden";
  const memberKey = member ? `${member.name}:${selectedPartyIndex}:${JSON.stringify(member.stats)}:${member.hp}` : `empty:${selectedPartyIndex}`;
  const renderKey = `${detailPanelMode}:${memberKey}:${inventoryKey}`;
  if (renderKey === lastPartyDetailsKey) return;
  lastPartyDetailsKey = renderKey;

  if (!member) {
    nameEl.textContent = "Empty party slot";
    classEl.textContent = "Recruit a companion to fill this position.";
    statsEl.innerHTML = "";
    abilitiesEl.innerHTML = "";
    equipmentEl.innerHTML = "";
  } else {
    nameEl.textContent = member.name.toUpperCase();
    classEl.textContent = member.className || "Adventurer";
    statsEl.innerHTML = Object.entries(member.stats || {})
      .map(([name, value]) => `<span class="detail-chip">${name.toUpperCase()}: ${value}</span>`)
      .join("");
    abilitiesEl.innerHTML = (member.abilities || [])
      .map((ability) => `<span class="detail-chip">${ability}</span>`)
      .join("");
    const weapon = member.equippedWeapon?.name || "Unarmed";
    equipmentEl.innerHTML = `<span class="equipment-left">HEAD<br>Armor pending</span><span class="equipment-center">BODY<br>${weapon}</span><span class="equipment-right">HANDS<br>${weapon}</span>`;
  }

  const inventoryEl = document.getElementById("shared-inventory");
  if (inventoryEl && detailPanelMode === "inventory") {
    inventoryEl.innerHTML = `<strong>INVENTORY</strong>${party.inventory
      .filter((item) => item.quantity > 0)
      .map((item, index) => `<span class="inventory-item detail-chip">${item.name} x${item.quantity}<button type="button" data-item-index="${index}">USE</button></span>`)
      .join("")}`;
    inventoryEl.querySelectorAll("[data-item-index]").forEach((button) => {
      button.addEventListener("click", () => useSharedItem(Number(button.dataset.itemIndex)));
    });
  } else if (inventoryEl) {
    inventoryEl.innerHTML = "";
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
  const actor = getPartyEntities()[combatTurnIndex];
  label.textContent = actor
    ? `TURN: ${actor.name.toUpperCase()}${autoFightMembers.has(combatTurnIndex) ? " (AUTO)" : ""}`
    : "ENEMY TURN";
}

function getPartyEntities() {
  return [party.leader, ...party.entities].filter(Boolean);
}

function prepareRecruitPanel() {
  const classOptions = Object.entries(CLASS_DATA)
    .map(([key, data]) => `<option value="${key}">${data.name}</option>`)
    .join("");
  for (let index = 1; index <= 3; index++) {
    const classSelect = document.getElementById(`recruit-${index}-class`);
    const genderSelect = document.getElementById(`recruit-${index}-gender`);
    if (!classSelect || !genderSelect) continue;
    classSelect.innerHTML = classOptions;
    classSelect.value = party.members[index - 1] || Object.keys(CLASS_DATA)[index];
    genderSelect.value = party.npcGenders[index - 1] || "male";
    classSelect.addEventListener("change", syncRecruitChoices);
    genderSelect.addEventListener("change", syncRecruitChoices);
  }
  syncRecruitChoices();
}

function syncRecruitChoices() {
  party.members = [];
  party.npcGenders = [];
  for (let index = 1; index <= 3; index++) {
    party.members.push(document.getElementById(`recruit-${index}-class`).value);
    party.npcGenders.push(document.getElementById(`recruit-${index}-gender`).value);
  }
}

// ==========================================================
// 4. HARDWARE INPUT CONTROLLER REGISTRATIONS
// ==========================================================
window.addEventListener("keydown", (e) => {
  if (!e.repeat && gameState === "PLAYING" && ["ArrowLeft", "ArrowRight"].includes(e.key)) {
    turnOneQuarter(e.key === "ArrowLeft" ? -1 : 1);
    return;
  }
  if (!e.repeat && gameState === "PLAYING" && ["ArrowUp", "ArrowDown", "w", "W", "s", "S", "a", "A", "d", "D"].includes(e.key)) {
    moveOneTile(e.key);
    return;
  }
  if (!e.repeat) keys[e.key] = true;
  handleKeyboardInput(e);
});
window.addEventListener("keyup", (e) => (keys[e.key] = false));

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
    keys[keyToken] = true;
  });
  btn.addEventListener("pointerup", (e) => {
    e.preventDefault();
    keys[keyToken] = false;
  });
  btn.addEventListener("pointercancel", (e) => {
    e.preventDefault();
    keys[keyToken] = false;
  });
}
bindTouchButton("touch-w", "w");
bindTouchButton("touch-a", "a");
bindTouchButton("touch-s", "s");
bindTouchButton("touch-d", "d");
bindTouchButton("touch-turn-left", "turnLeft");
bindTouchButton("touch-turn-right", "turnRight");

function handleKeyboardInput(e) {
  const classKeys = Object.keys(CLASS_DATA);
  if (gameState === "CLASS_SELECT") {
    const classIndex = Number(e.key) - 1;
    if (classIndex >= 0 && classIndex < classKeys.length) {
      selectedClassKey = classKeys[classIndex];
    }
    if (e.key === "Enter" && selectedClassKey) {
      player.classchoice = selectedClassKey;
      player.gender = selectedGender;
      gameState = "NAME_INPUT";
    }
    return;
  }
  if (gameState === "PARTY_RECRUIT") {
    const recruitIndex = Number(e.key) - 1;
    const recruitKey = classKeys[recruitIndex];
    if (recruitKey && recruitKey !== player.classchoice) {
      const memberIndex = party.members.indexOf(recruitKey);
      if (memberIndex >= 0) {
        party.members.splice(memberIndex, 1);
        party.npcGenders.splice(memberIndex, 1);
      } else if (party.members.length < 3) {
        party.members.push(recruitKey);
        party.npcGenders.push(Math.random() > 0.5 ? "male" : "female");
      }
    }
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
    if (e.key === "Enter" && player.name.trim().length > 0) {
      gameState = "PARTY_RECRUIT";
      prepareRecruitPanel();
    } else if (e.key === "Backspace") {
      player.name = player.name.slice(0, -1);
    } else if (e.key.length === 1 && player.name.length < 12) {
      if (/[a-zA-Z0-9 ]/.test(e.key)) player.name += e.key;
    }
  }
}

// ==========================================================
// 5. MAZE MOVEMENT & WALL PHYSICS COLLISION LOGIC
// ==========================================================
let spellsPopulated = false;

function showMessage(message) {
  combatLog.push(message);
  combatLog = combatLog.slice(-8);
  const eventLog = document.getElementById("event-log");
  if (eventLog) eventLog.textContent = combatLog.join("\n");
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

function showSpellEffect(actionName) {
  activeEffect = { actionName, startedAt: performance.now(), target: { ...selectedTarget } };
}

function beginCombat(tileX, tileY) {
  activeEnemy = entityFactory.monster({
    ...Object.values(monsterCatalog)[0],
    classKey: "fighter",
    level: 1,
    startingWeaponKey: "iron_shortsword",
  });
  activeEnemy.mapTile = { x: tileX, y: tileY };
  activeInteraction = null;
  combatTurnIndex = 0;
  actedThisRound = new Set();
  showMessage(`${activeEnemy.name} blocks the way. Each party member must choose an action.`);
}

function startExpedition() {
  syncRecruitChoices();
  party.leader = entityFactory.player({
    name: player.name || "Hero",
    classKey: player.classchoice,
    gender: player.gender,
    startingWeaponKey: "iron_shortsword",
  });
  party.entities = party.members.map((classKey, index) =>
    entityFactory.companion({
      name: CLASS_DATA[classKey].name,
      classKey,
      gender: party.npcGenders[index],
    }),
  );
  player.hp = party.leader.hp;
  player.maxHp = party.leader.maxHp;
  updateCombatButtons();
  gameState = "PLAYING";
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
  const tile = activeEnemy.mapTile;
  town1Map[tile.y][tile.x] = TILE_TYPES.FLOOR;
  player.experience += 25;
  player.gold += 8;
  showMessage(`Victory! +25 XP and +8 gold. The path is clear.`);
  activeEnemy = null;
  activeEffect = null;
  actedThisRound = new Set();
}

function performCombatAction(input) {
  if (!activeEnemy) return;
  const actor = getPartyEntities()[combatTurnIndex];
  if (!actor || actedThisRound.has(combatTurnIndex)) return;
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
  actedThisRound.add(combatTurnIndex);
  advanceCombatTurn();
}
window.performCombatAction = performCombatAction;

function advanceCombatTurn() {
  const members = getPartyEntities();
  if (actedThisRound.size >= members.length) {
    enemyTurn();
    actedThisRound = new Set();
    combatTurnIndex = 0;
  } else {
    do {
      combatTurnIndex = (combatTurnIndex + 1) % members.length;
    } while (actedThisRound.has(combatTurnIndex));
    if (autoFightMembers.has(combatTurnIndex)) {
      performCombatAction(" ");
      return;
    }
  }
  selectedPartyIndex = combatTurnIndex;
  updateCombatButtons();
}

function enemyTurn() {
  const members = getPartyEntities();
  const targetIndex = Math.floor(Math.random() * members.length);
  const target = members[targetIndex];
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
  if (members.every((member) => member.hp <= 0)) {
    activeEnemy = null;
    gameState = "CLASS_SELECT";
    selectedClassKey = null;
    party.members = [];
    party.entities = [];
    showMessage("The party is defeated and retreats to town.");
  }
}

function endCombatTurn() {
  if (!activeEnemy) return;
  const actor = getPartyEntities()[combatTurnIndex];
  if (!actor || actedThisRound.has(combatTurnIndex)) return;
  showMessage(`${actor.name} waits.`);
  actedThisRound.add(combatTurnIndex);
  advanceCombatTurn();
}

function useSharedItem(itemIndex) {
  const item = party.inventory[itemIndex];
  const target = getSelectedPartyMember();
  if (!item || item.quantity <= 0 || !target) return;
  if (item.type === "healing") {
    const restored = Math.min(item.value, target.maxHp - target.hp);
    target.hp += restored;
    item.quantity -= 1;
    if (target === party.leader) player.hp = target.hp;
    showMessage(`${target.name} uses ${item.name} and restores ${restored} HP.`);
  }
  if (activeEnemy) {
    actedThisRound.add(combatTurnIndex);
    advanceCombatTurn();
  }
}

function selectPartyMember(index) {
  selectedPartyIndex = index;
  if (activeEnemy && !actedThisRound.has(index)) combatTurnIndex = index;
  if (activeEnemy && selectedTarget.type === "party") selectedTarget.index = index;
  updateCombatButtons();
  renderPartyDetails();
}

document.querySelectorAll(".party-slot").forEach((slot) => {
  slot.addEventListener("click", () => selectPartyMember(Number(slot.dataset.partyIndex)));
});

document.getElementById("stats-btn")?.addEventListener("click", () => {
  detailPanelMode = detailPanelMode === "stats" ? "none" : "stats";
  renderPartyDetails();
});
document.getElementById("inventory-btn")?.addEventListener("click", () => {
  detailPanelMode = detailPanelMode === "inventory" ? "none" : "inventory";
  renderPartyDetails();
});
document.getElementById("close-detail-btn")?.addEventListener("click", () => {
  detailPanelMode = "none";
  renderPartyDetails();
});

function updateCombatButtons() {
  const actor = getPartyEntities()[combatTurnIndex];
  const spells = actor?.spellbook || [];
  [1, 2, 3].forEach((slot) => {
    const button = document.getElementById(`spell-${slot}-btn`);
    if (!button) return;
    const spell = spells[slot - 1];
    button.textContent = spell ? `${slot} ${spell.name}` : `${slot} EMPTY`;
    button.disabled = !spell;
  });
  updateCombatTurnLabel();
}

function resetExpedition() {
  window.location.reload();
}

document.getElementById("attack-btn")?.addEventListener("click", () => performCombatAction(" "));
document.getElementById("end-turn-btn")?.addEventListener("click", endCombatTurn);
document.getElementById("use-item-btn")?.addEventListener("click", () => {
  detailPanelMode = "inventory";
  renderPartyDetails();
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

function interactWithTile(tileX, tileY, tileValue) {
  if (tileValue === TILE_TYPES.NPC) {
    beginCombat(tileX, tileY);
  } else if (tileValue === TILE_TYPES.MERCHANT) {
    activeInteraction = {
      title: "TRAVELLING MERCHANT",
      message: "A travelling merchant offers equipment.",
    };
    showMessage(activeInteraction.message);
  } else if (tileValue === TILE_TYPES.CHEST) {
    player.gold += 15;
    town1Map[tileY][tileX] = TILE_TYPES.FLOOR;
    showMessage("Chest opened: +15 gold.");
  } else if (tileValue === TILE_TYPES.ZONE_EXIT) {
    showMessage("The zone exit is sealed until the next area is built.");
  }
}

const mapEntitySprites = {
  [TILE_TYPES.NPC]: "dungeon-img/Sprite-PossessedSkeleton-sheet.png",
  [TILE_TYPES.MERCHANT]: "dungeon-img/Sprite-MushroomMan1-sheet.png",
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
  for (let tileY = 0; tileY < town1Map.length; tileY++) {
    for (let tileX = 0; tileX < town1Map[tileY].length; tileX++) {
      const tileValue = town1Map[tileY][tileX];
      if (![TILE_TYPES.NPC, TILE_TYPES.MERCHANT].includes(tileValue)) continue;

      const dx = tileX + 0.5 - player.x;
      const dy = tileY + 0.5 - player.y;
      const distance = Math.hypot(dx, dy);
      let relativeAngle = Math.atan2(dy, dx) - player.dir;
      while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
      while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;
      if (Math.abs(relativeAngle) > halfFov || distance < 0.25) continue;
      if (!hasLineOfSight(tileX + 0.5, tileY + 0.5)) continue;

      visibleEntities.push({ tileX, tileY, tileValue, distance, relativeAngle });
    }
  }

  visibleEntities.sort((first, second) => second.distance - first.distance);
  visibleEntities.forEach(({ tileX, tileY, tileValue, distance, relativeAngle }) => {

      const screenX = canvas.width / 2 + (relativeAngle / player.fov) * canvas.width;
      const size = Math.min(canvas.height * 1.4, canvas.height / distance);
          const groundY = canvas.height / 2 + Math.min(canvas.height * 0.36, size * 0.45);
          const screenY = groundY - size;
      const imagePath = mapEntitySprites[tileValue];
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
        ctx.fillStyle = tileValue === TILE_TYPES.NPC ? "#d14b4b" : tileValue === TILE_TYPES.MERCHANT ? "#d1a84b" : "#29abe2";
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
    if (town1Map[checkY]?.[checkX] === TILE_TYPES.WALL) return false;
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
  const mapH = town1Map ? town1Map.length : 0;
  const mapW = town1Map && town1Map[0] ? town1Map[0].length : 0;

  if (targetX < 0 || targetX >= mapW || targetY < 0 || targetY >= mapH)
    return false;

  const tileValue = town1Map[Math.floor(targetY)][Math.floor(targetX)];

  if (activeEnemy || activeInteraction) return false;
  if (tileValue !== TILE_TYPES.WALL) {
    interactWithTile(Math.floor(targetX), Math.floor(targetY), tileValue);
    if (activeEnemy) return false;
  }

  switch (tileValue) {
    case TILE_TYPES.WALL:
      console.log("🚫 Ouch! You walked into a wall.");
      return false;

    case TILE_TYPES.ZONE_EXIT:
      console.log(
        `🗺️ Transitioning zone coordinates at [${Math.floor(targetX)}, ${Math.floor(targetY)}]...`,
      );
      return true;

    default:
      return true;
  }
}

function updateGameLogic() {
  if (gameState !== "PLAYING") return;

  if (!spellsPopulated) {
    const spellContainer = document.getElementById("tab-spells");
    if (spellContainer && player.classchoice) {
      const lvl1Spells =
        CLASS_DATA[player.classchoice].progression?.[1]?.spells || [];
      spellContainer.innerHTML = `
                <ul class="item-list">
                    ${lvl1Spells.map((spell) => `<li>${spell.name}</li>`).join("")}
                </ul>
            `;
      spellsPopulated = true;
    }
  }

  if (activeEnemy || activeInteraction) return;
  for (let tileY = 0; tileY < town1Map.length; tileY++) {
    for (let tileX = 0; tileX < town1Map[tileY].length; tileX++) {
      if (town1Map[tileY][tileX] !== TILE_TYPES.NPC) continue;
      if (Math.hypot(tileX + 0.5 - player.x, tileY + 0.5 - player.y) < 1.25) {
        beginCombat(tileX, tileY);
        return;
      }
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

function renderEngine() {
  updateGameLogic();
  updateDashboardUI();

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState === "CLASS_SELECT") {
    ctx.fillStyle = "#fff";
    ctx.font = "10px monospace";
    ctx.fillText("CHOOSE YOUR HERO", 15, 25);

    Object.keys(classLayouts).forEach((key) => {
      let box = classLayouts[key];
      if (key === selectedClassKey) {
        ctx.fillStyle = "#444";
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeStyle = CLASS_DATA[key].color;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
      } else if (key === hoveredClassKey) {
        ctx.fillStyle = "#222";
        ctx.fillRect(box.x, box.y, box.w, box.h);
      }
      ctx.fillStyle =
        key === selectedClassKey || key === hoveredClassKey ? "#fff" : "#aaa";
      ctx.fillText(CLASS_DATA[key].name, box.x + 8, box.y + 13);
    });

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
      ctx.fillText("Hover or click a class", 155, 95);
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

    ctx.fillStyle = "#444";
    ctx.fillRect(
      randomButtonLayout.x,
      randomButtonLayout.y,
      randomButtonLayout.w,
      randomButtonLayout.h,
    );
    ctx.fillStyle = "#fff";
    ctx.font = "9px monospace";
    ctx.fillText(
      "RANDOMIZE",
      randomButtonLayout.x + 35,
      randomButtonLayout.y + 14,
    );

    if (party.members.length === 3) {
      ctx.fillStyle = "#00aa44";
      ctx.fillRect(
        embarkButtonLayout.x,
        embarkButtonLayout.y,
        embarkButtonLayout.w,
        embarkButtonLayout.h,
      );
      ctx.fillStyle = "#fff";
      ctx.fillText(
        "EMBARK",
        embarkButtonLayout.x + 40,
        embarkButtonLayout.y + 14,
      );
    }
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

      const mapHeight = town1Map ? town1Map.length : 0;
      const mapWidth = town1Map && town1Map[0] ? town1Map[0].length : 0;

      while (!hitWall && distance < 12) {
        distance += 0.08;
        let checkX = Math.floor(player.x + Math.cos(rayAngle) * distance);
        let checkY = Math.floor(player.y + Math.sin(rayAngle) * distance);

        if (
          checkX < 0 ||
          checkX >= mapWidth ||
          checkY < 0 ||
          checkY >= mapHeight ||
          town1Map[checkY][checkX] === TILE_TYPES.WALL
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
  requestAnimationFrame(renderEngine);
}

// ==========================================================
// 7. MOUSE BOUNDARY TRIGGERS
// ==========================================================
function getMousePos(e) {
  let rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener("mousemove", (e) => {
  let mouse = getMousePos(e);
  hoveredClassKey = null;
  let layouts =
    gameState === "CLASS_SELECT"
      ? classLayouts
      : gameState === "PARTY_RECRUIT"
        ? heroLayouts
        : {};
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
  if (gameState === "CLASS_SELECT") {
    Object.keys(classLayouts).forEach((key) => {
      let b = classLayouts[key];
      if (
        mouse.x >= b.x &&
        mouse.x <= b.x + b.w &&
        mouse.y >= b.y &&
        mouse.y <= b.y + b.h
      )
        selectedClassKey = key;
    });

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

    let rB = randomButtonLayout;
    if (
      mouse.x >= rB.x &&
      mouse.x <= rB.x + rB.w &&
      mouse.y >= rB.y &&
      mouse.y <= rB.y + rB.h
    ) {
      party.members = [];
      party.npcGenders = [];
      let avail = Object.keys(CLASS_DATA).filter(
        (k) => k !== player.classchoice,
      );
      while (party.members.length < 3) {
        let rIdx = Math.floor(Math.random() * avail.length);
        party.members.push(avail[rIdx]);
        party.npcGenders.push(Math.random() > 0.5 ? "male" : "female");
        avail.splice(rIdx, 1);
      }
    }
    let eB = embarkButtonLayout;
    if (
      party.members.length === 3 &&
      mouse.x >= eB.x &&
      mouse.x <= eB.x + eB.w &&
      mouse.y >= eB.y &&
      mouse.y <= eB.y + eB.h
    ) {
      startExpedition();
    }
  }
});

renderEngine();
