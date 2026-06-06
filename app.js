/* ============================================================================
   AMMU'S HEALTH APP — app.js
   Module 1: Shell (login, PIN, screen switching, clocks, nav)

   ARCHITECTURE NOTE:
   All functions are PLAIN GLOBAL FUNCTIONS (function foo(){}), never wrapped
   in an object. This guarantees onclick="foo()" works on every browser,
   including strict mobile Chrome. This was the root cause of earlier failures.
   No escaped backticks anywhere. State is a single global object.
   ============================================================================ */

'use strict';

/* ─── CONFIG ─────────────────────────────────────────────────────────────── */

var GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

var PINS = {
  ammu:   '2015',
  mumma:  '2468',
  abbu:   '2311',
  admin:  '2006',
  family: '1234'
};

var USERS = {
  ammu:   { name: 'Ammu',   mascot: '🦁', avatar: '🦁', avatarBg: '#E1F5EE', headerBg: '#0F6E56', accent: 'green',
            nav: [ {id:'home',icon:'🏠',label:'Home'}, {id:'tracker',icon:'✅',label:'Tracker'}, {id:'rewards',icon:'🪙',label:'Rewards'}, {id:'secrets',icon:'🔓',label:'Secrets'}, {id:'progress',icon:'📏',label:'Progress'} ] },
  mumma:  { name: 'Mumma',  mascot: '🌸', avatar: '👩', avatarBg: '#E6F1FB', headerBg: '#185FA5', accent: 'blue',
            nav: [ {id:'home',icon:'🏠',label:'Home'}, {id:'grocery',icon:'🛒',label:'Grocery'}, {id:'meals',icon:'🍽️',label:'Meals'}, {id:'check',icon:'✅',label:'Check'}, {id:'progress',icon:'📈',label:'Progress'} ] },
  abbu:   { name: 'Abbu',   mascot: '🦣', avatar: '🦣', avatarBg: '#EEEDFE', headerBg: '#1A1A3E', accent: 'navy',
            nav: [ {id:'today',icon:'📊',label:'Today'}, {id:'weekly',icon:'📈',label:'Weekly'}, {id:'report',icon:'📋',label:'Report'}, {id:'goals',icon:'🎯',label:'Goals'}, {id:'alerts',icon:'🔔',label:'Alerts'}, {id:'progress',icon:'📏',label:'Progress'} ] },
  admin:  { name: 'Admin',  mascot: '⚙️', avatar: '⚙️', avatarBg: '#FAEEDA', headerBg: '#854F0B', accent: 'amber',
            nav: [ {id:'users',icon:'👥',label:'Users'}, {id:'settings',icon:'⚙️',label:'Settings'}, {id:'data',icon:'🗄️',label:'Data'}, {id:'access',icon:'🔐',label:'Access'} ] },
  family: { name: 'Family', mascot: '👨‍👩‍👧', avatar: '👨‍👩‍👧', avatarBg: '#F1EFE8', headerBg: '#5F5E5A', accent: 'gray',
            nav: [ {id:'view',icon:'👁️',label:'View'}, {id:'progress',icon:'📊',label:'Progress'} ] }
};

/* ─── STATE ──────────────────────────────────────────────────────────────── */

var State = {
  activeUser:   null,
  pendingUser:  null,
  pinBuffer:    '',
  clockTimer:   null,
  activePageId: null
};

/* ─── SCREEN / PAGE SWITCHING ────────────────────────────────────────────── */

function showScreen(id) {
  var screens = document.querySelectorAll('.screen');
  for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function showPage(pageId) {
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) pages[i].classList.remove('active');
  var el = document.getElementById('page-' + pageId);
  if (el) { el.classList.add('active'); State.activePageId = pageId; }
}

/* ─── LOGIN BUTTONS ──────────────────────────────────────────────────────── */

function buildLoginButtons() {
  var order = ['ammu', 'mumma', 'abbu', 'admin', 'family'];
  var roles = {
    ammu:   'Daily tracker & rewards',
    mumma:  'Grocery, meals & daily check',
    abbu:   'Dashboard & progress',
    admin:  'Full access & settings',
    family: 'Family view'
  };
  var container = document.getElementById('login-buttons');
  if (!container) return;
  var html = '';
  for (var i = 0; i < order.length; i++) {
    var key = order[i];
    var u = USERS[key];
    html += '<button onclick="goPin(\'' + key + '\')" style="display:flex; align-items:center; gap:14px; width:100%; padding:14px 16px; margin-bottom:10px; border-radius:16px; border:1px solid #E5E7EB; background:#fff; cursor:pointer; font-family:inherit; text-align:left;">'
         +    '<div style="width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; background:' + u.avatarBg + ';">' + u.avatar + '</div>'
         +    '<div style="flex:1;">'
         +      '<div style="font-size:15px; font-weight:800; color:#111827;">' + u.name + '</div>'
         +      '<div style="font-size:11px; color:#9CA3AF; font-weight:600; margin-top:2px;">' + roles[key] + '</div>'
         +    '</div>'
         +    '<svg width="16" height="16" fill="none" stroke="#9CA3AF" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>'
         +  '</button>';
  }
  container.innerHTML = html;
}

/* ─── PIN SYSTEM ─────────────────────────────────────────────────────────── */

function goPin(userKey) {
  State.pendingUser = userKey;
  State.pinBuffer = '';
  var u = USERS[userKey];
  var av = document.getElementById('pin-avatar');
  if (av) { av.textContent = u.avatar; av.style.background = u.avatarBg; }
  var title = document.getElementById('pin-title');
  if (title) title.textContent = u.name + "'s PIN";
  var err = document.getElementById('pin-error');
  if (err) err.style.opacity = '0';
  updatePinDots();
  showScreen('screen-pin');
}

function goLogin() {
  if (State.clockTimer) { clearInterval(State.clockTimer); State.clockTimer = null; }
  State.activeUser = null;
  State.pinBuffer = '';
  updatePinDots();
  showScreen('screen-login');
}

