console.log("BBB PWA v14.8 - FULLY DYNAMIC CARRY SYSTEM (NO GLOBALS)");

function logScreen(name) {
  console.log(`%cSCREEN: ${name}`, 'color: cyan; font-weight: bold');
  console.log('State:', {
    currentCourse: currentCourse !== null ? courses[currentCourse].name : null,
    players: players.map(p => p.name),
    currentHole,
    inRound,
    finished: finishedHoles.size
  });
}

// ==== State ====
let roster = [];
let players = [];
let currentHole = 1;
const HOLES = 18;
const MAX_PLAYERS = 6;

let currentCourse = null;
let courses = [];
let roundHistory = [];
let finishedHoles = new Set();
let inRound = false;

// ==== DOM Cache ====
const els = {
  courseSetup: document.getElementById('courseSetup'),
  playerSetup: document.getElementById('playerSetup'),
  roster: document.getElementById('roster'),
  courseForm: document.getElementById('courseForm'),
  game: document.getElementById('game'),
  summary: document.getElementById('summary'),
  history: document.getElementById('history'),
  startHoleModal: document.getElementById('startHoleModal'),
  confirmStartHole: document.getElementById('confirmStartHole'),
  cancelStartHole: document.getElementById('cancelStartHole'),

  darkModeToggle: document.getElementById('darkModeToggle'),
  manageRosterBtn: document.getElementById('manageRosterBtn'),
  historyBtn: document.getElementById('historyBtn'),
  cbToggle: document.getElementById('cbToggle'),
  backToSetup: document.getElementById('backToSetup'),
  historyList: document.getElementById('historyList'),

  rosterName: document.getElementById('rosterName'),
  rosterPhone: document.getElementById('rosterPhone'),
  rosterEmail: document.getElementById('rosterEmail'),
  addToRoster: document.getElementById('addToRoster'),
  rosterList: document.getElementById('rosterList'),
  backToCourseFromRoster: document.getElementById('backToCourseFromRoster'),

  courseSelect: document.getElementById('courseSelect'),
  addCourse: document.getElementById('addCourse'),
  nextToPlayers: document.getElementById('nextToPlayers'),
  playerSelect: document.getElementById('playerSelect'),
  startGame: document.getElementById('startGame'),
  backToCourse: document.getElementById('backToCourse'),

  courseName: document.getElementById('courseName'),
  saveCourse: document.getElementById('saveCourse'),
  cancelCourse: document.getElementById('cancelCourse'),

  holeDisplay: document.getElementById('holeDisplay'),
  prevHole: document.getElementById('prevHole'),
  nextHole: document.getElementById('nextHole'),
  finishHole: document.getElementById('finishHole'),
  editHole: document.getElementById('editHole'),
  firstOnHeader: document.getElementById('firstOnHeader'),

  scoreTable: document.getElementById('scoreTable'),  // FIXED: Cache <table>
  holeSummary: document.getElementById('holeSummary'),
  runningAudit: document.getElementById('runningAudit'),

  sendSMS: document.getElementById('sendSMS'),
  exportCSV: document.getElementById('exportCSV'),

  completeRound: document.getElementById('completeRound'),
  exitRound: document.getElementById('exitRound'),
  saveRound: document.getElementById('saveRound'),
  leaderboard: document.getElementById('leaderboard'),
  restart: document.getElementById('restart'),

  debugPanel: document.getElementById('debugPanel'),
  debugOutput: document.getElementById('debugOutput'),
  closeDebug: document.getElementById('closeDebug')
};

// ==== PREDEFINED COURSES & ROSTER ====
const PREDEFINED_COURSES = [
  { name: "Home Course", pars: [4,4,3,5,4,3,4,4,5, 4,3,4,5,4,3,4,4,5] },
  { name: "Lakes",       pars: [4,3,4,5,4,3,4,4,5, 3,4,5,4,3,4,5,4,3] },
  { name: "Hills",       pars: [5,4,3,4,3,4,5,4,3, 4,5,3,4,4,3,5,4,3] }
];

const PREDEFINED_ROSTER = [
  { name: "Walt",   phone: "555-1111", email: "walt@example.com" },
  { name: "Tim",    phone: "555-2222", email: "tim@example.com" },
  { name: "Frank",  phone: "555-3333", email: "frank@example.com" },
  { name: "Sally",  phone: "555-4444", email: "sally@example.com" }
];

// ==== DARK MODE, CB, DEBUG ====
function initDarkMode() {
  const saved = localStorage.getItem('bbb_dark');
  const isDark = saved === 'true' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  els.darkModeToggle.textContent = isDark ? 'Light' : 'Dark';
}
els.darkModeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newMode = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newMode);
  localStorage.setItem('bbb_dark', newMode === 'dark');
  els.darkModeToggle.textContent = newMode === 'dark' ? 'Light' : 'Dark';
});

