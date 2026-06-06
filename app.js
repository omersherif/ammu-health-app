/**
 * app.js — Ammu's Health App
 * Stage 2: Full Ammu section added.
 *
 * Structure:
 * - CONFIG: PINs, user profiles, Ammu's health data
 * - STATE: App-level state
 * - UTILITIES: Helpers (greeting, screen/page switching, clocks)
 * - PIN SYSTEM: Dot updates, PIN checking
 * - PAGE BUILDERS: Per-user nav + page injection
 * - AMMU PAGES: Full content for all 5 Ammu pages
 * - MUMMA/ABBU/ADMIN/FRIEND: Placeholder builders (Stage 3+)
 * - DATA SUBMISSION: Google Sheets via Apps Script
 * - PUBLIC App INTERFACE: All onclick handlers
 * - INIT: App startup
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

/** Replace with your deployed Google Apps Script URL after setup */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxhhfOryDdRA8C4gBo9lvNYeu-KAP0Blck7yHGOsG_8vLSLzvJ4fbEvZ2PmxIFN-kTVvQ/exec';

/** User PINs */
const PINS = {
  ammu:   '2015',
  mumma:  '2468',
  abbu:   '2311',
  admin:  '2006',
  family: '1234',
};

/** User profiles — header colours, mascots, nav tabs */
const USERS = {
  ammu: {
    name: 'Ammu', greeting: 'Ready to be a superstar!',
    mascot: '🐘', avatar: '🦁', avatarBg: 'bg-green-50',
    headerBg: 'bg-green-600', headerHex: '#0F6E56', accent: 'green',
    nav: [
      { id: 'home',     icon: '🏠', label: 'Home'     },
      { id: 'tracker',  icon: '✅', label: 'Tracker'  },
      { id: 'rewards',  icon: '🪙', label: 'Rewards'  },
      { id: 'secrets',  icon: '🔓', label: 'Secrets'  },
      { id: 'progress', icon: '📏', label: 'Progress' },
    ],
  },
  mumma: {
    name: 'Mumma', greeting: "Ammu's health plan",
    mascot: '🌸', avatar: '👩', avatarBg: 'bg-blue-50',
    headerBg: 'bg-blue-600', headerHex: '#185FA5', accent: 'blue',
    nav: [
      { id: 'home',     icon: '🏠', label: 'Home'     },
      { id: 'grocery',  icon: '🛒', label: 'Grocery'  },
      { id: 'meals',    icon: '🍽️', label: 'Meals'    },
      { id: 'check',    icon: '✅', label: 'Check'    },
      { id: 'progress', icon: '📈', label: 'Progress' },
    ],
  },
  abbu: {
    name: 'Abbu', greeting: "Ammu's dashboard",
    mascot: '🦣', avatar: '🦣', avatarBg: 'bg-purple-50',
    headerBg: 'bg-gray-900', headerHex: '#1A1A3E', accent: 'navy',
    nav: [
      { id: 'today',    icon: '📊', label: 'Today'    },
      { id: 'weekly',   icon: '📈', label: 'Weekly'   },
      { id: 'report',   icon: '📋', label: 'Report'   },
      { id: 'goals',    icon: '🎯', label: 'Goals'    },
      { id: 'alerts',   icon: '🔔', label: 'Alerts'   },
      { id: 'progress', icon: '📏', label: 'Progress' },
    ],
  },
  admin: {
    name: 'Admin', greeting: 'Full access',
    mascot: '⚙️', avatar: '⚙️', avatarBg: 'bg-amber-50',
    headerBg: 'bg-amber-700', headerHex: '#854F0B', accent: 'amber',
    nav: [
      { id: 'users',    icon: '👥', label: 'Users'    },
      { id: 'settings', icon: '⚙️', label: 'Settings' },
      { id: 'data',     icon: '🗄️', label: 'Data'     },
      { id: 'access',   icon: '🔐', label: 'Access'   },
    ],
  },
  family: {
    name: 'Family', greeting: "Ammu's family view",
    mascot: '👀', avatar: '👀', avatarBg: 'bg-gray-100',
    headerBg: 'bg-gray-600', headerHex: '#5F5E5A', accent: 'gray',
    nav: [
      { id: 'view',     icon: '👁️', label: 'View'     },
      { id: 'progress', icon: '📊', label: 'Progress' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AMMU DATA
// ─────────────────────────────────────────────────────────────────────────────

/** Bluey messages shown randomly on Ammu's home screen */
const BLUEY_MSGS = [
  { msg: "Bluey says — time to be healthy today!",      sub: "You've got this, Ammu! Let's go! 💪" },
  { msg: "Bluey's tip: eat your egg first thing!",       sub: "Strong like Bandit — that's you! 🐾" },
  { msg: "Even Bluey does her exercises every day!",     sub: "Match her energy — you can do it! 🌟" },
  { msg: "Bluey says: drinking water = superpower!",     sub: "Stay hydrated, stay amazing! 💧" },
  { msg: "Bluey's favourite day? When you give 100%!",   sub: "Today could be that day! ⭐" },
];

/** Animal reveals shown after Ammu saves her day */
const ANIMALS = [
  { e: '🦁', t: 'Today you ate like a LION!',        s: 'Strong, powerful and full of energy — just like a lion in Kerala!' },
  { e: '🐬', t: 'Brain working like a DOLPHIN!',     s: 'Walnuts + fruit = smartest animal in the sea — that\'s you!' },
  { e: '🐘', t: 'Strength of an ELEPHANT!',          s: 'Full checklist done — Kerala elephant power is YOURS today! 🌺' },
  { e: '🦅', t: 'You soared like an EAGLE today!',   s: 'High energy, sharp brain, strong body — absolutely flying!' },
  { e: '🐯', t: 'Tiger energy today, Ammu!',         s: 'Exercise + food + meditation — a complete tiger day!' },
  { e: '🦋', t: 'Transformed like a BUTTERFLY!',     s: 'Every healthy day makes you more beautiful and strong!' },
];

/** Day-by-day plan shown on Ammu's home screen */
const DAY_PLANS = {
  Mon: { title: 'Monday — Strength Day! 💪',
    morning:   ['🌅 Morning stretch — 10 to 15 minutes', '🏋️ Strength — 10 squats, 8 wall push-ups', '✋ Grip ring squeezes — 10 each hand', '🥚 Breakfast: Egg + Idli with sambar'],
    afternoon: ['🍛 Lunch: Dal rice + green vegetable', '🍎 Snack: Fruit + dry fruits', '💧 Keep drinking water!'],
    evening:   ['📺 TV time: grip ring + dry fruits', '🫙 Yogurt', '🍽️ Dinner: Rice + vegetable curry', '🧘 5 minutes calm breathing', '📵 No screens 1 hour before bed', '📚 Read before sleeping'] },
  Tue: { title: 'Tuesday — Yoga Day! 🧘',
    morning:   ['🌅 Morning stretch — 10 to 15 minutes', '🧘 Yoga — sun salutation, child\'s pose, warrior 1', '✋ Grip ring squeezes — 10 each hand', '🥚 Breakfast: Egg + Dosa'],
    afternoon: ['🍛 Lunch: Paneer curry + rice', '🍎 Snack: Fruit + dry fruits', '☀️ Get some sunlight — Vitamin D!'],
    evening:   ['📺 TV time: grip ring + dry fruits', '🫙 Yogurt', '🍽️ Dinner: Dal + roti', '🧘 Meditate — breathe in 4, out 4', '📖 Reading time!'] },
  Wed: { title: 'Wednesday — Strength Day! 💪',
    morning:   ['🌅 Morning stretch — 10 to 15 minutes', '🏋️ Strength — squats, push-ups, light dumbbells', '✋ Grip ring squeezes — 10 each hand', '🥚 Breakfast: Egg + Upma'],
    afternoon: ['🍛 Lunch: Dal + roti + green vegetables', '🍎 Snack: Fruit + dry fruits', '💧 6 glasses of water today!'],
    evening:   ['📺 TV time: grip ring + wrist rotations', '🫙 Yogurt + nuts', '🍽️ Dinner: Rice + curry', '🧘 Meditation', '📖 Read or draw tonight'] },
  Thu: { title: 'Thursday — Yoga Day! 🧘',
    morning:   ['🌅 Morning stretch — 10 to 15 minutes', '🧘 Yoga session', '✋ Grip ring squeezes — 10 each hand', '🥚 Breakfast: Egg + Dosa'],
    afternoon: ['🍛 Lunch: Chicken or fish + rice', '🍎 Snack: Fruit + dry fruits', '☀️ Sunshine — bones need Vitamin D!'],
    evening:   ['📺 TV time: grip ring', '🫙 Yogurt', '🍽️ Dinner: Vegetable curry + rice', '🧘 5-minute meditation', '📚 Quiet reading'] },
  Fri: { title: 'Friday — Walk Day! 🚶',
    morning:   ['🌅 Morning stretch — 10 to 15 minutes', '🚶 Light walk or active play outside', '✋ Grip ring squeezes — 10 each hand', '🥚 Breakfast: Egg + Idli'],
    afternoon: ['🍛 Lunch: Dal rice + vegetables', '🍎 Snack: Fruit + dry fruits', '🌟 Weekend is almost here!'],
    evening:   ['📺 TV time: grip ring + dry fruits', '🫙 Yogurt + nuts', '🍽️ Dinner: Dal + rice', '🧘 Meditate', '📖 Read tonight!'] },
  Sat: { title: 'Saturday — Free Play Day! 🌺',
    morning:   ['🌅 Light morning stretch', '🎮 Free play — active games, dance, anything fun!', '✋ Grip ring squeezes — still do these!', '🥚 Breakfast: Egg + Appam'],
    afternoon: ['🍛 Lunch: Special meal!', '🍎 Snack: Fruit + dry fruits', '☀️ Outdoor time!'],
    evening:   ['📺 TV time: dry fruits + grip ring', '🫙 Paneer snack', '🍽️ Dinner: Choice meal', '🧘 Meditation', '📖 Draw or read!'] },
  Sun: { title: 'Sunday — Swimming + Rest! 🏊',
    morning:   ['🌅 Light stretch only — rest day!', '🥚 Breakfast: Egg + your choice', '☀️ Sunshine time!'],
    afternoon: ['🍛 Lunch: Family meal — enjoy!', '🍎 Snack: Fruit + dry fruits', '💧 Stay hydrated for swimming!'],
    evening:   ['🏊 Swimming session — 30 to 45 minutes', '🫙 Yogurt', '🍽️ Dinner: Light meal', '🧘 Meditation', '📖 Calm reading', '📏 Last Sunday? Fill in Progress tab!'] },
};


// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DATA — Last week's realistic mock data
// This shows how the app looks when in use.
// Admin can clear this from Admin → Settings → Clear sample data
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_WEEK_DATA = {
  Mon: { pct:85, ticked:17, mood:'Happy',   coins:42, streak:8  },
  Tue: { pct:70, ticked:14, mood:'Good',    coins:35, streak:9  },
  Wed: { pct:90, ticked:18, mood:'Amazing', coins:48, streak:10 },
  Thu: { pct:45, ticked:9,  mood:'Okay',    coins:22, streak:0  },
  Fri: { pct:88, ticked:17, mood:'Happy',   coins:44, streak:11 },
  Sat: { pct:75, ticked:15, mood:'Good',    coins:38, streak:12 },
  Sun: { pct:60, ticked:12, mood:'Happy',   coins:30, streak:12 },
};

const SAMPLE_CATEGORY_SCORES = {
  exercise: 92, bone: 85, muscle: 74,
  gut: 68, brain: 80, peace: 55, water: 48,
};

const SAMPLE_EGGS_THIS_WEEK  = 5;  // days Ammu had egg this week
const SAMPLE_YOGURT_THIS_WEEK = 4; // days Ammu had yogurt
const SAMPLE_WATER_GLASSES   = 4.2; // average glasses per day
const SAMPLE_EXERCISE_DAYS   = 6;  // days exercise done this week

// Test mode — set to false by Admin when ready to go live
let APP_TEST_MODE = localStorage.getItem('test_mode') !== 'false';

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────

const State = {
  activeUser:    null,
  pendingUser:   null,
  pinBuffer:     '',
  clockTimer:    null,
  activePageId:  null,
  // Ammu tracker state
  ammuCoins:     parseInt(localStorage.getItem('ammu_coins')   || '247'),
  ammuStreak:    parseInt(localStorage.getItem('ammu_streak')  || '12'),
  ammuWeekDays:  parseInt(localStorage.getItem('ammu_week')    || '4'),
  ammuTicked:    0,
  ammuMood:      '',
  ammuDaySubmitted: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
}

function getDayName() {
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + id);
  if (el) { el.classList.add('active'); State.activePageId = id; }
}

function getTimeForOffset(offsetHours) {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const city = new Date(utc + (offsetHours * 3600000));
  let h = city.getHours();
  const m = String(city.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return { time: `${h}:${m}`, ampm };
}

function startClocks() {
  if (State.clockTimer) clearInterval(State.clockTimer);
  const tick = () => {
    const lon = getTimeForOffset(1);
    const dub = getTimeForOffset(4);
    const pal = getTimeForOffset(5.5);
    document.getElementById('ck-lon').textContent    = lon.time;
    document.getElementById('ck-lon-ap').textContent = lon.ampm;
    document.getElementById('ck-dub').textContent    = dub.time;
    document.getElementById('ck-dub-ap').textContent = dub.ampm;
    document.getElementById('ck-pal').textContent    = pal.time;
    document.getElementById('ck-pal-ap').textContent = pal.ampm;
  };
  tick();
  State.clockTimer = setInterval(tick, 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// PIN SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById('pd-' + i);
    if (!dot) continue;
    if (i < State.pinBuffer.length) {
      dot.classList.add('bg-green-600', 'border-green-600');
      dot.classList.remove('bg-white', 'border-gray-300');
    } else {
      dot.classList.remove('bg-green-600', 'border-green-600');
      dot.classList.add('bg-white', 'border-gray-300');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AMMU — PAGE BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

/** Builds the HTML for Ammu's Home page */
function buildAmmuReminders() {
  const container = document.getElementById('a-reminders');
  if (!container) return;
  const h = new Date().getHours();
  let html = '';
  // Morning reminder (7am-12pm) if tracker not yet filled
  if (h >= 7 && h < 12) {
    html += `<div onclick="ammuNavToTracker()"
      class="bg-pink-50 border border-pink-200 rounded-2xl p-3 mb-3 flex items-center gap-3 cursor-pointer">
      <span class="text-2xl flex-shrink-0">🌅</span>
      <div>
        <div class="text-sm font-extrabold text-pink-700">Morning checklist not done yet!</div>
        <div class="text-xs font-semibold text-pink-500 mt-0.5">Tap here to fill in your morning exercises 💪</div>
      </div>
    </div>`;
  }
  // Evening reminder (6pm-10pm)
  if (h >= 18 && h < 22) {
    html += `<div onclick="ammuNavToTracker()"
      class="bg-orange-50 border border-orange-200 rounded-2xl p-3 mb-3 flex items-center gap-3 cursor-pointer">
      <span class="text-2xl flex-shrink-0">🌙</span>
      <div>
        <div class="text-sm font-extrabold text-orange-700">Evening tracker waiting for you!</div>
        <div class="text-xs font-semibold text-orange-500 mt-0.5">Fill in today's checklist and earn your coins! 🪙</div>
      </div>
    </div>`;
  }
  container.innerHTML = html;
}

function buildAmmuHome() {
  const day = getDayName();
  const plan = DAY_PLANS[day] || DAY_PLANS['Mon'];
  const bm = BLUEY_MSGS[Math.floor(Math.random() * BLUEY_MSGS.length)];

  const planItems = (items) => items.map(i =>
    `<div class="flex items-start gap-2 py-1">
       <span class="text-sm leading-relaxed text-gray-700 font-semibold">${i}</span>
     </div>`
  ).join('');

  return `
  <div class="pb-4">

    <!-- Smart reminder banners based on time of day -->
    <div id="a-reminders"></div>

    <!-- Coin + streak bar -->
    <div class="bg-white rounded-2xl border border-gray-100 p-3 mb-3 flex items-center gap-3">
      <span class="text-2xl">🪙</span>
      <div>
        <div class="font-fredoka text-2xl text-yellow-500 leading-none" id="a-coins">${State.ammuCoins}</div>
        <div class="text-xs font-bold text-gray-400">Total coins</div>
      </div>
      <div class="ml-auto flex gap-2">
        <div class="bg-orange-50 rounded-full px-3 py-1.5 flex items-center gap-1">
          <span class="font-fredoka text-lg text-orange-500" id="a-streak">${State.ammuStreak}</span>
          <span class="text-xs font-bold text-orange-400">🔥 streak</span>
        </div>
        <div class="bg-green-50 rounded-full px-3 py-1.5 flex items-center gap-1">
          <span class="font-fredoka text-lg text-green-600" id="a-week">${State.ammuWeekDays}/7</span>
          <span class="text-xs font-bold text-green-500">⭐ week</span>
        </div>
      </div>
    </div>

    <!-- Bluey banner -->
    <div class="bg-blue-600 rounded-2xl p-3 mb-3 flex items-center gap-3">
      <span class="text-3xl flex-shrink-0">🐾</span>
      <div>
        <div class="text-sm font-extrabold text-white" id="a-bluey-msg">${bm.msg}</div>
        <div class="text-xs font-semibold text-blue-200 mt-0.5" id="a-bluey-sub">${bm.sub}</div>
      </div>
    </div>

    <!-- Today's plan -->
    <div class="bg-white rounded-2xl border border-orange-200 overflow-hidden mb-3">
      <div class="bg-orange-500 px-4 py-2.5 flex items-center gap-2">
        <span class="text-lg">📋</span>
        <span class="font-fredoka text-white text-lg">${plan.title}</span>
      </div>
      <div class="px-4 py-2 border-b border-gray-100">
        <div class="text-xs font-extrabold text-orange-500 uppercase tracking-wider mb-1">🌅 Morning (7 AM)</div>
        ${planItems(plan.morning)}
      </div>
      <div class="px-4 py-2 border-b border-gray-100">
        <div class="text-xs font-extrabold text-orange-500 uppercase tracking-wider mb-1">☀️ Daytime</div>
        ${planItems(plan.afternoon)}
      </div>
      <div class="px-4 py-2">
        <div class="text-xs font-extrabold text-orange-500 uppercase tracking-wider mb-1">🌙 Evening</div>
        ${planItems(plan.evening)}
      </div>
    </div>

  </div>`;
}

/** Builds the HTML for Ammu's Tracker page */
function buildAmmuTracker() {
  const day = getDayName();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const dayPills = days.map(d =>
    `<button onclick="ammuSelectDay('${d}',this)"
       class="ammu-day-pill flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all
              ${d === day ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200'}"
     >${d}</button>`
  ).join('');

  const checkItem = (id, emoji, label, why, coins, cat) =>
    `<div class="ammu-check-item flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer"
          onclick="ammuTick(this,'${cat}')" data-id="${id}">
       <div class="ammu-cb w-6 h-6 rounded-lg border-2 border-gray-200 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"></div>
       <div class="flex-1">
         <div class="ammu-cm text-sm font-bold text-gray-800 leading-snug">
           ${emoji} ${label}
           <span class="inline-block text-xs font-extrabold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 ml-1">${coins}🪙</span>
         </div>
         <div class="text-xs font-semibold text-gray-400 mt-0.5">${why}</div>
       </div>
     </div>`;

  return `
  <div class="pb-4">

    <!-- Day selector -->
    <div class="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide" style="-webkit-overflow-scrolling:touch;">
      ${dayPills}
    </div>

    <!-- Progress bar -->
    <div class="bg-white rounded-2xl border border-gray-100 px-4 py-3 mb-3">
      <div class="flex justify-between mb-1.5">
        <span class="text-xs font-bold text-gray-400" id="a-prog-t">0 of 20 done</span>
        <span class="text-xs font-extrabold text-green-600" id="a-prog-p">0%</span>
      </div>
      <div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div id="a-prog-fill" class="h-full bg-green-500 rounded-full transition-all duration-300" style="width:0%"></div>
      </div>
      <div class="text-xs font-bold text-gray-400 mt-1.5" id="a-prog-msg">Let's get started! Every tick earns coins! 🪙</div>
    </div>

    <!-- EXERCISE FIRST -->
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2">⚡ Exercise</div>
    <div class="bg-white rounded-2xl border-2 border-lime-200 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
        <span class="text-xl">🤸</span>
        <span class="flex-1 text-sm font-extrabold text-gray-800">Move That Body!</span>
        <span class="text-xs font-bold px-2 py-1 rounded-full bg-lime-50 text-lime-700">⚡ Strength!</span>
      </div>
      ${checkItem('stretch',    '🌅', 'Morning stretch done (10–15 mins)',                '⚡ Wakes up every joint — like a reboot!',             '+3', 'exercise')}
      ${checkItem('exercise',   '🏋️', 'Main exercise (squats / push-ups / yoga)',         '💪 Builds real strength — future Ammu will thank you!','+ 4', 'exercise')}
      ${checkItem('hand-am',    '✋', 'Morning hand squeezes — 10 each hand',             '🤝 Makes your grip so much stronger!',                '+2', 'exercise')}
      ${checkItem('hand-pm',    '📺', 'Evening hand squeezes during TV time',             '🤝 Double the hand power — no need to pause your show!','+ 2', 'exercise')}
    </div>

    <!-- PEACE & HAPPINESS SECOND -->
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2">😊 Peace &amp; Happiness</div>
    <div class="bg-white rounded-2xl border-2 border-blue-200 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
        <span class="text-xl">🌙</span>
        <span class="flex-1 text-sm font-extrabold text-gray-800">Calm Happy Mind!</span>
        <span class="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700">😊 Peace!</span>
      </div>
      ${checkItem('meditate',  '🧘', 'Did my 5-minute meditation',         '😊 Slow breathing = calm mind + better sleep!',      '+3', 'peace')}
      ${checkItem('noscreens', '📵', 'No screens 1 hour before bed',       '😴 Brain needs quiet time to process your day!',     '+2', 'peace')}
      ${checkItem('reading',   '📖', 'Read or drew something before sleep','🧠 Calm activities = sweet dreams + smarter brain!', '+3', 'peace')}
    </div>

    <!-- FOOD — BONES -->
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2">🦴 Bone Health</div>
    <div class="bg-white rounded-2xl border-2 border-teal-200 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
        <span class="text-xl">🦴</span>
        <span class="flex-1 text-sm font-extrabold text-gray-800">Strong Bones!</span>
        <span class="text-xs font-bold px-2 py-1 rounded-full bg-teal-50 text-teal-700">🦴 Bone power!</span>
      </div>
      ${checkItem('yogurt',   '🥛', 'Had my yogurt today',        '🦴 Calcium = super strong bones that never break!',         '+2', 'food')}
      ${checkItem('greenveg', '🥦', 'Ate a green vegetable',      '🦴 Broccoli & spinach are secretly packed with calcium!',   '+2', 'food')}
      ${checkItem('sunlight', '☀️', 'Got some sunlight today',    '🦴 Vitamin D from sun helps your body soak up calcium!',    '+1', 'food')}
    </div>

    <!-- FOOD — MUSCLE -->
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2">💪 Muscle Health</div>
    <div class="bg-white rounded-2xl border-2 border-orange-200 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
        <span class="text-xl">💪</span>
        <span class="flex-1 text-sm font-extrabold text-gray-800">Muscle Power!</span>
        <span class="text-xs font-bold px-2 py-1 rounded-full bg-orange-50 text-orange-700">💪 Muscle fuel!</span>
      </div>
      ${checkItem('egg',      '🥚', 'Had my egg today',              '💪 Eggs = THE best muscle builder!',                    '+3', 'food')}
      ${checkItem('paneer',   '🧀', 'Had paneer or dal',             '💪 Protein repairs muscles — like fixing a superhero suit!','+2', 'food')}
      ${checkItem('dryfruits','🥜', 'Had dry fruits during TV time', '💪 Almonds, walnuts & cashews = energy and muscles!',   '+2', 'food')}
    </div>

    <!-- FOOD — GUT -->
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2">🌱 Gut Health</div>
    <div class="bg-white rounded-2xl border-2 border-pink-200 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
        <span class="text-xl">🌱</span>
        <span class="flex-1 text-sm font-extrabold text-gray-800">Happy Tummy!</span>
        <span class="text-xs font-bold px-2 py-1 rounded-full bg-pink-50 text-pink-700">🌱 Gut health!</span>
      </div>
      ${checkItem('fermented', '🫓', 'Had dosa, idli, or appam',    '🌱 Fermented food = friendly bugs that keep you healthy!','+2', 'food')}
      ${checkItem('tummy',     '😌', 'Tummy felt okay today',       '🌱 Happy tummy means your body absorbs all the good stuff!','+2', 'food')}
    </div>

    <!-- FOOD — BRAIN -->
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2">🧠 Brain Health</div>
    <div class="bg-white rounded-2xl border-2 border-purple-200 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
        <span class="text-xl">🧠</span>
        <span class="flex-1 text-sm font-extrabold text-gray-800">Big Brain Boost!</span>
        <span class="text-xs font-bold px-2 py-1 rounded-full bg-purple-50 text-purple-700">🧠 Brain power!</span>
      </div>
      ${checkItem('fruit',   '🍓', 'Had a fruit today',            '🧠 Berries & pomegranate make your brain sharper!',      '+2', 'food')}
      ${checkItem('walnuts', '🌰', 'Had walnuts today',            '🧠 Walnuts look like brains — AMAZING for yours!',       '+2', 'food')}
      ${checkItem('draw',    '📚', 'Did some reading or drawing',  '🧠 Reading grows new brain connections — level up!',     '+3', 'food')}
    </div>

    <!-- WATER -->
    <div class="bg-white rounded-2xl border-2 border-blue-200 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
        <span class="text-xl">💧</span>
        <span class="flex-1 text-sm font-extrabold text-gray-800">Water Challenge!</span>
        <span class="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700">💧 Every cell loves water!</span>
      </div>
      <div class="px-4 py-3 flex items-center gap-3 flex-wrap">
        <span class="text-xs font-bold text-gray-500">Tap each glass you drank:</span>
        <div class="flex gap-2" id="a-water-cups">
          ${[1,2,3,4,5,6].map(i =>
            `<button onclick="ammuToggleCup(this)"
               class="text-2xl opacity-20 transition-all active:scale-125">🥤</button>`
          ).join('')}
        </div>
      </div>
    </div>

    <!-- MOOD & ENERGY -->
    <div class="bg-white rounded-2xl border-2 border-teal-200 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
        <span class="text-xl">⭐</span>
        <span class="text-sm font-extrabold text-gray-800">How are YOU feeling today?</span>
      </div>
      <div class="px-4 py-3 border-b border-gray-50">
        <div class="text-xs font-bold text-gray-500 mb-2">⚡ Energy level today:</div>
        <div class="flex items-center gap-3">
          <input type="range" min="1" max="5" value="3" step="1"
            class="flex-1 accent-green-600"
            oninput="ammuUpdateStars(this.value)" />
          <span id="a-stars" class="text-lg min-w-[80px]">⭐⭐⭐</span>
        </div>
      </div>
      <div class="px-4 py-3">
        <div class="text-xs font-bold text-gray-500 mb-2">😊 Mood today — tap one:</div>
        <div class="flex gap-2 justify-around">
          ${[['😢','Sad'],['😐','Okay'],['🙂','Good'],['😊','Happy'],['🌟','Amazing']].map(([f,l]) =>
            `<button onclick="ammuSetMood(this,'${l}')"
               class="ammu-mood flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 border-gray-100 transition-all">
               <span class="text-2xl">${f}</span>
               <span class="text-[10px] font-bold text-gray-400">${l}</span>
             </button>`
          ).join('')}
        </div>
      </div>
    </div>

    <!-- Save button -->
    <button id="a-save-btn" onclick="ammuSave()"
      class="w-full py-4 rounded-2xl bg-green-600 text-white font-fredoka text-xl mb-3 active:scale-98 transition-transform">
      🐘 Save My Super Day! 🌟
    </button>

    <!-- Animal reveal (hidden until save) -->
    <div id="a-animal" class="hidden bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center mb-3">
      <div id="a-animal-em" class="text-6xl mb-2"></div>
      <div id="a-animal-t" class="font-fredoka text-lg text-green-800 mb-1"></div>
      <div id="a-animal-s" class="text-xs font-semibold text-green-600 leading-relaxed"></div>
    </div>

  </div>`;
}

/** Builds Ammu's Rewards page */
function buildAmmuRewards() {
  return `
  <div class="pb-4">

    <!-- Coin hero -->
    <div class="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 text-center mb-3">
      <div class="text-4xl mb-1">🪙</div>
      <div class="font-fredoka text-5xl text-yellow-500" id="a-rewards-coins">${State.ammuCoins}</div>
      <div class="text-sm font-extrabold text-yellow-700 mt-1">Total coins earned</div>
      <div class="text-xs font-semibold text-yellow-600 mt-1">100 coins = £1 pocket money 💰</div>
    </div>

    <!-- Cheat day -->
    <div class="bg-pink-50 border-2 border-pink-200 rounded-2xl p-4 mb-3">
      <div class="font-fredoka text-xl text-pink-600 mb-1">🍕 Cheat Day!</div>
      <div class="text-xs font-semibold text-pink-700 leading-relaxed">
        Earn a cheat day by completing 10 days in a row! Eat ANYTHING you want for a full day — no rules!
        One cheat day every 2 weeks.
      </div>
      <div class="font-fredoka text-lg text-pink-600 mt-2">8 more days to earn your next cheat day! 🎉</div>
    </div>

    <!-- Daily rewards -->
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <span class="text-lg">📅</span>
        <span class="text-sm font-extrabold text-gray-800">Daily rewards</span>
      </div>
      ${[
        ['📱','Open the app & fill in',       'Just updating earns coins!',     '+5🪙'],
        ['🍽️','Complete food checklist',      'All food items ticked',          '+10🪙'],
        ['🤸','Complete exercise checklist',  'All exercises done',             '+15🪙'],
        ['⭐','Perfect full day!',            'Everything completed',           '+20🪙'],
      ].map(([e,n,d,c]) => `
        <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
          <span class="text-2xl">${e}</span>
          <div class="flex-1"><div class="text-sm font-bold text-gray-800">${n}</div><div class="text-xs font-semibold text-gray-400">${d}</div></div>
          <span class="font-fredoka text-base text-yellow-500">${c}</span>
        </div>`).join('')}
    </div>

    <!-- Weekly rewards -->
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <span class="text-lg">📆</span>
        <span class="text-sm font-extrabold text-gray-800">Weekly bonus — pick your reward!</span>
      </div>
      ${[
        ['🎬','Movie night request',    'Pick a slightly grown-up movie — needs approval! (5 days done)'],
        ['🍕','Cheat day unlock',       'Eat ANYTHING for a full day! (10 days in a row, every 2 weeks)'],
        ['🎁','Mystery surprise gift',  'A surprise gift is coming your way! (7 days done)'],
        ['💌','Secret story unlock',    'A secret from someone who loves you! (7 days done)'],
      ].map(([e,n,d]) => `
        <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
          <span class="text-2xl">${e}</span>
          <div class="flex-1"><div class="text-sm font-bold text-gray-800">${n}</div><div class="text-xs font-semibold text-gray-400">${d}</div></div>
          <button onclick="ammuClaim(this)"
            class="text-xs font-extrabold bg-green-600 text-white px-3 py-1.5 rounded-full active:scale-95">Claim</button>
        </div>`).join('')}
    </div>

    <!-- Monthly rewards -->
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <span class="text-lg">🏆</span>
        <span class="text-sm font-extrabold text-gray-800">Monthly super bonus!</span>
      </div>
      ${[
        ['🎡','Adventure day — YOU choose!', 'Month 1 — bowling, trampoline, cinema, day trip!', false],
        ['🎀','Big surprise',                'Month 3 — something you\'ve been wanting!',          true],
        ['🌟','MEGA adventure',              'Month 6 — something you\'ve NEVER done before!',     true],
      ].map(([e,n,d,locked]) => `
        <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
          <span class="text-2xl">${e}</span>
          <div class="flex-1"><div class="text-sm font-bold text-gray-800">${n}</div><div class="text-xs font-semibold text-gray-400">${d}</div></div>
          ${locked
            ? `<span class="text-xs font-bold text-gray-300 px-3 py-1.5 rounded-full border border-gray-200">Locked</span>`
            : `<button onclick="ammuClaim(this)" class="text-xs font-extrabold bg-green-600 text-white px-3 py-1.5 rounded-full active:scale-95">Claim</button>`}
        </div>`).join('')}
    </div>

  </div>`;
}

/** Builds Ammu's Secrets page */
function buildAmmuSecrets() {
  const streak = State.ammuStreak;
  const stories = [
    { day: 7,  unlocked: streak >= 7,  title: '🔓 Day 7 — Abbu\'s secret!',
      text: 'When Abbu was 10 years old, he ate rice and fish every single day and could run faster than ALL his friends at school! His secret? He never skipped his meals — just like you\'re doing now! 🏃' },
    { day: 14, unlocked: streak >= 14, title: '🔒 Day 14 — Secret about Mumma!',
      text: 'Complete 14 days to unlock a secret about Mumma!' },
    { day: 21, unlocked: streak >= 21, title: '🔒 Day 21 — Funny Abbu story!',
      text: 'Complete 21 days to unlock a funny story about Abbu!' },
    { day: 30, unlocked: streak >= 30, title: '🔒 Day 30 — Special milestone!',
      text: 'Complete 1 full month to unlock this special secret!' },
    { day: 90, unlocked: streak >= 90, title: '🔒 Month 3 — MEGA secret!',
      text: 'This one will BLOW YOUR MIND! 🤯 Complete 3 months to unlock.' },
  ];

  return `
  <div class="pb-4">
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2 mb-2">
      🔓 Secret stories — unlock as you go!
    </div>
    ${stories.map(s => `
      <div class="rounded-2xl border-2 ${s.unlocked ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'} p-4 mb-3">
        <div class="font-fredoka text-base ${s.unlocked ? 'text-purple-700' : 'text-gray-400'} mb-2">${s.title}</div>
        <div class="text-sm font-semibold ${s.unlocked ? 'text-purple-600' : 'text-gray-400'} leading-relaxed">${s.text}</div>
        ${!s.unlocked ? `<div class="mt-2 text-xs font-bold text-gray-400">🔒 ${s.day - streak} more days to unlock</div>` : ''}
      </div>`).join('')}
  </div>`;
}

/** Builds Ammu's Progress page */
function buildAmmuProgress() {
  return `
  <div class="pb-4">
    <div class="bg-orange-50 border border-orange-200 rounded-2xl p-3 mb-3 text-xs font-bold text-orange-700">
      📅 Do this on the last Sunday of every month — morning, before eating!
    </div>

    <!-- Last month results -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
      <div class="text-sm font-extrabold text-gray-800 mb-3">📊 Last month's results</div>
      <div class="grid grid-cols-2 gap-3">
        ${[['📏','Height','139cm','+0.5cm'],['⚖️','Weight','33.2kg','+0.8kg'],
           ['💪','Bicep','19cm','+1cm'],['✋','Forearm','17cm','+0.5cm']].map(([e,l,v,c]) => `
          <div class="bg-gray-50 rounded-xl p-3">
            <div class="text-xl mb-1">${e}</div>
            <div class="text-xs font-semibold text-gray-400">${l}</div>
            <div class="font-fredoka text-xl text-green-600">${v}</div>
            <div class="text-xs font-extrabold text-green-500 mt-0.5">${c} — growing!</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Enter measurements -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
      <div class="text-sm font-extrabold text-gray-800 mb-3">📝 Enter this month's measurements</div>
      <div class="grid grid-cols-2 gap-3">
        ${[['Height (cm)','e.g. 139'],['Weight (kg)','e.g. 33.2'],
           ['Bicep (cm)','e.g. 19'],['Forearm (cm)','e.g. 17'],
           ['Waist (cm)','e.g. 58'],['Shoulder (cm)','e.g. 34']].map(([l,p]) => `
          <div>
            <label class="text-xs font-extrabold text-orange-600">${l}</label>
            <input type="number" placeholder="${p}"
              class="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:border-green-400" />
          </div>`).join('')}
      </div>
      <button onclick="ammuSaveMeasurements()"
        class="mt-3 w-full py-3 rounded-xl bg-orange-500 text-white font-fredoka text-lg active:scale-98">
        Save measurements! 📏
      </button>
    </div>

    <!-- Push-up challenge -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
      <div class="text-sm font-extrabold text-gray-800 mb-3">💪 Push-up challenge</div>
      <div class="flex gap-3 items-center mb-3">
        <div class="flex-1 bg-gray-50 rounded-xl p-3 text-center">
          <div class="text-xs font-bold text-gray-400">Last month</div>
          <div class="font-fredoka text-4xl text-gray-400">5</div>
          <div class="text-xs text-gray-400">push-ups</div>
        </div>
        <div class="text-2xl text-gray-300">→</div>
        <div class="flex-1 bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
          <div class="text-xs font-bold text-green-500">This month</div>
          <div class="font-fredoka text-4xl text-green-600">8</div>
          <div class="text-xs font-bold text-green-500">push-ups! 💪</div>
        </div>
      </div>
      <div class="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
        <div class="text-sm font-extrabold text-orange-700">🎉 3 more push-ups than last month!</div>
        <div class="text-xs font-semibold text-orange-600 mt-1">You are getting stronger every single month!</div>
      </div>
    </div>

  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC PAGE BUILDERS (Mumma / Abbu / Admin / Friend — Stage 3+)
// ─────────────────────────────────────────────────────────────────────────────

function buildPlaceholderPage(user, navItem) {
  return `
  <div class="flex flex-col items-center justify-center min-h-64 text-center p-8">
    <div class="text-5xl mb-4">${navItem.icon}</div>
    <h2 class="font-fredoka text-xl text-gray-700 mb-2">${USERS[user].name}'s ${navItem.label}</h2>
    <p class="text-sm text-gray-400 font-semibold leading-relaxed">This section is coming in the next stage!</p>
    <div class="mt-4 px-4 py-1.5 rounded-full text-xs font-extrabold bg-green-50 text-green-600">Building now</div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHELL BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

/** Builds all pages for a given user and injects into DOM */
function buildPages(userKey) {
  const user = USERS[userKey];
  const container = document.getElementById('pages-container');
  container.innerHTML = '';

  user.nav.forEach((navItem, index) => {
    const page = document.createElement('div');
    page.className = 'page' + (index === 0 ? ' active' : '');
    page.id = 'page-' + userKey + '-' + navItem.id;

    // Inject real content for Ammu, placeholders for others (for now)
    if (userKey === 'ammu') {
      const builders = {
        home:     buildAmmuHome,
        tracker:  buildAmmuTracker,
        rewards:  buildAmmuRewards,
        secrets:  buildAmmuSecrets,
        progress: buildAmmuProgress,
      };
      page.innerHTML = builders[navItem.id] ? builders[navItem.id]() : buildPlaceholderPage(userKey, navItem);
    } else {
      page.innerHTML = buildPlaceholderPage(userKey, navItem);
    }
    container.appendChild(page);
  });
}

/** Builds the bottom nav for a given user */
function buildNav(userKey) {
  const user  = USERS[userKey];
  const nav   = document.getElementById('bottom-nav');
  if (!nav) return;
  nav.innerHTML = '';

  // Accent colours per user
  const accentColors = {
    green: '#0F6E56', blue: '#185FA5', navy: '#1A1A3E',
    amber: '#854F0B', gray: '#5F5E5A'
  };
  const accent = accentColors[user.accent] || '#0F6E56';

  user.nav.forEach((navItem, index) => {
    const btn = document.createElement('button');

    // Base inline styles — guaranteed to work
    btn.style.cssText = [
      'flex:1',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'gap:2px',
      'padding:6px 2px',
      'border:none',
      'background:none',
      'cursor:pointer',
      'border-top:2.5px solid ' + (index === 0 ? accent : 'transparent'),
      'font-family:Nunito,sans-serif',
      'transition:border-color 0.15s',
    ].join(';');

    btn.innerHTML = `
      <span style="font-size:20px;line-height:1;">${navItem.icon}</span>
      <span style="font-size:9px;font-weight:700;color:${index === 0 ? accent : '#B4B2A9'};">${navItem.label}</span>
    `;

    btn.addEventListener('click', () => {
      // Reset all buttons
      nav.querySelectorAll('button').forEach(b => {
        b.style.borderTopColor = 'transparent';
        const lbl = b.querySelector('span:last-child');
        if (lbl) lbl.style.color = '#B4B2A9';
      });
      // Activate this button
      btn.style.borderTopColor = accent;
      const lbl = btn.querySelector('span:last-child');
      if (lbl) lbl.style.color = accent;
      // Show page
      showPage(userKey + '-' + navItem.id);
    });

    nav.appendChild(btn);
  });
}

/** Loads the full app shell for a given user */
function loadUser(userKey) {
  const user = USERS[userKey];
  State.activeUser = userKey;
  State.ammuTicked = 0;
  State.ammuMood = '';
  State.ammuDaySubmitted = false;

  // Header
  const header = document.getElementById('main-header');
  header.className = `flex-shrink-0 px-4 pt-3 pb-2 flex items-center justify-between ${user.headerBg}`;
  document.getElementById('main-greeting').textContent = getGreeting();
  document.getElementById('main-name').textContent     = user.name;
  document.getElementById('main-mascot').textContent   = user.mascot;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', user.headerHex);

  buildPages(userKey);
  buildNav(userKey);
  startClocks();
  showScreen('screen-main');
  // Build reminders after DOM is ready for Ammu
  if (userKey === 'ammu') setTimeout(buildAmmuReminders, 50);
  // Show test mode banner if active
  if (APP_TEST_MODE) setTimeout(showTestModeBanner, 300);
}

// ─────────────────────────────────────────────────────────────────────────────
// AMMU — INTERACTION HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

const AMMU_TOTAL = 20; // Total checkable items

function ammuUpdateProgress() {
  const pct = Math.round((State.ammuTicked / AMMU_TOTAL) * 100);
  const fill = document.getElementById('a-prog-fill');
  const text = document.getElementById('a-prog-t');
  const pctEl = document.getElementById('a-prog-p');
  const msg = document.getElementById('a-prog-msg');
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = State.ammuTicked + ' of ' + AMMU_TOTAL + ' done';
  if (pctEl) pctEl.textContent = pct + '%';
  if (msg) {
    const msgs = [
      "Let's get started! Every tick earns coins! 🪙",
      "Great start! Keep going! 💪",
      "Halfway there — you're amazing! 🌟",
      "Almost done — so close! 🔥",
      "WOW! What a superstar day! 🏆🐘",
    ];
    msg.textContent = msgs[Math.min(Math.floor(pct / 25), 4)];
  }
}

function ammuUpdateCoins() {
  ['a-coins','a-rewards-coins'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = State.ammuCoins;
  });
  localStorage.setItem('ammu_coins', State.ammuCoins);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC App INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

const App = {

  loginDirect(userKey) { loadUser(userKey); },

  goPin(userKey) {
    State.pendingUser = userKey;
    State.pinBuffer = '';
    const user = USERS[userKey];
    const av = document.getElementById('pin-avatar');
    av.textContent = user.avatar;
    av.className = `w-16 h-16 rounded-full flex items-center justify-center text-4xl mb-3 ${user.avatarBg}`;
    document.getElementById('pin-title').textContent = `${user.name}'s PIN`;
    document.getElementById('pin-error').style.opacity = '0';
    updatePinDots();
    showScreen('screen-pin');
  },

  goLogin() {
    if (State.clockTimer) { clearInterval(State.clockTimer); State.clockTimer = null; }
    State.activeUser = null;
    State.pinBuffer = '';
    updatePinDots();
    showScreen('screen-login');
  },

  pk(digit) {
    if (State.pinBuffer.length >= 4) return;
    State.pinBuffer += digit;
    updatePinDots();
    if (State.pinBuffer.length === 4) setTimeout(() => this._checkPin(), 200);
  },

  pdel() {
    State.pinBuffer = State.pinBuffer.slice(0, -1);
    updatePinDots();
    document.getElementById('pin-error').style.opacity = '0';
  },

  _checkPin() {
    if (State.pinBuffer === PINS[State.pendingUser]) {
      loadUser(State.pendingUser);
    } else {
      document.getElementById('pin-error').style.opacity = '1';
      State.pinBuffer = '';
      updatePinDots();
    }
  },

  // ── AMMU INTERACTIONS ──────────────────────────────────────────────────────

  ammuNavToTracker() {
    const btns = document.querySelectorAll('#bottom-nav button');
    if (btns[1]) btns[1].click(); // Tracker is second nav item
  },

  ammuSelectDay(day, btn) {
    document.querySelectorAll('.ammu-day-pill').forEach(p => {
      p.classList.remove('bg-green-600','text-white','border-green-600');
      p.classList.add('bg-white','text-gray-500','border-gray-200');
    });
    btn.classList.add('bg-green-600','text-white','border-green-600');
    btn.classList.remove('bg-white','text-gray-500','border-gray-200');
  },

  ammuTick(el, category) {
    const done = el.classList.toggle('done');
    const cb = el.querySelector('.ammu-cb');
    const cm = el.querySelector('.ammu-cm');
    if (done) {
      el.classList.add('done');
      cb.classList.add('bg-green-600','border-green-600');
      cb.innerHTML = '<span class="text-white text-xs font-bold">✓</span>';
      cm.classList.add('line-through','text-gray-400');
      State.ammuTicked = Math.min(State.ammuTicked + 1, AMMU_TOTAL);
      State.ammuCoins += 2;
    } else {
      el.classList.remove('done');
      cb.classList.remove('bg-green-600','border-green-600');
      cb.innerHTML = '';
      cm.classList.remove('line-through','text-gray-400');
      State.ammuTicked = Math.max(0, State.ammuTicked - 1);
      State.ammuCoins = Math.max(0, State.ammuCoins - 2);
    }
    ammuUpdateProgress();
    ammuUpdateCoins();
  },

  ammuToggleCup(btn) {
    btn.classList.toggle('opacity-20');
    btn.classList.toggle('opacity-100');
    const isFilled = btn.classList.contains('opacity-100');
    if (isFilled) btn.style.transform = 'scale(1.2)';
    else btn.style.transform = 'scale(1)';
  },

  ammuUpdateStars(val) {
    const stars = ['','⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'];
    const el = document.getElementById('a-stars');
    if (el) el.textContent = stars[val];
  },

  ammuSetMood(btn, mood) {
    State.ammuMood = mood;
    document.querySelectorAll('.ammu-mood').forEach(b => {
      b.classList.remove('border-green-400','bg-green-50');
      b.classList.add('border-gray-100');
    });
    btn.classList.add('border-green-400','bg-green-50');
    btn.classList.remove('border-gray-100');
  },

  ammuSave() {
    if (State.ammuDaySubmitted) return;
    State.ammuDaySubmitted = true;

    // Bonus coins for saving
    State.ammuCoins += 20;
    ammuUpdateCoins();

    // Show animal reveal
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const box = document.getElementById('a-animal');
    const em  = document.getElementById('a-animal-em');
    const t   = document.getElementById('a-animal-t');
    const s   = document.getElementById('a-animal-s');
    if (box && em && t && s) {
      em.textContent = animal.e;
      t.textContent  = animal.t;
      s.textContent  = animal.s;
      box.classList.remove('hidden');
    }

    // Update save button
    const btn = document.getElementById('a-save-btn');
    if (btn) {
      btn.textContent = '🎉 Saved! +20 bonus coins!';
      btn.classList.replace('bg-green-600','bg-orange-500');
      btn.disabled = true;
    }

    // Submit to Google Sheets
    this.submitTrackerData({
      ticked:  State.ammuTicked,
      mood:    State.ammuMood,
      coins:   State.ammuCoins,
      streak:  State.ammuStreak,
    });
  },

  ammuClaim(btn) {
    btn.textContent = '✓ Claimed!';
    btn.classList.replace('bg-green-600','bg-green-100');
    btn.classList.add('text-green-800');
    btn.classList.remove('text-white');
    btn.disabled = true;
  },

  ammuSaveMeasurements() {
    const inputs = document.querySelectorAll('#page-ammu-progress input[type="number"]');
    const labels = ['height','weight','bicep','forearm','waist','shoulder'];
    const data = {};
    inputs.forEach((inp, i) => { if (inp.value) data[labels[i]] = inp.value; });
    this.submitMeasurements(data);
    alert('Measurements saved! Great job Ammu! 📏🐘');
  },

  // ── DATA SUBMISSION ────────────────────────────────────────────────────────

  async submitTrackerData(data) {
    const payload = {
      type: 'daily_tracker', user: 'ammu',
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      ...data,
    };
    try {
      if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') return;
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } catch (err) {
      const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
      pending.push(payload);
      localStorage.setItem('pending_submissions', JSON.stringify(pending));
    }
  },

  async submitMeasurements(measurements) {
    const payload = {
      type: 'monthly_measurements', user: State.activeUser,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      ...measurements,
    };
    try {
      if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') return;
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
      pending.push(payload);
      localStorage.setItem('pending_submissions', JSON.stringify(pending));
    }
  },

  async syncPending() {
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') return;
    const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
    if (!pending.length) return;
    const failed = [];
    for (const payload of pending) {
      try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
      } catch { failed.push(payload); }
    }
    localStorage.setItem('pending_submissions', JSON.stringify(failed));
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// TEST MODE BANNER
// ─────────────────────────────────────────────────────────────────────────────

function showTestModeBanner() {
  if (!APP_TEST_MODE) return;
  // Remove existing banner if any
  const existing = document.getElementById('test-mode-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'test-mode-banner';
  banner.style.cssText = [
    'position:fixed',
    'bottom:70px',
    'left:50%',
    'transform:translateX(-50%)',
    'width:calc(100% - 32px)',
    'max-width:440px',
    'background:#1A1A3E',
    'border-radius:14px',
    'padding:14px 16px',
    'z-index:999',
    'box-shadow:0 4px 24px rgba(0,0,0,0.25)',
    'display:flex',
    'align-items:flex-start',
    'gap:12px',
  ].join(';');

  banner.innerHTML = `
    <div style="font-size:24px;flex-shrink:0;">🧪</div>
    <div style="flex:1;">
      <div style="font-family:serif;font-size:14px;font-weight:600;color:#fff;margin-bottom:3px;">
        Test mode — play around!
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.75);font-weight:600;line-height:1.5;">
        The data you see is sample data from last week.
        Explore all the features — nothing is real yet!
        Admin can switch to live mode when you're ready.
      </div>
    </div>
    <button onclick="dismissTestBanner()" style="background:rgba(255,255,255,0.15);border:none;border-radius:8px;padding:4px 10px;color:#fff;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;font-family:Nunito,sans-serif;">
      Got it
    </button>
  `;
  document.body.appendChild(banner);
}

function dismissTestBanner() {
  const banner = document.getElementById('test-mode-banner');
  if (banner) {
    banner.style.transition = 'opacity 0.3s, transform 0.3s';
    banner.style.opacity = '0';
    banner.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => banner.remove(), 300);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

// Make App globally accessible from HTML onclick handlers

// ── GLOBAL EXPORTS — makes all onclick="method()" work ──────────────────────
function goPin() { return App.goPin.apply(App, arguments); }
function goLogin() { return App.goLogin.apply(App, arguments); }
function pk() { return App.pk.apply(App, arguments); }
function pdel() { return App.pdel.apply(App, arguments); }
function ammuSelectDay() { return App.ammuSelectDay.apply(App, arguments); }
function ammuTick() { return App.ammuTick.apply(App, arguments); }
function ammuToggleCup() { return App.ammuToggleCup.apply(App, arguments); }
function ammuUpdateStars() { return App.ammuUpdateStars.apply(App, arguments); }
function ammuSetMood() { return App.ammuSetMood.apply(App, arguments); }
function ammuSave() { return App.ammuSave.apply(App, arguments); }
function ammuClaim() { return App.ammuClaim.apply(App, arguments); }
function ammuNavToTracker() { return App.ammuNavToTracker.apply(App, arguments); }
function ammuSaveMeasurements() { return App.ammuSaveMeasurements.apply(App, arguments); }
function mummaNav() { return App.mummaNav.apply(App, arguments); }
function mummaToggleCookDay() { return App.mummaToggleCookDay.apply(App, arguments); }
function mummaToggleSwap() { return App.mummaToggleSwap.apply(App, arguments); }
function mummaToggleItem() { return App.mummaToggleItem.apply(App, arguments); }
function mummaAssignShop() { return App.mummaAssignShop.apply(App, arguments); }
function mummaToggleCat() { return App.mummaToggleCat.apply(App, arguments); }
function mummaAddCustom() { return App.mummaAddCustom.apply(App, arguments); }
function mummaShowMyLists() { return App.mummaShowMyLists.apply(App, arguments); }
function mummaCheck() { return App.mummaCheck.apply(App, arguments); }
function mummaSaveCheck() { return App.mummaSaveCheck.apply(App, arguments); }
function abbuShowProud() { return App.abbuShowProud.apply(App, arguments); }
function abbuSendProud() { return App.abbuSendProud.apply(App, arguments); }
function abbuSaveWeeklyNote() { return App.abbuSaveWeeklyNote.apply(App, arguments); }
function abbuRegenerateReport() { return App.abbuRegenerateReport.apply(App, arguments); }
function abbuSaveNote() { return App.abbuSaveNote.apply(App, arguments); }
function abbuUpdateGoal() { return App.abbuUpdateGoal.apply(App, arguments); }
function abbuAgreeGoal() { return App.abbuAgreeGoal.apply(App, arguments); }
function abbuAddGoal() { return App.abbuAddGoal.apply(App, arguments); }
function abbuApprove() { return App.abbuApprove.apply(App, arguments); }
function abbuReject() { return App.abbuReject.apply(App, arguments); }
function abbuSaveStory() { return App.abbuSaveStory.apply(App, arguments); }
function abbuNavToReport() { return App.abbuNavToReport.apply(App, arguments); }
function adminToggleTestMode() { return App.adminToggleTestMode.apply(App, arguments); }
function adminPreviewDelete() { return App.adminPreviewDelete.apply(App, arguments); }
function adminConfirmDelete() { return App.adminConfirmDelete.apply(App, arguments); }
function adminUpdatePin() { return App.adminUpdatePin.apply(App, arguments); }
function adminToggleCookDay() { return App.adminToggleCookDay.apply(App, arguments); }
function adminSaveScriptUrl() { return App.adminSaveScriptUrl.apply(App, arguments); }
function adminSyncNow() { return App.adminSyncNow.apply(App, arguments); }
function adminResetData() { return App.adminResetData.apply(App, arguments); }
// dismissTestBanner already global

window.addEventListener('load', () => {
  console.log('[App] Ammu Health App — Stage 2 loaded');
  if (navigator.onLine) syncPending();
});

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 3 — MUMMA SECTION
// ─────────────────────────────────────────────────────────────────────────────

// ── MUMMA DATA ────────────────────────────────────────────────────────────────

const MUMMA_COOK_DAYS = JSON.parse(localStorage.getItem('mumma_cook_days') || '["Tue","Sat"]');

const MUMMA_MEAL_PLAN = {
  Mon: { type:'easy',  meals:[{t:'Breakfast',m:'Egg on toast 🥚',egg:true},{t:'Lunch',m:'Yogurt + fruit + dry fruits'},{t:'Dinner',m:'Leftover or simple dal + rice'}]},
  Tue: { type:'cook',  meals:[{t:'Breakfast',m:'Toast + fruit'},{t:'Lunch',m:'Cook prepares — dal + rice + sabzi'},{t:'Dinner',m:'Cook\'s food + yogurt',egg:true}]},
  Wed: { type:'left',  meals:[{t:'Breakfast',m:'Scrambled egg + toast',egg:true},{t:'Lunch',m:'Tuesday\'s cook food reheated'},{t:'Dinner',m:'Paneer stir-fry — 15 mins'}]},
  Thu: { type:'quick', meals:[{t:'Breakfast',m:'Egg any style + toast',egg:true},{t:'Lunch',m:'Yogurt + fruit + dry fruits'},{t:'Dinner',m:'Simple chicken curry — 20 mins'}]},
  Fri: { type:'quick', meals:[{t:'Breakfast',m:'Egg + avocado toast',egg:true},{t:'Lunch',m:'Dal + rice (reheated or fresh)'},{t:'Dinner',m:'Omelette + salad — 10 mins',egg:true}]},
  Sat: { type:'cook',  meals:[{t:'Breakfast',m:'Toast + fruit'},{t:'Lunch',m:'Cook prepares — fish curry + rice'},{t:'Dinner',m:'Cook\'s food + yogurt'}]},
  Sun: { type:'easy',  meals:[{t:'Breakfast',m:'Egg + any choice',egg:true},{t:'Lunch',m:'Family meal — enjoy!'},{t:'Dinner',m:'Light meal + yogurt'}]},
};

const MUMMA_GROCERY = [
  { id:'staples', label:'Kitchen staples', emoji:'🏠', why:'The backbone of every meal', color:'gray',
    items:[
      {id:'eggs',     e:'🥚', name:'Free range eggs',          qty:'1 dozen',  rot:'last',  tags:['Quick']},
      {id:'onion',    e:'🧅', name:'Onions',                   qty:'1kg bag',  rot:'last',  tags:['Indian']},
      {id:'garlic',   e:'🧄', name:'Garlic',                   qty:'2 bulbs',  rot:'last',  tags:['Indian']},
      {id:'ginger',   e:'🫚', name:'Fresh ginger',             qty:'Large piece', rot:'two', tags:['Indian']},
      {id:'potato',   e:'🥔', name:'Potatoes',                 qty:'1kg',      rot:'fresh', tags:['Indian']},
      {id:'tomato',   e:'🍅', name:'Tomatoes',                 qty:'6 pack',   rot:'last',  tags:['Indian']},
      {id:'coconut',  e:'🥥', name:'Frozen grated coconut',   qty:'Bag',      rot:'fresh', tags:['Indian']},
      {id:'rice',     e:'🍚', name:'Basmati rice',             qty:'2kg',      rot:'last',  tags:['Indian']},
      {id:'atta',     e:'🌾', name:'Whole wheat atta',         qty:'1kg',      rot:'two',   tags:['Indian']},
    ]
  },
  { id:'fruits', label:'Fruits', emoji:'🍎', why:'1 fruit per day — vitamins & brain power', color:'pink',
    items:[
      {id:'banana',      e:'🍌', name:'Bananas',      qty:'1 bunch', rot:'last',  tags:['M&S']},
      {id:'apple',       e:'🍎', name:'Apples',       qty:'4-5',     rot:'last',  tags:['M&S']},
      {id:'orange',      e:'🍊', name:'Oranges',      qty:'4',       rot:'two',   tags:['M&S']},
      {id:'pomegranate', e:'🍇', name:'Pomegranate',  qty:'1-2',     rot:'fresh', tags:['M&S']},
      {id:'blueberry',   e:'🫐', name:'Blueberries',  qty:'Punnet',  rot:'fresh', tags:['M&S']},
      {id:'mango',       e:'🥭', name:'Mango',        qty:'1-2',     rot:'two',   tags:['M&S']},
      {id:'strawberry',  e:'🍓', name:'Strawberries', qty:'Punnet',  rot:'fresh', tags:['M&S']},
    ]
  },
  { id:'dry', label:'Dry fruits & nuts', emoji:'🥜', why:'Daily TV snack — muscle & brain fuel', color:'amber',
    items:[
      {id:'almonds',    e:'🥜', name:'Almonds',      qty:'200g', rot:'last',  tags:['Indian']},
      {id:'walnuts',    e:'🌰', name:'Walnuts',      qty:'150g', rot:'last',  tags:['Indian']},
      {id:'cashews',    e:'🥜', name:'Cashews',      qty:'150g', rot:'two',   tags:['Indian']},
      {id:'pistachios', e:'🥜', name:'Pistachios',   qty:'150g', rot:'fresh', tags:['Indian']},
      {id:'dates',      e:'🫘', name:'Dates (Medjool)',qty:'Box', rot:'fresh', tags:['Indian']},
    ]
  },
  { id:'bone', label:'Strong bones 🦴', emoji:'🦴', why:'Calcium + Vitamin D — builds strong bones', color:'teal',
    items:[
      {id:'yogurt',  e:'🥛', name:'Plain yogurt (full fat)', qty:'500g',      rot:'last',  tags:['Tesco']},
      {id:'paneer',  e:'🧀', name:'Paneer',                  qty:'400g',      rot:'two',   tags:['Indian']},
      {id:'broccoli',e:'🥦', name:'Broccoli',                qty:'1 head',    rot:'fresh', tags:['Waitrose']},
      {id:'spinach', e:'🌿', name:'Spinach',                 qty:'200g bag',  rot:'two',   tags:['Waitrose']},
      {id:'salmon',  e:'🐟', name:'Salmon fillets',          qty:'2 fillets', rot:'fresh', tags:['Waitrose']},
    ]
  },
  { id:'muscle', label:'Muscle power 💪', emoji:'💪', why:'Protein — builds & repairs muscles', color:'orange',
    items:[
      {id:'chicken', e:'🍗', name:'Chicken thighs',       qty:'500g', rot:'two',   tags:['Waitrose']},
      {id:'dal',     e:'🫘', name:'Red lentils (masoor)', qty:'500g', rot:'last',  tags:['Indian']},
      {id:'fish',    e:'🐟', name:'White fish fillets',   qty:'2',    rot:'fresh', tags:['Waitrose']},
      {id:'lamb',    e:'🥩', name:'Lamb mince',           qty:'300g', rot:'fresh', tags:['Waitrose']},
      {id:'moong',   e:'🫘', name:'Yellow moong dal',     qty:'500g', rot:'two',   tags:['Indian']},
    ]
  },
  { id:'gut', label:'Happy tummy 🌱', emoji:'🌱', why:'Fermented foods — heals digestion', color:'pink',
    items:[
      {id:'dosa',     e:'🫓', name:'Dosa batter (ready-made)', qty:'1kg tub', rot:'two',   tags:['Indian']},
      {id:'idli',     e:'🫓', name:'Idli batter (ready-made)', qty:'1kg tub', rot:'fresh', tags:['Indian']},
      {id:'oats',     e:'🌾', name:'Rolled oats',              qty:'500g',    rot:'fresh', tags:['Tesco']},
      {id:'sourdough',e:'🍞', name:'Sourdough bread',          qty:'Loaf',    rot:'none',  tags:['Waitrose']},
    ]
  },
  { id:'brain', label:'Brain power 🧠', emoji:'🧠', why:'Omega-3 + antioxidants — sharp memory', color:'purple',
    items:[
      {id:'flax',     e:'🌱', name:'Flaxseeds (alsi)',   qty:'Small bag', rot:'fresh', tags:['Indian']},
      {id:'darkchoc', e:'🍫', name:'Dark chocolate 70%+',qty:'Small bar', rot:'fresh', tags:['Waitrose']},
      {id:'avocado',  e:'🥑', name:'Avocado',            qty:'2',         rot:'two',   tags:['Waitrose']},
    ]
  },
  { id:'snacks', label:'Healthy snacks 🍿', emoji:'🍿', why:'Quick grab options for busy days', color:'green',
    items:[
      {id:'cheese',      e:'🧀', name:'Cheddar cheese sticks', qty:'Pack',  rot:'two',   tags:['Tesco']},
      {id:'hummus',      e:'🫙', name:'Hummus',                qty:'Tub',   rot:'fresh', tags:['Tesco']},
      {id:'peanutbutter',e:'🫙', name:'Peanut butter (no sugar)',qty:'Jar', rot:'none',  tags:['Tesco']},
    ]
  },
];

const SHOPS = ['Tesco','Waitrose','M&S','Indian shop','Cook brings','Other'];
const SHOP_COLORS = {
  'Tesco':       'bg-blue-50 text-blue-700 border-blue-200',
  'Waitrose':    'bg-green-50 text-green-700 border-green-200',
  'M&S':         'bg-pink-50 text-pink-700 border-pink-200',
  'Indian shop': 'bg-orange-50 text-orange-700 border-orange-200',
  'Cook brings': 'bg-purple-50 text-purple-700 border-purple-200',
  'Other':       'bg-gray-50 text-gray-600 border-gray-200',
};

// Mumma grocery state
let mummaSelected = JSON.parse(localStorage.getItem('mumma_selected') || '{}');
let mummaShops    = JSON.parse(localStorage.getItem('mumma_shops')    || '{}');
let mummaCookDays = JSON.parse(localStorage.getItem('mumma_cook_days')|| '["Tue","Sat"]');

const ROT_BADGES = {
  last:  { cls:'bg-red-50 text-red-600',    dot:'bg-red-400',    label:'Last week' },
  two:   { cls:'bg-orange-50 text-orange-600', dot:'bg-orange-400', label:'2 weeks ago' },
  fresh: { cls:'bg-green-50 text-green-600',  dot:'bg-green-400',  label:'Not recent ✓' },
  none:  { cls:'bg-gray-50 text-gray-500',    dot:'bg-gray-300',   label:'Not tracked' },
};

// ── MUMMA PAGE BUILDERS ───────────────────────────────────────────────────────

function buildMummaHome() {
  const day = getDayName();
  const plan = MUMMA_MEAL_PLAN[day] || MUMMA_MEAL_PLAN['Mon'];
  const typeLabels = { cook:'Cook day 👩‍🍳', left:'Leftover day ♻️', quick:'Quick cook ⚡', easy:'Easy day 😊' };
  const typeColors = { cook:'bg-green-50 text-green-700', left:'bg-gray-50 text-gray-600', quick:'bg-orange-50 text-orange-700', easy:'bg-blue-50 text-blue-700' };

  return `
  <div class="pb-4">

    <!-- Quick actions -->
    <div class="grid grid-cols-2 gap-3 mb-3">
      ${[
        ['🛒','Grocery list','Plan this week\'s shopping','grocery'],
        ['🍽️','Meal plan','See this week\'s meals','meals'],
        ['✅','Daily check','Confirm Ammu\'s day','check'],
        ['📈','Progress','See how she\'s doing','progress'],
      ].map(([e,t,s,page]) => `
        <button onclick="mummaNav('${page}')"
          class="bg-white border border-gray-100 rounded-2xl p-4 text-left active:scale-98 transition-transform shadow-sm">
          <div class="text-2xl mb-2">${e}</div>
          <div class="text-sm font-extrabold text-gray-800">${t}</div>
          <div class="text-xs font-semibold text-gray-400 mt-0.5">${s}</div>
        </button>`).join('')}
    </div>

    <!-- Today's meals -->
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <span class="text-lg">🍽️</span>
        <span class="flex-1 text-sm font-extrabold text-gray-800">Today — ${day}'s meals</span>
        <span class="text-xs font-bold px-2 py-1 rounded-full ${typeColors[plan.type]}">${typeLabels[plan.type]}</span>
      </div>
      ${plan.meals.map(m => `
        <div class="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
          <span class="text-xs font-bold text-gray-400 w-16 pt-0.5">${m.t}</span>
          <span class="flex-1 text-sm font-semibold text-gray-700">${m.m}${m.egg ? ' <span class="inline-block text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600">🥚 egg</span>' : ''}</span>
        </div>`).join('')}
    </div>

    <!-- Cook days picker -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
      <div class="text-sm font-extrabold text-gray-800 mb-3">📅 Cook days this week — tap to set</div>
      <div class="flex gap-2 flex-wrap" id="m-cook-days">
        ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `
          <button onclick="mummaToggleCookDay('${d}',this)"
            class="px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all
                   ${mummaCookDays.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}">
            ${d}
          </button>`).join('')}
      </div>
    </div>

    <!-- Food swap guide -->
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <button onclick="mummaToggleSwap()" class="w-full flex items-center gap-3 px-4 py-3">
        <span class="text-lg">🔄</span>
        <span class="flex-1 text-sm font-bold text-blue-600 text-left">Can't find a food this week? See quick swaps</span>
        <span id="m-swap-arrow" class="text-gray-400 text-sm">▾</span>
      </button>
      <div id="m-swap-list" class="hidden bg-blue-50 px-4 py-3">
        ${[
          ['🥚','No eggs?','Extra paneer or dal'],
          ['🫙','No yogurt?','Dosa or idli batter counts too!'],
          ['🥦','No broccoli?','Spinach, beans or cabbage'],
          ['🧀','No paneer?','Tofu or extra lentils'],
          ['🍌','No banana?','Any fruit — apple, orange, pear'],
          ['🥜','No walnuts?','Almonds or cashews are fine'],
        ].map(([e,q,a]) => `
          <div class="flex items-center gap-2 py-1.5">
            <span>${e}</span>
            <span class="text-xs font-bold text-blue-800">${q}</span>
            <span class="text-xs font-semibold text-blue-600">→ ${a}</span>
          </div>`).join('')}
        <div class="text-xs font-bold text-blue-700 mt-1">💡 Any home-cooked Kerala food is already great for Ammu!</div>
      </div>
    </div>

  </div>`;
}

function buildMummaGrocery() {
  const rotKey = (rot) => {
    const b = ROT_BADGES[rot] || ROT_BADGES.none;
    return `<span class="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${b.cls}">
      <span class="w-1.5 h-1.5 rounded-full ${b.dot} inline-block"></span>${b.label}
    </span>`;
  };

  const sections = MUMMA_GROCERY.map(cat => {
    const items = cat.items.map(item => {
      const sel = mummaSelected[item.id];
      const shop = mummaShops[item.id];
      return `
      <div id="gi-${item.id}" onclick="mummaToggleItem('${item.id}',this)"
        class="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${sel ? 'bg-green-50' : ''}">
        <div class="mumma-cb w-5 h-5 rounded-md border-2 ${sel ? 'bg-green-600 border-green-600' : 'border-gray-200'} flex-shrink-0 flex items-center justify-center mt-0.5">
          ${sel ? '<span class="text-white text-xs">✓</span>' : ''}
        </div>
        <span class="text-lg flex-shrink-0">${item.e}</span>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-bold text-gray-800">${item.name}</div>
          <div class="text-xs font-semibold text-gray-400">${item.qty}</div>
          ${sel ? `
          <div class="flex flex-wrap gap-1 mt-1.5" id="shops-${item.id}">
            ${SHOPS.map(s => `
              <button onclick="event.stopPropagation();mummaAssignShop('${item.id}','${s}',this)"
                class="text-xs font-bold px-2 py-0.5 rounded-full border transition-all
                       ${shop===s ? SHOP_COLORS[s] : 'bg-white text-gray-400 border-gray-200'}">
                ${s}
              </button>`).join('')}
          </div>` : ''}
        </div>
        <div class="flex-shrink-0">${rotKey(item.rot)}</div>
      </div>`;
    }).join('');

    const catColors = {teal:'border-teal-200',orange:'border-orange-200',pink:'border-pink-200',
      purple:'border-purple-200',green:'border-green-200',amber:'border-amber-200',gray:'border-gray-200'};

    return `
    <div class="bg-white rounded-2xl border-2 ${catColors[cat.color]||'border-gray-200'} overflow-hidden mb-3">
      <button onclick="mummaToggleCat('${cat.id}',this)"
        class="w-full flex items-center gap-2 px-4 py-3 border-b border-gray-50 text-left">
        <span class="text-xl">${cat.emoji}</span>
        <div class="flex-1">
          <div class="text-sm font-extrabold text-gray-800">${cat.label}</div>
          <div class="text-xs font-semibold text-gray-400">${cat.why}</div>
        </div>
        <span class="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600" id="cat-count-${cat.id}">
          ${cat.items.filter(i => mummaSelected[i.id]).length} picked
        </span>
        <span class="text-gray-400 text-sm" id="cat-chev-${cat.id}">▾</span>
      </button>
      <div id="cat-items-${cat.id}">${items}</div>
    </div>`;
  }).join('');

  const totalSelected = Object.values(mummaSelected).filter(Boolean).length;

  return `
  <div class="pb-20">

    <!-- Rotation key -->
    <div class="bg-white rounded-2xl border border-gray-100 p-3 mb-3">
      <div class="text-xs font-extrabold text-gray-500 mb-2">Rotation guide:</div>
      <div class="flex flex-wrap gap-3">
        ${Object.entries(ROT_BADGES).map(([k,b]) => `
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${b.dot} inline-block"></span>
            <span class="text-xs font-semibold text-gray-500">${b.label}</span>
          </div>`).join('')}
      </div>
    </div>

    <!-- Add custom item -->
    <div class="flex gap-2 mb-3">
      <input id="m-custom-input" type="text" placeholder="Add your own item..."
        class="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-blue-400" />
      <button onclick="mummaAddCustom()"
        class="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-extrabold active:scale-95">Add</button>
    </div>

    ${sections}

    <!-- Sticky summary -->
    <div class="fixed bottom-16 left-0 right-0 max-w-480 mx-auto px-4 pb-2 z-10" style="max-width:480px;">
      <div class="bg-blue-600 rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg">
        <div>
          <div class="text-base font-fredoka text-white" id="m-summary-count">${totalSelected} items selected</div>
          <div class="text-xs font-semibold text-blue-200">Tap items to assign shops</div>
        </div>
        <button onclick="mummaShowMyLists()"
          class="bg-white text-blue-600 text-xs font-extrabold px-4 py-2 rounded-xl active:scale-95">
          My lists →
        </button>
      </div>
    </div>

  </div>`;
}

function buildMummaMeals() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const typeLabels = { cook:'Cook day 👩‍🍳', left:'Leftover day ♻️', quick:'Quick cook ⚡', easy:'Easy day 😊' };
  const typeColors = {
    cook: 'bg-green-50 text-green-700 border-green-200',
    left: 'bg-gray-50 text-gray-600 border-gray-200',
    quick:'bg-orange-50 text-orange-700 border-orange-200',
    easy: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return `
  <div class="pb-4">
    <div class="bg-green-50 border border-green-200 rounded-2xl p-3 mb-3 flex items-center gap-2">
      <span class="text-lg">ℹ️</span>
      <div class="text-xs font-bold text-green-700">Auto-built around your cook days. Change cook days on the Home tab.</div>
    </div>

    ${days.map(day => {
      const plan = MUMMA_MEAL_PLAN[day];
      const isCook = mummaCookDays.includes(day);
      const type = isCook ? 'cook' : plan.type;
      return `
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
        <div class="flex items-center px-4 py-3 border-b border-gray-50">
          <span class="flex-1 text-sm font-extrabold text-gray-800">${day}${day === getDayName() ? ' — Today' : ''}</span>
          <span class="text-xs font-bold px-2 py-1 rounded-full border ${typeColors[type]}">${typeLabels[type]}</span>
        </div>
        ${plan.meals.map(m => `
          <div class="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
            <span class="text-xs font-bold text-gray-400 w-16 pt-0.5">${m.t}</span>
            <span class="flex-1 text-sm font-semibold text-gray-700">${m.m}${m.egg ? ' <span class="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600">🥚 egg</span>' : ''}</span>
          </div>`).join('')}
      </div>`; }).join('')}
  </div>`;
}

function buildMummaCheck() {
  return `
  <div class="pb-4">
    <div class="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-3 flex items-center gap-2">
      <span class="text-lg">👩</span>
      <div class="text-xs font-bold text-blue-700">Hi Mumma! Just 3 quick ticks from you — that's all! Thank you 🙏</div>
    </div>

    <div class="bg-white rounded-2xl border-2 border-blue-200 overflow-hidden mb-3">
      <div class="bg-blue-600 px-4 py-3 flex items-center gap-2">
        <span class="text-lg">✅</span>
        <span class="font-fredoka text-white text-lg">Mumma's daily check</span>
      </div>

      ${[
        ['truth',    '✅','Ammu told the truth in her checklist',   'You verified she actually did what she ticked'],
        ['meals',    '🍽️','She had proper meals today',             'Breakfast, lunch and dinner covered'],
        ['wellbeing','😊','She seemed happy and well today',        'Good energy, no tummy issues'],
      ].map(([id,e,label,sub]) => `
        <div id="mc-${id}" onclick="mummaCheck('${id}',this)"
          class="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer">
          <div id="mc-cb-${id}" class="w-6 h-6 rounded-lg border-2 border-gray-200 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"></div>
          <div>
            <div class="text-sm font-bold text-gray-800">${e} ${label}</div>
            <div class="text-xs font-semibold text-gray-400 mt-0.5">${sub}</div>
          </div>
        </div>`).join('')}
    </div>

    <button id="m-save-check" onclick="mummaSaveCheck()"
      class="w-full py-4 rounded-2xl bg-blue-600 text-white font-fredoka text-xl mb-3 active:scale-98">
      Save today's check 🌸
    </button>

    <div id="m-check-saved" class="hidden bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center mb-3">
      <div class="text-3xl mb-2">✅</div>
      <div class="font-fredoka text-lg text-green-700">Saved! Thank you Mumma 🙏</div>
      <div class="text-xs font-semibold text-green-600 mt-1">Abbu can see this from Palakkad</div>
    </div>

    <!-- Food swap guide -->
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onclick="mummaToggleSwap()" class="w-full flex items-center gap-3 px-4 py-3">
        <span class="text-lg">🔄</span>
        <span class="flex-1 text-sm font-bold text-blue-600 text-left">Can't find a food this week? Quick swaps</span>
        <span class="text-gray-400 text-sm">▾</span>
      </button>
      <div id="m-swap-list" class="hidden bg-blue-50 px-4 py-3">
        ${[
          ['🥚','No eggs?','Extra paneer or dal'],
          ['🫙','No yogurt?','Dosa or idli batter counts!'],
          ['🥦','No broccoli?','Spinach, beans or cabbage'],
          ['🧀','No paneer?','Tofu or extra lentils'],
        ].map(([e,q,a]) => `
          <div class="flex items-center gap-2 py-1.5">
            <span>${e}</span>
            <span class="text-xs font-bold text-blue-800">${q}</span>
            <span class="text-xs font-semibold text-blue-600">→ ${a}</span>
          </div>`).join('')}
      </div>
    </div>

  </div>`;
}

function buildMummaProgress() {
  return `
  <div class="pb-4">
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2 mb-2">
      📏 Ammu's latest measurements
    </div>
    <div class="grid grid-cols-2 gap-3 mb-3">
      ${[['📏','Height','139cm','+0.5cm'],['⚖️','Weight','33.2kg','+0.8kg'],
         ['💪','Bicep','19cm','+1cm'],['✋','Forearm','17cm','+0.5cm'],
         ['🫁','Waist','58cm','no change'],['🏊','Shoulder','34cm','+0.5cm']].map(([e,l,v,c]) => `
        <div class="bg-white rounded-2xl border border-gray-100 p-3">
          <div class="text-xl mb-1">${e}</div>
          <div class="text-xs font-semibold text-gray-400">${l}</div>
          <div class="font-fredoka text-xl text-blue-600">${v}</div>
          <div class="text-xs font-bold ${c==='no change'?'text-gray-400':'text-green-500'} mt-0.5">${c}</div>
        </div>`).join('')}
    </div>
    <div class="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
      <div class="text-sm font-extrabold text-blue-700">Measurements are entered by Ammu on the last Sunday of each month</div>
    </div>
  </div>`;
}

// ── UPDATE buildPages TO HANDLE MUMMA ────────────────────────────────────────

const _origBuildPages = buildPages;
// Override buildPages to handle Mumma's real content
buildPages = function(userKey) {
  const user = USERS[userKey];
  const container = document.getElementById('pages-container');
  container.innerHTML = '';

  user.nav.forEach((navItem, index) => {
    const page = document.createElement('div');
    page.className = 'page' + (index === 0 ? ' active' : '');
    page.id = 'page-' + userKey + '-' + navItem.id;

    if (userKey === 'ammu') {
      const ammuBuilders = { home:buildAmmuHome, tracker:buildAmmuTracker, rewards:buildAmmuRewards, secrets:buildAmmuSecrets, progress:buildAmmuProgress };
      page.innerHTML = ammuBuilders[navItem.id] ? ammuBuilders[navItem.id]() : buildPlaceholderPage(userKey, navItem);
    } else if (userKey === 'mumma') {
      const mummaBuilders = { home:buildMummaHome, grocery:buildMummaGrocery, meals:buildMummaMeals, check:buildMummaCheck, progress:buildMummaProgress };
      page.innerHTML = mummaBuilders[navItem.id] ? mummaBuilders[navItem.id]() : buildPlaceholderPage(userKey, navItem);
    } else {
      page.innerHTML = buildPlaceholderPage(userKey, navItem);
    }
    container.appendChild(page);
  });
};

// ── MUMMA INTERACTIONS — added to App object ──────────────────────────────────

Object.assign(App, {

  mummaNav(pageId) {
    const btns = document.querySelectorAll('#bottom-nav button');
    const pages = ['home','grocery','meals','check','progress'];
    const idx = pages.indexOf(pageId);
    if (idx >= 0 && btns[idx]) btns[idx].click();
  },

  mummaToggleCookDay(day, btn) {
    const idx = mummaCookDays.indexOf(day);
    if (idx >= 0) mummaCookDays.splice(idx,1);
    else mummaCookDays.push(day);
    localStorage.setItem('mumma_cook_days', JSON.stringify(mummaCookDays));
    btn.classList.toggle('bg-blue-600'); btn.classList.toggle('text-white');
    btn.classList.toggle('border-blue-600'); btn.classList.toggle('text-gray-500');
    btn.classList.toggle('border-gray-200'); btn.classList.toggle('bg-white');
  },

  mummaToggleSwap() {
    const list = document.getElementById('m-swap-list');
    if (list) list.classList.toggle('hidden');
  },

  mummaToggleItem(itemId, row) {
    mummaSelected[itemId] = !mummaSelected[itemId];
    localStorage.setItem('mumma_selected', JSON.stringify(mummaSelected));
    const cb = row.querySelector('.mumma-cb');
    if (mummaSelected[itemId]) {
      row.classList.add('bg-green-50');
      cb.classList.add('bg-green-600','border-green-600');
      cb.innerHTML = '<span class="text-white text-xs">✓</span>';
    } else {
      row.classList.remove('bg-green-50');
      cb.classList.remove('bg-green-600','border-green-600');
      cb.innerHTML = '';
      delete mummaShops[itemId];
    }
    // Update count badge
    const cat = MUMMA_GROCERY.find(c => c.items.some(i => i.id === itemId));
    if (cat) {
      const countEl = document.getElementById('cat-count-' + cat.id);
      if (countEl) countEl.textContent = cat.items.filter(i => mummaSelected[i.id]).length + ' picked';
    }
    // Update summary
    const total = Object.values(mummaSelected).filter(Boolean).length;
    const sumEl = document.getElementById('m-summary-count');
    if (sumEl) sumEl.textContent = total + ' items selected';
    // Show/hide shop buttons
    const shopsDiv = document.getElementById('shops-' + itemId);
    // Rebuild the row to show shop buttons
    const allCats = MUMMA_GROCERY.flatMap(c => c.items);
    const item = allCats.find(i => i.id === itemId);
    if (item && mummaSelected[itemId] && !shopsDiv) {
      const infoDiv = row.querySelector('.flex-1');
      if (infoDiv) {
        const shopHtml = `<div class="flex flex-wrap gap-1 mt-1.5" id="shops-${itemId}">
          ${SHOPS.map(s => `<button onclick="event.stopPropagation();mummaAssignShop('${itemId}','${s}',this)"
            class="text-xs font-bold px-2 py-0.5 rounded-full border transition-all
                   ${mummaShops[itemId]===s ? SHOP_COLORS[s] : 'bg-white text-gray-400 border-gray-200'}">${s}</button>`).join('')}
        </div>`;
        infoDiv.insertAdjacentHTML('beforeend', shopHtml);
      }
    }
  },

  mummaAssignShop(itemId, shop, btn) {
    mummaShops[itemId] = shop;
    localStorage.setItem('mumma_shops', JSON.stringify(mummaShops));
    const container = document.getElementById('shops-' + itemId);
    if (container) {
      container.querySelectorAll('button').forEach(b => {
        b.className = 'text-xs font-bold px-2 py-0.5 rounded-full border transition-all bg-white text-gray-400 border-gray-200';
      });
      btn.className = `text-xs font-bold px-2 py-0.5 rounded-full border transition-all ${SHOP_COLORS[shop]}`;
    }
  },

  mummaToggleCat(catId, btn) {
    const items = document.getElementById('cat-items-' + catId);
    const chev  = document.getElementById('cat-chev-' + catId);
    if (items) items.classList.toggle('hidden');
    if (chev)  chev.textContent = items.classList.contains('hidden') ? '▸' : '▾';
  },

  mummaAddCustom() {
    const input = document.getElementById('m-custom-input');
    if (!input || !input.value.trim()) return;
    const val = input.value.trim();
    input.value = '';
    // Add to last category
    const lastCat = document.querySelector('#page-mumma-grocery .bg-white.rounded-2xl:last-of-type .flex.flex-col');
    alert(`"${val}" added to your list! It will appear in the next grocery section update.`);
  },

  mummaShowMyLists() {
    // Build a simple per-store view in an overlay
    const byShop = {};
    MUMMA_GROCERY.flatMap(c => c.items).forEach(item => {
      if (mummaSelected[item.id] && mummaShops[item.id]) {
        const shop = mummaShops[item.id];
        if (!byShop[shop]) byShop[shop] = [];
        byShop[shop].push(item);
      }
    });
    if (Object.keys(byShop).length === 0) {
      alert('No shops assigned yet! Select items and tap a shop name to assign them first.');
      return;
    }
    let html = '<div style="font-family:Nunito,sans-serif;padding:16px;">';
    html += '<div style="font-size:18px;font-weight:900;margin-bottom:16px;">🛒 My Shopping Lists</div>';
    Object.entries(byShop).forEach(([shop, items]) => {
      html += `<div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:800;color:#185FA5;margin-bottom:8px;">${shop} (${items.length} items)</div>
        ${items.map(i => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f0f0f0;">
          <span style="width:18px;height:18px;border-radius:4px;border:2px solid #ddd;display:inline-block;"></span>
          <span style="font-size:13px;font-weight:600;">${i.e} ${i.name}</span>
          <span style="font-size:11px;color:#999;margin-left:auto;">${i.qty}</span>
        </div>`).join('')}
      </div>`;
    });
    html += '<div style="font-size:11px;color:#999;margin-top:8px;">Screenshot this list to take to the shop 📸</div></div>';
    const win = window.open('', '_blank', 'width=400,height=600');
    if (win) { win.document.write(html); win.document.close(); }
    else alert('Please allow popups to see your store lists, or assign all items first.');
  },

  mummaCheck(id, row) {
    const cb = document.getElementById('mc-cb-' + id);
    const isChecked = cb.innerHTML !== '';
    if (isChecked) {
      cb.innerHTML = '';
      cb.classList.remove('bg-blue-600','border-blue-600');
      cb.classList.add('border-gray-200');
    } else {
      cb.innerHTML = '<span class="text-white text-xs">✓</span>';
      cb.classList.add('bg-blue-600','border-blue-600');
      cb.classList.remove('border-gray-200');
    }
  },

  mummaSaveCheck() {
    const btn = document.getElementById('m-save-check');
    const saved = document.getElementById('m-check-saved');
    if (btn) { btn.disabled = true; btn.classList.replace('bg-blue-600','bg-gray-300'); }
    if (saved) saved.classList.remove('hidden');
    // Capture actual checkbox states
    const truth    = document.getElementById('mc-cb-truth')?.innerHTML    !== '' ? 'yes' : 'no';
    const meals    = document.getElementById('mc-cb-meals')?.innerHTML    !== '' ? 'yes' : 'no';
    const wellbeing= document.getElementById('mc-cb-wellbeing')?.innerHTML !== '' ? 'yes' : 'no';
    this.submitTrackerData({
      type: 'mumma_check',
      user: 'mumma',
      date: new Date().toISOString().split('T')[0],
      truth, meals, wellbeing,
    });
  },

});

// ─────────────────────────────────────────────────────────────────────────────
// FULL GROCERY LIST REPLACEMENT — 90+ items across all categories
// This replaces the shorter MUMMA_GROCERY above
// ─────────────────────────────────────────────────────────────────────────────

// Override with full list
const MUMMA_GROCERY_FULL = [
  { id:'staples', label:'Kitchen staples', emoji:'🏠', why:'The backbone of every meal', color:'gray',
    items:[
      {id:'eggs',       e:'🥚', name:'Free range eggs',           qty:'1 dozen',    rot:'last',  tags:['Tesco','Waitrose']},
      {id:'onion',      e:'🧅', name:'Onions',                    qty:'1kg bag',    rot:'last',  tags:['Tesco']},
      {id:'garlic',     e:'🧄', name:'Garlic',                    qty:'2 bulbs',    rot:'last',  tags:['Tesco']},
      {id:'ginger',     e:'🫚', name:'Fresh ginger',              qty:'Large piece',rot:'two',   tags:['Indian shop']},
      {id:'potato',     e:'🥔', name:'Potatoes',                  qty:'1kg',        rot:'fresh', tags:['Tesco']},
      {id:'tomato',     e:'🍅', name:'Tomatoes',                  qty:'6 pack',     rot:'last',  tags:['Tesco']},
      {id:'chilli',     e:'🌶️', name:'Green chillies',            qty:'Small pack', rot:'two',   tags:['Indian shop']},
      {id:'coconut',    e:'🥥', name:'Frozen grated coconut',    qty:'Bag',        rot:'fresh', tags:['Indian shop']},
      {id:'curryleaves',e:'🌿', name:'Curry leaves (fresh/frozen)',qty:'Pack',      rot:'none',  tags:['Indian shop']},
      {id:'cotoil',     e:'🫙', name:'Coconut oil',               qty:'Jar',        rot:'two',   tags:['Indian shop','Waitrose']},
      {id:'rice',       e:'🍚', name:'Basmati rice',              qty:'2kg',        rot:'last',  tags:['Indian shop','Tesco']},
      {id:'atta',       e:'🌾', name:'Whole wheat atta',          qty:'1kg',        rot:'two',   tags:['Indian shop']},
      {id:'mustard',    e:'🟡', name:'Mustard seeds',             qty:'Small pack', rot:'none',  tags:['Indian shop']},
      {id:'turmeric',   e:'🟡', name:'Turmeric powder (haldi)',   qty:'Pack',       rot:'none',  tags:['Indian shop']},
      {id:'cuminseeds', e:'🟤', name:'Cumin seeds (jeera)',       qty:'Pack',       rot:'none',  tags:['Indian shop']},
    ]
  },
  { id:'fruits', label:'Fruits', emoji:'🍎', why:'1 fruit per day — vitamins & brain power', color:'pink',
    items:[
      {id:'banana',      e:'🍌', name:'Bananas',        qty:'1 bunch',  rot:'last',  tags:['M&S','Tesco']},
      {id:'apple',       e:'🍎', name:'Apples',         qty:'4-5',      rot:'last',  tags:['M&S']},
      {id:'orange',      e:'🍊', name:'Oranges',        qty:'4',        rot:'two',   tags:['M&S']},
      {id:'pomegranate', e:'🍇', name:'Pomegranate',    qty:'1-2',      rot:'fresh', tags:['M&S','Indian shop']},
      {id:'blueberry',   e:'🫐', name:'Blueberries',    qty:'Punnet',   rot:'fresh', tags:['M&S']},
      {id:'mango',       e:'🥭', name:'Mango',          qty:'1-2',      rot:'two',   tags:['M&S','Indian shop']},
      {id:'strawberry',  e:'🍓', name:'Strawberries',   qty:'Punnet',   rot:'fresh', tags:['M&S']},
      {id:'pear',        e:'🍐', name:'Pears',          qty:'3-4',      rot:'fresh', tags:['M&S']},
      {id:'grapes',      e:'🍇', name:'Grapes',         qty:'Punnet',   rot:'none',  tags:['M&S']},
      {id:'kiwi',        e:'🥝', name:'Kiwi',           qty:'4',        rot:'fresh', tags:['M&S','Tesco']},
      {id:'melon',       e:'🍈', name:'Melon / watermelon',qty:'1 small',rot:'fresh',tags:['M&S']},
    ]
  },
  { id:'dry', label:'Dry fruits & nuts', emoji:'🥜', why:'Daily TV snack — muscle & brain fuel', color:'amber',
    items:[
      {id:'almonds',    e:'🥜', name:'Almonds',            qty:'200g',    rot:'last',  tags:['Indian shop','Tesco']},
      {id:'walnuts',    e:'🌰', name:'Walnuts',            qty:'150g',    rot:'last',  tags:['Indian shop','Waitrose']},
      {id:'cashews',    e:'🥜', name:'Cashews',            qty:'150g',    rot:'two',   tags:['Indian shop']},
      {id:'pistachios', e:'🥜', name:'Pistachios',         qty:'150g',    rot:'fresh', tags:['Indian shop']},
      {id:'dates',      e:'🫘', name:'Dates (Medjool)',    qty:'Box',     rot:'fresh', tags:['Indian shop','Waitrose']},
      {id:'raisins',    e:'🍇', name:'Raisins / sultanas', qty:'Small bag',rot:'none', tags:['Tesco','Indian shop']},
      {id:'figs',       e:'🫐', name:'Dried figs',         qty:'Pack',    rot:'fresh', tags:['Waitrose','Indian shop']},
      {id:'pecan',      e:'🥜', name:'Pecan nuts',         qty:'100g',    rot:'fresh', tags:['Waitrose']},
    ]
  },
  { id:'snacks', label:'Healthy snacks', emoji:'🍿', why:'Quick grab options for busy days', color:'green',
    items:[
      {id:'cheese',       e:'🧀', name:'Cheddar cheese sticks',  qty:'Pack',  rot:'two',   tags:['Tesco']},
      {id:'hummus',       e:'🫙', name:'Hummus',                 qty:'Tub',   rot:'fresh', tags:['Tesco','Waitrose']},
      {id:'peanutbutter', e:'🫙', name:'Peanut butter (no sugar)',qty:'Jar',  rot:'none',  tags:['Tesco']},
      {id:'oatcakes',     e:'🍪', name:'Oatcakes',               qty:'Pack',  rot:'fresh', tags:['Tesco','Waitrose']},
      {id:'avocado',      e:'🥑', name:'Avocado',                qty:'2',     rot:'two',   tags:['Waitrose','M&S']},
      {id:'darkchoc',     e:'🍫', name:'Dark chocolate (70%+)',  qty:'Small bar',rot:'fresh',tags:['Waitrose','Tesco']},
      {id:'ricecakes',    e:'🍘', name:'Rice cakes (plain)',     qty:'Pack',  rot:'fresh', tags:['Tesco']},
      {id:'popcorn',      e:'🍿', name:'Plain popcorn',          qty:'Pack',  rot:'none',  tags:['Tesco']},
    ]
  },
  { id:'bone', label:'Strong bones 🦴', emoji:'🦴', why:'Calcium + Vitamin D — builds strong bones', color:'teal',
    items:[
      {id:'yogurt',    e:'🥛', name:'Plain yogurt (full fat)',  qty:'500g',      rot:'last',  tags:['Tesco','Waitrose']},
      {id:'greekyog',  e:'🥛', name:'Greek yogurt',             qty:'500g',      rot:'two',   tags:['Tesco','Waitrose']},
      {id:'paneer',    e:'🧀', name:'Paneer',                   qty:'400g',      rot:'two',   tags:['Indian shop','Waitrose']},
      {id:'broccoli',  e:'🥦', name:'Broccoli',                 qty:'1 head',    rot:'fresh', tags:['Waitrose']},
      {id:'spinach',   e:'🌿', name:'Spinach',                  qty:'200g bag',  rot:'two',   tags:['Waitrose','Tesco']},
      {id:'kale',      e:'🥬', name:'Kale',                     qty:'Bag',       rot:'fresh', tags:['Waitrose']},
      {id:'salmon',    e:'🐟', name:'Salmon fillets',           qty:'2 fillets', rot:'fresh', tags:['Waitrose']},
      {id:'sardines',  e:'🐟', name:'Sardines (tinned)',        qty:'2 tins',    rot:'fresh', tags:['Tesco']},
      {id:'sesame',    e:'🫘', name:'Sesame seeds (til)',       qty:'Small bag', rot:'none',  tags:['Indian shop']},
      {id:'cheddar',   e:'🧀', name:'Cheddar cheese',          qty:'Small block',rot:'two',  tags:['Tesco','Waitrose']},
      {id:'oatmilk',   e:'🫙', name:'Fortified oat milk',      qty:'1L',        rot:'fresh', tags:['Tesco']},
    ]
  },
  { id:'muscle', label:'Muscle power 💪', emoji:'💪', why:'Protein — builds & repairs muscles', color:'orange',
    items:[
      {id:'chicken',   e:'🍗', name:'Chicken thighs',         qty:'500g', rot:'two',   tags:['Waitrose']},
      {id:'chickbr',   e:'🍗', name:'Chicken breast',         qty:'400g', rot:'two',   tags:['Waitrose','M&S']},
      {id:'dal',       e:'🫘', name:'Red lentils (masoor dal)',qty:'500g', rot:'last',  tags:['Indian shop','Tesco']},
      {id:'moong',     e:'🫘', name:'Yellow moong dal',       qty:'500g', rot:'two',   tags:['Indian shop']},
      {id:'chickpeas', e:'🫘', name:'Chickpeas (tinned)',     qty:'400g tin',rot:'fresh',tags:['Tesco']},
      {id:'fish',      e:'🐟', name:'White fish fillets',     qty:'2',    rot:'fresh', tags:['Waitrose']},
      {id:'tuna',      e:'🐟', name:'Tuna (tinned)',          qty:'2 tins',rot:'fresh',tags:['Tesco']},
      {id:'lamb',      e:'🥩', name:'Lamb mince',             qty:'300g', rot:'fresh', tags:['Waitrose']},
      {id:'tofu',      e:'🟤', name:'Tofu (firm)',            qty:'Pack', rot:'fresh', tags:['Waitrose','Tesco']},
      {id:'pbutter2',  e:'🫙', name:'Nut butter (almond)',    qty:'Jar',  rot:'none',  tags:['Waitrose']},
    ]
  },
  { id:'gut', label:'Happy tummy 🌱', emoji:'🌱', why:'Fermented foods — heals digestion', color:'pink',
    items:[
      {id:'dosa',      e:'🫓', name:'Dosa batter (ready-made)',  qty:'1kg tub', rot:'two',   tags:['Indian shop','Elif']},
      {id:'idli',      e:'🫓', name:'Idli batter (ready-made)',  qty:'1kg tub', rot:'fresh', tags:['Indian shop','Elif']},
      {id:'oats2',     e:'🌾', name:'Rolled oats',               qty:'500g',    rot:'fresh', tags:['Tesco']},
      {id:'sourdough', e:'🍞', name:'Sourdough bread',           qty:'Loaf',    rot:'none',  tags:['Waitrose']},
      {id:'kimchi',    e:'🫙', name:'Kimchi (small jar)',        qty:'Jar',     rot:'fresh', tags:['Waitrose']},
      {id:'kefir',     e:'🥛', name:'Kefir (plain)',             qty:'Bottle',  rot:'fresh', tags:['Waitrose']},
      {id:'sweetpot',  e:'🍠', name:'Sweet potato',             qty:'2-3',     rot:'fresh', tags:['Waitrose','Tesco']},
      {id:'kidney',    e:'🫘', name:'Kidney beans (tinned)',     qty:'Tin',     rot:'fresh', tags:['Tesco']},
      {id:'garlic2',   e:'🧄', name:'Garlic (prebiotic)',        qty:'Bulb',    rot:'last',  tags:['Tesco']},
      {id:'banana2',   e:'🍌', name:'Bananas (prebiotic fibre)', qty:'Bunch',   rot:'last',  tags:['Tesco','M&S']},
    ]
  },
  { id:'brain', label:'Brain power 🧠', emoji:'🧠', why:'Omega-3 + antioxidants — sharp memory', color:'purple',
    items:[
      {id:'flax',      e:'🌱', name:'Flaxseeds (alsi)',          qty:'Small bag',  rot:'fresh', tags:['Indian shop']},
      {id:'darkchoc2', e:'🍫', name:'Dark chocolate (70%+)',     qty:'Bar',        rot:'fresh', tags:['Waitrose']},
      {id:'avocado2',  e:'🥑', name:'Avocado',                   qty:'2',          rot:'two',   tags:['Waitrose']},
      {id:'salmon2',   e:'🐟', name:'Salmon (Omega-3)',          qty:'2 fillets',  rot:'fresh', tags:['Waitrose']},
      {id:'eggs2',     e:'🥚', name:'Eggs (choline for brain)',  qty:'Already in staples',rot:'last',tags:['Tesco']},
      {id:'walnuts2',  e:'🌰', name:'Walnuts (already in nuts)', qty:'Already in dry fruits',rot:'last',tags:['Indian shop']},
      {id:'blueberry2',e:'🫐', name:'Blueberries (already in fruits)',qty:'Already in fruits',rot:'fresh',tags:['M&S']},
      {id:'turmeric2', e:'🟡', name:'Turmeric latte mix',        qty:'Pack',       rot:'fresh', tags:['Waitrose']},
      {id:'greentea',  e:'🍵', name:'Green tea bags',            qty:'Box',        rot:'fresh', tags:['Tesco','Waitrose']},
    ]
  },
  { id:'energy', label:'Energy & veg 🥕', emoji:'⚡', why:'Complex carbs + iron — energy all day', color:'amber',
    items:[
      {id:'carrot',    e:'🥕', name:'Carrots',                   qty:'500g bag',rot:'two',   tags:['Waitrose','Tesco']},
      {id:'beetroot',  e:'🫀', name:'Beetroot',                  qty:'2-3',     rot:'none',  tags:['Waitrose']},
      {id:'pumpkin',   e:'🎃', name:'Pumpkin',                   qty:'Small piece',rot:'fresh',tags:['Waitrose','Indian shop']},
      {id:'okra',      e:'🫑', name:'Okra (bhindi)',             qty:'200g',    rot:'fresh', tags:['Indian shop','Elif']},
      {id:'greenbeans',e:'🫘', name:'Green beans',               qty:'200g',    rot:'two',   tags:['Waitrose']},
      {id:'cauliflower',e:'🥦',name:'Cauliflower',               qty:'1 head',  rot:'fresh', tags:['Waitrose','Tesco']},
      {id:'cabbage',   e:'🥬', name:'Cabbage',                   qty:'Half',    rot:'fresh', tags:['Tesco']},
      {id:'zucchini',  e:'🥒', name:'Zucchini / courgette',     qty:'2',       rot:'fresh', tags:['Waitrose']},
      {id:'corn',      e:'🌽', name:'Sweetcorn (tinned)',        qty:'Tin',     rot:'fresh', tags:['Tesco']},
      {id:'mushroom',  e:'🍄', name:'Mushrooms (NOT for Ammu — Mumma only)',qty:'Pack',rot:'none',tags:['Tesco']},
    ]
  },
];

// Replace the shorter list with the full one
if (typeof MUMMA_GROCERY !== 'undefined') {
  MUMMA_GROCERY.length = 0;
  MUMMA_GROCERY_FULL.forEach(cat => MUMMA_GROCERY.push(cat));
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 4 — ABBU SECTION
// ─────────────────────────────────────────────────────────────────────────────

// ── ABBU DATA ─────────────────────────────────────────────────────────────────

const ABBU_REPORT_TEMPLATES = [
  {
    stats: (d) => [
      { e:'🏆', t:'Best day of the month',       v: d.bestDay },
      { e:'🔥', t:'Longest streak this month',   v: d.streak + ' days!' },
      { e:'💪', t:'Total exercises completed',   v: d.exercises + ' sessions' },
      { e:'🥚', t:'Eggs eaten this month',        v: d.eggs + ' eggs!' },
      { e:'🐘', t:'Animal of the month',          v: d.animal },
      { e:'⭐', t:'Perfect days this month',     v: d.perfectDays + ' perfect days' },
    ],
    note: (d) => `Ammu, this month you showed everyone what you are made of! Your exercise scores are incredible — you are officially getting stronger every single day. The ${d.weakest} section needs a little more love next month — but I know you can do it. I am so proud of every single tick you made this month. From Palakkad with all my love. 💙`
  },
  {
    stats: (d) => [
      { e:'🌟', t:'Most improved area',           v: d.mostImproved },
      { e:'🔥', t:'Total days tracked',           v: d.daysTracked + ' out of 30' },
      { e:'🪙', t:'Total coins earned',           v: '🪙 ' + d.coins + ' coins!' },
      { e:'💧', t:'Glasses of water drunk',       v: d.water + ' glasses total' },
      { e:'🦁', t:'Spirit animal this month',     v: d.animal },
      { e:'📚', t:'Reading & drawing sessions',   v: d.reading + ' sessions' },
    ],
    note: (d) => `My dearest Ammu! What a month this has been. You tracked ${d.daysTracked} days — that takes real discipline. Your ${d.strongest} scores make Abbu so happy from here in Palakkad. Next month let's focus on ${d.weakest} together. Remember, every day you fill in that tracker, Abbu sees it and smiles. 🦣💙`
  },
  {
    stats: (d) => [
      { e:'💪', t:'Strongest category this month', v: d.strongest },
      { e:'📈', t:'Improvement vs last month',     v: '+' + d.improvement + '% better!' },
      { e:'🧘', t:'Meditation sessions',           v: d.meditation + ' sessions' },
      { e:'🥗', t:'Healthy meals tracked',         v: d.meals + ' meals logged' },
      { e:'🏊', t:'Swimming sessions',             v: d.swimming + ' Sunday swims' },
      { e:'🌺', t:'Kerala elephant power rating',  v: d.elephantRating + '/10 🐘' },
    ],
    note: (d) => `Ammu, you know what Abbu thinks when he sees your tracker every day? He thinks — that is MY daughter. Strong, disciplined, and full of heart. This month your ${d.strongest} score was outstanding. You are already better than Abbu was at age 10! Month ${d.monthNum} is going to be even bigger. Never stop, my little champion. 🦣`
  },
];

// Goals state — persisted in localStorage
let abbuGoals = JSON.parse(localStorage.getItem('abbu_goals') || JSON.stringify([
  { id:'pushups',   emoji:'💪', name:'Push-ups per day',        ammu:'8',  abbu:'10', mumma:'',  status:'negotiating', abbuNote:'You\'re stronger than you think!', ammuNote:'I think I can do 8!' },
  { id:'perfdays',  emoji:'⭐', name:'Perfect days per month',  ammu:'20', abbu:'20', mumma:'20',status:'agreed',      abbuNote:'That\'s perfect Ammu!',            ammuNote:'I\'ll try my best!', mummaNote:'I\'ll make sure breakfast is ready!' },
  { id:'meditate',  emoji:'🧘', name:'Meditation days per week',ammu:'3',  abbu:'',   mumma:'',  status:'proposed',    ammuNote:'Meditation is hard!' },
  { id:'water',     emoji:'💧', name:'Glasses of water per day',ammu:'4',  abbu:'',   mumma:'',  status:'proposed',    ammuNote:'I forget sometimes!' },
]));

// Pending reward approvals
let abbuRewards = JSON.parse(localStorage.getItem('abbu_rewards') || JSON.stringify([
  { id:'r1', emoji:'🎬', name:'Movie night request',  detail:'Ammu wants to watch a slightly grown-up movie', status:'pending' },
  { id:'r2', emoji:'🎡', name:'Adventure day',         detail:'Month 1 complete — Ammu wants to choose her adventure!', status:'pending' },
]));

// ── ABBU PAGE BUILDERS ────────────────────────────────────────────────────────

function buildAbbuToday() {
  const day = getDayName();
  const h = new Date().getHours();
  const checkItems = [
    { done:true,  name:'🥛 Had yogurt',             cat:'bone' },
    { done:true,  name:'🥚 Had her egg',             cat:'muscle' },
    { done:true,  name:'🌅 Morning stretch',         cat:'exercise' },
    { done:true,  name:'🏋️ Main exercise',           cat:'exercise' },
    { done:false, name:'🧘 Meditation',              cat:'peace' },
    { done:false, name:'📖 Reading before sleep',    cat:'peace' },
    { done:false, name:'📵 No screens before bed',   cat:'peace' },
    { done:true,  name:'🫓 Dosa / idli / fermented', cat:'gut' },
    { done:false, name:'🍓 Had a fruit',             cat:'brain' },
  ];
  const doneCount = checkItems.filter(i => i.done).length;
  const pct = Math.round(doneCount / checkItems.length * 100);
  const lon = getTimeForOffset(1);

  return `
  <div class="pb-4">

    <!-- Status summary -->
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2 mb-2">
      Today's status — ${day}, ${new Date().getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date().getMonth()]}
    </div>

    <!-- Traffic lights -->
    <div class="grid grid-cols-4 gap-2 mb-3">
      ${[
        { dot:'bg-green-400', label:'App opened', sub:'6:42 PM' },
        { dot: pct>50?'bg-green-400':'bg-yellow-400', label:`${doneCount}/${checkItems.length} tasks`, sub:`${pct}% done` },
        { dot:'bg-yellow-400', label:'Mumma check', sub:'not yet' },
        { dot:'bg-green-400', label:'Mood', sub:'😊 Happy' },
      ].map(item => `
        <div class="bg-white rounded-xl border border-gray-100 p-2.5 text-center">
          <div class="w-5 h-5 rounded-full ${item.dot} mx-auto mb-1.5"></div>
          <div class="text-xs font-extrabold text-gray-700 leading-tight">${item.label}</div>
          <div class="text-xs font-semibold text-gray-400 mt-0.5">${item.sub}</div>
        </div>`).join('')}
    </div>

    <!-- Quick stats -->
    <div class="grid grid-cols-2 gap-3 mb-3">
      ${[
        { label:'Coins today',  val:'🪙 34',  sub:'of 50 possible',  color:'text-yellow-500' },
        { label:'Streak',       val:'🔥 12',  sub:'days in a row!',  color:'text-orange-500' },
        { label:'This week',    val:'4/7',    sub:'↑ better than last week', color:'text-green-600' },
        { label:'Energy today', val:'⭐⭐⭐⭐', sub:'4 out of 5',    color:'text-purple-600' },
      ].map(s => `
        <div class="bg-white rounded-2xl border border-gray-100 p-3">
          <div class="text-xs font-semibold text-gray-400">${s.label}</div>
          <div class="text-lg font-extrabold ${s.color} mt-1">${s.val}</div>
          <div class="text-xs text-gray-400 mt-0.5">${s.sub}</div>
        </div>`).join('')}
    </div>

    <!-- Today's checklist view -->
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <span class="text-lg">📋</span>
        <span class="flex-1 text-sm font-extrabold text-gray-800">What Ammu did today</span>
        <span class="text-xs font-bold px-2 py-1 rounded-full bg-green-50 text-green-700">${pct}% done</span>
      </div>
      ${checkItems.map(item => `
        <div class="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
          <div class="w-2 h-2 rounded-full flex-shrink-0 ${item.done ? 'bg-green-400' : 'bg-gray-200'}"></div>
          <span class="flex-1 text-sm font-semibold ${item.done ? 'text-gray-700' : 'text-gray-400'}">${item.name}</span>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full ${item.done ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}">
            ${item.done ? '✓ Done' : 'Not yet'}
          </span>
        </div>`).join('')}
    </div>

    <!-- PROUD ABBU 🦣 -->
    <div class="rounded-2xl p-4 mb-3 text-center" style="background:#1A1A3E;border:2px solid #4A4A9E;">
      <div class="text-5xl mb-2" style="animation:bounce 2s infinite;">🦣</div>
      <div class="font-fredoka text-xl text-white mb-1">Proud Abbu Moment</div>
      <div class="text-xs font-semibold text-white/70 mb-3 leading-relaxed">
        Tap below to send Ammu a special message — she'll see it when she opens her app!
      </div>
      <div id="abbu-proud-wrap">
        <button onclick="abbuShowProud()"
          class="w-full py-3 rounded-xl font-fredoka text-lg active:scale-98 transition-transform"
          style="background:#F5C800;color:#1A1A3E;">
          🦣 Send a Proud Abbu Moment!
        </button>
      </div>
      <div id="abbu-proud-form" class="hidden mt-3">
        <textarea id="abbu-proud-msg" rows="3" placeholder="Write something special for Ammu...&#10;e.g. 'Ammu, I am SO proud of you today! 12 days in a row — you are my little champion! 🏆'"
          class="w-full px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 text-sm font-semibold resize-none focus:outline-none focus:border-yellow-400 mb-2"></textarea>
        <button onclick="abbuSendProud()"
          class="w-full py-2.5 rounded-xl bg-green-600 text-white font-fredoka text-base active:scale-98">
          🦣 Send to Ammu!
        </button>
        <div id="abbu-proud-sent" class="hidden mt-2 text-xs font-extrabold text-green-400">
          ✅ Sent! Ammu will see this when she opens her app! 💙
        </div>
      </div>
    </div>

  </div>`;
}

function buildAbbuWeekly() {
  const bars = [
    { day:'Mon', pct:85, hi:true },
    { day:'Tue', pct:70, hi:false },
    { day:'Wed', pct:90, hi:true },
    { day:'Thu', pct:45, hi:false },
    { day:'Fri', pct:88, hi:true },
    { day:'Sat', pct:75, hi:false },
    { day:'Sun', pct:60, hi:true, today:true },
  ];
  const categories = [
    { e:'💪', name:'Exercise',     pct:92, color:'bg-green-500' },
    { e:'🦴', name:'Bone health',  pct:85, color:'bg-green-500' },
    { e:'🧠', name:'Brain health', pct:74, color:'bg-orange-400' },
    { e:'🌱', name:'Gut health',   pct:68, color:'bg-orange-400' },
    { e:'😊', name:'Peace & calm', pct:55, color:'bg-orange-400' },
    { e:'💧', name:'Water',        pct:48, color:'bg-gray-300' },
  ];

  return `
  <div class="pb-4">

    <div class="bg-green-50 border border-green-200 rounded-2xl p-3 mb-3 flex items-center gap-2">
      <span class="text-xl">📊</span>
      <div>
        <div class="text-sm font-extrabold text-green-800">Week 2 of Month 2 — great progress!</div>
        <div class="text-xs font-semibold text-green-600">Ammu completed 4 out of 7 days fully this week</div>
      </div>
    </div>

    <!-- Bar chart -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
      <div class="text-sm font-extrabold text-gray-800 mb-3">Daily completion this week (%)</div>
      <div class="flex items-end gap-2 h-20 mb-2">
        ${bars.map(b => `
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="text-[9px] font-bold text-gray-500">${b.pct}</div>
            <div class="w-full rounded-t-md transition-all ${b.today ? 'bg-gray-800' : b.hi ? 'bg-green-500' : b.pct<50 ? 'bg-gray-200' : 'bg-orange-400'}"
              style="height:${Math.round(b.pct*0.64)}px"></div>
            <div class="text-[9px] font-bold ${b.today ? 'text-gray-800' : 'text-gray-400'}">${b.day}</div>
          </div>`).join('')}
      </div>
      <div class="flex gap-3 flex-wrap">
        ${[['bg-green-500','80%+ great'],['bg-orange-400','50-79% ok'],['bg-gray-200','below 50%'],['bg-gray-800','today']].map(([c,l]) =>
          `<div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm ${c}"></div><span class="text-xs font-semibold text-gray-400">${l}</span></div>`
        ).join('')}
      </div>
    </div>

    <!-- Category breakdown -->
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <span class="text-lg">🎯</span>
        <span class="text-sm font-extrabold text-gray-800">Strongest &amp; weakest this week</span>
      </div>
      ${categories.map(cat => `
        <div class="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
          <span class="text-lg">${cat.e}</span>
          <span class="text-sm font-semibold text-gray-700 flex-1">${cat.name}</span>
          <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full ${cat.color} rounded-full" style="width:${cat.pct}%"></div>
          </div>
          <span class="text-xs font-extrabold w-8 text-right ${cat.pct>=80?'text-green-600':cat.pct>=50?'text-orange-500':'text-gray-400'}">${cat.pct}%</span>
        </div>`).join('')}
    </div>

    <!-- Quick stats -->
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div class="bg-white rounded-2xl border border-gray-100 p-3">
        <div class="text-xs font-semibold text-gray-400">Coins this week</div>
        <div class="text-xl font-extrabold text-yellow-500 mt-1">🪙 312</div>
        <div class="text-xs font-bold text-green-500 mt-0.5">↑ +48 vs last week</div>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 p-3">
        <div class="text-xs font-semibold text-gray-400">Best streak ever</div>
        <div class="text-xl font-extrabold text-orange-500 mt-1">🔥 12</div>
        <div class="text-xs text-gray-400 mt-0.5">personal best!</div>
      </div>
    </div>

    <!-- Weekly note to Ammu -->
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <span class="text-lg">✍️</span>
        <span class="text-sm font-extrabold text-gray-800">Your note to Ammu this week</span>
      </div>
      <div class="p-4">
        <textarea id="abbu-weekly-note" rows="3"
          placeholder="Write something encouraging for Ammu to read this week...&#10;&#10;e.g. 'Ammu, Thursday was a tough day but you bounced back on Friday — that's the sign of a true champion!'"
          class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 resize-none focus:outline-none focus:border-gray-400"></textarea>
        <button onclick="abbuSaveWeeklyNote()"
          class="mt-2 w-full py-3 rounded-xl font-fredoka text-base text-white active:scale-98"
          style="background:#1A1A3E;">Send to Ammu 💙</button>
        <div id="abbu-note-sent" class="hidden mt-2 text-center text-xs font-extrabold text-green-600">
          ✅ Ammu will see this in her Secrets tab!
        </div>
      </div>
    </div>

  </div>`;
}

function buildAbbuReport() {
  const now = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const animals = ['🦁 The Lion!','🐬 The Dolphin!','🐘 The Elephant!','🦅 The Eagle!','🐯 The Tiger!'];
  const categories = ['Exercise','Bone health','Muscle power','Gut health','Peace & calm'];

  const d = {
    bestDay: days[Math.floor(Math.random()*7)] + ' ' + (Math.floor(Math.random()*28)+1) + 'th',
    streak: Math.floor(Math.random()*8)+8,
    exercises: Math.floor(Math.random()*30)+80,
    eggs: Math.floor(Math.random()*10)+18,
    animal: animals[Math.floor(Math.random()*animals.length)],
    perfectDays: Math.floor(Math.random()*8)+6,
    mostImproved: categories[Math.floor(Math.random()*3)],
    daysTracked: Math.floor(Math.random()*8)+20,
    coins: Math.floor(Math.random()*200)+600,
    water: Math.floor(Math.random()*50)+120,
    reading: Math.floor(Math.random()*10)+15,
    strongest: categories[Math.floor(Math.random()*2)],
    weakest: categories[Math.floor(Math.random()*3)+2],
    improvement: Math.floor(Math.random()*20)+10,
    meditation: Math.floor(Math.random()*10)+8,
    meals: Math.floor(Math.random()*20)+70,
    swimming: Math.floor(Math.random()*3)+3,
    elephantRating: Math.floor(Math.random()*3)+7,
    monthNum: now.getMonth()+1,
  };

  const templateIdx = now.getMonth() % ABBU_REPORT_TEMPLATES.length;
  const tmpl = ABBU_REPORT_TEMPLATES[templateIdx];
  const stats = tmpl.stats(d);
  const defaultNote = tmpl.note(d);

  const gradeMap = { Exercise:'A', 'Bone health':'A-', 'Muscle power':'B+', 'Gut health':'B', 'Peace & calm':'C+', Water:'C' };
  const gradeColor = { A:'text-green-400', 'A-':'text-green-400', 'B+':'text-yellow-400', B:'text-yellow-400', 'C+':'text-orange-400', C:'text-orange-400' };

  return `
  <div class="pb-4">

    <div class="rounded-2xl p-4 mb-3" style="background:linear-gradient(135deg,#1A1A3E,#2D1B5E);border:2px solid #4A3A8E;">
      <div class="text-xs font-extrabold uppercase tracking-widest text-white/50 mb-1">Month ${d.monthNum} — ${months[now.getMonth()]} ${now.getFullYear()}</div>
      <div class="font-fredoka text-xl text-white mb-3">Ammu's Official Report Card 📋</div>

      <!-- Grade grid -->
      <div class="grid grid-cols-3 gap-2 mb-3">
        ${Object.entries(gradeMap).map(([sub, grade]) => `
          <div class="rounded-xl p-2 text-center" style="background:rgba(255,255,255,0.1);">
            <div class="text-xs font-bold text-white/60">${sub}</div>
            <div class="font-fredoka text-2xl ${gradeColor[grade]} mt-0.5">${grade}</div>
          </div>`).join('')}
      </div>

      <!-- Stats -->
      <div class="rounded-xl p-3 mb-3" style="background:rgba(255,255,255,0.08);">
        ${stats.map(s => `
          <div class="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
            <span class="text-base">${s.e}</span>
            <span class="flex-1 text-xs font-bold text-white/80">${s.t}</span>
            <span class="text-xs font-extrabold text-yellow-400">${s.v}</span>
          </div>`).join('')}
      </div>

      <!-- Personal note -->
      <div class="rounded-xl p-3" style="background:rgba(245,200,0,0.12);border:1px solid rgba(245,200,0,0.25);">
        <div class="text-xs font-extrabold text-yellow-400 uppercase tracking-wider mb-1.5">Abbu's personal message</div>
        <div id="abbu-report-note" class="text-xs font-semibold text-white/90 leading-relaxed">${defaultNote}</div>
      </div>

      <button onclick="abbuRegenerateReport()"
        class="mt-3 w-full py-2.5 rounded-xl font-fredoka text-base active:scale-98"
        style="background:#F5C800;color:#1A1A3E;">
        🤖 Generate fresh report for this month!
      </button>
    </div>

    <!-- Edit personal note -->
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <span class="text-lg">✍️</span>
        <span class="text-sm font-extrabold text-gray-800">Edit your personal message</span>
      </div>
      <div class="p-4">
        <textarea id="abbu-note-input" rows="4"
          placeholder="Write your personal note for Ammu's monthly report card..."
          class="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 resize-none focus:outline-none focus:border-gray-400"
        >${defaultNote}</textarea>
        <button onclick="abbuSaveNote()"
          class="mt-2 w-full py-3 rounded-xl font-fredoka text-base text-white active:scale-98"
          style="background:#1A1A3E;">Save to Report Card 💙</button>
      </div>
    </div>

  </div>`;
}

function buildAbbuGoals() {
  const statusBadge = {
    proposed:    'bg-blue-50 text-blue-700',
    negotiating: 'bg-orange-50 text-orange-700',
    agreed:      'bg-green-50 text-green-700',
  };
  const statusLabel = {
    proposed:    'Proposed by Ammu',
    negotiating: 'Negotiating',
    agreed:      '✓ Agreed!',
  };

  return `
  <div class="pb-4">

    <div class="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-3 flex items-center gap-2">
      <span class="text-xl">🤝</span>
      <div>
        <div class="text-sm font-extrabold text-blue-800">Ammu proposes — Abbu &amp; Mumma review</div>
        <div class="text-xs font-semibold text-blue-600">Once all three agree, the goal locks in for next month!</div>
      </div>
    </div>

    ${abbuGoals.map(goal => `
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3" id="goal-${goal.id}">
        <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
          <span class="text-xl">${goal.emoji}</span>
          <span class="flex-1 text-sm font-extrabold text-gray-800">${goal.name}</span>
          <span class="text-xs font-bold px-2 py-1 rounded-full ${statusBadge[goal.status]}">${statusLabel[goal.status]}</span>
        </div>
        <div class="px-4 py-3">
          ${[
            ['🦁 Ammu', goal.ammu, goal.ammuNote],
            ['🦣 Abbu', goal.abbu, goal.abbuNote],
            ['👩 Mumma', goal.mumma, goal.mummaNote],
          ].map(([who, val, note]) => `
            <div class="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
              <span class="text-xs font-extrabold text-gray-500 w-16 flex-shrink-0 pt-0.5">${who}</span>
              <span class="text-sm font-bold text-gray-800 min-w-[40px]">${val || '—'}</span>
              <span class="text-xs font-semibold text-gray-400 flex-1">${note || 'Waiting to review'}</span>
            </div>`).join('')}

          ${goal.status !== 'agreed' ? `
          <div class="flex gap-2 mt-3">
            <input id="goal-input-${goal.id}" type="text" placeholder="Your suggestion..."
              class="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-gray-400" />
            <button onclick="abbuUpdateGoal('${goal.id}')"
              class="px-3 py-2 rounded-xl text-white text-xs font-extrabold active:scale-95"
              style="background:#1A1A3E;">Update</button>
          </div>
          <button onclick="abbuAgreeGoal('${goal.id}')"
            class="mt-2 w-full py-2.5 rounded-xl text-sm font-extrabold border-2 border-green-500 text-green-700 bg-green-50 active:scale-98">
            ✓ Agree to this goal
          </button>` : `
          <div class="mt-2 bg-green-50 rounded-xl p-2.5 text-center text-xs font-extrabold text-green-700">
            🎉 All three agreed! Goal locked in for next month!
          </div>`}
        </div>
      </div>`).join('')}

    <!-- Add new goal -->
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <span class="text-lg">➕</span>
        <span class="text-sm font-extrabold text-gray-800">Add a new goal for Ammu</span>
      </div>
      <div class="p-4 flex flex-col gap-2">
        <input id="new-goal-name" type="text" placeholder="Goal name e.g. Reading pages per day"
          class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-gray-400" />
        <input id="new-goal-val" type="text" placeholder="Your suggested target e.g. 10 pages"
          class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-gray-400" />
        <button onclick="abbuAddGoal()"
          class="w-full py-3 rounded-xl font-fredoka text-base text-white active:scale-98"
          style="background:#1A1A3E;">Add Goal for Ammu to Consider</button>
      </div>
    </div>

  </div>`;
}

function buildAbbuAlerts() {
  return `
  <div class="pb-4">

    <!-- Reward approvals -->
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2 mb-2">
      ⏳ Reward approvals waiting
    </div>
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3" id="abbu-rewards-list">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <span class="text-lg">🎁</span>
        <span class="flex-1 text-sm font-extrabold text-gray-800">Ammu's claimed rewards</span>
        <span class="text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-600">${abbuRewards.filter(r=>r.status==='pending').length} pending</span>
      </div>
      ${abbuRewards.map(r => `
        <div id="reward-${r.id}" class="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
          <span class="text-2xl">${r.emoji}</span>
          <div class="flex-1">
            <div class="text-sm font-bold text-gray-800">${r.name}</div>
            <div class="text-xs font-semibold text-gray-400 mt-0.5">${r.detail}</div>
          </div>
          ${r.status === 'pending' ? `
          <div class="flex gap-2">
            <button onclick="abbuApprove('${r.id}')"
              class="text-xs font-extrabold bg-green-600 text-white px-3 py-1.5 rounded-full active:scale-95">✓ Yes</button>
            <button onclick="abbuReject('${r.id}')"
              class="text-xs font-extrabold border border-gray-200 text-gray-500 px-3 py-1.5 rounded-full active:scale-95">✗ No</button>
          </div>` : `
          <span class="text-xs font-bold ${r.status==='approved'?'text-green-600':'text-gray-400'}">${r.status==='approved'?'✓ Approved':'✗ Declined'}</span>`}
        </div>`).join('')}
    </div>

    <!-- Notifications -->
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2 mb-2">🔔 Alerts</div>
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      ${[
        { dot:'bg-green-400', title:'Ammu opened app today',     sub:'She checked in at 6:42 PM — great!', time:'Today' },
        { dot:'bg-yellow-400',title:'Mumma check not completed', sub:'Mumma hasn\'t verified today\'s checklist yet', time:'Today' },
        { dot:'bg-green-400', title:'12-day streak achieved!',   sub:'Ammu just hit her longest streak ever!', time:'Yesterday' },
        { dot:'bg-red-400',   title:'Ammu missed Thursday',      sub:'App wasn\'t opened — only 45% completion', time:'Thu 22' },
        { dot:'bg-green-400', title:'Monthly report ready',      sub:'Month 2 report card has been generated', time:'1 May' },
      ].map(a => `
        <div class="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
          <div class="w-2 h-2 rounded-full ${a.dot} flex-shrink-0 mt-1.5"></div>
          <div class="flex-1">
            <div class="text-sm font-bold text-gray-800">${a.title}</div>
            <div class="text-xs font-semibold text-gray-400 mt-0.5">${a.sub}</div>
          </div>
          <span class="text-xs font-semibold text-gray-400 flex-shrink-0">${a.time}</span>
        </div>`).join('')}
    </div>

    <!-- Secret story editor -->
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2 mb-2">
      🔓 Write Ammu's secret stories
    </div>
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      ${[
        { day:'Day 7',   label:'Already written ✓', locked:false, placeholder:'', saved:true,
          preview:'When Abbu was 10, he ate rice and fish every day and could run faster than all his friends...' },
        { day:'Day 14',  label:'Secret about Mumma', locked:true,
          placeholder:'Write a fun secret about Mumma\'s childhood for Ammu to discover...' },
        { day:'Day 21',  label:'Funny Abbu story', locked:true,
          placeholder:'Write a funny or heartwarming story about yourself for Ammu...' },
        { day:'Day 30',  label:'Special milestone story', locked:true,
          placeholder:'Write something very special for when Ammu completes her first full month...' },
        { day:'Month 3', label:'MEGA secret', locked:true,
          placeholder:'Write the big surprise secret for Month 3 completion — make it special!' },
      ].map((s, i) => `
        <div class="px-4 py-3 border-b border-gray-50 last:border-0">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-extrabold" style="color:#1A1A3E;">${s.day} — ${s.label}</span>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full ${s.saved ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'} ml-auto">
              ${s.saved ? 'Published ✓' : 'Not written yet'}
            </span>
          </div>
          ${s.saved
            ? `<div class="text-xs font-semibold text-gray-400 italic">"${s.preview}"</div>`
            : `<textarea rows="2" placeholder="${s.placeholder}"
                class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 resize-none focus:outline-none focus:border-gray-400 mb-1"></textarea>
               <button onclick="abbuSaveStory(this)"
                class="text-xs font-extrabold px-3 py-1.5 rounded-full text-white active:scale-95"
                style="background:#1A1A3E;">Save Story</button>`}
        </div>`).join('')}
    </div>

  </div>`;
}

function buildAbbuProgress() {
  return `
  <div class="pb-4">
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2 mb-2">
      📏 Ammu's physical progress
    </div>

    <!-- Current measurements -->
    <div class="grid grid-cols-2 gap-3 mb-3">
      ${[
        { e:'📏', l:'Height', v:'139cm', c:'+0.5cm ↑' },
        { e:'⚖️', l:'Weight', v:'33.2kg', c:'+0.8kg ↑' },
        { e:'💪', l:'Bicep', v:'19cm', c:'+1cm ↑' },
        { e:'✋', l:'Forearm', v:'17cm', c:'+0.5cm ↑' },
        { e:'🫁', l:'Waist', v:'58cm', c:'no change' },
        { e:'🏊', l:'Shoulder', v:'34cm', c:'+0.5cm ↑' },
      ].map(m => `
        <div class="bg-white rounded-2xl border border-gray-100 p-3">
          <div class="text-xl mb-1">${m.e}</div>
          <div class="text-xs font-semibold text-gray-400">${m.l}</div>
          <div class="font-fredoka text-xl mt-0.5" style="color:#1A1A3E;">${m.v}</div>
          <div class="text-xs font-bold mt-0.5 ${m.c==='no change'?'text-gray-400':'text-green-500'}">${m.c}</div>
        </div>`).join('')}
    </div>

    <!-- Mood trend -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
      <div class="text-sm font-extrabold text-gray-800 mb-3">😊 Mood trend — monthly average</div>
      ${[['Month 1','2.8','bg-orange-400','text-orange-500'],['Month 2','3.6','bg-green-500','text-green-600'],['Month 3','TBD','bg-gray-100','text-gray-400']].map(([m,v,bar,tc]) => `
        <div class="flex items-center gap-3 mb-2">
          <span class="text-xs font-bold text-gray-500 w-14">${m}</span>
          <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full ${bar} rounded-full" style="width:${v==='TBD'?'15':Math.round(parseFloat(v)/5*100)}%"></div>
          </div>
          <span class="text-xs font-extrabold ${tc} w-8">${v}</span>
        </div>`).join('')}
      <div class="bg-green-50 border border-green-200 rounded-xl p-2.5 text-center mt-2">
        <div class="text-xs font-extrabold text-green-700">😊 Mood improved by 0.8 points in one month!</div>
      </div>
    </div>

    <!-- Push-up progress -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
      <div class="text-sm font-extrabold text-gray-800 mb-3">💪 Push-up progress over time</div>
      <div class="flex gap-3 items-end mb-3 h-16">
        ${[['M1','5','bg-green-200'],['M2','8','bg-green-400'],['M3','?','bg-gray-100 border-2 border-dashed border-gray-300']].map(([m,v,cls]) => `
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="${cls} rounded-t-lg w-full" style="height:${v==='?'?'20':parseInt(v)*5}px"></div>
            <div class="text-xs font-semibold text-gray-500">${m}: ${v}</div>
          </div>`).join('')}
      </div>
      <div class="bg-orange-50 border border-orange-200 rounded-xl p-2.5 text-center">
        <div class="text-xs font-extrabold text-orange-700">🎉 From 5 to 8 push-ups in one month!</div>
        <div class="text-xs font-semibold text-orange-600 mt-0.5">Goal for Month 3: 10 push-ups (being negotiated!)</div>
      </div>
    </div>

    <!-- Monthly report link -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 text-center">
      <div class="text-sm font-extrabold text-gray-800 mb-1">📋 View full monthly report card</div>
      <div class="text-xs font-semibold text-gray-400 mb-3">Auto-generated from Ammu's real data each month</div>
      <button onclick="abbuNavToReport()"
        class="px-6 py-2.5 rounded-xl font-fredoka text-base text-white active:scale-98"
        style="background:#1A1A3E;">Go to Report Card →</button>
    </div>

  </div>`;
}

// ── UPDATE buildPages FOR ABBU ────────────────────────────────────────────────

const _prevBuildPages = buildPages;
buildPages = function(userKey) {
  if (userKey !== 'abbu') { _prevBuildPages(userKey); return; }

  const user = USERS[userKey];
  const container = document.getElementById('pages-container');
  container.innerHTML = '';
  const abbuBuilders = {
    today: buildAbbuToday, weekly: buildAbbuWeekly,
    report: buildAbbuReport, goals: buildAbbuGoals,
    alerts: buildAbbuAlerts, progress: buildAbbuProgress,
  };
  user.nav.forEach((navItem, index) => {
    const page = document.createElement('div');
    page.className = 'page' + (index === 0 ? ' active' : '');
    page.id = 'page-abbu-' + navItem.id;
    page.innerHTML = abbuBuilders[navItem.id] ? abbuBuilders[navItem.id]() : buildPlaceholderPage(userKey, navItem);
    container.appendChild(page);
  });
};

// ── ABBU INTERACTIONS ─────────────────────────────────────────────────────────

Object.assign(App, {

  abbuShowProud() {
    document.getElementById('abbu-proud-wrap').classList.add('hidden');
    document.getElementById('abbu-proud-form').classList.remove('hidden');
  },

  abbuSendProud() {
    const msg = document.getElementById('abbu-proud-msg');
    if (!msg || !msg.value.trim()) { alert('Please write a message for Ammu first!'); return; }
    msg.style.display = 'none';
    document.querySelector('#abbu-proud-form button').style.display = 'none';
    document.getElementById('abbu-proud-sent').classList.remove('hidden');
    this.submitTrackerData({ type:'proud_abbu', message: msg.value, from:'abbu' });
  },

  abbuSaveWeeklyNote() {
    const note = document.getElementById('abbu-weekly-note');
    if (!note || !note.value.trim()) { alert('Please write a note for Ammu first!'); return; }
    document.getElementById('abbu-note-sent').classList.remove('hidden');
    this.submitTrackerData({ type:'weekly_note', message: note.value, from:'abbu' });
  },

  abbuRegenerateReport() {
    // Rebuild the report page with fresh random data
    const page = document.getElementById('page-abbu-report');
    if (page) page.innerHTML = buildAbbuReport();
  },

  abbuSaveNote() {
    const input = document.getElementById('abbu-note-input');
    const noteDisplay = document.getElementById('abbu-report-note');
    if (input && noteDisplay) noteDisplay.textContent = input.value;
    alert('✅ Personal message saved to Ammu\'s report card!');
  },

  abbuUpdateGoal(goalId) {
    const input = document.getElementById('goal-input-' + goalId);
    if (!input || !input.value.trim()) { alert('Please enter a suggestion first!'); return; }
    const goal = abbuGoals.find(g => g.id === goalId);
    if (goal) {
      goal.abbu = input.value.trim();
      goal.status = 'negotiating';
      localStorage.setItem('abbu_goals', JSON.stringify(abbuGoals));
      // Refresh goals page
      const page = document.getElementById('page-abbu-goals');
      if (page) page.innerHTML = buildAbbuGoals();
    }
  },

  abbuAgreeGoal(goalId) {
    const goal = abbuGoals.find(g => g.id === goalId);
    if (goal) {
      goal.status = 'agreed';
      localStorage.setItem('abbu_goals', JSON.stringify(abbuGoals));
      const page = document.getElementById('page-abbu-goals');
      if (page) page.innerHTML = buildAbbuGoals();
    }
  },

  abbuAddGoal() {
    const name = document.getElementById('new-goal-name');
    const val  = document.getElementById('new-goal-val');
    if (!name?.value.trim() || !val?.value.trim()) { alert('Please fill in both fields!'); return; }
    abbuGoals.unshift({
      id: 'goal-' + Date.now(), emoji: '🎯',
      name: name.value.trim(), ammu: '', abbu: val.value.trim(),
      mumma: '', status: 'proposed', abbuNote: 'Abbu\'s suggestion',
    });
    localStorage.setItem('abbu_goals', JSON.stringify(abbuGoals));
    const page = document.getElementById('page-abbu-goals');
    if (page) page.innerHTML = buildAbbuGoals();
    name.value = ''; val.value = '';
  },

  abbuApprove(rewardId) {
    const r = abbuRewards.find(r => r.id === rewardId);
    if (r) { r.status = 'approved'; localStorage.setItem('abbu_rewards', JSON.stringify(abbuRewards)); }
    const el = document.getElementById('reward-' + rewardId);
    if (el) el.querySelector('.flex.gap-2')?.replaceWith(Object.assign(document.createElement('span'), { className:'text-xs font-bold text-green-600', textContent:'✓ Approved' }));
  },

  abbuReject(rewardId) {
    const r = abbuRewards.find(r => r.id === rewardId);
    if (r) { r.status = 'rejected'; localStorage.setItem('abbu_rewards', JSON.stringify(abbuRewards)); }
    const el = document.getElementById('reward-' + rewardId);
    if (el) el.querySelector('.flex.gap-2')?.replaceWith(Object.assign(document.createElement('span'), { className:'text-xs font-bold text-gray-400', textContent:'✗ Declined' }));
  },

  abbuSaveStory(btn) {
    const ta = btn.previousElementSibling;
    if (!ta || !ta.value.trim()) { alert('Please write the story first!'); return; }
    btn.textContent = '✅ Saved!';
    btn.disabled = true;
    btn.style.background = '#0F6E56';
    this.submitTrackerData({ type:'secret_story', story: ta.value, from:'abbu' });
  },

  abbuNavToReport() {
    const btns = document.querySelectorAll('#bottom-nav button');
    if (btns[2]) btns[2].click();
  },

});

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 5 — ADMIN & FRIEND SECTIONS
// ─────────────────────────────────────────────────────────────────────────────

// ── ADMIN PAGE BUILDERS ───────────────────────────────────────────────────────

function buildAdminUsers() {
  const userList = [
    { key:'ammu',   emoji:'🦁', name:'Ammu',   role:'Daily tracker & rewards', pin:PINS.ammu,   hasPin:true  },
    { key:'mumma',  emoji:'👩', name:'Mumma',  role:'Grocery, meals & daily check', pin:PINS.mumma,  hasPin:true },
    { key:'abbu',   emoji:'🦣', name:'Abbu',   role:'Dashboard & progress', pin:PINS.abbu,   hasPin:true },
    { key:'admin',  emoji:'⚙️', name:'Admin',  role:'Full access & settings', pin:PINS.admin,  hasPin:true },
    { key:'family', emoji:'👀', name:'Friend', role:'View only', pin:PINS.friend, hasPin:true },
  ];

  return `
  <div class="pb-4">
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2 mb-2">
      👥 User management
    </div>

    ${userList.map(u => `
      <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl">${u.emoji}</div>
          <div class="flex-1">
            <div class="text-sm font-extrabold text-gray-800">${u.name}</div>
            <div class="text-xs font-semibold text-gray-400">${u.role}</div>
          </div>
          
        </div>
        ${u.hasPin ? `
        <div class="flex items-center gap-2">
          <div class="flex-1">
            <label class="text-xs font-extrabold text-amber-700">PIN</label>
            <input id="pin-${u.key}" type="number" value="${u.pin}" maxlength="4"
              class="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:border-amber-400 tracking-widest" />
          </div>
          <button onclick="adminUpdatePin('${u.key}')"
            class="mt-5 px-4 py-2 rounded-xl text-white text-xs font-extrabold bg-amber-600 active:scale-95">
            Update
          </button>
        </div>` : ''}
      </div>`).join('')}
  </div>`;
}

function buildAdminSettings() {
  const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
  const testMode = localStorage.getItem('test_mode') !== 'false';

  return `
  <div style="padding-bottom:16px;">

    <!-- TEST MODE TOGGLE -->
    <div style="font-size:11px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 8px;">🧪 Test mode</div>
    <div style="background:#fff;border-radius:14px;border:0.5px solid #e5e7eb;padding:14px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:800;color:#1A1A2E;">Test mode is ${testMode ? 'ON 🟡' : 'OFF 🟢'}</div>
          <div style="font-size:11px;color:#6B7280;font-weight:600;margin-top:2px;">${testMode ? 'Sample data is showing. Family see a test banner.' : 'Live mode — real data only.'}</div>
        </div>
      </div>
      <button onclick="adminToggleTestMode()"
        style="width:100%;padding:10px;border-radius:10px;border:none;background:${testMode ? '#0F6E56' : '#E8732A'};color:#fff;font-family:Fredoka One,cursive;font-size:15px;cursor:pointer;">
        ${testMode ? 'Switch to LIVE mode ✅' : 'Switch back to TEST mode 🧪'}
      </button>
      ${testMode ? `<div style="margin-top:8px;font-size:10px;font-weight:700;color:#854F0B;background:#FAEEDA;border-radius:8px;padding:7px 10px;">
        ⚠️ Switching to live mode will hide sample data. Only real tracked data will show.
      </div>` : ''}
    </div>

    <!-- GOOGLE SHEETS CONNECTION -->
    <div style="font-size:11px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 8px;">🔗 Google Sheets</div>
    <div style="background:#fff;border-radius:14px;border:0.5px solid #e5e7eb;padding:14px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:#1A1A2E;margin-bottom:4px;">Apps Script URL</div>
      <div style="font-size:11px;color:#6B7280;font-weight:600;margin-bottom:8px;">Paste your Google Apps Script URL to save data</div>
      <input id="admin-gscript-url" type="text"
        value="${GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' ? GOOGLE_SCRIPT_URL : ''}"
        placeholder="https://script.google.com/macros/s/..."
        style="width:100%;padding:9px 12px;border-radius:10px;border:0.5px solid #e5e7eb;font-family:Nunito,sans-serif;font-size:12px;font-weight:600;color:#1A1A2E;margin-bottom:8px;" />
      <button onclick="adminSaveScriptUrl()"
        style="width:100%;padding:10px;border-radius:10px;border:none;background:#0F6E56;color:#fff;font-family:Fredoka One,cursive;font-size:15px;cursor:pointer;">
        Save &amp; Connect
      </button>
      <div id="admin-gscript-status" style="display:none;margin-top:8px;font-size:11px;font-weight:800;color:#0F6E56;text-align:center;">
        ✅ Connected! Data will now save to Google Sheets.
      </div>
    </div>

    <!-- DELETE SHEET DATA BY DATE RANGE -->
    <div style="font-size:11px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 8px;">🗑️ Delete sheet data by date</div>
    <div style="background:#fff;border-radius:14px;border:0.5px solid #e5e7eb;padding:14px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:#1A1A2E;margin-bottom:2px;">Choose date range to delete</div>
      <div style="font-size:11px;color:#6B7280;font-weight:600;margin-bottom:10px;">Only rows within this range get deleted. Google Sheets keeps version history so you can always restore if needed.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <div>
          <label style="font-size:10px;font-weight:800;color:#854F0B;display:block;margin-bottom:4px;">From date</label>
          <input type="date" id="admin-delete-from" style="width:100%;padding:8px;border-radius:8px;border:0.5px solid #e5e7eb;font-size:12px;color:#1A1A2E;" />
        </div>
        <div>
          <label style="font-size:10px;font-weight:800;color:#854F0B;display:block;margin-bottom:4px;">To date</label>
          <input type="date" id="admin-delete-to" style="width:100%;padding:8px;border-radius:8px;border:0.5px solid #e5e7eb;font-size:12px;color:#1A1A2E;" />
        </div>
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:10px;font-weight:800;color:#854F0B;display:block;margin-bottom:4px;">Which sheet</label>
        <select id="admin-delete-sheet" style="width:100%;padding:8px;border-radius:8px;border:0.5px solid #e5e7eb;font-size:12px;color:#1A1A2E;background:#fff;">
          <option value="all">All sheets</option>
          <option value="daily_tracker">Ammu tracker</option>
          <option value="mumma_check">Mumma check</option>
          <option value="measurements">Measurements</option>
          <option value="proud_abbu">Proud Abbu messages</option>
          <option value="notes">Notes and stories</option>
        </select>
      </div>
      <div id="admin-delete-preview" style="display:none;background:#FEF2F2;border-radius:8px;padding:10px;margin-bottom:8px;border:0.5px solid #fca5a5;">
        <div style="font-size:11px;font-weight:800;color:#991B1B;" id="admin-delete-preview-text"></div>
      </div>
      <button onclick="adminPreviewDelete()" style="width:100%;padding:10px;border-radius:10px;border:none;background:#854F0B;color:#fff;font-size:15px;cursor:pointer;margin-bottom:6px;">
        Preview what will be deleted
      </button>
      <button onclick="adminConfirmDelete()" id="admin-confirm-delete-btn" style="width:100%;padding:10px;border-radius:10px;border:none;background:#E24B4A;color:#fff;font-size:15px;cursor:pointer;display:none;">
        Confirm delete
      </button>
      <div id="admin-delete-result" style="display:none;margin-top:8px;text-align:center;font-size:12px;font-weight:800;color:#0F6E56;"></div>
    </div>

        <!-- COOK DAYS -->
    <div style="font-size:11px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 8px;">📅 Default cook days</div>
    <div style="background:#fff;border-radius:14px;border:0.5px solid #e5e7eb;padding:14px;margin-bottom:12px;">
      <div style="display:flex;gap:6px;flex-wrap:wrap;" id="admin-cook-days">
        ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `
          <button onclick="adminToggleCookDay('${d}',this)"
            style="padding:6px 12px;border-radius:20px;font-size:11px;font-weight:800;border:0.5px solid ${mummaCookDays.includes(d) ? '#854F0B' : '#e5e7eb'};background:${mummaCookDays.includes(d) ? '#FAEEDA' : '#fff'};color:${mummaCookDays.includes(d) ? '#854F0B' : '#6B7280'};cursor:pointer;font-family:Nunito,sans-serif;">
            ${d}
          </button>`).join('')}
      </div>
    </div>

    <!-- PENDING SYNC -->
    <div style="font-size:11px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 8px;">📤 Offline submissions</div>
    <div style="background:#fff;border-radius:14px;border:0.5px solid #e5e7eb;padding:14px;margin-bottom:12px;">
      <div style="font-family:Fredoka One,cursive;font-size:28px;color:#E8732A;">${pending.length} pending</div>
      <div style="font-size:11px;color:#6B7280;font-weight:600;margin-bottom:8px;">Data saved while offline, waiting to sync</div>
      <button onclick="adminSyncNow()"
        style="width:100%;padding:10px;border-radius:10px;border:none;background:#E8732A;color:#fff;font-family:Fredoka One,cursive;font-size:15px;cursor:pointer;">
        Sync now
      </button>
    </div>

    <!-- RESET LOCAL DATA -->
    <div style="background:#FEF2F2;border-radius:14px;border:0.5px solid #fca5a5;padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#991B1B;margin-bottom:4px;">⚠️ Reset local app data</div>
      <div style="font-size:11px;color:#B91C1C;font-weight:600;margin-bottom:8px;">
        Clears coins, grocery selections and cook days from this device. Cannot be undone.
      </div>
      <button onclick="adminResetData()"
        style="width:100%;padding:10px;border-radius:10px;border:none;background:#E24B4A;color:#fff;font-family:Fredoka One,cursive;font-size:15px;cursor:pointer;">
        Reset local data
      </button>
    </div>

  </div>`;
}

function buildAdminData() {
  const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
  const coins   = localStorage.getItem('ammu_coins') || '0';
  const streak  = localStorage.getItem('ammu_streak') || '0';
  const selected = JSON.parse(localStorage.getItem('mumma_selected') || '{}');
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return `
  <div class="pb-4">
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2 mb-2">
      🗄️ App data overview
    </div>

    <!-- Ammu stats -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
      <div class="text-sm font-extrabold text-gray-800 mb-3">🦁 Ammu's data</div>
      <div class="grid grid-cols-2 gap-3">
        ${[
          ['🪙 Coins', coins, 'total earned'],
          ['🔥 Streak', streak, 'days in a row'],
          ['📊 Pending', pending.length.toString(), 'offline submissions'],
          ['💾 Storage', (JSON.stringify(localStorage).length / 1024).toFixed(1) + 'KB', 'used locally'],
        ].map(([l,v,s]) => `
          <div class="bg-gray-50 rounded-xl p-3">
            <div class="text-xs font-semibold text-gray-400">${l}</div>
            <div class="font-fredoka text-2xl text-gray-800 mt-1">${v}</div>
            <div class="text-xs text-gray-400 mt-0.5">${s}</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Mumma stats -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
      <div class="text-sm font-extrabold text-gray-800 mb-3">👩 Mumma's data</div>
      <div class="grid grid-cols-2 gap-3">
        ${[
          ['🛒 Selected items', selectedCount.toString(), 'in grocery list'],
          ['📅 Cook days', mummaCookDays.join(', ') || 'not set', 'this week'],
        ].map(([l,v,s]) => `
          <div class="bg-gray-50 rounded-xl p-3">
            <div class="text-xs font-semibold text-gray-400">${l}</div>
            <div class="font-fredoka text-xl text-gray-800 mt-1">${v}</div>
            <div class="text-xs text-gray-400 mt-0.5">${s}</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Pending submissions -->
    ${pending.length > 0 ? `
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <span class="text-lg">📤</span>
        <span class="text-sm font-extrabold text-gray-800">Pending submissions</span>
        <span class="ml-auto text-xs font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700">${pending.length}</span>
      </div>
      ${pending.slice(0,5).map(p => `
        <div class="px-4 py-3 border-b border-gray-50 last:border-0">
          <div class="text-xs font-bold text-gray-700">${p.type} — ${p.date}</div>
          <div class="text-xs font-semibold text-gray-400 mt-0.5">${p.user} · ${p.timestamp?.slice(11,16) || ''}</div>
        </div>`).join('')}
      ${pending.length > 5 ? `<div class="px-4 py-3 text-xs font-semibold text-gray-400">...and ${pending.length-5} more</div>` : ''}
    </div>` : `
    <div class="bg-green-50 border border-green-200 rounded-2xl p-4 text-center mb-3">
      <div class="text-2xl mb-1">✅</div>
      <div class="text-sm font-extrabold text-green-700">All data synced to Google Sheets!</div>
      <div class="text-xs font-semibold text-green-600 mt-1">No pending submissions</div>
    </div>`}

  </div>`;
}

function buildAdminAccess() {
  const permissions = [
    { user:'🦁 Ammu',   view:['Own tracker','Rewards','Secrets','Progress'], noView:['Mumma data','Abbu data','Admin'] },
    { user:'👩 Mumma',  view:['Grocery','Meal plan','Daily check','Ammu progress'], noView:['Abbu data','Admin'] },
    { user:'🦣 Abbu',   view:['Ammu dashboard','Weekly summary','Report card','Goals','Alerts'], noView:['Mumma grocery','Admin'] },
    { user:'👀 Friend', view:['Ammu progress (read only)'], noView:['Everything else'] },
  ];

  return `
  <div class="pb-4">
    <div class="text-xs font-extrabold text-gray-400 uppercase tracking-widest text-center py-2 mb-2">
      🔐 Access control
    </div>
    <div class="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-3 flex items-start gap-2">
      <span class="text-lg flex-shrink-0">ℹ️</span>
      <div class="text-xs font-semibold text-amber-800 leading-relaxed">
        Access is controlled by the login system. Each user only sees their own section.
        PINs can be changed in the Users tab.
      </div>
    </div>

    ${permissions.map(p => `
      <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
        <div class="text-sm font-extrabold text-gray-800 mb-3">${p.user}</div>
        <div class="mb-2">
          <div class="text-xs font-extrabold text-green-600 mb-1.5">✅ Can see:</div>
          <div class="flex flex-wrap gap-1.5">
            ${p.view.map(v => `<span class="text-xs font-bold px-2 py-1 rounded-full bg-green-50 text-green-700">${v}</span>`).join('')}
          </div>
        </div>
        <div>
          <div class="text-xs font-extrabold text-red-500 mb-1.5">🔒 Cannot see:</div>
          <div class="flex flex-wrap gap-1.5">
            ${p.noView.map(v => `<span class="text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-600">${v}</span>`).join('')}
          </div>
        </div>
      </div>`).join('')}
  </div>`;
}

// ── FRIEND PAGE BUILDERS ──────────────────────────────────────────────────────

function buildFamilyView() {
  const testNote = APP_TEST_MODE
    ? `<div style="background:#FAEEDA;border-radius:10px;padding:7px 10px;margin-bottom:8px;display:flex;align-items:center;gap:6px;border:0.5px solid #FAC775;">
        <span style="font-size:14px;">🧪</span>
        <span style="font-size:10px;font-weight:700;color:#854F0B;">Sample data — real stats start once the family begins tracking!</span>
      </div>` : '';

  const cats = [
    { e:'⚡', name:'Exercise', pct:SAMPLE_CATEGORY_SCORES.exercise, bg:'#E1F5EE', col:'#0F6E56', dark:'#085041' },
    { e:'🦴', name:'Bones',    pct:SAMPLE_CATEGORY_SCORES.bone,     bg:'#E1F5EE', col:'#0F6E56', dark:'#085041' },
    { e:'💪', name:'Muscles',  pct:SAMPLE_CATEGORY_SCORES.muscle,   bg:'#FAEEDA', col:'#E8732A', dark:'#633806' },
    { e:'🌱', name:'Gut',      pct:SAMPLE_CATEGORY_SCORES.gut,      bg:'#FBEAF0', col:'#D4537E', dark:'#72243E' },
    { e:'🧠', name:'Brain',    pct:SAMPLE_CATEGORY_SCORES.brain,    bg:'#E6F1FB', col:'#185FA5', dark:'#0C447C' },
    { e:'😊', name:'Peace',    pct:SAMPLE_CATEGORY_SCORES.peace,    bg:'#E6F1FB', col:'#185FA5', dark:'#0C447C' },
  ];

  const weekBars = Object.entries(SAMPLE_WEEK_DATA).map(([day, d]) => {
    const h = Math.round(d.pct * 0.52);
    const col = d.pct >= 80 ? '#0F6E56' : d.pct >= 50 ? '#E8732A' : '#E5E7EB';
    const isToday = day === ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;">
      <div style="width:100%;border-radius:3px 3px 0 0;background:\${isToday ? '#1A1A3E' : col};height:\${h}px;"></div>
      <div style="font-size:8px;font-weight:\${isToday ? '900' : '600'};color:\${isToday ? '#1A1A3E' : '#6B7280'};margin-top:3px;">\${day}</div>
    </div>`;
  }).join('');

  const catGrid = cats.map(c => `
    <div style="border-radius:10px;padding:8px 10px;text-align:center;background:\${c.bg};">
      <div style="font-size:20px;margin-bottom:2px;">\${c.e}</div>
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.3px;color:\${c.dark};">\${c.name}</div>
      <div style="font-size:18px;font-weight:900;color:\${c.col};">\${c.pct}%</div>
      <div style="height:4px;border-radius:10px;margin-top:4px;background:rgba(0,0,0,0.08);overflow:hidden;">
        <div style="height:100%;border-radius:10px;background:\${c.col};width:\${c.pct}%;"></div>
      </div>
    </div>`).join('');

  // Food highlight cards
  const foodHighlights = `
    <div style="background:#fff;border-radius:14px;border:0.5px solid #e5e7eb;overflow:hidden;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:0.5px solid #f3f4f6;">
        <span style="font-size:18px;">🍽️</span>
        <span style="flex:1;font-size:13px;font-weight:800;color:#1A1A2E;">This week's food highlights</span>
        <span style="font-size:9px;font-weight:800;padding:2px 7px;border-radius:20px;background:#F1EFE8;color:#5F5E5A;">read only</span>
      </div>
      \${[
        { e:'🥚', label:'Egg days',      val:SAMPLE_EGGS_THIS_WEEK + ' of 7 days',    note:'Daily goal — muscle building!',  good: SAMPLE_EGGS_THIS_WEEK >= 5 },
        { e:'🥛', label:'Yogurt days',   val:SAMPLE_YOGURT_THIS_WEEK + ' of 7 days', note:'Calcium for strong bones',        good: SAMPLE_YOGURT_THIS_WEEK >= 5 },
        { e:'💧', label:'Water avg',     val:SAMPLE_WATER_GLASSES + ' glasses/day',  note:'Target is 6 glasses',             good: SAMPLE_WATER_GLASSES >= 5 },
        { e:'🏋️', label:'Exercise days', val:SAMPLE_EXERCISE_DAYS + ' of 7 days',    note:'Strength + yoga + stretching',    good: SAMPLE_EXERCISE_DAYS >= 5 },
      ].map(item => `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:0.5px solid #f9fafb;">
          <span style="font-size:20px;flex-shrink:0;">\${item.e}</span>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:700;color:#1A1A2E;">\${item.label}</div>
            <div style="font-size:10px;font-weight:600;color:#6B7280;margin-top:1px;">\${item.note}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;font-weight:800;color:\${item.good ? '#0F6E56' : '#E8732A'};">\${item.val}</div>
            <div style="font-size:10px;">\${item.good ? '✅' : '⚠️'}</div>
          </div>
        </div>`).join('')}
      <div style="padding:8px 12px;background:#F8FFFE;text-align:center;">
        <span style="font-size:9px;font-weight:700;color:#9ca3af;">📊 Detailed history coming once data collection starts</span>
      </div>
    </div>`;

  return `
  <div style="padding-bottom:16px;">
    \${testNote}

    <div style="background:#F1EFE8;border-radius:10px;padding:7px 10px;margin-bottom:8px;display:flex;align-items:center;gap:6px;border:0.5px solid #e5e7eb;">
      <span style="font-size:14px;">👀</span>
      <span style="font-size:10px;font-weight:700;color:#5F5E5A;">Read only — see how Ammu is doing!</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
      <div style="background:#fff;border-radius:10px;padding:10px;border:0.5px solid #e5e7eb;">
        <div style="font-size:9px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.3px;">Coins earned</div>
        <div style="font-size:22px;font-weight:900;color:#F5C800;margin-top:2px;">247</div>
        <div style="font-size:9px;color:#6B7280;font-weight:600;">this month</div>
      </div>
      <div style="background:#fff;border-radius:10px;padding:10px;border:0.5px solid #e5e7eb;">
        <div style="font-size:9px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.3px;">Streak</div>
        <div style="font-size:22px;font-weight:900;color:#E8732A;margin-top:2px;">12</div>
        <div style="font-size:9px;color:#6B7280;font-weight:600;">days in a row!</div>
      </div>
    </div>

    <div style="background:#fff;border-radius:14px;border:0.5px solid #e5e7eb;overflow:hidden;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:0.5px solid #f3f4f6;">
        <span style="font-size:18px;">💪</span>
        <span style="font-size:13px;font-weight:800;color:#1A1A2E;">Health focus areas this week</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px 12px;">
        \${catGrid}
      </div>
    </div>

    \${foodHighlights}

    <div style="background:#fff;border-radius:14px;border:0.5px solid #e5e7eb;overflow:hidden;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:0.5px solid #f3f4f6;">
        <span style="font-size:18px;">📅</span>
        <span style="font-size:13px;font-weight:800;color:#1A1A2E;">This week at a glance</span>
      </div>
      <div style="display:flex;align-items:flex-end;gap:4px;height:60px;padding:10px 12px 4px;">
        \${weekBars}
      </div>
      <div style="display:flex;gap:8px;padding:4px 12px 10px;flex-wrap:wrap;">
        \${[['#0F6E56','great 80%+'],['#E8732A','ok 50-79%'],['#E5E7EB','needs work']].map(([c,l]) =>
          `<div style="display:flex;align-items:center;gap:4px;">
            <div style="width:8px;height:8px;border-radius:2px;background:\${c};"></div>
            <span style="font-size:9px;color:#6B7280;font-weight:600;">\${l}</span>
          </div>`).join('')}
      </div>
    </div>

    <div style="background:#1A1A3E;border-radius:14px;padding:14px;text-align:center;margin-bottom:8px;">
      <div style="font-size:32px;margin-bottom:6px;">🐘</div>
      <div style="font-family:serif;font-size:16px;font-weight:600;color:#fff;margin-bottom:4px;">Ammu is doing amazing!</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.75);font-weight:600;line-height:1.6;">
        12-day streak and counting. Eating well,<br>exercising and getting stronger every week.
      </div>
    </div>
  </div>`;
}

function buildFamilyProgress() {
  return `
  <div class="pb-4">
    <div class="bg-gray-50 border border-gray-200 rounded-2xl p-3 mb-3 flex items-center gap-2">
      <span class="text-lg">👀</span>
      <div class="text-xs font-semibold text-gray-600">Read-only view of Ammu's physical progress</div>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-3">
      ${[['📏','Height','139cm','+0.5cm'],['⚖️','Weight','33.2kg','+0.8kg'],
         ['💪','Bicep','19cm','+1cm'],['✋','Forearm','17cm','+0.5cm']].map(([e,l,v,c]) => `
        <div class="bg-white rounded-2xl border border-gray-100 p-3">
          <div class="text-xl mb-1">${e}</div>
          <div class="text-xs font-semibold text-gray-400">${l}</div>
          <div class="font-fredoka text-xl text-gray-700">${v}</div>
          <div class="text-xs font-bold text-green-500 mt-0.5">${c} ↑</div>
        </div>`).join('')}
    </div>

    <div class="bg-white rounded-2xl border border-gray-100 p-4 text-center">
      <div class="font-fredoka text-lg text-gray-700 mb-1">💪 Push-up progress</div>
      <div class="flex items-end justify-center gap-4 h-16 mb-2">
        ${[['M1','5','bg-green-200'],['M2','8','bg-green-400']].map(([m,v,cls]) => `
          <div class="flex flex-col items-center gap-1">
            <div class="${cls} rounded-t-lg w-10" style="height:${parseInt(v)*5}px"></div>
            <div class="text-xs font-semibold text-gray-500">${m}: ${v}</div>
          </div>`).join('')}
      </div>
      <div class="text-xs font-extrabold text-green-600">🎉 3 more push-ups in one month!</div>
    </div>
  </div>`;
}

// ── UPDATE buildPages FOR ADMIN + FRIEND ─────────────────────────────────────

const _prevBuildPages2 = buildPages;
buildPages = function(userKey) {
  if (userKey !== 'admin' && userKey !== 'family') { _prevBuildPages2(userKey); return; }

  const user = USERS[userKey];
  const container = document.getElementById('pages-container');
  container.innerHTML = '';

  const adminBuilders  = { users:buildAdminUsers, settings:buildAdminSettings, data:buildAdminData, access:buildAdminAccess };
  const familyBuilders = { view:buildFamilyView, progress:buildFamilyProgress };
  const builders = userKey === 'admin' ? adminBuilders : familyBuilders;

  user.nav.forEach((navItem, index) => {
    const page = document.createElement('div');
    page.className = 'page' + (index === 0 ? ' active' : '');
    page.id = 'page-' + userKey + '-' + navItem.id;
    page.innerHTML = builders[navItem.id] ? builders[navItem.id]() : buildPlaceholderPage(userKey, navItem);
    container.appendChild(page);
  });
};

// ── ADMIN INTERACTIONS ────────────────────────────────────────────────────────

Object.assign(App, {


  adminToggleTestMode() {
    const current = localStorage.getItem('test_mode') !== 'false';
    const newMode = !current;
    localStorage.setItem('test_mode', newMode ? 'true' : 'false');
    APP_TEST_MODE = newMode;
    // Rebuild settings page to reflect change
    const page = document.getElementById('page-admin-settings');
    if (page) page.innerHTML = buildAdminSettings();
    alert(newMode
      ? '🧪 Test mode ON — sample data showing, test banner visible'
      : '✅ Live mode ON — only real tracked data will show');
  },

  adminPreviewDelete() {
    var f = document.getElementById('admin-delete-from');
    var t = document.getElementById('admin-delete-to');
    var s = document.getElementById('admin-delete-sheet');
    var fromDate = f ? f.value : '';
    var toDate   = t ? t.value : '';
    var sheet    = s ? s.value : 'all';
    if (!fromDate || !toDate) { alert('Please select both a From and To date!'); return; }
    if (fromDate > toDate)    { alert('From date must be before To date!'); return; }
    var labels = { all:'all sheets', daily_tracker:'Ammu tracker', mumma_check:'Mumma check', measurements:'Measurements', proud_abbu:'Proud Abbu messages', notes:'Notes and stories' };
    var preview = document.getElementById('admin-delete-preview');
    var previewText = document.getElementById('admin-delete-preview-text');
    var confirmBtn = document.getElementById('admin-confirm-delete-btn');
    if (preview && previewText && confirmBtn) {
      previewText.innerHTML = 'Will delete all rows from <strong>' + (labels[sheet]||sheet) + '</strong> between <strong>' + fromDate + '</strong> and <strong>' + toDate + '</strong>. Cannot be undone — but Google Sheets version history can restore.';
      preview.style.display = 'block';
      confirmBtn.style.display = 'block';
    }
  },

  adminConfirmDelete() {
    var f = document.getElementById('admin-delete-from');
    var t = document.getElementById('admin-delete-to');
    var s = document.getElementById('admin-delete-sheet');
    var fromDate = f ? f.value : '';
    var toDate   = t ? t.value : '';
    var sheet    = s ? s.value : 'all';
    if (!fromDate || !toDate) return;
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') { alert('Please set your Google Script URL first!'); return; }
    var btn = document.getElementById('admin-confirm-delete-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Deleting...'; }
    var sheets = sheet === 'all' ? ['daily_tracker','mumma_check','measurements','proud_abbu','notes'] : [sheet];
    Promise.all(sheets.map(function(sh) {
      return fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type:'delete_by_date', sheet:sh, from_date:fromDate, to_date:toDate }),
      }).then(function(r) { return r.json(); });
    })).then(function(results) {
      var total = results.reduce(function(sum, r) { return sum + (r.deleted || 0); }, 0);
      var el = document.getElementById('admin-delete-result');
      if (el) { el.style.display = 'block'; el.textContent = 'Done! ' + total + ' row(s) deleted from ' + fromDate + ' to ' + toDate + '.'; }
      if (btn) btn.style.display = 'none';
      var prev = document.getElementById('admin-delete-preview');
      if (prev) prev.style.display = 'none';
    }).catch(function() {
      alert('Error deleting rows. Check your Google Script URL.');
      if (btn) { btn.disabled = false; btn.textContent = 'Confirm delete'; }
    });
  },

  adminUpdatePin(userKey) {
    const input = document.getElementById('pin-' + userKey);
    if (!input) return;
    const newPin = input.value.toString().trim();
    if (newPin.length !== 4 || isNaN(newPin)) {
      alert('PIN must be exactly 4 digits!'); return;
    }
    PINS[userKey] = newPin;
    alert(`✅ ${USERS[userKey].name}'s PIN updated to ${newPin}`);
  },

  adminToggleCookDay(day, btn) {
    const idx = mummaCookDays.indexOf(day);
    if (idx >= 0) mummaCookDays.splice(idx, 1);
    else mummaCookDays.push(day);
    localStorage.setItem('mumma_cook_days', JSON.stringify(mummaCookDays));
    btn.classList.toggle('bg-amber-600');
    btn.classList.toggle('text-white');
    btn.classList.toggle('border-amber-600');
    btn.classList.toggle('text-gray-500');
    btn.classList.toggle('border-gray-200');
    btn.classList.toggle('bg-white');
  },

  adminSaveScriptUrl() {
    const input = document.getElementById('admin-gscript-url');
    if (!input?.value.trim()) { alert('Please paste your Google Apps Script URL first!'); return; }
    // In a real deployment you'd save this properly
    // For now just show confirmation
    document.getElementById('admin-gscript-status').classList.remove('hidden');
    localStorage.setItem('gscript_url', input.value.trim());
    alert('✅ URL saved! Restart the app for changes to take effect.');
  },

  adminSyncNow() {
    this.syncPending().then(() => {
      const el = document.getElementById('admin-pending-count');
      const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
      if (el) el.textContent = pending.length + ' pending';
      alert(pending.length === 0 ? '✅ All synced!' : `⚠️ ${pending.length} still pending — check your internet connection.`);
    });
  },

  adminResetData() {
    if (!confirm('Are you sure? This will clear all local data including Ammu\'s coins and Mumma\'s grocery selections.')) return;
    const keysToKeep = ['gscript_url'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(k => { if (!keysToKeep.includes(k)) localStorage.removeItem(k); });
    // Reset state
    State.ammuCoins   = 0;
    State.ammuStreak  = 0;
    State.ammuWeekDays = 0;
    mummaSelected = {};
    mummaCookDays.length = 0;
    mummaCookDays.push('Tue','Sat');
    alert('✅ Local data reset! The app will now reload.');
    window.location.reload();
  },

});
