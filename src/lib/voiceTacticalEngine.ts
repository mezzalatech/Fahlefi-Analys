import { HapticEngine } from './haptic';

export interface ParsedVoiceCommand {
  rawTranscript: string;
  intent: 'GOAL' | 'LOSS' | 'RECOVERY' | 'FOUL' | 'PAKET_DEPLOY' | 'TIMER_START' | 'TIMER_STOP' | 'TIMEOUT' | 'UNKNOWN';
  playerNo?: number;
  paketIndex?: number;
  team?: 'home' | 'away';
  description: string;
}

export class VoiceTacticalEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private onCommandCallback: ((cmd: ParsedVoiceCommand) => void) | null = null;
  private onErrorCallback: ((errorMsg: string) => void) | null = null;
  private onStatusChangeCallback: ((active: boolean) => void) | null = null;

  constructor() {
    this.initSpeech();
  }

  private initSpeech() {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'id-ID'; // Bahasa Indonesia

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStatusChangeCallback) this.onStatusChangeCallback(true);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onStatusChangeCallback) this.onStatusChangeCallback(false);
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Voice recognition error:', event.error);
          if (this.onErrorCallback) this.onErrorCallback(`Error suara: ${event.error}`);
        }
      };

      this.recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult && lastResult[0]) {
          const transcript = lastResult[0].transcript.trim();
          const parsed = this.parseTranscript(transcript);
          if (parsed.intent !== 'UNKNOWN') {
            HapticEngine.triggerVoiceSuccess();
          } else {
            HapticEngine.triggerError();
          }
          if (this.onCommandCallback) this.onCommandCallback(parsed);
        }
      };
    } catch (err) {
      console.error('Failed to initialize Voice Engine:', err);
    }
  }

  static get isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  start(onCommand: (cmd: ParsedVoiceCommand) => void, onError?: (err: string) => void, onStatusChange?: (active: boolean) => void) {
    this.onCommandCallback = onCommand;
    this.onErrorCallback = onError || null;
    this.onStatusChangeCallback = onStatusChange || null;

    if (!this.recognition) {
      this.initSpeech();
    }

    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (e: any) {
        console.warn('Speech recognition start note:', e.message);
      }
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  toggle(onCommand: (cmd: ParsedVoiceCommand) => void, onError?: (err: string) => void, onStatusChange?: (active: boolean) => void): boolean {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      this.start(onCommand, onError, onStatusChange);
      return true;
    }
  }

  /**
   * Parser Bahasa Indonesia untuk Perintah Taktikal Futsal
   */
  parseTranscript(rawText: string): ParsedVoiceCommand {
    const text = rawText.toLowerCase().trim();

    // 1. Ekstrak nomor pemain dari teks
    const playerNo = this.extractNumber(text);

    // 2. Intent: GOAL
    if (text.includes('gol') || text.includes('goal') || text.includes('skor')) {
      return {
        rawTranscript: rawText,
        intent: 'GOAL',
        playerNo,
        team: 'home',
        description: `⚽ Gol dicatat ${playerNo ? `untuk Pemain #${playerNo}` : ''}`
      };
    }

    // 3. Intent: LOSS / TURNOVER
    if (text.includes('loss') || text.includes('hilang') || text.includes('turnover') || text.includes('lepas')) {
      return {
        rawTranscript: rawText,
        intent: 'LOSS',
        playerNo,
        description: `⚠️ Loss ball dicatat ${playerNo ? `oleh #${playerNo}` : ''}`
      };
    }

    // 4. Intent: RECOVERY
    if (text.includes('recover') || text.includes('rebut') || text.includes('dapat') || text.includes('rebound') || text.includes('curi')) {
      return {
        rawTranscript: rawText,
        intent: 'RECOVERY',
        playerNo,
        description: `🛡️ Recovery bola dicatat ${playerNo ? `oleh #${playerNo}` : ''}`
      };
    }

    // 5. Intent: FOUL
    if (text.includes('foul') || text.includes('faul') || text.includes('pelanggaran') || text.includes('kartu')) {
      return {
        rawTranscript: rawText,
        intent: 'FOUL',
        playerNo,
        description: `🚩 Pelanggaran dicatat ${playerNo ? `untuk #${playerNo}` : ''}`
      };
    }

    // 6. Intent: ROTASI / PAKET DEPLOY
    if (text.includes('paket') || text.includes('rotasi') || text.includes('ganti')) {
      const paketIdx = this.extractPaketIndex(text);
      if (paketIdx !== undefined) {
        return {
          rawTranscript: rawText,
          intent: 'PAKET_DEPLOY',
          paketIndex: paketIdx,
          description: `🔄 Deploy Rotasi Paket ${paketIdx + 1}`
        };
      }
    }

    // 7. Intent: TIMER CONTROLS
    if (text.includes('mulai') || text.includes('start') || text.includes('jalan') || text.includes('main')) {
      return {
        rawTranscript: rawText,
        intent: 'TIMER_START',
        description: '▶ Timer pertandingan dijalankan'
      };
    }

    if (text.includes('stop') || text.includes('pause') || text.includes('jeda') || text.includes('berhenti') || text.includes('mati')) {
      return {
        rawTranscript: rawText,
        intent: 'TIMER_STOP',
        description: '⏸ Timer pertandingan dijeda'
      };
    }

    // 8. Intent: TIMEOUT
    if (text.includes('timeout') || text.includes('time out')) {
      return {
        rawTranscript: rawText,
        intent: 'TIMEOUT',
        team: text.includes('lawan') || text.includes('away') ? 'away' : 'home',
        description: '⏱️ Permintaan Time-Out dicatat'
      };
    }

    return {
      rawTranscript: rawText,
      intent: 'UNKNOWN',
      description: `Perintah tidak dikenali: "${rawText}"`
    };
  }

  private extractNumber(text: string): number | undefined {
    // Cari angka numerik (1-99)
    const numMatch = text.match(/\b([1-9][0-9]?)\b/);
    if (numMatch) return parseInt(numMatch[1], 10);

    // Kamus kata angka bahasa Indonesia
    const wordMap: Record<string, number> = {
      'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
      'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
      'sebelas': 11, 'dua belas': 12, 'tiga belas': 13, 'empat belas': 14,
      'lima belas': 15, 'enam belas': 16, 'tujuh belas': 17, 'delapan belas': 18,
      'sembilan belas': 19, 'dua puluh': 20, 'dua puluh satu': 21
    };

    for (const [word, val] of Object.entries(wordMap)) {
      if (text.includes(word)) return val;
    }

    return undefined;
  }

  private extractPaketIndex(text: string): number | undefined {
    if (text.includes('1') || text.includes('satu') || text.includes('pertama') || text.includes('starting')) return 0;
    if (text.includes('2') || text.includes('dua') || text.includes('kedua')) return 1;
    if (text.includes('3') || text.includes('tiga') || text.includes('ketiga')) return 2;
    if (text.includes('4') || text.includes('empat') || text.includes('keempat') || text.includes('power')) return 3;
    if (text.includes('5') || text.includes('lima') || text.includes('kelima')) return 4;
    return undefined;
  }
}

export const voiceEngine = new VoiceTacticalEngine();
