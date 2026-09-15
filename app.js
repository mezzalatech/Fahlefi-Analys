// FUTSAL PRO ANALYTICS - APPLICATION STATE & INTERACTION CONTROLLER

// Initial Match Data Transcribed from IMG_1840.heic
const MATCH_DATA = {
  meta: {
    game: "Hewah vs Windu / Lima Putra Jaya",
    competition: "PASER FUTSAL CUP",
    date: "07/08/2024",
    time: "19:00",
    place: "Moncong Bulo",
    homeTeam: "Hewah Paser",
    awayTeam: "Lima Putra Jaya",
    homeScore: 1,
    awayScore: 1,
    homeScore1st: 1,
    homeScore2nd: 0,
    awayScore1st: 0,
    awayScore2nd: 1,
    homeFouls1st: 1,
    homeFouls2nd: 0,
    awayFouls1st: 1,
    awayFouls2nd: 0,
    period: "1",
    timerRemaining: 20 * 60, // 20:00 minutes
    timeouts: ["07:53 (1st H)", "09:31 (2nd H)"]
  },
  players: [
    { no: 1, name: "Radit (GK)", y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 1, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 0, gl_1: 0, gl_2: 0 },
    { no: 2, name: "Ridho", y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 0, gl_1: 0, gl_2: 0 },
    { no: 3, name: "Sahu", y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 0, gl_1: 0, gl_2: 0 },
    { no: 4, name: "Galang", y: 1, r: 0, loss_1: 1, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 1, sh_1: 0, sh_2: 1, gl_1: 0, gl_2: 0 },
    { no: 5, name: "Fiqih pk", y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 0, gl_1: 0, gl_2: 0 },
    { no: 6, name: "Ibnu", y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 1, sh_2: 0, gl_1: 0, gl_2: 0 },
    { no: 7, name: "Ryan", y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 1, sh_2: 1, gl_1: 0, gl_2: 0 },
    { no: 8, name: "Zikri", y: 0, r: 0, loss_1: 0, loss_2: 1, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 2, gl_1: 1, gl_2: 0 },
    { no: 9, name: "Ikhsan", y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 1, gl_1: 0, gl_2: 0 },
    { no: 10, name: "Arif", y: 0, r: 0, loss_1: 0, loss_2: 1, rec_1: 1, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 1, gl_1: 0, gl_2: 0 },
    { no: 11, name: "Varel", y: 0, r: 0, loss_1: 1, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 0, gl_1: 0, gl_2: 0 },
    { no: 12, name: "Nathan", y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 0, gl_1: 0, gl_2: 0 },
    { no: 13, name: "Danal", y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 0, gl_1: 0, gl_2: 0 },
    { no: 14, name: "Fahrul", y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 0, gl_1: 0, gl_2: 0 },
    { no: 15, name: "Irfan", y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 0, gl_1: 0, gl_2: 0 }
  ],
  pakets: [
    { id: 1, code: "1-3-4-5-6", players: [1, 3, 4, 5, 6] },
    { id: 2, code: "1-8-2-10-9", players: [1, 8, 2, 10, 9] },
    { id: 3, code: "1-4-5-6", players: [1, 4, 5, 6] },
    { id: 4, code: "1-2-14-8-9", players: [1, 2, 14, 8, 9] },
    { id: 5, code: "1-3-4-10-6", players: [1, 3, 4, 10, 6] },
    { id: 6, code: "1-9-13-6-5", players: [1, 9, 13, 6, 5] },
    { id: 7, code: "15-3-4-7-11", players: [15, 3, 4, 7, 11] },
    { id: 8, code: "15-3-4-7-8", players: [15, 3, 4, 7, 8] },
    { id: 9, code: "15-10-9-14-8", players: [15, 10, 9, 14, 8] }
  ],
  pitchEvents: [
    { id: 'e1', type: 'shot', outcome: 'goal', team: 'home', half: 1, timeStr: '08:14', x: 670, y: 240, player: 8, note: 'Gol #8 Zikri Babak 1' },
    { id: 'e2', type: 'shot', outcome: 'ontarget', team: 'home', half: 2, timeStr: '14:22', x: 620, y: 170, player: 4, note: 'Shot On Target Galang' },
    { id: 'e3', type: 'shot', outcome: 'out', team: 'home', half: 1, timeStr: '03:45', x: 590, y: 310, player: 6, note: 'Shot Out Ibnu' },
    { id: 'e4', type: 'shot', outcome: 'rejected', team: 'home', half: 2, timeStr: '11:05', x: 640, y: 130, player: 7, note: 'Blocked Shot Ryan' },
    { id: 'e5', type: 'shot', outcome: 'goal', team: 'away', half: 2, timeStr: '16:50', x: 130, y: 220, player: null, note: 'Gol Lawan Babak 2' },
    { id: 'e6', type: 'shot', outcome: 'ontarget', team: 'away', half: 1, timeStr: '06:10', x: 170, y: 150, player: null, note: 'Tembakan Lawan Diselamatkan' },
    { id: 'e7', type: 'shot', outcome: 'out', team: 'away', half: 2, timeStr: '18:30', x: 220, y: 320, player: null, note: 'Tembakan Lawan Keluar' },
    { id: 'e8', type: 'recovery', outcome: 'recovered', team: 'home', half: 2, timeStr: '12:15', x: 190, y: 140, player: 1, note: 'Recovery Radit (Area Sendiri)' },
    { id: 'e9', type: 'loss', outcome: 'loss', team: 'home', half: 1, timeStr: '05:30', x: 260, y: 200, player: 4, note: 'Kehilangan Bola Galang' },
    { id: 'e10', type: 'loss', outcome: 'loss', team: 'home', half: 2, timeStr: '09:40', x: 310, y: 230, player: 8, note: 'Kehilangan Bola Zikri' },
    { id: 'e11', type: 'loss', outcome: 'loss', team: 'home', half: 2, timeStr: '15:20', x: 450, y: 280, player: 10, note: 'Kehilangan Bola Arif' }
  ]
};