function pk(digit) {
  if (State.pinBuffer.length >= 4) return;
  State.pinBuffer += digit;
  updatePinDots();
  if (State.pinBuffer.length === 4) setTimeout(checkPin, 200);
}

function pdel() {
  State.pinBuffer = State.pinBuffer.slice(0, -1);
  updatePinDots();
  var err = document.getElementById('pin-error');
  if (err) err.style.opacity = '0';
}

function updatePinDots() {
  for (var i = 0; i < 4; i++) {
    var dot = document.getElementById('pd-' + i);
    if (!dot) continue;
    if (i < State.pinBuffer.length) {
      dot.style.background = '#0F6E56';
      dot.style.borderColor = '#0F6E56';
    } else {
      dot.style.background = '#fff';
      dot.style.borderColor = '#D1D5DB';
    }
  }
}

function checkPin() {
  if (State.pinBuffer === PINS[State.pendingUser]) {
    loadUser(State.pendingUser);
  } else {
    var err = document.getElementById('pin-error');
    if (err) err.style.opacity = '1';
    State.pinBuffer = '';
    updatePinDots();
  }
}

/* ─── CLOCKS ─────────────────────────────────────────────────────────────── */

function getCityTime(offsetHours) {
  var now = new Date();
  var utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  var city = new Date(utcMs + (offsetHours * 3600000));
  var h = city.getHours();
  var m = String(city.getMinutes()).padStart(2, '0');
  var ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return { time: h + ':' + m, ap: ap };
}

function tickClocks() {
  // BST = UTC+1, Dubai = UTC+4, India = UTC+5.5
  var lon = getCityTime(1);
  var dub = getCityTime(4);
  var pal = getCityTime(5.5);
  setText('ck-lon', lon.time); setText('ck-lon-ap', lon.ap);
  setText('ck-dub', dub.time); setText('ck-dub-ap', dub.ap);
  setText('ck-pal', pal.time); setText('ck-pal-ap', pal.ap);
}