let colorblindMode = localStorage.getItem('bbb_cb') === 'true';
function applyCBMode() {
  document.body.classList.toggle('cb-mode', colorblindMode);
  els.cbToggle.textContent = colorblindMode ? 'CB ON' : 'CB';
}
applyCBMode();
els.cbToggle.addEventListener('click', () => {
  colorblindMode = !colorblindMode;
  localStorage.setItem('bbb_cb', colorblindMode);
  applyCBMode();
});

let debugMode = false;
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    debugMode = !debugMode;
    els.debugPanel.classList.toggle('hidden', !debugMode);
    if (debugMode) updateDebugPanel();
  }
});
els.closeDebug.addEventListener('click', () => {
  debugMode = false;
  els.debugPanel.classList.add('hidden');
});

function updateDebugPanel() {
  els.debugOutput.innerHTML = '';
  renderDebugCarryTable();
}

// ==== ROSTER, HISTORY, LOAD/SAVE ====
function loadRoster() {
  const saved = localStorage.getItem('bbb_roster');
  roster = saved ? JSON.parse(saved) : [];
  renderRoster();
}
function saveRoster() {
  localStorage.setItem('bbb_roster', JSON.stringify(roster));
}
function renderRoster() {
  els.rosterList.innerHTML = '';
  roster.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'player-tag';
    div.innerHTML = `${p.name} <small>${p.phone || ''} ${p.email || ''}</small>`;
    const del = document.createElement('button');
    del.textContent = 'X';
    del.style.marginLeft = '0.5rem';
    del.onclick = () => {
      roster.splice(i, 1);
      saveRoster();
      renderRoster();
      renderPlayerSelect();
    };
    div.appendChild(del);
    els.rosterList.appendChild(div);
  });
}
els.addToRoster.addEventListener('click', () => {
  const name = els.rosterName.value.trim();
  if (!name || roster.find(p => p.name === name)) return alert('Name required and unique');
  roster.push({ name, phone: els.rosterPhone.value.trim(), email: els.rosterEmail.value.trim() });
  els.rosterName.value = els.rosterPhone.value = els.rosterEmail.value = '';
  saveRoster();
  renderRoster();
  renderPlayerSelect();
});

els.manageRosterBtn.addEventListener('click', () => {
  if (inRound) return alert('Cannot edit players during round.');
  hideAll();
  els.roster.classList.remove('hidden');
  logScreen('ROSTER');
});
els.backToCourseFromRoster.addEventListener('click', () => {
  hideAll();
  els.courseSetup.classList.remove('hidden');
  logScreen('COURSE SETUP');
});

