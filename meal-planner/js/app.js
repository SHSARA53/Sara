import {
  CATEGORIES, CATEGORY_BY_ID, UNITS, UNIT_BY_ID, RECIPES,
  normalize, guessCategory, findRecipe, convert,
} from './recipes.js';
import { store, uid } from './storage.js';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
const state = {
  pantry: store.getPantry(),
  meals: store.getMeals(),
  customRecipes: store.getCustomRecipes(),
  bought: store.getBought(),
  activeTab: 'pantry',
};

function allRecipes() {
  return [...RECIPES, ...state.customRecipes];
}

function findAnyRecipe(name) {
  const key = normalize(name);
  return allRecipes().find((r) => normalize(r.nameHe) === key || normalize(r.nameEn) === key) || findRecipe(name);
}

function persistPantry() { store.setPantry(state.pantry); }
function persistMeals() { store.setMeals(state.meals); }
function persistBought() { store.setBought(state.bought); }

// ---------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child) node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function fmtQty(q) {
  const rounded = Math.round(q * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function unitOptions(selected) {
  return UNITS.map((u) => el('option', { value: u.id, ...(u.id === selected ? { selected: 'selected' } : {}) }, u.label));
}

function categoryOptions(selected) {
  return CATEGORIES.map((c) => el('option', { value: c.id, ...(c.id === selected ? { selected: 'selected' } : {}) }, `${c.icon} ${c.label}`));
}

// ---------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------
function showTab(tab) {
  state.activeTab = tab;
  $$('.tab-panel').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== tab));
  $$('.tab-btn').forEach((b) => {
    const active = b.dataset.tab === tab;
    b.classList.toggle('text-orange-600', active);
    b.classList.toggle('text-gray-400', !active);
    b.setAttribute('aria-current', active ? 'page' : 'false');
  });
  if (tab === 'shopping') renderShopping();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

// ---------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------
const modalOverlay = $('#modal-overlay');
const modalBody = $('#modal-body');

function openModal(contentNode) {
  modalBody.innerHTML = '';
  modalBody.appendChild(contentNode);
  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modalOverlay.classList.add('hidden');
  modalBody.innerHTML = '';
  document.body.style.overflow = '';
}
$('#modal-close').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

// ---------------------------------------------------------------------
// Pantry tab
// ---------------------------------------------------------------------
const pantryForm = $('#pantry-form');
const pantryList = $('#pantry-list');
const pantryEmpty = $('#pantry-empty');
const pantryDatalist = $('#pantry-suggestions');

function populatePantrySuggestions() {
  const names = new Set();
  allRecipes().forEach((r) => r.ingredients.forEach((i) => names.add(i.name)));
  pantryDatalist.innerHTML = '';
  Array.from(names).sort().forEach((n) => pantryDatalist.appendChild(el('option', { value: n })));
}

function renderPantry() {
  pantryList.innerHTML = '';
  const sorted = [...state.pantry].sort((a, b) => a.name.localeCompare(b.name, 'he'));
  pantryEmpty.classList.toggle('hidden', sorted.length > 0);

  const grouped = {};
  sorted.forEach((item) => {
    (grouped[item.category] ||= []).push(item);
  });

  CATEGORIES.forEach((cat) => {
    const items = grouped[cat.id];
    if (!items || items.length === 0) return;
    pantryList.appendChild(el('h3', { class: 'px-1 pt-3 pb-1 text-sm font-semibold text-gray-500 first:pt-0' }, `${cat.icon} ${cat.label}`));
    items.forEach((item) => {
      const row = el('div', { class: 'flex items-center gap-2 bg-white rounded-xl px-3 py-2 mb-2 shadow-sm border border-gray-100' }, [
        el('div', { class: 'flex-1 min-w-0' }, [
          el('div', { class: 'font-medium text-gray-800 truncate', text: item.name }),
          el('div', { class: 'text-xs text-gray-500', text: `${fmtQty(item.quantity)} ${UNIT_BY_ID[item.unit]?.label ?? item.unit}` }),
        ]),
        el('button', {
          class: 'p-2 text-gray-400 hover:text-orange-600 rounded-lg', 'aria-label': 'ערוך',
          onclick: () => editPantryItem(item.id),
        }, '✏️'),
        el('button', {
          class: 'p-2 text-gray-400 hover:text-red-600 rounded-lg', 'aria-label': 'מחק',
          onclick: () => deletePantryItem(item.id),
        }, '🗑️'),
      ]);
      pantryList.appendChild(row);
    });
  });
}

