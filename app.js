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
  dismissTestBanner();
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

  // Sync any pending offline data
  syncPending();

  // Show test mode banner if active
  if (APP_TEST_MODE) setTimeout(showTestBanner, 400);
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


/* ============================================================================
   MODULE 6: DATA LAYER + TEST MODE BANNER
   - submitData: sends data to Google Sheets, queues offline submissions
   - Test mode banner shown after login
   ============================================================================ */

/* ─── DATA SUBMISSION ────────────────────────────────────────────────────── */

function submitData(data) {
  // Add timestamp + date if missing
  if (!data.date) data.date = new Date().toISOString().split('T')[0];
  if (!data.timestamp) data.timestamp = new Date().toISOString();

  // If no URL set, just queue it
  if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    queueSubmission(data);
    return;
  }

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(function(r) {
    return r.json();
  }).then(function(res) {
    console.log('[Data] Saved:', data.type, res);
  }).catch(function(err) {
    console.log('[Data] Offline — queuing:', data.type);
    queueSubmission(data);
  });
}

function queueSubmission(data) {
  var queue = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
  queue.push(data);
  localStorage.setItem('pending_submissions', JSON.stringify(queue));
}

function syncPending() {
  if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') return;
  var queue = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
  if (queue.length === 0) return;

  var remaining = [];
  var done = 0;
  function tryNext(i) {
    if (i >= queue.length) {
      localStorage.setItem('pending_submissions', JSON.stringify(remaining));
      if (done > 0) console.log('[Data] Synced ' + done + ' pending submissions');
      return;
    }
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queue[i])
    }).then(function(r) { return r.json(); })
      .then(function() { done++; tryNext(i + 1); })
      .catch(function() { remaining.push(queue[i]); tryNext(i + 1); });
  }
  tryNext(0);
}

/* ─── TEST MODE BANNER ───────────────────────────────────────────────────── */

function showTestBanner() {
  if (!APP_TEST_MODE) return;
  if (document.getElementById('test-banner')) return;

  var banner = document.createElement('div');
  banner.id = 'test-banner';
  banner.style.cssText = 'position:fixed; bottom:70px; left:50%; transform:translateX(-50%); width:calc(100% - 28px); max-width:452px; background:#1A1A3E; border-radius:14px; padding:14px 16px; z-index:9999; box-shadow:0 4px 24px rgba(0,0,0,0.3); display:flex; align-items:flex-start; gap:12px;';
  banner.innerHTML = '<div style="font-size:24px; flex-shrink:0;">🧪</div>'
    + '<div style="flex:1;"><div style="font-size:14px; font-weight:800; color:#fff; margin-bottom:3px;">Test mode — play around!</div>'
    + '<div style="font-size:11px; font-weight:600; color:#A5B4FC; line-height:1.5;">The data you see is sample data from last week. Explore everything — nothing is real yet!</div></div>'
    + '<button onclick="dismissTestBanner()" style="background:rgba(255,255,255,0.15); border:none; border-radius:8px; padding:5px 11px; color:#fff; font-size:11px; font-weight:700; cursor:pointer; flex-shrink:0; font-family:inherit;">Got it</button>';
  document.body.appendChild(banner);
}

function dismissTestBanner() {
  var b = document.getElementById('test-banner');
  if (b) {
    b.style.transition = 'opacity 0.3s, transform 0.3s';
    b.style.opacity = '0';
    b.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(function() { if (b.parentNode) b.parentNode.removeChild(b); }, 300);
  }
}

/* ─── INIT ───────────────────────────────────────────────────────────────── */