function loadHistory() {
  const saved = localStorage.getItem('bbb_history');
  roundHistory = saved ? JSON.parse(saved) : [];
}
function saveHistory() {
  localStorage.setItem('bbb_history', JSON.stringify(roundHistory));
}
function showHistory() {
  hideAll();
  els.history.classList.remove('hidden');
  els.historyList.innerHTML = '';
  if (roundHistory.length === 0) {
    els.historyList.innerHTML = '<p>No rounds saved yet.</p>';
    return;
  }
  roundHistory.forEach((round, i) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <strong>${round.courseName}</strong> - ${round.date}<br>
      ${round.players.map(p => p.name).join(', ')}<br>
      Winner: ${round.winner} (${round.winnerPoints} pts)
    `;
    div.onclick = () => {
      if (confirm(`Restore round from ${round.date}?`)) {
        players = round.players.map(p => ({ 
          ...p, 
          scores: Array(HOLES).fill(null).map(() => ({})), 
          gir: Array(HOLES).fill(false), 
          _cachedTotal: 0 
        }));
        currentHole = round.currentHole;
        currentCourse = round.currentCourse;
        finishedHoles = new Set(round.finishedHoles || []);
        inRound = true;
        precomputeAllTotals();
        save();
        hideAll();
        els.game.classList.remove('hidden');
        els.manageRosterBtn.disabled = true;
        updateHole();
        setupSyncButtons();
        logScreen('ROUND RESTORED');
      }
    };
    els.historyList.appendChild(div);
  });
  logScreen('HISTORY');
}
els.historyBtn.addEventListener('click', showHistory);
els.backToSetup.addEventListener('click', () => {
  hideAll();
  els.courseSetup.classList.remove('hidden');
  logScreen('COURSE SETUP');
});

function save() {
  localStorage.setItem('bbb', JSON.stringify({ 
    players: players.map(p => ({ ...p, _cachedTotal: undefined })), 
    currentHole, currentCourse,
    finishedHoles: Array.from(finishedHoles), inRound
  }));
}

function load(callback) {
  const savedRoster = localStorage.getItem('bbb_roster');
  if (!savedRoster) {
    roster = [...PREDEFINED_ROSTER];
    localStorage.setItem('bbb_roster', JSON.stringify(roster));
  } else {
    try { roster = JSON.parse(savedRoster); } catch { roster = [...PREDEFINED_ROSTER]; }
  }

  const savedCourses = localStorage.getItem('bbb_courses');
  if (!savedCourses) {
    courses = [...PREDEFINED_COURSES];
    localStorage.setItem('bbb_courses', JSON.stringify(courses));
  } else {
    try { courses = JSON.parse(savedCourses); } catch { courses = [...PREDEFINED_COURSES]; }
  }

  renderCourseSelect();
  renderRoster();

  localStorage.removeItem('bbb');
  inRound = false;
  players = [];
  currentCourse = null;
  currentHole = 1;
  finishedHoles.clear();

  if (callback) callback();
}

// ==== FLOW ====
function hideAll() {
  els.courseSetup.classList.add('hidden');
  els.playerSetup.classList.add('hidden');
  els.roster.classList.add('hidden');
  els.courseForm.classList.add('hidden');
  els.game.classList.add('hidden');
  els.summary.classList.add('hidden');
  els.history.classList.add('hidden');
  els.startHoleModal.classList.add('hidden');
}

function renderCourseSelect() {
  els.courseSelect.innerHTML = '<option value="">-- Select Course --</option>';
  courses.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = c.name;
    els.courseSelect.appendChild(opt);
  });
  els.nextToPlayers.disabled = true;
}

els.courseSelect.addEventListener('change', () => {
  currentCourse = parseInt(els.courseSelect.value);
  els.nextToPlayers.disabled = currentCourse === null || isNaN(currentCourse);
  save();
});

function renderPlayerSelect() {
  els.playerSelect.innerHTML = '';
  roster.forEach((p, i) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <label><input type="checkbox" data-index="${i}" ${players.find(pl => pl.name === p.name) ? 'checked' : ''}> ${p.name}</label>
    `;
    els.playerSelect.appendChild(div);
  });
  els.playerSelect.querySelectorAll('input').forEach(chk => {
    chk.addEventListener('change', () => {
      const idx = parseInt(chk.dataset.index);
      const player = roster[idx];
      if (chk.checked) {
        if (players.length >= MAX_PLAYERS) { chk.checked = false; alert(`Max ${MAX_PLAYERS} players`); return; }
        players.push({ 
          ...player, 
          scores: Array(HOLES).fill(null).map(() => ({})), 
          gir: Array(HOLES).fill(false), 
          _cachedTotal: 0  // INITIALIZE TOTAL
        });
      } else {
        players = players.filter(pl => pl.name !== player.name);
      }
      els.startGame.disabled = players.length < 2;
      save();
    });
  });
  els.startGame.disabled = players.length < 2;
}

els.nextToPlayers.addEventListener('click', () => {
  if (currentCourse === null) return alert('Select a course');
  hideAll();
  els.playerSetup.classList.remove('hidden');
  renderPlayerSelect();
  logScreen('PLAYER SETUP');
});

els.startGame.addEventListener('click', () => {
  if (players.length < 2) return alert('Select at least 2 players');
  hideAll();
  els.playerSetup.classList.remove('hidden');
  els.startHoleModal.classList.remove('hidden');
  logScreen('START HOLE MODAL');
});

els.confirmStartHole.addEventListener('click', () => {
  const startHoleInput = document.querySelector('input[name="startHole"]:checked');
  if (!startHoleInput) return alert('Select a starting hole');
  const startHole = parseInt(startHoleInput.value);

  currentHole = startHole;
  finishedHoles.clear();

  players.forEach(p => {
    p.scores = Array(HOLES).fill(null).map(() => ({}));
    p.gir = Array(HOLES).fill(false);
    p._cachedTotal = 0;
  });

  inRound = true;

  els.startHoleModal.classList.add('hidden');
  hideAll();
  els.game.classList.remove('hidden');
  els.manageRosterBtn.disabled = true;
  updateHole();
  setupSyncButtons();
  save();
  logScreen('GAME STARTED');
});

els.cancelStartHole.addEventListener('click', () => {
  els.startHoleModal.classList.add('hidden');
  hideAll();
  els.playerSetup.classList.remove('hidden');
  renderPlayerSelect();
  logScreen('BACK TO PLAYERS');
});

els.backToCourse.addEventListener('click', () => {
  hideAll();
  els.courseSetup.classList.remove('hidden');
  logScreen('BACK TO COURSE');
});

