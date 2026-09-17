<script lang="ts">
  import { onMount } from 'svelte';
  import { matchStore } from '../lib/store.svelte';
  import { 
    MONCONGBULO_SERI_2_DATA, 
    buildSeriesDataFromWorkspaceAsync,
    importMoncongbuloMatchesIntoApp 
  } from '../lib/seriesData';
  import { 
    generatePptx, 
    type SeriesPresentationData, 
    type MatchTacticalDetail 
  } from '../lib/pptxExporter';
  import { 
    Presentation, 
    Download, 
    ChevronLeft, 
    ChevronRight, 
    Maximize2, 
    Minimize2, 
    Layers, 
    Trophy, 
    Flame, 
    Target, 
    ShieldAlert, 
    ShieldCheck, 
    Activity, 
    Sparkles, 
    CheckCircle2, 
    XCircle, 
    MinusCircle,
    FileSpreadsheet,
    Zap,
    RefreshCw,
    Plus,
    UploadCloud
  } from 'lucide-svelte';

  // Default to 'live_workspace' so user immediately sees their own inputted matches
  let dataSource = $state<'live_workspace' | 'preset_pfl'>('live_workspace');
  let currentSlide = $state<number>(1);
  let isFullscreen = $state<boolean>(false);
  let isExporting = $state<boolean>(false);
  let isImporting = $state<boolean>(false);
  let isLoadingData = $state<boolean>(false);
  let liveSeriesData = $state<SeriesPresentationData | null>(null);
  let presentationContainer: HTMLElement | null = null;

  // Active Presentation Data
  let seriesData = $derived<SeriesPresentationData>(
    dataSource === 'preset_pfl' 
      ? MONCONGBULO_SERI_2_DATA 
      : (liveSeriesData || MONCONGBULO_SERI_2_DATA)
  );

  let totalTacticalSlides = $derived(seriesData.tacticalMatches.length);
  let totalSlides = $derived(5 + totalTacticalSlides + 1);

  async function refreshLiveWorkspaceData() {
    isLoadingData = true;
    try {
      liveSeriesData = await buildSeriesDataFromWorkspaceAsync(matchStore.matchesList, matchStore.data);
    } catch (err) {
      console.error('Error compiling workspace series data:', err);
    } finally {
      isLoadingData = false;
    }
  }

  // Reactive auto-update whenever match data or matches list changes
  $effect(() => {
    // Read reactive properties from matchStore
    const _mid = matchStore.data?.match.id;
    const _scoreH = (matchStore.data?.match.homeScore1st || 0) + (matchStore.data?.match.homeScore2nd || 0);
    const _scoreA = (matchStore.data?.match.awayScore1st || 0) + (matchStore.data?.match.awayScore2nd || 0);
    const _playersLength = matchStore.data?.players?.length || 0;
    const _eventsLength = matchStore.data?.events?.length || 0;
    const _matchesLength = matchStore.matchesList.length;

    if (dataSource === 'live_workspace') {
      refreshLiveWorkspaceData();
    }
  });

  function nextSlide() {
    if (currentSlide < totalSlides) {
      currentSlide++;
    }
  }

  function prevSlide() {
    if (currentSlide > 1) {
      currentSlide--;
    }
  }

  function goToSlide(slideNum: number) {
    if (slideNum >= 1 && slideNum <= totalSlides) {
      currentSlide = slideNum;
    }
  }

  function toggleFullscreen() {
    if (!presentationContainer) return;
    if (!document.fullscreenElement) {
      presentationContainer.requestFullscreen().then(() => {
        isFullscreen = true;
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        isFullscreen = false;
      }).catch(() => {});
    }
  }

  async function handleExportPptx() {
    isExporting = true;
    try {
      await generatePptx(seriesData);
    } catch (err) {
      console.error('Failed to export PPTX:', err);
      alert('Gagal mengekspor PowerPoint: ' + (err as any)?.message);
    } finally {
      isExporting = false;
    }
  }

  async function handleImportPflToWorkspace() {
    if (!confirm('Import 11 Pertandingan Moncongbulo FC Seri 2 beserta seluruh pemain & data gol ke database aplikasi?')) {
      return;
    }
    isImporting = true;
    try {
      await importMoncongbuloMatchesIntoApp();
      await matchStore.loadMatchesList();
      await matchStore.loadMatch();
      dataSource = 'live_workspace';
      await refreshLiveWorkspaceData();
      alert('Berhasil mengimpor seluruh 11 laga Seri 2 ke dalam ruang kerja Anda!');
    } catch (err: any) {
      alert('Gagal mengimpor data: ' + err.message);
    } finally {
      isImporting = false;
    }
  }

  onMount(async () => {
    await matchStore.loadMatchesList();
    await refreshLiveWorkspaceData();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      } else if (e.key === 'Home') {
        currentSlide = 1;
      } else if (e.key === 'End') {
        currentSlide = totalSlides;
      }
    };

    const handleFsChange = () => {
      isFullscreen = !!document.fullscreenElement;
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  });
</script>

