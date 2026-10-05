function getAgility(combatant) {
  if (!combatant || typeof combatant !== "object") {
    throw new TypeError("Each combatant must be an entity object.");
  }

  const agility =
    typeof combatant.getModifiedStat === "function"
      ? combatant.getModifiedStat("agil")
      : combatant.stats?.agil;
  if (typeof agility !== "number" || !Number.isFinite(agility)) {
    throw new TypeError("Each combatant must have a finite agility value.");
  }
  return agility;
}

export function sortInitiative(combatants) {
  if (!Array.isArray(combatants)) {
    throw new TypeError("Combatants must be provided as an array.");
  }

  return combatants
    .map((combatant, index) => ({ combatant, index, agility: getAgility(combatant) }))
    .filter(({ combatant }) => combatant.hp === undefined || combatant.hp > 0)
    .sort(
      (first, second) =>
        second.agility - first.agility || first.index - second.index,
    )
    .map(({ combatant }) => combatant);
}

export class InitiativeQueue {
  constructor(combatants = []) {
    this.combatants = sortInitiative(combatants);
    this.currentIndex = 0;
  }

  get current() {
    return this.combatants[this.currentIndex] ?? null;
  }

  get finished() {
    return this.combatants.length === 0;
  }

  advance() {
    if (this.finished) return null;
    this.currentIndex = (this.currentIndex + 1) % this.combatants.length;
    return this.current;
  }

  refresh(combatants = this.combatants) {
    const currentCombatant = this.current;
    this.combatants = sortInitiative(combatants);
    const currentPosition = this.combatants.indexOf(currentCombatant);
    this.currentIndex = currentPosition === -1 ? 0 : currentPosition;
    return [...this.combatants];
  }
}

export const InitiativeCore = Object.freeze({
  sort: sortInitiative,
  createQueue(combatants) {
    return new InitiativeQueue(combatants);
  },
});