els.addCourse.addEventListener('click', () => {
  hideAll();
  els.courseForm.classList.remove('hidden');
  els.courseName.value = '';
  generateParInputs();
  logScreen('NEW COURSE');
});

function generateParInputs() {
  const container = document.getElementById('pars');
  container.innerHTML = '';
  for (let i = 0; i < HOLES; i++) {
    const label = document.createElement('label');
    label.innerHTML = `Hole ${i+1}: <input type="number" min="3" max="5" value="4" class="par-input" data-hole="${i}">`;
    container.appendChild(label);
  }
}

els.saveCourse.addEventListener('click', () => {
  const name = els.courseName.value.trim();
  if (!name) return alert('Enter course name');
  const pars = Array.from(document.querySelectorAll('.par-input')).map(inp => parseInt(inp.value));
  if (pars.some(p => p < 3 || p > 5)) return alert('Par must be 3–5');
  courses.push({ name, pars });
  localStorage.setItem('bbb_courses', JSON.stringify(courses));
  hideAll();
  els.courseSetup.classList.remove('hidden');
  renderCourseSelect();
  logScreen('COURSE SAVED');
});

els.cancelCourse.addEventListener('click', () => {
  hideAll();
  els.courseSetup.classList.remove('hidden');
  logScreen('COURSE CANCELLED');
});

// ==== CARRY LOGIC ====
// LINE 300: FINAL FIX — Use finishedHoles to detect played holes
function getCarryInForHole(holeNumber) {
  if (holeNumber === 1) return { firstOn: 0, closest: 0, putt: 0, greenie: 0 };

  const prevHoleNumber = holeNumber - 1;
  if (!finishedHoles.has(prevHoleNumber)) {
    return { firstOn: 0, closest: 0, putt: 0, greenie: 0 };
  }

  const prevHoleIdx = prevHoleNumber - 1;
  const prevPar = courses[currentCourse]?.pars?.[prevHoleIdx];
  if (prevPar === undefined) return { firstOn: 0, closest: 0, putt: 0, greenie: 0 };

  const isPrevPar3 = prevPar === 3;

  const carry = { firstOn: 0, closest: 0, putt: 0, greenie: 0 };

  const firstOnWinner = players.some(p => p.scores[prevHoleIdx]?.firstOn);
  const closestWinner = players.some(p => p.scores[prevHoleIdx]?.closest);
  const puttWinner = players.some(p => p.scores[prevHoleIdx]?.putt);

  if (!isPrevPar3 && !firstOnWinner) carry.firstOn = 1;
  if (isPrevPar3 && !firstOnWinner) carry.greenie = 1;
  if (!closestWinner) carry.closest = 1;
  if (!puttWinner) carry.putt = 1;

  return carry;
}



function getCarryOut() {
  const carry = { firstOn: 0, closest: 0, putt: 0, greenie: 0 };

  for (const h of Array.from(finishedHoles).sort((a, b) => a - b)) {
    const idx = h - 1;
    const par = courses[currentCourse].pars[idx];
    const isPar3 = par === 3;

    if (!players.some(p => p.scores[idx]?.firstOn)) {
      if (isPar3) carry.greenie++;
      else carry.firstOn++;
    }
    if (!players.some(p => p.scores[idx]?.closest)) carry.closest++;
    if (!players.some(p => p.scores[idx]?.putt)) carry.putt++;
  }
  return carry;
}



// ==== TOTALS ====
// LINE 380: DEBUG VERSION — LOGS EVERY POINT
function precomputeAllTotals() {
  console.log('%c=== PRECOMPUTE ALL TOTALS ===', 'color: #0f0; font-weight: bold');
  players.forEach(p => {
    let total = 0;
    let debugLines = [];

    for (let idx = 0; idx < HOLES; idx++) {
      const holeNumber = idx + 1;
      if (!finishedHoles.has(holeNumber)) continue;

      const s = p.scores[idx] || {};
      const par = courses[currentCourse].pars[idx];
      const isPar3 = par === 3;

      // Base points
      if (s.firstOn) {
        total += 1;
        debugLines.push(`Hole ${holeNumber}: +1 (First On${isPar3 ? ' → Greenie' : ''})`);
      }
      if (s.closest) {
        total += 1;
        debugLines.push(`Hole ${holeNumber}: +1 (Closest)`);
      }
      if (s.putt) {
        total += 1;
        debugLines.push(`Hole ${holeNumber}: +1 (Putt)`);
      }

      // Carry-in bonus
      const carryIn = getCarryInForHole(holeNumber);
      if (s.firstOn && carryIn.firstOn > 0) {
        total += carryIn.firstOn;
        debugLines.push(`Hole ${holeNumber}: +${carryIn.firstOn} (First On carry)`);
      }
      if (s.firstOn && isPar3 && carryIn.greenie > 0) {
        total += carryIn.greenie;
        debugLines.push(`Hole ${holeNumber}: +${carryIn.greenie} (Greenie carry)`);
      }
      if (s.closest && carryIn.closest > 0) {
        total += carryIn.closest;
        debugLines.push(`Hole ${holeNumber}: +${carryIn.closest} (Closest carry)`);
      }
      if (s.putt && carryIn.putt > 0) {
        total += carryIn.putt;
        debugLines.push(`Hole ${holeNumber}: +${carryIn.putt} (Putt carry)`);
      }
    }

    p._cachedTotal = total;
    console.log(`%c${p.name}: ${total} points`, 'color: #ff0; font-weight: bold');
    debugLines.forEach(line => console.log(`  ${line}`));
  });
  console.log('%c=== END PRECOMPUTE ===', 'color: #0f0; font-weight: bold');
}




