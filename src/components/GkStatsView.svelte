<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { GkPdfReportGenerator } from '../lib/services/gkPdfReportGenerator';
  import { 
    GK_AREA_CONCEDED_IMAGE_DATA_URI, 
    GK_CONCEDED_IMAGE_DATA_URI 
  } from '../lib/assets/gkDiagramAssets';
  import { 
    Shield, 
    Zap, 
    Target, 
    Plus, 
    Minus, 
    Check, 
    X, 
    TrendingUp, 
    Award, 
    Clock, 
    User, 
    ChevronRight, 
    Trash2, 
    Flame, 
    Sparkles,
    AlertTriangle,
    Save,
    RotateCcw,
    Printer,
    FileText,
    Download,
    Crosshair,
    Pencil
  } from 'lucide-svelte';

  // Local state for interactive conceded goal input & edit
  let showAddGoalModal = $state(false);
  let showEditGoalModal = $state(false);
  let editingGoal = $state<{
    id: string;
    half: 1 | 2;
    minute: string;
    shooterZone: string;
    goalZone: string;
    note: string;
    shooterPlayer?: string;
    posX?: number;
    posY?: number;
    goalPosX?: number;
    goalPosY?: number;
  } | null>(null);

  let newGoalHalf = $state<1 | 2>(1);
  let newGoalMinute = $state('10:00');
  let newGoalPitchZone = $state('D');
  let newGoalTargetZone = $state('5');
  let newGoalNote = $state('lower shooting');
  let newGoalShooter = $state('');
  let newGoalPosX = $state<number | undefined>(undefined);
  let newGoalPosY = $state<number | undefined>(undefined);
  let newGoalGoalPosX = $state<number | undefined>(undefined);
  let newGoalGoalPosY = $state<number | undefined>(undefined);

  // Pitch Zones definition matching futsal tactical grid
  const pitchZones = [
    { id: '13', label: '13 (Depan Gawang Lawan)' },
    { id: '12', label: '12 (Area Tengah Lawan)' },
    { id: '11', label: '11 (Flank Kiri)' },
    { id: '10', label: '10 (Flank Kanan)' },
    { id: '9', label: '9 (Sayap Kiri Bawah)' },
    { id: '8', label: '8 (Half-Space Kiri)' },
    { id: '7', label: '7 (Half-Space Kanan)' },
    { id: '6', label: '6 (Sayap Kanan Bawah)' },
    { id: '9N', label: '9N (Sudut Sempit Kiri)' },
    { id: 'D', label: 'D (Area Penalti / Depan Kiper)' },
    { id: '6N', label: '6N (Sudut Sempit Kanan)' }
  ];

  // Center percentage coordinates for each pitch zone (0-100% X, 0-100% Y)
  const zoneCenterCoords: Record<string, { x: number; y: number }> = {
    '13': { x: 50, y: 15 },
    '12': { x: 50, y: 32 },
    '11': { x: 33, y: 52 },
    '10': { x: 67, y: 52 },
    '9':  { x: 18, y: 76 },
    '9N': { x: 14, y: 88 },
    '8':  { x: 38, y: 76 },
    'D':  { x: 50, y: 84 },
    '7':  { x: 62, y: 76 },
    '6':  { x: 82, y: 76 },
    '6N': { x: 86, y: 88 }
  };

  // 5 Goal Target Zones matching PDF Page 3 & Coordinates on Goal Illustration
  const goalTargetZones = [
    { id: '1', title: 'Kiri Atas', desc: 'Top Left Post' },
    { id: '2', title: 'Kanan Atas', desc: 'Top Right Post' },
    { id: '3', title: 'Kiri Bawah', desc: 'Bottom Left Post' },
    { id: '4', title: 'Kanan Bawah', desc: 'Bottom Right Post' },
    { id: '5', title: 'Bawah / Kolong', desc: 'Center Low / Nutmeg' }
  ];

  const goalTargetCenterCoords: Record<string, { x: number; y: number }> = {
    '1': { x: 25, y: 25 },
    '2': { x: 75, y: 25 },
    '3': { x: 25, y: 72 },
    '4': { x: 75, y: 72 },
    '5': { x: 50, y: 76 }
  };

  function getGoalTargetPinCoordinates(cg: any, idx: number) {
    if (cg.goalPosX != null && cg.goalPosY != null) {
      return { x: cg.goalPosX, y: cg.goalPosY };
    }
    const targetKey = String(cg.goalZone || '5');
    const base = goalTargetCenterCoords[targetKey] || { x: 50, y: 76 };

    // Offset slightly if multiple goals share the same target zone
    const sameTargetBefore = integratedConcededGoals.slice(0, idx).filter(g => String(g.goalZone) === targetKey).length;
    if (sameTargetBefore === 0) {
      return base;
    }
    const offsets = [
      { dx: 6, dy: 4 },
      { dx: -6, dy: -4 },
      { dx: 6, dy: -4 },
      { dx: -6, dy: 4 },
      { dx: 0, dy: 6 },
      { dx: 0, dy: -6 }
    ];
    const off = offsets[(sameTargetBefore - 1) % offsets.length];
    return {
      x: Math.max(14, Math.min(86, base.x + off.dx)),
      y: Math.max(16, Math.min(84, base.y + off.dy))
    };
  }

  const stat = $derived(matchStore.currentGkStat);
  const calc = $derived(matchStore.gkCalculations);
  const concededGoals = $derived(matchStore.currentGkConcededGoals);

  function handlePrintGkPdf() {
    if (matchStore.data) {
      GkPdfReportGenerator.printReport(matchStore.data, stat, matchStore.currentTeamLogo);
    }
  }

  function handleAddGoal() {
    matchStore.addGkConcededGoal({
      half: newGoalHalf,
      minute: newGoalMinute,
      shooterZone: newGoalPitchZone,
      goalZone: newGoalTargetZone,
      note: newGoalNote,
      shooterPlayer: newGoalShooter,
      posX: newGoalPosX,
      posY: newGoalPosY,
      goalPosX: newGoalGoalPosX,
      goalPosY: newGoalGoalPosY
    });
    showAddGoalModal = false;
    newGoalNote = 'lower shooting';
    newGoalShooter = '';
    newGoalPosX = undefined;
    newGoalPosY = undefined;
    newGoalGoalPosX = undefined;
    newGoalGoalPosY = undefined;
  }

  function handlePitchClick(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clickX = Math.max(6, Math.min(94, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const clickY = Math.max(8, Math.min(94, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    
    // Auto-determine zone based on clickY and clickX
    let detectedZone = 'D';
    if (clickY < 23) detectedZone = '13';
    else if (clickY < 42) detectedZone = '12';
    else if (clickY < 63) detectedZone = clickX < 50 ? '11' : '10';
    else if (clickY >= 82 && clickX < 26) detectedZone = '9N';
    else if (clickY >= 82 && clickX > 74) detectedZone = '6N';
    else if (clickY >= 74 && clickX >= 30 && clickX <= 70) detectedZone = 'D';
    else if (clickX < 28) detectedZone = '9';
    else if (clickX < 50) detectedZone = '8';
    else if (clickX < 72) detectedZone = '7';
    else detectedZone = '6';

    newGoalPitchZone = detectedZone;
    newGoalPosX = clickX;
    newGoalPosY = clickY;
    showAddGoalModal = true;
  }

  function handleGoalFrameClick(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clickX = Math.max(10, Math.min(90, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const clickY = Math.max(10, Math.min(90, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    
    // Auto-determine goal target zone
    let detectedZone = '5';
    if (clickY < 50) {
      detectedZone = clickX < 50 ? '1' : '2';
    } else {
      if (clickX >= 38 && clickX <= 62) {
        detectedZone = '5';
      } else if (clickX < 38) {
        detectedZone = '3';
      } else {
        detectedZone = '4';
      }
    }

    newGoalTargetZone = detectedZone;
    newGoalGoalPosX = clickX;
    newGoalGoalPosY = clickY;
    showAddGoalModal = true;
  }

  function openEditGoalModal(goal: any) {
    editingGoal = {
      id: goal.id,
      half: (goal.half === 2 ? 2 : 1) as 1 | 2,
      minute: goal.minute || '10:00',
      shooterZone: String(goal.shooterZone || 'D'),
      goalZone: String(goal.goalZone || '5'),
      note: goal.note || 'lower shooting',
      shooterPlayer: goal.shooterPlayer || '',
      posX: goal.posX,
      posY: goal.posY,
      goalPosX: goal.goalPosX,
      goalPosY: goal.goalPosY
    };
    showEditGoalModal = true;
  }

  async function handleSaveEditedGoal() {
    if (!editingGoal) return;
    await matchStore.updateGkConcededGoal(editingGoal.id, editingGoal, integratedConcededGoals);
    showEditGoalModal = false;
    editingGoal = null;
  }

  async function handleDeleteGoal(goalId: string) {
    await matchStore.deleteGkConcededGoal(goalId, integratedConcededGoals);
    if (editingGoal?.id === goalId) {
      showEditGoalModal = false;
      editingGoal = null;
    }
  }

  // Integrated Conceded Goals (reads manual GK ledger > live tactical pitch goal events > match scoreboard)
  const integratedConcededGoals = $derived.by(() => {
    // 1. Prioritize manual GK ledger if coach modified/added goals
    if (concededGoals.length > 0) return concededGoals;

    // 2. Read live pitch goal events from TacticalPitch
    const evts = matchStore.data?.events || [];
    const oppGoals = evts.filter(e => {
      if (e.type !== 'shot' || e.outcome !== 'goal') return false;
      if (e.team === 'away') return true;
      if (matchStore.teamScope === 'home' && e.team !== 'home') return true;
      if (e.isOpponent) return true;
      return false;
    });

    if (oppGoals.length > 0) {
      return oppGoals.map((og, idx) => {
        let minute = '10';
        if (og.timeStr) {
          const parts = og.timeStr.split(':');
          if (parts.length === 2) {
            const minPart = parseInt(parts[0], 10);
            minute = !isNaN(minPart) ? String(og.half === 1 ? (20 - minPart) : (40 - minPart)) : og.timeStr;
          } else {
            minute = og.timeStr;
          }
        }

        // Normalize TacticalPitch coordinates (0-800 x, 0-480 y) to vertical pitch (Point D at bottom)
        let normX = (og.x != null) ? (og.x <= 100 ? (og.x / 100) : (og.x / 800)) : 0.2;
        let normY = (og.y != null) ? (og.y <= 100 ? (og.y / 100) : (og.y / 480)) : 0.5;

        // When opponent attacks our goal (left goal in horizontal pitch):
        // normX: 0 = goal line, 0.5 = half court
        let distFromOurGoal = normX < 0.5 ? (normX * 2) : ((1 - normX) * 2);
        distFromOurGoal = Math.max(0, Math.min(1, distFromOurGoal));

        // Calculate vertical pitch coordinates: Point D is at bottom (Y ~ 84%)
        let posY = Math.round(88 - (distFromOurGoal * 35));
        let posX = Math.round(normY * 70 + 15);
        posX = Math.max(12, Math.min(88, posX));
        posY = Math.max(55, Math.min(92, posY));

        // Determine shooterZone accurately according to Point D defending orientation
        let shooterZone = 'D';
        if (posY >= 82) {
          if (posX < 28) shooterZone = '9N';
          else if (posX > 72) shooterZone = '6N';
          else shooterZone = 'D';
        } else if (posY >= 68) {
          if (posX < 28) shooterZone = '9';
          else if (posX < 46) shooterZone = '8';
          else if (posX < 54) shooterZone = 'D';
          else if (posX < 72) shooterZone = '7';
          else shooterZone = '6';
        } else {
          if (posX < 50) shooterZone = '11';
          else shooterZone = '10';
        }

        return {
          id: og.id || `pitch_goal_${idx}`,
          half: og.half || 1,
          minute,
          shooterZone,
          goalZone: '5',
          note: og.note || 'Shot Lawan (goal)',
          shooterPlayer: og.playerNo ? `#${og.playerNo}` : 'Lawan',
          posX,
          posY,
          isFromPitch: true
        };
      });
    }

    // 2. Use manual conceded goals if present
    if (concededGoals.length > 0) return concededGoals;

    // 3. Fallback: From match scoreboard (All default to Point D defensive zone)
    const m = matchStore.data?.match;
    const isHome = matchStore.teamScope === 'home';
    const s1 = isHome ? (m?.awayScore1st || 0) : (m?.homeScore1st || 0);
    const s2 = isHome ? (m?.awayScore2nd || 0) : (m?.homeScore2nd || 0);
    const scoreList: any[] = [];
    const sampleDefensivePlacements = [
      { zone: 'D', x: 50, y: 84, note: 'lower shooting' },
      { zone: '7', x: 62, y: 76, note: 'lower shooting' },
      { zone: '8', x: 38, y: 76, note: 'lower shooting' },
      { zone: '6', x: 82, y: 76, note: 'lower shooting' },
      { zone: '9', x: 18, y: 76, note: 'lower shooting' },
      { zone: '6N', x: 86, y: 89, note: 'second post' },
      { zone: '9N', x: 14, y: 89, note: 'second post' }
    ];

    for (let i = 0; i < s1; i++) {
      const place = sampleDefensivePlacements[i % sampleDefensivePlacements.length];
      scoreList.push({
        id: `score_h1_${i}`,
        half: 1,
        minute: `${(i + 1) * 6}`,
        shooterZone: place.zone,
        goalZone: '5',
        note: place.note,
        shooterPlayer: 'Lawan',
        posX: place.x,
        posY: place.y,
        isFromScoreboard: true
      });
    }
    for (let i = 0; i < s2; i++) {
      const place = sampleDefensivePlacements[(s1 + i) % sampleDefensivePlacements.length];
      scoreList.push({
        id: `score_h2_${i}`,
        half: 2,
        minute: `${20 + (i + 1) * 6}`,
        shooterZone: place.zone,
        goalZone: '5',
        note: place.note,
        shooterPlayer: 'Lawan',
        posX: place.x,
        posY: place.y,
        isFromScoreboard: true
      });
    }

    return scoreList;
  });

  function getGoalPinCoordinates(cg: any, idx: number) {
    const zoneKey = String(cg.shooterZone || 'D');
    const base = zoneCenterCoords[zoneKey] || { x: 50, y: 84 };

    // If explicit posX/posY exists and is valid for the zone
    if (cg.posX != null && cg.posY != null) {
      // Validate that defensive zone goals aren't mistakenly inverted to top
      if (['D', '6', '7', '8', '9', '6N', '9N'].includes(zoneKey) && cg.posY < 60) {
        // Use base zone anchor around Point D
      } else {
        return { x: cg.posX, y: cg.posY };
      }
    }
    
    // Offset slightly if multiple goals share the same zone around Point D
    const sameZoneBefore = integratedConcededGoals.slice(0, idx).filter(g => String(g.shooterZone) === zoneKey).length;
    if (sameZoneBefore === 0) {
      return base;
    }
    const offsets = [
      { dx: 7, dy: 3 },
      { dx: -7, dy: -3 },
      { dx: 7, dy: -3 },
      { dx: -7, dy: 3 },
      { dx: 0, dy: 5 },
      { dx: 0, dy: -5 }
    ];
    const off = offsets[(sameZoneBefore - 1) % offsets.length];
    return {
      x: Math.max(8, Math.min(92, base.x + off.dx)),
      y: Math.max(65, Math.min(93, base.y + off.dy))
    };
  }

  function getZoneConcededCount(zoneId: string, type: 'pitch' | 'goal'): number {
    if (type === 'pitch') {
      return integratedConcededGoals.filter(g => g.shooterZone === zoneId).length;
    } else {
      return integratedConcededGoals.filter(g => g.goalZone === zoneId).length;
    }
  }

  // Calculate opponent shots from pitch events in matchStore.data.events
  const pitchOpponentShots = $derived.by(() => {
    const evts = matchStore.data?.events || [];
    const oppShots = evts.filter(e => {
      if (e.type !== 'shot') return false;
      if (e.team === 'away') return true;
      if (matchStore.teamScope === 'home' && e.team !== 'home') return true;
      if (e.isOpponent) return true;
      return false;
    });

    const ontarget = oppShots.filter(e => e.outcome === 'ontarget' || e.outcome === 'on_target' || e.outcome === 'saved').length;
    const goal = oppShots.filter(e => e.outcome === 'goal').length;
    const out = oppShots.filter(e => e.outcome === 'out' || e.outcome === 'off_target' || e.outcome === 'wide').length;
    const rejected = oppShots.filter(e => e.outcome === 'rejected' || e.outcome === 'blocked').length;
    const post = oppShots.filter(e => e.outcome === 'post').length;

    const on1 = oppShots.filter(e => (e.outcome === 'goal' || e.outcome === 'saved' || e.outcome === 'on_target' || e.outcome === 'ontarget') && e.half === 1).length;
    const off1 = oppShots.filter(e => (e.outcome === 'off_target' || e.outcome === 'blocked' || e.outcome === 'wide' || e.outcome === 'post' || e.outcome === 'out' || e.outcome === 'rejected') && e.half === 1).length;
    const on2 = oppShots.filter(e => (e.outcome === 'goal' || e.outcome === 'saved' || e.outcome === 'on_target' || e.outcome === 'ontarget') && e.half === 2).length;
    const off2 = oppShots.filter(e => (e.outcome === 'off_target' || e.outcome === 'blocked' || e.outcome === 'wide' || e.outcome === 'post' || e.outcome === 'out' || e.outcome === 'rejected') && e.half === 2).length;

    return {
      total: oppShots.length,
      ontarget,
      goal,
      out,
      rejected,
      post,
      on1,
      off1,
      on2,
      off2,
      hasData: oppShots.length > 0
    };
  });

  function syncOpponentShotsFromMatch() {
    const p = pitchOpponentShots;
    const currentOn1 = stat.oppShotsOn1 || 0;
    const currentOff1 = stat.oppShotsOff1 || 0;
    const currentOn2 = stat.oppShotsOn2 || 0;
    const currentOff2 = stat.oppShotsOff2 || 0;

    matchStore.updateGkCounter('oppShotsOn1', p.on1 - currentOn1);
    matchStore.updateGkCounter('oppShotsOff1', p.off1 - currentOff1);
    matchStore.updateGkCounter('oppShotsOn2', p.on2 - currentOn2);
    matchStore.updateGkCounter('oppShotsOff2', p.off2 - currentOff2);
  }
</script>

<div class="gk-dashboard-container">
  <!-- TOP GK PROFILE & MATCH HEADER -->
  <header class="gk-top-header">
    <div class="header-main-info">
      <div class="gk-badge-avatar">
        <span class="gk-no">#{stat.playerNo}</span>
        <Shield class="w-6 h-6 text-emerald-400" />
      </div>

      <div class="gk-text-block">
        <div class="flex items-center gap-2 flex-wrap">
          <h1 class="gk-title-name">{stat.playerName}</h1>
          <span class="role-badge">GOALKEEPER</span>
          <span class="vs-badge">VS {matchStore.data?.match.awayTeam || 'OPPONENT'}</span>
        </div>
        <div class="meta-sub-row">
          <span class="comp-tag">{matchStore.data?.match.competition || 'PRO FUTSAL LEAGUE'}</span>
          <span class="dot">•</span>
          <span class="time-edit-wrap">
            <Clock class="w-3.5 h-3.5 text-cyan-400" />
            <input 
              type="text" 
              class="minutes-input"
              value={stat.minutesPlayed || '40 minutes full match'} 
              onchange={(e) => matchStore.updateGkTacticalNotes({ minutesPlayed: (e.target as HTMLInputElement).value })}
              title="Klik untuk ubah durasi bermain kiper"
            />
          </span>
        </div>
      </div>
    </div>

    <!-- GK Selector & Navigation Actions -->
    <div class="header-action-block">
      <div class="gk-picker">
        <label for="gk-select-top">Kiper:</label>
        <select 
          id="gk-select-top"
          class="gk-picker-select"
          value={matchStore.activeGkPlayerNo} 
          onchange={(e) => { matchStore.activeGkPlayerNo = Number((e.target as HTMLSelectElement).value); }}
        >
          {#each matchStore.matchGkList as gk}
            <option value={gk.no}>#{gk.no} - {gk.name}</option>
          {/each}
        </select>
      </div>

      <button 
        class="btn-print-pdf"
        onclick={handlePrintGkPdf}
        title="Cetak Laporan Resmi 3 Halaman A4"
      >
        <Printer class="w-4 h-4 text-emerald-400" />
        <span>Cetak PDF (3 Hal)</span>
      </button>

      <!-- Navigation Tabs -->
      <nav class="gk-tabs-nav" aria-label="GK Tabs">
        <button 
          class="tab-btn {matchStore.activeGkTab !== 'dossier' ? 'tab-active' : ''}"
          onclick={() => matchStore.activeGkTab = 'all'}
        >
          <Award class="w-4 h-4" />
          <span>DASHBOARD (SEMUA STATISTIK)</span>
        </button>
        <button 
          class="tab-btn {matchStore.activeGkTab === 'dossier' ? 'tab-active' : ''}"
          onclick={() => matchStore.activeGkTab = 'dossier'}
        >
          <FileText class="w-4 h-4" />
          <span>3-PAGE DOSSIER</span>
        </button>
      </nav>
    </div>
  </header>

  <!-- KEY PERFORMANCE INDICATORS (KPI) BAR -->
  <section class="kpi-grid-container">
    <div class="kpi-box box-blue">
      <div class="kpi-icon-wrap bg-blue-500/10 text-blue-400">
        <Shield class="w-5 h-5" />
      </div>
      <div class="kpi-content">
        <span class="kpi-head">SAVE PERCENTAGE</span>
        <div class="kpi-num text-blue-400">{calc.savePercentage}%</div>
        <span class="kpi-subtext">{calc.totalSaves} Saves / {calc.totalOppShotsOn} On Target</span>
      </div>
    </div>

    <div class="kpi-box box-emerald">
      <div class="kpi-icon-wrap bg-emerald-500/10 text-emerald-400">
        <Zap class="w-5 h-5" />
      </div>
      <div class="kpi-content">
        <span class="kpi-head">DISTRIBUTION ACCURACY</span>
        <div class="kpi-num text-emerald-400">{calc.distAccuracy}%</div>
        <span class="kpi-subtext">Tangan {calc.handAccuracy}% | Kaki {calc.feetAccuracy}%</span>
      </div>
    </div>

    <div class="kpi-box box-amber">
      <div class="kpi-icon-wrap bg-amber-500/10 text-amber-400">
        <TrendingUp class="w-5 h-5" />
      </div>
      <div class="kpi-content">
        <span class="kpi-head">COVERING / SWEEPER</span>
        <div class="kpi-num text-amber-400">{calc.totalCovering}</div>
        <span class="kpi-subtext">Z1:{stat.coveringZ1} Z2:{stat.coveringZ2} Z3:{stat.coveringZ3} Z4:{stat.coveringZ4}</span>
      </div>
    </div>

    <div class="kpi-box box-rose">
      <div class="kpi-icon-wrap bg-rose-500/10 text-rose-400">
        <AlertTriangle class="w-5 h-5" />
      </div>
      <div class="kpi-content">
        <span class="kpi-head">TOTAL CONCEDED</span>
        <div class="kpi-num text-rose-400">{calc.totalConceded}</div>
        <span class="kpi-subtext">Babak 1: {calc.concededH1} | Babak 2: {calc.concededH2}</span>
      </div>
    </div>
  </section>

  <!-- ==================================================== -->
  <!-- UNIFIED ALL-IN-ONE GK PERFORMANCE DASHBOARD          -->
  <!-- ==================================================== -->
  {#if matchStore.activeGkTab !== 'dossier'}
    <div class="tab-fade-in space-y-6">
      
      <!-- ==================================================== -->
      <!-- SECTION 1: DEFENCE & OPPONENT SHOOTING               -->
      <!-- ==================================================== -->
      <div class="space-y-4">
        <div class="section-divider-banner defence">
          <div class="flex items-center gap-2">
            <Shield class="w-4 h-4 text-rose-400" />
            <span class="section-divider-title text-rose-300">1. MODUL PERTAHANAN & PENYELAMATAN (DEFENCE & SAVES)</span>
          </div>
          <span class="section-divider-badge text-rose-400">{calc.savePercentage}% Save Rate</span>
        </div>
      
      <!-- FULL WIDTH CARD 1: OPPONENT SHOOTING (DIRECT MATCH INTEGRATION & HORIZONTAL TABLE) -->
      <div class="panel-card">
        <div class="panel-card-head">
          <div class="flex items-center gap-2">
            <span class="chip-label chip-rose">DEFENCE</span>
            <h2 class="panel-heading">Opponent Shooting (Tembakan Lawan)</h2>
          </div>
          <div class="flex items-center gap-3">
            {#if pitchOpponentShots.hasData}
              <div class="live-integration-badge">
                <span class="live-pulse-dot"></span>
                <span>Terintegrasi Langsung ({pitchOpponentShots.total} Shots Lawan)</span>
              </div>
            {/if}
            <span class="badge-total text-rose-400">Total: {calc.totalOppShots} Shots</span>
          </div>
        </div>

        {#if pitchOpponentShots.hasData}
          <!-- Tactical Pitch Category Breakdown Strip -->
          <div class="pitch-tactical-breakdown-strip">
            <span class="strip-label">KATEGORI EVENT PAPAN TAKTIK:</span>
            <div class="strip-chips-wrap">
              <span class="tactical-chip target">
                <span class="chip-icon">Ⓣ</span>
                <span class="chip-text">ON TARGET: <strong>{pitchOpponentShots.ontarget}</strong></span>
              </span>
              <span class="tactical-chip goal">
                <span class="chip-icon">Ⓖ</span>
                <span class="chip-text">GOAL: <strong>{pitchOpponentShots.goal}</strong></span>
              </span>
              <span class="tactical-chip out">
                <span class="chip-icon">Ⓞ</span>
                <span class="chip-text">OUT: <strong>{pitchOpponentShots.out}</strong></span>
              </span>
              <span class="tactical-chip reject">
                <span class="chip-icon">Ⓡ</span>
                <span class="chip-text">REJECTED: <strong>{pitchOpponentShots.rejected}</strong></span>
              </span>
              <span class="tactical-chip post">
                <span class="chip-icon">Ⓟ</span>
                <span class="chip-text">POST: <strong>{pitchOpponentShots.post}</strong></span>
              </span>
            </div>
          </div>
        {/if}

        <div class="enterprise-table-wrap">
          <table class="enterprise-data-table">
            <thead>
              <tr>
                <th class="text-left w-1/4">PERIODE BABAK</th>
                <th class="text-center w-1/4">ON TARGET (Ⓣ + Ⓖ)</th>
                <th class="text-center w-1/4">OFF TARGET (Ⓞ + Ⓡ + Ⓟ)</th>
                <th class="text-center w-1/8">TOTAL SHOTS</th>
                <th class="text-center w-1/8">AKURASI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="period-title-cell">
                  <div class="flex items-center gap-2">
                    <span class="period-dot dot-h1"></span>
                    <div>
                      <span class="font-bold text-slate-100">Babak 1 (First Round)</span>
                      <span class="block text-[0.65rem] text-slate-400">20 Menit Pertama</span>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  {#if pitchOpponentShots.hasData}
                    <div class="live-val-pill text-emerald-400">
                      <span class="live-number">{calc.oppShotsOn1}</span>
                      <span class="live-sub">Live Pitch</span>
                    </div>
                  {:else}
                    <div class="stepper-inline">
                      <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('oppShotsOn1', -1)}><Minus class="w-3.5 h-3.5" /></button>
                      <span class="step-val text-emerald-400">{stat.oppShotsOn1 || 0}</span>
                      <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('oppShotsOn1', 1)}><Plus class="w-3.5 h-3.5" /></button>
                    </div>
                  {/if}
                </td>
                <td class="text-center">
                  {#if pitchOpponentShots.hasData}
                    <div class="live-val-pill text-slate-300">
                      <span class="live-number">{calc.oppShotsOff1}</span>
                      <span class="live-sub">Live Pitch</span>
                    </div>
                  {:else}
                    <div class="stepper-inline">
                      <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('oppShotsOff1', -1)}><Minus class="w-3.5 h-3.5" /></button>
                      <span class="step-val text-zinc-300">{stat.oppShotsOff1 || 0}</span>
                      <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('oppShotsOff1', 1)}><Plus class="w-3.5 h-3.5" /></button>
                    </div>
                  {/if}
                </td>
                <td class="text-center font-bold text-slate-200">
                  {calc.oppShotsOn1 + calc.oppShotsOff1}
                </td>
                <td class="text-center">
                  <span class="accuracy-badge text-emerald-400">
                    {(calc.oppShotsOn1 + calc.oppShotsOff1) > 0 ? Math.round((calc.oppShotsOn1 / (calc.oppShotsOn1 + calc.oppShotsOff1)) * 100) : 0}%
                  </span>
                </td>
              </tr>
              <tr>
                <td class="period-title-cell">
                  <div class="flex items-center gap-2">
                    <span class="period-dot dot-h2"></span>
                    <div>
                      <span class="font-bold text-slate-100">Babak 2 (Second Round)</span>
                      <span class="block text-[0.65rem] text-slate-400">20 Menit Kedua</span>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  {#if pitchOpponentShots.hasData}
                    <div class="live-val-pill text-emerald-400">
                      <span class="live-number">{calc.oppShotsOn2}</span>
                      <span class="live-sub">Live Pitch</span>
                    </div>
                  {:else}
                    <div class="stepper-inline">
                      <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('oppShotsOn2', -1)}><Minus class="w-3.5 h-3.5" /></button>
                      <span class="step-val text-emerald-400">{stat.oppShotsOn2 || 0}</span>
                      <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('oppShotsOn2', 1)}><Plus class="w-3.5 h-3.5" /></button>
                    </div>
                  {/if}
                </td>
                <td class="text-center">
                  {#if pitchOpponentShots.hasData}
                    <div class="live-val-pill text-slate-300">
                      <span class="live-number">{calc.oppShotsOff2}</span>
                      <span class="live-sub">Live Pitch</span>
                    </div>
                  {:else}
                    <div class="stepper-inline">
                      <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('oppShotsOff2', -1)}><Minus class="w-3.5 h-3.5" /></button>
                      <span class="step-val text-zinc-300">{stat.oppShotsOff2 || 0}</span>
                      <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('oppShotsOff2', 1)}><Plus class="w-3.5 h-3.5" /></button>
                    </div>
                  {/if}
                </td>
                <td class="text-center font-bold text-slate-200">
                  {calc.oppShotsOn2 + calc.oppShotsOff2}
                </td>
                <td class="text-center">
                  <span class="accuracy-badge text-emerald-400">
                    {(calc.oppShotsOn2 + calc.oppShotsOff2) > 0 ? Math.round((calc.oppShotsOn2 / (calc.oppShotsOn2 + calc.oppShotsOff2)) * 100) : 0}%
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="summary-row">
                <td class="font-extrabold text-slate-100 uppercase tracking-wider">Total Pertandingan</td>
                <td class="text-center font-black text-emerald-400">{calc.totalOppShotsOn}</td>
                <td class="text-center font-black text-zinc-300">{calc.totalOppShotsOff}</td>
                <td class="text-center font-black text-rose-400">{calc.totalOppShots}</td>
                <td class="text-center font-black text-emerald-400">{calc.oppShotAccuracy}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- FULL WIDTH CARD 2: SAVES ACTIONS MATRIX TABLE (EXACT IMAGE 3 LAYOUT) -->
      <div class="panel-card">
        <div class="panel-card-head">
          <div class="flex items-center gap-2">
            <span class="chip-label chip-blue">SAVES</span>
            <h2 class="panel-heading">Saves Action Breakdown (Penyelamatan)</h2>
          </div>
          <span class="badge-total text-blue-400">Total: {calc.totalSaves} Saves</span>
        </div>

        <div class="enterprise-table-wrap">
          <table class="gk-matrix-table">
            <thead>
              <tr>
                <th rowspan="2" class="matrix-head-main">GK Actions</th>
                <th colspan="5" class="matrix-head-group">MATCH</th>
              </tr>
              <tr>
                <th class="text-center w-1/5">CATCH</th>
                <th class="text-center w-1/5">BLOCK</th>
                <th class="text-center w-1/5">CROSS</th>
                <th class="text-center w-1/5">SPLIT</th>
                <th class="text-center w-1/5">DIVE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="matrix-row-title text-blue-300">SAVES</td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('saveCatch', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-blue-400">{stat.saveCatch || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('saveCatch', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('saveBlock', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-blue-400">{stat.saveBlock || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('saveBlock', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('saveCross', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-blue-400">{stat.saveCross || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('saveCross', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('saveSplit', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-blue-400">{stat.saveSplit || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('saveSplit', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('saveDive', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-blue-400">{stat.saveDive || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('saveDive', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FULL WIDTH CARD 3: COVERING / SWEEPER KEEPER (EXACT IMAGE 3 LAYOUT) -->
      <div class="panel-card">
        <div class="panel-card-head">
          <div class="flex items-center gap-2">
            <span class="chip-label chip-amber">SWEEPER</span>
            <h2 class="panel-heading">Covering / Sweeper Keeper Actions</h2>
          </div>
          <span class="badge-total text-amber-400">Total: {calc.totalCovering} Aksi</span>
        </div>

        <div class="enterprise-table-wrap">
          <table class="gk-matrix-table">
            <thead>
              <tr>
                <th rowspan="2" class="matrix-head-main">GK Actions</th>
                <th colspan="4" class="matrix-head-group">MATCH</th>
              </tr>
              <tr>
                <th class="text-center w-1/4">ZONA 1</th>
                <th class="text-center w-1/4">ZONA 2</th>
                <th class="text-center w-1/4">ZONA 3</th>
                <th class="text-center w-1/4">ZONA 4</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="matrix-row-title text-amber-300">COVERING</td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('coveringZ1', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-amber-400">{stat.coveringZ1 || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('coveringZ1', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('coveringZ2', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-amber-400">{stat.coveringZ2 || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('coveringZ2', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('coveringZ3', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-amber-400">{stat.coveringZ3 || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('coveringZ3', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('coveringZ4', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-amber-400">{stat.coveringZ4 || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('coveringZ4', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FULL WIDTH CARD 4: CONCEDED GOAL SUMMARY MATRIX TABLE (EXACT DRAFT TABLE 4) -->
      <div class="panel-card">
        <div class="panel-card-head">
          <div class="flex items-center gap-2">
            <span class="chip-label chip-rose">CONCEDED</span>
            <h2 class="panel-heading">Conceded Goal Breakdown (Gol Kebobolan)</h2>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge-total text-rose-400">Total: {calc.totalConceded} Gol</span>
            <button class="btn-add-goal-mini" onclick={() => showAddGoalModal = true}>
              <Plus class="w-3.5 h-3.5 mr-1" /> Catat Kebobolan
            </button>
          </div>
        </div>

        <div class="enterprise-table-wrap">
          <table class="gk-matrix-table">
            <thead>
              <tr>
                <th rowspan="2" class="matrix-head-main">GK Actions</th>
                <th colspan="4" class="matrix-head-group">MATCH</th>
              </tr>
              <tr>
                <th class="text-center w-28">FIRST ROUND</th>
                <th class="text-center w-28">SECOND ROUND</th>
                <th class="text-center w-40">MINUTES</th>
                <th class="text-center">NOTES</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="matrix-row-title text-rose-300">CONCEDED GOAL</td>
                <td class="text-center font-black text-rose-400 text-lg">
                  {calc.concededH1}
                </td>
                <td class="text-center font-black text-rose-400 text-lg">
                  {calc.concededH2}
                </td>
                <td class="text-center font-semibold text-zinc-300 text-xs">
                  {#if integratedConcededGoals.length > 0}
                    <div class="flex flex-wrap gap-1 justify-center">
                      {#each integratedConcededGoals as cg}
                        <span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px] border border-rose-500/30">
                          {cg.minute}' <span class="text-zinc-400 text-[9px]">(B{cg.half})</span>
                        </span>
                      {/each}
                    </div>
                  {:else}
                    <span class="text-emerald-400 font-bold text-xs">✨ Clean Sheet</span>
                  {/if}
                </td>
                <td class="text-left text-xs text-zinc-300 py-2 px-3">
                  {#if integratedConcededGoals.length > 0}
                    <div class="space-y-1">
                      {#each integratedConcededGoals as cg, idx}
                        <div class="flex items-center justify-between gap-2 text-[11px] bg-white/[0.03] p-1.5 rounded border border-white/5">
                          <div>
                            <strong class="text-rose-400">Gol {idx + 1} ({cg.minute}'):</strong> 
                            <span class="text-zinc-200">Zona {cg.shooterZone} ➔ Target {cg.goalZone}</span>
                            {#if cg.note}
                              <span class="text-zinc-400 italic font-mono text-[10px] ml-1">({cg.note})</span>
                            {/if}
                          </div>
                          {#if !cg.isFromScoreboard && !cg.isFromPitch}
                            <button 
                              class="text-rose-400 hover:text-rose-300 p-0.5 rounded hover:bg-rose-500/10 transition-colors"
                              onclick={() => matchStore.deleteGkConcededGoal(cg.id)}
                              title="Hapus gol"
                            >
                              <Trash2 class="w-3.5 h-3.5" />
                            </button>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <span class="text-emerald-400/80 italic text-xs">Tidak ada gol kebobolan tercatat</span>
                  {/if}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <!-- ==================================================== -->
      <!-- SECTION 2: ATTACK & DISTRIBUTION                     -->
      <!-- ==================================================== -->
      <div class="space-y-4 pt-2">
        <div class="section-divider-banner attack">
          <div class="flex items-center gap-2">
            <Zap class="w-4 h-4 text-emerald-400" />
            <span class="section-divider-title text-emerald-300">2. MODUL DISTRIBUSI & PENYERANGAN (ATTACK)</span>
          </div>
          <span class="section-divider-badge text-emerald-400">{calc.distAccuracy}% Dist. Accuracy</span>
        </div>
      
      <!-- FULL WIDTH CARD: HAND DISTRIBUTION MATRIX TABLE -->
      <div class="panel-card">
        <div class="panel-card-head">
          <div class="flex items-center gap-2">
            <span class="chip-label chip-emerald">HAND</span>
            <h2 class="panel-heading">Hand Distribution (Lemparan Tangan)</h2>
          </div>
          <span class="badge-total text-emerald-400">Total Akurasi: {calc.handAccuracy}%</span>
        </div>

        <div class="enterprise-table-wrap">
          <table class="gk-matrix-table">
            <thead>
              <tr>
                <th rowspan="2" class="matrix-head-main">Distribusi Tangan</th>
                <th colspan="3" class="matrix-head-group">JARAK LEMPARAN (MATCH)</th>
                <th rowspan="2" class="text-center w-24">TOTAL</th>
                <th rowspan="2" class="text-center w-28">AKURASI</th>
              </tr>
              <tr>
                <th class="text-center">SHORT (Dekat)</th>
                <th class="text-center">MIDDLE (Sedang)</th>
                <th class="text-center">LONG (Jauh)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="matrix-row-title text-emerald-300">SUKSES</td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('handShortSuccess', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-emerald-400">{stat.handShortSuccess || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('handShortSuccess', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('handMidSuccess', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-emerald-400">{stat.handMidSuccess || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('handMidSuccess', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('handLongSuccess', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-emerald-400">{stat.handLongSuccess || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('handLongSuccess', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center font-bold text-emerald-400 text-base">{calc.handSuccess}</td>
                <td rowspan="2" class="text-center align-middle bg-slate-900/60">
                  <span class="accuracy-badge text-emerald-400 text-sm font-black">{calc.handAccuracy}%</span>
                </td>
              </tr>
              <tr>
                <td class="matrix-row-title text-rose-300">GAGAL</td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('handShortFail', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-rose-400">{stat.handShortFail || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('handShortFail', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('handMidFail', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-rose-400">{stat.handMidFail || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('handMidFail', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('handLongFail', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-rose-400">{stat.handLongFail || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('handLongFail', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center font-bold text-rose-400 text-base">{calc.handFail}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FULL WIDTH CARD: FEET DISTRIBUTION MATRIX TABLE -->
      <div class="panel-card">
        <div class="panel-card-head">
          <div class="flex items-center gap-2">
            <span class="chip-label chip-cyan">FEET</span>
            <h2 class="panel-heading">Feet Distribution (Passing / Tendangan Kaki)</h2>
          </div>
          <span class="badge-total text-cyan-400">Total Akurasi: {calc.feetAccuracy}%</span>
        </div>

        <div class="enterprise-table-wrap">
          <table class="gk-matrix-table">
            <thead>
              <tr>
                <th rowspan="2" class="matrix-head-main">Distribusi Kaki</th>
                <th colspan="3" class="matrix-head-group">JARAK PASSING (MATCH)</th>
                <th rowspan="2" class="text-center w-24">TOTAL</th>
                <th rowspan="2" class="text-center w-28">AKURASI</th>
              </tr>
              <tr>
                <th class="text-center">SHORT (Dekat)</th>
                <th class="text-center">MIDDLE (Sedang)</th>
                <th class="text-center">LONG (Jauh)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="matrix-row-title text-cyan-300">SUKSES</td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('feetShortSuccess', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-cyan-400">{stat.feetShortSuccess || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('feetShortSuccess', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('feetMidSuccess', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-cyan-400">{stat.feetMidSuccess || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('feetMidSuccess', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('feetLongSuccess', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-cyan-400">{stat.feetLongSuccess || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('feetLongSuccess', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center font-bold text-cyan-400 text-base">{calc.feetSuccess}</td>
                <td rowspan="2" class="text-center align-middle bg-slate-900/60">
                  <span class="accuracy-badge text-cyan-400 text-sm font-black">{calc.feetAccuracy}%</span>
                </td>
              </tr>
              <tr>
                <td class="matrix-row-title text-rose-300">GAGAL</td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('feetShortFail', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-rose-400">{stat.feetShortFail || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('feetShortFail', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('feetMidFail', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-rose-400">{stat.feetMidFail || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('feetMidFail', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('feetLongFail', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-rose-400">{stat.feetLongFail || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('feetLongFail', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center font-bold text-rose-400 text-base">{calc.feetFail}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FULL WIDTH CARD: GK SHOOTING & ASSIST ACTIONS MATRIX TABLE -->
      <div class="panel-card">
        <div class="panel-card-head">
          <div class="flex items-center gap-2">
            <span class="chip-label chip-purple">OFFENCE</span>
            <h2 class="panel-heading">GK Shooting & Assist Contributions</h2>
          </div>
        </div>

        <div class="enterprise-table-wrap">
          <table class="gk-matrix-table">
            <thead>
              <tr>
                <th rowspan="2" class="matrix-head-main">Aksi Menyerang</th>
                <th colspan="3" class="matrix-head-group">SHOOTING</th>
                <th colspan="2" class="matrix-head-group">ASSIST</th>
              </tr>
              <tr>
                <th class="text-center w-1/5">OPEN PLAY</th>
                <th class="text-center w-1/5">DROP KICK</th>
                <th class="text-center w-1/5">SET PLAY</th>
                <th class="text-center w-1/5">LEMPARAN</th>
                <th class="text-center w-1/5">PASSING</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="matrix-row-title text-purple-300">MATCH</td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('shootingOpenPlay', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-purple-400">{stat.shootingOpenPlay || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('shootingOpenPlay', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('shootingDropKick', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-purple-400">{stat.shootingDropKick || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('shootingDropKick', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('shootingSetPlay', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-purple-400">{stat.shootingSetPlay || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('shootingSetPlay', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('assistThrowing', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-amber-400">{stat.assistThrowing || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('assistThrowing', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
                <td class="text-center">
                  <div class="stepper-inline">
                    <button class="step-btn minus" onclick={() => matchStore.updateGkCounter('assistPassing', -1)}><Minus class="w-3.5 h-3.5" /></button>
                    <span class="step-val text-amber-400">{stat.assistPassing || 0}</span>
                    <button class="step-btn plus" onclick={() => matchStore.updateGkCounter('assistPassing', 1)}><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================================================== -->
    <!-- SECTION 3: CONCEDED GOALS & TACTICAL MAP (EXACT IMAGE 1) -->
    <!-- ==================================================== -->
    <div class="space-y-4 pt-2">
      <div class="section-divider-banner conceded">
        <div class="flex items-center gap-2">
          <Crosshair class="w-4 h-4 text-cyan-400" />
          <span class="section-divider-title text-cyan-300">3. PETA & ANALISIS GOL KEBOBOLAN (CONCEDED MAP)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="section-divider-badge text-cyan-400">{calc.totalConceded} Gol Kebobolan</span>
          <button 
            class="btn-add-goal-mini"
            onclick={() => showAddGoalModal = true}
          >
            <Plus class="w-3.5 h-3.5 mr-1" /> + Catat Gol
          </button>
        </div>
      </div>
      
      <!-- PREMIUM ENTERPRISE TACTICAL COMMAND BOARD -->
      <div class="tactical-board-canvas">
        
        <!-- TOP PILL HEADER -->
        <div class="tactical-board-header">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="tactical-pill-green">{stat.playerName}</span>
            <span class="tactical-pill-green">VS {matchStore.data?.match.awayTeam || 'OPPONENT'}</span>
            <span class="tactical-pill-green">{matchStore.data?.match.competition || 'PRO FUTSAL LEAGUE'}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="tactical-live-badge">Live GK Command Board</span>
            <img src={matchStore.currentTeamLogo || '/icon.png'} alt="Team Logo" class="tactical-club-logo" />
          </div>
        </div>

        <!-- 2-COLUMN WIDE DIAGRAMS (TOP) -->
        <div class="tactical-board-top-grid">
          
          <!-- COLUMN 1: CONCEDED AREA (PITCH) -->
          <div class="tactical-col">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="tactical-pill-blue">Conceded area</span>
                <span class="text-xs text-sky-400 font-bold">Area Terjadinya Tembakan</span>
              </div>
              <span class="text-[11px] text-zinc-400 font-semibold flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                Klik lapangan untuk plot titik
              </span>
            </div>

            <div 
              class="tactical-image-frame pitch-interactive-wrapper"
              onclick={handlePitchClick}
              role="button"
              tabindex="0"
              onkeydown={(e) => { if (e.key === 'Enter') showAddGoalModal = true; }}
              title="Klik pada area lapangan untuk menandai letak titik kebobolan"
            >
              <div class="pitch-canvas-anchor">
                <img 
                  src={GK_AREA_CONCEDED_IMAGE_DATA_URI} 
                  alt="Conceded Area Diagram" 
                  class="tactical-pitch-img"
                />

                <!-- NUMBERED GOAL PINS -->
                {#each integratedConcededGoals as cg, idx}
                  {@const pin = getGoalPinCoordinates(cg, idx)}
                  <div 
                    class="conceded-goal-pin"
                    style="left: {pin.x}%; top: {pin.y}%;"
                    title="Gol {idx + 1} ({cg.minute}') : Zona {cg.shooterZone} ➔ Target {cg.goalZone} ({cg.note || 'lower shooting'})"
                    onclick={(e) => { e.stopPropagation(); openEditGoalModal(cg); }}
                    role="presentation"
                  >
                    <span class="pin-number">{idx + 1}</span>
                    <div class="pin-tooltip">
                      <div class="font-black text-white">Gol {idx + 1} ({cg.minute}')</div>
                      <div class="text-[10px] text-sky-200">Zona {cg.shooterZone} ➔ Target {cg.goalZone}</div>
                      <div class="text-[9px] text-zinc-300 italic">{cg.note || 'lower shooting'}</div>
                      <div class="pin-tooltip-actions">
                        <button class="pin-act-btn edit" onclick={(e) => { e.stopPropagation(); openEditGoalModal(cg); }}>
                          <Pencil class="w-2.5 h-2.5" /> Edit
                        </button>
                        <button class="pin-act-btn del" onclick={(e) => { e.stopPropagation(); handleDeleteGoal(cg.id); }}>
                          <Trash2 class="w-2.5 h-2.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <div class="tactical-subnote">Note : LAST SHOOTER TO GOAL</div>

            <!-- CONCEDED GOALS LIST & QUICK ZONES (HORIZONTAL SIDE-BY-SIDE) -->
            <div class="tactical-subgrid-2col">
              <!-- Conceded goals list -->
              <div class="tactical-conceded-box !mt-0">
                <div class="flex items-center justify-between conceded-list-title mb-1.5">
                  <span class="font-bold">CONCEDED ({integratedConcededGoals.length}) :</span>
                  <button 
                    class="add-goal-mini-btn" 
                    onclick={() => showAddGoalModal = true}
                    title="Tambah gol manual"
                  >
                    <Plus class="w-3 h-3" /> Tambah
                  </button>
                </div>
                {#if integratedConcededGoals.length === 0}
                  <div class="text-xs text-emerald-400 font-bold py-1">✨ Clean Sheet (0 Kebobolan)</div>
                {:else}
                  <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scroll">
                    {#each integratedConcededGoals as cg, idx}
                      <div class="conceded-line-item">
                        <div class="flex items-center gap-1.5 flex-1 min-w-0">
                          <span class="badge-num-pill">{idx + 1}</span>
                          <span class="truncate font-semibold text-[11px]">Gol {idx + 1} ({cg.note || 'lower shooting'} - {cg.minute}')</span>
                        </div>
                        <div class="flex items-center gap-1">
                          <button 
                            class="edit-goal-btn" 
                            onclick={() => openEditGoalModal(cg)}
                            title="Edit data gol {idx + 1}"
                          >
                            <Pencil class="w-3.5 h-3.5 text-sky-400 hover:text-sky-200" />
                          </button>
                          <button 
                            class="del-goal-btn" 
                            onclick={() => handleDeleteGoal(cg.id)}
                            title="Hapus gol {idx + 1}"
                          >
                            <Trash2 class="w-3.5 h-3.5 text-rose-400 hover:text-rose-200" />
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>

              <!-- Quick zone chips -->
              <div class="tactical-quick-zones !mt-0">
                <div class="quick-zones-label">PILIH ZONA TEMBAKAN:</div>
                <div class="flex flex-wrap gap-1 mt-1">
                  {#each pitchZones as pz}
                    <button 
                      class="tactical-zone-chip {getZoneConcededCount(pz.id, 'pitch') > 0 ? 'active' : ''}"
                      onclick={() => { newGoalPitchZone = pz.id; showAddGoalModal = true; }}
                    >
                      <span>{pz.id}</span>
                      {#if getZoneConcededCount(pz.id, 'pitch') > 0}
                        <span class="chip-bubble">{getZoneConcededCount(pz.id, 'pitch')}</span>
                      {/if}
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          </div>

          <!-- COLUMN 2: CONCEDED POSITION (GOAL TARGET) -->
          <div class="tactical-col">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="tactical-pill-blue">Conceded position</span>
                <span class="text-xs text-purple-400 font-bold">5 Titik Sasaran Arah Bola</span>
              </div>
              <span class="text-[11px] text-zinc-400 font-semibold flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                <span class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                Klik gawang untuk plot titik
              </span>
            </div>

            <div 
              class="tactical-image-frame goal-interactive-wrapper"
              onclick={handleGoalFrameClick}
              role="button"
              tabindex="0"
              onkeydown={(e) => { if (e.key === 'Enter') showAddGoalModal = true; }}
              title="Klik pada area gawang/kiper untuk menandai arah bola masuk"
            >
              <div class="pitch-canvas-anchor">
                <img 
                  src={GK_CONCEDED_IMAGE_DATA_URI} 
                  alt="Conceded Position Diagram" 
                  class="tactical-goal-img"
                />

                <!-- NUMBERED TARGET PINS ON GOAL -->
                {#each integratedConcededGoals as cg, idx}
                  {@const pin = getGoalTargetPinCoordinates(cg, idx)}
                  <div 
                    class="conceded-goal-pin purple"
                    style="left: {pin.x}%; top: {pin.y}%;"
                    title="Gol {idx + 1} ({cg.minute}') : Arah Target Zona {cg.goalZone} ({cg.note || 'lower shooting'})"
                    onclick={(e) => { e.stopPropagation(); openEditGoalModal(cg); }}
                    role="presentation"
                  >
                    <span class="pin-number">{idx + 1}</span>
                    <div class="pin-tooltip">
                      <div class="font-black text-white">Gol {idx + 1} ({cg.minute}')</div>
                      <div class="text-[10px] text-purple-300">Arah Target: Zona {cg.goalZone}</div>
                      <div class="text-[9px] text-zinc-300 italic">{cg.note || 'lower shooting'}</div>
                      <div class="pin-tooltip-actions">
                        <button class="pin-act-btn edit" onclick={(e) => { e.stopPropagation(); openEditGoalModal(cg); }}>
                          <Pencil class="w-2.5 h-2.5" /> Edit
                        </button>
                        <button class="pin-act-btn del" onclick={(e) => { e.stopPropagation(); handleDeleteGoal(cg.id); }}>
                          <Trash2 class="w-2.5 h-2.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <div class="tactical-subnote">Note : LAST POSITION BALL AT SCORING</div>

            <!-- 5 Interactive Target Zones (HORIZONTALLY SPREAD ACROSS FULL WIDTH) -->
            <div class="tactical-quick-zones mt-3">
              <div class="quick-zones-label">5 TITIK SASARAN GAWANG :</div>
              <div class="goal-target-zones-row">
                {#each goalTargetZones as gz}
                  <button 
                    class="tactical-target-btn {getZoneConcededCount(gz.id, 'goal') > 0 ? 'active' : ''}"
                    onclick={() => { newGoalTargetZone = gz.id; showAddGoalModal = true; }}
                  >
                    <span class="target-num">{gz.id}</span>
                    <span class="target-title">{gz.title}</span>
                    {#if getZoneConcededCount(gz.id, 'goal') > 0}
                      <span class="chip-bubble purple">{getZoneConcededCount(gz.id, 'goal')}</span>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          </div>

        </div>

        <!-- FULL-WIDTH WIDE NOTE & EVALUATION CARD (BOTTOM) -->
        <div class="tactical-blue-card mt-5">
          <div class="flex items-center justify-between border-b border-sky-500/30 pb-3 mb-4">
            <div class="flex items-center gap-3">
              <span class="tactical-pill-blue text-sm px-3 py-1">{stat.minutesPlayed || '40 minutes full match'}</span>
              <div class="blue-card-title !mb-0">NOTE & EVALUASI ANALISIS KIPER</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-emerald-400 flex items-center gap-1.5 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <Save class="w-3.5 h-3.5" /> Auto-Saved
              </span>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="note-item-group">
              <div class="flex items-center justify-between mb-1">
                <div class="note-item-heading text-sm">1. SHOOTING ANTICIPATION</div>
                <span class="text-[10px] text-sky-300 font-semibold">Antisipasi Tembakan</span>
              </div>
              <textarea 
                class="blue-card-textarea wide"
                placeholder="Tulis evaluasi antisipasi posisi, timing decision, dan reaksi kiper..."
                value={stat.anticipationNotes || ''}
                oninput={(e) => matchStore.updateGkTacticalNotes({ anticipationNotes: (e.target as HTMLTextAreaElement).value })}
              ></textarea>
            </div>

            <div class="note-item-group">
              <div class="flex items-center justify-between mb-1">
                <div class="note-item-heading text-sm">2. REBOUND</div>
                <span class="text-[10px] text-sky-300 font-semibold">Penguasaan Second Ball</span>
              </div>
              <textarea 
                class="blue-card-textarea wide"
                placeholder="Tulis evaluasi penguasaan bola muntah / second ball & penyelamatan ganda..."
                value={stat.reboundNotes || ''}
                oninput={(e) => matchStore.updateGkTacticalNotes({ reboundNotes: (e.target as HTMLTextAreaElement).value })}
              ></textarea>
            </div>

            <div class="note-item-group">
              <div class="flex items-center justify-between mb-1">
                <div class="note-item-heading text-sm">3. COVERING SECOND POST</div>
                <span class="text-[10px] text-sky-300 font-semibold">Covering Tiang Kedua</span>
              </div>
              <textarea 
                class="blue-card-textarea wide"
                placeholder="Tulis evaluasi covering tiang kedua, komunikasi pertahanan, & cut back pass..."
                value={stat.secondPostNotes || ''}
                oninput={(e) => matchStore.updateGkTacticalNotes({ secondPostNotes: (e.target as HTMLTextAreaElement).value })}
              ></textarea>
            </div>
          </div>
        </div>

      </div>

    </div>

    </div>

  <!-- ==================================================== -->
  <!-- TAB 2: 3-PAGE DOSSIER PREVIEW                        -->
  <!-- ==================================================== -->
  {:else if matchStore.activeGkTab === 'dossier'}
    <div class="tab-fade-in space-y-6">
      
      <!-- Top Action Bar -->
      <div class="dossier-top-bar">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileText class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-white">Pratinjau Dokumen Cetak Kiper (3 Halaman)</h2>
            <p class="text-xs text-zinc-400">Format tata letak persis sesuai standar formulir resmi GK Statistic</p>
          </div>
        </div>

        <button 
          class="btn-print-pdf glow"
          onclick={handlePrintGkPdf}
        >
          <Printer class="w-4 h-4 text-emerald-400" />
          <span>Cetak / Download PDF (3 Hal)</span>
        </button>
      </div>

      <!-- PAGE 1 PREVIEW CONTAINER -->
      <div class="dossier-sheet-card">
        <div class="sheet-indicator">HALAMAN 1: GK DEFENCE</div>
        
        <div class="dossier-header-row">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="dossier-pill-green">{stat.playerName}</span>
            <span class="dossier-vs-text">VS</span>
            <span class="dossier-pill-green">{matchStore.data?.match.awayTeam || 'OPPONENT'}</span>
            <span class="dossier-pill-cat">DEFENCE</span>
            <span class="dossier-pill-green">{matchStore.data?.match.competition || 'PRO FUTSAL LEAGUE 5'}</span>
          </div>
          <div class="flex items-center justify-end">
            <img src={matchStore.currentTeamLogo || '/icon.png'} alt="Logo" class="dossier-logo-img" />
          </div>
        </div>

        <!-- Table 1: OPPONENT SHOOTING -->
        <div class="dossier-table-wrap">
          <table class="dossier-table">
            <thead>
              <tr>
                <th rowspan="2" class="dossier-th-action">GK Actions</th>
                <th colspan="2" class="dossier-th-silver">FIRST ROUND</th>
                <th colspan="2" class="dossier-th-silver">SECOND ROUND</th>
              </tr>
              <tr>
                <th class="dossier-th-sub">ON TARGET</th>
                <th class="dossier-th-sub">OFF TARGET</th>
                <th class="dossier-th-sub">ON TARGET</th>
                <th class="dossier-th-sub">OFF TARGET</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="dossier-td-title">OPPONENT SHOOTING</td>
                <td class="dossier-td-val">{stat.oppShotsOn1 || 0}</td>
                <td class="dossier-td-val">{stat.oppShotsOff1 || 0}</td>
                <td class="dossier-td-val">{stat.oppShotsOn2 || 0}</td>
                <td class="dossier-td-val">{stat.oppShotsOff2 || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table 2: SAVES -->
        <div class="dossier-table-wrap">
          <table class="dossier-table">
            <thead>
              <tr>
                <th rowspan="2" class="dossier-th-action">GK Actions</th>
                <th colspan="5" class="dossier-th-silver">MATCH</th>
              </tr>
              <tr>
                <th class="dossier-th-sub">CATCH</th>
                <th class="dossier-th-sub">BLOCK</th>
                <th class="dossier-th-sub">CROSS</th>
                <th class="dossier-th-sub">SPLIT</th>
                <th class="dossier-th-sub">DIVE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="dossier-td-title">SAVES</td>
                <td class="dossier-td-val">{stat.saveCatch || 0}</td>
                <td class="dossier-td-val">{stat.saveBlock || 0}</td>
                <td class="dossier-td-val">{stat.saveCross || 0}</td>
                <td class="dossier-td-val">{stat.saveSplit || 0}</td>
                <td class="dossier-td-val">{stat.saveDive || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table 3: COVERING -->
        <div class="dossier-table-wrap">
          <table class="dossier-table">
            <thead>
              <tr>
                <th rowspan="2" class="dossier-th-action">GK Actions</th>
                <th colspan="4" class="dossier-th-silver">MATCH</th>
              </tr>
              <tr>
                <th class="dossier-th-sub">ZONA 1</th>
                <th class="dossier-th-sub">ZONA 2</th>
                <th class="dossier-th-sub">ZONA 3</th>
                <th class="dossier-th-sub">ZONA 4</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="dossier-td-title">COVERING</td>
                <td class="dossier-td-val">{stat.coveringZ1 || 0}</td>
                <td class="dossier-td-val">{stat.coveringZ2 || 0}</td>
                <td class="dossier-td-val">{stat.coveringZ3 || 0}</td>
                <td class="dossier-td-val">{stat.coveringZ4 || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table 4: CONCEDED GOAL -->
        <div class="dossier-table-wrap">
          <table class="dossier-table">
            <thead>
              <tr>
                <th rowspan="2" class="dossier-th-action">GK Actions</th>
                <th colspan="4" class="dossier-th-silver">MATCH</th>
              </tr>
              <tr>
                <th class="dossier-th-sub">FIRST ROUND</th>
                <th class="dossier-th-sub">SECOND ROUND</th>
                <th class="dossier-th-sub">MINUTES</th>
                <th class="dossier-th-sub">NOTES</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="dossier-td-title">CONCEDED GOAL</td>
                <td class="dossier-td-val">{calc.concededH1}</td>
                <td class="dossier-td-val">{calc.concededH2}</td>
                <td class="dossier-td-val font-mono">{concededGoals.map(c => c.minute).join(', ') || '-'}</td>
                <td class="dossier-td-val text-xs">{concededGoals.map(c => c.note).filter(Boolean).join('; ') || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PAGE 2 PREVIEW CONTAINER -->
      <div class="dossier-sheet-card">
        <div class="sheet-indicator">HALAMAN 2: GK ATTACK</div>
        
        <div class="dossier-header-row">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="dossier-pill-green">{stat.playerName}</span>
            <span class="dossier-vs-text">VS</span>
            <span class="dossier-pill-green">{matchStore.data?.match.awayTeam || 'OPPONENT'}</span>
            <span class="dossier-pill-cat">ATTACK</span>
            <span class="dossier-pill-green">{matchStore.data?.match.competition || 'PRO FUTSAL LEAGUE 5'}</span>
          </div>
          <div class="flex items-center justify-end">
            <img src={matchStore.currentTeamLogo || '/icon.png'} alt="Logo" class="dossier-logo-img" />
          </div>
        </div>

        <!-- Table 1: DISTRIBUTION -->
        <div class="dossier-table-wrap">
          <table class="dossier-table">
            <thead>
              <tr>
                <th rowspan="3" class="dossier-th-action">GK Actions</th>
                <th colspan="6" class="dossier-th-silver">HAND</th>
                <th colspan="6" class="dossier-th-silver">FEET</th>
              </tr>
              <tr>
                <th colspan="2" class="dossier-th-sub">SHORT</th>
                <th colspan="2" class="dossier-th-sub">MIDDLE</th>
                <th colspan="2" class="dossier-th-sub">LONG</th>
                <th colspan="2" class="dossier-th-sub">SHORT</th>
                <th colspan="2" class="dossier-th-sub">MIDDLE</th>
                <th colspan="2" class="dossier-th-sub">LONG</th>
              </tr>
              <tr>
                <th class="dossier-th-sub text-emerald-600">✅</th>
                <th class="dossier-th-sub text-rose-600">❎</th>
                <th class="dossier-th-sub text-emerald-600">✅</th>
                <th class="dossier-th-sub text-rose-600">❎</th>
                <th class="dossier-th-sub text-emerald-600">✅</th>
                <th class="dossier-th-sub text-rose-600">❎</th>
                <th class="dossier-th-sub text-emerald-600">✅</th>
                <th class="dossier-th-sub text-rose-600">❎</th>
                <th class="dossier-th-sub text-emerald-600">✅</th>
                <th class="dossier-th-sub text-rose-600">❎</th>
                <th class="dossier-th-sub text-emerald-600">✅</th>
                <th class="dossier-th-sub text-rose-600">❎</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="dossier-td-title">DISTRIBUTION</td>
                <td class="dossier-td-val font-bold text-emerald-700">{stat.handShortSuccess || 0}</td>
                <td class="dossier-td-val font-bold text-rose-700">{stat.handShortFail || 0}</td>
                <td class="dossier-td-val font-bold text-emerald-700">{stat.handMidSuccess || 0}</td>
                <td class="dossier-td-val font-bold text-rose-700">{stat.handMidFail || 0}</td>
                <td class="dossier-td-val font-bold text-emerald-700">{stat.handLongSuccess || 0}</td>
                <td class="dossier-td-val font-bold text-rose-700">{stat.handLongFail || 0}</td>
                <td class="dossier-td-val font-bold text-emerald-700">{stat.feetShortSuccess || 0}</td>
                <td class="dossier-td-val font-bold text-rose-700">{stat.feetShortFail || 0}</td>
                <td class="dossier-td-val font-bold text-emerald-700">{stat.feetMidSuccess || 0}</td>
                <td class="dossier-td-val font-bold text-rose-700">{stat.feetMidFail || 0}</td>
                <td class="dossier-td-val font-bold text-emerald-700">{stat.feetLongSuccess || 0}</td>
                <td class="dossier-td-val font-bold text-rose-700">{stat.feetLongFail || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table 2: SHOOTING -->
        <div class="dossier-table-wrap">
          <table class="dossier-table">
            <thead>
              <tr>
                <th rowspan="2" class="dossier-th-action">GK Actions</th>
                <th colspan="3" class="dossier-th-silver">MATCH</th>
              </tr>
              <tr>
                <th class="dossier-th-sub">OPEN PLAY</th>
                <th class="dossier-th-sub">DROP KICK</th>
                <th class="dossier-th-sub">SET PLAY</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="dossier-td-title">SHOOTING</td>
                <td class="dossier-td-val">{stat.shootingOpenPlay || 0}</td>
                <td class="dossier-td-val">{stat.shootingDropKick || 0}</td>
                <td class="dossier-td-val">{stat.shootingSetPlay || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table 3: ASSIST -->
        <div class="dossier-table-wrap">
          <table class="dossier-table">
            <thead>
              <tr>
                <th rowspan="2" class="dossier-th-action">GK Actions</th>
                <th colspan="2" class="dossier-th-silver">MATCH</th>
              </tr>
              <tr>
                <th class="dossier-th-sub">THROWING</th>
                <th class="dossier-th-sub">PASSING</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="dossier-td-title">ASISST</td>
                <td class="dossier-td-val">{stat.assistThrowing || 0}</td>
                <td class="dossier-td-val">{stat.assistPassing || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PAGE 3 PREVIEW CONTAINER -->
      <div class="dossier-sheet-card">
        <div class="sheet-indicator">HALAMAN 3: CONCEDED AREA & EVALUASI POSISI</div>
        
        <div class="dossier-header-row">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="dossier-pill-green">{stat.playerName}</span>
            <span class="dossier-vs-text">VS</span>
            <span class="dossier-pill-green">{matchStore.data?.match.awayTeam || 'OPPONENT'}</span>
            <span class="dossier-pill-green">{matchStore.data?.match.competition || 'PRO FUTSAL LEAGUE 5'}</span>
          </div>
          <div class="flex items-center justify-end">
            <img src={matchStore.currentTeamLogo || '/icon.png'} alt="Logo" class="dossier-logo-img" />
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-4">
          <!-- Conceded Area Pitch -->
          <div class="flex flex-col items-center">
            <span class="dossier-pill-blue">Conceded area</span>
            <div class="pitch-canvas-anchor my-2">
              <img 
                src={GK_AREA_CONCEDED_IMAGE_DATA_URI} 
                alt="Conceded Area Diagram" 
                class="max-h-[250px] w-auto max-w-full object-contain border border-black rounded bg-white block" 
              />
              {#each integratedConcededGoals as cg, idx}
                {@const pin = getGoalPinCoordinates(cg, idx)}
                <div 
                  class="conceded-goal-pin print-pin"
                  style="left: {pin.x}%; top: {pin.y}%;"
                >
                  <span class="pin-number">{idx + 1}</span>
                </div>
              {/each}
            </div>
            <div class="text-xs font-bold text-zinc-900 w-full mt-1">
              <div class="font-extrabold uppercase mb-1">CONCEDED :</div>
              {#if integratedConcededGoals.length === 0}
                <div>Clean Sheet (0 Kebobolan)</div>
              {:else}
                {#each integratedConcededGoals as cg, idx}
                  <div style="margin-bottom: 2px;">Gol {idx + 1} ({cg.note || 'lower shooting'} - Menit {cg.minute || '-'})</div>
                {/each}
              {/if}
              <div class="italic text-[11px] text-zinc-600 mt-2">Note : LAST SHOOTER TO GOAL</div>
            </div>
          </div>

          <!-- Conceded Position Goal Target -->
          <div class="flex flex-col items-center">
            <span class="dossier-pill-blue">Conceded position</span>
            <div class="pitch-canvas-anchor my-2">
              <img 
                src={GK_CONCEDED_IMAGE_DATA_URI} 
                alt="Conceded Position Diagram" 
                class="max-h-[250px] w-auto max-w-full object-contain border border-black rounded bg-white block" 
              />
              {#each integratedConcededGoals as cg, idx}
                {@const pin = getGoalTargetPinCoordinates(cg, idx)}
                <div 
                  class="conceded-goal-pin print-pin purple"
                  style="left: {pin.x}%; top: {pin.y}%;"
                >
                  <span class="pin-number">{idx + 1}</span>
                </div>
              {/each}
            </div>
            <div class="italic text-xs font-bold text-zinc-900 mt-2 text-center">
              Note : LAST POSITION BALL AT SCORING
            </div>
          </div>

          <!-- Coaching Card Blue -->
          <div class="dossier-coach-card">
            <div class="dossier-coach-time">
              {stat.minutesPlayed || '40 minutes full match'}
            </div>
            <div class="font-extrabold text-sm tracking-wide mb-2">NOTE :</div>
            <div class="space-y-3 text-xs leading-relaxed">
              <div>
                <strong>1. SHOOTING ANTICIPATION</strong><br/>
                <span class="opacity-95">{stat.anticipationNotes || 'Antisipasi pergerakan tembakan lawan.'}</span>
              </div>
              <div>
                <strong>2. REBOUND</strong><br/>
                <span class="opacity-95">{stat.reboundNotes || 'Penguasaan bola kedua / second ball.'}</span>
              </div>
              <div>
                <strong>3. COVERING SECOND POST</strong><br/>
                <span class="opacity-95">{stat.secondPostNotes || 'Penjagaan tiang kedua dan komunikasi lini pertahanan.'}</span>
              </div>
              {#if stat.generalNotes}
                <div class="pt-2 border-t border-white/30">
                  <strong>KESIMPULAN:</strong><br/>
                  <span>{stat.generalNotes}</span>
                </div>
              {/if}
            </div>
          </div>
        </div>

      </div>

    </div>
  {/if}

  <!-- ==================================================== -->
  <!-- MODAL: ADD CONCEDED GOAL PLOT                        -->
  <!-- ==================================================== -->
  {#if showAddGoalModal}
    <div 
      class="tactical-modal-backdrop" 
      onclick={() => showAddGoalModal = false}
      onkeydown={(e) => { if (e.key === 'Escape') showAddGoalModal = false; }}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div 
        class="tactical-modal-card" 
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="document"
        tabindex="0"
      >
        <div class="tactical-modal-head">
          <div class="flex items-center gap-2.5">
            <div class="modal-icon-badge rose">
              <AlertTriangle class="w-4 h-4" />
            </div>
            <div>
              <h3 class="modal-title-text">Catat Gol Kebobolan Baru</h3>
              <p class="modal-subtitle-text">Tandai posisi penembak lawan & sasaran gawang</p>
            </div>
          </div>
          <button class="modal-close-icon-btn" onclick={() => showAddGoalModal = false}><X class="w-4 h-4" /></button>
        </div>

        <div class="tactical-modal-body">
          <!-- Babak & Menit -->
          <div class="grid grid-cols-2 gap-3">
            <div class="modal-field-group">
              <label for="goal-half" class="tactical-form-label">Babak Pertandingan</label>
              <select id="goal-half" bind:value={newGoalHalf} class="tactical-form-select">
                <option value={1}>Babak 1 (1st Half)</option>
                <option value={2}>Babak 2 (2nd Half)</option>
              </select>
            </div>
            <div class="modal-field-group">
              <label for="goal-minute" class="tactical-form-label">Menit Kejadian</label>
              <input id="goal-minute" type="text" bind:value={newGoalMinute} placeholder="cth. 14:20 atau 14'" class="tactical-form-input font-mono" />
            </div>
          </div>

          <!-- Zona Penembak & Arah Masuk -->
          <div class="grid grid-cols-2 gap-3">
            <div class="modal-field-group">
              <label for="goal-pitch-zone" class="tactical-form-label">Zona Lapangan (Pitch)</label>
              <select id="goal-pitch-zone" bind:value={newGoalPitchZone} class="tactical-form-select">
                {#each pitchZones as pz}
                  <option value={pz.id}>Zona {pz.id} - {pz.label}</option>
                {/each}
              </select>
            </div>
            <div class="modal-field-group">
              <label for="goal-target-zone" class="tactical-form-label">Arah Bola ke Gawang</label>
              <select id="goal-target-zone" bind:value={newGoalTargetZone} class="tactical-form-select">
                {#each goalTargetZones as gz}
                  <option value={gz.id}>Zona {gz.id} ({gz.title})</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Keterangan & Presets -->
          <div class="modal-field-group">
            <label for="goal-note" class="tactical-form-label">Tipe Gol / Pola Serangan Lawan</label>
            <input 
              id="goal-note"
              type="text" 
              bind:value={newGoalNote} 
              placeholder="cth. lower shooting, 2nd post tap-in, rebound..."
              class="tactical-form-input"
            />
            <div class="preset-chips-wrap">
              {#each ['lower shooting', 'second post', 'rebound', 'counter attack', 'upper corner', 'penalty', 'own goal'] as preset}
                <button 
                  type="button" 
                  class="preset-chip-btn {newGoalNote === preset ? 'active' : ''}"
                  onclick={() => newGoalNote = preset}
                >
                  {preset}
                </button>
              {/each}
            </div>
          </div>

          <!-- Pemain Lawan -->
          <div class="modal-field-group">
            <label for="goal-shooter" class="tactical-form-label">Pemain Lawan (Opsional)</label>
            <input 
              id="goal-shooter"
              type="text" 
              bind:value={newGoalShooter} 
              placeholder="Nama atau Nomor Punggung Lawan"
              class="tactical-form-input"
            />
          </div>
        </div>

        <div class="tactical-modal-foot">
          <button class="tactical-btn-ghost" onclick={() => showAddGoalModal = false}>Batal</button>
          <button class="tactical-btn-primary" onclick={handleAddGoal}>
            <Plus class="w-4 h-4" /> Simpan Gol
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ==================================================== -->
  <!-- MODAL: EDIT CONCEDED GOAL                            -->
  <!-- ==================================================== -->
  {#if showEditGoalModal && editingGoal}
    <div 
      class="tactical-modal-backdrop" 
      onclick={() => showEditGoalModal = false}
      onkeydown={(e) => { if (e.key === 'Escape') showEditGoalModal = false; }}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div 
        class="tactical-modal-card" 
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="document"
        tabindex="0"
      >
        <div class="tactical-modal-head edit-head">
          <div class="flex items-center gap-2.5">
            <div class="modal-icon-badge sky">
              <Pencil class="w-4 h-4" />
            </div>
            <div>
              <h3 class="modal-title-text">Edit Data Gol Kebobolan</h3>
              <p class="modal-subtitle-text">Perbarui menit, titik lapangan, dan target sasaran gawang</p>
            </div>
          </div>
          <button class="modal-close-icon-btn" onclick={() => showEditGoalModal = false}><X class="w-4 h-4" /></button>
        </div>

        <div class="tactical-modal-body">
          <!-- Babak & Menit -->
          <div class="grid grid-cols-2 gap-3">
            <div class="modal-field-group">
              <label for="edit-goal-half" class="tactical-form-label">Babak Pertandingan</label>
              <select id="edit-goal-half" bind:value={editingGoal.half} class="tactical-form-select">
                <option value={1}>Babak 1 (1st Half)</option>
                <option value={2}>Babak 2 (2nd Half)</option>
              </select>
            </div>
            <div class="modal-field-group">
              <label for="edit-goal-minute" class="tactical-form-label">Menit Kejadian</label>
              <input id="edit-goal-minute" type="text" bind:value={editingGoal.minute} placeholder="cth. 14:20 atau 14'" class="tactical-form-input font-mono" />
            </div>
          </div>

          <!-- Zona Penembak & Arah Masuk -->
          <div class="grid grid-cols-2 gap-3">
            <div class="modal-field-group">
              <label for="edit-goal-pitch-zone" class="tactical-form-label">Zona Lapangan (Pitch)</label>
              <select id="edit-goal-pitch-zone" bind:value={editingGoal.shooterZone} class="tactical-form-select">
                {#each pitchZones as pz}
                  <option value={pz.id}>Zona {pz.id} - {pz.label}</option>
                {/each}
              </select>
            </div>
            <div class="modal-field-group">
              <label for="edit-goal-target-zone" class="tactical-form-label">Arah Bola ke Gawang</label>
              <select id="edit-goal-target-zone" bind:value={editingGoal.goalZone} class="tactical-form-select">
                {#each goalTargetZones as gz}
                  <option value={gz.id}>Zona {gz.id} ({gz.title})</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Keterangan & Presets -->
          <div class="modal-field-group">
            <label for="edit-goal-note" class="tactical-form-label">Tipe Gol / Pola Serangan Lawan</label>
            <input 
              id="edit-goal-note"
              type="text" 
              bind:value={editingGoal.note} 
              placeholder="cth. lower shooting, 2nd post tap-in, rebound..."
              class="tactical-form-input"
            />
            <div class="preset-chips-wrap">
              {#each ['lower shooting', 'second post', 'rebound', 'counter attack', 'upper corner', 'penalty', 'own goal'] as preset}
                <button 
                  type="button" 
                  class="preset-chip-btn {editingGoal.note === preset ? 'active' : ''}"
                  onclick={() => { if (editingGoal) editingGoal.note = preset; }}
                >
                  {preset}
                </button>
              {/each}
            </div>
          </div>

          <!-- Pemain Lawan -->
          <div class="modal-field-group">
            <label for="edit-goal-shooter" class="tactical-form-label">Pemain Lawan (Opsional)</label>
            <input 
              id="edit-goal-shooter"
              type="text" 
              bind:value={editingGoal.shooterPlayer} 
              placeholder="Nama atau Nomor Punggung Lawan"
              class="tactical-form-input"
            />
          </div>
        </div>

        <div class="tactical-modal-foot flex items-center justify-between">
          <button 
            class="tactical-btn-danger"
            onclick={() => { if (editingGoal) handleDeleteGoal(editingGoal.id); }}
            title="Hapus gol ini dari statistik"
          >
            <Trash2 class="w-3.5 h-3.5" /> Hapus Gol Ini
          </button>
          <div class="flex items-center gap-2">
            <button class="tactical-btn-ghost" onclick={() => showEditGoalModal = false}>Batal</button>
            <button class="tactical-btn-primary" onclick={handleSaveEditedGoal}>
              <Check class="w-4 h-4" /> Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* ==================================================== */
  /* BASE CONTAINER & THEME                               */
  /* ==================================================== */
  .gk-dashboard-container {
    width: 100%;
    max-width: 1380px;
    margin: 0 auto;
    padding: 0.75rem 1rem 2.5rem 1rem;
    color: #f1f5f9;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  /* ==================================================== */
  /* TOP HEADER CARD                                      */
  /* ==================================================== */
  .gk-top-header {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85));
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.85rem;
    padding: 1rem 1.25rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    margin-bottom: 1.25rem;
  }

  .header-main-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .gk-badge-avatar {
    width: 3.25rem;
    height: 3.25rem;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%);
    border: 2px solid rgba(16, 185, 129, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
  }

  .gk-no {
    position: absolute;
    top: -0.35rem;
    right: -0.35rem;
    background: #10b981;
    color: #0f172a;
    font-size: 0.65rem;
    font-weight: 900;
    padding: 0.1rem 0.35rem;
    border-radius: 9999px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }

  .gk-title-name {
    font-size: 1.25rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.02em;
    margin: 0;
  }

  .role-badge {
    font-size: 0.65rem;
    font-weight: 800;
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.4);
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    letter-spacing: 0.05em;
  }

  .vs-badge {
    font-size: 0.75rem;
    font-weight: 700;
    color: #94a3b8;
  }

  .meta-sub-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #64748b;
  }

  .comp-tag {
    color: #38bdf8;
    font-weight: 600;
  }

  .dot {
    color: #475569;
  }

  .time-edit-wrap {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.15rem 0.5rem;
    border-radius: 0.35rem;
  }

  .minutes-input {
    background: transparent;
    border: none;
    outline: none;
    color: #cbd5e1;
    font-size: 0.75rem;
    font-weight: 600;
    width: 140px;
  }

  /* Header action block */
  .header-action-block {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .gk-picker {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #94a3b8;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.6rem;
    border-radius: 0.5rem;
  }

  .gk-picker-select {
    background: transparent;
    border: none;
    outline: none;
    color: #ffffff;
    font-weight: 700;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .gk-picker-select option {
    background: #0f172a;
    color: #ffffff;
  }

  .btn-print-pdf {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #34d399;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.45rem 0.85rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-print-pdf:hover {
    background: rgba(16, 185, 129, 0.3);
    border-color: #10b981;
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
  }

  .btn-print-pdf.glow {
    background: #059669;
    color: #ffffff;
    border-color: #10b981;
  }

  /* Tab navigation buttons */
  .gk-tabs-nav {
    display: inline-flex;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.2rem;
    border-radius: 0.6rem;
    gap: 0.2rem;
  }

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.4rem 0.75rem;
    border-radius: 0.45rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
  }

  .tab-btn.tab-active {
    background: #0284c7;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
  }

  /* ==================================================== */
  /* KPI GRID                                             */
  /* ==================================================== */
  .kpi-grid-container {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  @media (min-width: 640px) {
    .kpi-grid-container {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1024px) {
    .kpi-grid-container {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .kpi-box {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.75rem;
    padding: 0.85rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .kpi-box:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .kpi-box.box-blue { border-left: 3px solid #38bdf8; }
  .kpi-box.box-emerald { border-left: 3px solid #34d399; }
  .kpi-box.box-amber { border-left: 3px solid #fbbf24; }
  .kpi-box.box-rose { border-left: 3px solid #f43f5e; }

  .kpi-icon-wrap {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .kpi-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .kpi-head {
    font-size: 0.65rem;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .kpi-num {
    font-size: 1.35rem;
    font-weight: 900;
    line-height: 1.2;
  }

  .kpi-subtext {
    font-size: 0.65rem;
    color: #64748b;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ==================================================== */
  /* SECTION DIVIDER BANNERS                              */
  /* ==================================================== */
  .section-divider-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.65rem 1rem;
    border-radius: 0.65rem;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .section-divider-banner.defence {
    border-left: 4px solid #f43f5e;
    background: linear-gradient(90deg, rgba(244, 63, 94, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%);
  }

  .section-divider-banner.attack {
    border-left: 4px solid #10b981;
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%);
  }

  .section-divider-banner.conceded {
    border-left: 4px solid #06b6d4;
    background: linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%);
  }

  .section-divider-title {
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .section-divider-badge {
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* ==================================================== */
  /* PANEL CARDS & SECTIONS                               */
  /* ==================================================== */
  .panel-card {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  }

  .panel-card-head {
    background: rgba(30, 41, 59, 0.5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.75rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-heading {
    font-size: 0.85rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0;
  }

  .chip-label {
    font-size: 0.6rem;
    font-weight: 900;
    padding: 0.15rem 0.45rem;
    border-radius: 0.3rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .chip-label.chip-rose { background: rgba(244, 63, 94, 0.2); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.4); }
  .chip-label.chip-blue { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
  .chip-label.chip-emerald { background: rgba(52, 211, 153, 0.2); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.4); }
  .chip-label.chip-cyan { background: rgba(6, 182, 212, 0.2); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.4); }
  .chip-label.chip-amber { background: rgba(251, 191, 36, 0.2); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.4); }
  .chip-label.chip-purple { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); }

  .badge-total {
    font-size: 0.75rem;
    font-weight: 700;
  }

  /* LIVE INTEGRATION BADGE & PULSE */
  .live-integration-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.35);
    color: #34d399;
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.3rem 0.65rem;
    border-radius: 9999px;
  }

  .live-pulse-dot {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(0.95); opacity: 0.8; }
    50% { transform: scale(1.3); opacity: 1; }
    100% { transform: scale(0.95); opacity: 0.8; }
  }

  /* PITCH TACTICAL BREAKDOWN STRIP */
  .pitch-tactical-breakdown-strip {
    background: rgba(0, 0, 0, 0.35);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    padding: 0.6rem 1rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .strip-label {
    font-size: 0.62rem;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.05em;
  }

  .strip-chips-wrap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  .tactical-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.5rem;
    border-radius: 0.35rem;
    font-size: 0.68rem;
    font-weight: 700;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .tactical-chip.target { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-color: rgba(56, 189, 248, 0.35); }
  .tactical-chip.goal { background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.35); }
  .tactical-chip.out { background: rgba(244, 63, 94, 0.12); color: #fb7185; border-color: rgba(244, 63, 94, 0.3); }
  .tactical-chip.reject { background: rgba(251, 191, 36, 0.15); color: #fbbf24; border-color: rgba(251, 191, 36, 0.35); }
  .tactical-chip.post { background: rgba(168, 85, 247, 0.15); color: #c084fc; border-color: rgba(168, 85, 247, 0.35); }

  .chip-icon {
    font-size: 0.75rem;
    font-weight: 900;
  }

  .live-val-pill {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 3.5rem;
  }

  .live-number {
    font-size: 1.15rem;
    font-weight: 900;
    line-height: 1;
  }

  .live-sub {
    font-size: 0.55rem;
    color: #64748b;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ENTERPRISE HORIZONTAL DATA TABLE */
  .enterprise-table-wrap {
    width: 100%;
    overflow-x: auto;
  }

  .enterprise-data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
    text-align: left;
  }

  .enterprise-data-table th {
    background: rgba(15, 23, 42, 0.6);
    color: #94a3b8;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    text-transform: uppercase;
  }

  .enterprise-data-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    vertical-align: middle;
  }

  .enterprise-data-table tbody tr {
    transition: background 0.15s ease;
  }

  .enterprise-data-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .period-title-cell {
    font-size: 0.8rem;
  }

  .period-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .period-dot.dot-h1 { background: #38bdf8; box-shadow: 0 0 6px rgba(56, 189, 248, 0.6); }
  .period-dot.dot-h2 { background: #a855f7; box-shadow: 0 0 6px rgba(168, 85, 247, 0.6); }

  .stepper-inline {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.15rem 0.35rem;
    border-radius: 0.45rem;
  }

  .accuracy-badge {
    display: inline-block;
    font-weight: 800;
    font-size: 0.8rem;
    padding: 0.15rem 0.5rem;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 0.35rem;
    border: 1px solid rgba(16, 185, 129, 0.25);
  }

  .summary-row {
    background: rgba(30, 41, 59, 0.7);
    border-top: 2px solid rgba(255, 255, 255, 0.12);
  }

  .summary-row td {
    padding: 0.85rem 1rem;
  }

  /* HORIZONTAL ZONE CARDS (COVERING) */
  /* GK MATRIX HORIZONTAL TABLES (IMAGE 3 DRAFT STANDARD) */
  .gk-matrix-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .gk-matrix-table th, 
  .gk-matrix-table td {
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.65rem 0.75rem;
  }

  .gk-matrix-table thead th {
    background: #1e293b;
    color: #e2e8f0;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-align: center;
    vertical-align: middle;
  }

  .gk-matrix-table thead th.matrix-head-main {
    background: #334155;
    color: #f8fafc;
    font-size: 0.82rem;
    font-weight: 900;
    font-style: italic;
    width: 18%;
    text-align: center;
    border-right: 2px solid rgba(255, 255, 255, 0.18);
  }

  .gk-matrix-table thead th.matrix-head-group {
    background: #475569;
    color: #ffffff;
    font-weight: 900;
    letter-spacing: 0.1em;
    padding: 0.5rem;
    font-size: 0.78rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .gk-matrix-table tbody td {
    background: rgba(15, 23, 42, 0.5);
    vertical-align: middle;
  }

  .gk-matrix-table tbody td.matrix-row-title {
    background: #1e293b;
    font-size: 0.85rem;
    font-weight: 900;
    font-style: italic;
    text-align: center;
    border-right: 2px solid rgba(255, 255, 255, 0.18);
    letter-spacing: 0.05em;
  }

  .gk-matrix-table .stepper-inline {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .gk-matrix-table .step-val {
    font-size: 1.05rem;
    font-weight: 900;
    min-width: 1.5rem;
    text-align: center;
  }


  /* ==================================================== */
  /* TAB 3: CONCEDED MAP STYLING                          */
  /* ==================================================== */
  .btn-add-goal-mini {
    display: inline-flex;
    align-items: center;
    background: #e11d48;
    color: #ffffff;
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.3rem 0.65rem;
    border-radius: 0.4rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-add-goal-mini:hover {
    background: #f43f5e;
  }

  /* ==================================================== */
  /* TAB 3: AUTHENTIC TACTICAL BOARD CANVAS (IMAGE 1)     */
  /* ==================================================== */
  /* ==================================================== */
  /* TAB 3: ENTERPRISE TACTICAL COMMAND BOARD             */
  /* ==================================================== */
  .tactical-board-canvas {
    background: linear-gradient(180deg, #0f172a 0%, #090e17 100%);
    color: #f8fafc;
    border-radius: 0.85rem;
    padding: 1.25rem;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(56, 189, 248, 0.2);
    width: 100%;
    margin-top: 0.5rem;
  }

  .tactical-board-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 0.85rem;
    margin-bottom: 1rem;
  }

  .tactical-pill-green {
    background: #10b981;
    color: #022c22;
    font-size: 0.85rem;
    font-weight: 900;
    padding: 0.3rem 0.85rem;
    border-radius: 0.35rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
    display: inline-flex;
    align-items: center;
  }

  .tactical-live-badge {
    background: rgba(56, 189, 248, 0.12);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.25);
    font-size: 0.68rem;
    font-weight: 800;
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
  }

  .tactical-club-logo {
    height: 38px;
    width: 38px;
    object-fit: contain;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
  }

  .tactical-board-top-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    align-items: stretch;
  }

  @media (min-width: 1024px) {
    .tactical-board-top-grid {
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
  }

  .tactical-col {
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.85rem;
    padding: 1.15rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  }

  .tactical-pill-blue {
    background: #0284c7;
    color: #ffffff;
    font-size: 0.8rem;
    font-weight: 900;
    padding: 0.3rem 0.8rem;
    border-radius: 0.4rem;
    border: 1px solid #38bdf8;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
    display: inline-block;
  }

  .tactical-image-frame {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #000000;
    padding: 0.6rem;
    border-radius: 0.6rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    min-height: 340px;
    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.8);
  }

  .pitch-interactive-wrapper {
    cursor: crosshair;
    user-select: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .pitch-interactive-wrapper:hover,
  .goal-interactive-wrapper:hover {
    border-color: rgba(56, 189, 248, 0.4);
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.15), inset 0 2px 10px rgba(0, 0, 0, 0.8);
  }

  .goal-interactive-wrapper {
    cursor: crosshair;
    user-select: none;
  }

  .pitch-canvas-anchor {
    position: relative;
    display: inline-block;
    max-width: 100%;
  }

  .tactical-pitch-img {
    max-height: 330px;
    width: auto;
    max-width: 100%;
    object-fit: contain;
    border: 1px solid #334155;
    border-radius: 0.35rem;
    background: #ffffff;
    display: block;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  .tactical-goal-img {
    max-height: 330px;
    width: auto;
    max-width: 100%;
    object-fit: contain;
    border: 1px solid #334155;
    border-radius: 0.35rem;
    background: #ffffff;
    display: block;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  /* NUMBERED BLUE GOAL PINS */
  .conceded-goal-pin {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 28px;
    background: #00b0ff;
    border: 2px solid #000000;
    box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8);
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .conceded-goal-pin:hover {
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.9);
    z-index: 30;
    background: #38bdf8;
  }

  .conceded-goal-pin.print-pin {
    width: 18px;
    height: 22px;
    box-shadow: 1px 1px 0px rgba(0, 0, 0, 0.5);
  }

  .conceded-goal-pin.print-pin .pin-number {
    font-size: 0.75rem;
  }

  .pin-number {
    font-size: 0.95rem;
    font-weight: 900;
    color: #000000;
    line-height: 1;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .pin-tooltip {
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background: #0f172a;
    color: #ffffff;
    border: 1px solid #38bdf8;
    border-radius: 0.4rem;
    padding: 0.4rem 0.65rem;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: all 0.2s ease;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    z-index: 40;
  }

  .conceded-goal-pin:hover .pin-tooltip {
    opacity: 1;
    visibility: visible;
    bottom: 135%;
    pointer-events: auto;
  }

  .pin-tooltip-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.25rem;
    padding-top: 0.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }

  .pin-act-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.62rem;
    font-weight: 800;
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s ease;
  }

  .pin-act-btn.edit {
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
    border-color: rgba(56, 189, 248, 0.4);
  }

  .pin-act-btn.edit:hover {
    background: #38bdf8;
    color: #000000;
  }

  .pin-act-btn.del {
    background: rgba(244, 63, 94, 0.2);
    color: #f43f5e;
    border-color: rgba(244, 63, 94, 0.4);
  }

  .pin-act-btn.del:hover {
    background: #f43f5e;
    color: #ffffff;
  }

  .tactical-subnote {
    font-size: 0.68rem;
    font-weight: 700;
    color: #94a3b8;
    margin-top: 0.4rem;
    text-align: left;
    letter-spacing: 0.02em;
  }

  .tactical-conceded-box {
    margin-top: 0.5rem;
    padding: 0.55rem 0.75rem;
    background: rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 0.5rem;
  }

  .conceded-list-title {
    font-size: 0.75rem;
    font-weight: 900;
    color: #f43f5e;
  }

  .add-goal-mini-btn {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #38bdf8;
    font-size: 0.62rem;
    font-weight: 800;
    padding: 0.15rem 0.45rem;
    border-radius: 0.3rem;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .add-goal-mini-btn:hover {
    background: #38bdf8;
    color: #021324;
  }

  .conceded-line-item {
    font-size: 0.72rem;
    font-weight: 600;
    color: #cbd5e1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.2rem 0.35rem;
    border-radius: 0.3rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.03);
  }

  .conceded-line-item:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .badge-num-pill {
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 50%;
    background: #e11d48;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.62rem;
    font-weight: 900;
    flex-shrink: 0;
  }

  .edit-goal-btn {
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.25);
    cursor: pointer;
    padding: 0.2rem 0.35rem;
    display: flex;
    align-items: center;
    border-radius: 0.25rem;
    transition: all 0.15s ease;
  }

  .edit-goal-btn:hover {
    background: rgba(56, 189, 248, 0.3);
    border-color: #38bdf8;
  }

  .del-goal-btn {
    background: rgba(244, 63, 94, 0.12);
    border: 1px solid rgba(244, 63, 94, 0.25);
    cursor: pointer;
    padding: 0.2rem 0.35rem;
    display: flex;
    align-items: center;
    border-radius: 0.25rem;
    transition: all 0.15s ease;
  }

  .del-goal-btn:hover {
    background: rgba(244, 63, 94, 0.3);
    border-color: #f43f5e;
  }

  .tactical-quick-zones {
    margin-top: 0.5rem;
    padding: 0.45rem 0.6rem;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 0.4rem;
  }

  .quick-zones-label {
    font-size: 0.62rem;
    font-weight: 800;
    color: #94a3b8;
    margin-bottom: 0.3rem;
  }

  .tactical-zone-chip {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.2rem 0.45rem;
    border-radius: 0.3rem;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tactical-zone-chip:hover {
    background: rgba(56, 189, 248, 0.2);
    border-color: #38bdf8;
    color: #ffffff;
  }

  .tactical-zone-chip.active {
    background: rgba(225, 29, 72, 0.3);
    border-color: #f43f5e;
    color: #fda4af;
  }

  .chip-bubble {
    background: #e11d48;
    color: #ffffff;
    font-size: 0.55rem;
    font-weight: 900;
    padding: 0.05rem 0.25rem;
    border-radius: 9999px;
  }

  .chip-bubble.purple {
    background: #a855f7;
  }

  .tactical-subgrid-2col {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-top: 0.6rem;
    width: 100%;
  }

  @media (min-width: 640px) {
    .tactical-subgrid-2col {
      grid-template-columns: 1fr 1fr;
    }
  }

  .goal-target-zones-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
    margin-top: 0.4rem;
    width: 100%;
  }

  @media (max-width: 900px) {
    .goal-target-zones-row {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 550px) {
    .goal-target-zones-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .tactical-target-btn {
    background: rgba(30, 41, 59, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #cbd5e1;
    padding: 0.45rem 0.5rem;
    border-radius: 0.45rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    cursor: pointer;
    transition: all 0.15s ease;
    width: 100%;
    box-sizing: border-box;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  }

  .tactical-target-btn .target-title {
    font-size: 0.72rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .tactical-target-btn:hover {
    background: rgba(168, 85, 247, 0.25);
    border-color: #c084fc;
    color: #ffffff;
    transform: translateY(-1px);
  }

  .tactical-target-btn.active {
    background: rgba(168, 85, 247, 0.35);
    border-color: #c084fc;
    color: #f3e8ff;
    box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
  }

  .target-num {
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    background: #0284c7;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.68rem;
    font-weight: 900;
    flex-shrink: 0;
  }

  /* SIGNATURE SOLID BLUE NOTE CARD */
  .tactical-blue-card {
    background: linear-gradient(180deg, rgba(2, 132, 199, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%);
    border: 1px solid rgba(56, 189, 248, 0.3);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
    border-radius: 0.85rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
  }

  .blue-card-title {
    font-size: 1rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    color: #38bdf8;
  }

  .note-items-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .note-item-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .note-item-heading {
    font-size: 0.8rem;
    font-weight: 900;
    color: #7dd3fc;
    letter-spacing: 0.03em;
  }

  .blue-card-textarea {
    width: 100%;
    height: 70px;
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 0.5rem;
    color: #f8fafc;
    font-size: 0.8rem;
    font-weight: 500;
    line-height: 1.5;
    padding: 0.6rem 0.75rem;
    resize: vertical;
    outline: none;
    transition: all 0.2s ease;
  }

  .blue-card-textarea.wide {
    height: 100px;
    min-height: 80px;
    font-size: 0.82rem;
  }

  .blue-card-textarea:focus {
    border-color: #38bdf8;
    background: rgba(0, 0, 0, 0.75);
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
  }

  /* ==================================================== */
  /* TAB 4: DOSSIER 3-PAGE PREVIEW STYLING                */
  /* ==================================================== */
  .dossier-top-bar {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 0.75rem;
    padding: 0.75rem 1.25rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .dossier-sheet-card {
    background: #ffffff;
    color: #000000;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
    position: relative;
    max-width: 1100px;
    margin: 0 auto 2rem auto;
  }

  .sheet-indicator {
    display: inline-block;
    background: #0f172a;
    color: #38bdf8;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.2rem 0.6rem;
    border-radius: 0.35rem;
    margin-bottom: 1rem;
    letter-spacing: 0.05em;
  }

  .dossier-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .dossier-pill-green {
    background: #22c55e;
    color: #000000;
    font-weight: 800;
    font-size: 0.85rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    text-transform: uppercase;
  }

  .dossier-vs-text {
    font-weight: 800;
    font-size: 0.85rem;
    color: #000000;
  }

  .dossier-pill-cat {
    background: #ffffff;
    color: #64748b;
    border: 1.5px solid #94a3b8;
    font-weight: 800;
    font-size: 0.85rem;
    padding: 0.2rem 0.65rem;
    border-radius: 0.25rem;
    text-transform: uppercase;
  }

  .dossier-pill-blue {
    background: #0284c7;
    color: #ffffff;
    font-weight: 800;
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
    border-radius: 0.25rem;
    text-transform: uppercase;
  }

  .dossier-logo-img {
    width: 38px !important;
    height: 38px !important;
    max-width: 38px !important;
    max-height: 38px !important;
    object-fit: contain !important;
    display: block !important;
    flex-shrink: 0 !important;
  }

  .dossier-table-wrap {
    margin-bottom: 1.25rem;
    overflow-x: auto;
  }

  .dossier-table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
  }

  .dossier-table th, .dossier-table td {
    border: 1.5px solid #000000;
    padding: 0.45rem 0.35rem;
  }

  .dossier-th-silver {
    background: #b0b0b0;
    color: #000000;
    font-weight: 800;
    font-size: 0.75rem;
  }

  .dossier-th-sub {
    background: #c8c8c8;
    color: #000000;
    font-weight: 700;
    font-size: 0.7rem;
  }

  .dossier-th-action {
    background: #ffffff;
    font-style: italic;
    font-weight: 800;
    font-size: 0.8rem;
    width: 25%;
  }

  .dossier-td-title {
    font-weight: 900;
    font-size: 0.8rem;
    text-transform: uppercase;
    background: #ffffff;
    color: #000000;
  }

  .dossier-td-val {
    font-size: 0.85rem;
    font-weight: 800;
    color: #000000;
  }

  .dossier-coach-card {
    background: #0284c7;
    color: #ffffff;
    border-radius: 0.4rem;
    padding: 1rem;
    height: auto;
    min-height: 260px;
  }

  .dossier-coach-time {
    font-size: 0.9rem;
    font-weight: 800;
    border-bottom: 1.5px solid rgba(255, 255, 255, 0.4);
    padding-bottom: 0.5rem;
    margin-bottom: 0.75rem;
  }

  /* ==================================================== */
  /* PREMIUM TACTICAL MODAL DIALOG                        */
  /* ==================================================== */
  .tactical-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(4, 8, 16, 0.82);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
    animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .tactical-modal-card {
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 28, 0.98) 100%);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 0.85rem;
    width: 100%;
    max-width: 520px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.1);
    overflow: hidden;
    animation: modalCardScale 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes modalCardScale {
    from { opacity: 0; transform: scale(0.96) translateY(6px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .tactical-modal-head {
    background: linear-gradient(90deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.9rem 1.15rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tactical-modal-head.edit-head {
    background: linear-gradient(90deg, rgba(14, 116, 144, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%);
    border-bottom-color: rgba(56, 189, 248, 0.2);
  }

  .modal-icon-badge {
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .modal-icon-badge.rose {
    background: rgba(244, 63, 94, 0.15);
    color: #f43f5e;
    border: 1px solid rgba(244, 63, 94, 0.3);
  }

  .modal-icon-badge.sky {
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.3);
  }

  .modal-title-text {
    font-size: 0.92rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 0.02em;
    line-height: 1.2;
  }

  .modal-subtitle-text {
    font-size: 0.68rem;
    font-weight: 600;
    color: #94a3b8;
    margin-top: 0.1rem;
  }

  .modal-close-icon-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    width: 28px;
    height: 28px;
    border-radius: 0.35rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .modal-close-icon-btn:hover {
    background: rgba(244, 63, 94, 0.2);
    border-color: #f43f5e;
    color: #ffffff;
  }

  .tactical-modal-body {
    padding: 1.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .modal-field-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .tactical-form-label {
    font-size: 0.68rem;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .tactical-form-select,
  .tactical-form-input {
    width: 100%;
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 0.45rem;
    color: #f8fafc;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.5rem 0.7rem;
    outline: none;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .tactical-form-select:focus,
  .tactical-form-input:focus {
    border-color: #38bdf8;
    background: rgba(15, 23, 42, 0.95);
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
  }

  .preset-chips-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.35rem;
  }

  .preset-chip-btn {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(56, 189, 248, 0.2);
    color: #7dd3fc;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.22rem 0.55rem;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .preset-chip-btn:hover {
    background: rgba(56, 189, 248, 0.2);
    border-color: #38bdf8;
    color: #ffffff;
  }

  .preset-chip-btn.active {
    background: #0284c7;
    border-color: #38bdf8;
    color: #ffffff;
    box-shadow: 0 0 8px rgba(2, 132, 199, 0.4);
  }

  .tactical-modal-foot {
    background: rgba(15, 23, 42, 0.9);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.85rem 1.15rem;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.6rem;
  }

  .tactical-btn-ghost {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #cbd5e1;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.45rem 0.9rem;
    border-radius: 0.45rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tactical-btn-ghost:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .tactical-btn-primary {
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    border: 1px solid #38bdf8;
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 800;
    padding: 0.45rem 1.1rem;
    border-radius: 0.45rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(2, 132, 199, 0.35);
    transition: all 0.15s ease;
  }

  .tactical-btn-primary:hover {
    background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%);
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.5);
    transform: translateY(-1px);
  }

  .tactical-btn-danger {
    background: rgba(225, 29, 72, 0.15);
    border: 1px solid rgba(244, 63, 94, 0.35);
    color: #fda4af;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.45rem 0.85rem;
    border-radius: 0.45rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tactical-btn-danger:hover {
    background: rgba(225, 29, 72, 0.3);
    border-color: #f43f5e;
    color: #ffffff;
    box-shadow: 0 0 12px rgba(244, 63, 94, 0.3);
  }

  .tab-fade-in {
    animation: fadeIn 0.2s ease-in-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
