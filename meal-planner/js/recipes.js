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

// The three daily meal slots the planner is built around. Bold, saturated,
// pop-art-flat colors (not soft pastels) to match the app's loud visual
// identity. Colors are full literal Tailwind class names (not built with
// string interpolation) so the CSS build's content scanner can find them.
// chipText pairs with the bold chipBg (a solid, saturated fill); softText
// pairs with softBg (a pale tint) since a bold chip's text color isn't
// always readable on its own pale background (white-on-violet-100, say).
export const MEAL_TYPES = [
  { id: 'breakfast', label: 'בוקר', icon: '🌅', chipBg: 'bg-yellow-300', chipText: 'text-ink', softBg: 'bg-yellow-100', softText: 'text-ink' },
  { id: 'lunch', label: 'צהריים', icon: '☀️', chipBg: 'bg-lime-300', chipText: 'text-ink', softBg: 'bg-lime-100', softText: 'text-ink' },
  { id: 'dinner', label: 'ערב', icon: '🌙', chipBg: 'bg-violet-500', chipText: 'text-white', softBg: 'bg-violet-100', softText: 'text-violet-800' },
];

export const MEAL_TYPE_BY_ID = Object.fromEntries(MEAL_TYPES.map((m) => [m.id, m]));

export function pickDefaultMealType() {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  return 'dinner';
}

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
  'בזיליקום': 'produce', "פטרוזיליה שורש": 'produce', 'תירס': 'produce', 'גינגר': 'produce',
  'תירס מתוק': 'produce', 'חסה': 'produce', 'אפונה': 'produce', 'בננה': 'produce',
  'תותים': 'produce', 'תרד': 'produce', 'אבוקדו': 'produce', 'ענבים': 'produce',
  'תפוז': 'produce', 'תפוח': 'produce', 'נענע': 'produce', 'סלק': 'produce',
  'פטריות': 'produce', 'חציל': 'produce', 'חצילים': 'produce',

  'בשר טחון': 'meat', 'חזה עוף': 'meat', 'שוקי עוף': 'meat', 'עוף שלם': 'meat',
  'חלקי עוף': 'meat', 'כרעיים עוף': 'meat', 'בשר בקר': 'meat', 'כתף בקר': 'meat',
  'פרגיות': 'meat', 'נקניק הודו': 'meat',

  'פילה סלמון': 'fish', 'דג': 'fish', 'טונה': 'fish', 'פילה דג לבן': 'fish',

  'ביצים': 'dairy', 'ביצה': 'dairy', 'שמנת מתוקה': 'dairy', 'חמאה': 'dairy',
  'פרמזן': 'dairy', 'גבינה צהובה': 'dairy', 'גבינה בולגרית': 'dairy', 'מוצרלה': 'dairy',
  'חלב': 'dairy', 'יוגורט': 'dairy', 'לבנה': 'dairy', 'שמנת חמוצה': 'dairy',

  'פסטה': 'dry', 'אורז': 'dry', 'קמח': 'dry', 'עדשים': 'dry', 'גרגירי חומוס': 'dry',
  'חומוס יבש': 'dry', 'חומוס מבושל': 'dry', 'טחינה גולמית': 'dry', 'פירורי לחם': 'dry',
  'שמרים יבשים': 'dry', 'אבקת אפייה': 'dry', 'סוכר': 'dry', 'קוסקוס': 'dry',
  'בורגול': 'dry', 'גרנולה': 'dry', 'שיבולת שועל': 'dry', 'דפי לזניה': 'dry',

  'רסק עגבניות': 'canned', 'עגבניות מרוסקות': 'canned', 'זיתי קלמטה': 'canned',
  'רוטב סויה': 'canned', 'דבש': 'canned', 'מיונז': 'canned', 'חלב קוקוס': 'canned',
  'שעועית אדומה': 'canned', 'עמבה': 'canned', 'ציר עוף': 'canned', 'ציר ירקות': 'canned',
  'ציר בקר': 'canned',

  'מלח': 'spices', 'פלפל שחור': 'spices', 'אורגנו': 'spices', 'כמון': 'spices',
  'פפריקה': 'spices', 'כוסברה טחונה': 'spices', 'אגוז מוסקט': 'spices', 'שומשום': 'spices',
  'רוזמרין': 'spices', 'כורכום': 'spices', 'קינמון': 'spices', 'אבקת קארי': 'spices',
  'פפריקה חריפה': 'spices',

  'לחם טוסט': 'bakery', 'לחם': 'bakery', 'פיתות': 'bakery', 'בצק עלים': 'bakery',
  'טורטיות': 'bakery', 'לחמניות': 'bakery',

  'שמן זית': 'oils', 'שמן': 'oils', 'שמן שומשום': 'oils', 'שמן לטיגון': 'oils',
};