// ==== RENDERING ====


function updateHole() {
  if (!inRound || players.length === 0 || currentCourse === null || !courses[currentCourse]) return;

  const holeIdx = currentHole - 1;
  const par = courses[currentCourse].pars[holeIdx];

  els.holeDisplay.innerHTML = `Hole ${currentHole} (Par ${par}) • ${finishedHoles.size} finished`;
  els.firstOnHeader.textContent = par === 3 ? 'Greenie' : 'First On';

  const isFinished = finishedHoles.has(currentHole);
  els.finishHole.classList.toggle('hidden', isFinished);
  els.editHole.classList.toggle('hidden', !isFinished);

  const carryIn = getCarryInForHole(currentHole);
  renderTable(carryIn, isFinished);
  renderHoleSummary(carryIn, isFinished);
  renderRunningAudit();

  save();

  if (debugMode) renderDebugCarryTable();
}


// renderTable(carryIn, isFinished) — FULLY CORRECTED
function renderTable(carryIn, isFinished) {
  if (!els.scoreTable || players.length === 0) return;

  const tbody = els.scoreTable.tBodies[0];
  if (!tbody) {
    console.error('scoreTable has no tbody — HTML is broken');
    return;
  }
  tbody.innerHTML = '';

  const holeIdx = currentHole - 1;
  const par = courses[currentCourse]?.pars?.[holeIdx];
  if (par === undefined) return;

  const isPar3 = par === 3;

  players.forEach(p => {
    if (!p || !p.scores || !Array.isArray(p.scores)) return;
    if (p._cachedTotal === undefined) p._cachedTotal = 0;

    const s = p.scores[holeIdx] || {};
    const row = tbody.insertRow();

    // LINE 1: Player Name
    const nameCell = row.insertCell();
    nameCell.textContent = p.name || 'Unknown';
    nameCell.className = 'player-name';

    // LINE 2-6: Checkboxes
    const createCheckbox = (point) => {
      const cell = row.insertCell();
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!s[point];
      input.disabled = isFinished;
      input.onclick = () => toggleScore(p, holeIdx, point);
      cell.appendChild(input);
    };

    createCheckbox('firstOn');
    createCheckbox('closest');
    createCheckbox('putt');

   // LINE 7-30: HOLE POINTS — FULL POINTS (BASE + CARRY)
const holeCell = row.insertCell();
if (isFinished) {
  let labels = [];
  if (s.firstOn) labels.push(isPar3 ? 'Greenie' : 'First On');
  if (s.closest) labels.push('Closest');
  if (s.putt) labels.push('Putt');

  const fullPoints = calculateHolePoints(p, holeIdx);

  holeCell.innerHTML = `
    <div style="font-size:0.85rem;line-height:1.2;">
      <strong>${fullPoints}</strong><br>
      <small style="color:#aaa;">${labels.join(', ')}</small>
    </div>`;
} else {
  holeCell.textContent = '—';
  holeCell.style.color = '#666';
}


    // LINE 31-34: TOTAL (from precomputed)
    const totalCell = row.insertCell();
    totalCell.textContent = p._cachedTotal;
    totalCell.style.fontWeight = '600';
  });
}    




