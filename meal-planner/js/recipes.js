// Static data: shopping categories, units, an ingredient->category lookup,
// and the built-in recipe book. Everything here is plain data so the app
// keeps working fully offline with zero network calls.

// Order controls how the shopping list groups items on screen.
export const CATEGORIES = [
  { id: 'produce', label: 'ירקות ופירות', icon: '🥬' },
  { id: 'meat', label: 'בשר ועוף', icon: '🍗' },
  { id: 'fish', label: 'דגים', icon: '🐟' },
  { id: 'dairy', label: 'מוצרי חלב וביצים', icon: '🧀' },
  { id: 'dry', label: 'יבשים ודגנים', icon: '🌾' },
  { id: 'canned', label: 'שימורים ורטבים', icon: '🥫' },
  { id: 'spices', label: 'תבלינים', icon: '🧂' },
  { id: 'bakery', label: 'מאפייה ולחם', icon: '🍞' },
  { id: 'oils', label: 'שמנים', icon: '🫒' },
  { id: 'other', label: 'אחר', icon: '🛒' },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// Unit metadata used for aggregation + pantry-vs-recipe comparisons.
// Units of the same "kind" convert into one another via `toBase`; units of
// different kinds are never merged (e.g. grams never satisfy "יחידה").
export const UNITS = [
  { id: 'גרם', label: 'גרם', kind: 'weight', toBase: 1 },
  { id: 'קג', label: 'ק"ג', kind: 'weight', toBase: 1000 },
  { id: 'מל', label: 'מ"ל', kind: 'volume', toBase: 1 },
  { id: 'ליטר', label: 'ליטר', kind: 'volume', toBase: 1000 },
  { id: 'כוס', label: 'כוס', kind: 'volume', toBase: 240 },
  { id: 'כף', label: 'כף', kind: 'volume', toBase: 15 },
  { id: 'כפית', label: 'כפית', kind: 'volume', toBase: 5 },
  { id: 'יחידה', label: "יח'", kind: 'count-יחידה', toBase: 1 },
  { id: 'חבילה', label: 'חבילה', kind: 'count-חבילה', toBase: 1 },
  { id: 'שן', label: 'שן שום', kind: 'count-שן', toBase: 1 },
  { id: 'פרוסה', label: 'פרוסה', kind: 'count-פרוסה', toBase: 1 },
  { id: 'גבעול', label: 'גבעול', kind: 'count-גבעול', toBase: 1 },
  { id: 'קופסה', label: 'קופסה/שימורים', kind: 'count-קופסה', toBase: 1 },
  { id: 'שקית', label: 'שקית', kind: 'count-שקית', toBase: 1 },
  { id: 'ראש', label: 'ראש (שום)', kind: 'count-ראש', toBase: 1 },
];

export const UNIT_BY_ID = Object.fromEntries(UNITS.map((u) => [u.id, u]));

export function convert(quantity, fromUnitId, toUnitId) {
  const from = UNIT_BY_ID[fromUnitId];
  const to = UNIT_BY_ID[toUnitId];
  if (!from || !to || from.kind !== to.kind) return null;
  return (quantity * from.toBase) / to.toBase;
}

// Maps a normalized ingredient name to a shopping category. Used both to
// group recipe ingredients and to auto-suggest a category while the user
// types a pantry item or a custom ingredient name.
export const INGREDIENT_CATEGORY_MAP = {
  'עגבניות': 'produce', 'עגבניה': 'produce', 'עגבניות שרי': 'produce',
  'מלפפון': 'produce', 'מלפפונים': 'produce', 'בצל': 'produce', 'בצל סגול': 'produce',
  'בצל ירוק': 'produce', 'שום': 'produce', 'גזר': 'produce', 'תפוח אדמה': 'produce',
  'תפוחי אדמה': 'produce', 'קישוא': 'produce', 'קישואים': 'produce', 'פלפל אדום': 'produce',
  'פלפל ירוק': 'produce', 'פלפל צבעוני': 'produce', 'סלרי': 'produce', 'דלעת': 'produce',
  'לימון': 'produce', 'פטרוזיליה': 'produce', 'כוסברה': 'produce', 'שמיר': 'produce',
  'בזיליקום': 'produce', "פטרוזיליה שורש": 'produce', 'תירס': 'produce', 'ג\'ינג\'ר': 'produce',
  'תירס מתוק': 'produce', 'חסה': 'produce', 'אפונה': 'produce',

  'בשר טחון': 'meat', 'חזה עוף': 'meat', 'שוקי עוף': 'meat', 'עוף שלם': 'meat',
  'חלקי עוף': 'meat', 'כרעיים עוף': 'meat', 'בשר בקר': 'meat', 'כתף בקר': 'meat',

  'פילה סלמון': 'fish', 'דג': 'fish', 'טונה': 'fish',

  'ביצים': 'dairy', 'ביצה': 'dairy', 'שמנת מתוקה': 'dairy', 'חמאה': 'dairy',
  'פרמזן': 'dairy', 'גבינה צהובה': 'dairy', 'גבינה בולגרית': 'dairy', 'מוצרלה': 'dairy',
  'חלב': 'dairy', 'יוגורט': 'dairy', 'לבנה': 'dairy', 'שמנת חמוצה': 'dairy',

  'פסטה': 'dry', 'אורז': 'dry', 'קמח': 'dry', 'עדשים': 'dry', 'גרגירי חומוס': 'dry',
  'חומוס יבש': 'dry', 'טחינה גולמית': 'dry', 'פירורי לחם': 'dry', 'שמרים יבשים': 'dry',
  'אבקת אפייה': 'dry', 'סוכר': 'dry', 'קוסקוס': 'dry', 'בורגול': 'dry',

  'רסק עגבניות': 'canned', 'עגבניות מרוסקות': 'canned', 'זיתי קלמטה': 'canned',
  'רוטב סויה': 'canned', 'דבש': 'canned',

  'מלח': 'spices', 'פלפל שחור': 'spices', 'אורגנו': 'spices', 'כמון': 'spices',
  'פפריקה': 'spices', 'כוסברה טחונה': 'spices', 'אגוז מוסקט': 'spices', 'שומשום': 'spices',
  'רוזמרין': 'spices', 'כורכום': 'spices',

  'לחם טוסט': 'bakery', 'לחם': 'bakery', 'פיתות': 'bakery',

  'שמן זית': 'oils', 'שמן': 'oils', 'שמן שומשום': 'oils', 'שמן לטיגון': 'oils',
};

export function normalize(text) {
  return (text || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '') // strip Hebrew niqqud/cantillation
    .replace(/["'’״`]/g, '')
    .replace(/\s+/g, ' ');
}

export function guessCategory(name) {
  const key = normalize(name);
  return INGREDIENT_CATEGORY_MAP[key] || 'other';
}

function ing(name, quantity, unit) {
  return { name, quantity, unit, category: guessCategory(name) };
}

// 20 built-in recipes, ingredient quantities scaled for 4 servings.
export const RECIPES = [
  {
    id: 'bolognese', nameHe: 'פסטה בולונז', nameEn: 'Pasta Bolognese', servings: 4,
    ingredients: [
      ing('פסטה', 400, 'גרם'), ing('בשר טחון', 500, 'גרם'), ing('בצל', 2, 'יחידה'),
      ing('שום', 3, 'שן'), ing('רסק עגבניות', 1, 'קופסה'), ing('עגבניות מרוסקות', 400, 'גרם'),
      ing('גזר', 1, 'יחידה'), ing('שמן זית', 2, 'כף'), ing('מלח', 1, 'כפית'),
      ing('פלפל שחור', 1, 'כפית'), ing('אורגנו', 1, 'כפית'), ing('פרמזן', 50, 'גרם'),
    ],
  },
  {
    id: 'schnitzel', nameHe: 'שניצל', nameEn: 'Schnitzel', servings: 4,
    ingredients: [
      ing('חזה עוף', 8, 'יחידה'), ing('ביצים', 3, 'יחידה'), ing('פירורי לחם', 2, 'כוס'),
      ing('קמח', 1, 'כוס'), ing('מלח', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
      ing('שמן לטיגון', 300, 'מל'),
    ],
  },
  {
    id: 'hummus', nameHe: 'חומוס', nameEn: 'Hummus', servings: 4,
    ingredients: [
      ing('גרגירי חומוס', 500, 'גרם'), ing('טחינה גולמית', 1, 'כוס'), ing('לימון', 2, 'יחידה'),
      ing('שום', 3, 'שן'), ing('שמן זית', 3, 'כף'), ing('כמון', 1, 'כפית'), ing('מלח', 1, 'כפית'),
      ing('פטרוזיליה', 1, 'יחידה'),
    ],
  },
  {
    id: 'chopped-salad', nameHe: 'סלט קצוץ ישראלי', nameEn: 'Israeli Chopped Salad', servings: 4,
    ingredients: [
      ing('עגבניות', 4, 'יחידה'), ing('מלפפונים', 4, 'יחידה'), ing('בצל סגול', 1, 'יחידה'),
      ing('פלפל צבעוני', 1, 'יחידה'), ing('לימון', 1, 'יחידה'), ing('שמן זית', 2, 'כף'),
      ing('מלח', 1, 'כפית'), ing('פטרוזיליה', 1, 'יחידה'),
    ],
  },
  {
    id: 'chicken-soup', nameHe: 'מרק עוף', nameEn: 'Chicken Soup', servings: 4,
    ingredients: [
      ing('חלקי עוף', 1, 'קג'), ing('גזר', 3, 'יחידה'), ing('סלרי', 3, 'גבעול'),
      ing('בצל', 2, 'יחידה'), ing('תפוחי אדמה', 3, 'יחידה'), ing('פטרוזיליה שורש', 1, 'יחידה'),
      ing('מלח', 2, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
    ],
  },
  {
    id: 'alfredo', nameHe: 'פסטה אלפרדו', nameEn: 'Pasta Alfredo', servings: 4,
    ingredients: [
      ing('פסטה', 400, 'גרם'), ing('שמנת מתוקה', 500, 'מל'), ing('חמאה', 100, 'גרם'),
      ing('פרמזן', 100, 'גרם'), ing('שום', 2, 'שן'), ing('מלח', 1, 'כפית'),
      ing('אגוז מוסקט', 1, 'כפית'),
    ],
  },
  {
    id: 'rice-vegetables', nameHe: 'אורז עם ירקות', nameEn: 'Rice with Vegetables', servings: 4,
    ingredients: [
      ing('אורז', 2, 'כוס'), ing('גזר', 2, 'יחידה'), ing('אפונה', 1, 'כוס'),
      ing('תירס', 1, 'כוס'), ing('בצל', 1, 'יחידה'), ing('שמן', 2, 'כף'),
      ing('כורכום', 1, 'כפית'), ing('מלח', 1, 'כפית'),
    ],
  },
  {
    id: 'shakshuka', nameHe: 'שקשוקה', nameEn: 'Shakshuka', servings: 4,
    ingredients: [
      ing('ביצים', 8, 'יחידה'), ing('עגבניות מרוסקות', 800, 'גרם'), ing('בצל', 1, 'יחידה'),
      ing('פלפל אדום', 1, 'יחידה'), ing('שום', 3, 'שן'), ing('פפריקה', 1, 'כפית'),
      ing('כמון', 1, 'כפית'), ing('מלח', 1, 'כפית'), ing('לחם', 1, 'יחידה'),
    ],
  },
  {
    id: 'roast-chicken', nameHe: 'עוף בתנור עם תפוחי אדמה', nameEn: 'Roast Chicken with Potatoes', servings: 4,
    ingredients: [
      ing('שוקי עוף', 8, 'יחידה'), ing('תפוחי אדמה', 6, 'יחידה'), ing('שום', 1, 'ראש'),
      ing('שמן זית', 3, 'כף'), ing('פפריקה', 1, 'כף'), ing('מלח', 1, 'כף'),
      ing('רוזמרין', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
    ],
  },
  {
    id: 'meatballs', nameHe: 'קציצות בקר', nameEn: 'Beef Meatballs', servings: 4,
    ingredients: [
      ing('בשר טחון', 600, 'גרם'), ing('בצל', 1, 'יחידה'), ing('ביצים', 1, 'יחידה'),
      ing('פירורי לחם', 0.5, 'כוס'), ing('פטרוזיליה', 1, 'יחידה'), ing('מלח', 1, 'כפית'),
      ing('פלפל שחור', 1, 'כפית'), ing('רסק עגבניות', 2, 'כף'),
    ],
  },
  {
    id: 'pomodoro', nameHe: 'פסטה ברוטב עגבניות', nameEn: 'Pasta Pomodoro', servings: 4,
    ingredients: [
      ing('פסטה', 400, 'גרם'), ing('עגבניות מרוסקות', 800, 'גרם'), ing('שום', 3, 'שן'),
      ing('בזיליקום', 1, 'יחידה'), ing('שמן זית', 3, 'כף'), ing('מלח', 1, 'כפית'),
      ing('פרמזן', 50, 'גרם'),
    ],
  },
  {
    id: 'vegetable-soup', nameHe: 'מרק ירקות', nameEn: 'Vegetable Soup', servings: 4,
    ingredients: [
      ing('תפוחי אדמה', 2, 'יחידה'), ing('גזר', 3, 'יחידה'), ing('קישואים', 2, 'יחידה'),
      ing('בצל', 1, 'יחידה'), ing('סלרי', 2, 'גבעול'), ing('דלעת', 300, 'גרם'),
      ing('מלח', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
    ],
  },
  {
    id: 'soy-chicken', nameHe: 'עוף ברוטב סויה', nameEn: 'Soy Sauce Chicken', servings: 4,
    ingredients: [
      ing('חזה עוף', 600, 'גרם'), ing('רוטב סויה', 0.5, 'כוס'), ing('דבש', 2, 'כף'),
      ing('שום', 3, 'שן'), ing("ג'ינג'ר", 1, 'יחידה'), ing('שמן שומשום', 1, 'כף'),
      ing('בצל ירוק', 2, 'יחידה'), ing('שומשום', 1, 'כף'),
    ],
  },
  {
    id: 'greek-salad', nameHe: 'סלט יווני', nameEn: 'Greek Salad', servings: 4,
    ingredients: [
      ing('עגבניות', 4, 'יחידה'), ing('מלפפון', 2, 'יחידה'), ing('פלפל ירוק', 1, 'יחידה'),
      ing('בצל סגול', 1, 'יחידה'), ing('זיתי קלמטה', 1, 'כוס'), ing('גבינה בולגרית', 200, 'גרם'),
      ing('שמן זית', 2, 'כף'), ing('אורגנו', 1, 'כפית'),
    ],
  },
  {
    id: 'baked-salmon', nameHe: 'פילה סלמון בתנור', nameEn: 'Baked Salmon', servings: 4,
    ingredients: [
      ing('פילה סלמון', 4, 'יחידה'), ing('לימון', 1, 'יחידה'), ing('שום', 2, 'שן'),
      ing('שמן זית', 2, 'כף'), ing('מלח', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
      ing('שמיר', 1, 'יחידה'),
    ],
  },
  {
    id: 'vegetable-pashtida', nameHe: 'פשטידת ירקות', nameEn: 'Vegetable Pashtida (Quiche)', servings: 4,
    ingredients: [
      ing('קמח', 1.5, 'כוס'), ing('ביצים', 4, 'יחידה'), ing('שמן', 80, 'מל'),
      ing('אבקת אפייה', 1, 'כפית'), ing('קישואים', 2, 'יחידה'), ing('גזר', 1, 'יחידה'),
      ing('גבינה צהובה', 1, 'כוס'), ing('מלח', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
    ],
  },
  {
    id: 'lentil-stew', nameHe: 'עדשים עם אורז (מג׳דרה)', nameEn: 'Lentils with Rice (Mujadara)', servings: 4,
    ingredients: [
      ing('עדשים', 2, 'כוס'), ing('אורז', 1, 'כוס'), ing('בצל', 3, 'יחידה'),
      ing('שמן', 4, 'כף'), ing('כמון', 1, 'כפית'), ing('מלח', 1, 'כפית'),
    ],
  },
  {
    id: 'falafel', nameHe: 'פלאפל', nameEn: 'Falafel', servings: 4,
    ingredients: [
      ing('חומוס יבש', 500, 'גרם'), ing('בצל', 1, 'יחידה'), ing('שום', 4, 'שן'),
      ing('פטרוזיליה', 1, 'יחידה'), ing('כוסברה', 1, 'יחידה'), ing('כמון', 1, 'כף'),
      ing('כוסברה טחונה', 1, 'כף'), ing('אבקת אפייה', 1, 'כפית'), ing('שמן לטיגון', 500, 'מל'),
    ],
  },
  {
    id: 'grilled-cheese', nameHe: 'טוסט גבינה', nameEn: 'Grilled Cheese Toast', servings: 4,
    ingredients: [
      ing('לחם טוסט', 8, 'פרוסה'), ing('גבינה צהובה', 8, 'פרוסה'), ing('חמאה', 2, 'כף'),
    ],
  },
  {
    id: 'pizza', nameHe: 'פיצה ביתית', nameEn: 'Homemade Pizza', servings: 4,
    ingredients: [
      ing('קמח', 500, 'גרם'), ing('שמרים יבשים', 1, 'שקית'), ing('שמן זית', 2, 'כף'),
      ing('רסק עגבניות', 1, 'קופסה'), ing('מוצרלה', 400, 'גרם'), ing('אורגנו', 1, 'כפית'),
      ing('מלח', 1, 'כפית'), ing('סוכר', 1, 'כפית'),
    ],
  },
];

export function findRecipe(query) {
  const key = normalize(query);
  if (!key) return null;
  let exact = RECIPES.find((r) => normalize(r.nameHe) === key || normalize(r.nameEn) === key);
  if (exact) return exact;
  let partial = RECIPES.find(
    (r) => normalize(r.nameHe).includes(key) || normalize(r.nameEn).toLowerCase().includes(key) ||
      key.includes(normalize(r.nameHe))
  );
  return partial || null;
}