function setText(id, txt) {
  var el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function startClocks() {
  if (State.clockTimer) clearInterval(State.clockTimer);
  tickClocks();
  State.clockTimer = setInterval(tickClocks, 1000);
}

/* ─── NAV BUILDER ────────────────────────────────────────────────────────── */

function buildNav(userKey) {
  var u = USERS[userKey];
  var nav = document.getElementById('bottom-nav');
  if (!nav) return;
  nav.innerHTML = '';
  var accentColors = { green:'#0F6E56', blue:'#185FA5', navy:'#1A1A3E', amber:'#854F0B', gray:'#5F5E5A' };
  var accent = accentColors[u.accent] || '#0F6E56';

  for (var i = 0; i < u.nav.length; i++) {
    (function(navItem, index) {
      var btn = document.createElement('button');
      btn.style.cssText = 'flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; padding:6px 2px; border:none; background:none; cursor:pointer; border-top:2.5px solid ' + (index === 0 ? accent : 'transparent') + '; font-family:inherit;';
      btn.innerHTML = '<span style="font-size:20px; line-height:1;">' + navItem.icon + '</span>'
                    + '<span style="font-size:9px; font-weight:700; color:' + (index === 0 ? accent : '#B4B2A9') + ';">' + navItem.label + '</span>';
      btn.addEventListener('click', function() {
        var allBtns = nav.querySelectorAll('button');
        for (var j = 0; j < allBtns.length; j++) {
          allBtns[j].style.borderTopColor = 'transparent';
          var lbl = allBtns[j].querySelector('span:last-child');
          if (lbl) lbl.style.color = '#B4B2A9';
        }
        btn.style.borderTopColor = accent;
        var thisLbl = btn.querySelector('span:last-child');
        if (thisLbl) thisLbl.style.color = accent;
        showPage(userKey + '-' + navItem.id);
      });
      nav.appendChild(btn);
    })(u.nav[i], i);
  }
}

/* ─── PAGE BUILDER (Module 1: placeholders; real content added per module) ── */

function buildPages(userKey) {
  var u = USERS[userKey];
  var container = document.getElementById('pages-container');
  if (!container) return;
  container.innerHTML = '';
  for (var i = 0; i < u.nav.length; i++) {
    var navItem = u.nav[i];
    var page = document.createElement('div');
    page.className = 'page' + (i === 0 ? ' active' : '');
    page.id = 'page-' + userKey + '-' + navItem.id;
    page.innerHTML = renderPage(userKey, navItem.id);
    container.appendChild(page);
  }
}

/* renderPage is the single dispatch point.
   Module 1 returns placeholders. Later modules replace the per-user branches. */
function renderPage(userKey, pageId) {
  // Module 2+ will override this via section-specific builders.
  if (typeof renderUserPage === 'function') {
    var custom = renderUserPage(userKey, pageId);
    if (custom !== null && custom !== undefined) return custom;
  }
  return '<div class="fadein" style="padding:40px 24px; text-align:center;">'
       + '<div style="font-size:48px; margin-bottom:12px;">🚧</div>'
       + '<div style="font-size:16px; font-weight:800; color:#374151;">' + USERS[userKey].name + ' — ' + pageId + '</div>'
       + '<div style="font-size:13px; color:#9CA3AF; font-weight:600; margin-top:6px;">Coming in the next module</div>'
       + '</div>';
}

/* ─── LOAD USER ──────────────────────────────────────────────────────────── */

function loadUser(userKey) {
  var u = USERS[userKey];
  State.activeUser = userKey;

  var header = document.getElementById('main-header');
  if (header) header.style.background = u.headerBg;
  setText('main-greeting', getGreeting());
  setText('main-name', u.name);
  setText('main-mascot', u.mascot);

  var themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute('content', u.headerBg);

  buildPages(userKey);
  buildNav(userKey);
  startClocks();
  showScreen('screen-main');

  // Reset scroll to top
  var pc = document.getElementById('pages-container');
  if (pc) pc.scrollTop = 0;
}

function getGreeting() {
  var h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}


/* ─── USER PAGE DISPATCH (modules register here) ─────────────────────────── */

function renderUserPage(userKey, pageId) {
  if (userKey === 'ammu'   && typeof renderAmmuPage   === 'function') return renderAmmuPage(pageId);
  if (userKey === 'mumma'  && typeof renderMummaPage  === 'function') return renderMummaPage(pageId);
  if (userKey === 'abbu'   && typeof renderAbbuPage   === 'function') return renderAbbuPage(pageId);
  if (userKey === 'admin'  && typeof renderAdminPage  === 'function') return renderAdminPage(pageId);
  if (userKey === 'family' && typeof renderFamilyPage === 'function') return renderFamilyPage(pageId);
  return null;
}

/* ─── INIT ───────────────────────────────────────────────────────────────── */

window.addEventListener('load', function() {
  buildLoginButtons();
  showScreen('screen-login');
  console.log('[Ammu App] Module 1 shell loaded');
});


/* ============================================================================
   MODULE 2: AMMU'S SECTION
   Pages: Home, Tracker (Exercise→Peace→Food), Rewards, Secrets, Progress
   ============================================================================ */

/* ─── AMMU DATA ──────────────────────────────────────────────────────────── */

var BLUEY_MSGS = [
  { msg: "Bluey says — time to be healthy today!",      sub: "You've got this, Ammu! Let's go! 💪" },
  { msg: "Bluey's tip: eat your egg first thing!",       sub: "Strong like Bandit — that's you! 🐾" },
  { msg: "Even Bluey does her exercises every day!",     sub: "Match her energy — you can do it! 🌟" },
  { msg: "Bluey says: drinking water = superpower!",     sub: "Stay hydrated, stay amazing! 💧" },
  { msg: "Bluey's favourite day? When you give 100%!",   sub: "Today could be that day! ⭐" },
];

var ANIMALS = [
  { e: '🦁', t: 'Today you ate like a LION!',        s: 'Strong, powerful and full of energy — just like a lion in Kerala!' },
  { e: '🐬', t: 'Brain working like a DOLPHIN!',     s: 'Walnuts + fruit = smartest animal in the sea — that\'s you!' },
  { e: '🐘', t: 'Strength of an ELEPHANT!',          s: 'Full checklist done — Kerala elephant power is YOURS today! 🌺' },
  { e: '🦅', t: 'You soared like an EAGLE today!',   s: 'High energy, sharp brain, strong body — absolutely flying!' },
  { e: '🐯', t: 'Tiger energy today, Ammu!',         s: 'Exercise + food + meditation — a complete tiger day!' },
  { e: '🦋', t: 'Transformed like a BUTTERFLY!',     s: 'Every healthy day makes you more beautiful and strong!' },
];

var DAY_PLANS = {
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

/* ─── AMMU STATE ─────────────────────────────────────────────────────────── */

var AmmuState = {
  coins:        parseInt(localStorage.getItem('ammu_coins')  || '247', 10),
  streak:       parseInt(localStorage.getItem('ammu_streak') || '12', 10),
  weekDays:     parseInt(localStorage.getItem('ammu_week')   || '4', 10),
  ticked:       0,
  mood:         '',
  energy:       3,
  daySubmitted: false
};

var AMMU_TOTAL = 20;

/* ─── AMMU HELPERS ───────────────────────────────────────────────────────── */

function getDayName() {
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
}

function ammuSaveCoins() {
  localStorage.setItem('ammu_coins', AmmuState.coins);
  var ids = ['a-coins', 'a-rewards-coins'];
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (el) el.textContent = AmmuState.coins;
  }
}

/* ─── AMMU HOME ──────────────────────────────────────────────────────────── */

function buildAmmuHome() {
  var day = getDayName();
  var plan = DAY_PLANS[day] || DAY_PLANS.Mon;
  var bm = BLUEY_MSGS[Math.floor(Math.random() * BLUEY_MSGS.length)];

  function planList(items) {
    var out = '';
    for (var i = 0; i < items.length; i++) {
      out += '<div style="padding:3px 0; font-size:13px; font-weight:600; color:#374151;">' + items[i] + '</div>';
    }
    return out;
  }

  var h = '<div class="fadein" style="padding:14px;">';

  // Reminder banner (time-based)
  var hour = new Date().getHours();
  if (hour >= 7 && hour < 12) {
    h += '<div onclick="ammuGoTracker()" style="background:#FBEAF0; border:1px solid #F5C0D5; border-radius:14px; padding:12px; margin-bottom:12px; display:flex; align-items:center; gap:10px; cursor:pointer;">'
      +  '<span style="font-size:22px;">🌅</span>'
      +  '<div><div style="font-size:13px; font-weight:800; color:#9D2449;">Good morning, Ammu!</div>'
      +  '<div style="font-size:11px; font-weight:600; color:#C2185B;">Tap to do your morning checklist 💪</div></div></div>';
  } else if (hour >= 18 && hour < 22) {
    h += '<div onclick="ammuGoTracker()" style="background:#FAEEDA; border:1px solid #FAC775; border-radius:14px; padding:12px; margin-bottom:12px; display:flex; align-items:center; gap:10px; cursor:pointer;">'
      +  '<span style="font-size:22px;">🌙</span>'
      +  '<div><div style="font-size:13px; font-weight:800; color:#854F0B;">Evening check-in!</div>'
      +  '<div style="font-size:11px; font-weight:600; color:#A16207;">Fill in your day and earn coins 🪙</div></div></div>';
  }

  // Coin + streak bar
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:12px; margin-bottom:12px; display:flex; align-items:center; gap:12px;">'
    +    '<span style="font-size:26px;">🪙</span>'
    +    '<div><div id="a-coins" style="font-size:24px; font-weight:900; color:#F59E0B; line-height:1;">' + AmmuState.coins + '</div>'
    +    '<div style="font-size:11px; font-weight:700; color:#9CA3AF;">Total coins</div></div>'
    +    '<div style="margin-left:auto; display:flex; gap:8px;">'
    +      '<div style="background:#FFF7ED; border-radius:20px; padding:6px 12px; text-align:center;"><div style="font-size:16px; font-weight:900; color:#F97316;">' + AmmuState.streak + '</div><div style="font-size:9px; font-weight:700; color:#FB923C;">🔥 streak</div></div>'
    +      '<div style="background:#ECFDF5; border-radius:20px; padding:6px 12px; text-align:center;"><div style="font-size:16px; font-weight:900; color:#0F6E56;">' + AmmuState.weekDays + '/7</div><div style="font-size:9px; font-weight:700; color:#10B981;">⭐ week</div></div>'
    +    '</div>'
    +  '</div>';

  // Bluey banner
  h += '<div style="background:#185FA5; border-radius:16px; padding:12px; margin-bottom:12px; display:flex; align-items:center; gap:12px;">'
    +    '<span style="font-size:30px; flex-shrink:0;">🐾</span>'
    +    '<div><div style="font-size:13px; font-weight:800; color:#fff;">' + bm.msg + '</div>'
    +    '<div style="font-size:11px; font-weight:600; color:#BFDBFE; margin-top:2px;">' + bm.sub + '</div></div>'
    +  '</div>';

  // Today's plan
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #FED7AA; overflow:hidden; margin-bottom:12px;">'
    +    '<div style="background:#F97316; padding:10px 16px; display:flex; align-items:center; gap:8px;">'
    +      '<span style="font-size:18px;">📋</span><span style="font-size:16px; font-weight:800; color:#fff;">' + plan.title + '</span>'
    +    '</div>'
    +    '<div style="padding:8px 16px; border-bottom:1px solid #F9FAFB;"><div style="font-size:10px; font-weight:800; color:#F97316; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">🌅 Morning</div>' + planList(plan.morning) + '</div>'
    +    '<div style="padding:8px 16px; border-bottom:1px solid #F9FAFB;"><div style="font-size:10px; font-weight:800; color:#F97316; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">☀️ Daytime</div>' + planList(plan.afternoon) + '</div>'
    +    '<div style="padding:8px 16px;"><div style="font-size:10px; font-weight:800; color:#F97316; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">🌙 Evening</div>' + planList(plan.evening) + '</div>'
    +  '</div>';

  h += '</div>';
  return h;
}

function ammuGoTracker() {
  var btns = document.querySelectorAll('#bottom-nav button');
  if (btns[1]) btns[1].click();
}


/* ─── AMMU TRACKER ───────────────────────────────────────────────────────── */

function buildAmmuTracker() {
  var day = getDayName();
  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function dayPills() {
    var out = '<div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; margin-bottom:12px;">';
    for (var i = 0; i < days.length; i++) {
      var d = days[i];
      var on = (d === day);
      out += '<button onclick="ammuSelectDay(this)" style="flex-shrink:0; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:800; border:1px solid ' + (on ? '#0F6E56' : '#E5E7EB') + '; background:' + (on ? '#0F6E56' : '#fff') + '; color:' + (on ? '#fff' : '#9CA3AF') + '; font-family:inherit; cursor:pointer;">' + d + '</button>';
    }
    out += '</div>';
    return out;
  }

  function item(id, emoji, label, why, coins, cat) {
    return '<div class="ammu-check" data-cat="' + cat + '" onclick="ammuTick(this)" style="display:flex; align-items:flex-start; gap:12px; padding:11px 16px; border-bottom:1px solid #F9FAFB; cursor:pointer;">'
      +    '<div class="acb" style="width:24px; height:24px; border-radius:8px; border:2px solid #E5E7EB; flex-shrink:0; display:flex; align-items:center; justify-content:center; margin-top:1px;"></div>'
      +    '<div style="flex:1;">'
      +      '<div class="acm" style="font-size:13px; font-weight:700; color:#1F2937; line-height:1.3;">' + emoji + ' ' + label
      +        ' <span style="display:inline-block; font-size:10px; font-weight:800; padding:1px 7px; border-radius:20px; background:#FEF3C7; color:#B45309; margin-left:2px;">' + coins + '🪙</span></div>'
      +      '<div style="font-size:11px; font-weight:600; color:#9CA3AF; margin-top:2px;">' + why + '</div>'
      +    '</div>'
      +  '</div>';
  }

  function section(borderColor, emoji, title, badge, badgeBg, badgeColor, items) {
    return '<div style="background:#fff; border-radius:16px; border:2px solid ' + borderColor + '; overflow:hidden; margin-bottom:12px;">'
      +    '<div style="display:flex; align-items:center; gap:8px; padding:10px 16px; border-bottom:1px solid #F9FAFB;">'
      +      '<span style="font-size:20px;">' + emoji + '</span>'
      +      '<span style="flex:1; font-size:13px; font-weight:800; color:#1F2937;">' + title + '</span>'
      +      '<span style="font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; background:' + badgeBg + '; color:' + badgeColor + ';">' + badge + '</span>'
      +    '</div>' + items + '</div>';
  }

  var h = '<div class="fadein" style="padding:14px;">';
  h += dayPills();

  // Progress bar
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:14px 16px; margin-bottom:12px;">'
    +    '<div style="display:flex; justify-content:space-between; margin-bottom:6px;">'
    +      '<span id="a-prog-t" style="font-size:11px; font-weight:700; color:#9CA3AF;">0 of ' + AMMU_TOTAL + ' done</span>'
    +      '<span id="a-prog-p" style="font-size:11px; font-weight:800; color:#0F6E56;">0%</span>'
    +    '</div>'
    +    '<div style="height:10px; background:#F3F4F6; border-radius:20px; overflow:hidden;"><div id="a-prog-fill" style="height:100%; background:#10B981; border-radius:20px; width:0%; transition:width 0.3s;"></div></div>'
    +    '<div id="a-prog-msg" style="font-size:11px; font-weight:700; color:#9CA3AF; margin-top:6px;">Let\'s get started! Every tick earns coins! 🪙</div>'
    +  '</div>';

  // EXERCISE FIRST
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; text-align:center; padding:6px 0;">⚡ Exercise</div>';
  h += section('#D9F99D', '🤸', 'Move That Body!', '⚡ Strength!', '#ECFCCB', '#4D7C0F',
        item('stretch','🌅','Morning stretch (10-15 mins)','Wakes up every joint — like a reboot!','+3','exercise')
      + item('exercise','🏋️','Main exercise (squats/push-ups/yoga)','Builds real strength — future Ammu thanks you!','+4','exercise')
      + item('hand-am','✋','Morning hand squeezes — 10 each','Makes your grip so much stronger!','+2','exercise')
      + item('hand-pm','📺','Evening hand squeezes during TV','Double hand power — no need to pause your show!','+2','exercise'));

  // PEACE SECOND
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; text-align:center; padding:6px 0;">😊 Peace &amp; Happiness</div>';
  h += section('#BFDBFE', '🌙', 'Calm Happy Mind!', '😊 Peace!', '#DBEAFE', '#1D4ED8',
        item('meditate','🧘','Did my 5-minute meditation','Slow breathing = calm mind + better sleep!','+3','peace')
      + item('noscreens','📵','No screens 1 hour before bed','Brain needs quiet time to process your day!','+2','peace')
      + item('reading','📖','Read or drew before sleep','Calm activities = sweet dreams + smarter brain!','+3','peace'));

  // FOOD - BONES
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; text-align:center; padding:6px 0;">🦴 Bone Health</div>';
  h += section('#99F6E4', '🦴', 'Strong Bones!', '🦴 Bone power!', '#CCFBF1', '#0F766E',
        item('yogurt','🥛','Had my yogurt today','Calcium = super strong bones that never break!','+2','food')
      + item('greenveg','🥦','Ate a green vegetable','Broccoli & spinach are secretly packed with calcium!','+2','food')
      + item('sunlight','☀️','Got some sunlight today','Vitamin D from sun helps soak up calcium!','+1','food'));

  // FOOD - MUSCLE
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; text-align:center; padding:6px 0;">💪 Muscle Health</div>';
  h += section('#FED7AA', '💪', 'Muscle Power!', '💪 Muscle fuel!', '#FFEDD5', '#C2410C',
        item('egg','🥚','Had my egg today','Eggs = THE best muscle builder!','+3','food')
      + item('paneer','🧀','Had paneer or dal','Protein repairs muscles — like fixing a superhero suit!','+2','food')
      + item('dryfruits','🥜','Had dry fruits during TV','Almonds, walnuts & cashews = energy and muscles!','+2','food'));

  // FOOD - GUT
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; text-align:center; padding:6px 0;">🌱 Gut Health</div>';
  h += section('#FBCFE8', '🌱', 'Happy Tummy!', '🌱 Gut health!', '#FCE7F3', '#BE185D',
        item('fermented','🫓','Had dosa, idli, or appam','Fermented food = friendly bugs that keep you healthy!','+2','food')
      + item('tummy','😌','Tummy felt okay today','Happy tummy means your body absorbs all the good stuff!','+2','food'));

  // FOOD - BRAIN
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; text-align:center; padding:6px 0;">🧠 Brain Health</div>';
  h += section('#DDD6FE', '🧠', 'Big Brain Boost!', '🧠 Brain power!', '#EDE9FE', '#6D28D9',
        item('fruit','🍓','Had a fruit today','Berries & pomegranate make your brain sharper!','+2','food')
      + item('walnuts','🌰','Had walnuts today','Walnuts look like brains — AMAZING for yours!','+2','food')
      + item('draw','📚','Did some reading or drawing','Reading grows new brain connections — level up!','+3','food'));

  // WATER
  h += '<div style="background:#fff; border-radius:16px; border:2px solid #BFDBFE; overflow:hidden; margin-bottom:12px;">'
    +    '<div style="display:flex; align-items:center; gap:8px; padding:10px 16px; border-bottom:1px solid #F9FAFB;">'
    +      '<span style="font-size:20px;">💧</span><span style="flex:1; font-size:13px; font-weight:800; color:#1F2937;">Water Challenge!</span>'
    +      '<span style="font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; background:#DBEAFE; color:#1D4ED8;">💧 6 cups goal</span>'
    +    '</div>'
    +    '<div style="padding:14px 16px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">'
    +      '<span style="font-size:11px; font-weight:700; color:#6B7280;">Tap each cup you drank:</span>'
    +      '<div style="display:flex; gap:8px;">';
  for (var w = 0; w < 6; w++) {
    h += '<button onclick="ammuToggleCup(this)" style="font-size:26px; opacity:0.2; border:none; background:none; cursor:pointer; transition:all 0.15s; padding:0;">🥤</button>';
  }
  h += '</div></div></div>';

  // MOOD + ENERGY
  h += '<div style="background:#fff; border-radius:16px; border:2px solid #99F6E4; overflow:hidden; margin-bottom:12px;">'
    +    '<div style="display:flex; align-items:center; gap:8px; padding:10px 16px; border-bottom:1px solid #F9FAFB;">'
    +      '<span style="font-size:20px;">⭐</span><span style="font-size:13px; font-weight:800; color:#1F2937;">How are YOU feeling today?</span>'
    +    '</div>'
    +    '<div style="padding:12px 16px; border-bottom:1px solid #F9FAFB;">'
    +      '<div style="font-size:11px; font-weight:700; color:#6B7280; margin-bottom:8px;">⚡ Energy level:</div>'
    +      '<div style="display:flex; align-items:center; gap:12px;">'
    +        '<input type="range" min="1" max="5" value="3" step="1" oninput="ammuEnergy(this.value)" style="flex:1; accent-color:#0F6E56;" />'
    +        '<span id="a-stars" style="font-size:16px; min-width:90px;">⭐⭐⭐</span>'
    +      '</div>'
    +    '</div>'
    +    '<div style="padding:12px 16px;">'
    +      '<div style="font-size:11px; font-weight:700; color:#6B7280; margin-bottom:8px;">😊 Mood today — tap one:</div>'
    +      '<div style="display:flex; gap:6px; justify-content:space-between;">';
  var moods = [['😢','Sad'],['😐','Okay'],['🙂','Good'],['😊','Happy'],['🌟','Amazing']];
  for (var mi = 0; mi < moods.length; mi++) {
    h += '<button onclick="ammuMood(this,\'' + moods[mi][1] + '\')" class="ammu-mood" style="flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 2px; border-radius:12px; border:2px solid #F3F4F6; background:#fff; cursor:pointer; font-family:inherit;">'
      +    '<span style="font-size:22px;">' + moods[mi][0] + '</span>'
      +    '<span style="font-size:9px; font-weight:700; color:#9CA3AF;">' + moods[mi][1] + '</span></button>';
  }
  h += '</div></div></div>';

  // SAVE button
  h += '<button id="a-save-btn" onclick="ammuSaveDay()" style="width:100%; padding:16px; border-radius:16px; background:#0F6E56; color:#fff; font-size:18px; font-weight:800; border:none; cursor:pointer; font-family:inherit; margin-bottom:12px;">🐘 Save My Super Day! 🌟</button>';

  // Animal reveal (hidden)
  h += '<div id="a-animal" style="display:none; background:#ECFDF5; border:2px solid #A7F3D0; border-radius:16px; padding:16px; text-align:center; margin-bottom:12px;">'
    +    '<div id="a-animal-em" style="font-size:56px; margin-bottom:8px;"></div>'
    +    '<div id="a-animal-t" style="font-size:17px; font-weight:800; color:#065F46; margin-bottom:4px;"></div>'
    +    '<div id="a-animal-s" style="font-size:12px; font-weight:600; color:#059669; line-height:1.5;"></div>'
    +  '</div>';

  h += '</div>';
  return h;
}

/* ─── AMMU TRACKER INTERACTIONS ──────────────────────────────────────────── */

function ammuSelectDay(btn) {
  var pills = btn.parentNode.querySelectorAll('button');
  for (var i = 0; i < pills.length; i++) {
    pills[i].style.background = '#fff';
    pills[i].style.color = '#9CA3AF';
    pills[i].style.borderColor = '#E5E7EB';
  }
  btn.style.background = '#0F6E56';
  btn.style.color = '#fff';
  btn.style.borderColor = '#0F6E56';
}

function ammuTick(row) {
  var cb = row.querySelector('.acb');
  var cm = row.querySelector('.acm');
  var done = cb.getAttribute('data-done') === '1';
  if (!done) {
    cb.setAttribute('data-done', '1');
    cb.style.background = '#0F6E56';
    cb.style.borderColor = '#0F6E56';
    cb.innerHTML = '<span style="color:#fff; font-size:13px; font-weight:800;">✓</span>';
    cm.style.textDecoration = 'line-through';
    cm.style.color = '#9CA3AF';
    AmmuState.ticked = Math.min(AmmuState.ticked + 1, AMMU_TOTAL);
    AmmuState.coins += 2;
  } else {
    cb.setAttribute('data-done', '0');
    cb.style.background = '#fff';
    cb.style.borderColor = '#E5E7EB';
    cb.innerHTML = '';
    cm.style.textDecoration = 'none';
    cm.style.color = '#1F2937';
    AmmuState.ticked = Math.max(0, AmmuState.ticked - 1);
    AmmuState.coins = Math.max(0, AmmuState.coins - 2);
  }
  ammuUpdateProgress();
  ammuSaveCoins();
}

function ammuUpdateProgress() {
  var pct = Math.round((AmmuState.ticked / AMMU_TOTAL) * 100);
  var fill = document.getElementById('a-prog-fill');
  var t = document.getElementById('a-prog-t');
  var p = document.getElementById('a-prog-p');
  var msg = document.getElementById('a-prog-msg');
  if (fill) fill.style.width = pct + '%';
  if (t) t.textContent = AmmuState.ticked + ' of ' + AMMU_TOTAL + ' done';
  if (p) p.textContent = pct + '%';
  if (msg) {
    var msgs = ["Let's get started! Every tick earns coins! 🪙","Great start! Keep going! 💪","Halfway there — you're amazing! 🌟","Almost done — so close! 🔥","WOW! What a superstar day! 🏆🐘"];
    msg.textContent = msgs[Math.min(Math.floor(pct / 25), 4)];
  }
}

function ammuToggleCup(btn) {
  var filled = btn.getAttribute('data-filled') === '1';
  if (!filled) { btn.setAttribute('data-filled','1'); btn.style.opacity = '1'; btn.style.transform = 'scale(1.15)'; }
  else { btn.setAttribute('data-filled','0'); btn.style.opacity = '0.2'; btn.style.transform = 'scale(1)'; }
}

function ammuEnergy(val) {
  AmmuState.energy = parseInt(val, 10);
  var stars = ['','⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'];
  var el = document.getElementById('a-stars');
  if (el) el.textContent = stars[val];
}

function ammuMood(btn, mood) {
  AmmuState.mood = mood;
  var all = document.querySelectorAll('.ammu-mood');
  for (var i = 0; i < all.length; i++) {
    all[i].style.borderColor = '#F3F4F6';
    all[i].style.background = '#fff';
  }
  btn.style.borderColor = '#10B981';
  btn.style.background = '#ECFDF5';
}

function ammuSaveDay() {
  if (AmmuState.daySubmitted) return;
  AmmuState.daySubmitted = true;
  AmmuState.coins += 20;
  ammuSaveCoins();

  var animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  var box = document.getElementById('a-animal');
  if (box) {
    document.getElementById('a-animal-em').textContent = animal.e;
    document.getElementById('a-animal-t').textContent = animal.t;
    document.getElementById('a-animal-s').textContent = animal.s;
    box.style.display = 'block';
  }
  var btn = document.getElementById('a-save-btn');
  if (btn) { btn.textContent = '🎉 Saved! +20 bonus coins!'; btn.style.background = '#F97316'; }

  // Save to Google Sheets (Module 6 wires this; safe no-op until then)
  if (typeof submitData === 'function') {
    submitData({ type:'daily_tracker', ticked:AmmuState.ticked, mood:AmmuState.mood, coins:AmmuState.coins, streak:AmmuState.streak });
  }
}


/* ─── AMMU REWARDS ───────────────────────────────────────────────────────── */

function buildAmmuRewards() {
  var h = '<div class="fadein" style="padding:14px;">';

  // Coin hero
  h += '<div style="background:#FFFBEB; border:2px solid #FDE68A; border-radius:16px; padding:18px; text-align:center; margin-bottom:12px;">'
    +    '<div style="font-size:36px; margin-bottom:4px;">🪙</div>'
    +    '<div id="a-rewards-coins" style="font-size:44px; font-weight:900; color:#F59E0B; line-height:1;">' + AmmuState.coins + '</div>'
    +    '<div style="font-size:13px; font-weight:800; color:#B45309; margin-top:4px;">Total coins earned</div>'
    +    '<div style="font-size:11px; font-weight:600; color:#D97706; margin-top:2px;">100 coins = £1 pocket money 💰</div>'
    +  '</div>';

  // Cheat day
  h += '<div style="background:#FCE7F3; border:2px solid #FBCFE8; border-radius:16px; padding:16px; margin-bottom:12px;">'
    +    '<div style="font-size:18px; font-weight:800; color:#BE185D; margin-bottom:4px;">🍕 Cheat Day!</div>'
    +    '<div style="font-size:11px; font-weight:600; color:#9D2449; line-height:1.5;">Earn a cheat day by completing 10 days in a row! Eat ANYTHING you want for a full day — no rules! One cheat day every 2 weeks.</div>'
    +    '<div style="font-size:15px; font-weight:800; color:#BE185D; margin-top:8px;">8 more days to your next cheat day! 🎉</div>'
    +  '</div>';

  function rewardCard(title, items) {
    var out = '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:12px;">'
      +    '<div style="padding:10px 16px; border-bottom:1px solid #F9FAFB; font-size:13px; font-weight:800; color:#1F2937;">' + title + '</div>';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      out += '<div style="display:flex; align-items:center; gap:12px; padding:11px 16px; border-bottom:1px solid #F9FAFB;">'
        +      '<span style="font-size:24px;">' + it[0] + '</span>'
        +      '<div style="flex:1;"><div style="font-size:13px; font-weight:700; color:#1F2937;">' + it[1] + '</div><div style="font-size:11px; font-weight:600; color:#9CA3AF; margin-top:1px;">' + it[2] + '</div></div>'
        +      (it[3] === 'claim'
            ? '<button onclick="ammuClaim(this)" style="font-size:11px; font-weight:800; background:#0F6E56; color:#fff; padding:6px 14px; border-radius:20px; border:none; cursor:pointer; font-family:inherit;">Claim</button>'
            : it[3] === 'locked'
              ? '<span style="font-size:11px; font-weight:700; color:#D1D5DB; padding:6px 14px; border-radius:20px; border:1px solid #E5E7EB;">Locked</span>'
              : '<span style="font-size:15px; font-weight:800; color:#F59E0B;">' + it[3] + '</span>')
        +    '</div>';
    }
    out += '</div>';
    return out;
  }

  h += rewardCard('📅 Daily rewards', [
    ['📱','Open the app & fill in','Just updating earns coins!','+5🪙'],
    ['🍽️','Complete food checklist','All food items ticked','+10🪙'],
    ['🤸','Complete exercise checklist','All exercises done','+15🪙'],
    ['⭐','Perfect full day!','Everything completed','+20🪙']
  ]);

  h += rewardCard('📆 Weekly bonus — pick your reward!', [
    ['🎬','Movie night request','Pick a slightly grown-up movie — needs approval! (5 days)','claim'],
    ['🍕','Cheat day unlock','Eat ANYTHING for a full day! (10 days in a row)','claim'],
    ['🎁','Mystery surprise gift','A surprise gift is coming your way! (7 days)','claim'],
    ['💌','Secret story unlock','A secret from someone who loves you! (7 days)','claim']
  ]);

  h += rewardCard('🏆 Monthly super bonus!', [
    ['🎡','Adventure day — YOU choose!','Month 1 — bowling, trampoline, cinema, day trip!','claim'],
    ['🎀','Big surprise','Month 3 — something you have been wanting!','locked'],
    ['🌟','MEGA adventure','Month 6 — something you have NEVER done before!','locked']
  ]);

  h += '</div>';
  return h;
}