function renderHoleSummary(carryIn, isFinished) {
  if (!els.holeSummary) return;

  const holeIdx = currentHole - 1;
  const par = courses[currentCourse].pars[holeIdx];
  const isPar3 = par === 3;

  let awarded = 0;
  let carryOutLines = [];
  let carryInLines = [];

  // === CARRY IN LINES ===
  if (carryIn.firstOn) carryInLines.push(`First On: +${carryIn.firstOn}`);
  if (carryIn.closest) carryInLines.push(`Closest: +${carryIn.closest}`);
  if (carryIn.putt) carryInLines.push(`Putt: +${carryIn.putt}`);
  if (carryIn.greenie) carryInLines.push(`Greenie: +${carryIn.greenie}`);

  // === ONLY IF HOLE IS FINISHED ===
  if (isFinished) {
    // Count ONLY BASE POINTS (1 per award) — NOT carry-in bonus
    players.forEach(p => {
      const s = p.scores[holeIdx] || {};
      if (s.firstOn) awarded += 1;
      if (s.closest) awarded += 1;
      if (s.putt) awarded += 1;
    });

    // === CARRY OUT (unawarded points from this hole) ===
    const carryOut = getCarryOut();
    if (carryOut.firstOn) carryOutLines.push(`First On: +${carryOut.firstOn}`);
    if (carryOut.closest) carryOutLines.push(`Closest: +${carryOut.closest}`);
    if (carryOut.putt) carryOutLines.push(`Putt: +${carryOut.putt}`);
    if (carryOut.greenie) carryOutLines.push(`Greenie: +${carryOut.greenie}`);
  }

  // === RENDER SUMMARY ===
  els.holeSummary.innerHTML = isFinished ? `
    <div style="margin:1rem 0;padding:0.75rem;background:#e6f7e6;border-radius:8px;font-size:0.9rem;color:#155724;">
      <strong>Points Awarded:</strong> ${awarded}<br>
      <strong>Carry Forward:</strong> ${carryOutLines.length ? carryOutLines.join(', ') : '0'}
    </div>
  ` : carryInLines.length ? `
    <div style="margin:1rem 0;padding:0.75rem;background:#d4edda;border-radius:8px;font-size:0.9rem;color:#155724;">
      <strong>Carry In:</strong> ${carryInLines.join(', ')}
    </div>
  ` : `
    <div style="margin:1rem 0;padding:0.75rem;background:#d1ecf1;border-radius:8px;font-size:0.9rem;color:#0c5460;">
      <strong>No Carry In</strong>
    </div>
  `;
}


function renderRunningAudit() {
  if (!els.runningAudit) return;

  const totalBasePoints = finishedHoles.size * 3;
  let baseAwarded = 0;

  for (const h of Array.from(finishedHoles).sort((a, b) => a - b)) {
    const idx = h - 1;
    const scores = players.map(p => p.scores[idx]).filter(Boolean);
    if (scores.some(s => s.firstOn)) baseAwarded++;
    if (scores.some(s => s.closest)) baseAwarded++;
    if (scores.some(s => s.putt)) baseAwarded++;
  }

  const carryOut = getCarryOut();
  const totalCarry = carryOut.firstOn + carryOut.closest + carryOut.putt + carryOut.greenie;
  const balanced = baseAwarded + totalCarry === totalBasePoints;

  const carryLines = [];
  if (carryOut.firstOn) carryLines.push(`First On: ${carryOut.firstOn}`);
  if (carryOut.closest) carryLines.push(`Closest: ${carryOut.closest}`);
  if (carryOut.putt) carryLines.push(`Putt: ${carryOut.putt}`);
  if (carryOut.greenie) carryLines.push(`Greenie: ${carryOut.greenie}`);

  els.runningAudit.innerHTML = `
    <div class="${balanced ? 'audit-good' : 'audit-bad'}" style="margin-top:0.5rem;font-size:0.85rem;">
      <strong>Round:</strong> ${baseAwarded} base + ${totalCarry} carry = ${baseAwarded + totalCarry} / ${totalBasePoints}<br>
      <small>${carryLines.length ? carryLines.join(' | ') : 'No carries'}</small>
    </div>
  `;
}

