/**
 * Taiwan Bus 81 - Authentic Taiwanese Bus & MRT Soundscapes Engine
 * Based on authentic audio references (Taichung Bus 81, MRT chimes, Driver Operations):
 * 1. 經典到站提示前奏鈴聲 (Taiwan Bus & MRT harmonic prelude chimes: 3-tone / 4-tone crystalline bells)
 * 2. 司機運轉操作音效 (Driver Operations):
 *    - 氣壓手煞車拔起/釋放「嘶————喀！」(Pneumatic parking brake air dump & clank)
 *    - 方向燈繼電器清脆「噠... 噠... 噠」(Authentic mechanical flasher relay)
 *    - 柴油渦輪增壓增壓聲與降檔煞車渦流 (Diesel engine turbo whistle & retarder whine)
 *    - 氣動雙片門外滑/折疊進氣排氣音 (Dual-stage door pneumatic release)
 * 3. 寶錄電子 悠遊卡/一卡通「逼逼」刷卡音效 (Exact frequencies: Regular 1960Hz, Student triple beep, Concession)
 * 4. 下車鈴經典「叮咚~」聲 (E6 down to C6 acoustic bell decay)
 */

export class BusAudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;

    // Engine & Turbo nodes
    this.engineGain = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineFilter = null;
    this.turboOsc = null;
    this.turboGain = null;
    this.engineRunning = false;

    // Turn signal
    this.turnSignalTimer = null;
    this.turnSignalActive = false;
    this.turnWarningTimer = null;
    this.turnWarningActive = false;
    this.turnWarningDirection = null;

    // Speech
    this.isSpeaking = false;
  }

  init() {
    if (this.isInitialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.isInitialized = true;
    this.setupEngineSound();
  }

  ensureContext() {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ==========================================
  // 1. 到站前奏鈴聲 (Taiwan Bus & MRT Prelude Chimes)
  // 參考台灣捷運與公車播報前的清脆三音/四音水晶提示鈴聲
  // ==========================================
  playStationPreludeChime(type = 'bus') {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (type === 'bus') {
      // 台灣公車經典到站提示鈴聲 (三音律動：Mi - Sol - Do 高音)
      // E5 (659Hz) -> G5 (784Hz) -> C6 (1046.5Hz)
      const notes = [659.25, 783.99, 1046.5];
      const durations = [0.18, 0.18, 0.6];

      let t = now;
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // 帶微量泛音的正弦波 (鐘琴/鐵琴質感)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + durations[i]);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + durations[i] + 0.05);

        t += 0.16;
      });
    } else if (type === 'mrt') {
      // 台灣捷運經典廣播前奏鈴聲 (四音和弦: F - A - C - F)
      const notes = [698.46, 880.00, 1046.50, 1396.91];
      let t = now;
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.5);

        t += 0.12;
      });
    }
  }

  // ==========================================
  // 2. 司機運轉操作：氣壓手煞車拔起「嘶————喀！」(Pneumatic Air Dump & Clank)
  // ==========================================
  playParkingBrake(isEngaged = true) {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // A. 壓縮空氣急速放氣聲 (White noise through resonant bandpass)
    const bufferSize = this.ctx.sampleRate * 0.85;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.6);
    filter.Q.setValueAtTime(2.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    gain.gain.linearRampToValueAtTime(0, now + 0.7);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.75);

    // B. 機械金屬氣閥喀噠聲 (Mechanical heavy click)
    setTimeout(() => {
      if (!this.ctx) return;
      const tClick = this.ctx.currentTime;
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();

      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(220, tClick);
      clickOsc.frequency.exponentialRampToValueAtTime(60, tClick + 0.04);

      clickGain.gain.setValueAtTime(0.3, tClick);
      clickGain.gain.exponentialRampToValueAtTime(0.001, tClick + 0.05);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(tClick);
      clickOsc.stop(tClick + 0.06);
    }, 180);
  }

  // ==========================================
  // 3. 司機運轉操作：方向燈繼電器「噠... 噠... 噠」
  // ==========================================
  setTurnSignal(active) {
    if (this.turnSignalActive === active) return;
    this.turnSignalActive = active;

    if (active) {
      this.playRelayClick(true);
      let isTick = false;
      this.turnSignalTimer = setInterval(() => {
        isTick = !isTick;
        this.playRelayClick(isTick);
      }, 340); // 經典大巴方向燈頻率
    } else {
      if (this.turnSignalTimer) {
        clearInterval(this.turnSignalTimer);
        this.turnSignalTimer = null;
      }
    }
  }

  playRelayClick(isTick) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isTick ? 1450 : 1200, now);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // 大型車轉彎警示蜂鳴器。這是未取得 81 路原始錄音前的仿真 fallback；
  // 收到可授權實錄後，可在同一個事件入口替換成音檔播放。
  setTurnWarning(active, direction = null) {
    if (this.turnWarningActive === active && this.turnWarningDirection === direction) return;

    if (this.turnWarningTimer) {
      clearInterval(this.turnWarningTimer);
      this.turnWarningTimer = null;
    }

    this.turnWarningActive = active;
    this.turnWarningDirection = direction;

    if (active) {
      this.playTurnWarning(direction);
      this.turnWarningTimer = setInterval(() => {
        this.playTurnWarning(this.turnWarningDirection);
      }, 720);
    }
  }

  playTurnWarning(direction = null) {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const frequencies = [1046.5, 1046.5, 1046.5];
    frequencies.forEach((frequency, index) => {
      const start = now + index * 0.13;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const pan = this.ctx.createStereoPanner?.();

      osc.type = 'square';
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);

      osc.connect(gain);
      if (pan) {
        pan.pan.setValueAtTime(direction === 'left' ? -0.18 : direction === 'right' ? 0.18 : 0, start);
        gain.connect(pan);
        pan.connect(this.ctx.destination);
      } else {
        gain.connect(this.ctx.destination);
      }
      osc.start(start);
      osc.stop(start + 0.1);
    });
  }

  // ==========================================
  // 4. 悠遊卡 / 一卡通「逼逼」刷卡聲 (寶錄電子機台音效)
  // ==========================================
  playCardTap(cardType = 'regular') {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (cardType === 'regular') {
      // 普卡：高音清脆單音「逼~」(1960Hz)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1960, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.42, now + 0.015);
      gain.gain.setValueAtTime(0.42, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } else if (cardType === 'student') {
      // 學生卡 / 半票：快速三連音「逼、逼、逼」
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.105;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2180, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
        gain.gain.setValueAtTime(0.35, t + 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.08);
      }
    } else if (cardType === 'fail') {
      // 錯誤/重複刷卡：低音長音「逼————」
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.setValueAtTime(0.3, now + 0.55);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.68);
    }
  }

  // ==========================================
  // 5. 下車鈴「叮咚~」聲 (Two-tone Chime)
  // ==========================================
  playStopBell() {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 「叮」(E6 / 1318.5Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.5, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.48, now + 0.012);
    gain1.gain.exponentialRampToValueAtTime(0.06, now + 0.32);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.75);

    // 「咚」(C6 / 1046.5Hz)，延遲 0.22 秒
    const t2 = now + 0.22;
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, t2);

    gain2.gain.setValueAtTime(0, t2);
    gain2.gain.linearRampToValueAtTime(0.42, t2 + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.04, t2 + 0.45);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 1.1);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 1.15);
  }

  // ==========================================
  // 6. 柴油重低音引擎 + 渦輪增壓嘯叫聲 (Diesel + Turbo Simulation)
  // ==========================================
  setupEngineSound() {
    if (!this.ctx) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(160, this.ctx.currentTime);

    // 引擎低頻震盪 (缸內點火)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(36, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(72, this.ctx.currentTime);

    // 渦輪增壓哨音 (Turbo whistle)
    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.ctx.destination);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.turboOsc.start();
    this.engineRunning = true;
  }

  updateEngine(speedKmh, throttle = 0, isRetarder = false) {
    if (!this.engineRunning || !this.ctx) return;

    const baseFreq = 36;
    const maxFreq = 96;
    const speedRatio = Math.min(Math.abs(speedKmh) / 60, 1.0);
    const targetFreq = baseFreq + speedRatio * (maxFreq - baseFreq) + (throttle > 0 ? 14 : 0);

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.12);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 2, now, 0.12);

    // 渦輪哨音隨油門拉高
    if (throttle > 0) {
      const turboFreq = 1400 + speedRatio * 1800;
      this.turboOsc.frequency.setTargetAtTime(turboFreq, now, 0.15);
      this.turboGain.gain.setTargetAtTime(0.035, now, 0.2);
    } else {
      this.turboGain.gain.setTargetAtTime(0.0001, now, 0.3);
    }

    // 降檔煞車渦流聲 (Retarder Drone)
    if (isRetarder) {
      this.engineFilter.frequency.setTargetAtTime(420, now, 0.1);
      this.engineGain.gain.setTargetAtTime(0.22, now, 0.1);
    } else {
      const targetFilter = 150 + speedRatio * 380 + (throttle > 0 ? 120 : 0);
      this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.2);
      const targetVol = 0.12 + speedRatio * 0.12 + (throttle > 0 ? 0.05 : 0);
      this.engineGain.gain.setTargetAtTime(targetVol, now, 0.1);
    }
  }

  // ==========================================
  // 7. 氣動車門開閉聲
  // ==========================================
  playDoorPneumatic(isOpen) {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.75;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.28));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isOpen ? 2400 : 1900, now);
    filter.Q.setValueAtTime(2.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.7);

    // 關門時響起雙嗶聲
    if (!isOpen) {
      for (let i = 0; i < 2; i++) {
        const osc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        const t = now + i * 0.22;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1480, t);

        bGain.gain.setValueAtTime(0, t);
        bGain.gain.linearRampToValueAtTime(0.28, t + 0.02);
        bGain.gain.setValueAtTime(0.28, t + 0.12);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(bGain);
        bGain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.2);
      }
    }
  }

  // ==========================================
  // 8. 鳴笛喇叭 (Dual Heavy Bus Horn)
  // ==========================================
  playHorn() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(329.6, now);
    osc2.frequency.setValueAtTime(392.0, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.42, now + 0.03);
    gain.gain.setValueAtTime(0.42, now + 0.38);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  // ==========================================
  // 9. 到站語音廣播 (前奏鈴聲 + 台中81路到站播音)
  // ==========================================
  announceStation(stationName, nextStationName, isEnglish = true) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // 播放台灣公車三音到站提示前奏鈴
    this.playStationPreludeChime('bus');

    setTimeout(() => {
      const textZh = `下一站，${nextStationName}。`;
      const msgZh = new SpeechSynthesisUtterance(textZh);
      msgZh.lang = 'zh-TW';
      msgZh.rate = 0.95;
      msgZh.pitch = 1.05;

      window.speechSynthesis.speak(msgZh);

      if (isEnglish) {
        msgZh.onend = () => {
          const textEn = `Next stop, ${nextStationName}.`;
          const msgEn = new SpeechSynthesisUtterance(textEn);
          msgEn.lang = 'en-US';
          msgEn.rate = 0.9;
          window.speechSynthesis.speak(msgEn);
        };
      }
    }, 550);
  }
}