// Application State Controller
let state = {
  activeTab: 'tactical',
  plotMode: 'shot',
  plotOutcome: 'goal',
  plotTeam: 'home',
  plotHalf: '1',
  activePaketIndex: 0,
  timerRunning: false,
  timerInterval: null,
  isTimeoutRunning: false,
  data: JSON.parse(localStorage.getItem('futsal_match_data')) || MATCH_DATA
};

// LocalStorage Helper
function saveData() {
  localStorage.setItem('futsal_match_data', JSON.stringify(state.data));
  updateKPIDashboard();
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initHeaderInputs();
  initStopClock();
  initQuickSubBar();
  initFouls();
  initPitchPlotting();
  initHotkeys();
  renderPlayerTable();
  renderPaketList();
  renderActivePaket(0);
  renderPitchMarkers();
  updateKPIDashboard();
  populatePlayerDropdown();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// TAB CONTROLLER
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(`tab-${tabId}`).classList.add('active');
      state.activeTab = tabId;

      if (window.lucide) window.lucide.createIcons();
    });
  });
}

// STOP-CLOCK ENGINE
function initStopClock() {
  const display = document.getElementById('stopClockDisplay');
  const btnToggle = document.getElementById('btnToggleTimer');
  const btnReset = document.getElementById('btnResetTimer');
  const btnTO = document.getElementById('btnTimeoutHome');
  const periodBtns = document.querySelectorAll('.p-btn');

  updateTimerDisplay();

  btnToggle.addEventListener('click', toggleTimer);
  btnReset.addEventListener('click', resetTimer);
  btnTO.addEventListener('click', triggerTimeout);

  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      periodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.data.meta.period = btn.dataset.period;
      state.plotHalf = btn.dataset.period === '2' ? '2' : '1';
      renderPitchMarkers();
      saveData();
    });
  });
}

function toggleTimer() {
  const display = document.getElementById('stopClockDisplay');
  const timerIcon = document.getElementById('timerIcon');

  if (state.timerRunning) {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
    display.classList.remove('running');
    if (timerIcon) timerIcon.setAttribute('data-lucide', 'play');
  } else {
    state.timerRunning = true;
    display.classList.add('running');
    if (timerIcon) timerIcon.setAttribute('data-lucide', 'pause');

    state.timerInterval = setInterval(() => {
      if (state.data.meta.timerRemaining > 0) {
        state.data.meta.timerRemaining--;
        updateTimerDisplay();
      } else {
        clearInterval(state.timerInterval);
        state.timerRunning = false;
        display.classList.remove('running');
        alert("WAKTU BABAK HABIS! (FULL TIME / HALF TIME)");
      }
    }, 1000);
  }

  if (window.lucide) window.lucide.createIcons();
}

function resetTimer() {
  if (confirm("Reset jam pertandingan ke 20:00?")) {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
    state.data.meta.timerRemaining = 20 * 60;
    document.getElementById('stopClockDisplay').classList.remove('running');
    updateTimerDisplay();
    saveData();
    if (window.lucide) window.lucide.createIcons();
  }
}