// ==== DEBUG CARRY TABLE ====
function renderDebugCarryTable() {
  if (!debugMode || !els.debugPanel) return;

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginTop = '1rem';
  table.style.fontSize = '0.8rem';

  const header = table.insertRow();
  ['Hole', 'Par', 'FirstOn', 'Closest', 'Putt', 'Carry In', 'Awarded', 'Carry Out'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    th.style.border = '1px solid #444';
    th.style.padding = '4px';
    th.style.background = '#333';
    header.appendChild(th);
  });

  let cumulativeCarry = { firstOn: 0, closest: 0, putt: 0, greenie: 0 };
  let totalAwarded = 0;

  Array.from(finishedHoles).sort((a, b) => a - b).forEach(h => {
    const idx = h - 1;
    const par = courses[currentCourse].pars[idx];
    const isPar3 = par === 3;
    const scores = players.map(p => p.scores[idx]).filter(Boolean);

    const row = table.insertRow();
    row.style.background = h === currentHole ? '#2a2a2a' : '#1a1a1a';

    const holeCell = row.insertCell(); holeCell.textContent = h;
    const parCell = row.insertCell(); parCell.textContent = par;
    const foCell = row.insertCell(); foCell.textContent = scores.some(s => s.firstOn) ? 'Check' : '—';
    const clCell = row.insertCell(); clCell.textContent = scores.some(s => s.closest) ? 'Check' : '—';
    const puCell = row.insertCell(); puCell.textContent = scores.some(s => s.putt) ? 'Check' : '—';

    const carryInCell = row.insertCell();
    carryInCell.textContent = `${cumulativeCarry.firstOn} | ${cumulativeCarry.closest} | ${cumulativeCarry.putt}${isPar3 ? ` | ${cumulativeCarry.greenie}` : ''}`;

    let holeAwarded = 0;
    if (scores.some(s => s.firstOn)) holeAwarded += 1;
    if (scores.some(s => s.closest)) holeAwarded += 1;
    if (scores.some(s => s.putt)) holeAwarded += 1;

    const awardedCell = row.insertCell();
    awardedCell.textContent = holeAwarded;
    totalAwarded += holeAwarded;

    if (!scores.some(s => s.firstOn)) {
      if (isPar3) cumulativeCarry.greenie++;
      else cumulativeCarry.firstOn++;
    }
    if (!scores.some(s => s.closest)) cumulativeCarry.closest++;
    if (!scores.some(s => s.putt)) cumulativeCarry.putt++;

    const carryOutCell = row.insertCell();
    carryOutCell.textContent = `${cumulativeCarry.firstOn} | ${cumulativeCarry.closest} | ${cumulativeCarry.putt}${isPar3 ? ` | ${cumulativeCarry.greenie}` : ''}`;
  });

  const totalCarry = cumulativeCarry.firstOn + cumulativeCarry.closest + cumulativeCarry.putt + cumulativeCarry.greenie;
  const totalPoints = finishedHoles.size * 3;
  const balanced = totalAwarded + totalCarry === totalPoints;

  const debugContent = document.getElementById('debugCarryTable') || document.createElement('div');
  debugContent.id = 'debugCarryTable';
  debugContent.innerHTML = '<h4 style="margin:0.5rem 0;color:#0f0">Carry Debug Table</h4>';
  debugContent.appendChild(table);

  const summary = document.createElement('div');
  summary.style.marginTop = '0.5rem';
  summary.style.color = balanced ? '#0f0' : '#f00';
  summary.innerHTML = `<strong>Total:</strong> ${totalAwarded} base + ${totalCarry} carry = ${totalAwarded + totalCarry} / ${totalPoints}`;
  debugContent.appendChild(summary);

  const existing = document.getElementById('debugCarryTable');
  if (existing) existing.replaceWith(debugContent);
  else els.debugPanel.appendChild(debugContent);
}

// ==== POINT HANDLING ====
function toggleScore(player, holeIdx, point) {
  const score = player.scores[holeIdx];
  const wasChecked = !!score[point];
  const willBeChecked = !wasChecked;

  if (willBeChecked) {
    const otherHasIt = players.some((p, j) => {
      return j !== players.indexOf(player) && p.scores[holeIdx] && p.scores[holeIdx][point];
    });
    if (otherHasIt) {
      alert('Only one winner per point!');
      return;
    }
  }

  score[point] = willBeChecked;
  save();

  // RECALCULATE FIRST
  precomputeAllTotals();

  // THEN RENDER
  updateHole();
}



function finishCurrentHole() {
  finishedHoles.add(currentHole);
  save();
  precomputeAllTotals();  // ← RECALCULATE
  updateHole();
}


// ==== SYNC, EXPORT, SUMMARY ====
// === NEW: ONLY SMS + CSV ===
function setupGameButtons() {
  // SEND SMS
  els.sendSMS.onclick = () => {
    const holeIdx = currentHole - 1;
    const par = courses[currentCourse].pars[holeIdx];
    let message = `BBB Update - Hole ${currentHole} (Par ${par})\n\n`;
    players.forEach(p => {
      const s = p.scores[holeIdx] || {};
      const holePoints = calculateHolePoints(p, holeIdx);
      const notes = [];
      if (s.firstOn) notes.push(par === 3 ? 'Greenie' : 'First On');
      if (s.closest) notes.push('Closest');
      if (s.putt) notes.push('Putt');
      message += `${p.name}: ${holePoints} pts${notes.length ? `\n• ${notes.join('\n• ')}` : ''}\n\n`;
    });
    const carryOut = getCarryOut();
    message += `Carry to next: ${carryOut.firstOn + carryOut.closest + carryOut.putt + carryOut.greenie}\n`;
    // After carry line:
players.sort((a, b) => b._cachedTotal - a._cachedTotal);
message += `\nStandings:\n`;
players.forEach((p, i) => {
  message += `${i+1}. ${p.name}: ${p._cachedTotal} pts\n`;
});
    const phones = players.map(p => p.phone).filter(Boolean).join(',');
    if (!phones) return alert('Add phone numbers to roster');
    window.location.href = `sms:${phones}?body=${encodeURIComponent(message)}`;
  };

  // EXPORT CSV
  els.exportCSV.onclick = exportToCSV;
}


