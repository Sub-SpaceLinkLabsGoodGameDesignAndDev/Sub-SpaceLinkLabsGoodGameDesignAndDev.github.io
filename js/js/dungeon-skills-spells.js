// Skills and Spells: logic, Effects, and Functions Seperated by Class.
const archmageSkills = {"list": [
    {
        "name": "Meteorite",
        "skillType": ["magic", "spell"],
        "description": "A summoned meteorite falls from above and explodes on impact.",
        "targetType": "single",
        "damageType": ["fire", "physical"],
        "resistable": { "fireDamage": true, "physicalDamage": false },
        "basePower": 30,
        "fireDamage": 20,
        "physicalDamage": 10,
        "cost": 20,
        "costType": "mp",
        "isHeal": false,
        "effects": [
            { "name": "burn", "chance": 0.8, "resistable": true, "duration": 4 },
            { "name": "stun", "chance": 0.2, "resistable": false, "duration": 1 }
        ],
        "spellParticles": { "name": "getElementById.spell-sprite.meteorite", "duration": 2, "intensity": "high", "target": "attacker.target" },
    },
    {
        "name": "arcane surge",
        "skillType": ["magic", "spell"],
        "description": "A surge of arcane energy that asaults the target with a shocking magic bolt.",
        "targetType": "single",
        "damageType": ["arcane"],
        "resistable": { "arcaneDamage": true },
        "basePower": 25,
        "arcaneDamage": 25, 
        "cost": 15,
        "costType": "mp",
        "isHeal": false,
        "effects": [
            { "name": "stun", "chance": 0.2, "resistable": true, "duration": 3 }
        ],
        "spell-sprites": { "name": "arcanesurge", "duration": 2, "intensity": "high", "target": "attacker.target" },
    }

]} 