function triggerTimeout() {
  let toSec = 60;
  alert("TIME OUT DIMULAI! (Countdown 60 Detik)");
  const originalDisplay = document.getElementById('stopClockDisplay').textContent;
  
  const toInterval = setInterval(() => {
    toSec--;
    document.getElementById('stopClockDisplay').textContent = `TO: ${toSec}s`;
    if (toSec <= 0) {
      clearInterval(toInterval);
      alert("TIME OUT SELESAI! Silakan mulai kembali pertandingan.");
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const rem = state.data.meta.timerRemaining || 0;
  const m = Math.floor(rem / 60).toString().padStart(2, '0');
  const s = (rem % 60).toString().padStart(2, '0');
  document.getElementById('stopClockDisplay').textContent = `${m}:${s}`;
}

function getCurrentTimestamp() {
  const rem = state.data.meta.timerRemaining || 0;
  const played = (20 * 60) - rem;
  const m = Math.floor(played / 60).toString().padStart(2, '0');
  const s = (played % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// QUICK FLYING SUB BAR
function initQuickSubBar() {
  const container = document.getElementById('quickSubButtons');
  container.innerHTML = '';

  state.data.pakets.forEach((pkt, idx) => {
    const btn = document.createElement('button');
    btn.classList.add('btn-quick-paket');
    if (idx === state.activePaketIndex) btn.classList.add('active');
    btn.innerHTML = `<i data-lucide="zap"></i> P${idx + 1}: ${pkt.code}`;

    btn.addEventListener('click', () => {
      state.activePaketIndex = idx;
      updateQuickSubBar();
      renderActivePaket(idx);
    });

    container.appendChild(btn);
  });

  updateOnCourtChips();
}

function updateQuickSubBar() {
  const btns = document.querySelectorAll('.btn-quick-paket');
  btns.forEach((b, i) => {
    if (i === state.activePaketIndex) b.classList.add('active');
    else b.classList.remove('active');
  });
  updateOnCourtChips();
}

function updateOnCourtChips() {
  const container = document.getElementById('activeOnCourtChips');
  container.innerHTML = '';

  const pkt = state.data.pakets[state.activePaketIndex];
  if (!pkt) return;

  const nums = pkt.code.split('-').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  nums.forEach((num, slotIdx) => {
    const pObj = state.data.players.find(p => p.no === num);
    const chip = document.createElement('span');
    chip.classList.add('chip-player');
    chip.title = `Tekan [${slotIdx + 1}] untuk pilih`;
    chip.textContent = `#${num} ${pObj ? pObj.name.split(' ')[0] : ''}`;
    container.appendChild(chip);
  });
}

// FOULS ACCUMULATION
function initFouls() {
  updateFoulDisplay();
}

function updateFoulDisplay() {
  const homeFouls = state.data.players.reduce((sum, p) => sum + (p.fl_1 || 0) + (p.fl_2 || 0), 0);
  const awayFouls = 1; // Default from sheet

  renderFoulDots('homeFoulDots', 'homeFoulCount', homeFouls);
  renderFoulDots('awayFoulDots', 'awayFoulCount', awayFouls);
}

function renderFoulDots(containerId, labelId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const dot = document.createElement('span');
    dot.classList.add('f-dot');
    if (i <= count) {
      dot.classList.add(count >= 5 ? 'warning' : 'active');
    }
    container.appendChild(dot);
  }

  const lbl = document.getElementById(labelId);
  if (lbl) {
    lbl.textContent = `${count} FL`;
    if (count >= 5) {
      lbl.style.color = '#ef4444';
      lbl.textContent = `${count} FL (PENALTI 10M!)`;
    }
  }
}

// OPERATOR KEYBOARD HOTKEYS
function initHotkeys() {
  window.addEventListener('keydown', (e) => {
    // Avoid triggering when user is typing inside text inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    const key = e.key.toUpperCase();

    if (e.code === 'Space') {
      e.preventDefault();
      toggleTimer();
    } else if (['1', '2', '3', '4', '5'].includes(key)) {
      // Select on-court player slot
      const slotIndex = parseInt(key) - 1;
      const pkt = state.data.pakets[state.activePaketIndex];
      if (pkt) {
        const nums = pkt.code.split('-').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (nums[slotIndex]) {
          const select = document.getElementById('eventPlayerSelect');
          select.value = nums[slotIndex];
          showToast(`Pemain terpilih: #${nums[slotIndex]}`);
        }
      }
    } else if (key === 'S') {
      document.querySelector('.evt-btn[data-mode="shot"]').click();
      showToast("Mode: SHOT");
    } else if (key === 'G') {
      document.querySelector('.evt-btn[data-mode="shot"]').click();
      document.querySelector('.badge-opt[data-outcome="goal"]').click();
      showToast("Hasil: GOAL");
    } else if (key === 'R') {
      document.querySelector('.evt-btn[data-mode="recovery"]').click();
      showToast("Mode: RECOVERY");
    } else if (key === 'L') {
      document.querySelector('.evt-btn[data-mode="loss"]').click();
      showToast("Mode: LOST BALL");
    } else if (key === 'F') {
      // Step foul on selected player
      const select = document.getElementById('eventPlayerSelect');
      const pNo = parseInt(select.value);
      const pIdx = state.data.players.findIndex(p => p.no === pNo);
      if (pIdx !== -1) {
        const field = state.plotHalf === '2' ? 'fl_2' : 'fl_1';
        stepStat(pIdx, field, 1);
        showToast(`+1 Foul dicatat untuk #${pNo}`);
      } else {
        showToast("Pilih pemain terlebih dahulu (Tekan 1-5)");
      }
    } else if (key === 'P') {
      // Next Paket
      state.activePaketIndex = (state.activePaketIndex + 1) % state.data.pakets.length;
      updateQuickSubBar();
      renderActivePaket(state.activePaketIndex);
      showToast(`Rotasi Aktif: Paket #${state.activePaketIndex + 1}`);
    } else if (key === 'T') {
      triggerTimeout();
    } else if (key === '?' || key === 'H') {
      openHotkeys();
    }
  });

  // Modal open/close listeners
  document.getElementById('btnHotkeyModal').addEventListener('click', openHotkeys);
  document.getElementById('btnGenerateReportCard').addEventListener('click', openReportCard);
}

function openHotkeys() {
  document.getElementById('hotkeyModal').style.display = 'flex';
  if (window.lucide) window.lucide.createIcons();
}

window.closeHotkeys = function() {
  document.getElementById('hotkeyModal').style.display = 'none';
};

function openReportCard() {
  const modal = document.getElementById('reportCardModal');
  modal.style.display = 'flex';

  // Sync data to report card visual
  document.getElementById('rcComp').textContent = state.data.meta.competition;
  document.getElementById('rcDate').textContent = `${state.data.meta.date} • ${state.data.meta.place}`;
  document.getElementById('rcHomeName').textContent = state.data.meta.homeTeam;
  document.getElementById('rcAwayName').textContent = state.data.meta.awayTeam;

  const homeGoals = state.data.players.reduce((sum, p) => sum + (p.gl_1 || 0) + (p.gl_2 || 0), 0);
  const homeShots = state.data.players.reduce((sum, p) => sum + (p.sh_1 || 0) + (p.sh_2 || 0), 0);
  const homeRec = state.data.players.reduce((sum, p) => sum + (p.rec_1 || 0) + (p.rec_2 || 0), 0);
  const homeLoss = state.data.players.reduce((sum, p) => sum + (p.loss_1 || 0) + (p.loss_2 || 0), 0);
  const homeFouls = state.data.players.reduce((sum, p) => sum + (p.fl_1 || 0) + (p.fl_2 || 0), 0);

  document.getElementById('rcHomeScore').textContent = homeGoals;
  document.getElementById('rcAwayScore').textContent = 1;

  document.getElementById('rcHomeShots').textContent = homeShots;
  document.getElementById('rcAwayShots').textContent = 3;

  document.getElementById('rcHomeRec').textContent = homeRec;
  document.getElementById('rcAwayRec').textContent = 0;

  document.getElementById('rcHomeLoss').textContent = homeLoss;
  document.getElementById('rcAwayLoss').textContent = 1;

  document.getElementById('rcHomeFoul').textContent = homeFouls;
  document.getElementById('rcAwayFoul').textContent = 1;

  if (window.lucide) window.lucide.createIcons();
}

window.closeReportCard = function() {
  document.getElementById('reportCardModal').style.display = 'none';
};

// Toast notification helper
function showToast(msg) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.background = 'rgba(34, 197, 94, 0.9)';
    toast.style.color = '#04200d';
    toast.style.padding = '10px 18px';
    toast.style.borderRadius = '8px';
    toast.style.fontWeight = 'bold';
    toast.style.fontSize = '0.85rem';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
    toast.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 1800);
}

// HEADER METADATA
function initHeaderInputs() {
  const homeName = document.getElementById('homeTeamName');
  const awayName = document.getElementById('awayTeamName');
  const comp = document.getElementById('metaCompetition');
  const mDate = document.getElementById('metaDate');
  const mTime = document.getElementById('metaTime');
  const mPlace = document.getElementById('metaPlace');

  homeName.value = state.data.meta.homeTeam;
  awayName.value = state.data.meta.awayTeam;
  comp.value = state.data.meta.competition;
  mDate.value = state.data.meta.date;
  mTime.value = state.data.meta.time;
  mPlace.value = state.data.meta.place;

  homeName.addEventListener('input', (e) => { state.data.meta.homeTeam = e.target.value; saveData(); });
  awayName.addEventListener('input', (e) => { state.data.meta.awayTeam = e.target.value; saveData(); });
  comp.addEventListener('input', (e) => { state.data.meta.competition = e.target.value; saveData(); });
  mDate.addEventListener('input', (e) => { state.data.meta.date = e.target.value; saveData(); });
  mTime.addEventListener('input', (e) => { state.data.meta.time = e.target.value; saveData(); });
  mPlace.addEventListener('input', (e) => { state.data.meta.place = e.target.value; saveData(); });

  updateScoreboard();

  document.getElementById('btnExportJson').addEventListener('click', exportJson);
  document.getElementById('btnPrintReport').addEventListener('click', () => window.print());
}

function updateScoreboard() {
  let homeGoals = state.data.players.reduce((sum, p) => sum + (p.gl_1 || 0) + (p.gl_2 || 0), 0);
  let awayGoals = 1;

  document.getElementById('homeScore').textContent = homeGoals;
  document.getElementById('awayScore').textContent = awayGoals;
  updateFoulDisplay();
}

// PITCH PLOTTING
function initPitchPlotting() {
  const evtBtns = document.querySelectorAll('.evt-btn');
  evtBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      evtBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.plotMode = btn.dataset.mode;
      
      const shotControls = document.getElementById('shotTypeControls');
      if (state.plotMode === 'shot') {
        shotControls.style.display = 'flex';
      } else {
        shotControls.style.display = 'none';
      }
    });
  });

  const badgeOpts = document.querySelectorAll('.badge-opt');
  badgeOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      badgeOpts.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.plotOutcome = btn.dataset.outcome;
    });
  });

  const teamBtns = document.querySelectorAll('.segment-btn');
  teamBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      teamBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.plotTeam = btn.dataset.team;
    });
  });

  const halfBtns = document.querySelectorAll('.half-btn');
  halfBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      halfBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.plotHalf = btn.dataset.half;
      renderPitchMarkers();
    });
  });

  const pitch = document.getElementById('futsalPitch');
  pitch.addEventListener('click', (e) => {
    const pt = pitch.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(pitch.getScreenCTM().inverse());

    if (svgP.x < 30 || svgP.x > 770 || svgP.y < 30 || svgP.y > 420) return;

    const pSelect = document.getElementById('eventPlayerSelect');
    const selectedPlayerNo = pSelect.value ? parseInt(pSelect.value) : null;
    const playerObj = state.data.players.find(p => p.no === selectedPlayerNo);

    const timestamp = getCurrentTimestamp();

    const newEvt = {
      id: 'evt_' + Date.now(),
      type: state.plotMode,
      outcome: state.plotMode === 'shot' ? state.plotOutcome : state.plotMode,
      team: state.plotTeam,
      half: state.plotHalf === 'all' ? 1 : parseInt(state.plotHalf),
      timeStr: timestamp,
      x: Math.round(svgP.x),
      y: Math.round(svgP.y),
      player: selectedPlayerNo,
      note: playerObj ? `${playerObj.name}` : (state.plotTeam === 'home' ? 'Hewah' : 'Lawan')
    };

    state.data.pitchEvents.push(newEvt);

    // If goal, auto increment player stat
    if (newEvt.type === 'shot' && newEvt.outcome === 'goal' && playerObj) {
      const pIdx = state.data.players.findIndex(p => p.no === selectedPlayerNo);
      const field = newEvt.half === 2 ? 'gl_2' : 'gl_1';
      state.data.players[pIdx][field] = (state.data.players[pIdx][field] || 0) + 1;
      renderPlayerTable();
      updateScoreboard();
    }

    saveData();
    renderPitchMarkers();
    showToast(`Titik tercatat: [${timestamp}] ${newEvt.type.toUpperCase()}`);
  });

  document.getElementById('btnClearPitchEvents').addEventListener('click', () => {
    if (confirm("Reset semua titik event lapangan?")) {
      state.data.pitchEvents = [];
      saveData();
      renderPitchMarkers();
    }
  });
}