// LINE 680: DEBUG VERSION
function calculateHolePoints(p, holeIdx) {
  console.log(`%cCALCULATE HOLE POINTS: ${p.name}, Hole ${holeIdx + 1}`, 'color: #0ff');
  const s = p.scores[holeIdx] || {};
  let pts = 0;
  let labels = [];

  if (s.firstOn) { pts += 1; labels.push('First On'); }
  if (s.closest) { pts += 1; labels.push('Closest'); }
  if (s.putt) { pts += 1; labels.push('Putt'); }

  console.log(`  Base: ${pts} [${labels.join(', ')}]`);
  return pts;
}



function exportToCSV() {
  const course = courses[currentCourse];
  let csv = `Hole,Par,Player,FirstOn,Closest,Putt,Greenie,GIR,Points\n`;
  for (let h = 0; h < HOLES; h++) {
    if (!finishedHoles.has(h+1)) continue;
    const par = course.pars[h];
    const isPar3 = par === 3;
    players.forEach(p => {
      const s = p.scores[h] || {};
      const gir = p.gir[h] ? 1 : 0;
      const pts = calculateHolePoints(p, h);
      csv += `${h+1},${par},${p.name},${s.firstOn||0},${s.closest||0},${s.putt||0},${isPar3 && s.firstOn ? 1 : 0},${gir},${pts}\n`;
    });
  }
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BBB_${course.name.replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function showSummary() {
  hideAll();
  els.summary.classList.remove('hidden');
  const totals = players.map(p => ({ name: p.name, points: p._cachedTotal || 0 }));
  totals.sort((a,b) => b.points - a.points);
  els.leaderboard.innerHTML = '';
  totals.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.name}: ${t.points} point${t.points===1?'':'s'}`;
    els.leaderboard.appendChild(li);
  });
}

els.completeRound.addEventListener('click', () => {
  if (finishedHoles.size === HOLES) {
    precomputeAllTotals();
    showSummary();
  } else {
    alert(`Finish all ${HOLES} holes before completing round.`);
  }
});

els.exitRound.addEventListener('click', () => {
  if (confirm('Exit without saving? All progress will be lost.')) {
    resetRound();
    location.reload();
  }
});

els.saveRound.addEventListener('click', () => {
  precomputeAllTotals();
  const winner = players.reduce((a, b) => (a._cachedTotal > b._cachedTotal ? a : b));
  const round = {
    date: new Date().toLocaleDateString(),
    courseName: courses[currentCourse].name,
    players: players.map(p => ({ name: p.name, phone: p.phone, email: p.email })),
    currentHole, currentCourse,
    winner: winner.name, winnerPoints: winner._cachedTotal,
    finishedHoles: Array.from(finishedHoles)
  };
  roundHistory.unshift(round);
  saveHistory();
  resetRound();
  alert('Round saved to history!');
  location.reload();
});

els.restart.addEventListener('click', () => {
  if (confirm('Restart app and clear ALL data?')) {
    localStorage.clear();
    location.reload();
  }
});

function resetRound() {
  localStorage.removeItem('bbb');
  inRound = false;
  players = [];
  currentCourse = null;
  currentHole = 1;
  finishedHoles.clear();
}

// ==== NAVIGATION ====
els.prevHole.addEventListener('click', () => { 
  if (currentHole > 1) { currentHole--; updateHole(); } 
});

els.nextHole.addEventListener('click', () => { 
  if (currentHole < HOLES) { currentHole++; updateHole(); } 
  else if (currentHole === HOLES && finishedHoles.has(HOLES)) { currentHole = 1; updateHole(); }
});

els.finishHole.addEventListener('click', finishCurrentHole);

els.editHole.addEventListener('click', () => {
  if (!finishedHoles.has(currentHole)) return;
  console.log('%cEDIT MODE: Removing hole', 'color: #f90', currentHole);
  finishedHoles.delete(currentHole);
  precomputeAllTotals();
  save();
  updateHole();
  console.log('%cEDIT MODE: Recalculated', 'color: #0f0');
});


// ==== INIT ====
initDarkMode();
load(() => {
  hideAll();
  els.courseSetup.classList.remove('hidden');
  logScreen('APP START');
});