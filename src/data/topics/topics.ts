import type { Topic } from "../../models/types";
import { t, v } from "./helpers";

export const colorsTopic: Topic = {
  id: "colors",
  title: t("צבעים", "Colors"),
  description: t("בואו נגלה צבעים קסומים!", "Let's discover magical colors!"),
  icon: "🎨",
  theme: "berry",
  ageRange: "2-3",
  activityTypes: ["FIND", "SORT", "MEMORY"],
  vocabulary: [
    // `group` (warm/cool) gives the SORT activity real, multi-item baskets
    // to sort into - without it every color is its own unique category of
    // exactly one, which isn't a sorting task at all.
    v("red", "אדום", "Red", "🔴", { color: "#FF5A5F", renderAs: "swatch", group: "warm" }),
    v("blue", "כחול", "Blue", "🔵", { color: "#3B82F6", renderAs: "swatch", group: "cool" }),
    v("yellow", "צהוב", "Yellow", "🟡", { color: "#FFD93D", renderAs: "swatch", group: "warm" }),
    v("green", "ירוק", "Green", "🟢", { color: "#4ADE80", renderAs: "swatch", group: "cool" }),
    v("pink", "ורוד", "Pink", "🩷", { color: "#FF9EB5", renderAs: "swatch", group: "warm" }),
    v("orange", "כתום", "Orange", "🟠", { color: "#FFA94D", renderAs: "swatch", group: "warm" }),
    v("purple", "סגול", "Purple", "🟣", { color: "#C4A5FF", renderAs: "swatch", group: "cool" }),
  ],
};

export const shapesTopic: Topic = {
  id: "shapes",
  title: t("צורות", "Shapes"),
  description: t("עיגולים, ריבועים ועוד!", "Circles, squares and more!"),
  icon: "🔺",
  theme: "sky",
  ageRange: "2-3",
  activityTypes: ["FIND", "SORT", "MEMORY"],
  vocabulary: [
    v("circle", "עיגול", "Circle", "⚪", { renderAs: "shape", shapeKind: "circle", color: "#7FCEFF" }),
    v("square", "ריבוע", "Square", "⬜", { renderAs: "shape", shapeKind: "square", color: "#FFC93C" }),
    v("triangle", "משולש", "Triangle", "🔺", { renderAs: "shape", shapeKind: "triangle", color: "#7FE0AB" }),
    v("rectangle", "מלבן", "Rectangle", "▭", { renderAs: "shape", shapeKind: "rectangle", color: "#FF9EB5" }),
  ],
};

export const numbersTopic: Topic = {
  id: "numbers",
  title: t("מספרים וספירה", "Numbers & Counting"),
  description: t("בואו נספור יחד: אחת, שתיים, שלוש!", "Let's count together: one, two, three!"),
  icon: "🔢",
  theme: "sun",
  ageRange: "2-3",
  activityTypes: ["FIND", "COUNT"],
  vocabulary: [
    v("n1", "אחת", "One", "1️⃣", { value: 1 }),
    v("n2", "שתיים", "Two", "2️⃣", { value: 2 }),
    v("n3", "שלוש", "Three", "3️⃣", { value: 3 }),
    v("n4", "ארבע", "Four", "4️⃣", { value: 4 }),
    v("n5", "חמש", "Five", "5️⃣", { value: 5 }),
  ],
};

