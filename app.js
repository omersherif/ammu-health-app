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

/* ─── INIT ───────────────────────────────────────────────────────────────── */

window.addEventListener('load', function() {
  buildLoginButtons();
  showScreen('screen-login');
  console.log('[Ammu App] Module 1 shell loaded');
});