window.addEventListener('load', function() {
  // Load saved PINs from Admin changes
  var savedPins = JSON.parse(localStorage.getItem('app_pins') || '{}');
  for (var k in savedPins) { if (PINS[k] !== undefined) PINS[k] = savedPins[k]; }
  // Load saved Google Script URL
  var savedUrl = localStorage.getItem('google_script_url');
  if (savedUrl) GOOGLE_SCRIPT_URL = savedUrl;

  buildLoginButtons();
  showScreen('screen-login');
  console.log('[Ammu App] All modules loaded');
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


/* ============================================================================
   MODULE 3: MUMMA'S SECTION
   Pages: Home, Grocery, Meals, Check, Progress
   Priority: REDUCE Mumma's workload. Minimal taps.
   ============================================================================ */

/* ─── MUMMA DATA ─────────────────────────────────────────────────────────── */

var MUMMA_MEAL_PLAN = {
  Mon: { type:'easy',  meals:[{t:'Breakfast',m:'Egg on toast 🥚',egg:true},{t:'Lunch',m:'Yogurt + fruit + dry fruits'},{t:'Dinner',m:'Leftover or simple dal + rice'}]},
  Tue: { type:'cook',  meals:[{t:'Breakfast',m:'Toast + fruit'},{t:'Lunch',m:'Cook prepares — dal + rice + sabzi'},{t:'Dinner',m:'Cook\'s food + yogurt',egg:true}]},
  Wed: { type:'left',  meals:[{t:'Breakfast',m:'Scrambled egg + toast',egg:true},{t:'Lunch',m:'Tuesday\'s cook food reheated'},{t:'Dinner',m:'Paneer stir-fry — 15 mins'}]},
  Thu: { type:'quick', meals:[{t:'Breakfast',m:'Egg any style + toast',egg:true},{t:'Lunch',m:'Yogurt + fruit + dry fruits'},{t:'Dinner',m:'Simple chicken curry — 20 mins'}]},
  Fri: { type:'quick', meals:[{t:'Breakfast',m:'Egg + avocado toast',egg:true},{t:'Lunch',m:'Dal + rice (reheated or fresh)'},{t:'Dinner',m:'Omelette + salad — 10 mins',egg:true}]},
  Sat: { type:'cook',  meals:[{t:'Breakfast',m:'Toast + fruit'},{t:'Lunch',m:'Cook prepares — fish curry + rice'},{t:'Dinner',m:'Cook\'s food + yogurt'}]},
  Sun: { type:'easy',  meals:[{t:'Breakfast',m:'Egg + any choice',egg:true},{t:'Lunch',m:'Family meal — enjoy!'},{t:'Dinner',m:'Light meal + yogurt'}]},
};

var MUMMA_GROCERY = [
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

var SHOPS = ['Tesco','Waitrose','M&S','Indian shop','Cook brings','Other'];

var SHOP_STYLE = {
  'Tesco':       { bg:'#DBEAFE', color:'#1D4ED8', border:'#BFDBFE' },
  'Waitrose':    { bg:'#D1FAE5', color:'#047857', border:'#A7F3D0' },
  'M&S':         { bg:'#FCE7F3', color:'#BE185D', border:'#FBCFE8' },
  'Indian shop': { bg:'#FFEDD5', color:'#C2410C', border:'#FED7AA' },
  'Cook brings': { bg:'#EDE9FE', color:'#6D28D9', border:'#DDD6FE' },
  'Other':       { bg:'#F3F4F6', color:'#4B5563', border:'#E5E7EB' }
};

var ROT_STYLE = {
  last:  { bg:'#FEF2F2', color:'#DC2626', dot:'#F87171', label:'Last week' },
  two:   { bg:'#FFF7ED', color:'#EA580C', dot:'#FB923C', label:'2 weeks ago' },
  fresh: { bg:'#ECFDF5', color:'#059669', dot:'#34D399', label:'Not recent' },
  none:  { bg:'#F9FAFB', color:'#6B7280', dot:'#D1D5DB', label:'Not tracked' }
};

/* ─── MUMMA STATE (persisted) ────────────────────────────────────────────── */

var MummaState = {
  cookDays:  JSON.parse(localStorage.getItem('mumma_cook_days') || '["Tue","Sat"]'),
  selected:  JSON.parse(localStorage.getItem('mumma_selected')  || '{}'),
  shops:     JSON.parse(localStorage.getItem('mumma_shops')     || '{}')
};

function mummaSave() {
  localStorage.setItem('mumma_cook_days', JSON.stringify(MummaState.cookDays));
  localStorage.setItem('mumma_selected',  JSON.stringify(MummaState.selected));
  localStorage.setItem('mumma_shops',     JSON.stringify(MummaState.shops));
}


/* ─── MUMMA HOME ─────────────────────────────────────────────────────────── */

function buildMummaHome() {
  var day = getDayName();
  var plan = MUMMA_MEAL_PLAN[day] || MUMMA_MEAL_PLAN.Mon;
  var typeLabels = { cook:'Cook day 👩‍🍳', left:'Leftover ♻️', quick:'Quick cook ⚡', easy:'Easy day 😊' };
  var typeStyle = { cook:['#D1FAE5','#047857'], left:['#F3F4F6','#4B5563'], quick:['#FFEDD5','#C2410C'], easy:['#DBEAFE','#1D4ED8'] };
  var ts = typeStyle[plan.type] || typeStyle.easy;

  var h = '<div class="fadein" style="padding:14px;">';

  // Quick actions
  var actions = [['🛒','Grocery','Plan shopping',1],['🍽️','Meals','This week',2],['✅','Check','Confirm day',3],['📈','Progress','How she\'s doing',4]];
  h += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">';
  for (var i = 0; i < actions.length; i++) {
    var a = actions[i];
    h += '<button onclick="mummaNav(' + a[3] + ')" style="background:#fff; border:1px solid #F3F4F6; border-radius:16px; padding:14px; text-align:left; cursor:pointer; font-family:inherit;">'
      +    '<div style="font-size:24px; margin-bottom:6px;">' + a[0] + '</div>'
      +    '<div style="font-size:13px; font-weight:800; color:#1F2937;">' + a[1] + '</div>'
      +    '<div style="font-size:11px; font-weight:600; color:#9CA3AF; margin-top:1px;">' + a[2] + '</div></button>';
  }
  h += '</div>';

  // Today's meals
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:12px;">'
    +    '<div style="display:flex; align-items:center; gap:8px; padding:10px 16px; border-bottom:1px solid #F9FAFB;">'
    +      '<span style="font-size:18px;">🍽️</span><span style="flex:1; font-size:13px; font-weight:800; color:#1F2937;">Today — ' + day + '</span>'
    +      '<span style="font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; background:' + ts[0] + '; color:' + ts[1] + ';">' + typeLabels[plan.type] + '</span>'
    +    '</div>';
  for (var m = 0; m < plan.meals.length; m++) {
    var meal = plan.meals[m];
    h += '<div style="display:flex; align-items:flex-start; gap:12px; padding:10px 16px; border-bottom:1px solid #F9FAFB;">'
      +    '<span style="font-size:11px; font-weight:700; color:#9CA3AF; width:60px; padding-top:1px;">' + meal.t + '</span>'
      +    '<span style="flex:1; font-size:13px; font-weight:600; color:#374151;">' + meal.m + (meal.egg ? ' <span style="font-size:10px; font-weight:700; padding:1px 6px; border-radius:20px; background:#FFEDD5; color:#C2410C;">🥚 egg</span>' : '') + '</span></div>';
  }
  h += '</div>';

  // Cook days picker
  var allDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px; margin-bottom:12px;">'
    +    '<div style="font-size:13px; font-weight:800; color:#1F2937; margin-bottom:10px;">📅 Cook days this week — tap to set</div>'
    +    '<div style="display:flex; gap:6px; flex-wrap:wrap;">';
  for (var d = 0; d < allDays.length; d++) {
    var dn = allDays[d];
    var on = MummaState.cookDays.indexOf(dn) >= 0;
    h += '<button onclick="mummaToggleCook(\'' + dn + '\',this)" style="padding:6px 12px; border-radius:20px; font-size:11px; font-weight:800; border:1px solid ' + (on ? '#185FA5' : '#E5E7EB') + '; background:' + (on ? '#185FA5' : '#fff') + '; color:' + (on ? '#fff' : '#9CA3AF') + '; cursor:pointer; font-family:inherit;">' + dn + '</button>';
  }
  h += '</div></div>';

  // Food swaps (collapsible)
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:12px;">'
    +    '<button onclick="mummaToggleSwap()" style="width:100%; display:flex; align-items:center; gap:10px; padding:12px 16px; background:none; border:none; cursor:pointer; font-family:inherit;">'
    +      '<span style="font-size:18px;">🔄</span><span style="flex:1; font-size:13px; font-weight:700; color:#185FA5; text-align:left;">Can\'t find a food? See quick swaps</span><span id="m-swap-arrow" style="color:#9CA3AF;">▾</span>'
    +    '</button>'
    +    '<div id="m-swap-list" style="display:none; background:#EFF6FF; padding:12px 16px;">';
  var swaps = [['🥚','No eggs?','Extra paneer or dal'],['🥛','No yogurt?','Dosa or idli batter counts!'],['🥦','No broccoli?','Spinach, beans or cabbage'],['🧀','No paneer?','Tofu or extra lentils'],['🍌','No banana?','Any fruit — apple, orange, pear'],['🥜','No walnuts?','Almonds or cashews are fine']];
  for (var s = 0; s < swaps.length; s++) {
    h += '<div style="display:flex; align-items:center; gap:8px; padding:5px 0;"><span>' + swaps[s][0] + '</span><span style="font-size:11px; font-weight:800; color:#1E40AF;">' + swaps[s][1] + '</span><span style="font-size:11px; font-weight:600; color:#3B82F6;">→ ' + swaps[s][2] + '</span></div>';
  }
  h += '<div style="font-size:11px; font-weight:700; color:#1D4ED8; margin-top:6px;">💡 Any home-cooked Kerala food is already great for Ammu!</div></div></div>';

  h += '</div>';
  return h;
}

function mummaNav(index) {
  var btns = document.querySelectorAll('#bottom-nav button');
  if (btns[index]) btns[index].click();
}

function mummaToggleCook(day, btn) {
  var idx = MummaState.cookDays.indexOf(day);
  if (idx >= 0) MummaState.cookDays.splice(idx, 1);
  else MummaState.cookDays.push(day);
  mummaSave();
  var on = MummaState.cookDays.indexOf(day) >= 0;
  btn.style.background = on ? '#185FA5' : '#fff';
  btn.style.color = on ? '#fff' : '#9CA3AF';
  btn.style.borderColor = on ? '#185FA5' : '#E5E7EB';
}

function mummaToggleSwap() {
  var list = document.getElementById('m-swap-list');
  var arrow = document.getElementById('m-swap-arrow');
  if (!list) return;
  if (list.style.display === 'none') { list.style.display = 'block'; if (arrow) arrow.textContent = '▴'; }
  else { list.style.display = 'none'; if (arrow) arrow.textContent = '▾'; }
}

/* ─── MUMMA GROCERY ──────────────────────────────────────────────────────── */

function buildMummaGrocery() {
  var h = '<div class="fadein" style="padding:14px; padding-bottom:80px;">';

  // Rotation key
  h += '<div style="background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:12px; margin-bottom:12px;">'
    +    '<div style="font-size:11px; font-weight:800; color:#6B7280; margin-bottom:8px;">Rotation guide (3-week cycle):</div>'
    +    '<div style="display:flex; flex-wrap:wrap; gap:12px;">';
  var rotKeys = ['last','two','fresh'];
  for (var r = 0; r < rotKeys.length; r++) {
    var rs = ROT_STYLE[rotKeys[r]];
    h += '<div style="display:flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:' + rs.dot + '; display:inline-block;"></span><span style="font-size:11px; font-weight:600; color:#6B7280;">' + rs.label + '</span></div>';
  }
  h += '</div></div>';

  // Custom add
  h += '<div style="display:flex; gap:8px; margin-bottom:12px;">'
    +    '<input id="m-custom" type="text" placeholder="Add your own item..." style="flex:1; padding:10px 12px; border-radius:12px; border:1px solid #E5E7EB; font-size:13px; font-weight:600; font-family:inherit; box-sizing:border-box;" />'
    +    '<button onclick="mummaAddCustom()" style="padding:10px 16px; border-radius:12px; background:#185FA5; color:#fff; font-size:13px; font-weight:800; border:none; cursor:pointer; font-family:inherit;">Add</button>'
    +  '</div>';

  // Categories
  var catBorder = { staples:'#E5E7EB', fruits:'#FBCFE8', dry:'#FDE68A', snacks:'#BBF7D0', bone:'#99F6E4', muscle:'#FED7AA', gut:'#FBCFE8', brain:'#DDD6FE', energy:'#FDE68A' };

  for (var c = 0; c < MUMMA_GROCERY.length; c++) {
    var cat = MUMMA_GROCERY[c];
    var selCount = 0;
    for (var ci = 0; ci < cat.items.length; ci++) { if (MummaState.selected[cat.items[ci].id]) selCount++; }

    h += '<div style="background:#fff; border-radius:16px; border:2px solid ' + (catBorder[cat.id] || '#E5E7EB') + '; overflow:hidden; margin-bottom:12px;">'
      +    '<button onclick="mummaToggleCat(\'' + cat.id + '\')" style="width:100%; display:flex; align-items:center; gap:8px; padding:12px 16px; border-bottom:1px solid #F9FAFB; background:none; border-left:none; border-right:none; border-top:none; cursor:pointer; font-family:inherit; text-align:left;">'
      +      '<span style="font-size:20px;">' + cat.emoji + '</span>'
      +      '<div style="flex:1;"><div style="font-size:13px; font-weight:800; color:#1F2937;">' + cat.label + '</div><div style="font-size:11px; font-weight:600; color:#9CA3AF;">' + cat.why + '</div></div>'
      +      '<span id="cat-count-' + cat.id + '" style="font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; background:#F3F4F6; color:#6B7280;">' + selCount + ' picked</span>'
      +      '<span id="cat-chev-' + cat.id + '" style="color:#9CA3AF; font-size:13px;">▾</span>'
      +    '</button>'
      +    '<div id="cat-items-' + cat.id + '">';

    for (var ii = 0; ii < cat.items.length; ii++) {
      h += mummaItemRow(cat.items[ii]);
    }
    h += '</div></div>';
  }

  h += '</div>';

  // Sticky summary bar
  var total = 0;
  for (var k in MummaState.selected) { if (MummaState.selected[k]) total++; }
  h += '<div style="position:sticky; bottom:0; left:0; right:0; padding:8px 14px 12px;">'
    +    '<div style="background:#185FA5; border-radius:16px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 4px 16px rgba(0,0,0,0.2);">'
    +      '<div><div id="m-summary" style="font-size:15px; font-weight:800; color:#fff;">' + total + ' items selected</div><div style="font-size:10px; font-weight:600; color:#BFDBFE;">Tap items to assign shops</div></div>'
    +      '<button onclick="mummaShowLists()" style="background:#fff; color:#185FA5; font-size:12px; font-weight:800; padding:8px 16px; border-radius:12px; border:none; cursor:pointer; font-family:inherit;">My lists →</button>'
    +    '</div>'
    +  '</div>';

  return h;
}

function mummaItemRow(item) {
  var sel = MummaState.selected[item.id];
  var shop = MummaState.shops[item.id];
  var rs = ROT_STYLE[item.rot] || ROT_STYLE.none;

  var h = '<div id="gi-' + item.id + '" style="border-bottom:1px solid #F9FAFB; ' + (sel ? 'background:#ECFDF5;' : '') + '">'
    +    '<div onclick="mummaToggleItem(\'' + item.id + '\')" style="display:flex; align-items:flex-start; gap:12px; padding:11px 16px; cursor:pointer;">'
    +      '<div class="mcb" style="width:20px; height:20px; border-radius:6px; border:2px solid ' + (sel ? '#0F6E56' : '#E5E7EB') + '; background:' + (sel ? '#0F6E56' : 'transparent') + '; flex-shrink:0; display:flex; align-items:center; justify-content:center; margin-top:1px;">' + (sel ? '<span style="color:#fff; font-size:12px;">✓</span>' : '') + '</div>'
    +      '<span style="font-size:18px; flex-shrink:0;">' + item.e + '</span>'
    +      '<div style="flex:1; min-width:0;"><div style="font-size:13px; font-weight:700; color:#1F2937;">' + item.name + '</div><div style="font-size:11px; font-weight:600; color:#9CA3AF;">' + item.qty + '</div></div>'
    +      '<span style="display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px; background:' + rs.bg + '; color:' + rs.color + '; flex-shrink:0;"><span style="width:6px; height:6px; border-radius:50%; background:' + rs.dot + '; display:inline-block;"></span>' + rs.label + '</span>'
    +    '</div>'
    +    '<div id="shops-' + item.id + '" style="' + (sel ? '' : 'display:none;') + ' padding:0 16px 11px 48px;">' + (sel ? mummaShopButtons(item.id) : '') + '</div>'
    +  '</div>';
  return h;
}

function mummaShopButtons(itemId) {
  var current = MummaState.shops[itemId];
  var out = '<div style="display:flex; flex-wrap:wrap; gap:5px;">';
  for (var i = 0; i < SHOPS.length; i++) {
    var shop = SHOPS[i];
    var on = (current === shop);
    var st = SHOP_STYLE[shop];
    out += '<button onclick="event.stopPropagation(); mummaAssignShop(\'' + itemId + '\',\'' + shop + '\')" style="font-size:10px; font-weight:700; padding:3px 9px; border-radius:20px; border:1px solid ' + (on ? st.border : '#E5E7EB') + '; background:' + (on ? st.bg : '#fff') + '; color:' + (on ? st.color : '#9CA3AF') + '; cursor:pointer; font-family:inherit;">' + shop + '</button>';
  }
  out += '</div>';
  return out;
}

function mummaToggleItem(itemId) {
  MummaState.selected[itemId] = !MummaState.selected[itemId];
  if (!MummaState.selected[itemId]) delete MummaState.shops[itemId];
  mummaSave();

  var row = document.getElementById('gi-' + itemId);
  var cb = row.querySelector('.mcb');
  var shopsDiv = document.getElementById('shops-' + itemId);
  if (MummaState.selected[itemId]) {
    row.style.background = '#ECFDF5';
    cb.style.background = '#0F6E56'; cb.style.borderColor = '#0F6E56';
    cb.innerHTML = '<span style="color:#fff; font-size:12px;">✓</span>';
    shopsDiv.innerHTML = mummaShopButtons(itemId);
    shopsDiv.style.display = 'block';
  } else {
    row.style.background = 'transparent';
    cb.style.background = 'transparent'; cb.style.borderColor = '#E5E7EB';
    cb.innerHTML = '';
    shopsDiv.style.display = 'none';
    shopsDiv.innerHTML = '';
  }
  mummaUpdateCounts(itemId);
}

function mummaAssignShop(itemId, shop) {
  MummaState.shops[itemId] = shop;
  mummaSave();
  var shopsDiv = document.getElementById('shops-' + itemId);
  if (shopsDiv) shopsDiv.innerHTML = mummaShopButtons(itemId);
}

function mummaUpdateCounts(itemId) {
  // Update category count + summary
  for (var c = 0; c < MUMMA_GROCERY.length; c++) {
    var cat = MUMMA_GROCERY[c];
    var found = false, cnt = 0;
    for (var i = 0; i < cat.items.length; i++) {
      if (cat.items[i].id === itemId) found = true;
      if (MummaState.selected[cat.items[i].id]) cnt++;
    }
    if (found) {
      var el = document.getElementById('cat-count-' + cat.id);
      if (el) el.textContent = cnt + ' picked';
    }
  }
  var total = 0;
  for (var k in MummaState.selected) { if (MummaState.selected[k]) total++; }
  var sum = document.getElementById('m-summary');
  if (sum) sum.textContent = total + ' items selected';
}

function mummaToggleCat(catId) {
  var items = document.getElementById('cat-items-' + catId);
  var chev = document.getElementById('cat-chev-' + catId);
  if (!items) return;
  if (items.style.display === 'none') { items.style.display = 'block'; if (chev) chev.textContent = '▾'; }
  else { items.style.display = 'none'; if (chev) chev.textContent = '▸'; }
}

function mummaAddCustom() {
  var input = document.getElementById('m-custom');
  if (!input || !input.value.trim()) return;
  alert('"' + input.value.trim() + '" noted! Custom items will be saved in a future update.');
  input.value = '';
}

function mummaShowLists() {
  var byShop = {};
  for (var c = 0; c < MUMMA_GROCERY.length; c++) {
    var items = MUMMA_GROCERY[c].items;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (MummaState.selected[it.id] && MummaState.shops[it.id]) {
        var shop = MummaState.shops[it.id];
        if (!byShop[shop]) byShop[shop] = [];
        byShop[shop].push(it);
      }
    }
  }
  if (Object.keys(byShop).length === 0) {
    alert('No shops assigned yet! Select items and tap a shop name to assign them.');
    return;
  }
  var html = '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shopping Lists</title></head><body style="font-family:sans-serif; padding:16px; margin:0;">';
  html += '<div style="font-size:20px; font-weight:900; margin-bottom:16px;">🛒 My Shopping Lists</div>';
  for (var shopName in byShop) {
    html += '<div style="margin-bottom:16px;"><div style="font-size:14px; font-weight:800; color:#185FA5; margin-bottom:8px;">' + shopName + ' (' + byShop[shopName].length + ')</div>';
    for (var j = 0; j < byShop[shopName].length; j++) {
      var p = byShop[shopName][j];
      html += '<div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid #eee;"><span style="width:18px; height:18px; border-radius:4px; border:2px solid #ccc; display:inline-block;"></span><span style="font-size:14px;">' + p.e + ' ' + p.name + '</span><span style="font-size:12px; color:#999; margin-left:auto;">' + p.qty + '</span></div>';
    }
    html += '</div>';
  }
  html += '<div style="font-size:12px; color:#999; margin-top:8px;">Screenshot this to take to the shop 📸</div></body></html>';
  var w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
  else alert('Please allow popups to see your store lists.');
}


/* ─── MUMMA MEALS ────────────────────────────────────────────────────────── */

function buildMummaMeals() {
  var days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var typeLabels = { cook:'Cook day 👩‍🍳', left:'Leftover ♻️', quick:'Quick cook ⚡', easy:'Easy day 😊' };
  var typeStyle = { cook:['#D1FAE5','#047857','#A7F3D0'], left:['#F3F4F6','#4B5563','#E5E7EB'], quick:['#FFEDD5','#C2410C','#FED7AA'], easy:['#DBEAFE','#1D4ED8','#BFDBFE'] };
  var today = getDayName();

  var h = '<div class="fadein" style="padding:14px;">';
  h += '<div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:14px; padding:12px; margin-bottom:12px; display:flex; align-items:center; gap:8px;"><span style="font-size:16px;">ℹ️</span><span style="font-size:11px; font-weight:700; color:#065F46;">Auto-built around your cook days. Change them on the Home tab.</span></div>';

  for (var d = 0; d < days.length; d++) {
    var day = days[d];
    var plan = MUMMA_MEAL_PLAN[day];
    var isCook = MummaState.cookDays.indexOf(day) >= 0;
    var type = isCook ? 'cook' : plan.type;
    var ts = typeStyle[type] || typeStyle.easy;

    h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:12px;">'
      +    '<div style="display:flex; align-items:center; padding:10px 16px; border-bottom:1px solid #F9FAFB;">'
      +      '<span style="flex:1; font-size:13px; font-weight:800; color:#1F2937;">' + day + (day === today ? ' — Today' : '') + '</span>'
      +      '<span style="font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; background:' + ts[0] + '; color:' + ts[1] + '; border:1px solid ' + ts[2] + ';">' + typeLabels[type] + '</span>'
      +    '</div>';
    for (var m = 0; m < plan.meals.length; m++) {
      var meal = plan.meals[m];
      h += '<div style="display:flex; align-items:flex-start; gap:12px; padding:10px 16px; border-bottom:1px solid #F9FAFB;">'
        +    '<span style="font-size:11px; font-weight:700; color:#9CA3AF; width:60px; padding-top:1px;">' + meal.t + '</span>'
        +    '<span style="flex:1; font-size:13px; font-weight:600; color:#374151;">' + meal.m + (meal.egg ? ' <span style="font-size:10px; font-weight:700; padding:1px 6px; border-radius:20px; background:#FFEDD5; color:#C2410C;">🥚 egg</span>' : '') + '</span></div>';
    }
    h += '</div>';
  }
  h += '</div>';
  return h;
}

/* ─── MUMMA CHECK ────────────────────────────────────────────────────────── */

function buildMummaCheck() {
  var h = '<div class="fadein" style="padding:14px;">';
  h += '<div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:14px; padding:12px; margin-bottom:12px; display:flex; align-items:center; gap:8px;"><span style="font-size:18px;">👩</span><span style="font-size:11px; font-weight:700; color:#1E40AF;">Hi Mumma! Just 3 quick ticks — that\'s all! Thank you 🙏</span></div>';

  h += '<div style="background:#fff; border-radius:16px; border:2px solid #BFDBFE; overflow:hidden; margin-bottom:12px;">'
    +    '<div style="background:#185FA5; padding:10px 16px; display:flex; align-items:center; gap:8px;"><span style="font-size:18px;">✅</span><span style="font-size:16px; font-weight:800; color:#fff;">Mumma\'s daily check</span></div>';

  var items = [
    ['truth','✅','Ammu told the truth in her checklist','You verified she did what she ticked'],
    ['meals','🍽️','She had proper meals today','Breakfast, lunch and dinner covered'],
    ['wellbeing','😊','She seemed happy and well today','Good energy, no tummy issues']
  ];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    h += '<div onclick="mummaCheckTick(\'' + it[0] + '\')" style="display:flex; align-items:flex-start; gap:12px; padding:12px 16px; border-bottom:1px solid #F9FAFB; cursor:pointer;">'
      +    '<div id="mc-' + it[0] + '" class="mc-box" style="width:24px; height:24px; border-radius:8px; border:2px solid #E5E7EB; flex-shrink:0; display:flex; align-items:center; justify-content:center; margin-top:1px;"></div>'
      +    '<div><div style="font-size:13px; font-weight:700; color:#1F2937;">' + it[1] + ' ' + it[2] + '</div><div style="font-size:11px; font-weight:600; color:#9CA3AF; margin-top:1px;">' + it[3] + '</div></div></div>';
  }
  h += '</div>';

  h += '<button id="m-save-check" onclick="mummaSaveCheck()" style="width:100%; padding:16px; border-radius:16px; background:#185FA5; color:#fff; font-size:18px; font-weight:800; border:none; cursor:pointer; font-family:inherit; margin-bottom:12px;">Save today\'s check 🌸</button>';

  h += '<div id="m-check-saved" style="display:none; background:#ECFDF5; border:2px solid #A7F3D0; border-radius:16px; padding:16px; text-align:center;"><div style="font-size:28px; margin-bottom:6px;">✅</div><div style="font-size:16px; font-weight:800; color:#065F46;">Saved! Thank you Mumma 🙏</div><div style="font-size:11px; font-weight:600; color:#059669; margin-top:2px;">Abbu can see this from Palakkad</div></div>';

  h += '</div>';
  return h;
}

function mummaCheckTick(id) {
  var box = document.getElementById('mc-' + id);
  if (!box) return;
  var on = box.getAttribute('data-on') === '1';
  if (!on) {
    box.setAttribute('data-on','1');
    box.style.background = '#185FA5'; box.style.borderColor = '#185FA5';
    box.innerHTML = '<span style="color:#fff; font-size:13px; font-weight:800;">✓</span>';
  } else {
    box.setAttribute('data-on','0');
    box.style.background = 'transparent'; box.style.borderColor = '#E5E7EB';
    box.innerHTML = '';
  }
}

function mummaSaveCheck() {
  var btn = document.getElementById('m-save-check');
  var saved = document.getElementById('m-check-saved');
  if (btn) { btn.disabled = true; btn.style.background = '#9CA3AF'; }
  if (saved) saved.style.display = 'block';
  function val(id) { var b = document.getElementById('mc-' + id); return (b && b.getAttribute('data-on') === '1') ? 'yes' : 'no'; }
  if (typeof submitData === 'function') {
    submitData({ type:'mumma_check', truth:val('truth'), meals:val('meals'), wellbeing:val('wellbeing') });
  }
}

/* ─── MUMMA PROGRESS ─────────────────────────────────────────────────────── */

function buildMummaProgress() {
  var meas = [['📏','Height','139cm','+0.5cm'],['⚖️','Weight','33.2kg','+0.8kg'],['💪','Bicep','19cm','+1cm'],['✋','Forearm','17cm','+0.5cm'],['🫁','Waist','58cm','no change'],['🏊','Shoulder','34cm','+0.5cm']];
  var h = '<div class="fadein" style="padding:14px;">';
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; text-align:center; padding:6px 0 12px;">📏 Ammu\'s latest measurements</div>';
  h += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">';
  for (var i = 0; i < meas.length; i++) {
    var m = meas[i];
    var noChange = m[3] === 'no change';
    h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:12px;"><div style="font-size:20px; margin-bottom:2px;">' + m[0] + '</div><div style="font-size:11px; font-weight:600; color:#9CA3AF;">' + m[1] + '</div><div style="font-size:18px; font-weight:900; color:#185FA5;">' + m[2] + '</div><div style="font-size:10px; font-weight:800; color:' + (noChange ? '#9CA3AF' : '#10B981') + '; margin-top:1px;">' + m[3] + '</div></div>';
  }
  h += '</div>';
  h += '<div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:14px; padding:12px; text-align:center;"><div style="font-size:12px; font-weight:800; color:#1E40AF;">Measurements are entered by Ammu on the last Sunday of each month</div></div>';
  h += '</div>';
  return h;
}

/* ─── MUMMA PAGE DISPATCH ────────────────────────────────────────────────── */

function renderMummaPage(pageId) {
  if (pageId === 'home')     return buildMummaHome();
  if (pageId === 'grocery')  return buildMummaGrocery();
  if (pageId === 'meals')    return buildMummaMeals();
  if (pageId === 'check')    return buildMummaCheck();
  if (pageId === 'progress') return buildMummaProgress();
  return null;
}


/* ============================================================================
   MODULE 4: ABBU'S SECTION
   Pages: Today, Weekly, Report, Goals, Alerts, Progress
   Abbu monitors from Palakkad, India.
   ============================================================================ */

/* ─── ABBU DATA ──────────────────────────────────────────────────────────── */

var ABBU_REPORT_TEMPLATES = [
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

var ABBU_REPORT_DATA = {
  bestDay:'Wednesday', streak:12, exercises:24, eggs:26, animal:'🐘 Elephant',
  perfectDays:8, mostImproved:'Muscle Power 💪', daysTracked:27, coins:247,
  water:142, reading:18, weakest:'Gut Health 🌱', strongest:'Exercise ⚡'
};

var abbuGoals = JSON.parse(localStorage.getItem('abbu_goals') || 'null') || [
  { id:1, who:'Ammu',  text:'Do 10 push-ups in a row by end of month', status:'agreed' },
  { id:2, who:'Abbu',  text:'Eat egg every single day this month',     status:'proposed' },
  { id:3, who:'Mumma', text:'Try one new green vegetable each week',    status:'agreed' }
];

var abbuRewards = JSON.parse(localStorage.getItem('abbu_rewards') || 'null') || [
  { id:1, item:'🎬 Movie night request', from:'Ammu', detail:'Wants to watch a slightly grown-up movie', status:'pending' },
  { id:2, item:'🍕 Cheat day', from:'Ammu', detail:'Completed 10 days streak!', status:'pending' }
];

function abbuSaveGoals()  { localStorage.setItem('abbu_goals',   JSON.stringify(abbuGoals)); }
function abbuSaveRewards() { localStorage.setItem('abbu_rewards', JSON.stringify(abbuRewards)); }

/* ─── ABBU TODAY ─────────────────────────────────────────────────────────── */

function buildAbbuToday() {
  var h = '<div class="fadein" style="padding:14px;">';

  // Traffic lights
  var lights = [['App opened today','green'],['Morning checklist','green'],['Exercise done','green'],['Evening checklist','amber'],['Mumma confirmed','red']];
  var lightColor = { green:['#ECFDF5','#10B981','✅'], amber:['#FFFBEB','#F59E0B','⏳'], red:['#FEF2F2','#EF4444','⌛'] };
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:12px;">'
    +    '<div style="padding:10px 16px; border-bottom:1px solid #F9FAFB; font-size:13px; font-weight:800; color:#1F2937;">📊 Today at a glance</div>';
  for (var i = 0; i < lights.length; i++) {
    var lc = lightColor[lights[i][1]];
    h += '<div style="display:flex; align-items:center; gap:12px; padding:10px 16px; border-bottom:1px solid #F9FAFB;"><span style="font-size:18px;">' + lc[2] + '</span><span style="flex:1; font-size:13px; font-weight:600; color:#374151;">' + lights[i][0] + '</span><span style="width:12px; height:12px; border-radius:50%; background:' + lc[1] + ';"></span></div>';
  }
  h += '</div>';

  // Quick stats
  h += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">'
    +    '<div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:16px; padding:14px; text-align:center;"><div style="font-size:28px; font-weight:900; color:#F59E0B;">247</div><div style="font-size:11px; font-weight:700; color:#B45309;">🪙 coins</div></div>'
    +    '<div style="background:#FFF7ED; border:1px solid #FED7AA; border-radius:16px; padding:14px; text-align:center;"><div style="font-size:28px; font-weight:900; color:#F97316;">12</div><div style="font-size:11px; font-weight:700; color:#C2410C;">🔥 day streak</div></div>'
    +  '</div>';

  // Proud Abbu button
  h += '<div style="background:#1A1A3E; border-radius:16px; padding:16px; margin-bottom:12px; text-align:center;">'
    +    '<div style="font-size:40px; margin-bottom:6px;">🦣</div>'
    +    '<div style="font-size:15px; font-weight:800; color:#fff; margin-bottom:4px;">Send Ammu some love!</div>'
    +    '<div style="font-size:11px; font-weight:600; color:#A5B4FC; margin-bottom:12px;">She will see your message pop up in her app 💙</div>'
    +    '<button onclick="abbuShowProud()" style="background:#fff; color:#1A1A3E; font-size:15px; font-weight:800; padding:12px 28px; border-radius:14px; border:none; cursor:pointer; font-family:inherit;">🦣 Proud Abbu Button!</button>'
    +    '<div id="abbu-proud-form" style="display:none; margin-top:12px;">'
    +      '<textarea id="abbu-proud-msg" placeholder="Write your message to Ammu..." style="width:100%; padding:12px; border-radius:12px; border:none; font-size:13px; font-family:inherit; box-sizing:border-box; resize:none; height:70px;"></textarea>'
    +      '<button onclick="abbuSendProud()" style="width:100%; margin-top:8px; background:#10B981; color:#fff; font-size:14px; font-weight:800; padding:10px; border-radius:12px; border:none; cursor:pointer; font-family:inherit;">Send to Ammu 💌</button>'
    +    '</div>'
    +    '<div id="abbu-proud-sent" style="display:none; margin-top:12px; font-size:13px; font-weight:800; color:#6EE7B7;">✅ Sent! Ammu will be so happy 🥰</div>'
    +  '</div>';

  // Today's checklist view (read-only)
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; overflow:hidden;">'
    +    '<div style="padding:10px 16px; border-bottom:1px solid #F9FAFB; font-size:13px; font-weight:800; color:#1F2937;">✅ What Ammu ticked today</div>';
  var checks = [['🏋️','Exercise','done'],['🥚','Egg','done'],['🥛','Yogurt','done'],['💧','Water (4 cups)','partial'],['🧘','Meditation','done'],['🌱','Fermented food','missing']];
  for (var c = 0; c < checks.length; c++) {
    var st = checks[c][2];
    var icon = st === 'done' ? '✅' : st === 'partial' ? '🔶' : '⬜';
    h += '<div style="display:flex; align-items:center; gap:12px; padding:9px 16px; border-bottom:1px solid #F9FAFB;"><span style="font-size:16px;">' + checks[c][0] + '</span><span style="flex:1; font-size:13px; font-weight:600; color:#374151;">' + checks[c][1] + '</span><span style="font-size:14px;">' + icon + '</span></div>';
  }
  h += '</div>';

  h += '</div>';
  return h;
}

function abbuShowProud() {
  var form = document.getElementById('abbu-proud-form');
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function abbuSendProud() {
  var msg = document.getElementById('abbu-proud-msg');
  var text = msg ? msg.value.trim() : '';
  if (!text) { alert('Please write a message first!'); return; }
  if (typeof submitData === 'function') submitData({ type:'proud_abbu', message:text, from:'abbu' });
  var form = document.getElementById('abbu-proud-form');
  var sent = document.getElementById('abbu-proud-sent');
  if (form) form.style.display = 'none';
  if (sent) sent.style.display = 'block';
}


/* ─── ABBU WEEKLY ────────────────────────────────────────────────────────── */

function buildAbbuWeekly() {
  var days = [['Mon',85],['Tue',70],['Wed',90],['Thu',45],['Fri',88],['Sat',75],['Sun',60]];
  var h = '<div class="fadein" style="padding:14px;">';

  // Bar chart
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px; margin-bottom:12px;">'
    +    '<div style="font-size:13px; font-weight:800; color:#1F2937; margin-bottom:14px;">📈 This week\'s completion</div>'
    +    '<div style="display:flex; align-items:flex-end; gap:6px; height:120px;">';
  for (var i = 0; i < days.length; i++) {
    var pct = days[i][1];
    var col = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
    h += '<div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;">'
      +    '<div style="font-size:9px; font-weight:800; color:#6B7280; margin-bottom:2px;">' + pct + '%</div>'
      +    '<div style="width:100%; background:' + col + '; border-radius:4px 4px 0 0; height:' + pct + '%;"></div>'
      +    '<div style="font-size:10px; font-weight:700; color:#9CA3AF; margin-top:4px;">' + days[i][0] + '</div></div>';
  }
  h += '</div></div>';

  // Category breakdown
  var cats = [['⚡','Exercise',92,'#0F6E56'],['🦴','Bones',85,'#0D9488'],['💪','Muscles',74,'#EA580C'],['🌱','Gut',68,'#DB2777'],['🧠','Brain',80,'#7C3AED'],['😊','Peace',55,'#2563EB']];
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px; margin-bottom:12px;">'
    +    '<div style="font-size:13px; font-weight:800; color:#1F2937; margin-bottom:12px;">🎯 Category breakdown</div>';
  for (var c = 0; c < cats.length; c++) {
    h += '<div style="margin-bottom:10px;"><div style="display:flex; justify-content:space-between; margin-bottom:3px;"><span style="font-size:12px; font-weight:700; color:#374151;">' + cats[c][0] + ' ' + cats[c][1] + '</span><span style="font-size:12px; font-weight:800; color:' + cats[c][3] + ';">' + cats[c][2] + '%</span></div><div style="height:8px; background:#F3F4F6; border-radius:20px; overflow:hidden;"><div style="height:100%; background:' + cats[c][3] + '; border-radius:20px; width:' + cats[c][2] + '%;"></div></div></div>';
  }
  h += '</div>';

  // Weekly note
  h += '<div style="background:#1A1A3E; border-radius:16px; padding:16px;">'
    +    '<div style="font-size:14px; font-weight:800; color:#fff; margin-bottom:8px;">💌 Send Ammu a weekly note</div>'
    +    '<textarea id="abbu-weekly-note" placeholder="Write something encouraging about her week..." style="width:100%; padding:12px; border-radius:12px; border:none; font-size:13px; font-family:inherit; box-sizing:border-box; resize:none; height:80px;"></textarea>'
    +    '<button onclick="abbuSaveWeeklyNote()" style="width:100%; margin-top:8px; background:#10B981; color:#fff; font-size:14px; font-weight:800; padding:10px; border-radius:12px; border:none; cursor:pointer; font-family:inherit;">Send note 💌</button>'
    +    '<div id="abbu-note-sent" style="display:none; margin-top:8px; text-align:center; font-size:13px; font-weight:800; color:#6EE7B7;">✅ Note sent to Ammu!</div>'
    +  '</div>';

  h += '</div>';
  return h;
}

function abbuSaveWeeklyNote() {
  var note = document.getElementById('abbu-weekly-note');
  var text = note ? note.value.trim() : '';
  if (!text) { alert('Please write a note first!'); return; }
  if (typeof submitData === 'function') submitData({ type:'weekly_note', from:'abbu', message:text });
  var sent = document.getElementById('abbu-note-sent');
  if (sent) sent.style.display = 'block';
  if (note) note.value = '';
}

/* ─── ABBU REPORT ────────────────────────────────────────────────────────── */

var abbuReportIndex = 0;

function buildAbbuReport() {
  var tmpl = ABBU_REPORT_TEMPLATES[abbuReportIndex % ABBU_REPORT_TEMPLATES.length];
  var d = ABBU_REPORT_DATA;
  var stats = tmpl.stats(d);
  var note = tmpl.note(d);

  var grades = [['⚡','Exercise','A+'],['🦴','Bones','A'],['💪','Muscles','B+'],['🌱','Gut','B'],['🧠','Brain','A'],['😊','Peace','B-']];

  var h = '<div class="fadein" style="padding:14px;">';

  h += '<div style="background:#fff; border-radius:16px; border:2px solid #1A1A3E; overflow:hidden; margin-bottom:12px;">'
    +    '<div style="background:#1A1A3E; padding:16px; text-align:center;"><div style="font-size:28px;">📋</div><div style="font-size:17px; font-weight:900; color:#fff;">Ammu\'s Monthly Report</div><div style="font-size:11px; font-weight:600; color:#A5B4FC;">From Abbu, with love 💙</div></div>';

  // Grades grid
  h += '<div style="padding:16px; border-bottom:1px solid #F3F4F6;"><div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">';
  for (var g = 0; g < grades.length; g++) {
    var grade = grades[g][2];
    var gcol = grade.indexOf('A') === 0 ? '#10B981' : grade.indexOf('B') === 0 ? '#F59E0B' : '#EF4444';
    h += '<div style="background:#F9FAFB; border-radius:12px; padding:10px; text-align:center;"><div style="font-size:20px;">' + grades[g][0] + '</div><div style="font-size:10px; font-weight:600; color:#9CA3AF;">' + grades[g][1] + '</div><div style="font-size:22px; font-weight:900; color:' + gcol + ';">' + grade + '</div></div>';
  }
  h += '</div></div>';

  // Stats
  h += '<div style="padding:8px 16px;">';
  for (var s = 0; s < stats.length; s++) {
    h += '<div style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid #F9FAFB;"><span style="font-size:18px;">' + stats[s].e + '</span><span style="flex:1; font-size:12px; font-weight:600; color:#6B7280;">' + stats[s].t + '</span><span style="font-size:13px; font-weight:800; color:#1F2937;">' + stats[s].v + '</span></div>';
  }
  h += '</div>';

  // Personal note
  h += '<div style="padding:16px; background:#F5F3FF; margin:0 16px 16px; border-radius:12px;"><div id="abbu-report-note" style="font-size:13px; font-weight:600; color:#5B21B6; line-height:1.6; font-style:italic;">' + note + '</div></div>';

  h += '</div>';

  // Regenerate
  h += '<button onclick="abbuRegenReport()" style="width:100%; padding:12px; border-radius:12px; background:#fff; color:#1A1A3E; font-size:14px; font-weight:800; border:2px solid #1A1A3E; cursor:pointer; font-family:inherit; margin-bottom:12px;">🔄 Try a different report style</button>';

  // Edit note
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px;">'
    +    '<div style="font-size:13px; font-weight:800; color:#1F2937; margin-bottom:8px;">✏️ Add your own note</div>'
    +    '<textarea id="abbu-note-input" placeholder="Write a personal message for the report..." style="width:100%; padding:12px; border-radius:12px; border:1px solid #E5E7EB; font-size:13px; font-family:inherit; box-sizing:border-box; resize:none; height:70px;"></textarea>'
    +    '<button onclick="abbuSaveReportNote()" style="width:100%; margin-top:8px; background:#1A1A3E; color:#fff; font-size:14px; font-weight:800; padding:10px; border-radius:12px; border:none; cursor:pointer; font-family:inherit;">Save to report</button>'
    +  '</div>';

  h += '</div>';
  return h;
}

function abbuRegenReport() {
  abbuReportIndex++;
  var page = document.getElementById('page-abbu-report');
  if (page) page.innerHTML = buildAbbuReport();
}

function abbuSaveReportNote() {
  var input = document.getElementById('abbu-note-input');
  var text = input ? input.value.trim() : '';
  if (!text) { alert('Please write a note first!'); return; }
  var noteEl = document.getElementById('abbu-report-note');
  if (noteEl) noteEl.textContent = text;
  if (typeof submitData === 'function') submitData({ type:'weekly_note', from:'abbu_report', message:text });
  alert('Note saved to the report! 💙');
}


/* ─── ABBU GOALS ─────────────────────────────────────────────────────────── */

function buildAbbuGoals() {
  var statusStyle = {
    agreed:   { bg:'#ECFDF5', color:'#047857', border:'#A7F3D0', label:'✅ Agreed' },
    proposed: { bg:'#FFFBEB', color:'#B45309', border:'#FDE68A', label:'⏳ Proposed' },
    revised:  { bg:'#EFF6FF', color:'#1D4ED8', border:'#BFDBFE', label:'✏️ Revised' }
  };
  var whoEmoji = { Ammu:'🦁', Abbu:'🦣', Mumma:'🌸' };

  var h = '<div class="fadein" style="padding:14px;">';
  h += '<div style="background:#EEF2FF; border:1px solid #C7D2FE; border-radius:14px; padding:12px; margin-bottom:12px; font-size:11px; font-weight:700; color:#3730A3;">🎯 Goals are agreed together — Ammu proposes, Abbu revises, Mumma agrees!</div>';

  for (var i = 0; i < abbuGoals.length; i++) {
    var g = abbuGoals[i];
    var ss = statusStyle[g.status] || statusStyle.proposed;
    h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:14px; margin-bottom:10px;">'
      +    '<div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;"><span style="font-size:18px;">' + (whoEmoji[g.who] || '🎯') + '</span><span style="flex:1; font-size:11px; font-weight:700; color:#9CA3AF;">Set by ' + g.who + '</span><span style="font-size:10px; font-weight:800; padding:3px 8px; border-radius:20px; background:' + ss.bg + '; color:' + ss.color + '; border:1px solid ' + ss.border + ';">' + ss.label + '</span></div>'
      +    '<div style="font-size:14px; font-weight:700; color:#1F2937; margin-bottom:10px;">' + g.text + '</div>'
      +    '<div style="display:flex; gap:6px;">'
      +      (g.status !== 'agreed' ? '<button onclick="abbuAgreeGoal(' + g.id + ')" style="flex:1; font-size:11px; font-weight:800; background:#10B981; color:#fff; padding:7px; border-radius:10px; border:none; cursor:pointer; font-family:inherit;">✅ Agree</button>' : '')
      +      '<button onclick="abbuReviseGoal(' + g.id + ')" style="flex:1; font-size:11px; font-weight:800; background:#fff; color:#1D4ED8; padding:7px; border-radius:10px; border:1px solid #BFDBFE; cursor:pointer; font-family:inherit;">✏️ Revise</button>'
      +    '</div>'
      +  '</div>';
  }

  // Add new goal
  h += '<div style="background:#fff; border-radius:16px; border:2px dashed #C7D2FE; padding:16px; margin-top:4px;">'
    +    '<div style="font-size:13px; font-weight:800; color:#1F2937; margin-bottom:8px;">➕ Add a new goal</div>'
    +    '<textarea id="abbu-new-goal" placeholder="e.g. Drink 6 glasses of water every day" style="width:100%; padding:12px; border-radius:12px; border:1px solid #E5E7EB; font-size:13px; font-family:inherit; box-sizing:border-box; resize:none; height:60px;"></textarea>'
    +    '<button onclick="abbuAddGoal()" style="width:100%; margin-top:8px; background:#1A1A3E; color:#fff; font-size:14px; font-weight:800; padding:10px; border-radius:12px; border:none; cursor:pointer; font-family:inherit;">Propose this goal</button>'
    +  '</div>';

  h += '</div>';
  return h;
}

function abbuAgreeGoal(id) {
  for (var i = 0; i < abbuGoals.length; i++) { if (abbuGoals[i].id === id) abbuGoals[i].status = 'agreed'; }
  abbuSaveGoals();
  var page = document.getElementById('page-abbu-goals');
  if (page) page.innerHTML = buildAbbuGoals();
}

function abbuReviseGoal(id) {
  var newText = prompt('Revise this goal:');
  if (!newText) return;
  for (var i = 0; i < abbuGoals.length; i++) { if (abbuGoals[i].id === id) { abbuGoals[i].text = newText; abbuGoals[i].status = 'revised'; abbuGoals[i].who = 'Abbu'; } }
  abbuSaveGoals();
  var page = document.getElementById('page-abbu-goals');
  if (page) page.innerHTML = buildAbbuGoals();
}

function abbuAddGoal() {
  var input = document.getElementById('abbu-new-goal');
  var text = input ? input.value.trim() : '';
  if (!text) { alert('Please write a goal first!'); return; }
  var newId = Date.now();
  abbuGoals.push({ id:newId, who:'Abbu', text:text, status:'proposed' });
  abbuSaveGoals();
  var page = document.getElementById('page-abbu-goals');
  if (page) page.innerHTML = buildAbbuGoals();
}

/* ─── ABBU ALERTS ────────────────────────────────────────────────────────── */

function buildAbbuAlerts() {
  var h = '<div class="fadein" style="padding:14px;">';

  // Reward approvals
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; padding:6px 0;">🎁 Reward requests to approve</div>';
  var pendingCount = 0;
  for (var i = 0; i < abbuRewards.length; i++) {
    var r = abbuRewards[i];
    if (r.status === 'pending') pendingCount++;
    var statusBadge = r.status === 'approved' ? '<span style="font-size:10px; font-weight:800; color:#047857;">✅ Approved</span>'
      : r.status === 'rejected' ? '<span style="font-size:10px; font-weight:800; color:#DC2626;">❌ Declined</span>' : '';
    h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:14px; margin-bottom:10px;">'
      +    '<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;"><span style="flex:1; font-size:14px; font-weight:800; color:#1F2937;">' + r.item + '</span>' + statusBadge + '</div>'
      +    '<div style="font-size:11px; font-weight:600; color:#9CA3AF; margin-bottom:10px;">From ' + r.from + ' — ' + r.detail + '</div>'
      +    (r.status === 'pending' ? '<div style="display:flex; gap:6px;"><button onclick="abbuApprove(' + r.id + ')" style="flex:1; font-size:12px; font-weight:800; background:#10B981; color:#fff; padding:8px; border-radius:10px; border:none; cursor:pointer; font-family:inherit;">✅ Approve</button><button onclick="abbuReject(' + r.id + ')" style="flex:1; font-size:12px; font-weight:800; background:#fff; color:#DC2626; padding:8px; border-radius:10px; border:1px solid #FCA5A5; cursor:pointer; font-family:inherit;">Decline</button></div>' : '')
      +  '</div>';
  }
  if (pendingCount === 0 && abbuRewards.length === 0) {
    h += '<div style="background:#F9FAFB; border-radius:12px; padding:20px; text-align:center; font-size:12px; color:#9CA3AF; font-weight:600;">No pending requests</div>';
  }

  // Notifications
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; padding:14px 0 6px;">🔔 Recent activity</div>';
  var notifs = [['🔥','Ammu hit a 12-day streak!','2 hours ago'],['🥚','Ate egg 6 days this week','Today'],['📏','New measurements added','Yesterday'],['😊','Mood: Happy 4 days running','This week']];
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:12px;">';
  for (var n = 0; n < notifs.length; n++) {
    h += '<div style="display:flex; align-items:center; gap:12px; padding:11px 16px; border-bottom:1px solid #F9FAFB;"><span style="font-size:18px;">' + notifs[n][0] + '</span><span style="flex:1; font-size:13px; font-weight:600; color:#374151;">' + notifs[n][1] + '</span><span style="font-size:10px; font-weight:600; color:#D1D5DB;">' + notifs[n][2] + '</span></div>';
  }
  h += '</div>';

  // Secret story editor
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; padding:6px 0;">💌 Secret stories editor</div>';
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px;">'
    +    '<div style="font-size:11px; font-weight:600; color:#9CA3AF; margin-bottom:8px;">Write the secret stories Ammu unlocks at each milestone</div>'
    +    '<select id="abbu-story-day" style="width:100%; padding:10px; border-radius:10px; border:1px solid #E5E7EB; font-size:13px; font-weight:700; font-family:inherit; margin-bottom:8px;">'
    +      '<option value="7">Day 7 story</option><option value="14">Day 14 story</option><option value="21">Day 21 story</option><option value="30">Day 30 story</option><option value="90">Month 3 story</option>'
    +    '</select>'
    +    '<textarea id="abbu-story-text" placeholder="Write a special memory or secret..." style="width:100%; padding:12px; border-radius:12px; border:1px solid #E5E7EB; font-size:13px; font-family:inherit; box-sizing:border-box; resize:none; height:80px;"></textarea>'
    +    '<button onclick="abbuSaveStory()" style="width:100%; margin-top:8px; background:#1A1A3E; color:#fff; font-size:14px; font-weight:800; padding:10px; border-radius:12px; border:none; cursor:pointer; font-family:inherit;">Save secret story</button>'
    +  '</div>';

  h += '</div>';
  return h;
}

function abbuApprove(id) {
  for (var i = 0; i < abbuRewards.length; i++) { if (abbuRewards[i].id === id) abbuRewards[i].status = 'approved'; }
  abbuSaveRewards();
  var page = document.getElementById('page-abbu-alerts');
  if (page) page.innerHTML = buildAbbuAlerts();
}

function abbuReject(id) {
  for (var i = 0; i < abbuRewards.length; i++) { if (abbuRewards[i].id === id) abbuRewards[i].status = 'rejected'; }
  abbuSaveRewards();
  var page = document.getElementById('page-abbu-alerts');
  if (page) page.innerHTML = buildAbbuAlerts();
}

function abbuSaveStory() {
  var day = document.getElementById('abbu-story-day');
  var text = document.getElementById('abbu-story-text');
  if (!text || !text.value.trim()) { alert('Please write a story first!'); return; }
  if (typeof submitData === 'function') submitData({ type:'secret_story', from:'abbu', day:day.value, message:text.value.trim() });
  alert('Secret story saved for Day ' + day.value + '! Ammu will unlock it at that milestone. 💌');
  text.value = '';
}

/* ─── ABBU PROGRESS ──────────────────────────────────────────────────────── */

function buildAbbuProgress() {
  var meas = [['📏','Height','139cm','+0.5'],['⚖️','Weight','33.2kg','+0.8'],['💪','Bicep','19cm','+1'],['✋','Forearm','17cm','+0.5'],['🫁','Waist','58cm','0'],['🏊','Shoulder','34cm','+0.5']];
  var h = '<div class="fadein" style="padding:14px;">';

  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; text-align:center; padding:6px 0 12px;">📏 Measurements</div>';
  h += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">';
  for (var i = 0; i < meas.length; i++) {
    var m = meas[i];
    h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:12px;"><div style="font-size:20px;">' + m[0] + '</div><div style="font-size:11px; font-weight:600; color:#9CA3AF;">' + m[1] + '</div><div style="font-size:18px; font-weight:900; color:#1A1A3E;">' + m[2] + '</div><div style="font-size:10px; font-weight:800; color:' + (m[3] === '0' ? '#9CA3AF' : '#10B981') + ';">' + (m[3] === '0' ? 'no change' : '+' + m[3] + ' this month') + '</div></div>';
  }
  h += '</div>';

  // Mood trend
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px; margin-bottom:12px;">'
    +    '<div style="font-size:13px; font-weight:800; color:#1F2937; margin-bottom:12px;">😊 Mood this week</div>'
    +    '<div style="display:flex; justify-content:space-between; align-items:flex-end;">';
  var moods = [['Mon','😊'],['Tue','🙂'],['Wed','🌟'],['Thu','😐'],['Fri','😊'],['Sat','🙂'],['Sun','😊']];
  for (var md = 0; md < moods.length; md++) {
    h += '<div style="text-align:center;"><div style="font-size:24px;">' + moods[md][1] + '</div><div style="font-size:10px; font-weight:700; color:#9CA3AF; margin-top:2px;">' + moods[md][0] + '</div></div>';
  }
  h += '</div></div>';

  // Push-up progress
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px; margin-bottom:12px;">'
    +    '<div style="font-size:13px; font-weight:800; color:#1F2937; margin-bottom:12px;">💪 Push-up progress</div>'
    +    '<div style="display:flex; align-items:flex-end; gap:10px; height:80px;">';
  var pushups = [['Mar',3],['Apr',5],['May',8]];
  for (var p = 0; p < pushups.length; p++) {
    var ph = pushups[p][1] * 9;
    h += '<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;"><div style="font-size:13px; font-weight:900; color:#1A1A3E;">' + pushups[p][1] + '</div><div style="width:100%; background:#1A1A3E; border-radius:4px 4px 0 0; height:' + ph + 'px;"></div><div style="font-size:10px; font-weight:700; color:#9CA3AF; margin-top:4px;">' + pushups[p][0] + '</div></div>';
  }
  h += '</div><div style="text-align:center; font-size:12px; font-weight:800; color:#10B981; margin-top:10px;">📈 Getting stronger every month!</div></div>';

  // Link to report
  h += '<button onclick="abbuGoReport()" style="width:100%; padding:14px; border-radius:14px; background:#1A1A3E; color:#fff; font-size:15px; font-weight:800; border:none; cursor:pointer; font-family:inherit;">📋 See full monthly report</button>';

  h += '</div>';
  return h;
}

function abbuGoReport() {
  var btns = document.querySelectorAll('#bottom-nav button');
  if (btns[2]) btns[2].click();
}

/* ─── ABBU PAGE DISPATCH ─────────────────────────────────────────────────── */

function renderAbbuPage(pageId) {
  if (pageId === 'today')    return buildAbbuToday();
  if (pageId === 'weekly')   return buildAbbuWeekly();
  if (pageId === 'report')   return buildAbbuReport();
  if (pageId === 'goals')    return buildAbbuGoals();
  if (pageId === 'alerts')   return buildAbbuAlerts();
  if (pageId === 'progress') return buildAbbuProgress();
  return null;
}


/* ─── SAMPLE DATA (for Family view + test mode) ──────────────────────────── */

var SAMPLE_CATEGORY_SCORES = { exercise:92, bone:85, muscle:74, gut:68, brain:80, peace:55 };
var SAMPLE_WEEK = [['Mon',85],['Tue',70],['Wed',90],['Thu',45],['Fri',88],['Sat',75],['Sun',60]];
var SAMPLE_EGGS = 5, SAMPLE_YOGURT = 4, SAMPLE_WATER = 4.2, SAMPLE_EXERCISE = 6;
var APP_TEST_MODE = localStorage.getItem('test_mode') !== 'false';

/* ─── FAMILY VIEW ────────────────────────────────────────────────────────── */

function buildFamilyView() {
  var h = '<div class="fadein" style="padding:14px;">';

  if (APP_TEST_MODE) {
    h += '<div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:12px; padding:9px 12px; margin-bottom:10px; display:flex; align-items:center; gap:8px;"><span style="font-size:14px;">🧪</span><span style="font-size:10px; font-weight:700; color:#92400E;">Sample data — real stats begin once the family starts tracking!</span></div>';
  }

  h += '<div style="background:#F3F4F6; border-radius:12px; padding:9px 12px; margin-bottom:10px; display:flex; align-items:center; gap:8px;"><span style="font-size:14px;">👀</span><span style="font-size:10px; font-weight:700; color:#5F5E5A;">Read only — see how Ammu is doing!</span></div>';

  // Coins + streak
  h += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">'
    +    '<div style="background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:12px;"><div style="font-size:9px; font-weight:700; color:#9CA3AF; text-transform:uppercase;">Coins earned</div><div style="font-size:24px; font-weight:900; color:#F59E0B;">247</div><div style="font-size:9px; font-weight:600; color:#9CA3AF;">this month</div></div>'
    +    '<div style="background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:12px;"><div style="font-size:9px; font-weight:700; color:#9CA3AF; text-transform:uppercase;">Streak</div><div style="font-size:24px; font-weight:900; color:#F97316;">12</div><div style="font-size:9px; font-weight:600; color:#9CA3AF;">days in a row!</div></div>'
    +  '</div>';

  // Health focus areas
  var cats = [
    ['⚡','Exercise',SAMPLE_CATEGORY_SCORES.exercise,'#E1F5EE','#0F6E56','#085041'],
    ['🦴','Bones',SAMPLE_CATEGORY_SCORES.bone,'#E1F5EE','#0F6E56','#085041'],
    ['💪','Muscles',SAMPLE_CATEGORY_SCORES.muscle,'#FAEEDA','#E8732A','#633806'],
    ['🌱','Gut',SAMPLE_CATEGORY_SCORES.gut,'#FBEAF0','#D4537E','#72243E'],
    ['🧠','Brain',SAMPLE_CATEGORY_SCORES.brain,'#E6F1FB','#185FA5','#0C447C'],
    ['😊','Peace',SAMPLE_CATEGORY_SCORES.peace,'#E6F1FB','#185FA5','#0C447C']
  ];
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:12px;">'
    +    '<div style="display:flex; align-items:center; gap:8px; padding:10px 14px; border-bottom:1px solid #F9FAFB;"><span style="font-size:18px;">💪</span><span style="font-size:13px; font-weight:800; color:#1F2937;">Health focus areas this week</span></div>'
    +    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; padding:12px 14px;">';
  for (var i = 0; i < cats.length; i++) {
    var c = cats[i];
    h += '<div style="border-radius:10px; padding:8px 10px; text-align:center; background:' + c[3] + ';"><div style="font-size:20px;">' + c[0] + '</div><div style="font-size:9px; font-weight:800; text-transform:uppercase; color:' + c[5] + ';">' + c[1] + '</div><div style="font-size:18px; font-weight:900; color:' + c[4] + ';">' + c[2] + '%</div><div style="height:4px; border-radius:10px; margin-top:4px; background:rgba(0,0,0,0.08); overflow:hidden;"><div style="height:100%; border-radius:10px; background:' + c[4] + '; width:' + c[2] + '%;"></div></div></div>';
  }
  h += '</div></div>';

  // Food highlights
  var foods = [
    ['🥚','Egg days',SAMPLE_EGGS + ' of 7 days','Daily goal — muscle building!',SAMPLE_EGGS >= 5],
    ['🥛','Yogurt days',SAMPLE_YOGURT + ' of 7 days','Calcium for strong bones',SAMPLE_YOGURT >= 5],
    ['💧','Water average',SAMPLE_WATER + ' glasses/day','Target is 6 glasses',SAMPLE_WATER >= 5],
    ['🏋️','Exercise days',SAMPLE_EXERCISE + ' of 7 days','Strength + yoga',SAMPLE_EXERCISE >= 5]
  ];
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:12px;">'
    +    '<div style="display:flex; align-items:center; gap:8px; padding:10px 14px; border-bottom:1px solid #F9FAFB;"><span style="font-size:18px;">🍽️</span><span style="flex:1; font-size:13px; font-weight:800; color:#1F2937;">This week\'s food highlights</span></div>';
  for (var f = 0; f < foods.length; f++) {
    var fd = foods[f];
    h += '<div style="display:flex; align-items:center; gap:10px; padding:9px 14px; border-bottom:1px solid #F9FAFB;"><span style="font-size:20px;">' + fd[0] + '</span><div style="flex:1;"><div style="font-size:12px; font-weight:700; color:#1F2937;">' + fd[1] + '</div><div style="font-size:10px; font-weight:600; color:#9CA3AF;">' + fd[3] + '</div></div><div style="text-align:right;"><div style="font-size:12px; font-weight:800; color:' + (fd[4] ? '#0F6E56' : '#E8732A') + ';">' + fd[2] + '</div><div style="font-size:10px;">' + (fd[4] ? '✅' : '⚠️') + '</div></div></div>';
  }
  h += '<div style="padding:8px 14px; background:#F8FFFE; text-align:center; font-size:9px; font-weight:700; color:#9CA3AF;">📊 Detailed history coming once data collection starts</div>';
  h += '</div>';

  // Week chart
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:12px;">'
    +    '<div style="display:flex; align-items:center; gap:8px; padding:10px 14px; border-bottom:1px solid #F9FAFB;"><span style="font-size:18px;">📅</span><span style="font-size:13px; font-weight:800; color:#1F2937;">This week at a glance</span></div>'
    +    '<div style="display:flex; align-items:flex-end; gap:5px; height:70px; padding:12px 14px 6px;">';
  var today = getDayName();
  for (var w = 0; w < SAMPLE_WEEK.length; w++) {
    var pct = SAMPLE_WEEK[w][1];
    var bh = Math.round(pct * 0.5);
    var col = pct >= 80 ? '#0F6E56' : pct >= 50 ? '#E8732A' : '#E5E7EB';
    var isToday = SAMPLE_WEEK[w][0] === today;
    h += '<div style="flex:1; display:flex; flex-direction:column; align-items:center;"><div style="width:100%; border-radius:3px 3px 0 0; background:' + (isToday ? '#1A1A3E' : col) + '; height:' + bh + 'px;"></div><div style="font-size:8px; font-weight:' + (isToday ? '900' : '600') + '; color:' + (isToday ? '#1A1A3E' : '#9CA3AF') + '; margin-top:3px;">' + SAMPLE_WEEK[w][0] + '</div></div>';
  }
  h += '</div></div>';

  // Encouragement
  h += '<div style="background:#1A1A3E; border-radius:16px; padding:16px; text-align:center;"><div style="font-size:32px; margin-bottom:6px;">🐘</div><div style="font-size:16px; font-weight:800; color:#fff; margin-bottom:4px;">Ammu is doing amazing!</div><div style="font-size:11px; font-weight:600; color:#A5B4FC; line-height:1.6;">12-day streak and counting. Eating well, exercising and getting stronger every week.</div></div>';

  h += '</div>';
  return h;
}

/* ─── FAMILY PROGRESS ────────────────────────────────────────────────────── */

function buildFamilyProgress() {
  var meas = [['📏','Height','139cm','+0.5'],['⚖️','Weight','33.2kg','+0.8'],['💪','Bicep','19cm','+1'],['✋','Forearm','17cm','+0.5'],['🫁','Waist','58cm','0'],['🏊','Shoulder','34cm','+0.5']];
  var h = '<div class="fadein" style="padding:14px;">';
  h += '<div style="background:#F3F4F6; border-radius:12px; padding:9px 12px; margin-bottom:12px; display:flex; align-items:center; gap:8px;"><span style="font-size:14px;">👀</span><span style="font-size:10px; font-weight:700; color:#5F5E5A;">Read only — Ammu\'s growth</span></div>';
  h += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">';
  for (var i = 0; i < meas.length; i++) {
    var m = meas[i];
    h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:12px;"><div style="font-size:20px;">' + m[0] + '</div><div style="font-size:11px; font-weight:600; color:#9CA3AF;">' + m[1] + '</div><div style="font-size:18px; font-weight:900; color:#5F5E5A;">' + m[2] + '</div><div style="font-size:10px; font-weight:800; color:' + (m[3] === '0' ? '#9CA3AF' : '#10B981') + ';">' + (m[3] === '0' ? 'no change' : '+' + m[3] + ' this month') + '</div></div>';
  }
  h += '</div>';

  // Push-up
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px;"><div style="font-size:13px; font-weight:800; color:#1F2937; margin-bottom:12px;">💪 Push-up progress</div><div style="display:flex; align-items:flex-end; gap:10px; height:70px;">';
  var pu = [['Mar',3],['Apr',5],['May',8]];
  for (var p = 0; p < pu.length; p++) {
    h += '<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;"><div style="font-size:13px; font-weight:900; color:#5F5E5A;">' + pu[p][1] + '</div><div style="width:100%; background:#5F5E5A; border-radius:4px 4px 0 0; height:' + (pu[p][1]*8) + 'px;"></div><div style="font-size:10px; font-weight:700; color:#9CA3AF; margin-top:4px;">' + pu[p][0] + '</div></div>';
  }
  h += '</div><div style="text-align:center; font-size:12px; font-weight:800; color:#10B981; margin-top:10px;">📈 Stronger every month!</div></div>';

  h += '</div>';
  return h;
}

/* ─── FAMILY PAGE DISPATCH ───────────────────────────────────────────────── */

function renderFamilyPage(pageId) {
  if (pageId === 'view')     return buildFamilyView();
  if (pageId === 'progress') return buildFamilyProgress();
  return null;
}


/* ============================================================================
   MODULE 5: ADMIN + FAMILY SECTIONS
   Admin: Users, Settings, Data, Access
   Family: View, Progress (read-only, for grandma/aunt/sister)
   ============================================================================ */

/* ─── ADMIN USERS ────────────────────────────────────────────────────────── */

function buildAdminUsers() {
  var list = [
    { key:'ammu',   emoji:'🦁', name:'Ammu',   role:'Daily tracker & rewards' },
    { key:'mumma',  emoji:'👩', name:'Mumma',  role:'Grocery, meals & check' },
    { key:'abbu',   emoji:'🦣', name:'Abbu',   role:'Dashboard & monitoring' },
    { key:'admin',  emoji:'⚙️', name:'Admin',  role:'Full access & settings' },
    { key:'family', emoji:'👨‍👩‍👧', name:'Family', role:'Read-only family view' }
  ];

  var h = '<div class="fadein" style="padding:14px;">';
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; padding:6px 0;">👥 Manage user PINs</div>';

  for (var i = 0; i < list.length; i++) {
    var u = list[i];
    h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:14px; margin-bottom:10px;">'
      +    '<div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">'
      +      '<div style="width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; background:#F9FAFB;">' + u.emoji + '</div>'
      +      '<div style="flex:1;"><div style="font-size:14px; font-weight:800; color:#1F2937;">' + u.name + '</div><div style="font-size:11px; font-weight:600; color:#9CA3AF;">' + u.role + '</div></div>'
      +    '</div>'
      +    '<div style="display:flex; gap:8px;">'
      +      '<input id="pin-input-' + u.key + '" type="text" maxlength="4" value="' + PINS[u.key] + '" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #E5E7EB; font-size:14px; font-weight:800; letter-spacing:3px; text-align:center; font-family:inherit; box-sizing:border-box;" />'
      +      '<button onclick="adminUpdatePin(\'' + u.key + '\')" style="padding:9px 16px; border-radius:10px; background:#854F0B; color:#fff; font-size:12px; font-weight:800; border:none; cursor:pointer; font-family:inherit;">Update</button>'
      +    '</div>'
      +  '</div>';
  }
  h += '</div>';
  return h;
}

function adminUpdatePin(userKey) {
  var input = document.getElementById('pin-input-' + userKey);
  if (!input) return;
  var newPin = input.value.trim();
  if (!/^[0-9]{4}$/.test(newPin)) { alert('PIN must be exactly 4 digits!'); return; }
  PINS[userKey] = newPin;
  // Persist PIN changes
  var savedPins = JSON.parse(localStorage.getItem('app_pins') || '{}');
  savedPins[userKey] = newPin;
  localStorage.setItem('app_pins', JSON.stringify(savedPins));
  alert(USERS[userKey].name + "'s PIN updated to " + newPin);
}

/* ─── ADMIN SETTINGS ─────────────────────────────────────────────────────── */

function buildAdminSettings() {
  var testMode = localStorage.getItem('test_mode') !== 'false';
  var scriptSet = (GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE');

  var h = '<div class="fadein" style="padding:14px;">';

  // Test mode
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; padding:6px 0;">🧪 Test mode</div>';
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px; margin-bottom:12px;">'
    +    '<div style="font-size:13px; font-weight:800; color:#1F2937;">Test mode is ' + (testMode ? 'ON 🟡' : 'OFF 🟢') + '</div>'
    +    '<div style="font-size:11px; font-weight:600; color:#9CA3AF; margin:4px 0 10px;">' + (testMode ? 'Sample data is showing. Family sees a test banner.' : 'Live mode — only real tracked data shows.') + '</div>'
    +    '<button onclick="adminToggleTestMode()" style="width:100%; padding:11px; border-radius:12px; background:' + (testMode ? '#0F6E56' : '#E8732A') + '; color:#fff; font-size:14px; font-weight:800; border:none; cursor:pointer; font-family:inherit;">' + (testMode ? 'Switch to LIVE mode ✅' : 'Switch to TEST mode 🧪') + '</button>'
    +  '</div>';

  // Google Sheets URL
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; padding:6px 0;">🔗 Google Sheets</div>';
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px; margin-bottom:12px;">'
    +    '<div style="font-size:12px; font-weight:700; color:#1F2937; margin-bottom:4px;">Apps Script URL ' + (scriptSet ? '✅' : '⚠️ not set') + '</div>'
    +    '<input id="admin-script-url" type="text" value="' + (scriptSet ? GOOGLE_SCRIPT_URL : '') + '" placeholder="https://script.google.com/macros/s/..." style="width:100%; padding:9px 12px; border-radius:10px; border:1px solid #E5E7EB; font-size:11px; font-weight:600; font-family:inherit; box-sizing:border-box; margin-bottom:8px;" />'
    +    '<button onclick="adminSaveScriptUrl()" style="width:100%; padding:10px; border-radius:10px; background:#854F0B; color:#fff; font-size:14px; font-weight:800; border:none; cursor:pointer; font-family:inherit;">Save &amp; Connect</button>'
    +    '<div id="admin-url-saved" style="display:none; margin-top:8px; text-align:center; font-size:12px; font-weight:800; color:#0F6E56;">✅ Saved!</div>'
    +  '</div>';

  // Delete by date range
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; padding:6px 0;">🗑️ Delete data by date</div>';
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:16px; margin-bottom:12px;">'
    +    '<div style="font-size:11px; font-weight:600; color:#9CA3AF; margin-bottom:10px;">Only rows in this range get deleted. Google Sheets keeps version history so you can always restore.</div>'
    +    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">'
    +      '<div><label style="font-size:10px; font-weight:800; color:#854F0B;">From</label><input type="date" id="admin-del-from" style="width:100%; padding:8px; border-radius:8px; border:1px solid #E5E7EB; font-size:12px; font-family:inherit; box-sizing:border-box;" /></div>'
    +      '<div><label style="font-size:10px; font-weight:800; color:#854F0B;">To</label><input type="date" id="admin-del-to" style="width:100%; padding:8px; border-radius:8px; border:1px solid #E5E7EB; font-size:12px; font-family:inherit; box-sizing:border-box;" /></div>'
    +    '</div>'
    +    '<select id="admin-del-sheet" style="width:100%; padding:8px; border-radius:8px; border:1px solid #E5E7EB; font-size:12px; font-weight:600; font-family:inherit; margin-bottom:8px;">'
    +      '<option value="all">All sheets</option><option value="daily_tracker">Ammu tracker</option><option value="mumma_check">Mumma check</option><option value="measurements">Measurements</option><option value="proud_abbu">Proud Abbu</option><option value="notes">Notes</option>'
    +    '</select>'
    +    '<div id="admin-del-preview" style="display:none; background:#FEF2F2; border:1px solid #FCA5A5; border-radius:8px; padding:10px; margin-bottom:8px; font-size:11px; font-weight:800; color:#991B1B;"></div>'
    +    '<button onclick="adminPreviewDelete()" style="width:100%; padding:10px; border-radius:10px; background:#854F0B; color:#fff; font-size:14px; font-weight:800; border:none; cursor:pointer; font-family:inherit; margin-bottom:6px;">Preview what will be deleted</button>'
    +    '<button onclick="adminConfirmDelete()" id="admin-del-confirm" style="display:none; width:100%; padding:10px; border-radius:10px; background:#DC2626; color:#fff; font-size:14px; font-weight:800; border:none; cursor:pointer; font-family:inherit;">Confirm delete</button>'
    +    '<div id="admin-del-result" style="display:none; margin-top:8px; text-align:center; font-size:12px; font-weight:800; color:#0F6E56;"></div>'
    +  '</div>';

  // Reset local
  h += '<div style="background:#FEF2F2; border-radius:16px; border:1px solid #FCA5A5; padding:16px;">'
    +    '<div style="font-size:12px; font-weight:800; color:#991B1B; margin-bottom:4px;">⚠️ Reset local data</div>'
    +    '<div style="font-size:11px; font-weight:600; color:#B91C1C; margin-bottom:8px;">Clears coins, grocery and cook days from THIS device only. Cannot be undone.</div>'
    +    '<button onclick="adminResetLocal()" style="width:100%; padding:10px; border-radius:10px; background:#DC2626; color:#fff; font-size:14px; font-weight:800; border:none; cursor:pointer; font-family:inherit;">Reset local data</button>'
    +  '</div>';

  h += '</div>';
  return h;
}

function adminToggleTestMode() {
  var current = localStorage.getItem('test_mode') !== 'false';
  localStorage.setItem('test_mode', current ? 'false' : 'true');
  APP_TEST_MODE = !current;
  var page = document.getElementById('page-admin-settings');
  if (page) page.innerHTML = buildAdminSettings();
  alert(!current ? '🧪 Test mode ON' : '✅ Live mode ON — only real data shows now');
}

function adminSaveScriptUrl() {
  var input = document.getElementById('admin-script-url');
  if (!input || !input.value.trim()) { alert('Please paste your Apps Script URL'); return; }
  GOOGLE_SCRIPT_URL = input.value.trim();
  localStorage.setItem('google_script_url', GOOGLE_SCRIPT_URL);
  var saved = document.getElementById('admin-url-saved');
  if (saved) saved.style.display = 'block';
}

function adminPreviewDelete() {
  var from = document.getElementById('admin-del-from');
  var to = document.getElementById('admin-del-to');
  var sheet = document.getElementById('admin-del-sheet');
  if (!from.value || !to.value) { alert('Please select both dates!'); return; }
  if (from.value > to.value) { alert('From date must be before To date!'); return; }
  var labels = { all:'all sheets', daily_tracker:'Ammu tracker', mumma_check:'Mumma check', measurements:'Measurements', proud_abbu:'Proud Abbu', notes:'Notes' };
  var preview = document.getElementById('admin-del-preview');
  var confirm = document.getElementById('admin-del-confirm');
  if (preview && confirm) {
    preview.innerHTML = 'Will delete all rows from <strong>' + (labels[sheet.value] || sheet.value) + '</strong> between <strong>' + from.value + '</strong> and <strong>' + to.value + '</strong>. Cannot be undone.';
    preview.style.display = 'block';
    confirm.style.display = 'block';
  }
}

function adminConfirmDelete() {
  var from = document.getElementById('admin-del-from');
  var to = document.getElementById('admin-del-to');
  var sheet = document.getElementById('admin-del-sheet');
  if (!from.value || !to.value) return;
  if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') { alert('Set your Google Script URL first!'); return; }
  var btn = document.getElementById('admin-del-confirm');
  if (btn) { btn.disabled = true; btn.textContent = 'Deleting...'; }
  var sheets = sheet.value === 'all' ? ['daily_tracker','mumma_check','measurements','proud_abbu','notes'] : [sheet.value];
  Promise.all(sheets.map(function(s) {
    return fetch(GOOGLE_SCRIPT_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ type:'delete_by_date', sheet:s, from_date:from.value, to_date:to.value }) }).then(function(r){ return r.json(); });
  })).then(function(results) {
    var total = results.reduce(function(sum, r){ return sum + (r.deleted || 0); }, 0);
    var res = document.getElementById('admin-del-result');
    if (res) { res.style.display = 'block'; res.textContent = '✅ Deleted ' + total + ' row(s)'; }
    if (btn) btn.style.display = 'none';
    var prev = document.getElementById('admin-del-preview');
    if (prev) prev.style.display = 'none';
  }).catch(function() {
    alert('Error deleting. Check your Script URL.');
    if (btn) { btn.disabled = false; btn.textContent = 'Confirm delete'; }
  });
}

function adminResetLocal() {
  if (!confirm('Reset all local data on this device? This cannot be undone.')) return;
  var keys = ['ammu_coins','ammu_streak','ammu_week','mumma_cook_days','mumma_selected','mumma_shops','abbu_goals','abbu_rewards'];
  for (var i = 0; i < keys.length; i++) localStorage.removeItem(keys[i]);
  alert('Local data reset. Reloading...');
  location.reload();
}

/* ─── ADMIN DATA ─────────────────────────────────────────────────────────── */

function buildAdminData() {
  var h = '<div class="fadein" style="padding:14px;">';
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; padding:6px 0;">🗄️ Data overview</div>';

  var coins = localStorage.getItem('ammu_coins') || '0';
  var streak = localStorage.getItem('ammu_streak') || '0';
  var selected = JSON.parse(localStorage.getItem('mumma_selected') || '{}');
  var selCount = 0; for (var k in selected) { if (selected[k]) selCount++; }

  var stats = [
    ['🪙','Ammu coins', coins],
    ['🔥','Current streak', streak + ' days'],
    ['🛒','Grocery items selected', selCount],
    ['📅','Cook days set', JSON.parse(localStorage.getItem('mumma_cook_days') || '[]').length]
  ];
  h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:12px;">';
  for (var i = 0; i < stats.length; i++) {
    h += '<div style="display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid #F9FAFB;"><span style="font-size:18px;">' + stats[i][0] + '</span><span style="flex:1; font-size:13px; font-weight:600; color:#374151;">' + stats[i][1] + '</span><span style="font-size:15px; font-weight:900; color:#854F0B;">' + stats[i][2] + '</span></div>';
  }
  h += '</div>';

  h += '<div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:14px; padding:12px; font-size:11px; font-weight:700; color:#92400E;">💡 This shows data stored on THIS device. Full history lives in Google Sheets once connected.</div>';

  h += '</div>';
  return h;
}

/* ─── ADMIN ACCESS ───────────────────────────────────────────────────────── */

function buildAdminAccess() {
  var perms = [
    { who:'🦁 Ammu',   can:['Her own tracker','Rewards & secrets','Her measurements'], cant:['Other users','Settings','Mumma\u2019s grocery'] },
    { who:'👩 Mumma',  can:['Grocery & meals','Daily check','View measurements'], cant:['Settings','Goals editor','Reward approvals'] },
    { who:'🦣 Abbu',   can:['All monitoring','Approve rewards','Goals & stories'], cant:['Settings','Change PINs'] },
    { who:'👨‍👩‍👧 Family', can:['View Ammu\u2019s progress','See health scores'], cant:['Edit anything','See settings'] }
  ];
  var h = '<div class="fadein" style="padding:14px;">';
  h += '<div style="font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1.5px; padding:6px 0;">🔐 Who can see what</div>';
  for (var i = 0; i < perms.length; i++) {
    var p = perms[i];
    h += '<div style="background:#fff; border-radius:16px; border:1px solid #F3F4F6; padding:14px; margin-bottom:10px;">'
      +    '<div style="font-size:14px; font-weight:800; color:#1F2937; margin-bottom:8px;">' + p.who + '</div>';
    for (var c = 0; c < p.can.length; c++) {
      h += '<div style="display:flex; align-items:center; gap:8px; padding:2px 0;"><span style="color:#10B981;">✓</span><span style="font-size:12px; font-weight:600; color:#374151;">' + p.can[c] + '</span></div>';
    }
    for (var x = 0; x < p.cant.length; x++) {
      h += '<div style="display:flex; align-items:center; gap:8px; padding:2px 0;"><span style="color:#EF4444;">✗</span><span style="font-size:12px; font-weight:600; color:#9CA3AF;">' + p.cant[x] + '</span></div>';
    }
    h += '</div>';
  }
  h += '</div>';
  return h;
}

/* ─── ADMIN PAGE DISPATCH ────────────────────────────────────────────────── */

function renderAdminPage(pageId) {
  if (pageId === 'users')    return buildAdminUsers();
  if (pageId === 'settings') return buildAdminSettings();
  if (pageId === 'data')     return buildAdminData();
  if (pageId === 'access')   return buildAdminAccess();
  return null;
}
