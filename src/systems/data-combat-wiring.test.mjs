import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function moduleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}

const [baseEntitySource, characterCreationSource] = await Promise.all([
  readFile(new URL("../data/entities/BaseEntity.js", import.meta.url), "utf8"),
  readFile(new URL("./character-creation.js", import.meta.url), "utf8"),
]);
const baseEntityUrl = moduleUrl(baseEntitySource);
const characterCreationUrl = moduleUrl(
  characterCreationSource.replace(
    'import { BaseEntity } from "../data/entities/BaseEntity.js";',
    `const { BaseEntity } = await import(${JSON.stringify(baseEntityUrl)});`,
  ),
);
const [entityModule, characterModule, combatModule, initiativeModule, monsterModule] =
  await Promise.all([
    import(baseEntityUrl),
    import(characterCreationUrl),
    import(moduleUrl(await readFile(new URL("./combat-formulas.js", import.meta.url), "utf8"))),
    import(moduleUrl(await readFile(new URL("./initiative-core.js", import.meta.url), "utf8"))),
    import(moduleUrl(await readFile(new URL("../data/monsters/index.js", import.meta.url), "utf8"))),
  ]);

test("class and monster catalogs export the active runtime profiles", () => {
  assert.deepEqual(Object.keys(characterModule.CLASS_DATA), [
    ...characterModule.STARTER_CLASS_KEYS,
  ]);
  assert.equal(characterModule.CLASS_DATA.fighter.progression[1].basicAttack.name, "Melee Attack");
  assert.equal(characterModule.CLASS_DATA.archmage.sliceTray.baseSlots, 4);
  assert.equal(Object.keys(monsterModule.monsterCatalog).length, 6);
  assert.equal(monsterModule.monsterCatalog.possessed_skeleton.baseHp, 50);
});

test("entity factory builds actors with authored stats, HP, IID, and LDtk fields", () => {
  const player = entityModule.entityFactory.player({
    name: "Aster",
    classKey: "fighter",
    stats: { str: 4, sta: 5, ac: 0 },
    baseHp: 20,
    maxMp: 0,
    maxStamina: 10,
  });
  const monster = entityModule.entityFactory.monster(
    monsterModule.monsterCatalog.possessed_skeleton,
  );
  const ldtkActor = entityModule.entityFactory.fromLdtk({
    __identifier: "Enemy_Monster",
    __grid: [4, 9],
    __tags: ["Actors"],
    iid: "enemy-iid",
    fieldInstances: [
      { __identifier: "name", __value: "LDtk Guardian" },
      { __identifier: "baseClass", __value: "fighter" },
      { __identifier: "stats", __value: '{"str":4,"sta":5,"ac":2}' },
    ],
  });

  assert.equal(player.maxHp, 20);
  assert.equal(player.stats.str, 4);
  assert.equal(player.stats.ac, 0);
  assert.equal(monster.maxHp, 50);
  assert.equal(monster.stats.ac, 2);
  assert.equal(ldtkActor.id, "enemy-iid");
  assert.equal(ldtkActor.name, "LDtk Guardian");
  assert.deepEqual(ldtkActor.grid, [4, 9]);
  assert.deepEqual(ldtkActor.tags, ["Actors"]);
  assert.equal(ldtkActor.customFields.baseClass, "fighter");
});

test("combat formulas scale damage, apply hit checks, and resolve damage", () => {
  const actor = entityModule.entityFactory.player({
    name: "Striker",
    classKey: "fighter",
    stats: { str: 4, dex: 0, int: 0, wis: 0, char: 0, agil: 0, sta: 5, ac: 0 },
    baseHp: 20,
  });
  const target = entityModule.entityFactory.monster({
    name: "Target",
    classKey: "fighter",
    stats: { str: 0, dex: 0, int: 0, wis: 0, char: 0, agil: 0, sta: 5, ac: 0 },
    baseHp: 20,
  });
  const action = {
    name: "Melee Attack",
    basePower: 10,
    damageType: "physical",
    accuracy: 1,
  };

  assert.equal(
    combatModule.calculateStatScaling(actor, "physical"),
    0.2,
  );
  assert.equal(
    combatModule.calculateBaseDamage(actor, action).physical,
    12,
  );
  assert.equal(
    combatModule.calculateFinalMitigation(2, "physical", {
      stats: { ac: 10 },
    }).damage,
    1,
  );
  assert.equal(
    combatModule.calculateFinalMitigation(10, "psychic", {
      invulnerabilities: ["psychic"],
    }).damage,
    0,
  );

  const originalRandom = Math.random;
  Math.random = () => 0.5;
  try {
    const result = combatModule.CombatFormulas.executeClassAction(
      actor,
      target,
      "Melee Attack",
      {
        fighter: {
          progression: {
            1: { basicAttack: action },
          },
        },
      },
    );
    assert.equal(result.status, "HIT");
    assert.equal(result.value, 12);
    assert.equal(target.hp, 8);
  } finally {
    Math.random = originalRandom;
  }
});

test("initiative queue sorts by agility and skips defeated combatants", () => {
  const slower = entityModule.entityFactory.player({
    name: "Slower",
    stats: { agil: 2, sta: 5 },
  });
  const faster = entityModule.entityFactory.player({
    name: "Faster",
    stats: { agil: 5, sta: 5 },
  });
  const defeated = entityModule.entityFactory.monster({
    name: "Defeated",
    stats: { agil: 9, sta: 5 },
    hp: 0,
  });
  const queue = new initiativeModule.InitiativeQueue([
    slower,
    defeated,
    faster,
  ]);

  assert.deepEqual(queue.combatants, [faster, slower]);
  assert.equal(queue.current, faster);
  assert.equal(queue.advance(), slower);
  assert.equal(queue.advance(), faster);
});