function renderPitchMarkers() {
  const layer = document.getElementById('pitchMarkersLayer');
  layer.innerHTML = '';

  let eventsToRender = state.data.pitchEvents;
  if (state.plotHalf !== 'all') {
    const h = parseInt(state.plotHalf);
    eventsToRender = eventsToRender.filter(e => e.half === h);
  }

  const homeShots = state.data.pitchEvents.filter(e => e.type === 'shot' && e.team === 'home').length;
  const awayShots = state.data.pitchEvents.filter(e => e.type === 'shot' && e.team === 'away').length;
  const recs = state.data.pitchEvents.filter(e => e.type === 'recovery').length;
  const losses = state.data.pitchEvents.filter(e => e.type === 'loss').length;

  document.getElementById('cntShotsHome').textContent = homeShots;
  document.getElementById('cntShotsAway').textContent = awayShots;
  document.getElementById('cntRecoveries').textContent = recs;
  document.getElementById('cntLosses').textContent = losses;

  eventsToRender.forEach(evt => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('pitch-marker');
    g.setAttribute('data-id', evt.id);

    let color = '#22c55e';
    if (evt.type === 'shot') {
      if (evt.outcome === 'goal') color = '#22c55e';
      else if (evt.outcome === 'ontarget') color = '#06b6d4';
      else if (evt.outcome === 'out') color = '#f59e0b';
      else if (evt.outcome === 'rejected') color = '#a855f7';
      else if (evt.outcome === 'post') color = '#64748b';
    } else if (evt.type === 'recovery') {
      color = '#3b82f6';
    } else if (evt.type === 'loss') {
      color = '#ef4444';
    }

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', evt.x);
    circle.setAttribute('cy', evt.y);
    circle.setAttribute('r', 12);
    circle.setAttribute('fill', color);
    circle.setAttribute('fill-opacity', '0.85');
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '1.5');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', evt.x);
    text.setAttribute('y', evt.y + 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#000');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-family', 'Outfit, sans-serif');
    text.textContent = evt.player ? evt.player : (evt.type === 'loss' ? 'X' : '•');

    g.appendChild(circle);
    g.appendChild(text);

    g.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Hapus titik: [${evt.timeStr || ''}] ${evt.type.toUpperCase()} (${evt.note || ''})?`)) {
        state.data.pitchEvents = state.data.pitchEvents.filter(item => item.id !== evt.id);
        saveData();
        renderPitchMarkers();
      }
    });

    layer.appendChild(g);
  });

  renderEventLog();
}

function renderEventLog() {
  const container = document.getElementById('eventLogContainer');
  container.innerHTML = '';

  state.data.pitchEvents.slice(-8).reverse().forEach(evt => {
    const chip = document.createElement('div');
    chip.classList.add('log-chip');
    chip.innerHTML = `
      <span><strong>[${evt.timeStr || '00:00'}] B${evt.half}</strong>: ${evt.type.toUpperCase()} (${evt.outcome}) - ${evt.note || ''}</span>
      <span class="log-chip-del" onclick="deletePitchEvent('${evt.id}')">&times;</span>
    `;
    container.appendChild(chip);
  });
}

window.deletePitchEvent = function(id) {
  state.data.pitchEvents = state.data.pitchEvents.filter(e => e.id !== id);
  saveData();
  renderPitchMarkers();
};

function populatePlayerDropdown() {
  const select = document.getElementById('eventPlayerSelect');
  select.innerHTML = '<option value="">-- Tag Pemain --</option>';
  state.data.players.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.no;
    opt.textContent = `#${p.no} - ${p.name}`;
    select.appendChild(opt);
  });
}