function deletePantryItem(id) {
  state.pantry = state.pantry.filter((p) => p.id !== id);
  persistPantry();
  renderPantry();
}

function editPantryItem(id) {
  const item = state.pantry.find((p) => p.id === id);
  if (!item) return;
  const nameInput = el('input', { type: 'text', value: item.name, class: 'w-full border rounded-lg px-3 py-2 mb-3' });
  const qtyInput = el('input', { type: 'number', step: '0.01', min: '0', value: item.quantity, class: 'w-full border rounded-lg px-3 py-2 mb-3' });
  const unitSelect = el('select', { class: 'w-full border rounded-lg px-3 py-2 mb-3' }, unitOptions(item.unit));
  const catSelect = el('select', { class: 'w-full border rounded-lg px-3 py-2 mb-4' }, categoryOptions(item.category));

  const form = el('form', {}, [
    el('h2', { class: 'text-lg font-bold mb-4' }, 'עריכת פריט מזווה'),
    el('label', { class: 'text-sm text-gray-600' }, 'שם'), nameInput,
    el('label', { class: 'text-sm text-gray-600' }, 'כמות'), qtyInput,
    el('label', { class: 'text-sm text-gray-600' }, 'יחידה'), unitSelect,
    el('label', { class: 'text-sm text-gray-600' }, 'קטגוריה'), catSelect,
    el('button', { type: 'submit', class: 'w-full bg-orange-500 text-white rounded-lg py-2.5 font-semibold' }, 'שמור'),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    item.name = nameInput.value.trim() || item.name;
    item.quantity = parseFloat(qtyInput.value) || 0;
    item.unit = unitSelect.value;
    item.category = catSelect.value;
    persistPantry();
    renderPantry();
    closeModal();
  });
  openModal(form);
}

pantryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#pantry-name').value.trim();
  const quantity = parseFloat($('#pantry-qty').value);
  const unit = $('#pantry-unit').value;
  if (!name || !Number.isFinite(quantity) || quantity < 0) return;

  const existing = state.pantry.find((p) => normalize(p.name) === normalize(name) && p.unit === unit);
  if (existing) {
    existing.quantity += quantity;
  } else {
    state.pantry.push({ id: uid(), name, quantity, unit, category: guessCategory(name) });
  }
  persistPantry();
  renderPantry();
  pantryForm.reset();
  $('#pantry-qty').value = '1';
  $('#pantry-name').focus();
});

// ---------------------------------------------------------------------
// Meal planning tab
// ---------------------------------------------------------------------
const mealForm = $('#meal-form');
const mealList = $('#meal-list');
const mealEmpty = $('#meal-empty');
const recipeDatalist = $('#recipe-suggestions');

function populateRecipeSuggestions() {
  recipeDatalist.innerHTML = '';
  allRecipes().forEach((r) => {
    recipeDatalist.appendChild(el('option', { value: r.nameHe }));
    if (r.nameEn) recipeDatalist.appendChild(el('option', { value: r.nameEn }));
  });
}

function dayLabel(day) {
  return day === null || day === undefined ? 'ללא יום קבוע' : DAY_NAMES[day];
}

