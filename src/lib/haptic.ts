/**
 * Tactile Haptic Vibration Engine for Futsal Match Operations
 * Provides subtle tactile physical feedback on tablet/mobile devices during fast match actions.
 */

export class HapticEngine {
  private static isSupported(): boolean {
    return typeof navigator !== 'undefined' && Boolean(navigator.vibrate);
  }

  /**
   * Click mikro / Counter stepper: Getaran sentuhan halus [30ms]
   */
  static triggerLight() {
    if (this.isSupported()) {
      try {
        navigator.vibrate(30);
      } catch {}
    }
  }

  /**
   * Gol untuk tim: Getaran selebrasi kuat ganda [150ms getar, 80ms jeda, 200ms getar]
   */
  static triggerGoal() {
    if (this.isSupported()) {
      try {
        navigator.vibrate([150, 80, 200]);
      } catch {}
    }
  }

  /**
   * Rotasi / Deploy Paket 5-Man: Getaran ritmik transisi halus [80ms, 40ms, 80ms]
   */
  static triggerSubstitution() {
    if (this.isSupported()) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {}
    }
  }

  /**
   * Foul / Pelanggaran: Getaran peringatan tajam [120ms]
   */
  static triggerFoul() {
    if (this.isSupported()) {
      try {
        navigator.vibrate(120);
      } catch {}
    }
  }

  /**
   * Turnover / Loss Ball: Getaran pendek lembut [50ms]
   */
  static triggerTurnover() {
    if (this.isSupported()) {
      try {
        navigator.vibrate(50);
      } catch {}
    }
  }

  /**
   * Konfirmasi Voice Tagging / Perintah Suara Berhasil: Getaran ketukan ganda cepat [40ms, 30ms, 40ms]
   */
  static triggerVoiceSuccess() {
    if (this.isSupported()) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch {}
    }
  }

  /**
   * Error / Perintah Suara Tidak Dikenali: Getaran peringatan panjang [250ms]
   */
  static triggerError() {
    if (this.isSupported()) {
      try {
        navigator.vibrate(250);
      } catch {}
    }
  }
}
