import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const entityModuleSource = await readFile(
  new URL("./BaseEntity.js", import.meta.url),
  "utf8",
);
const { BaseEntity, entityFactory, PAPERDOLL_SLOTS } = await import(
  `data:text/javascript;base64,${Buffer.from(entityModuleSource).toString("base64")}`
);

test("default entity has 20 maximum HP from five STA", () => {
  const entity = new BaseEntity();

  assert.equal(entity.getModifiedStat("sta"), 5);
  assert.equal(entity.maxHp, 20);
  assert.equal(entity.hp, 20);
  assert.equal(PAPERDOLL_SLOTS.length, 16);
});

test("changing base or trained STA recalculates max HP without healing", () => {
  const entity = new BaseEntity();
  entity.hp = 18;

  assert.equal(entity.setBaseStat("sta", 6), 6);
  assert.equal(entity.maxHp, 22);
  assert.equal(entity.hp, 18);

  assert.equal(entity.setTrainedStat("sta", 1), 7);
  assert.equal(entity.maxHp, 24);
  assert.equal(entity.hp, 18);
});

test("base INT and STA changes recalculate resource caps without restoring spent points", () => {
  const entity = entityFactory.player({
    classKey: "archmage",
    stats: { int: 5, sta: 5 },
    maxMp: 4,
    maxStamina: 8,
    resourceBaselineStats: { int: 5, sta: 5 },
  });
  entity.mp = 2;
  entity.stamina = 3;

  entity.setBaseStat("int", 6);
  entity.setBaseStat("sta", 6);

  assert.equal(entity.maxMp, 5);
  assert.equal(entity.mp, 2);
  assert.equal(entity.maxStamina, 9);
  assert.equal(entity.stamina, 3);
});

test("equipment STA and explicit HP bonuses determine floored maximum HP", () => {
  const entity = new BaseEntity({
    equipmentSlots: {
      head: {
        statModifiers: { sta: 2 },
        hpBonus: 5,
        hpPercent: 10,
      },
    },
  });

  assert.equal(entity.maxHp, 31);
});

test("HP percentages apply sequentially and multiplicatively", () => {
  const entity = new BaseEntity({
    activeEffects: [
      { sourceId: "blessing-a", hpPercent: 10 },
      { sourceId: "curse-b", hpPercent: -10 },
    ],
  });

  assert.equal(entity.maxHp, 19);
});

test("same-source effects refresh while different sources stack", () => {
  const entity = new BaseEntity();
  const first = entity.applyEffect({
    sourceId: "spell-a",
    statModifiers: { sta: 2 },
    hpBonus: 3,
  });
  const refreshed = entity.applyEffect({
    sourceId: "spell-a",
    statModifiers: { sta: 1 },
    hpBonus: 1,
  });
  const stacked = entity.applyEffect({
    sourceId: "spell-b",
    statModifiers: { sta: 1 },
  });

  assert.equal(first.refreshed, false);
  assert.equal(refreshed.refreshed, true);
  assert.equal(refreshed.effectId, first.effectId);
  assert.equal(entity.activeEffects.length, 2);
  assert.equal(entity.getModifiedStat("sta"), 7);
  assert.equal(entity.maxHp, 25);
});

test("an explicitly stackable effect may add another same-source instance", () => {
  const entity = new BaseEntity();
  const first = entity.applyEffect({
    sourceId: "stacking-spell",
    hpBonus: 2,
    stacking: "stack",
  });
  const second = entity.applyEffect({
    sourceId: "stacking-spell",
    hpBonus: 2,
    stacking: "stack",
  });

  assert.notEqual(first.effectId, second.effectId);
  assert.equal(entity.activeEffects.length, 2);
  assert.equal(entity.maxHp, 24);
});

test("removing an effect preserves absolute HP and clamps only if necessary", () => {
  const entity = new BaseEntity();
  entity.hp = 18;
  const effect = entity.applyEffect({
    sourceId: "temporary-vitality",
    hpBonus: 10,
  });

  assert.equal(entity.maxHp, 30);
  assert.equal(entity.hp, 18);
  assert.equal(entity.removeEffect(effect.effectId), true);
  assert.equal(entity.maxHp, 20);
  assert.equal(entity.hp, 18);

  entity.hp = 35;
  entity.applyEffect({ sourceId: "small-buff", hpBonus: 1 });
  assert.equal(entity.hp, 21);
});

test("removing equipped HP or STA bonuses recalculates without healing", () => {
  const vitalityRing = {
    slotType: ["ring1"],
    allowedClasses: ["all"],
    statModifiers: { sta: 1 },
    hpBonus: 2,
  };
  const entity = new BaseEntity({
    classKey: "fighter",
    inventory: [vitalityRing],
  });

  assert.equal(entity.equipItem(vitalityRing, "ring1"), true);
  assert.equal(entity.maxHp, 24);
  entity.hp = 19;
  entity.unequipItem("ring1");
  assert.equal(entity.maxHp, 20);
  assert.equal(entity.hp, 19);
});
