import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loaderSource = await readFile(
  new URL("../../../js/ldtk-level-loader.js", import.meta.url),
  "utf8",
);
const { createLdtkRuntimeLevel } = await import(
  `data:text/javascript;base64,${Buffer.from(loaderSource).toString("base64")}`
);
const project = JSON.parse(
  await readFile(new URL("./realms_of_infinity.ldtk", import.meta.url), "utf8"),
);
const oakhaven = JSON.parse(
  await readFile(
    new URL("./realms_of_infinity/Oakhaven_1.ldtkl", import.meta.url),
    "utf8",
  ),
);

test("Oakhaven loads its authored grid, safe-zone field, and cobblestone spawn", () => {
  const level = createLdtkRuntimeLevel(project, oakhaven);

  assert.equal(level.identifier, "Oakhaven_1");
  assert.equal(level.safeZone, true);
  assert.deepEqual(level.spawn, { x: 16.5, y: 29.5 });
  assert.equal(level.terrainGrid[29][16], "COBBLESTONE_ROAD");
  assert.equal(level.collisionGrid[29][16], 0);
});

test("IntGrid identifiers preserve blocking walls, closed doors, and passable terrain", () => {
  const level = createLdtkRuntimeLevel(project, oakhaven);

  assert.equal(level.terrainGrid[0][0], "SOLID_STRUCTURAL_WALL");
  assert.equal(level.collisionGrid[0][0], 1);
  assert.equal(level.terrainGrid[29][15], "COBBLESTONE_ROAD");
  assert.equal(level.collisionGrid[29][15], 0);
});

test("IntGrid values 1 through 15 use the authored blocking and walkability rules", () => {
  const structuralDefinition = project.defs.layers.find(
    (layer) => layer.identifier === "Structural_Grid",
  );
  const syntheticLevel = {
    identifier: "TileRules",
    fieldInstances: [{ __identifier: "Safe_Zone", __value: false }],
    layerInstances: [
      {
        __identifier: "Structural_Grid",
        layerDefUid: structuralDefinition.uid,
        __cWid: 16,
        __cHei: 1,
        intGridCsv: Array.from({ length: 16 }, (_, value) => value),
      },
      {
        __identifier: "Actors",
        entityInstances: [
          {
            __identifier: "PLAYER_SPAWN",
            __grid: [11, 0],
            defUid: project.defs.entities.find(
              (entity) => entity.identifier === "PLAYER_SPAWN",
            ).uid,
          },
        ],
      },
    ],
  };
  const level = createLdtkRuntimeLevel(project, syntheticLevel);

  assert.deepEqual(level.collisionGrid[0], [
    0, 1, 2, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0,
  ]);
  assert.equal(level.terrainGrid[0][3], "CAVE_WALL");
});

test("missing or duplicate player spawns are rejected", () => {
  const noSpawn = structuredClone(oakhaven);
  noSpawn.layerInstances[0].entityInstances = [];
  assert.throws(
    () => createLdtkRuntimeLevel(project, noSpawn),
    /exactly one PLAYER_SPAWN entity; found 0/,
  );

  const duplicateSpawn = structuredClone(oakhaven);
  duplicateSpawn.layerInstances[0].entityInstances.push(
    structuredClone(oakhaven.layerInstances[0].entityInstances[0]),
  );
  assert.throws(
    () => createLdtkRuntimeLevel(project, duplicateSpawn),
    /exactly one PLAYER_SPAWN entity; found 2/,
  );
});