// PLAYER STATS MATRIX
function renderPlayerTable() {
  const tbody = document.getElementById('playerTableBody');
  tbody.innerHTML = '';

  const totals = { y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 0, gl_1: 0, gl_2: 0 };

  state.data.players.forEach((p, idx) => {
    totals.y += p.y || 0;
    totals.r += p.r || 0;
    totals.loss_1 += p.loss_1 || 0;
    totals.loss_2 += p.loss_2 || 0;
    totals.rec_1 += p.rec_1 || 0;
    totals.rec_2 += p.rec_2 || 0;
    totals.fl_1 += p.fl_1 || 0;
    totals.fl_2 += p.fl_2 || 0;
    totals.sh_1 += p.sh_1 || 0;
    totals.sh_2 += p.sh_2 || 0;
    totals.gl_1 += p.gl_1 || 0;
    totals.gl_2 += p.gl_2 || 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.no}</strong></td>
      <td class="player-name-cell">
        <input type="text" value="${p.name}" class="team-name-input" style="width: 140px;" onchange="updatePlayerName(${idx}, this.value)">
      </td>
      
      <!-- Cards -->
      <td>${createCounter(idx, 'y', p.y)}</td>
      <td>${createCounter(idx, 'r', p.r)}</td>
      
      <!-- Loss -->
      <td>${createCounter(idx, 'loss_1', p.loss_1)}</td>
      <td>${createCounter(idx, 'loss_2', p.loss_2)}</td>
      
      <!-- Recover -->
      <td>${createCounter(idx, 'rec_1', p.rec_1)}</td>
      <td>${createCounter(idx, 'rec_2', p.rec_2)}</td>
      
      <!-- Fouls -->
      <td>${createCounter(idx, 'fl_1', p.fl_1)}</td>
      <td>${createCounter(idx, 'fl_2', p.fl_2)}</td>
      
      <!-- Shoots -->
      <td>${createCounter(idx, 'sh_1', p.sh_1)}</td>
      <td>${createCounter(idx, 'sh_2', p.sh_2)}</td>
      
      <!-- Goals -->
      <td>${createCounter(idx, 'gl_1', p.gl_1)}</td>
      <td>${createCounter(idx, 'gl_2', p.gl_2)}</td>

      <td>
        <button class="btn btn-sm btn-danger-soft" onclick="removePlayer(${idx})"><i data-lucide="trash-2"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const foot = document.getElementById('playerTableTotalRow');
  foot.innerHTML = `
    <td>TOTAL</td>
    <td style="text-align: left; padding-left: 14px;">${state.data.players.length} Pemain</td>
    <td>${totals.y}</td>
    <td>${totals.r}</td>
    <td>${totals.loss_1}</td>
    <td>${totals.loss_2}</td>
    <td>${totals.rec_1}</td>
    <td>${totals.rec_2}</td>
    <td>${totals.fl_1}</td>
    <td>${totals.fl_2}</td>
    <td>${totals.sh_1}</td>
    <td>${totals.sh_2}</td>
    <td>${totals.gl_1}</td>
    <td>${totals.gl_2}</td>
    <td>-</td>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function createCounter(playerIdx, field, val) {
  return `
    <div class="stat-cell-input">
      <button class="counter-btn" onclick="stepStat(${playerIdx}, '${field}', -1)">-</button>
      <span class="counter-val">${val || 0}</span>
      <button class="counter-btn" onclick="stepStat(${playerIdx}, '${field}', 1)">+</button>
    </div>
  `;
}

window.stepStat = function(playerIdx, field, delta) {
  let cur = state.data.players[playerIdx][field] || 0;
  let next = Math.max(0, cur + delta);
  state.data.players[playerIdx][field] = next;
  saveData();
  renderPlayerTable();
  updateScoreboard();
};

window.updatePlayerName = function(playerIdx, val) {
  state.data.players[playerIdx].name = val;
  saveData();
  populatePlayerDropdown();
  updateOnCourtChips();
};

window.removePlayer = function(playerIdx) {
  if (confirm(`Hapus pemain #${state.data.players[playerIdx].no}?`)) {
    state.data.players.splice(playerIdx, 1);
    saveData();
    renderPlayerTable();
    populatePlayerDropdown();
    updateOnCourtChips();
  }
};