function ammuClaim(btn) {
  btn.textContent = '✓ Claimed!';
  btn.style.background = '#D1FAE5';
  btn.style.color = '#065F46';
  btn.disabled = true;
}

/* ─── AMMU SECRETS ───────────────────────────────────────────────────────── */

function buildAmmuSecrets() {
  var streak = AmmuState.streak;
  var stories = [
    { day:7,  title:'Day 7 — Abbu\'s secret!', text:'When Abbu was 10 years old, he ate rice and fish every single day and could run faster than ALL his friends at school! His secret? He never skipped his meals — just like you are doing now! 🏃' },
    { day:14, title:'Day 14 — Secret about Mumma!', text:'Complete 14 days to unlock a secret about Mumma!' },
    { day:21, title:'Day 21 — Funny Abbu story!', text:'Complete 21 days to unlock a funny story about Abbu!' },
    { day:30, title:'Day 30 — Special milestone!', text:'Complete 1 full month to unlock this special secret!' },
    { day:90, title:'Month 3 — MEGA secret!', text:'This one will BLOW YOUR MIND! 🤯 Complete 3 months to unlock.' }
  ];

  var h = '<div class="fadein" style="padding:14px;">';
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; text-align:center; padding:6px 0 12px;">🔓 Secret stories — unlock as you go!</div>';

  for (var i = 0; i < stories.length; i++) {
    var s = stories[i];
    var unlocked = streak >= s.day;
    h += '<div style="border-radius:16px; border:2px solid ' + (unlocked ? '#DDD6FE' : '#E5E7EB') + '; background:' + (unlocked ? '#F5F3FF' : '#F9FAFB') + '; padding:16px; margin-bottom:12px;">'
      +    '<div style="font-size:15px; font-weight:800; color:' + (unlocked ? '#6D28D9' : '#9CA3AF') + '; margin-bottom:6px;">' + (unlocked ? '🔓 ' : '🔒 ') + s.title + '</div>'
      +    '<div style="font-size:13px; font-weight:600; color:' + (unlocked ? '#7C3AED' : '#9CA3AF') + '; line-height:1.5;">' + s.text + '</div>'
      +    (!unlocked ? '<div style="font-size:11px; font-weight:700; color:#9CA3AF; margin-top:8px;">🔒 ' + (s.day - streak) + ' more days to unlock</div>' : '')
      +  '</div>';
  }
  h += '</div>';
  return h;
}