function renderMealPlanning() {
  mealList.innerHTML = '';
  mealEmpty.classList.toggle('hidden', state.meals.length > 0);

  const order = [null, 0, 1, 2, 3, 4, 5, 6];
  order.forEach((day) => {
    const meals = state.meals.filter((m) => m.day === day);
    if (meals.length === 0) return;
    mealList.appendChild(el('h3', { class: 'px-1 pt-3 pb-1 text-sm font-semibold text-gray-500 first:pt-0' }, `📅 ${dayLabel(day)}`));
    meals.forEach((meal) => {
      const recipe = meal.recipeId ? findAnyRecipe(meal.recipeId) : null;
      const isCustomUnmatched = !meal.recipeId && meal.ingredients.length === 0;
      const card = el('div', { class: 'bg-white rounded-xl px-3 py-3 mb-2 shadow-sm border border-gray-100' }, [
        el('div', { class: 'flex items-start justify-between gap-2' }, [
          el('div', { class: 'min-w-0' }, [
            el('div', { class: 'font-semibold text-gray-800 truncate', text: meal.name }),
            recipe?.nameEn ? el('div', { class: 'text-xs text-gray-400', text: recipe.nameEn }) : null,
            el('div', { class: 'text-xs text-gray-500 mt-1', text: `${meal.ingredients.length} רכיבים` }),
            isCustomUnmatched ? el('div', { class: 'text-xs text-amber-600 mt-1', text: '⚠️ מתכון לא נמצא – הוסיפו רכיבים ידנית' }) : null,
          ]),
          el('div', { class: 'flex flex-col items-end gap-1 shrink-0' }, [
            el('select', {
              class: 'text-xs border rounded-lg px-1.5 py-1 bg-gray-50',
              onchange: (e) => { meal.day = e.target.value === '' ? null : Number(e.target.value); persistMeals(); renderMealPlanning(); },
            }, [
              el('option', { value: '', ...(meal.day === null ? { selected: 'selected' } : {}) }, 'ללא יום'),
              ...DAY_NAMES.map((d, i) => el('option', { value: i, ...(meal.day === i ? { selected: 'selected' } : {}) }, d)),
            ]),
          ]),
        ]),
        el('div', { class: 'flex gap-2 mt-2' }, [
          el('button', { class: 'text-sm px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 font-medium', onclick: () => editMealIngredients(meal.id) }, '✏️ ערוך מתכון'),
          el('button', { class: 'text-sm px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-medium', onclick: () => deleteMeal(meal.id) }, '🗑️ הסר'),
        ]),
      ]);
      mealList.appendChild(card);
    });
  });
}

function deleteMeal(id) {
  state.meals = state.meals.filter((m) => m.id !== id);
  persistMeals();
  renderMealPlanning();
}

function editMealIngredients(id) {
  const meal = state.meals.find((m) => m.id === id);
  if (!meal) return;

  const rowsContainer = el('div', { id: 'ing-rows' });
  function addRow(ing = { name: '', quantity: 1, unit: 'יחידה' }) {
    const nameInput = el('input', { type: 'text', value: ing.name, placeholder: 'שם רכיב', class: 'flex-1 border rounded-lg px-2 py-1.5 min-w-0' });
    const qtyInput = el('input', { type: 'number', step: '0.01', min: '0', value: ing.quantity, class: 'w-16 border rounded-lg px-2 py-1.5' });
    const unitSelect = el('select', { class: 'w-24 border rounded-lg px-1 py-1.5 text-sm' }, unitOptions(ing.unit));
    const row = el('div', { class: 'flex items-center gap-1.5 mb-2', 'data-row': '1' }, [
      nameInput, qtyInput, unitSelect,
      el('button', { type: 'button', class: 'text-red-500 px-2', onclick: () => row.remove() }, '✕'),
    ]);
    row._read = () => ({ name: nameInput.value.trim(), quantity: parseFloat(qtyInput.value) || 0, unit: unitSelect.value });
    rowsContainer.appendChild(row);
  }
  meal.ingredients.forEach((i) => addRow(i));
  if (meal.ingredients.length === 0) addRow();

  const form = el('form', {}, [
    el('h2', { class: 'text-lg font-bold mb-1', text: meal.name }),
    el('p', { class: 'text-sm text-gray-500 mb-3' }, 'רכיבים למתכון (ל-4 מנות)'),
    rowsContainer,
    el('button', { type: 'button', class: 'text-sm text-orange-600 font-medium mb-4', onclick: () => addRow() }, '+ הוסף רכיב'),
    el('button', { type: 'submit', class: 'w-full bg-orange-500 text-white rounded-lg py-2.5 font-semibold' }, 'שמור מתכון'),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rows = $$('[data-row]', rowsContainer).map((r) => r._read()).filter((r) => r.name);
    meal.ingredients = rows.map((r) => ({ ...r, category: guessCategory(r.name) }));
    persistMeals();
    renderMealPlanning();
    closeModal();
  });
  openModal(form);
}

mealForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const nameInput = $('#meal-name');
  const dayInput = $('#meal-day');
  const name = nameInput.value.trim();
  if (!name) return;
  const day = dayInput.value === '' ? null : Number(dayInput.value);

  const recipe = findAnyRecipe(name);
  const meal = {
    id: uid(),
    name: recipe ? recipe.nameHe : name,
    recipeId: recipe ? recipe.id : null,
    day,
    ingredients: recipe ? recipe.ingredients.map((i) => ({ ...i })) : [],
  };
  state.meals.push(meal);
  persistMeals();
  renderMealPlanning();
  mealForm.reset();
  nameInput.focus();

  if (!recipe) {
    // Unknown dish - immediately invite the user to define its ingredients.
    editMealIngredients(meal.id);
  }
});

// ---------------------------------------------------------------------
// Shopping list + weekly overview tab
// ---------------------------------------------------------------------
const weeklyGrid = $('#weekly-grid');
const shoppingSummary = $('#shopping-summary');
const shoppingList = $('#shopping-list');
const shoppingSatisfied = $('#shopping-satisfied');
const shoppingEmpty = $('#shopping-empty');

function getWeekDates() {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function renderWeeklyGrid() {
  weeklyGrid.innerHTML = '';
  const dates = getWeekDates();
  DAY_NAMES.forEach((name, i) => {
    const meals = state.meals.filter((m) => m.day === i);
    const card = el('div', { class: 'bg-white rounded-xl border border-gray-100 shadow-sm p-2.5 min-w-[7.5rem]' }, [
      el('div', { class: 'text-sm font-semibold text-gray-700' }, name),
      el('div', { class: 'text-[11px] text-gray-400 mb-1.5' }, `${dates[i].getDate()}.${dates[i].getMonth() + 1}`),
      meals.length === 0
        ? el('div', { class: 'text-xs text-gray-300' }, '—')
        : el('ul', { class: 'space-y-1' }, meals.map((m) => el('li', { class: 'text-xs bg-orange-50 text-orange-800 rounded-md px-1.5 py-1 truncate', text: m.name }))),
    ]);
    weeklyGrid.appendChild(card);
  });

  const noDay = state.meals.filter((m) => m.day === null || m.day === undefined);
  const existingNoDay = $('#no-day-section');
  if (existingNoDay) existingNoDay.remove();
  if (noDay.length > 0) {
    weeklyGrid.insertAdjacentElement('afterend', el('div', { id: 'no-day-section', class: 'mt-3' }, [
      el('div', { class: 'text-sm font-semibold text-gray-500 mb-1.5' }, 'ללא יום קבוע'),
      el('div', { class: 'flex flex-wrap gap-1.5' }, noDay.map((m) => el('span', { class: 'text-xs bg-gray-100 text-gray-700 rounded-md px-2 py-1', text: m.name }))),
    ]));
  }
}

function computeShopping() {
  const needed = {}; // key -> { name, category, unit, quantity }
  state.meals.forEach((meal) => {
    meal.ingredients.forEach((ing) => {
      if (!ing.name || !ing.quantity) return;
      const unitInfo = UNIT_BY_ID[ing.unit];
      if (!unitInfo) return;
      const key = `${normalize(ing.name)}::${unitInfo.kind}`;
      if (!needed[key]) {
        needed[key] = { name: ing.name, category: ing.category || guessCategory(ing.name), unit: ing.unit, quantity: 0 };
      }
      const converted = convert(ing.quantity, ing.unit, needed[key].unit);
      needed[key].quantity += converted ?? ing.quantity;
    });
  });

  const available = {}; // key -> quantity in that group's canonical unit
  state.pantry.forEach((item) => {
    const unitInfo = UNIT_BY_ID[item.unit];
    if (!unitInfo) return;
    const key = `${normalize(item.name)}::${unitInfo.kind}`;
    const group = needed[key];
    const targetUnit = group ? group.unit : item.unit;
    const converted = group ? convert(item.quantity, item.unit, targetUnit) : item.quantity;
    available[key] = (available[key] || 0) + (converted ?? item.quantity);
  });

  const missing = [];
  const satisfied = [];
  Object.entries(needed).forEach(([key, group]) => {
    const have = available[key] || 0;
    const remaining = group.quantity - have;
    if (remaining > 0.01) {
      missing.push({ key, ...group, quantity: remaining });
    } else {
      satisfied.push({ key, ...group });
    }
  });
  return { missing, satisfied };
}

function groupByCategory(items) {
  const grouped = {};
  items.forEach((item) => { (grouped[item.category] ||= []).push(item); });
  return grouped;
}

function renderShopping() {
  renderWeeklyGrid();
  const { missing, satisfied } = computeShopping();

  // Prune stale bought flags so localStorage doesn't grow forever.
  const validKeys = new Set(missing.map((m) => m.key));
  Object.keys(state.bought).forEach((k) => { if (!validKeys.has(k)) delete state.bought[k]; });
  persistBought();

  shoppingEmpty.classList.toggle('hidden', state.meals.length > 0);
  shoppingSummary.textContent = `${state.meals.length} ארוחות מתוכננות · ${missing.length} פריטים לקנייה`;

  shoppingList.innerHTML = '';
  const grouped = groupByCategory(missing);
  CATEGORIES.forEach((cat) => {
    const items = grouped[cat.id];
    if (!items || items.length === 0) return;
    shoppingList.appendChild(el('h3', { class: 'px-1 pt-3 pb-1 text-sm font-semibold text-gray-500 first:pt-0' }, `${cat.icon} ${cat.label}`));
    items
      .sort((a, b) => (state.bought[a.key] ? 1 : 0) - (state.bought[b.key] ? 1 : 0))
      .forEach((item) => {
        const bought = !!state.bought[item.key];
        const row = el('label', { class: `flex items-center gap-2 bg-white rounded-xl px-3 py-2 mb-2 shadow-sm border border-gray-100 ${bought ? 'opacity-50' : ''}` }, [
          el('input', {
            type: 'checkbox', class: 'w-5 h-5 accent-orange-500 shrink-0', ...(bought ? { checked: 'checked' } : {}),
            onchange: (e) => { state.bought[item.key] = e.target.checked; persistBought(); renderShopping(); },
          }),
          el('div', { class: 'flex-1 min-w-0' }, [
            el('div', { class: `font-medium text-gray-800 truncate ${bought ? 'line-through' : ''}`, text: item.name }),
          ]),
          el('div', { class: 'text-sm text-gray-500 shrink-0', text: `${fmtQty(item.quantity)} ${UNIT_BY_ID[item.unit]?.label ?? item.unit}` }),
        ]);
        shoppingList.appendChild(row);
      });
  });

  shoppingSatisfied.innerHTML = '';
  if (satisfied.length > 0) {
    shoppingSatisfied.appendChild(el('details', { class: 'mt-3' }, [
      el('summary', { class: 'text-sm font-medium text-green-700 cursor-pointer' }, `✅ יש לכם מספיק בבית (${satisfied.length})`),
      el('div', { class: 'mt-2' }, satisfied.map((item) => el('div', { class: 'text-sm text-gray-600 py-1 flex justify-between' }, [
        el('span', {}, item.name),
        el('span', { class: 'text-gray-400' }, `${fmtQty(item.quantity)} ${UNIT_BY_ID[item.unit]?.label ?? item.unit}`),
      ]))),
    ]));
  }
}

function buildShoppingText() {
  const { missing } = computeShopping();
  const grouped = groupByCategory(missing);
  let lines = ['🛒 רשימת קניות שבועית', ''];
  CATEGORIES.forEach((cat) => {
    const items = grouped[cat.id];
    if (!items || items.length === 0) return;
    lines.push(`${cat.icon} ${cat.label}:`);
    items.forEach((item) => {
      const mark = state.bought[item.key] ? '✔' : '▫';
      lines.push(`${mark} ${item.name} - ${fmtQty(item.quantity)} ${UNIT_BY_ID[item.unit]?.label ?? item.unit}`);
    });
    lines.push('');
  });
  return lines.join('\n').trim();
}

$('#copy-list-btn').addEventListener('click', async () => {
  const text = buildShoppingText();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = el('textarea', { class: 'sr-only' });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  const btn = $('#copy-list-btn');
  const original = btn.textContent;
  btn.textContent = '✔ הועתק!';
  setTimeout(() => { btn.textContent = original; }, 1500);
});

$('#share-whatsapp-btn').addEventListener('click', () => {
  const text = buildShoppingText();
  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }
});