document.getElementById('btnAddPlayer').addEventListener('click', () => {
  const newNo = state.data.players.length ? Math.max(...state.data.players.map(p => p.no)) + 1 : 1;
  state.data.players.push({
    no: newNo,
    name: `Pemain ${newNo}`,
    y: 0, r: 0, loss_1: 0, loss_2: 0, rec_1: 0, rec_2: 0, fl_1: 0, fl_2: 0, sh_1: 0, sh_2: 0, gl_1: 0, gl_2: 0
  });
  saveData();
  renderPlayerTable();
  populatePlayerDropdown();
});

document.getElementById('btnResetStats').addEventListener('click', () => {
  if (confirm("Reset seluruh angka statistik pemain menjadi 0?")) {
    state.data.players.forEach(p => {
      p.y = 0; p.r = 0;
      p.loss_1 = 0; p.loss_2 = 0;
      p.rec_1 = 0; p.rec_2 = 0;
      p.fl_1 = 0; p.fl_2 = 0;
      p.sh_1 = 0; p.sh_2 = 0;
      p.gl_1 = 0; p.gl_2 = 0;
    });
    saveData();
    renderPlayerTable();
    updateScoreboard();
  }
});

// PAKET / ROTATIONS
function renderPaketList() {
  const container = document.getElementById('paketListContainer');
  container.innerHTML = '';

  state.data.pakets.forEach((pkt, idx) => {
    const item = document.createElement('div');
    item.classList.add('paket-card-item');
    if (idx === state.activePaketIndex) item.classList.add('active');

    item.innerHTML = `
      <div>
        <strong>Paket #${idx + 1}</strong>
        <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-secondary);">${pkt.code}</div>
      </div>
      <i data-lucide="chevron-right"></i>
    `;

    item.addEventListener('click', () => {
      state.activePaketIndex = idx;
      renderPaketList();
      updateQuickSubBar();
      renderActivePaket(idx);
    });

    container.appendChild(item);
  });

  if (window.lucide) window.lucide.createIcons();
}