/* ─── AMMU PROGRESS ──────────────────────────────────────────────────────── */

function buildAmmuProgress() {
  var h = '<div class="fadein" style="padding:14px;">';

  h += '<div style="background:#FFF7ED; border:1px solid #FED7AA; border-radius:14px; padding:12px; margin-bottom:12px; font-size:11px; font-weight:700; color:#9A3412;">📅 Do this on the last Sunday of every month — morning, before eating!</div>';

  // Last month results
  var lastMonth = [['📏','Height','139cm','+0.5cm'],['⚖️','Weight','33.2kg','+0.8kg'],['💪','Bicep','19cm','+1cm'],['✋','Forearm','17cm','+0.5cm']];
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px; margin-bottom:12px;">'
    +    '<div style="font-size:13px; font-weight:800; color:#1F2937; margin-bottom:12px;">📊 Last month\'s results</div>'
    +    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">';
  for (var i = 0; i < lastMonth.length; i++) {
    var m = lastMonth[i];
    h += '<div style="background:#F9FAFB; border-radius:12px; padding:12px;"><div style="font-size:20px; margin-bottom:2px;">' + m[0] + '</div><div style="font-size:11px; font-weight:600; color:#9CA3AF;">' + m[1] + '</div><div style="font-size:18px; font-weight:900; color:#0F6E56;">' + m[2] + '</div><div style="font-size:10px; font-weight:800; color:#10B981; margin-top:1px;">' + m[3] + ' — growing!</div></div>';
  }
  h += '</div></div>';

  // Enter measurements
  var fields = [['Height (cm)','e.g. 139'],['Weight (kg)','e.g. 33.2'],['Bicep (cm)','e.g. 19'],['Forearm (cm)','e.g. 17'],['Waist (cm)','e.g. 58'],['Shoulder (cm)','e.g. 34']];
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px; margin-bottom:12px;">'
    +    '<div style="font-size:13px; font-weight:800; color:#1F2937; margin-bottom:12px;">📝 Enter this month\'s measurements</div>'
    +    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">';
  for (var f = 0; f < fields.length; f++) {
    h += '<div><label style="font-size:10px; font-weight:800; color:#EA580C;">' + fields[f][0] + '</label>'
      +  '<input type="number" class="ammu-meas" placeholder="' + fields[f][1] + '" style="margin-top:4px; width:100%; padding:8px 12px; border-radius:12px; border:1px solid #E5E7EB; font-size:13px; font-weight:700; color:#1F2937; font-family:inherit; box-sizing:border-box;" /></div>';
  }
  h += '</div>'
    +  '<button onclick="ammuSaveMeasurements()" style="margin-top:12px; width:100%; padding:12px; border-radius:12px; background:#F97316; color:#fff; font-size:16px; font-weight:800; border:none; cursor:pointer; font-family:inherit;">Save measurements! 📏</button>'
    +  '</div>';

  // Push-up challenge
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px; margin-bottom:12px;">'
    +    '<div style="font-size:13px; font-weight:800; color:#1F2937; margin-bottom:12px;">💪 Push-up challenge</div>'
    +    '<div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">'
    +      '<div style="flex:1; background:#F9FAFB; border-radius:12px; padding:12px; text-align:center;"><div style="font-size:11px; font-weight:700; color:#9CA3AF;">Last month</div><div style="font-size:32px; font-weight:900; color:#9CA3AF;">5</div><div style="font-size:11px; color:#9CA3AF;">push-ups</div></div>'
    +      '<div style="font-size:22px; color:#D1D5DB;">→</div>'
    +      '<div style="flex:1; background:#ECFDF5; border:2px solid #A7F3D0; border-radius:12px; padding:12px; text-align:center;"><div style="font-size:11px; font-weight:700; color:#10B981;">This month</div><div style="font-size:32px; font-weight:900; color:#0F6E56;">8</div><div style="font-size:11px; font-weight:800; color:#10B981;">push-ups! 💪</div></div>'
    +    '</div>'
    +    '<div style="background:#FFF7ED; border:1px solid #FED7AA; border-radius:12px; padding:12px; text-align:center;"><div style="font-size:13px; font-weight:800; color:#9A3412;">🎉 3 more push-ups than last month!</div><div style="font-size:11px; font-weight:600; color:#C2410C; margin-top:2px;">You are getting stronger every single month!</div></div>'
    +  '</div>';

  h += '</div>';
  return h;
}

function ammuSaveMeasurements() {
  var inputs = document.querySelectorAll('.ammu-meas');
  var labels = ['height','weight','bicep','forearm','waist','shoulder'];
  var data = { type:'monthly_measurements' };
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].value) data[labels[i]] = inputs[i].value;
  }
  if (typeof submitData === 'function') submitData(data);
  alert('Measurements saved! Great job Ammu! 📏🐘');
}

/* ─── AMMU PAGE DISPATCH ─────────────────────────────────────────────────── */

function renderAmmuPage(pageId) {
  if (pageId === 'home')     return buildAmmuHome();
  if (pageId === 'tracker')  return buildAmmuTracker();
  if (pageId === 'rewards')  return buildAmmuRewards();
  if (pageId === 'secrets')  return buildAmmuSecrets();
  if (pageId === 'progress') return buildAmmuProgress();
  return null;
}
