import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const classData = {
  fighter: {
    name: "Fighter",
    progression: {
      1: {
        basicAttack: {
          name: "Melee Attack",
          cost: 0,
          costType: "stamina",
          basePower: 10,
          damageType: "physical",
        },
      },
    },
  },
};

async function loadCombatModule() {
  const [combatSource, entitySource, fighterSource] = await Promise.all([
    readFile(new URL("../../../js/dungeon-combat.js", import.meta.url), "utf8"),
    readFile(new URL("./BaseEntity.js", import.meta.url), "utf8"),
    readFile(
      new URL("../../systems/fighter-combat-logic.js", import.meta.url),
      "utf8",
    ),
  ]);
  const entityModuleUrl = `data:text/javascript;base64,${Buffer.from(entitySource).toString("base64")}`;
  const fighterModuleUrl = `data:text/javascript;base64,${Buffer.from(fighterSource).toString("base64")}`;
  const weaponCatalog = {
    vitality_test_weapon: {
      name: "STA Test Weapon",
      description: "",
      basePower: 0,
      damageType: "physical",
      accuracy: 1,
      handsRequired: 1,
      statModifiers: { sta: 2 },
      onHitEffects: [],
    },
  };

  const source = combatSource
    .replace(
      'import { CLASS_DATA, WEAPON_CATALOG } from "./dungeon-data.js";',
      `const CLASS_DATA = ${JSON.stringify(classData)};\nconst WEAPON_CATALOG = ${JSON.stringify(weaponCatalog)};`,
    )
    .replace(
      'import { BaseEntity as StatEntity } from "../src/data/entities/BaseEntity.js";',
      `const { BaseEntity: StatEntity } = await import(${JSON.stringify(entityModuleUrl)});`,
    )
    .replace(
      /import \{\s*calculateEvasionChance,\s*calculateParryChance,\s*calculateStanceArmorClass,\s*resolveStanceDamage,\s*\} from "\.\.\/src\/systems\/fighter-combat-logic\.js";/,
      `const { calculateEvasionChance, calculateParryChance, calculateStanceArmorClass, resolveStanceDamage } = await import(${JSON.stringify(fighterModuleUrl)});`,
    );

  assert.doesNotMatch(source, /^import /m);
  const [combatModule, fighterModule] = await Promise.all([
    import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`),
    import(fighterModuleUrl),
  ]);
  return { ...combatModule, ...fighterModule };
}

const { CombatFormulas, entityFactory, activateFighterStance } =
  await loadCombatModule();

test("live combat entities derive max HP from STA instead of legacy HP defaults", () => {
  const fighter = entityFactory.player({ name: "Test Fighter", classKey: "fighter" });
  const monster = entityFactory.monster({
    name: "Test Monster",
    classKey: "fighter",
    stats: { sta: 6 },
    hp: 50,
    maxHp: 50,
  });

  assert.equal(fighter.maxHp, 20);
  assert.equal(fighter.hp, 20);
  assert.equal(monster.maxHp, 22);
  assert.equal(monster.hp, 22);
});

test("weapon STA modifiers and effects update live maximum HP without healing", () => {
  const fighter = entityFactory.player({
    classKey: "fighter",
    startingWeaponKey: "vitality_test_weapon",
  });
  assert.equal(fighter.maxHp, 24);

  fighter.hp = 18;
  const effect = fighter.applyEffect({
    sourceId: "temporary-vitality",
    statModifiers: { sta: 1 },
  });
  assert.equal(fighter.maxHp, 26);
  assert.equal(fighter.hp, 18);

  fighter.removeEffect(effect.effectId);
  assert.equal(fighter.maxHp, 24);
  assert.equal(fighter.hp, 18);
});

test("fighter stance logic modifies live melee damage and incoming defense", () => {
  const originalRandom = Math.random;
  Math.random = () => 0.5;
  try {
    const fighter = entityFactory.player({
      name: "Test Fighter",
      classKey: "fighter",
    });
    const target = entityFactory.monster({
      name: "Target",
      classKey: "fighter",
      stats: { ac: 0, sta: 5 },
    });
    const balanced = CombatFormulas.executeClassAction(
      fighter,
      target,
      "Melee Attack",
      classData,
    );

    fighter.stamina = 10;
    assert.equal(activateFighterStance(fighter, "AGGRESSIVE").activated, true);
    const aggressive = CombatFormulas.executeClassAction(
      fighter,
      target,
      "Melee Attack",
      classData,
    );

    assert.equal(balanced.value, 10);
    assert.equal(aggressive.value, 12);

    fighter.level = 30;
    assert.equal(activateFighterStance(fighter, "BULWARK").activated, true);
    const balancedDefense = CombatFormulas.calculateFinalMitigation(
      100,
      "physical",
      entityFactory.player({ classKey: "fighter", stats: { ac: 10 } }),
    );
    const bulwarkDefense = CombatFormulas.calculateFinalMitigation(
      100,
      "physical",
      fighter,
    );
    assert.ok(bulwarkDefense.damage < balancedDefense.damage);
  } finally {
    Math.random = originalRandom;
  }
});