export const animalsTopic: Topic = {
  id: "animals",
  title: t("בעלי חיים", "Animals"),
  description: t("איזה חיה אומרת מו?", "Which animal says moo?"),
  icon: "🐶",
  theme: "mint",
  ageRange: "2-3",
  activityTypes: ["FIND", "MATCH", "MEMORY", "SORT"],
  vocabulary: [
    v("dog", "כלב", "Dog", "🐶", { sound: t("האו האו!", "Woof woof!"), group: "pet" }),
    v("cat", "חתול", "Cat", "🐱", { sound: t("מיאו!", "Meow!"), group: "pet" }),
    v("cow", "פרה", "Cow", "🐮", { sound: t("מוווו!", "Moo!"), group: "farm" }),
    v("horse", "סוס", "Horse", "🐴", { sound: t("יהההה!", "Neigh!"), group: "farm" }),
    v("sheep", "כבשה", "Sheep", "🐑", { sound: t("בעעע!", "Baa!"), group: "farm" }),
    v("chicken", "תרנגולת", "Chicken", "🐔", { sound: t("קוקוריקו!", "Cluck cluck!"), group: "farm" }),
    v("duck", "ברווז", "Duck", "🦆", { sound: t("קוואק!", "Quack!"), group: "farm" }),
    v("lion", "אריה", "Lion", "🦁", { sound: t("ראאאר!", "Roar!"), group: "wild" }),
    v("elephant", "פיל", "Elephant", "🐘", { sound: t("פרררר!", "Toot!"), group: "wild" }),
    v("monkey", "קוף", "Monkey", "🐵", { sound: t("הו-הו-הא-הא!", "Ooh ooh ah ah!"), group: "wild" }),
    v("rabbit", "ארנב", "Rabbit", "🐰", { group: "pet" }),
    v("fish", "דג", "Fish", "🐟", { group: "water" }),
  ],
};

export const foodTopic: Topic = {
  id: "food",
  title: t("פירות וירקות", "Fruits & Food"),
  description: t("מה טעים לאכול היום?", "What's tasty to eat today?"),
  icon: "🍎",
  theme: "peach",
  ageRange: "2-3",
  activityTypes: ["FIND", "MATCH", "SORT", "MEMORY"],
  vocabulary: [
    v("apple", "תפוח", "Apple", "🍎", { group: "fruit", color: "#FF5A5F" }),
    v("banana", "בננה", "Banana", "🍌", { group: "fruit", color: "#FFD93D" }),
    v("orangeFruit", "תפוז", "Orange", "🍊", { group: "fruit", color: "#FFA94D" }),
    v("strawberry", "תות", "Strawberry", "🍓", { group: "fruit", color: "#FF5A5F" }),
    v("watermelon", "אבטיח", "Watermelon", "🍉", { group: "fruit", color: "#4ADE80" }),
    v("grapes", "ענבים", "Grapes", "🍇", { group: "fruit", color: "#C4A5FF" }),
    v("carrot", "גזר", "Carrot", "🥕", { group: "veg", color: "#FFA94D" }),
    v("tomato", "עגבנייה", "Tomato", "🍅", { group: "veg", color: "#FF5A5F" }),
    v("cucumber", "מלפפון", "Cucumber", "🥒", { group: "veg", color: "#4ADE80" }),
  ],
};

export const vehiclesTopic: Topic = {
  id: "vehicles",
  title: t("כלי רכב", "Vehicles"),
  description: t("איזה רכב עושה ווווש?", "Which vehicle goes whoosh?"),
  icon: "🚗",
  theme: "sky",
  ageRange: "2-3",
  activityTypes: ["FIND", "MATCH", "SORT", "MEMORY"],
  vocabulary: [
    v("car", "מכונית", "Car", "🚗", { sound: t("וווררום!", "Vroom!"), group: "road" }),
    v("bus", "אוטובוס", "Bus", "🚌", { sound: t("וווררום!", "Vroom!"), group: "road" }),
    v("train", "רכבת", "Train", "🚂", { sound: t("צוק צוק!", "Choo choo!"), group: "rail" }),
    v("airplane", "מטוס", "Airplane", "✈️", { sound: t("ווווש!", "Whoosh!"), group: "air" }),
    v("helicopter", "מסוק", "Helicopter", "🚁", { sound: t("טוק-טוק-טוק!", "Whirr!"), group: "air" }),
    v("bicycle", "אופניים", "Bicycle", "🚲", { sound: t("טרינג טרינג!", "Ring ring!"), group: "road" }),
    v("boat", "סירה", "Boat", "⛵", { sound: t("פלואץ'!", "Splash!"), group: "water" }),
    v("truck", "משאית", "Truck", "🚚", { sound: t("וווררום!", "Vroom!"), group: "road" }),
    v("firetruck", "מכבת אש", "Fire Truck", "🚒", { sound: t("אאווו אאווו!", "Nee-naw!"), group: "emergency" }),
    v("ambulance", "אמבולנס", "Ambulance", "🚑", { sound: t("אאווו אאווו!", "Nee-naw!"), group: "emergency" }),
  ],
};