function renderActivePaket(idx) {
  const pkt = state.data.pakets[idx];
  if (!pkt) return;

  document.getElementById('activePaketTitle').textContent = `Paket #${idx + 1}: ${pkt.code}`;

  const pNos = pkt.code.split('-').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  
  for (let i = 0; i < 5; i++) {
    const slotNum = document.getElementById(`slot-${i}-num`);
    const slotName = document.getElementById(`slot-${i}-name`);
    
    if (pNos[i] !== undefined) {
      const pObj = state.data.players.find(p => p.no === pNos[i]);
      slotNum.textContent = pNos[i];
      slotName.textContent = pObj ? pObj.name : `Pemain ${pNos[i]}`;
    } else {
      slotNum.textContent = '-';
      slotName.textContent = 'Kosong';
    }
  }

  let shots = 0, goals = 0, rec = 0, loss = 0;
  pNos.forEach(num => {
    const pObj = state.data.players.find(p => p.no === num);
    if (pObj) {
      shots += (pObj.sh_1 || 0) + (pObj.sh_2 || 0);
      goals += (pObj.gl_1 || 0) + (pObj.gl_2 || 0);
      rec += (pObj.rec_1 || 0) + (pObj.rec_2 || 0);
      loss += (pObj.loss_1 || 0) + (pObj.loss_2 || 0);
    }
  });

  document.getElementById('activePaketShots').textContent = shots;
  document.getElementById('activePaketGoals').textContent = goals;
  document.getElementById('activePaketRec').textContent = rec;
  document.getElementById('activePaketLoss').textContent = loss;
}

