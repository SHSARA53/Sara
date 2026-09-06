// Thin persistence layer over localStorage. Kept in one place so the rest
// of the app never touches `localStorage` directly and a corrupted/missing
// value never crashes the UI.

const KEYS = {
  pantry: 'mealPlanner.pantry.v1',
  meals: 'mealPlanner.meals.v1',
  customRecipes: 'mealPlanner.customRecipes.v1',
  bought: 'mealPlanner.bought.v1',
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Storage full or unavailable (e.g. private browsing) - fail silently,
    // the in-memory state still works for the current session.
    return false;
  }
}

export const store = {
  getPantry: () => load(KEYS.pantry, []),
  setPantry: (items) => save(KEYS.pantry, items),

  getMeals: () => load(KEYS.meals, []),
  setMeals: (meals) => save(KEYS.meals, meals),

  getCustomRecipes: () => load(KEYS.customRecipes, []),
  setCustomRecipes: (recipes) => save(KEYS.customRecipes, recipes),

  getBought: () => load(KEYS.bought, {}),
  setBought: (bought) => save(KEYS.bought, bought),
};

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