<div class="presentation-wrapper" bind:this={presentationContainer}>
  <!-- Top Control Bar -->
  <div class="deck-controls-bar no-print">
    <div class="ctrl-left">
      <div class="brand-pill">
        <Presentation size={18} class="text-emerald" />
        <span class="brand-title">SERIES TACTICAL DECK</span>
      </div>

      <!-- Dataset Selector Pill -->
      <div class="dataset-switcher">
        <button 
          class="ds-btn {dataSource === 'live_workspace' ? 'ds-active' : ''}" 
          onclick={() => { dataSource = 'live_workspace'; currentSlide = 1; refreshLiveWorkspaceData(); }}
          title="Data Real-Time dari Inputan Anda di Lembar Dokumen / Matrix">
          <Zap size={14} /> Data Inputan Anda ({seriesData.matches.length} Match)
        </button>
        <button 
          class="ds-btn {dataSource === 'preset_pfl' ? 'ds-active' : ''}" 
          onclick={() => { dataSource = 'preset_pfl'; currentSlide = 1; }}
          title="Lihat Contoh Data Resmi PFL 2023-2024 Seri 2 Moncongbulo FC">
          <Trophy size={14} /> Contoh Demo: PFL Seri 2
        </button>
      </div>

      {#if dataSource === 'preset_pfl'}
        <button 
          class="btn-import-pfl" 
          onclick={handleImportPflToWorkspace} 
          disabled={isImporting}
          title="Simpan 11 Laga Seri 2 ini ke Ruang Kerja Saya agar bisa diedit di Lembar Dokumen / Papan Taktik">
          <UploadCloud size={14} />
          <span>{isImporting ? 'Mengimpor...' : 'Terapkan ke Ruang Kerja'}</span>
        </button>
      {:else}
        <button 
          class="btn-refresh-live" 
          onclick={refreshLiveWorkspaceData} 
          disabled={isLoadingData}
          title="Klik untuk menyinkronkan ulang data dari lembar dokumen">
          <RefreshCw size={13} class={isLoadingData ? 'spin' : ''} />
          <span>{isLoadingData ? 'Sinkron...' : 'Sync Data Inputan'}</span>
        </button>
      {/if}
    </div>

    <!-- Slide Quick Nav & Export Button -->
    <div class="ctrl-right">
      <div class="slide-nav-group">
        <button class="nav-btn" onclick={prevSlide} disabled={currentSlide === 1} title="Slide Sebelumnya (Panah Kiri)">
          <ChevronLeft size={18} />
        </button>
        
        <select 
          class="slide-jump-select" 
          value={currentSlide} 
          onchange={(e) => goToSlide(Number(e.currentTarget.value))}>
          <option value={1}>Slide 1: Cover Presentasi</option>
          <option value={2}>Slide 2: Rekap Hasil Pertandingan</option>
          <option value={3}>Slide 3: Tabel Akumulasi Gol</option>
          <option value={4}>Slide 4: Tabel Akumulasi Assist</option>
          <option value={5}>Slide 5: Tabel Disiplin & Kartu</option>
          {#each seriesData.tacticalMatches as tm, idx}
            <option value={6 + idx}>
              Slide {6 + idx}: Taktikal vs {tm.opponent} ({tm.scoreHome}-{tm.scoreAway})
            </option>
          {/each}
          <option value={totalSlides}>Slide {totalSlides}: Evaluasi Taktikal & Kesimpulan</option>
        </select>

        <span class="slide-counter-badge">{currentSlide} / {totalSlides}</span>

        <button class="nav-btn" onclick={nextSlide} disabled={currentSlide === totalSlides} title="Slide Selanjutnya (Panah Kanan / Spasi)">
          <ChevronRight size={18} />
        </button>
      </div>

      <button class="action-btn fs-btn" onclick={toggleFullscreen} title="Layar Penuh (Fullscreen)">
        {#if isFullscreen}
          <Minimize2 size={16} />
        {:else}
          <Maximize2 size={16} />
        {/if}
      </button>

      <button 
        class="action-btn export-pptx-btn" 
        onclick={handleExportPptx} 
        disabled={isExporting}
        title="Download File PowerPoint (.pptx) Asli">
        <Download size={16} />
        <span>{isExporting ? 'Generating PPTX...' : 'Export PPTX'}</span>
      </button>
    </div>
  </div>

  <!-- Main Slide Viewport (16:9 Aspect Ratio Container) -->
  <div class="slide-stage-container">
    <div class="slide-canvas">
      
      <!-- ============================================================== -->
      <!-- SLIDE 1: COVER PRESENTASI -->
      <!-- ============================================================== -->
      {#if currentSlide === 1}
        <div class="slide-content slide-cover animate-fade">
          <div class="cover-glow"></div>
          <div class="cover-header-badge">
            <span class="competition-tag">{seriesData.competitionTitle}</span>
          </div>

          <div class="cover-center-content">
            <div class="logo-box">
              <img src="/logo.png" alt="Team Logo" class="team-lion-logo" />
            </div>
            <h1 class="cover-main-title">{seriesData.seriesTitle}</h1>
            <h2 class="cover-sub-title">LAPORAN EVALUASI TAKTIKAL & REKAPITULASI TIM</h2>
            <div class="cover-team-pill">
              <Trophy size={18} class="text-amber" />
              <span>{seriesData.teamName} • {seriesData.season}</span>
            </div>
          </div>

          <div class="cover-footer">
            <div class="footer-badge">
              <Sparkles size={14} class="text-emerald" />
              <span>FAHLEFI FUTSAL ANALYTICS • EXECUTIVE MATCH INTELLIGENCE</span>
            </div>
          </div>
        </div>

      <!-- ============================================================== -->
      <!-- SLIDE 2: HASIL REKAP PERTANDINGAN SERI -->
      <!-- ============================================================== -->
      {:else if currentSlide === 2}
        <div class="slide-content slide-table-view animate-fade">
          <div class="slide-head-row">
            <div>
              <span class="slide-tag">REKAPITULASI KOMPETISI</span>
              <h2 class="slide-title">HASIL PERTANDINGAN {seriesData.seriesTitle.toUpperCase()}</h2>
            </div>
            <div class="summary-pills">
              <div class="kpi-pill kpi-win"><span>Menang:</span> <strong>{seriesData.summary?.wins}</strong></div>
              <div class="kpi-pill kpi-draw"><span>Imbang:</span> <strong>{seriesData.summary?.draws}</strong></div>
              <div class="kpi-pill kpi-loss"><span>Kalah:</span> <strong>{seriesData.summary?.losses}</strong></div>
              <div class="kpi-pill kpi-gf"><span>GF / GA:</span> <strong>{seriesData.summary?.totalGF} / {seriesData.summary?.totalGA}</strong></div>
              <div class="kpi-pill kpi-pts"><span>Poin:</span> <strong>{seriesData.summary?.points}</strong></div>
            </div>
          </div>

          <div class="table-container glass-card">
            {#if seriesData.matches.length === 0}
              <div class="empty-state-panel">
                <MinusCircle size={32} class="text-muted" />
                <p>Belum ada data pertandingan di ruang kerja ini. Buat laga baru atau input skor pada Lembar Dokumen.</p>
              </div>
            {:else}
              <table class="series-table">
                <thead>
                  <tr>
                    <th class="text-center w-match">MATCH</th>
                    <th>TIM HOME</th>
                    <th class="text-center w-score">SKOR</th>
                    <th class="text-center w-score">SKOR</th>
                    <th>TIM AWAY</th>
                    <th class="text-center w-res">HASIL</th>
                  </tr>
                </thead>
                <tbody>
                  {#each seriesData.matches as m}
                    <tr class="row-hover">
                      <td class="text-center bold text-muted">M-{m.matchNo}</td>
                      <td class="bold text-white">{seriesData.teamName}</td>
                      <td class="text-center score-cell {m.result === 'W' ? 'text-emerald' : 'text-white'}">{m.scoreHome}</td>
                      <td class="text-center score-cell {m.result === 'L' ? 'text-red' : 'text-white'}">{m.scoreAway}</td>
                      <td class="bold text-white">{m.opponent}</td>
                      <td class="text-center">
                        {#if m.result === 'W'}
                          <span class="res-badge res-w">MENANG</span>
                        {:else if m.result === 'D'}
                          <span class="res-badge res-d">IMBANG</span>
                        {:else}
                          <span class="res-badge res-l">KALAH</span>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {/if}
          </div>
        </div>

      <!-- ============================================================== -->
      <!-- SLIDE 3: TABEL AKUMULASI GOL PEMAIN -->
      <!-- ============================================================== -->
      {:else if currentSlide === 3}
        <div class="slide-content slide-table-view animate-fade">
          <div class="slide-head-row">
            <div>
              <span class="slide-tag">STATISTIK INDIVIDU</span>
              <h2 class="slide-title">TABEL AKUMULASI GOL PEMAIN (PER MATCH)</h2>
            </div>
            <div class="summary-pills">
              <div class="kpi-pill kpi-gf">
                <Flame size={15} class="text-amber" />
                <span>Top Scorer:</span> <strong>{seriesData.summary?.topScorer}</strong>
              </div>
              <div class="kpi-pill kpi-pts"><span>Total Gol Tim:</span> <strong>{seriesData.summary?.totalGF} Gol</strong></div>
            </div>
          </div>

          <div class="table-container glass-card">
            {#if seriesData.players.length === 0}
              <div class="empty-state-panel">
                <MinusCircle size={32} class="text-muted" />
                <p>Belum ada daftar pemain. Tambahkan pemain di Lembar Dokumen atau Matrix Pemain.</p>
              </div>
            {:else}
              <table class="series-table matrix-table">
                <thead>
                  <tr>
                    <th class="text-center w-no">NO</th>
                    <th>NAMA PEMAIN</th>
                    {#each seriesData.matches as m}
                      <th class="text-center matrix-col">M{m.matchNo}</th>
                    {/each}
                    <th class="text-center w-total text-emerald">TOTAL GOL</th>
                  </tr>
                </thead>
                <tbody>
                  {#each [...seriesData.players].sort((a, b) => b.totalGoals - a.totalGoals) as p}
                    <tr class="row-hover {p.totalGoals > 0 ? 'highlight-row' : ''}">
                      <td class="text-center text-muted font-mono">#{p.no}</td>
                      <td class="bold {p.totalGoals > 0 ? 'text-white' : 'text-slate'}">{p.name}</td>
                      {#each seriesData.matches as m}
                        {@const g = p.goalsPerMatch[m.matchNo] || 0}
                        <td class="text-center font-mono {g > 0 ? 'cell-val-active' : 'cell-val-zero'}">
                          {g > 0 ? g : '-'}
                        </td>
                      {/each}
                      <td class="text-center bold font-mono total-cell {p.totalGoals > 0 ? 'text-emerald' : 'text-slate'}">
                        {p.totalGoals}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {/if}
          </div>
        </div>

      <!-- ============================================================== -->
      <!-- SLIDE 4: TABEL AKUMULASI ASSIST PEMAIN -->
      <!-- ============================================================== -->
      {:else if currentSlide === 4}
        <div class="slide-content slide-table-view animate-fade">
          <div class="slide-head-row">
            <div>
              <span class="slide-tag">STATISTIK INDIVIDU</span>
              <h2 class="slide-title">TABEL AKUMULASI ASSIST PEMAIN (PER MATCH)</h2>
            </div>
            <div class="summary-pills">
              <div class="kpi-pill kpi-draw">
                <Target size={15} class="text-cyan" />
                <span>Top Assist:</span> <strong>{seriesData.summary?.topAssist}</strong>
              </div>
            </div>
          </div>

          <div class="table-container glass-card">
            {#if seriesData.players.length === 0}
              <div class="empty-state-panel">
                <MinusCircle size={32} class="text-muted" />
                <p>Belum ada daftar pemain.</p>
              </div>
            {:else}
              <table class="series-table matrix-table">
                <thead>
                  <tr>
                    <th class="text-center w-no">NO</th>
                    <th>NAMA PEMAIN</th>
                    {#each seriesData.matches as m}
                      <th class="text-center matrix-col">M{m.matchNo}</th>
                    {/each}
                    <th class="text-center w-total text-cyan">TOTAL ASSIST</th>
                  </tr>
                </thead>
                <tbody>
                  {#each [...seriesData.players].sort((a, b) => b.totalAssists - a.totalAssists) as p}
                    <tr class="row-hover {p.totalAssists > 0 ? 'highlight-row' : ''}">
                      <td class="text-center text-muted font-mono">#{p.no}</td>
                      <td class="bold {p.totalAssists > 0 ? 'text-white' : 'text-slate'}">{p.name}</td>
                      {#each seriesData.matches as m}
                        {@const a = p.assistsPerMatch[m.matchNo] || 0}
                        <td class="text-center font-mono {a > 0 ? 'cell-val-cyan' : 'cell-val-zero'}">
                          {a > 0 ? a : '-'}
                        </td>
                      {/each}
                      <td class="text-center bold font-mono total-cell {p.totalAssists > 0 ? 'text-cyan' : 'text-slate'}">
                        {p.totalAssists}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {/if}
          </div>
        </div>

      <!-- ============================================================== -->
      <!-- SLIDE 5: TABEL KARTU & KEDISIPLINAN -->
      <!-- ============================================================== -->
      {:else if currentSlide === 5}
        <div class="slide-content slide-table-view animate-fade">
          <div class="slide-head-row">
            <div>
              <span class="slide-tag">KEDISIPLINAN & FAIR PLAY</span>
              <h2 class="slide-title">REKAPITULASI KARTU KUNING & MERAH (SERI)</h2>
            </div>
            <div class="summary-pills">
              <div class="kpi-pill kpi-loss">
                <ShieldAlert size={15} class="text-amber" />
                <span>Total Kartu Tim:</span> 
                <strong>
                  {seriesData.players.reduce((s, p) => s + p.yellowCards + p.redCards, 0)} Kartu
                </strong>
              </div>
            </div>
          </div>

          <div class="table-container glass-card">
            {#if seriesData.players.length === 0}
              <div class="empty-state-panel">
                <MinusCircle size={32} class="text-muted" />
                <p>Belum ada data pemain.</p>
              </div>
            {:else}
              <table class="series-table">
                <thead>
                  <tr>
                    <th class="text-center w-no">NO</th>
                    <th>NAMA PEMAIN</th>
                    <th class="text-center w-card">KARTU KUNING</th>
                    <th class="text-center w-card">KARTU MERAH</th>
                    <th class="text-center w-total">TOTAL KARTU</th>
                    <th class="text-center w-status">STATUS AKUMULASI</th>
                  </tr>
                </thead>
                <tbody>
                  {#each [...seriesData.players].sort((a, b) => (b.yellowCards + b.redCards * 3) - (a.yellowCards + a.redCards * 3)) as p}
                    {@const total = p.yellowCards + p.redCards}
                    <tr class="row-hover {total > 0 ? 'highlight-row' : ''}">
                      <td class="text-center text-muted font-mono">#{p.no}</td>
                      <td class="bold {total > 0 ? 'text-white' : 'text-slate'}">{p.name}</td>
                      <td class="text-center font-mono bold {p.yellowCards > 0 ? 'text-amber' : 'text-slate'}">
                        {p.yellowCards > 0 ? p.yellowCards : '-'}
                      </td>
                      <td class="text-center font-mono bold {p.redCards > 0 ? 'text-red' : 'text-slate'}">
                        {p.redCards > 0 ? p.redCards : '-'}
                      </td>
                      <td class="text-center font-mono bold {total > 0 ? 'text-white' : 'text-slate'}">
                        {total}
                      </td>
                      <td class="text-center">
                        {#if p.redCards >= 1}
                          <span class="status-pill status-danger">HUKUMAN MERAH</span>
                        {:else if p.yellowCards >= 5}
                          <span class="status-pill status-danger">AKUMULASI SANKSI (5 KK)</span>
                        {:else if p.yellowCards >= 3}
                          <span class="status-pill status-warning">RAWAN AKUMULASI (3 KK)</span>
                        {:else}
                          <span class="status-pill status-safe">AMAN</span>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {/if}
          </div>
        </div>

      <!-- ============================================================== -->
      <!-- SLIDES 6 s/d N: ANALISIS TAKTIKAL PER PERTANDINGAN -->
      <!-- ============================================================== -->
      {:else if currentSlide >= 6 && currentSlide < totalSlides}
        {@const matchIdx = currentSlide - 6}
        {@const tm = seriesData.tacticalMatches[matchIdx]}
        <div class="slide-content slide-tactical-view animate-fade">
          <div class="slide-head-row">
            <div>
              <span class="slide-tag">MATCH TACTICAL BREAKDOWN</span>
              <h2 class="slide-title">
                {seriesData.teamName.toUpperCase()} VS {tm.opponent.toUpperCase()}
              </h2>
            </div>
            <div class="match-res-box {tm.result === 'W' ? 'box-win' : tm.result === 'D' ? 'box-draw' : 'box-loss'}">
              <span class="m-score-title">HASIL PERTANDINGAN</span>
              <div class="m-score-val">{tm.scoreHome} - {tm.scoreAway}</div>
              <span class="m-res-label">{tm.result === 'W' ? 'MENANG' : tm.result === 'D' ? 'IMBANG' : 'KALAH'}</span>
            </div>
          </div>

          <div class="tactical-split-grid">
            <!-- Left Panel: ANALISA GOL -->
            <div class="tactical-panel panel-goal">
              <div class="panel-header header-goal">
                <div class="ph-left">
                  <Flame size={18} class="text-emerald" />
                  <h3>ANALISA GOL ({tm.goals.length} GOL)</h3>
                </div>
                <span class="count-badge badge-goal">PROSES SERANGAN</span>
              </div>

              <div class="tactical-card-list">
                {#if tm.goals.length === 0}
                  <div class="empty-state-panel">
                    <MinusCircle size={32} class="text-muted" />
                    <p>Tidak ada gol tercipta pada pertandingan ini.</p>
                  </div>
                {:else}
                  {#each tm.goals as g, gIdx}
                    <div class="event-card event-goal-card">
                      <div class="ec-top">
                        <div class="ec-scorer">
                          <span class="ec-num">GOL {gIdx + 1}</span>
                          <span class="ec-player-name">{g.scorer}</span>
                        </div>
                        <span class="ec-half-badge">BABAK {g.half}</span>
                      </div>
                      
                      <div class="ec-meta">
                        <div class="meta-row">
                          <span class="meta-lbl">Proses:</span>
                          <span class="meta-val meta-process-goal">{g.process}</span>
                        </div>
                        {#if g.assist}
                          <div class="meta-row">
                            <span class="meta-lbl">Assist:</span>
                            <span class="meta-val meta-assist">{g.assist}</span>
                          </div>
                        {/if}
                      </div>

                      <div class="ec-lineup">
                        <span class="lineup-lbl">Paket Outfield di Lapangan:</span>
                        <div class="lineup-pills">
                          {#if g.paketPlayers && g.paketPlayers.length > 0}
                            {#each g.paketPlayers as player}
                              <span class="p-pill">{player}</span>
                            {/each}
                          {:else}
                            <span class="text-muted text-xs">Standard Lineup</span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
            </div>

            <!-- Right Panel: ANALISA KEBOBOLAN -->
            <div class="tactical-panel panel-concede">
              <div class="panel-header header-concede">
                <div class="ph-left">
                  <ShieldAlert size={18} class="text-red" />
                  <h3>ANALISA KEBOBOLAN ({tm.conceded.length} GOL LAWAN)</h3>
                </div>
                <span class="count-badge badge-concede">TITIK RAWAN PERTAHANAN</span>
              </div>

              <div class="tactical-card-list">
                {#if tm.conceded.length === 0}
                  <div class="empty-state-panel empty-clean-sheet">
                    <ShieldCheck size={36} class="text-emerald" />
                    <h4>CLEAN SHEET!</h4>
                    <p>Pertahanan kokoh tanpa kebobolan sepanjang pertandingan.</p>
                  </div>
                {:else}
                  {#each tm.conceded as c, cIdx}
                    <div class="event-card event-concede-card">
                      <div class="ec-top">
                        <div class="ec-scorer">
                          <span class="ec-num-con">KEBOBOLAN {cIdx + 1}</span>
                          <span class="ec-con-proc">{c.process}</span>
                        </div>
                        <span class="ec-half-badge badge-red">BABAK {c.half}</span>
                      </div>

                      <div class="ec-lineup">
                        <span class="lineup-lbl">Paket Pemain Bertahan:</span>
                        <div class="lineup-pills">
                          {#if c.paketPlayers && c.paketPlayers.length > 0}
                            {#each c.paketPlayers as player}
                              <span class="p-pill p-pill-con">{player}</span>
                            {/each}
                          {:else}
                            <span class="text-muted text-xs">Standard Lineup</span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
            </div>
          </div>
        </div>

      <!-- ============================================================== -->
      <!-- SLIDE FINAL: KESIMPULAN & EVALUASI TAKTIKAL -->
      <!-- ============================================================== -->
      {:else if currentSlide === totalSlides}
        <div class="slide-content slide-summary-view animate-fade">
          <div class="slide-head-row">
            <div>
              <span class="slide-tag">EXECUTIVE SUMMARY</span>
              <h2 class="slide-title">EVALUASI TAKTIKAL & STRATEGI TIM</h2>
            </div>
            <div class="summary-pills">
              <div class="kpi-pill kpi-win"><span>Efektivitas Seri:</span> <strong>{Math.round(((seriesData.summary?.wins || 0) / (seriesData.summary?.totalMatches || 1)) * 100)}% Win</strong></div>
            </div>
          </div>

          <div class="summary-grid-cards">
            <!-- Strengths Card -->
            <div class="sum-card card-strength">
              <div class="sc-header">
                <Flame size={20} class="text-emerald" />
                <h3>Kekuatan Taktikal & Pola Serangan</h3>
              </div>
              <ul class="sum-bullets">
                <li>
                  <strong>Transisi Counter Attack Efektif:</strong> Kecepatan transisi dari flank dan pivot menjadi senjata utama menghasilkan peluang dan gol tim.
                </li>
                <li>
                  <strong>Variasi Set-Piece (Kick In & Corner Kick):</strong> Skema bola mati terbukti memecah kebuntuan menghadapi pertahanan rapat (low block).
                </li>
                <li>
                  <strong>Ketajaman Lini Depan:</strong> Kolektivitas gol tim dengan Top Scorer <em>{seriesData.summary?.topScorer}</em>.
                </li>
              </ul>
            </div>

            <!-- Vulnerabilities Card -->
            <div class="sum-card card-vulnerability">
              <div class="sc-header">
                <ShieldAlert size={20} class="text-red" />
                <h3>Area Evaluasi & Titik Lemah Bertahan</h3>
              </div>
              <ul class="sum-bullets">
                <li>
                  <strong>Transisi Bertahan:</strong> Rawan kebobolan saat bola hilang (turnover) di area serang tanpa covering anchor yang disiplin.
                </li>
                <li>
                  <strong>Antisipasi Restart Bola Mati:</strong> Perlunya konsistensi man-to-man marking pada situasi Kick-In dan Corner Kick lawan.
                </li>
                <li>
                  <strong>Eksekusi Power Play:</strong> Pematangan rotasi dan passing saat power play agar tidak rentan counter attack ke gawang kosong.
                </li>
              </ul>
            </div>
          </div>

          <div class="closing-banner glass-card">
            <div class="cb-left">
              <img src="/logo.png" alt="Logo" class="cb-logo" />
              <div>
                <h4>FAHLEFI FUTSAL ANALYTICS PLATFORM</h4>
                <p>Otomatisasi Laporan Pertandingan, Analisis Paket Lineup & Executive Presentation</p>
              </div>
            </div>
            <button class="export-banner-btn" onclick={handleExportPptx} disabled={isExporting}>
              <Download size={16} />
              <span>Download Full PowerPoint Presentation (.pptx)</span>
            </button>
          </div>
        </div>
      {/if}

    </div>
  </div>

  <!-- Bottom Navigation Thumbnails Bar -->
  <div class="slide-nav-strip no-print">
    <div class="strip-scroll">
      {#each Array(totalSlides) as _, sIdx}
        {@const sNum = sIdx + 1}
        <button 
          class="strip-thumb {currentSlide === sNum ? 'thumb-active' : ''}" 
          onclick={() => goToSlide(sNum)}
          title="Slide {sNum}">
          <span class="thumb-num">{sNum}</span>
          <span class="thumb-label">
            {#if sNum === 1}Cover
            {:else if sNum === 2}Rekap Hasil
            {:else if sNum === 3}Gol Pemain
            {:else if sNum === 4}Assist
            {:else if sNum === 5}Kartu Disiplin
            {:else if sNum < totalSlides}vs {seriesData.tacticalMatches[sNum - 6]?.opponent || 'Match'}
            {:else}Evaluasi
            {/if}
          </span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .presentation-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: calc(100vh - 70px);
    background: #070d1e;
    color: #f8fafc;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    user-select: none;
    overflow-x: hidden;
  }

  /* Control Bar */
  .deck-controls-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background: rgba(15, 23, 42, 0.85);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    z-index: 50;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .ctrl-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex-wrap: wrap;
  }

  .brand-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 800;
    font-size: 0.9rem;
    letter-spacing: 0.05em;
    color: #f1f5f9;
  }

  .dataset-switcher {
    display: flex;
    background: rgba(0, 0, 0, 0.4);
    padding: 3px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    gap: 4px;
  }

  .ds-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 4px 10px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #94a3b8;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ds-btn:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.05);
  }

  .ds-btn.ds-active {
    background: #10b981;
    color: #062419;
    font-weight: 700;
  }

  .btn-import-pfl {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.12);
    color: #34d399;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-import-pfl:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.25);
    color: #fff;
  }

  .btn-refresh-live {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(6, 182, 212, 0.4);
    background: rgba(6, 182, 212, 0.12);
    color: #38bdf8;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .ctrl-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .slide-nav-group {
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 2px 6px;
    gap: 6px;
  }

  .nav-btn {
    background: transparent;
    border: none;
    color: #cbd5e1;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.15s;
  }

  .nav-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .slide-jump-select {
    background: transparent;
    border: none;
    color: #f8fafc;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 4px 6px;
    cursor: pointer;
    outline: none;
    max-width: 220px;
  }

  .slide-jump-select option {
    background: #0f172a;
    color: #fff;
  }

  .slide-counter-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 700;
    color: #10b981;
    padding: 2px 6px;
    background: rgba(16, 185, 129, 0.12);
    border-radius: 4px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .fs-btn {
    background: rgba(255, 255, 255, 0.08);
    color: #cbd5e1;
  }

  .fs-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }

  .export-pptx-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .export-pptx-btn:hover:not(:disabled) {
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
    transform: translateY(-1px);
  }

  /* Slide Stage */
  .slide-stage-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
    background: radial-gradient(circle at center, #111c3a 0%, #060b18 100%);
  }

  .slide-canvas {
    width: 100%;
    max-width: 1200px;
    min-height: 600px;
    aspect-ratio: 16 / 9;
    background: #0b132b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .slide-content {
    flex: 1;
    padding: 2.2rem 2.5rem;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 2;
  }

  .animate-fade {
    animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Slide 1: Cover */
  .slide-cover {
    justify-content: space-between;
    align-items: center;
    text-align: center;
    background: radial-gradient(circle at center, #162447 0%, #0b132b 85%);
  }

  .cover-glow {
    position: absolute;
    width: 400px;
    height: 400px;
    background: rgba(16, 185, 129, 0.12);
    filter: blur(100px);
    border-radius: 50%;
    pointer-events: none;
  }

  .competition-tag {
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    color: #10b981;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 6px 18px;
    border-radius: 20px;
    display: inline-block;
  }

  .cover-center-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    margin: auto 0;
  }

  .team-lion-logo {
    width: 110px;
    height: 110px;
    object-fit: contain;
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5));
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    padding: 8px;
    border: 2px solid rgba(16, 185, 129, 0.4);
  }

  .cover-main-title {
    font-size: 2.3rem;
    font-weight: 900;
    letter-spacing: -0.02em;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  }

  .cover-sub-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: #94a3b8;
    margin: 0;
    letter-spacing: 0.05em;
  }

  .cover-team-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 6px 18px;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 700;
    color: #f8fafc;
    margin-top: 0.5rem;
  }

  .footer-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.08em;
  }

  /* Slide Tables */
  .slide-head-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 1.2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 0.8rem;
  }

  .slide-tag {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #10b981;
    text-transform: uppercase;
  }

  .slide-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0.2rem 0 0 0;
  }

  .summary-pills {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .kpi-pill {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .kpi-win { border-color: rgba(16, 185, 129, 0.4); color: #10b981; }
  .kpi-draw { border-color: rgba(56, 189, 248, 0.4); color: #38bdf8; }
  .kpi-loss { border-color: rgba(239, 68, 68, 0.4); color: #f87171; }
  .kpi-gf { border-color: rgba(245, 158, 11, 0.4); color: #f59e0b; }
  .kpi-pts { background: #10b981; color: #062419; font-weight: 800; border: none; }

  .glass-card {
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
  }

  .table-container {
    flex: 1;
    overflow-y: auto;
  }

  .series-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
  }

  .series-table th {
    background: #1e293b;
    color: #cbd5e1;
    font-weight: 700;
    padding: 8px 12px;
    text-align: left;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .series-table td {
    padding: 7px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .row-hover:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .highlight-row {
    background: rgba(16, 185, 129, 0.03);
  }

  .score-cell {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
    font-size: 0.95rem;
  }

  .res-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.05em;
  }

  .res-w { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); }
  .res-d { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); }
  .res-l { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); }

  .matrix-col {
    width: 36px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
  }

  .cell-val-active {
    color: #10b981;
    font-weight: 800;
    background: rgba(16, 185, 129, 0.1);
  }

  .cell-val-cyan {
    color: #06b6d4;
    font-weight: 800;
    background: rgba(6, 182, 212, 0.1);
  }

  .cell-val-zero {
    color: #475569;
  }

  .total-cell {
    font-size: 0.95rem;
    background: rgba(0, 0, 0, 0.2);
  }

  .status-pill {
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .status-safe { background: rgba(16, 185, 129, 0.15); color: #10b981; }
  .status-warning { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); }
  .status-danger { background: rgba(239, 68, 68, 0.25); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.5); }

  /* Tactical Split View */
  .match-res-box {
    text-align: right;
    padding: 6px 14px;
    border-radius: 10px;
    border: 1px solid;
  }

  .box-win { border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.1); }
  .box-draw { border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.1); }
  .box-loss { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.1); }

  .m-score-title { font-size: 0.65rem; color: #94a3b8; font-weight: 700; display: block; }
  .m-score-val { font-family: 'JetBrains Mono', monospace; font-size: 1.4rem; font-weight: 900; line-height: 1.1; }
  .m-res-label { font-size: 0.7rem; font-weight: 800; }

  .tactical-split-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    flex: 1;
    min-height: 0;
  }

  .tactical-panel {
    background: rgba(15, 23, 42, 0.7);
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-goal { border-top: 3px solid #10b981; }
  .panel-concede { border-top: 3px solid #ef4444; }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 1rem;
    background: rgba(30, 41, 59, 0.5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .ph-left {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 800;
    color: #f1f5f9;
  }

  .count-badge {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .badge-goal { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  .badge-concede { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

  .tactical-card-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .event-card {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 0.7rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .event-goal-card { border-left: 3px solid #10b981; }
  .event-concede-card { border-left: 3px solid #ef4444; }

  .ec-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ec-num {
    font-size: 0.68rem;
    font-weight: 800;
    background: #10b981;
    color: #062419;
    padding: 1px 6px;
    border-radius: 4px;
    margin-right: 0.4rem;
  }

  .ec-num-con {
    font-size: 0.68rem;
    font-weight: 800;
    background: #ef4444;
    color: #fff;
    padding: 1px 6px;
    border-radius: 4px;
    margin-right: 0.4rem;
  }

  .ec-player-name {
    font-weight: 800;
    font-size: 0.88rem;
    color: #ffffff;
  }

  .ec-con-proc {
    font-weight: 700;
    font-size: 0.82rem;
    color: #fca5a5;
  }

  .ec-half-badge {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    color: #cbd5e1;
  }

  .badge-red { background: rgba(239, 68, 68, 0.2); color: #f87171; }

  .ec-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
  }

  .meta-row { display: flex; gap: 0.3rem; }
  .meta-lbl { color: #94a3b8; }
  .meta-val { font-weight: 700; }
  .meta-process-goal { color: #38bdf8; }
  .meta-assist { color: #34d399; }

  .ec-lineup {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    border-top: 1px dashed rgba(255, 255, 255, 0.08);
    padding-top: 0.35rem;
  }

  .lineup-lbl {
    font-size: 0.68rem;
    color: #94a3b8;
    font-weight: 600;
  }

  .lineup-pills {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .p-pill {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 1px 6px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #a7f3d0;
    border-radius: 4px;
  }

  .p-pill-con {
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .empty-state-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: auto;
    text-align: center;
    color: #64748b;
    gap: 0.5rem;
    font-size: 0.8rem;
    padding: 2rem 0;
  }

  .empty-clean-sheet {
    color: #10b981;
  }

  .empty-clean-sheet h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
    color: #10b981;
  }

  /* Slide Summary */
  .summary-grid-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    flex: 1;
    margin-bottom: 1rem;
  }

  .sum-card {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .card-strength { border-top: 3px solid #10b981; }
  .card-vulnerability { border-top: 3px solid #ef4444; }

  .sc-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sc-header h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 800;
    color: #ffffff;
  }

  .sum-bullets {
    margin: 0;
    padding-left: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    font-size: 0.82rem;
    color: #cbd5e1;
    line-height: 1.45;
  }

  .sum-bullets strong {
    color: #f8fafc;
  }

  .closing-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.9rem 1.4rem;
  }

  .cb-left {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .cb-logo {
    width: 36px;
    height: 36px;
    border-radius: 50%;
  }

  .cb-left h4 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 800;
    color: #ffffff;
  }

  .cb-left p {
    margin: 0;
    font-size: 0.72rem;
    color: #94a3b8;
  }

  .export-banner-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  /* Bottom Thumbnail Strip */
  .slide-nav-strip {
    background: rgba(11, 19, 43, 0.95);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.6rem 1.2rem;
    overflow-x: auto;
  }

  .strip-scroll {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    min-width: max-content;
  }

  .strip-thumb {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 6px 12px;
    min-width: 80px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .strip-thumb:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .strip-thumb.thumb-active {
    background: rgba(16, 185, 129, 0.2);
    border-color: #10b981;
    transform: translateY(-2px);
  }

  .thumb-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 800;
    color: #10b981;
  }

  .thumb-label {
    font-size: 0.68rem;
    font-weight: 600;
    color: #94a3b8;
    white-space: nowrap;
  }

  .strip-thumb.thumb-active .thumb-label {
    color: #ffffff;
  }

  /* Utility classes */
  .text-white { color: #ffffff; }
  .text-muted { color: #94a3b8; }
  .text-slate { color: #64748b; }
  .text-emerald { color: #10b981; }
  .text-cyan { color: #06b6d4; }
  .text-amber { color: #f59e0b; }
  .text-red { color: #ef4444; }
  .text-center { text-align: center; }
  .bold { font-weight: 700; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }

  .w-match { width: 70px; }
  .w-no { width: 45px; }
  .w-score { width: 55px; }
  .w-res { width: 100px; }
  .w-card { width: 110px; }
  .w-total { width: 95px; }
  .w-status { width: 160px; }
  .text-xs { font-size: 0.7rem; }
</style>