export const bodyTopic: Topic = {
  id: "body",
  title: t("הגוף שלי", "My Body"),
  description: t("איפה האף שלך?", "Where is your nose?"),
  icon: "👀",
  theme: "lilac",
  ageRange: "2-3",
  activityTypes: ["FIND", "MEMORY"],
  vocabulary: [
    v("eyes", "עיניים", "Eyes", "👀"),
    v("ears", "אוזניים", "Ears", "👂"),
    v("nose", "אף", "Nose", "👃"),
    v("mouth", "פה", "Mouth", "👄"),
    v("hands", "ידיים", "Hands", "🙌"),
    v("feet", "רגליים", "Feet", "🦶"),
    v("head", "ראש", "Head", "🙂"),
    v("tummy", "בטן", "Tummy", "🫃"),
  ],
};

export const emotionsTopic: Topic = {
  id: "emotions",
  title: t("רגשות", "Emotions"),
  description: t("איך ארנבון מרגיש היום?", "How does Bunny feel today?"),
  icon: "😊",
  theme: "sun",
  ageRange: "2-3",
  activityTypes: ["FIND", "MEMORY"],
  vocabulary: [
    v("happy", "שמח", "Happy", "😄"),
    v("sad", "עצוב", "Sad", "😢"),
    v("angry", "כועס", "Angry", "😠"),
    v("surprised", "מופתע", "Surprised", "😲"),
    v("sleepy", "מנומנם", "Sleepy", "😴"),
    v("scared", "מפוחד", "Scared", "😨"),
  ],
};

export const oppositesTopic: Topic = {
  id: "opposites",
  title: t("הפכים", "Opposites"),
  description: t("גדול וקטן, מהר ולאט!", "Big and small, fast and slow!"),
  icon: "⚖️",
  theme: "mint",
  ageRange: "2-3",
  activityTypes: ["FIND"],
  vocabulary: [
    v("big", "גדול", "Big", "🐘", { group: "size" }),
    v("small", "קטן", "Small", "🐭", { group: "size" }),
    v("up", "למעלה", "Up", "⬆️", { group: "direction" }),
    v("down", "למטה", "Down", "⬇️", { group: "direction" }),
    v("hot", "חם", "Hot", "🔥", { group: "temperature" }),
    v("cold", "קר", "Cold", "❄️", { group: "temperature" }),
    v("fast", "מהר", "Fast", "🐆", { group: "speed" }),
    v("slow", "לאט", "Slow", "🐢", { group: "speed" }),
    v("open", "פתוח", "Open", "📖", { group: "state" }),
    v("closed", "סגור", "Closed", "📕", { group: "state" }),
    v("day", "יום", "Day", "☀️", { group: "time" }),
    v("night", "לילה", "Night", "🌙", { group: "time" }),
    v("full", "מלא", "Full", "🥛", { group: "quantity" }),
    v("empty", "ריק", "Empty", "🫗", { group: "quantity" }),
  ],
};

/** A mixed "games" topic that pulls from every other topic for memory/sort mini-games. */
export const gamesTopic: Topic = {
  id: "games",
  title: t("משחקים", "Games"),
  description: t("זיכרון, מיון והתאמה!", "Memory, sorting and matching!"),
  icon: "🧩",
  theme: "lilac",
  ageRange: "2-3",
  activityTypes: ["MEMORY", "MATCH", "SORT"],
  vocabulary: [],
};

export const topics: Topic[] = [
  colorsTopic,
  shapesTopic,
  numbersTopic,
  animalsTopic,
  foodTopic,
  vehiclesTopic,
  bodyTopic,
  emotionsTopic,
  oppositesTopic,
  gamesTopic,
];

export function getTopic(id: string): Topic | undefined {
  return topics.find((topic) => topic.id === id);
}