$('#new-week-btn').addEventListener('click', () => {
  if (!confirm('להתחיל שבוע חדש? פעולה זו תמחק את תכנון הארוחות ואת סימוני "נקנה" (המזווה יישאר).')) return;
  state.meals = [];
  state.bought = {};
  persistMeals();
  persistBought();
  renderMealPlanning();
  renderShopping();
  showTab('plan');
});

// ---------------------------------------------------------------------
// Custom recipe creation
// ---------------------------------------------------------------------
$('#add-custom-recipe-btn').addEventListener('click', () => {
  const nameHe = el('input', { type: 'text', placeholder: 'שם המתכון בעברית', class: 'w-full border rounded-lg px-3 py-2 mb-3' });
  const nameEn = el('input', { type: 'text', placeholder: 'Recipe name in English (optional)', class: 'w-full border rounded-lg px-3 py-2 mb-3' });
  const form = el('form', {}, [
    el('h2', { class: 'text-lg font-bold mb-4' }, 'מתכון חדש'),
    nameHe, nameEn,
    el('p', { class: 'text-xs text-gray-500 mb-3' }, 'לאחר היצירה תוכלו להוסיף רכיבים דרך "ערוך מתכון".'),
    el('button', { type: 'submit', class: 'w-full bg-orange-500 text-white rounded-lg py-2.5 font-semibold' }, 'צור מתכון'),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const he = nameHe.value.trim();
    if (!he) return;
    const recipe = { id: `custom-${uid()}`, nameHe: he, nameEn: nameEn.value.trim(), servings: 4, ingredients: [] };
    state.customRecipes.push(recipe);
    store.setCustomRecipes(state.customRecipes);
    populateRecipeSuggestions();
    populatePantrySuggestions();
    closeModal();
    $('#meal-name').value = he;
    $('#meal-name').focus();
  });
  openModal(form);
});

// ---------------------------------------------------------------------
// Tab nav wiring
// ---------------------------------------------------------------------
$$('.tab-btn').forEach((btn) => btn.addEventListener('click', () => showTab(btn.dataset.tab)));

// ---------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------
$('#pantry-unit').append(...unitOptions('יחידה'));
populatePantrySuggestions();
populateRecipeSuggestions();
renderPantry();
renderMealPlanning();
renderShopping();
showTab('pantry');

// ---------------------------------------------------------------------
// Service worker + installability
// ---------------------------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

let deferredInstallPrompt = null;
const installBtn = $('#install-btn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBtn.classList.remove('hidden');
});
installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.classList.add('hidden');
});
window.addEventListener('appinstalled', () => installBtn.classList.add('hidden'));

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
if (isIos && !isStandalone) {
  $('#ios-install-tip').classList.remove('hidden');
}
$('#ios-install-tip-close')?.addEventListener('click', () => $('#ios-install-tip').classList.add('hidden'));