// Basic staples nearly every kitchen already has, used only by the "what can
// I make from my pantry?" suggestion matcher: a recipe isn't marked "missing
// something" just because the user never bothered to log that they own
// salt. Deliberately excludes less-universal/"special" spices and oils
// (curry powder, hot paprika, tahini, ground coriander, nutmeg, rosemary,
// sesame oil...) - those still have to actually be in the pantry to count.
// The real shopping list is unaffected - it still lists these if truly
// missing, since forgetting salt on a shopping trip is a real problem.
export const ASSUMED_STAPLES = new Set([
  'מלח', 'פלפל שחור', 'אורגנו', 'כמון', 'פפריקה', 'כורכום', 'קינמון',
  'סוכר', 'אבקת אפייה', 'שמן', 'שמן זית', 'שמן לטיגון',
]);

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

// 26 built-in recipes, ingredient quantities scaled for 4 servings.
export const RECIPES = [
  {
    id: 'omelette', nameHe: 'חביתת ירקות', nameEn: 'Vegetable Omelette', servings: 4, mealTypes: ['breakfast'],
    ingredients: [
      ing('ביצים', 8, 'יחידה'), ing('עגבניות', 1, 'יחידה'), ing('בצל ירוק', 2, 'יחידה'),
      ing('גבינה צהובה', 100, 'גרם'), ing('מלח', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
      ing('שמן זית', 1, 'כף'),
    ],
  },
  {
    id: 'pancakes', nameHe: 'פנקייקים מתוקים', nameEn: 'Sweet Pancakes', servings: 4, mealTypes: ['breakfast'],
    ingredients: [
      ing('קמח', 1.5, 'כוס'), ing('ביצים', 2, 'יחידה'), ing('חלב', 1, 'כוס'),
      ing('סוכר', 2, 'כף'), ing('אבקת אפייה', 1, 'כפית'), ing('חמאה', 2, 'כף'),
      ing('דבש', 2, 'כף'),
    ],
  },
  {
    id: 'yogurt-granola', nameHe: 'יוגורט עם גרנולה ופירות', nameEn: 'Yogurt with Granola & Fruit', servings: 4, mealTypes: ['breakfast'],
    ingredients: [
      ing('יוגורט', 4, 'יחידה'), ing('גרנולה', 1, 'כוס'), ing('דבש', 2, 'כף'),
      ing('בננה', 2, 'יחידה'), ing('תותים', 1, 'כוס'),
    ],
  },
  {
    id: 'green-smoothie', nameHe: 'שייק פירות ירוק', nameEn: 'Green Fruit Smoothie', servings: 4, mealTypes: ['breakfast'],
    ingredients: [
      ing('בננה', 2, 'יחידה'), ing('תרד', 2, 'כוס'), ing('חלב', 2, 'כוס'),
      ing('דבש', 1, 'כף'),
    ],
  },
  {
    id: 'cheese-sandwich', nameHe: 'כריך גבינה וירקות', nameEn: 'Cheese & Veggie Sandwich', servings: 4, mealTypes: ['breakfast', 'lunch'],
    ingredients: [
      ing('לחם', 8, 'פרוסה'), ing('גבינה צהובה', 8, 'פרוסה'), ing('עגבניות', 2, 'יחידה'),
      ing('מלפפון', 2, 'יחידה'), ing('חמאה', 2, 'כף'),
    ],
  },
  {
    id: 'egg-salad', nameHe: 'סלט ביצים', nameEn: 'Egg Salad', servings: 4, mealTypes: ['breakfast', 'lunch'],
    ingredients: [
      ing('ביצים', 8, 'יחידה'), ing('מיונז', 4, 'כף'), ing('בצל ירוק', 2, 'יחידה'),
      ing('מלח', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'), ing('לחם', 8, 'פרוסה'),
    ],
  },
  {
    id: 'avocado-toast', nameHe: 'טוסט אבוקדו', nameEn: 'Avocado Toast', servings: 4, mealTypes: ['breakfast'],
    ingredients: [
      ing('לחם', 4, 'פרוסה'), ing('אבוקדו', 2, 'יחידה'), ing('לימון', 1, 'יחידה'),
      ing('מלח', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'), ing('שמן זית', 1, 'כף'),
    ],
  },
  {
    id: 'oatmeal', nameHe: 'דייסת שיבולת שועל', nameEn: 'Oatmeal', servings: 4, mealTypes: ['breakfast'],
    ingredients: [
      ing('שיבולת שועל', 2, 'כוס'), ing('חלב', 2, 'כוס'), ing('דבש', 2, 'כף'),
      ing('בננה', 1, 'יחידה'), ing('קינמון', 1, 'כפית'),
    ],
  },
  {
    id: 'cheese-burekas', nameHe: 'בורקס גבינה', nameEn: 'Cheese Burekas', servings: 4, mealTypes: ['breakfast'],
    ingredients: [
      ing('בצק עלים', 1, 'חבילה'), ing('גבינה בולגרית', 300, 'גרם'), ing('ביצים', 2, 'יחידה'),
      ing('שומשום', 2, 'כף'),
    ],
  },
  {
    id: 'sweet-crepes', nameHe: 'קרפים מתוקים', nameEn: 'Sweet Crepes', servings: 4, mealTypes: ['breakfast'],
    ingredients: [
      ing('קמח', 1, 'כוס'), ing('חלב', 1.5, 'כוס'), ing('ביצים', 2, 'יחידה'),
      ing('סוכר', 2, 'כף'), ing('חמאה', 2, 'כף'),
    ],
  },
  {
    id: 'potato-latkes', nameHe: 'לביבות תפוחי אדמה', nameEn: 'Potato Latkes', servings: 4, mealTypes: ['breakfast'],
    ingredients: [
      ing('תפוחי אדמה', 4, 'יחידה'), ing('בצל', 1, 'יחידה'), ing('ביצים', 2, 'יחידה'),
      ing('קמח', 0.5, 'כוס'), ing('מלח', 1, 'כפית'), ing('שמן לטיגון', 200, 'מל'),
    ],
  },
  {
    id: 'fruit-salad', nameHe: 'סלט פירות', nameEn: 'Fruit Salad', servings: 4, mealTypes: ['breakfast'],
    ingredients: [
      ing('תפוח', 2, 'יחידה'), ing('בננה', 2, 'יחידה'), ing('ענבים', 1, 'כוס'),
      ing('תפוז', 2, 'יחידה'), ing('דבש', 1, 'כף'), ing('נענע', 1, 'יחידה'),
    ],
  },
  {
    id: 'eggplant-shakshuka', nameHe: 'שקשוקת חצילים', nameEn: 'Eggplant Shakshuka', servings: 4, mealTypes: ['breakfast', 'lunch'],
    ingredients: [
      ing('חצילים', 2, 'יחידה'), ing('עגבניות מרוסקות', 400, 'גרם'), ing('ביצים', 6, 'יחידה'),
      ing('שום', 2, 'שן'), ing('פפריקה', 1, 'כפית'), ing('כמון', 1, 'כפית'), ing('מלח', 1, 'כפית'),
    ],
  },
  {
    id: 'bolognese', nameHe: 'פסטה בולונז', nameEn: 'Pasta Bolognese', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('פסטה', 400, 'גרם'), ing('בשר טחון', 500, 'גרם'), ing('בצל', 2, 'יחידה'),
      ing('שום', 3, 'שן'), ing('רסק עגבניות', 1, 'קופסה'), ing('עגבניות מרוסקות', 400, 'גרם'),
      ing('גזר', 1, 'יחידה'), ing('שמן זית', 2, 'כף'), ing('מלח', 1, 'כפית'),
      ing('פלפל שחור', 1, 'כפית'), ing('אורגנו', 1, 'כפית'),
    ],
  },
  {
    id: 'schnitzel', nameHe: 'שניצל', nameEn: 'Schnitzel', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('חזה עוף', 8, 'יחידה'), ing('ביצים', 3, 'יחידה'), ing('פירורי לחם', 2, 'כוס'),
      ing('קמח', 1, 'כוס'), ing('מלח', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
      ing('שמן לטיגון', 300, 'מל'),
    ],
  },
  {
    id: 'hummus', nameHe: 'חומוס', nameEn: 'Hummus', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('גרגירי חומוס', 500, 'גרם'), ing('טחינה גולמית', 1, 'כוס'), ing('לימון', 2, 'יחידה'),
      ing('שום', 3, 'שן'), ing('שמן זית', 3, 'כף'), ing('כמון', 1, 'כפית'), ing('מלח', 1, 'כפית'),
      ing('פטרוזיליה', 1, 'יחידה'),
    ],
  },
  {
    id: 'chopped-salad', nameHe: 'סלט קצוץ ישראלי', nameEn: 'Israeli Chopped Salad', servings: 4, mealTypes: ['breakfast', 'lunch', 'dinner'],
    ingredients: [
      ing('עגבניות', 4, 'יחידה'), ing('מלפפונים', 4, 'יחידה'), ing('בצל סגול', 1, 'יחידה'),
      ing('פלפל צבעוני', 1, 'יחידה'), ing('לימון', 1, 'יחידה'), ing('שמן זית', 2, 'כף'),
      ing('מלח', 1, 'כפית'), ing('פטרוזיליה', 1, 'יחידה'),
    ],
  },
  {
    id: 'chicken-soup', nameHe: 'מרק עוף', nameEn: 'Chicken Soup', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('חלקי עוף', 1, 'קג'), ing('גזר', 3, 'יחידה'), ing('סלרי', 3, 'גבעול'),
      ing('בצל', 2, 'יחידה'), ing('תפוחי אדמה', 3, 'יחידה'), ing('פטרוזיליה שורש', 1, 'יחידה'),
      ing('מלח', 2, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
    ],
  },
  {
    id: 'alfredo', nameHe: 'פסטה אלפרדו', nameEn: 'Pasta Alfredo', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('פסטה', 400, 'גרם'), ing('שמנת מתוקה', 500, 'מל'), ing('חמאה', 100, 'גרם'),
      ing('פרמזן', 100, 'גרם'), ing('שום', 2, 'שן'), ing('מלח', 1, 'כפית'),
      ing('אגוז מוסקט', 1, 'כפית'),
    ],
  },
  {
    id: 'rice-vegetables', nameHe: 'אורז עם ירקות', nameEn: 'Rice with Vegetables', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('אורז', 2, 'כוס'), ing('גזר', 2, 'יחידה'), ing('אפונה', 1, 'כוס'),
      ing('תירס', 1, 'כוס'), ing('בצל', 1, 'יחידה'), ing('שמן', 2, 'כף'),
      ing('כורכום', 1, 'כפית'), ing('מלח', 1, 'כפית'),
    ],
  },
  {
    id: 'shakshuka', nameHe: 'שקשוקה', nameEn: 'Shakshuka', servings: 4, mealTypes: ['breakfast', 'lunch'],
    ingredients: [
      ing('ביצים', 8, 'יחידה'), ing('עגבניות מרוסקות', 800, 'גרם'), ing('בצל', 1, 'יחידה'),
      ing('פלפל אדום', 1, 'יחידה'), ing('שום', 3, 'שן'), ing('פפריקה', 1, 'כפית'),
      ing('כמון', 1, 'כפית'), ing('מלח', 1, 'כפית'), ing('לחם', 1, 'יחידה'),
    ],
  },
  {
    id: 'roast-chicken', nameHe: 'עוף בתנור עם תפוחי אדמה', nameEn: 'Roast Chicken with Potatoes', servings: 4, mealTypes: ['dinner'],
    ingredients: [
      ing('שוקי עוף', 8, 'יחידה'), ing('תפוחי אדמה', 6, 'יחידה'), ing('שום', 1, 'ראש'),
      ing('שמן זית', 3, 'כף'), ing('פפריקה', 1, 'כף'), ing('מלח', 1, 'כף'),
      ing('רוזמרין', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
    ],
  },
  {
    id: 'meatballs', nameHe: 'קציצות בקר', nameEn: 'Beef Meatballs', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('בשר טחון', 600, 'גרם'), ing('בצל', 1, 'יחידה'), ing('ביצים', 1, 'יחידה'),
      ing('פירורי לחם', 0.5, 'כוס'), ing('פטרוזיליה', 1, 'יחידה'), ing('מלח', 1, 'כפית'),
      ing('פלפל שחור', 1, 'כפית'), ing('רסק עגבניות', 2, 'כף'),
    ],
  },
  {
    id: 'pomodoro', nameHe: 'פסטה ברוטב עגבניות', nameEn: 'Pasta Pomodoro', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('פסטה', 400, 'גרם'), ing('עגבניות מרוסקות', 800, 'גרם'), ing('שום', 3, 'שן'),
      ing('בזיליקום', 1, 'יחידה'), ing('שמן זית', 3, 'כף'), ing('מלח', 1, 'כפית'),
      ing('פרמזן', 50, 'גרם'),
    ],
  },
  {
    id: 'vegetable-soup', nameHe: 'מרק ירקות', nameEn: 'Vegetable Soup', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('תפוחי אדמה', 2, 'יחידה'), ing('גזר', 3, 'יחידה'), ing('קישואים', 2, 'יחידה'),
      ing('בצל', 1, 'יחידה'), ing('סלרי', 2, 'גבעול'), ing('דלעת', 300, 'גרם'),
      ing('מלח', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
    ],
  },
  {
    id: 'soy-chicken', nameHe: 'עוף ברוטב סויה', nameEn: 'Soy Sauce Chicken', servings: 4, mealTypes: ['dinner'],
    ingredients: [
      ing('חזה עוף', 600, 'גרם'), ing('רוטב סויה', 0.5, 'כוס'), ing('דבש', 2, 'כף'),
      ing('שום', 3, 'שן'), ing("ג'ינג'ר", 1, 'יחידה'), ing('שמן שומשום', 1, 'כף'),
      ing('בצל ירוק', 2, 'יחידה'), ing('שומשום', 1, 'כף'),
    ],
  },
  {
    id: 'greek-salad', nameHe: 'סלט יווני', nameEn: 'Greek Salad', servings: 4, mealTypes: ['breakfast', 'lunch', 'dinner'],
    ingredients: [
      ing('עגבניות', 4, 'יחידה'), ing('מלפפון', 2, 'יחידה'), ing('פלפל ירוק', 1, 'יחידה'),
      ing('בצל סגול', 1, 'יחידה'), ing('זיתי קלמטה', 1, 'כוס'), ing('גבינה בולגרית', 200, 'גרם'),
      ing('שמן זית', 2, 'כף'), ing('אורגנו', 1, 'כפית'),
    ],
  },
  {
    id: 'baked-salmon', nameHe: 'פילה סלמון בתנור', nameEn: 'Baked Salmon', servings: 4, mealTypes: ['dinner'],
    ingredients: [
      ing('פילה סלמון', 4, 'יחידה'), ing('לימון', 1, 'יחידה'), ing('שום', 2, 'שן'),
      ing('שמן זית', 2, 'כף'), ing('מלח', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
      ing('שמיר', 1, 'יחידה'),
    ],
  },
  {
    id: 'vegetable-pashtida', nameHe: 'פשטידת ירקות', nameEn: 'Vegetable Pashtida (Quiche)', servings: 4, mealTypes: ['breakfast', 'lunch'],
    ingredients: [
      ing('קמח', 1.5, 'כוס'), ing('ביצים', 4, 'יחידה'), ing('שמן', 80, 'מל'),
      ing('אבקת אפייה', 1, 'כפית'), ing('קישואים', 2, 'יחידה'), ing('גזר', 1, 'יחידה'),
      ing('גבינה צהובה', 1, 'כוס'), ing('מלח', 1, 'כפית'), ing('פלפל שחור', 1, 'כפית'),
    ],
  },
  {
    id: 'lentil-stew', nameHe: 'עדשים עם אורז (מג׳דרה)', nameEn: 'Lentils with Rice (Mujadara)', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('עדשים', 2, 'כוס'), ing('אורז', 1, 'כוס'), ing('בצל', 3, 'יחידה'),
      ing('שמן', 4, 'כף'), ing('כמון', 1, 'כפית'), ing('מלח', 1, 'כפית'),
    ],
  },
  {
    id: 'falafel', nameHe: 'פלאפל', nameEn: 'Falafel', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('חומוס יבש', 500, 'גרם'), ing('בצל', 1, 'יחידה'), ing('שום', 4, 'שן'),
      ing('פטרוזיליה', 1, 'יחידה'), ing('כוסברה', 1, 'יחידה'), ing('כמון', 1, 'כף'),
      ing('כוסברה טחונה', 1, 'כף'), ing('אבקת אפייה', 1, 'כפית'), ing('שמן לטיגון', 500, 'מל'),
    ],
  },
  {
    id: 'grilled-cheese', nameHe: 'טוסט גבינה', nameEn: 'Grilled Cheese Toast', servings: 4, mealTypes: ['breakfast', 'lunch'],
    ingredients: [
      ing('לחם טוסט', 8, 'פרוסה'), ing('גבינה צהובה', 8, 'פרוסה'), ing('חמאה', 2, 'כף'),
    ],
  },
  {
    id: 'pizza', nameHe: 'פיצה ביתית', nameEn: 'Homemade Pizza', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('קמח', 500, 'גרם'), ing('שמרים יבשים', 1, 'שקית'), ing('שמן זית', 2, 'כף'),
      ing('רסק עגבניות', 1, 'קופסה'), ing('מוצרלה', 400, 'גרם'), ing('אורגנו', 1, 'כפית'),
      ing('מלח', 1, 'כפית'), ing('סוכר', 1, 'כפית'),
    ],
  },
  {
    id: 'kubbeh-soup', nameHe: 'מרק קובה', nameEn: 'Kubbeh Soup', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('בשר טחון', 300, 'גרם'), ing('בורגול', 1, 'כוס'), ing('בצל', 2, 'יחידה'),
      ing('סלק', 2, 'יחידה'), ing('מלח', 1, 'כפית'), ing('כמון', 1, 'כפית'), ing('נענע', 1, 'יחידה'),
    ],
  },
  {
    id: 'chraime', nameHe: 'דג חריימה', nameEn: 'Moroccan Spicy Fish (Chraime)', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('פילה דג לבן', 800, 'גרם'), ing('עגבניות', 4, 'יחידה'), ing('שום', 5, 'שן'),
      ing('פפריקה חריפה', 1, 'כף'), ing('כמון', 1, 'כפית'), ing('כוסברה', 1, 'יחידה'),
      ing('שמן זית', 3, 'כף'),
    ],
  },
  {
    id: 'moroccan-couscous', nameHe: 'קוסקוס מרוקאי', nameEn: 'Moroccan Couscous', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('קוסקוס', 2, 'כוס'), ing('גזר', 3, 'יחידה'), ing('קישואים', 2, 'יחידה'),
      ing('חומוס מבושל', 1, 'כוס'), ing('בצל', 1, 'יחידה'), ing('כמון', 1, 'כפית'),
      ing('קינמון', 1, 'כפית'),
    ],
  },
  {
    id: 'moussaka', nameHe: 'מוסקה', nameEn: 'Moussaka', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('חצילים', 3, 'יחידה'), ing('תפוחי אדמה', 3, 'יחידה'), ing('בשר טחון', 500, 'גרם'),
      ing('בצל', 1, 'יחידה'), ing('רסק עגבניות', 2, 'כף'), ing('פירורי לחם', 0.5, 'כוס'),
    ],
  },
  {
    id: 'carbonara', nameHe: 'פסטה קרבונרה', nameEn: 'Pasta Carbonara', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('פסטה', 400, 'גרם'), ing('ביצים', 4, 'יחידה'), ing('פרמזן', 100, 'גרם'),
      ing('שמנת מתוקה', 100, 'מל'), ing('פלפל שחור', 1, 'כפית'),
    ],
  },
  {
    id: 'lasagna', nameHe: 'לזניית ירקות', nameEn: 'Vegetable Lasagna', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('דפי לזניה', 1, 'חבילה'), ing('תרד', 3, 'כוס'), ing('פטריות', 300, 'גרם'),
      ing('רסק עגבניות', 1, 'קופסה'), ing('גבינה צהובה', 300, 'גרם'), ing('שמנת מתוקה', 200, 'מל'),
    ],
  },
  {
    id: 'burger', nameHe: 'בורגר ביתי', nameEn: 'Homemade Burger', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('בשר טחון', 600, 'גרם'), ing('לחמניות', 4, 'יחידה'), ing('בצל', 1, 'יחידה'),
      ing('חסה', 1, 'יחידה'), ing('עגבניות', 2, 'יחידה'),
    ],
  },
  {
    id: 'chicken-tacos', nameHe: 'טאקויות עוף', nameEn: 'Chicken Tacos', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('חזה עוף', 500, 'גרם'), ing('טורטיות', 8, 'יחידה'), ing('בצל', 1, 'יחידה'),
      ing('פלפל צבעוני', 1, 'יחידה'), ing('כוסברה', 1, 'יחידה'), ing('לימון', 1, 'יחידה'),
    ],
  },
  {
    id: 'chicken-curry', nameHe: 'קארי עוף', nameEn: 'Chicken Curry', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('חזה עוף', 500, 'גרם'), ing('חלב קוקוס', 400, 'מל'), ing('בצל', 1, 'יחידה'),
      ing('פלפל אדום', 1, 'יחידה'), ing('אבקת קארי', 2, 'כף'), ing('אורז', 2, 'כוס'),
    ],
  },
  {
    id: 'chili-con-carne', nameHe: "צ'ילי קון קרנה", nameEn: 'Chili con Carne', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('בשר טחון', 500, 'גרם'), ing('שעועית אדומה', 400, 'גרם'), ing('עגבניות מרוסקות', 400, 'גרם'),
      ing('בצל', 1, 'יחידה'), ing('פפריקה חריפה', 1, 'כפית'), ing('כמון', 1, 'כפית'),
    ],
  },
  {
    id: 'french-onion-soup', nameHe: 'מרק בצל צרפתי', nameEn: 'French Onion Soup', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('בצל', 5, 'יחידה'), ing('חמאה', 2, 'כף'), ing('ציר ירקות', 1, 'ליטר'),
      ing('לחם', 4, 'פרוסה'), ing('גבינה צהובה', 100, 'גרם'),
    ],
  },
  {
    id: 'sabich', nameHe: 'סביח', nameEn: 'Sabich', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('פיתות', 4, 'יחידה'), ing('חצילים', 2, 'יחידה'), ing('ביצים', 4, 'יחידה'),
      ing('חומוס מבושל', 1, 'כוס'), ing('טחינה גולמית', 0.5, 'כוס'), ing('עגבניות', 2, 'יחידה'),
    ],
  },
  {
    id: 'baked-thighs', nameHe: 'פרגיות בתנור', nameEn: 'Baked Chicken Thighs', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('פרגיות', 800, 'גרם'), ing('שום', 4, 'שן'), ing('שמן זית', 2, 'כף'),
      ing('פפריקה', 1, 'כף'), ing('לימון', 1, 'יחידה'),
    ],
  },
  {
    id: 'lentil-patties', nameHe: 'קציצות עדשים', nameEn: 'Lentil Patties', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('עדשים', 2, 'כוס'), ing('בצל', 1, 'יחידה'), ing('ביצים', 2, 'יחידה'),
      ing('פירורי לחם', 0.5, 'כוס'), ing('כמון', 1, 'כפית'),
    ],
  },
  {
    id: 'chicken-skewers', nameHe: 'שיפודי עוף', nameEn: 'Chicken Skewers', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('חזה עוף', 600, 'גרם'), ing('פלפל צבעוני', 2, 'יחידה'), ing('בצל', 1, 'יחידה'),
      ing('שמן זית', 2, 'כף'), ing('פפריקה', 1, 'כפית'),
    ],
  },
  {
    id: 'teriyaki-salmon', nameHe: 'סלמון טריאקי', nameEn: 'Teriyaki Salmon', servings: 4, mealTypes: ['dinner'],
    ingredients: [
      ing('פילה סלמון', 4, 'יחידה'), ing('רוטב סויה', 0.5, 'כוס'), ing('דבש', 2, 'כף'),
      ing('שום', 2, 'שן'), ing('שומשום', 1, 'כף'),
    ],
  },
  {
    id: 'mushroom-pasta', nameHe: 'פסטה שמנת ופטריות', nameEn: 'Creamy Mushroom Pasta', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('פסטה', 400, 'גרם'), ing('פטריות', 400, 'גרם'), ing('שמנת מתוקה', 300, 'מל'),
      ing('שום', 2, 'שן'), ing('פרמזן', 50, 'גרם'),
    ],
  },
  {
    id: 'mexican-rice', nameHe: 'אורז מקסיקני', nameEn: 'Mexican Rice', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('אורז', 2, 'כוס'), ing('עגבניות מרוסקות', 200, 'גרם'), ing('בצל', 1, 'יחידה'),
      ing('תירס', 1, 'כוס'), ing('שעועית אדומה', 1, 'כוס'),
    ],
  },
  {
    id: 'tabbouleh', nameHe: 'טבולה', nameEn: 'Tabbouleh', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('בורגול', 1, 'כוס'), ing('פטרוזיליה', 2, 'יחידה'), ing('עגבניות', 3, 'יחידה'),
      ing('בצל ירוק', 3, 'יחידה'), ing('לימון', 2, 'יחידה'), ing('שמן זית', 3, 'כף'),
    ],
  },
  {
    id: 'eggplant-tahini', nameHe: 'חציל בטחינה', nameEn: 'Eggplant with Tahini', servings: 4, mealTypes: ['lunch', 'dinner'],
    ingredients: [
      ing('חצילים', 3, 'יחידה'), ing('טחינה גולמית', 0.5, 'כוס'), ing('לימון', 1, 'יחידה'),
      ing('שום', 1, 'שן'), ing('פטרוזיליה', 1, 'יחידה'),
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
