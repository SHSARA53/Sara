import {
  CATEGORIES, CATEGORY_BY_ID, UNITS, UNIT_BY_ID, RECIPES,
  MEAL_TYPES, MEAL_TYPE_BY_ID, pickDefaultMealType,
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

// Meals saved by an earlier version of the app have no mealType - default
// them to lunch so nothing silently disappears from the new 3-slot layout.
state.meals.forEach((m) => { if (!m.mealType) m.mealType = 'lunch'; });
store.setMeals(state.meals);

function allRecipes() {
  return [...RECIPES, ...state.customRecipes];
}

function findAnyRecipe(name) {
  const key = normalize(name);
  return allRecipes().find((r) => normalize(r.nameHe) === key || normalize(r.nameEn) === key) || findRecipe(name);
}

function findRecipeById(id) {
  return allRecipes().find((r) => r.id === id) || null;
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
// Toast (small, fun confirmation pill)
// ---------------------------------------------------------------------
const toastEl = $('#toast');
let toastTimer = null;
function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('toast-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('toast-show'), 1700);
}

// ---------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------
function showTab(tab) {
  state.activeTab = tab;
  $$('.tab-panel').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== tab));
  $$('.tab-btn').forEach((b) => {
    const active = b.dataset.tab === tab;
    const pill = $('.tab-pill', b);
    b.classList.toggle('text-ink/40', !active);
    b.classList.toggle('text-ink', active);
    pill.classList.toggle('bg-yellow-300', active);
    pill.classList.toggle('border-ink', active);
    pill.classList.toggle('border-transparent', !active);
    pill.classList.toggle('-translate-y-1', active);
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
    pantryList.appendChild(el('h3', { class: 'px-1 pt-4 pb-1.5 text-sm font-black text-ink/70 first:pt-0' }, `${cat.icon} ${cat.label}`));
    items.forEach((item) => {
      const row = el('div', { class: 'fade-in-item flex items-center gap-2 bg-white rounded-xl px-3 py-2 mb-2 border-[2.5px] border-ink shadow-[3px_3px_0_#1a1523]' }, [
        el('div', { class: 'flex-1 min-w-0' }, [
          el('div', { class: 'font-bold text-ink truncate', text: item.name }),
          el('div', { class: 'text-xs font-semibold text-ink/50', text: `${fmtQty(item.quantity)} ${UNIT_BY_ID[item.unit]?.label ?? item.unit}` }),
        ]),
        el('button', {
          class: 'p-2 text-ink/50 hover:text-violet-600 rounded-lg active:scale-90 transition-transform', 'aria-label': 'ערוך',
          onclick: () => editPantryItem(item.id),
        }, '✏️'),
        el('button', {
          class: 'p-2 text-ink/50 hover:text-red-500 rounded-lg active:scale-90 transition-transform', 'aria-label': 'מחק',
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
  const nameInput = el('input', { type: 'text', value: item.name, class: 'w-full border-[2.5px] border-ink rounded-xl px-3 py-2 mb-3 font-medium' });
  const qtyInput = el('input', { type: 'number', step: '0.01', min: '0', value: item.quantity, class: 'w-full border-[2.5px] border-ink rounded-xl px-3 py-2 mb-3 font-medium' });
  const unitSelect = el('select', { class: 'w-full border-[2.5px] border-ink rounded-xl px-3 py-2 mb-3 font-medium' }, unitOptions(item.unit));
  const catSelect = el('select', { class: 'w-full border-[2.5px] border-ink rounded-xl px-3 py-2 mb-4 font-medium' }, categoryOptions(item.category));

  const form = el('form', {}, [
    el('h2', { class: 'text-lg font-black mb-4' }, '✏️ עריכת פריט מזווה'),
    el('label', { class: 'text-sm font-bold text-ink/60' }, 'שם'), nameInput,
    el('label', { class: 'text-sm font-bold text-ink/60' }, 'כמות'), qtyInput,
    el('label', { class: 'text-sm font-bold text-ink/60' }, 'יחידה'), unitSelect,
    el('label', { class: 'text-sm font-bold text-ink/60' }, 'קטגוריה'), catSelect,
    el('button', { type: 'submit', class: 'w-full bg-pink-500 text-white border-[3px] border-ink rounded-full py-2.5 font-extrabold shadow-[4px_4px_0_#1a1523] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all' }, 'שמור'),
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
  showToast(`✨ ${name} נוסף למזווה`);
});

// ---------------------------------------------------------------------
// Meal planning tab
// ---------------------------------------------------------------------
const mealForm = $('#meal-form');
const mealList = $('#meal-list');
const mealEmpty = $('#meal-empty');
const recipeDatalist = $('#recipe-suggestions');
const mealTypeChipsEl = $('#mealtype-chips');
const dayChipsEl = $('#day-chips');

// Current selection in the "add meal" form - driven by the chip groups
// below instead of plain <select> elements for a livelier feel.
const mealFormState = {
  mealType: pickDefaultMealType(),
  day: null,
};

function renderChipGroup(container, options, isSelected, onSelect) {
  container.innerHTML = '';
  options.forEach((opt) => {
    const selected = isSelected(opt.value);
    const btn = el('button', {
      type: 'button',
      class: `shrink-0 rounded-full px-3 py-1.5 text-sm font-extrabold border-[2.5px] transition-all active:scale-95 ${
        selected ? `${opt.selectedClass} border-ink shadow-[3px_3px_0_#1a1523] -translate-y-0.5` : 'bg-white text-ink/40 border-ink/20'
      }`,
      onclick: () => onSelect(opt.value),
    }, opt.label);
    container.appendChild(btn);
  });
}

function renderMealTypeChips() {
  renderChipGroup(
    mealTypeChipsEl,
    MEAL_TYPES.map((mt) => ({ value: mt.id, label: `${mt.icon} ${mt.label}`, selectedClass: `${mt.chipBg} ${mt.chipText}` })),
    (v) => v === mealFormState.mealType,
    (v) => { mealFormState.mealType = v; renderMealTypeChips(); populateRecipeSuggestions(); },
  );
}

function renderDayChips() {
  const options = [
    { value: '', label: 'ללא יום', selectedClass: 'bg-ink text-cream' },
    ...DAY_NAMES.map((d, i) => ({ value: String(i), label: d, selectedClass: 'bg-pink-400 text-white' })),
  ];
  renderChipGroup(
    dayChipsEl,
    options,
    (v) => v === (mealFormState.day === null ? '' : String(mealFormState.day)),
    (v) => { mealFormState.day = v === '' ? null : Number(v); renderDayChips(); },
  );
}

function populateRecipeSuggestions() {
  recipeDatalist.innerHTML = '';
  allRecipes()
    .filter((r) => !r.mealTypes || r.mealTypes.includes(mealFormState.mealType))
    .forEach((r) => {
      recipeDatalist.appendChild(el('option', { value: r.nameHe }));
      if (r.nameEn) recipeDatalist.appendChild(el('option', { value: r.nameEn }));
    });
}

function dayLabel(day) {
  return day === null || day === undefined ? 'ללא יום קבוע' : DAY_NAMES[day];
}

function mealTypeSelect(meal) {
  return el('select', {
    class: 'text-xs font-bold border-2 border-ink rounded-lg px-1.5 py-1 bg-white',
    onchange: (e) => { meal.mealType = e.target.value; persistMeals(); renderMealPlanning(); },
  }, MEAL_TYPES.map((mt) => el('option', { value: mt.id, ...(meal.mealType === mt.id ? { selected: 'selected' } : {}) }, `${mt.icon} ${mt.label}`)));
}

function daySelect(meal) {
  return el('select', {
    class: 'text-xs font-bold border-2 border-ink rounded-lg px-1.5 py-1 bg-white',
    onchange: (e) => { meal.day = e.target.value === '' ? null : Number(e.target.value); persistMeals(); renderMealPlanning(); },
  }, [
    el('option', { value: '', ...(meal.day === null ? { selected: 'selected' } : {}) }, 'ללא יום'),
    ...DAY_NAMES.map((d, i) => el('option', { value: i, ...(meal.day === i ? { selected: 'selected' } : {}) }, d)),
  ]);
}

function renderMealPlanning() {
  mealList.innerHTML = '';
  mealEmpty.classList.toggle('hidden', state.meals.length > 0);

  const dayOrder = [0, 1, 2, 3, 4, 5, 6, null];
  dayOrder.forEach((day) => {
    const dayMeals = state.meals.filter((m) => m.day === day);
    if (dayMeals.length === 0) return;
    mealList.appendChild(el('h3', { class: 'px-1 pt-4 pb-1.5 text-sm font-black text-ink/70 first:pt-0' }, `📅 ${dayLabel(day)}`));

    MEAL_TYPES.forEach((mt) => {
      const meals = dayMeals.filter((m) => m.mealType === mt.id);
      if (meals.length === 0) return;
      mealList.appendChild(el('div', {
        class: `fade-in-item inline-flex items-center gap-1 text-xs font-extrabold ${mt.chipText} ${mt.chipBg} border-2 border-ink rounded-full px-2.5 py-1 mb-1.5 mt-1`,
      }, `${mt.icon} ${mt.label}`));

      meals.forEach((meal) => {
        const recipe = meal.recipeId ? findRecipeById(meal.recipeId) : null;
        const isCustomUnmatched = meal.ingredients.length === 0;
        const card = el('div', { class: `fade-in-item bg-white rounded-2xl px-3 py-3 mb-2.5 border-[2.5px] border-ink shadow-[4px_4px_0_#1a1523]` }, [
          el('div', { class: 'flex items-start justify-between gap-2' }, [
            el('div', { class: 'min-w-0' }, [
              el('div', { class: 'font-black text-ink truncate', text: meal.name }),
              recipe?.nameEn ? el('div', { class: 'text-xs font-semibold text-ink/40', text: recipe.nameEn }) : null,
              el('div', { class: 'text-xs font-bold text-ink/50 mt-1', text: `${meal.ingredients.length} רכיבים` }),
              isCustomUnmatched
                ? el('div', { class: 'text-xs font-bold text-orange-600 mt-1', text: meal.recipeId ? '⚠️ עדיין אין רכיבים - לחצו על "ערוך מתכון"' : '⚠️ מתכון לא נמצא – הוסיפו רכיבים ידנית' })
                : null,
            ]),
            el('div', { class: 'flex flex-col items-end gap-1 shrink-0' }, [mealTypeSelect(meal), daySelect(meal)]),
          ]),
          el('div', { class: 'flex gap-2 mt-2.5' }, [
            el('button', { class: 'text-sm px-3 py-1.5 rounded-full bg-violet-100 text-violet-800 font-extrabold border-2 border-ink active:scale-95 transition-transform', onclick: () => editMealIngredients(meal.id) }, '✏️ ערוך מתכון'),
            el('button', { class: 'text-sm px-3 py-1.5 rounded-full bg-red-100 text-red-700 font-extrabold border-2 border-ink active:scale-95 transition-transform', onclick: () => deleteMeal(meal.id) }, '🗑️ הסר'),
          ]),
        ]);
        mealList.appendChild(card);
      });
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
    const nameInput = el('input', { type: 'text', value: ing.name, placeholder: 'שם רכיב', class: 'flex-1 border-2 border-ink rounded-lg px-2 py-1.5 min-w-0 font-medium' });
    const qtyInput = el('input', { type: 'number', step: '0.01', min: '0', value: ing.quantity, class: 'w-16 border-2 border-ink rounded-lg px-2 py-1.5 font-medium' });
    const unitSelect = el('select', { class: 'w-24 border-2 border-ink rounded-lg px-1 py-1.5 text-sm font-medium' }, unitOptions(ing.unit));
    const row = el('div', { class: 'flex items-center gap-1.5 mb-2', 'data-row': '1' }, [
      nameInput, qtyInput, unitSelect,
      el('button', { type: 'button', class: 'text-red-500 font-black px-2', onclick: () => row.remove() }, '✕'),
    ]);
    row._read = () => ({ name: nameInput.value.trim(), quantity: parseFloat(qtyInput.value) || 0, unit: unitSelect.value });
    rowsContainer.appendChild(row);
  }
  meal.ingredients.forEach((i) => addRow(i));
  if (meal.ingredients.length === 0) addRow();

  const form = el('form', {}, [
    el('h2', { class: 'text-lg font-black mb-1', text: meal.name }),
    el('p', { class: 'text-sm font-semibold text-ink/60 mb-3' }, 'רכיבים למתכון (ל-4 מנות)'),
    rowsContainer,
    el('button', { type: 'button', class: 'text-sm text-violet-700 font-extrabold mb-4', onclick: () => addRow() }, '+ הוסף רכיב'),
    el('button', { type: 'submit', class: 'w-full bg-pink-500 text-white border-[3px] border-ink rounded-full py-2.5 font-extrabold shadow-[4px_4px_0_#1a1523] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all' }, 'שמור מתכון'),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rows = $$('[data-row]', rowsContainer).map((r) => r._read()).filter((r) => r.name);
    meal.ingredients = rows.map((r) => ({ ...r, category: guessCategory(r.name) }));
    persistMeals();

    // A custom recipe starts out with no ingredients of its own; the first
    // time someone fills them in for a planned meal, save them back onto
    // the recipe template too, so choosing this dish again next time comes
    // pre-filled instead of starting from a blank list again.
    if (meal.recipeId) {
      const customRecipe = state.customRecipes.find((r) => r.id === meal.recipeId);
      if (customRecipe && customRecipe.ingredients.length === 0 && meal.ingredients.length > 0) {
        customRecipe.ingredients = meal.ingredients.map((i) => ({ ...i }));
        store.setCustomRecipes(state.customRecipes);
      }
    }

    renderMealPlanning();
    renderShopping();
    closeModal();
    showToast(`✅ הרכיבים ל${meal.name} נשמרו`);
  });
  openModal(form);
}

const NEXT_MEAL_TYPE = { breakfast: 'lunch', lunch: 'dinner', dinner: 'dinner' };

mealForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nameInput = $('#meal-name');
  const name = nameInput.value.trim();
  if (!name) return;

  const recipe = findAnyRecipe(name);
  const meal = {
    id: uid(),
    name: recipe ? recipe.nameHe : name,
    recipeId: recipe ? recipe.id : null,
    mealType: mealFormState.mealType,
    day: mealFormState.day,
    ingredients: recipe ? recipe.ingredients.map((i) => ({ ...i })) : [],
  };
  state.meals.push(meal);
  persistMeals();
  renderMealPlanning();
  nameInput.value = '';
  nameInput.focus();

  const mt = MEAL_TYPE_BY_ID[meal.mealType];
  showToast(`${mt.icon} ${meal.name} נוסף ל${mt.label}${meal.day !== null ? ` - יום ${DAY_NAMES[meal.day]}` : ''}`);

  // Nudge the chip forward (בוקר → צהריים → ערב) so planning a full day
  // of meals back-to-back doesn't require re-picking the slot each time.
  mealFormState.mealType = NEXT_MEAL_TYPE[mealFormState.mealType];
  renderMealTypeChips();
  populateRecipeSuggestions();

  if (meal.ingredients.length === 0) {
    if (store.getApiKey()) {
      showToast(`🤖 ה-AI כותב מתכון ל${meal.name}...`);
      const aiRecipe = await fetchAIRecipe(name);
      if (aiRecipe) {
        // Save it as a reusable custom recipe too, so choosing this dish
        // again later comes pre-filled with no extra API call.
        const newRecipe = {
          id: `custom-${uid()}`, nameHe: aiRecipe.nameHe, nameEn: aiRecipe.nameEn,
          servings: 4, mealTypes: ['breakfast', 'lunch', 'dinner'],
          ingredients: aiRecipe.ingredients.map((i) => ({ ...i })),
        };
        state.customRecipes.push(newRecipe);
        store.setCustomRecipes(state.customRecipes);

        meal.name = aiRecipe.nameHe;
        meal.recipeId = newRecipe.id;
        meal.ingredients = aiRecipe.ingredients;
        persistMeals();
        renderMealPlanning();
        renderShopping();
        populateRecipeSuggestions();
        populatePantrySuggestions();
        showToast(`✨ מתכון ל${meal.name} נוצר עם AI!`);
        return;
      }
      showToast('⚠️ ה-AI לא הצליח - הוסיפו רכיבים ידנית');
    }
    // No known ingredients yet - either an unrecognized dish, no AI key set,
    // or the AI call failed. Either way, invite the user to define the
    // ingredients right now instead of silently adding an empty meal that
    // can't contribute to the shopping list.
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

function goPlanEmptySlot(day, mealTypeId) {
  mealFormState.day = day;
  mealFormState.mealType = mealTypeId;
  renderMealTypeChips();
  renderDayChips();
  populateRecipeSuggestions();
  showTab('plan');
  setTimeout(() => $('#meal-name').focus(), 50);
}

function renderWeeklyGrid() {
  weeklyGrid.innerHTML = '';
  const dates = getWeekDates();
  const today = new Date();

  DAY_NAMES.forEach((name, i) => {
    const isToday = dates[i].toDateString() === today.toDateString();
    const dayMeals = state.meals.filter((m) => m.day === i);
    const card = el('div', {
      class: `fade-in-item bg-white rounded-2xl border-[2.5px] border-ink shadow-[4px_4px_0_#1a1523] p-3 ${isToday ? 'ring-[3px] ring-pink-400 ring-offset-2 ring-offset-cream' : ''}`,
    }, [
      el('div', { class: 'flex items-center justify-between mb-2' }, [
        el('div', { class: 'flex items-center gap-1.5' }, [
          el('span', { class: 'font-black' }, name),
          isToday ? el('span', { class: 'text-[10px] bg-pink-500 text-white border-2 border-ink rounded-full px-1.5 py-0.5 font-extrabold' }, 'היום') : null,
        ]),
        el('span', { class: 'text-xs font-bold text-ink/40' }, `${dates[i].getDate()}.${dates[i].getMonth() + 1}`),
      ]),
      el('div', { class: 'space-y-1.5' }, MEAL_TYPES.map((mt) => {
        const meals = dayMeals.filter((m) => m.mealType === mt.id);
        const label = meals.map((m) => m.name).join('، ') || 'הוסיפו ארוחה';
        return el('button', {
          type: 'button',
          class: `w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-right border-2 transition-colors ${meals.length ? `${mt.softBg} border-ink/10` : 'bg-cream border-dashed border-ink/25 hover:border-ink/50'}`,
          onclick: () => goPlanEmptySlot(i, mt.id),
        }, [
          el('span', {}, mt.icon),
          el('span', { class: `font-extrabold ${mt.softText} shrink-0` }, mt.label + ':'),
          el('span', { class: `flex-1 min-w-0 truncate font-semibold ${meals.length ? 'text-ink' : 'text-ink/35'}` }, label),
          !meals.length ? el('span', { class: 'text-pink-500 text-sm font-black shrink-0' }, '+') : null,
        ]);
      })),
    ]);
    weeklyGrid.appendChild(card);
  });

  const existingNoDay = $('#no-day-section');
  if (existingNoDay) existingNoDay.remove();
  const noDay = state.meals.filter((m) => m.day === null || m.day === undefined);
  if (noDay.length > 0) {
    weeklyGrid.insertAdjacentElement('afterend', el('div', { id: 'no-day-section', class: 'fade-in-item mt-1' }, [
      el('div', { class: 'text-sm font-black text-ink/60 mb-1.5' }, '🗓️ ללא יום קבוע'),
      el('div', { class: 'flex flex-wrap gap-1.5' }, noDay.map((m) => {
        const mt = MEAL_TYPE_BY_ID[m.mealType];
        return el('span', { class: `text-xs ${mt.chipBg} ${mt.chipText} border-2 border-ink rounded-full px-2.5 py-1 font-bold` }, `${mt.icon} ${m.name}`);
      })),
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

  const noMealsYet = state.meals.length === 0;
  const noIngredientsYet = !noMealsYet && missing.length === 0 && satisfied.length === 0;
  shoppingEmpty.classList.toggle('hidden', !noMealsYet && !noIngredientsYet);
  shoppingEmpty.textContent = noIngredientsYet
    ? '⚠️ לארוחות שתכננתם עדיין אין רכיבים. פתחו "ערוך מתכון" בלשונית תכנון והוסיפו רכיבים.'
    : 'אין עדיין רשימת קניות. הוסיפו ארוחות בלשונית "תכנון" 👈';
  shoppingSummary.textContent = `${state.meals.length} ארוחות מתוכננות · ${missing.length} פריטים לקנייה`;

  shoppingList.innerHTML = '';
  const grouped = groupByCategory(missing);
  CATEGORIES.forEach((cat) => {
    const items = grouped[cat.id];
    if (!items || items.length === 0) return;
    shoppingList.appendChild(el('h3', { class: 'px-1 pt-4 pb-1.5 text-sm font-black text-ink/70 first:pt-0' }, `${cat.icon} ${cat.label}`));
    items
      .sort((a, b) => (state.bought[a.key] ? 1 : 0) - (state.bought[b.key] ? 1 : 0))
      .forEach((item) => {
        const bought = !!state.bought[item.key];
        const row = el('label', { class: `fade-in-item flex items-center gap-2 bg-white rounded-xl px-3 py-2 mb-2 border-[2.5px] border-ink shadow-[3px_3px_0_#1a1523] ${bought ? 'opacity-40' : ''}` }, [
          el('input', {
            type: 'checkbox', class: 'check-pop w-5 h-5 accent-pink-500 shrink-0', ...(bought ? { checked: 'checked' } : {}),
            onchange: (e) => { state.bought[item.key] = e.target.checked; persistBought(); renderShopping(); },
          }),
          el('div', { class: 'flex-1 min-w-0' }, [
            el('div', { class: `font-bold text-ink truncate ${bought ? 'line-through' : ''}`, text: item.name }),
          ]),
          el('div', { class: 'text-sm font-extrabold text-ink/50 shrink-0', text: `${fmtQty(item.quantity)} ${UNIT_BY_ID[item.unit]?.label ?? item.unit}` }),
        ]);
        shoppingList.appendChild(row);
      });
  });

  shoppingSatisfied.innerHTML = '';
  if (satisfied.length > 0) {
    shoppingSatisfied.appendChild(el('details', { class: 'fade-in-item mt-3 bg-lime-100 border-[2.5px] border-ink rounded-xl px-3 py-2' }, [
      el('summary', { class: 'text-sm font-extrabold text-lime-900 cursor-pointer' }, `✅ יש לכם מספיק בבית (${satisfied.length})`),
      el('div', { class: 'mt-2' }, satisfied.map((item) => el('div', { class: 'text-sm font-semibold text-lime-900/70 py-1 flex justify-between' }, [
        el('span', {}, item.name),
        el('span', {}, `${fmtQty(item.quantity)} ${UNIT_BY_ID[item.unit]?.label ?? item.unit}`),
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
  showToast('📋 רשימת הקניות הועתקה');
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
  showToast('🔄 שבוע חדש מתחיל!');
});

// ---------------------------------------------------------------------
// Custom recipe creation
// ---------------------------------------------------------------------
$('#add-custom-recipe-btn').addEventListener('click', () => {
  const nameHe = el('input', { type: 'text', placeholder: 'שם המתכון בעברית', class: 'w-full border-2 border-ink rounded-xl px-3 py-2 mb-3 font-medium' });
  const nameEn = el('input', { type: 'text', placeholder: 'Recipe name in English (optional)', class: 'w-full border-2 border-ink rounded-xl px-3 py-2 mb-3 font-medium' });
  const form = el('form', {}, [
    el('h2', { class: 'text-lg font-black mb-4' }, '✨ מתכון חדש'),
    nameHe, nameEn,
    el('p', { class: 'text-xs font-semibold text-ink/50 mb-3' }, 'בשלב הבא תוכלו להוסיף לו רכיבים.'),
    el('button', { type: 'submit', class: 'w-full bg-pink-500 text-white border-[3px] border-ink rounded-full py-2.5 font-extrabold shadow-[4px_4px_0_#1a1523] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all' }, 'המשך להוספת רכיבים ←'),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const he = nameHe.value.trim();
    if (!he) return;
    // Custom recipes are undated as to meal type - versatile, so they show
    // up as suggestions no matter which slot the user is filling.
    const recipe = { id: `custom-${uid()}`, nameHe: he, nameEn: nameEn.value.trim(), servings: 4, mealTypes: ['breakfast', 'lunch', 'dinner'], ingredients: [] };
    state.customRecipes.push(recipe);
    store.setCustomRecipes(state.customRecipes);
    populateRecipeSuggestions();
    populatePantrySuggestions();

    // Plan it for whichever slot is currently selected and go straight into
    // the ingredient editor - no dead-end where the recipe exists but
    // nothing was actually added to the week yet.
    const meal = {
      id: uid(), name: recipe.nameHe, recipeId: recipe.id,
      mealType: mealFormState.mealType, day: mealFormState.day, ingredients: [],
    };
    state.meals.push(meal);
    persistMeals();
    renderMealPlanning();
    const mt = MEAL_TYPE_BY_ID[meal.mealType];
    showToast(`${mt.icon} ${meal.name} נוסף ל${mt.label} - הוסיפו רכיבים`);
    editMealIngredients(meal.id); // replaces this modal's content directly
  });
  openModal(form);
});

// ---------------------------------------------------------------------
// AI recipe lookup (bring-your-own Claude API key)
// ---------------------------------------------------------------------
// When a typed dish matches nothing in the built-in or custom recipe
// lists, and the user has saved their own Claude API key, ask Claude for
// a real recipe instead of leaving the meal empty. The key is called
// directly from the browser (never through any server of ours) and is
// only ever stored on this device.
const AI_MODEL = 'claude-haiku-4-5-20251001';

async function fetchAIRecipe(dishName) {
  const apiKey = store.getApiKey();
  if (!apiKey) return null;

  const unitIds = UNITS.map((u) => u.id).join(', ');
  const prompt = `תן מתכון ריאלי בעברית עבור "${dishName}", בכמויות ל-4 מנות.
החזירי אך ורק אובייקט JSON תקני אחד, בלי טקסט נוסף לפני או אחרי, בלי בלוק קוד של markdown, בפורמט הזה בדיוק:
{"nameHe": "שם המנה בעברית", "nameEn": "Dish name in English", "ingredients": [{"name": "שם מצרך בעברית", "quantity": 2, "unit": "יחידה"}]}
שדה "unit" בכל רכיב חייב להיות בדיוק אחת מהמילים הבאות (בלי תוספות): ${unitIds}.
תני בין 4 ל-10 רכיבים אמיתיים עם כמויות הגיוניות למתכון ביתי.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.ingredients)) return null;

    const validUnits = new Set(UNITS.map((u) => u.id));
    const ingredients = parsed.ingredients
      .filter((i) => i && i.name && i.quantity)
      .map((i) => ({
        name: String(i.name).trim(),
        quantity: Number(i.quantity) || 1,
        unit: validUnits.has(i.unit) ? i.unit : 'יחידה',
        category: guessCategory(String(i.name)),
      }));
    if (ingredients.length === 0) return null;

    return { nameHe: parsed.nameHe || dishName, nameEn: parsed.nameEn || '', ingredients };
  } catch {
    return null; // Network error, invalid key, rate limit, bad JSON, etc.
  }
}

$('#ai-settings-btn').addEventListener('click', () => {
  const hasKey = !!store.getApiKey();
  const keyInput = el('input', {
    type: 'password', placeholder: 'sk-ant-...', autocomplete: 'off',
    value: store.getApiKey(), class: 'w-full border-2 border-ink rounded-xl px-3 py-2 mb-3 font-mono text-sm',
  });
  const form = el('form', {}, [
    el('h2', { class: 'text-lg font-black mb-2' }, '🤖 חיפוש מתכונים עם AI'),
    el('p', { class: 'text-sm font-medium text-ink/60 mb-3' }, [
      'כשמקלידים שם מנה שלא קיימת עדיין באפליקציה, ה-AI יכתוב לה מתכון אמיתי במקום להשאיר אותה ריקה. ',
      'המפתח נשמר רק בטלפון הזה ונשלח ישירות ל-Anthropic - לא דרכי ולא לאף אחד אחר. השימוש כרוך בתשלום קטן (אגורות) לכל מתכון, דרך חשבון ה-API שלכם.',
    ]),
    el('a', {
      href: 'https://console.anthropic.com/settings/keys', target: '_blank', rel: 'noopener',
      class: 'inline-block text-sm font-extrabold text-violet-700 underline decoration-wavy decoration-2 mb-3',
    }, 'איך מפיקים מפתח API ←'),
    el('label', { class: 'text-xs font-bold text-ink/60 block mb-1' }, 'מפתח API'),
    keyInput,
    el('div', { class: 'flex gap-2' }, [
      hasKey ? el('button', {
        type: 'button', class: 'flex-1 bg-white text-red-600 border-[2.5px] border-ink rounded-full py-2.5 font-extrabold shadow-[3px_3px_0_#1a1523] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all',
        onclick: () => { store.setApiKey(''); closeModal(); showToast('🗑️ המפתח הוסר'); },
      }, 'הסר מפתח') : null,
      el('button', { type: 'submit', class: 'flex-1 bg-pink-500 text-white border-[3px] border-ink rounded-full py-2.5 font-extrabold shadow-[4px_4px_0_#1a1523] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all' }, 'שמור'),
    ]),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    store.setApiKey(keyInput.value.trim());
    closeModal();
    showToast(keyInput.value.trim() ? '✅ המפתח נשמר' : '🗑️ המפתח הוסר');
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
renderMealTypeChips();
renderDayChips();
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
