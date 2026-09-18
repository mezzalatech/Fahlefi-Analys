<script lang="ts">
  import { matchStore } from '../lib/store.svelte';
  import { 
    Video, 
    Play, 
    Pause, 
    RotateCcw, 
    FastForward, 
    Rewind, 
    Clock, 
    Sliders, 
    Upload, 
    Link2, 
    Flame, 
    Target, 
    ShieldAlert, 
    Users, 
    Check, 
    ExternalLink,
    Maximize2
  } from 'lucide-svelte';

  let videoSourceType = $state<'url' | 'youtube' | 'local'>('url');
  let inputVideoUrl = $state<string>('');
  let activeVideoUrl = $state<string>('');
  let localVideoFile = $state<File | null>(null);
  let localVideoBlobUrl = $state<string>('');
  let youtubeVideoId = $state<string>('');

  let videoElement = $state<HTMLVideoElement | null>(null);
  let isPlaying = $state<boolean>(false);
  let currentTime = $state<number>(0);
  let duration = $state<number>(0);
  let playbackRate = $state<number>(1.0);

  // Sync Offset: Detik pada video saat kick-off 1st Half (Timer 20:00) dimulai
  let kickOffOffsetSec = $state<number>(0);
  let selectedEventFilter = $state<'ALL' | 'GOALS' | 'SHOTS' | 'TURNOVERS' | 'SUBS'>('ALL');

  // Parse YouTube URL to Video ID
  function parseYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  function handleLoadVideo() {
    if (!inputVideoUrl.trim()) return;

    const ytId = parseYouTubeId(inputVideoUrl.trim());
    if (ytId) {
      videoSourceType = 'youtube';
      youtubeVideoId = ytId;
      activeVideoUrl = `https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=1`;
    } else {
      videoSourceType = 'url';
      activeVideoUrl = inputVideoUrl.trim();
    }
  }

  function handleLocalVideoUpload(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      localVideoFile = file;
      if (localVideoBlobUrl) {
        URL.revokeObjectURL(localVideoBlobUrl);
      }
      localVideoBlobUrl = URL.createObjectURL(file);
      videoSourceType = 'local';
      activeVideoUrl = localVideoBlobUrl;
    }
  }

  function togglePlay() {
    if (!videoElement) return;
    if (videoElement.paused) {
      videoElement.play();
      isPlaying = true;
    } else {
      videoElement.pause();
      isPlaying = false;
    }
  }

  function setSpeed(rate: number) {
    playbackRate = rate;
    if (videoElement) {
      videoElement.playbackRate = rate;
    }
  }

  function skipSeconds(seconds: number) {
    if (!videoElement) return;
    videoElement.currentTime = Math.max(0, Math.min(duration, videoElement.currentTime + seconds));
  }

  function convertMatchTimeToVideoSec(half: number, timeStr: string): number {
    // timeStr is MM:SS remaining in 20:00 half countdown
    const [m, s] = (timeStr || '20:00').split(':').map(Number);
    const min = isNaN(m) ? 20 : m;
    const sec = isNaN(s) ? 0 : s;

    // Elapsed match time in this half
    const elapsedInHalf = (20 * 60) - (min * 60 + sec);
    // If 2nd half, add approximate 20 mins + 5 mins half time
    const halfBase = half === 2 ? (25 * 60) : 0;

    return Math.max(0, kickOffOffsetSec + halfBase + elapsedInHalf);
  }

  function jumpToEvent(half: number, timeStr: string) {
    const targetSec = convertMatchTimeToVideoSec(half, timeStr);
    if (videoSourceType === 'youtube' && youtubeVideoId) {
      // YouTube embed with start time
      activeVideoUrl = `https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&autoplay=1&start=${Math.floor(targetSec)}`;
    } else if (videoElement) {
      videoElement.currentTime = targetSec;
      videoElement.play();
      isPlaying = true;
    }
  }

  function formatSec(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Filtered event stream for video sync
  let syncedEvents = $derived(() => {
    if (!matchStore.data) return [];
    const events = matchStore.data.events || [];
    const subs = matchStore.substitutions || [];

    const list: Array<{
      id: string;
      half: number;
      timeStr: string;
      title: string;
      type: 'goal' | 'shot' | 'turnover' | 'foul' | 'sub';
      category: string;
      detail: string;
      badgeClass: string;
    }> = [];

    events.forEach(e => {
      let isGoal = e.type === 'shot' && e.outcome === 'goal';
      let isShot = e.type === 'shot' && e.outcome !== 'goal';
      let isTurnover = e.type === 'loss' || e.type === 'recover';
      let isFoul = e.type === 'foul';

      if (selectedEventFilter === 'GOALS' && !isGoal) return;
      if (selectedEventFilter === 'SHOTS' && !isShot) return;
      if (selectedEventFilter === 'TURNOVERS' && !isTurnover) return;
      if (selectedEventFilter === 'SUBS') return;

      let title = '';
      let badgeClass = '';

      if (isGoal) {
        title = `⚽ GOL #${e.playerNo || ''}`;
        badgeClass = 'badge-goal';
      } else if (isShot) {
        title = `🎯 Shot (${e.outcome})`;
        badgeClass = 'badge-shot';
      } else if (e.type === 'loss') {
        title = `⚠️ Loss Ball #${e.playerNo || ''}`;
        badgeClass = 'badge-loss';
      } else if (e.type === 'recover') {
        title = `🛡️ Recovery #${e.playerNo || ''}`;
        badgeClass = 'badge-rec';
      } else if (isFoul) {
        title = `🚩 Foul #${e.playerNo || ''}`;
        badgeClass = 'badge-foul';
      }

      list.push({
        id: e.id,
        half: e.half,
        timeStr: e.timeStr,
        title,
        type: isGoal ? 'goal' : isShot ? 'shot' : isTurnover ? 'turnover' : 'foul',
        category: e.team === 'home' ? 'HOME' : 'AWAY',
        detail: e.note || `Koordinat (${Math.round(e.x)}, ${Math.round(e.y)})`,
        badgeClass
      });
    });

    if (selectedEventFilter === 'ALL' || selectedEventFilter === 'SUBS') {
      subs.forEach(s => {
        list.push({
          id: s.id,
          half: s.half,
          timeStr: s.timeStr,
          title: `🔄 Rotasi Paket ${s.paketIndex !== null ? s.paketIndex + 1 : ''}`,
          type: 'sub',
          category: 'ROTASI',
          detail: s.note || `Paket 5-man deploy`,
          badgeClass: 'badge-sub'
        });
      });
    }

    return list.sort((a, b) => {
      if (a.half !== b.half) return a.half - b.half;
      return a.timeStr.localeCompare(b.timeStr);
    });
  });
</script>

<div class="video-analysis-wrapper">
  <!-- Top Bar: Video Source & Kickoff Offset Calibration -->
  <div class="video-topbar">
    <div class="source-inputs-group">
      <div class="input-url-box">
        <Link2 size={16} class="text-cyan" />
        <input 
          type="text" 
          placeholder="Paste URL YouTube (e.g. youtube.com/watch?v=...) atau Link MP4..." 
          bind:value={inputVideoUrl}
          onkeydown={(e) => e.key === 'Enter' && handleLoadVideo()}
        />
        <button class="btn-load-url" onclick={handleLoadVideo}>
          Muat Video
        </button>
      </div>

      <label class="btn-upload-local">
        <Upload size={15} /> Upload File MP4
        <input type="file" accept="video/mp4,video/webm,video/quicktime" onchange={handleLocalVideoUpload} style="display: none;" />
      </label>
    </div>

    <!-- Kickoff Sync Calibration -->
    <div class="kickoff-sync-box">
      <Sliders size={15} class="text-emerald" />
      <span class="sync-label">Kickoff Sync:</span>
      <input 
        type="number" 
        min="0" 
        step="1" 
        bind:value={kickOffOffsetSec} 
        class="input-offset-sec"
      />
      <span class="sync-unit">detik video</span>
    </div>
  </div>

  <!-- Main Player & Event Timeline Grid -->
  <div class="video-workspace-grid">
    <!-- LEFT: Video Player Display -->
    <div class="video-screen-container">
      {#if activeVideoUrl}
        {#if videoSourceType === 'youtube'}
          <div class="iframe-container">
            <iframe 
              src={activeVideoUrl} 
              title="Match Video" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>
        {:else}
          <div class="html5-video-box">
            <!-- svelte-ignore a11y_media_has_caption -->
            <video 
              bind:this={videoElement}
              src={activeVideoUrl}
              ontimeupdate={() => { if (videoElement) currentTime = videoElement.currentTime; }}
              onloadedmetadata={() => { if (videoElement) duration = videoElement.duration; }}
              onplay={() => (isPlaying = true)}
              onpause={() => (isPlaying = false)}
              class="active-video-element">
            </video>

            <!-- Custom Video Controls Overlay -->
            <div class="video-controls-overlay">
              <div class="scrub-bar-container">
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 100} 
                  value={currentTime} 
                  oninput={(e) => {
                    const val = Number((e.target as HTMLInputElement).value);
                    if (videoElement) videoElement.currentTime = val;
                  }}
                  class="video-scrubber"
                />
              </div>

              <div class="controls-action-row">
                <div class="left-ctrls">
                  <button class="btn-ctrl" onclick={togglePlay}>
                    {#if isPlaying}<Pause size={18} />{:else}<Play size={18} />{/if}
                  </button>
                  <button class="btn-ctrl" onclick={() => skipSeconds(-5)} title="Mundur 5 detik">
                    <Rewind size={16} />
                  </button>
                  <button class="btn-ctrl" onclick={() => skipSeconds(5)} title="Maju 5 detik">
                    <FastForward size={16} />
                  </button>
                  <span class="time-display">{formatSec(currentTime)} / {formatSec(duration)}</span>
                </div>

                <div class="right-ctrls">
                  <span class="speed-label">Speed:</span>
                  {#each [0.5, 0.75, 1.0, 1.25] as rate}
                    <button 
                      class="btn-speed" 
                      class:active={playbackRate === rate}
                      onclick={() => setSpeed(rate)}>
                      {rate}x
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}
      {:else}
        <div class="empty-video-placeholder">
          <Video size={48} class="text-cyan mb-2" />
          <h3>Pemutar Video Analisis Futsal</h3>
          <p>Masukkan link YouTube rekaman pertandingan atau upload file MP4 dari perangkat untuk menghubungkan rekaman dengan setiap detik aksi di lapangan.</p>
        </div>
      {/if}
    </div>

    <!-- RIGHT: Synchronized Events List -->
    <div class="video-events-sidebar">
      <div class="events-sidebar-header">
        <div class="title-with-count">
          <h4>Timestamp Aksi Pertandingan</h4>
          <span class="events-count-pill">{syncedEvents().length} Aksi</span>
        </div>

        <!-- Filter Chips -->
        <div class="filter-chips-row">
          {#each ['ALL', 'GOALS', 'SHOTS', 'TURNOVERS', 'SUBS'] as flt}
            <button 
              class="chip-btn" 
              class:active={selectedEventFilter === flt}
              onclick={() => (selectedEventFilter = flt as any)}>
              {flt}
            </button>
          {/each}
        </div>
      </div>

      <!-- Events Scrollable Timeline -->
      <div class="events-timeline-list">
        {#each syncedEvents() as ev}
          <button class="event-jump-card" onclick={() => jumpToEvent(ev.half, ev.timeStr)}>
            <div class="ev-time-col">
              <span class="ev-half-badge">H{ev.half}</span>
              <span class="ev-time-clock">{ev.timeStr}</span>
            </div>

            <div class="ev-info-col">
              <div class="ev-header-row">
                <span class="ev-title-badge {ev.badgeClass}">{ev.title}</span>
                <span class="ev-cat-pill">{ev.category}</span>
              </div>
              <p class="ev-detail-text">{ev.detail}</p>
            </div>

            <div class="ev-jump-action">
              <Play size={14} class="jump-play-icon" />
            </div>
          </button>
        {/each}

        {#if syncedEvents().length === 0}
          <div class="empty-events-state">
            <Clock size={28} class="text-slate mb-2" />
            <p>Belum ada event / tag yang tercatat pada filter ini.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .video-analysis-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #080f1d;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 16px;
    min-height: 600px;
  }

  .video-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.06);
    padding: 10px 14px;
    border-radius: 10px;
  }

  .source-inputs-group {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 320px;
  }

  .input-url-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(4, 9, 20, 0.8);
    border: 1px solid rgba(0, 229, 255, 0.25);
    border-radius: 8px;
    padding: 6px 12px;
    flex: 1;
  }

  .input-url-box input {
    background: transparent;
    border: none;
    outline: none;
    color: #f1f5f9;
    font-size: 0.84rem;
    flex: 1;
  }

  .btn-load-url {
    background: #00e5ff;
    color: #040914;
    border: none;
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-load-url:hover {
    background: #38bdf8;
  }

  .btn-upload-local {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #cbd5e1;
    border-radius: 8px;
    padding: 7px 14px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-upload-local:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .kickoff-sync-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    padding: 6px 12px;
    border-radius: 8px;
  }

  .sync-label {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 600;
  }

  .input-offset-sec {
    width: 60px;
    background: #040914;
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #10b981;
    border-radius: 6px;
    padding: 3px 6px;
    font-weight: 700;
    font-size: 0.8rem;
    text-align: center;
  }

  .sync-unit {
    font-size: 0.72rem;
    color: #64748b;
  }

  /* WORKSPACE GRID */
  .video-workspace-grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 16px;
    flex: 1;
  }

  @media (max-width: 900px) {
    .video-workspace-grid {
      grid-template-columns: 1fr;
    }
  }

  .video-screen-container {
    background: #000000;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 420px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .iframe-container {
    width: 100%;
    height: 100%;
    min-height: 450px;
  }

  .iframe-container iframe {
    width: 100%;
    height: 100%;
    min-height: 450px;
    border: none;
  }

  .html5-video-box {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .active-video-element {
    width: 100%;
    height: 100%;
    max-height: 450px;
    object-fit: contain;
  }

  .video-controls-overlay {
    background: linear-gradient(0deg, rgba(4, 9, 20, 0.95), transparent);
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .video-scrubber {
    width: 100%;
    accent-color: #00e5ff;
    cursor: pointer;
  }

  .controls-action-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .left-ctrls, .right-ctrls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-ctrl {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #ffffff;
    border-radius: 6px;
    padding: 6px 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-ctrl:hover {
    background: #00e5ff;
    color: #040914;
  }

  .time-display {
    font-size: 0.78rem;
    color: #cbd5e1;
    font-family: monospace;
    margin-left: 6px;
  }

  .speed-label {
    font-size: 0.72rem;
    color: #64748b;
  }

  .btn-speed {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.7rem;
    cursor: pointer;
  }

  .btn-speed.active {
    background: #00e5ff;
    color: #040914;
    font-weight: 700;
  }

  .empty-video-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 40px 20px;
    color: #94a3b8;
    max-width: 440px;
  }

  .empty-video-placeholder h3 {
    font-size: 1.1rem;
    color: #f1f5f9;
    margin: 8px 0 4px 0;
  }

  .empty-video-placeholder p {
    font-size: 0.82rem;
    line-height: 1.5;
    margin: 0;
  }

  /* EVENTS SIDEBAR */
  .video-events-sidebar {
    background: rgba(13, 21, 39, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .events-sidebar-header {
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(7, 12, 22, 0.5);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .title-with-count {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-with-count h4 {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 700;
    color: #ffffff;
  }

  .events-count-pill {
    background: rgba(0, 229, 255, 0.15);
    color: #00e5ff;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
  }

  .filter-chips-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .chip-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #94a3b8;
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .chip-btn.active {
    background: #00e5ff;
    color: #040914;
    font-weight: 700;
  }

  .events-timeline-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 400px;
  }

  .event-jump-card {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(18, 28, 51, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 8px 12px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
  }

  .event-jump-card:hover {
    background: rgba(0, 229, 255, 0.1);
    border-color: rgba(0, 229, 255, 0.3);
    transform: translateX(3px);
  }

  .ev-time-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 44px;
  }

  .ev-half-badge {
    font-size: 0.65rem;
    font-weight: 800;
    color: #00e5ff;
    background: rgba(0, 229, 255, 0.1);
    padding: 1px 4px;
    border-radius: 3px;
  }

  .ev-time-clock {
    font-size: 0.78rem;
    font-weight: 700;
    color: #f1f5f9;
    font-family: monospace;
    margin-top: 2px;
  }

  .ev-info-col {
    flex: 1;
  }

  .ev-header-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ev-title-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
  }

  .badge-goal { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  .badge-shot { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
  .badge-loss { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
  .badge-rec { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  .badge-foul { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
  .badge-sub { background: rgba(168, 85, 247, 0.2); color: #c084fc; }

  .ev-cat-pill {
    font-size: 0.65rem;
    color: #64748b;
  }

  .ev-detail-text {
    font-size: 0.72rem;
    color: #94a3b8;
    margin: 2px 0 0 0;
  }

  .jump-play-icon {
    color: #64748b;
    transition: color 0.2s;
  }

  .event-jump-card:hover .jump-play-icon {
    color: #00e5ff;
  }

  .empty-events-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 10px;
    color: #64748b;
    text-align: center;
    font-size: 0.8rem;
  }

  .text-cyan { color: #00e5ff; }
  .text-emerald { color: #10b981; }
  .text-slate { color: #64748b; }
  .mb-2 { margin-bottom: 8px; }
</style>