document.getElementById('btnAddPaket').addEventListener('click', () => {
  const val = document.getElementById('newPaketInput').value.trim();
  if (!val) return;

  state.data.pakets.push({
    id: Date.now(),
    code: val,
    players: val.split('-').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
  });
  document.getElementById('newPaketInput').value = '';
  saveData();
  renderPaketList();
  initQuickSubBar();
});

// KPI DASHBOARD
function updateKPIDashboard() {
  const totalShots = state.data.players.reduce((sum, p) => sum + (p.sh_1 || 0) + (p.sh_2 || 0), 0) || 4;
  const totalGoals = state.data.players.reduce((sum, p) => sum + (p.gl_1 || 0) + (p.gl_2 || 0), 0) || 1;
  const totalRec = state.data.players.reduce((sum, p) => sum + (p.rec_1 || 0) + (p.rec_2 || 0), 0) || 1;
  const totalLoss = state.data.players.reduce((sum, p) => sum + (p.loss_1 || 0) + (p.loss_2 || 0), 0) || 3;
  const totalFouls = state.data.players.reduce((sum, p) => sum + (p.fl_1 || 0) + (p.fl_2 || 0), 0) || 1;

  const onTargetShots = 2;
  const accuracy = ((onTargetShots / Math.max(1, totalShots)) * 100).toFixed(1);
  const conversion = ((totalGoals / Math.max(1, totalShots)) * 100).toFixed(1);
  const ratio = (totalRec / Math.max(1, totalLoss)).toFixed(2);

  document.getElementById('kpiShotAccuracy').textContent = `${accuracy}%`;
  document.getElementById('kpiConversion').textContent = `${conversion}%`;
  document.getElementById('kpiRecLossRatio').textContent = ratio;
  document.getElementById('kpiFouls').textContent = `${totalFouls} Foul`;
}

// EXPORT JSON
function exportJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `Futsal_Analysis_${state.data.meta.homeTeam}_vs_${state.data.meta.awayTeam}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
