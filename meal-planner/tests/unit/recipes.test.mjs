// Pure-logic unit tests for js/recipes.js - no DOM, no server, run with:
//   node --test tests/unit/
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIES, UNITS, MEAL_TYPES, RECIPES, ASSUMED_STAPLES,
  normalize, guessCategory, findRecipe, convert, pickDefaultMealType,
} from '../../js/recipes.js';

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
const UNIT_IDS = new Set(UNITS.map((u) => u.id));
const MEAL_TYPE_IDS = new Set(MEAL_TYPES.map((m) => m.id));

const MEAT_NAMES = new Set([
  'בשר טחון', 'חזה עוף', 'שוקי עוף', 'עוף שלם', 'חלקי עוף',
  'כרעיים עוף', 'בשר בקר', 'כתף בקר', 'פרגיות', 'נקניק הודו',
]);
const DAIRY_NAMES = new Set([
  'שמנת מתוקה', 'חמאה', 'פרמזן', 'גבינה צהובה', 'גבינה בולגרית',
  'מוצרלה', 'חלב', 'יוגורט', 'לבנה', 'שמנת חמוצה',
]);

describe('recipe book integrity', () => {
  test('has a substantial number of built-in recipes', () => {
    assert.ok(RECIPES.length >= 50, `expected 50+ recipes, got ${RECIPES.length}`);
  });

  test('every recipe id is unique', () => {
    const ids = RECIPES.map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate recipe ids found');
  });

  test('every recipe has required fields with sane values', () => {
    for (const r of RECIPES) {
      assert.ok(r.id, `${r.nameHe}: missing id`);
      assert.ok(r.nameHe, `${r.id}: missing nameHe`);
      assert.ok(r.nameEn, `${r.id}: missing nameEn`);
      assert.equal(r.servings, 4, `${r.id}: servings should be 4`);
      assert.ok(Array.isArray(r.mealTypes) && r.mealTypes.length > 0, `${r.id}: missing mealTypes`);
      for (const mt of r.mealTypes) {
        assert.ok(MEAL_TYPE_IDS.has(mt), `${r.id}: unknown mealType "${mt}"`);
      }
      assert.ok(Array.isArray(r.ingredients) && r.ingredients.length > 0, `${r.id}: no ingredients`);
    }
  });

  test('every ingredient has a valid unit and category', () => {
    for (const r of RECIPES) {
      for (const ing of r.ingredients) {
        assert.ok(ing.name && ing.name.trim(), `${r.id}: ingredient with empty name`);
        assert.ok(typeof ing.quantity === 'number' && ing.quantity > 0, `${r.id}/${ing.name}: bad quantity`);
        assert.ok(UNIT_IDS.has(ing.unit), `${r.id}/${ing.name}: unknown unit "${ing.unit}"`);
        assert.ok(CATEGORY_IDS.has(ing.category), `${r.id}/${ing.name}: unknown category "${ing.category}"`);
      }
    }
  });

  test('no recipe mixes meat and dairy ingredients (kosher home-cooking constraint)', () => {
    const violations = [];
    for (const r of RECIPES) {
      const names = r.ingredients.map((i) => i.name);
      const hasMeat = names.some((n) => MEAT_NAMES.has(n));
      const hasDairy = names.some((n) => DAIRY_NAMES.has(n));
      if (hasMeat && hasDairy) violations.push(r.id);
    }
    assert.deepEqual(violations, [], `recipes mixing meat and dairy: ${violations.join(', ')}`);
  });
});

describe('normalize()', () => {
  test('strips niqqud and quote marks', () => {
    assert.equal(normalize('שְׁנִיצֶל'), 'שניצל');
    assert.equal(normalize('ג\'ינג\'ר'), 'גינגר');
  });
  test('trims and lowercases', () => {
    assert.equal(normalize('  Schnitzel  '), 'schnitzel');
  });
  test('collapses internal whitespace', () => {
    assert.equal(normalize('פסטה   בולונז'), 'פסטה בולונז');
  });
});

describe('guessCategory()', () => {
  test('resolves a known ingredient', () => {
    assert.equal(guessCategory('עגבניות'), 'produce');
    assert.equal(guessCategory('בשר טחון'), 'meat');
  });
  test('falls back to "other" for unknown ingredients', () => {
    assert.equal(guessCategory('משהו שלא קיים בכלל'), 'other');
  });
});

describe('convert()', () => {
  test('converts within the same unit kind', () => {
    assert.equal(convert(1000, 'גרם', 'קג'), 1);
    assert.equal(convert(2, 'כף', 'מל'), 30);
    assert.equal(convert(1, 'כוס', 'מל'), 240);
  });
  test('returns null across incompatible unit kinds', () => {
    assert.equal(convert(1, 'כוס', 'גרם'), null);
    assert.equal(convert(1, 'יחידה', 'קג'), null);
  });
  test('returns null for unknown units', () => {
    assert.equal(convert(1, 'משהו', 'גרם'), null);
  });
});

describe('findRecipe()', () => {
  test('matches an exact Hebrew name', () => {
    assert.equal(findRecipe('שניצל')?.id, 'schnitzel');
  });
  test('matches an exact English name case-insensitively', () => {
    assert.equal(findRecipe('schnitzel')?.id, 'schnitzel');
    assert.equal(findRecipe('Schnitzel')?.id, 'schnitzel');
  });
  test('matches a partial name', () => {
    assert.equal(findRecipe('חומוס')?.id, 'hummus');
  });
  test('returns null for a dish that does not exist', () => {
    assert.equal(findRecipe('מנה שלא קיימת בכלל וזה בכוונה'), null);
  });
  test('returns null for empty input', () => {
    assert.equal(findRecipe(''), null);
    assert.equal(findRecipe('   '), null);
  });
});

describe('pickDefaultMealType()', () => {
  test('always returns one of the three known meal types', () => {
    assert.ok(MEAL_TYPE_IDS.has(pickDefaultMealType()));
  });
});

describe('ASSUMED_STAPLES', () => {
  test('contains common basics like salt and oil', () => {
    assert.ok(ASSUMED_STAPLES.has('מלח'));
    assert.ok(ASSUMED_STAPLES.has('שמן זית'));
    assert.ok(ASSUMED_STAPLES.has('כמון'));
  });
  test('excludes "special" spices/oils that aren\'t universally on hand', () => {
    assert.ok(!ASSUMED_STAPLES.has('אבקת קארי'));
    assert.ok(!ASSUMED_STAPLES.has('פפריקה חריפה'));
    assert.ok(!ASSUMED_STAPLES.has('שמן שומשום'));
    assert.ok(!ASSUMED_STAPLES.has('טחינה גולמית'));
  });
  test('every staple name is a real ingredient used somewhere in the recipe book', () => {
    const allIngredientNames = new Set(RECIPES.flatMap((r) => r.ingredients.map((i) => i.name)));
    for (const staple of ASSUMED_STAPLES) {
      assert.ok(allIngredientNames.has(staple), `"${staple}" is a staple but no recipe uses that exact name`);
    }
  });
});
