'use strict';

/* ============================================================
   КОНСТАНТЫ И СПИСОК КОМНАТ
   1-5: основные 2.5D (Taperoom.jpg, Gallery.jpg, attic.jpg, Surgeryroom.jpg, Bunker.jpg)
   6-9: секретные 2.5D (открываются после прохождения 1-5)
   10:  тестовая 360° комната из редактора (./assets/1000405137.jpg + искры ./assets/1000405140.mp4)
============================================================ */
const REDUCE_MOTION     = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const STORAGE_KEY       = 'osobnyak_progress_v4';
const FLASHLIGHT_RATIO  = 0.48;
const TRANSITION_SPEED  = 0.026;
const POINTER_LERP      = 0.14;
const ENTITY_LERP       = 0.035;
const ENTITY_EVADE_LERP = 0.14;

const ROOMS = [
  {
    id: 0, code: "СЕКТОР 01 // TAPEROOM", fileName: "Taperoom.jpg",
    is360EditorRoom: false,
    title: "Прихожая с катушечным диктофоном",
    desc: "Сырые обои отслаиваются от гнилой штукатурки. На гниющем полу брошены мокрые домашние тапочки, рядом — ржавый бобинный диктофон.",
    portal: { x: 0.62, y: 0.48, label: "Проём в Gallery" },
    artifact: { x: 0.41, y: 0.42, label: "Катушечный диктофон" },
    clueProp: { x: 0.64, y: 0.78, label: "Мокрые тапочки у порога", clueText: "Часть 1/2 частоты: +42 Гц (базовый тон 400 Гц на раме в Gallery)" },
    shadowSpots: [{ x: 0.59, y: 0.52, scale: 1.05 }, { x: 0.67, y: 0.55, scale: 0.90 }],
    palette: { wall: "#18201b", floor: "#0d110e", light: "#6c8074" },
    reverbDecay: 3.5, solved: false, solvedOnce: false, tapePlaying: false, tapeFinished: false,
    puzzleTitle: "Бобинный диктофон «ЭХО-4» (2-составный)",
    puzzleDesc: "Шаг 1: осмотрите мокрые тапочки у порога (добавка +42 Гц). Шаг 2: сверьте базовую отметку 400 Гц в Gallery и выставьте итоговую частоту.",
    puzzleType: "frequency", targetFreq: 442
  },
  {
    id: 1, code: "СЕКТОР 02 // GALLERY", fileName: "Gallery.jpg",
    is360EditorRoom: false,
    title: "Галерея с пустыми рамами и цепями",
    desc: "Вытянутая анфилада с облезлыми стенами, осколками рамок и тяжёлыми цепями.",
    portal: { x: 0.50, y: 0.46, label: "Подъём в Attic" },
    artifact: { x: 0.31, y: 0.44, label: "Узел с кодовым замком" },
    clueProp: { x: 0.68, y: 0.52, label: "Осколок разбитой рамки", clueText: "Знаки I и IV на осколке рамки; знаки VII и IX — на заляпанной простыне в Attic (400 Гц — метка плёнки)" },
    shadowSpots: [{ x: 0.45, y: 0.52, scale: 0.85 }, { x: 0.55, y: 0.50, scale: 0.92 }],
    palette: { wall: "#1c221b", floor: "#121510", light: "#7a8c76" },
    reverbDecay: 4.0, solved: false, solvedOnce: false,
    puzzleTitle: "Четырёхдисковый замок смотрителя (2-составный)",
    puzzleDesc: "Первая пара римских знаков (I, IV) спрятана на осколке рамки здесь, вторая пара (VII, IX) — на заляпанной простыне в Attic.",
    puzzleType: "roman_code", targetCode: ["I", "IV", "VII", "IX"]
  },
  {
    id: 2, code: "СЕКТОР 03 // ATTIC", fileName: "attic.jpg",
    is360EditorRoom: false,
    title: "Чердак с заляпанными простынями",
    desc: "Под гниющими стропилами стоят сундуки и мебель под заляпанными простынями и старыми пледами.",
    portal: { x: 0.50, y: 0.45, label: "Люк в Surgeryroom" },
    artifact: { x: 0.14, y: 0.72, label: "Кованый сундук с противовесами" },
    clueProp: { x: 0.52, y: 0.58, label: "Заляпанный плед на кресле", clueText: "Знаки VII и IX для Gallery; для весов: на пледе вышито «6 кг слева», а в Surgeryroom на бутылке — «6 кг справа»" },
    shadowSpots: [{ x: 0.42, y: 0.48, scale: 0.82 }, { x: 0.73, y: 0.50, scale: 0.95 }],
    palette: { wall: "#211c16", floor: "#14110d", light: "#9c896e" },
    reverbDecay: 3.2, solved: false, solvedOnce: false,
    puzzleTitle: "Рычажные весы чердачного люка (2-составный)",
    puzzleDesc: "Левая чаша (6 кг) указана на заляпанном пледе здесь, а правая (6 кг) — на этикетке бутылки в Surgeryroom.",
    puzzleType: "weights"
  },
  {
    id: 3, code: "СЕКТОР 04 // SURGERYROOM", fileName: "Surgeryroom.jpg",
    is360EditorRoom: false,
    title: "Заброшенная операционная",
    desc: "Потрескавшийся кафель, пустые склянки и бутылки, ржавые ширмы и операционный стол.",
    portal: { x: 0.64, y: 0.49, label: "Гермошлюз в Bunker" },
    artifact: { x: 0.48, y: 0.54, label: "Хирургический стол и дозатор" },
    clueProp: { x: 0.24, y: 0.64, label: "Мутная бутылка с осадком", clueText: "Правая чаша весов Attic = 6 кг; для дозатора: колба А = 3 (здесь), колба B = 1 (на оборванном проводе в Bunker)" },
    shadowSpots: [{ x: 0.26, y: 0.53, scale: 1.02 }, { x: 0.64, y: 0.51, scale: 0.88 }],
    palette: { wall: "#172420", floor: "#0e1412", light: "#779c8e" },
    reverbDecay: 4.5, solved: false, solvedOnce: false,
    puzzleTitle: "Дозатор инфузионной стойки №9 (2-составный)",
    puzzleDesc: "Доза колбы А = 3 читается на склянке/кафеле здесь, а доза колбы B = 1 привязана к оборванному проводу в Bunker.",
    puzzleType: "dosage", targetA: 3, targetB: 1
  },
  {
    id: 4, code: "СЕКТОР 05 // BUNKER", fileName: "Bunker.jpg",
    is360EditorRoom: false,
    title: "Подземный бункер связи",
    desc: "Массивная ржавая гермодверь, оборванные провода, аварийный маяк и полевой телефон.",
    portal: { x: 0.90, y: 0.52, label: "Секретный шлюз: Архив" },
    artifact: { x: 0.33, y: 0.56, label: "Полевой телефон и гермовентиль" },
    clueProp: { x: 0.64, y: 0.38, label: "Оборванный провод под потолком", clueText: "Колба B = 1; обороты штурвала: первые 3 поворота вправо (R, R, R) здесь, последние 2 влево (L, L) — на заклинившем ключе в Archive" },
    shadowSpots: [{ x: 0.87, y: 0.54, scale: 0.96 }, { x: 0.76, y: 0.55, scale: 0.85 }],
    palette: { wall: "#1b1917", floor: "#0f0d0c", light: "#c93b2b" },
    reverbDecay: 5.2, solved: false, solvedOnce: false,
    puzzleTitle: "Штурвал гермошлюза и передатчик (2-составный)",
    puzzleDesc: "Начало серии (R, R, R) у штурвала здесь, завершение (L, L) — на ржавом ключе у затопленного стеллажа в Archive.",
    puzzleType: "valve", targetSequence: ["R", "R", "R", "L", "L"]
  },
  /* ==== 4 СЕКРЕТНЫЕ КОМНАТЫ (2- И 3-СОСТАВНЫЕ КВЕСТЫ ПОСЛЕ ПРОХОЖДЕНИЯ 1–5) ==== */
  {
    id: 5, code: "СЕКРЕТ 01 // ARCHIVE", fileName: "Archive_secret1.gif",
    is360EditorRoom: false,
    isSecret: true, isAnimatedGif: true,
    title: "Тайник I: Затопленный архив",
    desc: "Полузатопленное хранилище дел № 404. У стеллажа — ржавый ключ и всплывшие папки, а на сырой штукатурке справа процарапано предостережение.",
    portal: { x: 0.50, y: 0.46, label: "Проход в Тайник II: Котельная" },
    artifact: { x: 0.78, y: 0.56, label: "Водомерный замок стеллажа" },
    clueProp: { x: 0.22, y: 0.64, label: "Ржавый ключ в всплывших бумагах", clueText: "Финал штурвала Bunker: L, L; ключ к архиву: первое слово «НЕ» на всплывшей папке, второе «СМОТРИ» — на стене" },
    shadowSpots: [{ x: 0.48, y: 0.50, scale: 0.95 }, { x: 0.25, y: 0.54, scale: 0.88 }],
    palette: { wall: "#141d17", floor: "#080d0a", light: "#658f74" },
    reverbDecay: 5.4, solved: false, solvedOnce: false,
    puzzleTitle: "Шифр затопленного архива (2-составный)",
    puzzleDesc: "Сложите два слова: «НЕ» (отметка на бумагах у ржавого ключа) и «СМОТРИ» (на сырой стене над водой).",
    puzzleType: "text_code",
    placeholder: "Два слова со стены...",
    targetWord: "НЕ СМОТРИ"
  },
  {
    id: 6, code: "СЕКРЕТ 02 // FURNACE", fileName: "Furnace_secret1.jpg",
    hallucinationFileName: "Furnace_secret2.jpg",
    is360EditorRoom: false,
    isSecret: true,
    title: "Тайник II: Заброшенная котельная",
    desc: "Чёрная от копоти топка со старыми манометрами и лопнувшими стеклянными колбами в золе.",
    portal: { x: 0.68, y: 0.46, label: "Лаз в Тайник III: Камера маятника" },
    artifact: { x: 0.34, y: 0.54, label: "Топочный засов котла" },
    clueProp: { x: 0.56, y: 0.74, label: "Лопнувшая склянка в золе", clueText: "3-составный код: [6] на горлышке склянки здесь, [1] на оборванном проводе в Bunker, [8] в золе перед топкой" },
    shadowSpots: [{ x: 0.66, y: 0.52, scale: 1.0 }, { x: 0.82, y: 0.54, scale: 0.9 }],
    palette: { wall: "#1f1712", floor: "#0d0907", light: "#c27838" },
    reverbDecay: 4.8, solved: false, solvedOnce: false,
    puzzleTitle: "Термозамок топочной дверцы (3-составный)",
    puzzleDesc: "Соберите 3 цифры: [6] на лопнувшей склянке в котельной, [1] на проводе в Bunker и [8] в золе перед топкой.",
    puzzleType: "pin_digits",
    targetPin: [6, 1, 8]
  },
  {
    id: 7, code: "СЕКРЕТ 03 // GORECHAMBER", fileName: "Gorechamber_secret1.jpg",
    hallucinationFileName: "Gorechamber_secret2.jpg",
    is360EditorRoom: false,
    isSecret: true,
    title: "Тайник III: Камера с маятником",
    desc: "Сырой каземат с ржавыми кандалами, порванными ремнями и четырьмя римскими знаками на каменной плите пола.",
    portal: { x: 0.54, y: 0.45, label: "Переход в Тайник IV: Зеркальный изолятор" },
    artifact: { x: 0.16, y: 0.46, label: "Цепной стопор маятника" },
    clueProp: { x: 0.74, y: 0.66, label: "Порванный кожаный ремень у стены", clueText: "3-составный ключ: [I, III] на ремне и кандалах здесь, [IX] на осколке рамки в Gallery, [X] под лезвием маятника" },
    shadowSpots: [{ x: 0.55, y: 0.52, scale: 0.96 }, { x: 0.84, y: 0.54, scale: 0.88 }],
    palette: { wall: "#1c2019", floor: "#0d100c", light: "#85967e" },
    reverbDecay: 5.6, solved: false, solvedOnce: false,
    puzzleTitle: "Римский замок каземата (3-составный)",
    puzzleDesc: "Соберите 4 знака из 3 источников: [I, III] на порванном ремне у стены, [IX] на рамке в Gallery и [X] на плите под маятником.",
    puzzleType: "roman_code_extended",
    targetCode: ["I", "III", "IX", "X"]
  },
  {
    id: 8, code: "СЕКРЕТ 04 // MIRROROOM", fileName: "Mirroroom_secret1.jpg",
    is360EditorRoom: false,
    isSecret: true,
    title: "Тайник IV: Зеркальный изолятор",
    desc: "Круглая камера с треснувшими зеркалами, ржавой клеткой, грязными тапочками у порога и двумя цифрами в проломе потолка.",
    portal: { x: 0.62, y: 0.48, label: "Переход в Сектор 10 (360°)" },
    artifact: { x: 0.62, y: 0.55, label: "Засов заколоченной двери" },
    clueProp: { x: 0.36, y: 0.76, label: "Осколок зеркала у ржавой клетки", clueText: "2-составный шифр: [9] в проломе потолка, [4] в отражении осколка зеркала у клетки" },
    shadowSpots: [{ x: 0.28, y: 0.52, scale: 0.92 }, { x: 0.80, y: 0.52, scale: 0.92 }],
    palette: { wall: "#1c1c18", floor: "#0d0c0a", light: "#b59d78" },
    reverbDecay: 5.0, solved: false, solvedOnce: false,
    puzzleTitle: "Зеркальный шифр изолятора (2-составный)",
    puzzleDesc: "Первая цифра [9] видна в проломе потолка, вторая [4] — в осколке зеркала у ржавой клетки.",
    puzzleType: "pin_digits",
    targetPin: [9, 4]
  },
  /* ==== 10-Я ТЕСТОВАЯ КОМНАТА: ПОЛНЫЙ ОБЗОР 360° + ИСКРЫ ПО НАЖАТИЮ ==== */
  {
    id: 9, code: "СЕКТОР 10 // ТЕСТ 360°", fileName: "./assets/1000405137.jpg",
    fallbackFileName: "1000405137.jpg",
    is360EditorRoom: true,
    startCamera: { lon: 145, lat: 5 },
    atmosphereEffects: { dust: true, fog: false, rain: false, smoke: false, drops: false, insects: false, intensity: 1.0 },
    editorInteractives: [
      {
        id: "sparks_panel",
        type: "video",
        src: "./assets/1000405140.mp4",
        fallbackSrc: "1000405140.mp4",
        sound: "spark",
        customSoundSrc: "",
        action: "none",
        clueText: "",
        targetRoomId: null,
        position: { u: 0.378, v: 0.462 },
        scaleX: 0.45,
        scaleY: 0.45,
        rotationDeg: 0,
        size: { width: 248.89, height: 140 },
        corners: { tl: [0, 0], tr: [0, 0], br: [0, 0], bl: [0, 0] },
        blendMode: "additive",
        chromaKey: null,
        loop: false
      }
    ],
    title: "Комната 1 (Заброшенная 360°)",
    desc: "Тестовая комната с полным обзором 360°. Оглядитесь вокруг: нажмите на электрощит слева от двери, чтобы вызвать искры, или осмотрите замок.",
    portal: { u: 0.455, v: 0.50, label: "Выход на поверхность (В начало)" },
    artifact: { u: 0.515, v: 0.55, label: "Заброшенный куст у окон" },
    clueProp: { u: 0.378, v: 0.462, label: "Электрощит (нажмите для искр)", clueText: "При замыкании щитка на шкале вспыхнули цифры: 4 - 0 - 9" },
    shadowSpots: [{ x: 0.74, y: 0.53, scale: 1.05 }, { x: 0.22, y: 0.56, scale: 0.92 }],
    palette: { wall: "#161a18", floor: "#0a0c0b", light: "#8f3222" },
    reverbDecay: 5.8, solved: false, solvedOnce: false,
    puzzleTitle: "Релейный замок заброшенной комнаты",
    puzzleDesc: "Нажмите на электрощит слева от двери, чтобы вызвать искры и увидеть комбинацию (4 - 0 - 9).",
    puzzleType: "pin_digits",
    targetPin: [4, 0, 9]
  }
];

function areMainRoomsCompleted() {
  for (let i = 0; i < 5; i++) {
    if (!ROOMS[i].solved && !ROOMS[i].solvedOnce) return false;
  }
  return true;
}

function isRoomAccessible(targetIdx) {
  if (freeMode) return true;
  const target = ROOMS[targetIdx];
  if (!target) return false;
  if (target.isSecret && !areMainRoomsCompleted()) return false;
  if (targetIdx === 9 && !areMainRoomsCompleted()) return false;
  if (targetIdx <= currentRoomIndex) return true;
  for (let i = 0; i < targetIdx; i++) {
    if (!ROOMS[i].solved) return false;
  }
  return true;
}

/* ============================================================
   АУДИО-ДВИЖОК
============================================================ */
class DarkAmbientAudio {
  constructor() {
    this.ctx = null; this.enabled = false; this.master = null;
    this.convolver = null; this.wetGain = null; this.dryGain = null;
    this.ambientBuffer = null; this.crackleBuffer = null;
    this.scheduler = null; this.heartbeatTimer = null;
    this._irCache = new Map();
    this.activeVoices = 0; this.maxVoices = 8;
  }
  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -10;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.18;

    this.master = this.ctx.createGain();
    this.master.gain.value = 1.38;
    this.master.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.65;
    this.dryGain.connect(this.master);
    this.convolver = this.ctx.createConvolver();
    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.value = 0.85;
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.master);
    this.ambientBuffer = this.buildDarkNoiseBuffer(8.0);
    this.crackleBuffer = this.buildCrackleBuffer(4.0);
    this.updateCavernReverb(4.5);
    this.startSubbassDroneBed();
    this.enabled = true;
    this.startEnvironmentalScheduler();
    this.startHeartbeatLoop();
  }
  buildDarkNoiseBuffer(sec) {
    const sr = this.ctx.sampleRate, len = sr * sec;
    const buf = this.ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555; b1 = 0.99332 * b1 + w * 0.0750;
        b2 = 0.96900 * b2 + w * 0.1538; b3 = 0.86650 * b3 + w * 0.3104;
        b4 = 0.55000 * b4 + w * 0.5329;
        d[i] = (b0 + b1 + b2 + b3 + b4 + w * 0.53) * 0.035;
      }
    }
    return buf;
  }
  buildCrackleBuffer(sec) {
    const sr = this.ctx.sampleRate, len = sr * sec;
    const buf = this.ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const hiss = (Math.random() * 2 - 1) * 0.025;
      const pop = Math.random() < 0.0012 ? (Math.random() * 2 - 1) * 0.75 : 0;
      d[i] = hiss + pop;
    }
    return buf;
  }
  updateCavernReverb(decaySec) {
    if (!this.ctx) return;
    const key = decaySec.toFixed(2);
    let imp = this._irCache.get(key);
    if (!imp) {
      const sr = this.ctx.sampleRate, len = Math.floor(sr * decaySec);
      imp = this.ctx.createBuffer(2, len, sr);
      for (let ch = 0; ch < 2; ch++) {
        const out = imp.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          const t = i / sr, noise = Math.random() * 2 - 1;
          const env = Math.pow(1 - i / len, 3.2) * Math.exp(-t * (2.1 / decaySec));
          out[i] = noise * env * 0.55;
        }
      }
      this._irCache.set(key, imp);
    }
    this.convolver.buffer = imp;
  }
  startSubbassDroneBed() {
    const src1 = this.ctx.createBufferSource();
    src1.buffer = this.ambientBuffer; src1.loop = true;
    const lp1 = this.ctx.createBiquadFilter();
    lp1.type = "lowpass"; lp1.frequency.value = 42; lp1.Q.value = 4.0;
    const g1 = this.ctx.createGain(); g1.gain.value = 0.85;
    src1.connect(lp1); lp1.connect(g1);
    g1.connect(this.convolver); g1.connect(this.dryGain);
    src1.start();
  }
  toggle() {
    if (!this.ctx) { this.init(); return true; }
    this.enabled = !this.enabled;
    if (this.enabled) { this.ctx.resume(); this.master.gain.setTargetAtTime(1.38, this.ctx.currentTime, 0.2); }
    else { this.master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2); }
    return this.enabled;
  }
  _canPlay() { return this.ctx && this.enabled && this.activeVoices < this.maxVoices; }
  _trackVoice(ms) {
    this.activeVoices++;
    setTimeout(() => { this.activeVoices = Math.max(0, this.activeVoices - 1); }, ms);
  }
  duckForPanic() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime, curr = this.master.gain.value;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(curr, now);
    this.master.gain.linearRampToValueAtTime(0.68, now + 0.1);
    this.master.gain.linearRampToValueAtTime(this.enabled ? 1.38 : 0.0001, now + 2.5);
  }
  playHeartbeatPulse(intensity = 0.55) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    [0, 0.24].forEach((offset, idx) => {
      const t = now + offset;
      const osc = this.ctx.createOscillator(); osc.type = "sine";
      osc.frequency.setValueAtTime(idx === 0 ? 64 : 52, t);
      osc.frequency.exponentialRampToValueAtTime(24, t + 0.18);
      const g = this.ctx.createGain();
      const peak = (idx === 0 ? 0.48 : 0.34) * intensity;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.21);
      osc.connect(g); g.connect(this.dryGain);
      osc.start(t); osc.stop(t + 0.23);
    });
  }
  startHeartbeatLoop() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (document.hidden || !this.enabled) return;
      const baseIntensity = entityState.visible ? 1.0 : (0.35 + Math.min(5, currentRoomIndex) * 0.11);
      this.playHeartbeatPulse(baseIntensity);
    }, 1450);
  }
  playDistantShriek() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime, dur = 1.1 + Math.random() * 0.6;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = (Math.random() * 1.6) - 0.8;
    const src = this.ctx.createBufferSource();
    src.buffer = this.ambientBuffer;
    const f1 = this.ctx.createBiquadFilter();
    f1.type = "bandpass";
    const startF = 720 + Math.random() * 380;
    f1.frequency.setValueAtTime(startF, now);
    f1.frequency.exponentialRampToValueAtTime(startF * 1.35, now + dur * 0.35);
    f1.frequency.exponentialRampToValueAtTime(340, now + dur);
    f1.Q.value = 14.0;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0008, now);
    env.gain.linearRampToValueAtTime(0.55, now + dur * 0.22);
    env.gain.exponentialRampToValueAtTime(0.0005, now + dur);
    src.connect(f1); f1.connect(env); env.connect(panner); panner.connect(this.convolver);
    src.start(now); src.stop(now + dur + 0.05);
    this._trackVoice(dur * 1000 + 100);
  }
  playWhisper() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime, dur = 2.0 + Math.random() * 1.5;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = (Math.random() * 1.6) - 0.8;
    const src = this.ctx.createBufferSource();
    src.buffer = this.ambientBuffer; src.loop = true;
    const bp1 = this.ctx.createBiquadFilter();
    bp1.type = "bandpass"; bp1.frequency.value = 1800 + Math.random() * 400; bp1.Q.value = 6;
    const bp2 = this.ctx.createBiquadFilter();
    bp2.type = "bandpass"; bp2.frequency.value = 2600 + Math.random() * 600; bp2.Q.value = 8;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 4 + Math.random() * 3;
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 0.12;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.28, now + 0.35);
    env.gain.exponentialRampToValueAtTime(0.0005, now + dur);
    src.connect(bp1); bp1.connect(bp2); bp2.connect(env);
    env.connect(panner); panner.connect(this.dryGain); panner.connect(this.convolver);
    lfo.connect(lfoGain); lfoGain.connect(env.gain);
    src.start(now); src.stop(now + dur + 0.05);
    lfo.start(now); lfo.stop(now + dur + 0.05);
    this._trackVoice(dur * 1000 + 200);
  }
  playBreathing() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime;
    const cycles = 3, cycleDur = 3.2, total = cycles * cycleDur;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = (Math.random() * 0.8) - 0.4;
    const src = this.ctx.createBufferSource();
    src.buffer = this.ambientBuffer; src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 320;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    for (let i = 0; i < cycles; i++) {
      const t0 = now + i * cycleDur;
      env.gain.linearRampToValueAtTime(0.4, t0 + 0.9);
      env.gain.linearRampToValueAtTime(0.05, t0 + 2.4);
    }
    env.gain.linearRampToValueAtTime(0.0001, now + total);
    src.connect(lp); lp.connect(env); env.connect(panner); panner.connect(this.dryGain);
    src.start(now); src.stop(now + total + 0.1);
    this._trackVoice(total * 1000 + 200);
  }
  playDistantCry() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime, dur = 2.5;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = (Math.random() * 1.6) - 0.8;
    const osc = this.ctx.createOscillator(); osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + dur);
    const bp1 = this.ctx.createBiquadFilter();
    bp1.type = "bandpass"; bp1.frequency.value = 700; bp1.Q.value = 5;
    const bp2 = this.ctx.createBiquadFilter();
    bp2.type = "bandpass"; bp2.frequency.value = 1150; bp2.Q.value = 6;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.35, now + 0.4);
    env.gain.exponentialRampToValueAtTime(0.0005, now + dur);
    osc.connect(bp1); bp1.connect(bp2); bp2.connect(env);
    env.connect(panner); panner.connect(this.convolver);
    osc.start(now); osc.stop(now + dur);
    this._trackVoice(dur * 1000 + 100);
  }
  playDrip() {
    if (!this._canPlay()) return;
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const t = this.ctx.currentTime + i * (0.7 + Math.random() * 0.8);
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = (Math.random() * 1.4) - 0.7;
      const osc = this.ctx.createOscillator(); osc.type = "sine";
      const base = 900 + Math.random() * 400;
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 0.55, t + 0.08);
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.45, t + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
      osc.connect(env); env.connect(panner); panner.connect(this.convolver);
      osc.start(t); osc.stop(t + 0.15);
    }
  }
  playMorse() {
    if (!this._canPlay()) return;
    const pattern = [1,0,1,1,0,1,0,1,1,1,0,1];
    const unit = 0.09;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = (Math.random() * 1.2) - 0.6;
    let t = this.ctx.currentTime;
    pattern.forEach(p => {
      if (p === 1) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.crackleBuffer;
        const bp = this.ctx.createBiquadFilter();
        bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 4;
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(0.3, t + 0.005);
        env.gain.exponentialRampToValueAtTime(0.0005, t + unit);
        src.connect(bp); bp.connect(env); env.connect(panner); panner.connect(this.dryGain);
        src.start(t); src.stop(t + unit + 0.02);
      }
      t += unit * 1.5;
    });
  }
  playStepBehind() {
    if (!this._canPlay()) return;
    const pan = pointer.normX > 0 ? -0.9 : 0.9;
    for (let i = 0; i < 4; i++) {
      const t = this.ctx.currentTime + i * 0.42;
      const src = this.ctx.createBufferSource();
      src.buffer = this.ambientBuffer;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 160;
      const g = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = pan;
      g.gain.setValueAtTime(0.7, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      src.connect(lp); lp.connect(g); g.connect(panner); panner.connect(this.dryGain);
      src.start(t); src.stop(t + 0.24);
    }
    this._trackVoice(2000);
  }
  playWoodCreak() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime, dur = 0.8 + Math.random() * 0.9;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = (Math.random() * 1.5) - 0.75;
    const osc = this.ctx.createOscillator(); osc.type = "sawtooth";
    const base = 180 + Math.random() * 140;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.linearRampToValueAtTime(base * 1.45, now + dur * 0.4);
    osc.frequency.linearRampToValueAtTime(base * 0.82, now + dur);
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = base * 2.1; bp.Q.value = 9.0;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.14, now + 0.12);
    env.gain.exponentialRampToValueAtTime(0.0005, now + dur);
    osc.connect(bp); bp.connect(env); env.connect(panner);
    panner.connect(this.dryGain); panner.connect(this.convolver);
    osc.start(now); osc.stop(now + dur + 0.03);
    this._trackVoice(dur * 1000 + 100);
  }
  playWallScratching() {
    if (!this._canPlay()) return;
    const strokes = 3 + Math.floor(Math.random() * 3);
    const pan = (Math.random() * 1.6) - 0.8;
    for (let i = 0; i < strokes; i++) {
      const t = this.ctx.currentTime + i * (0.18 + Math.random() * 0.14);
      const dur = 0.14 + Math.random() * 0.08;
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = pan;
      const src = this.ctx.createBufferSource();
      src.buffer = this.crackleBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(2400 + Math.random() * 900, t);
      bp.frequency.exponentialRampToValueAtTime(1100, t + dur);
      bp.Q.value = 8.0;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.001, t);
      env.gain.linearRampToValueAtTime(0.4, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0005, t + dur);
      src.connect(bp); bp.connect(env); env.connect(panner);
      panner.connect(this.dryGain); panner.connect(this.convolver);
      src.start(t); src.stop(t + dur + 0.02);
    }
  }
  playTick() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.crackleBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1900; bp.Q.value = 18;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 0.04);
    src.connect(bp); bp.connect(g); g.connect(this.dryGain);
    src.start(now); src.stop(now + 0.045);
  }
  playElectricSparkSound() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.09;
      const src = this.ctx.createBufferSource();
      src.buffer = this.crackleBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(3200 + Math.random() * 1400, t);
      bp.Q.value = 3.5;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.55, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
      src.connect(bp); bp.connect(g);
      g.connect(this.dryGain); g.connect(this.convolver);
      src.start(t); src.stop(t + 0.14);
    }
  }
  playSteelChains(panOverride = null) {
    if (!this._canPlay()) return;
    const count = 8 + Math.floor(Math.random() * 6);
    const pan = panOverride !== null ? panOverride : (Math.random() * 1.6) - 0.8;
    for (let i = 0; i < count; i++) {
      const t = this.ctx.currentTime + i * (0.045 + Math.random() * 0.07);
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan + (Math.random() - 0.5) * 0.25));
      const hit = this.ctx.createBufferSource();
      hit.buffer = this.crackleBuffer;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.001, t);
      env.gain.linearRampToValueAtTime(0.6, t + 0.003);
      env.gain.exponentialRampToValueAtTime(0.0005, t + 0.05);
      [1450, 2320, 3780, 5120].forEach((freq, idx) => {
        const bp = this.ctx.createBiquadFilter();
        bp.type = "bandpass"; bp.frequency.value = freq + Math.random() * 150;
        bp.Q.value = 55 + idx * 15;
        const g = this.ctx.createGain();
        g.gain.value = 1.4 / (idx + 1);
        hit.connect(env); env.connect(bp); bp.connect(g); g.connect(panner);
      });
      panner.connect(this.dryGain); panner.connect(this.convolver);
      hit.start(t); hit.stop(t + 0.32);
    }
  }
  playSubterraneanRumble() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime, dur = 4.2 + Math.random() * 2.0;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = (Math.random() * 1.4) - 0.7;

    const src1 = this.ctx.createBufferSource();
    src1.buffer = this.ambientBuffer; src1.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(36, now);
    lp.frequency.exponentialRampToValueAtTime(78, now + dur * 0.45);
    lp.frequency.exponentialRampToValueAtTime(30, now + dur);
    lp.Q.value = 3.5;

    const src2 = this.ctx.createBufferSource();
    src2.buffer = this.ambientBuffer; src2.loop = true;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(115 + Math.random() * 45, now);
    bp.frequency.exponentialRampToValueAtTime(68, now + dur);
    bp.Q.value = 8.5;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.55, now + 1.1);
    env.gain.linearRampToValueAtTime(0.32, now + dur * 0.65);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src1.connect(lp); lp.connect(env);
    src2.connect(bp); bp.connect(env);
    env.connect(panner); panner.connect(this.dryGain); panner.connect(this.convolver);
    src1.start(now); src1.stop(now + dur + 0.05);
    src2.start(now); src2.stop(now + dur + 0.05);
    this._trackVoice(dur * 1000 + 200);
  }
  playMetallicGroan() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime, dur = 2.6 + Math.random() * 1.4;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = (Math.random() * 1.6) - 0.8;
    const src = this.ctx.createBufferSource();
    src.buffer = this.crackleBuffer; src.loop = true;
    const bp1 = this.ctx.createBiquadFilter();
    bp1.type = "bandpass";
    const fStart = 390 + Math.random() * 180;
    bp1.frequency.setValueAtTime(fStart, now);
    bp1.frequency.exponentialRampToValueAtTime(fStart * 0.62, now + dur);
    bp1.Q.value = 28;
    const bp2 = this.ctx.createBiquadFilter();
    bp2.type = "bandpass";
    bp2.frequency.setValueAtTime(fStart * 1.62, now);
    bp2.frequency.exponentialRampToValueAtTime(fStart * 0.95, now + dur);
    bp2.Q.value = 34;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.24, now + 0.45);
    env.gain.exponentialRampToValueAtTime(0.0004, now + dur);
    src.connect(bp1); bp1.connect(env);
    src.connect(bp2); bp2.connect(env);
    env.connect(panner); panner.connect(this.convolver);
    src.start(now); src.stop(now + dur + 0.05);
    this._trackVoice(dur * 1000 + 200);
  }
  playPanicBurst() {
    if (!this.ctx || !this.enabled) return;
    this.duckForPanic();
    this.playHeartbeatPulse(1.0);
    setTimeout(() => this.playHeartbeatPulse(1.0), 480);
    setTimeout(() => {
      const r = Math.random();
      if (r < 0.4) this.playDistantCry();
      else if (r < 0.7) this.playWallScratching();
      else this.playWhisper();
    }, 170);
    setTimeout(() => this.playWoodCreak(), 620);
    setTimeout(() => this.playStepBehind(), 1200);
  }
  playFootsteps() {
    if (!this.ctx || !this.enabled) return;
    for (let i = 0; i < 4; i++) {
      const t = this.ctx.currentTime + i * 0.35;
      const src = this.ctx.createBufferSource();
      src.buffer = this.ambientBuffer;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(130, t);
      lp.frequency.exponentialRampToValueAtTime(38, t + 0.18);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.8, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      src.connect(lp); lp.connect(g);
      g.connect(this.dryGain); g.connect(this.convolver);
      src.start(t); src.stop(t + 0.24);
    }
  }
  triggerRandomAmbient() {
    if (!this._canPlay()) return;
    const pools = [
      ['shriek', 'creak', 'scratch', 'whisper'],
      ['chains', 'shriek', 'creak', 'whisper', 'step'],
      ['creak', 'scratch', 'cry', 'rumble'],
      ['drip', 'whisper', 'creak', 'scratch'],
      ['morse', 'rumble', 'shriek', 'chains'],
      ['drip', 'whisper', 'rumble', 'breathing'],
      ['rumble', 'creak', 'scratch', 'shriek'],
      ['chains', 'cry', 'rumble', 'step'],
      ['whisper', 'breathing', 'creak', 'shriek'],
      ['whisper', 'cry', 'scratch', 'rumble', 'breathing']
    ];
    const pool = pools[currentRoomIndex] || pools[0];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const fn = {
      shriek: () => this.playDistantShriek(), creak: () => this.playWoodCreak(),
      scratch: () => this.playWallScratching(), chains: () => this.playSteelChains(),
      rumble: () => (Math.random() < 0.5 ? this.playSubterraneanRumble() : this.playMetallicGroan()), whisper: () => this.playWhisper(),
      cry: () => this.playDistantCry(), drip: () => this.playDrip(),
      morse: () => this.playMorse(), step: () => this.playStepBehind(),
      breathing: () => this.playBreathing()
    }[pick];
    if (fn) fn();
  }
  startEnvironmentalScheduler() {
    if (this.scheduler) clearInterval(this.scheduler);
    this.scheduler = setInterval(() => {
      if (document.hidden) return;
      if (this.enabled && Math.random() < 0.82) this.triggerRandomAmbient();
    }, 4800);
  }
  destroy() {
    if (this.scheduler) { clearInterval(this.scheduler); this.scheduler = null; }
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
  }
}
const audioEngine = new DarkAmbientAudio();

/* ============================================================
   КАНВАСЫ, GIF-СЛОЙ И ВИДЕО КАТУШЕК
============================================================ */
const glCanvas = document.getElementById("gl-canvas");
const fxCanvas = document.getElementById("fx-canvas");
const fxCtx = fxCanvas.getContext("2d");
const gifRoomLayer = document.getElementById("gif-room-layer");
const tapeVideoWrap = document.getElementById("tape-video-wrap");
const tapeVideo = document.getElementById("tape-video");
let tapeAudioSourceNode = null;

function connectTapeVideoToAudio() {
  if (!audioEngine.ctx || !audioEngine.master || !tapeVideo || tapeAudioSourceNode) return;
  try {
    tapeAudioSourceNode = audioEngine.ctx.createMediaElementSource(tapeVideo);
    tapeAudioSourceNode.connect(audioEngine.master);
  } catch (e) {}
}
if (tapeVideo) {
  tapeVideo.addEventListener("ended", () => {
    const room0 = ROOMS[0];
    room0.tapePlaying = false;
    room0.tapeFinished = true;
    if (tapeVideoWrap) tapeVideoWrap.classList.remove("playing");
  });
}
function syncTapeVideo() {
  if (!tapeVideo || !tapeVideoWrap) return;
  const room = ROOMS[currentRoomIndex];
  const shouldPlay = room.id === 0 && room.tapePlaying && !room.tapeFinished;
  if (shouldPlay) {
    tapeVideoWrap.classList.add("playing");
    tapeVideo.muted = !audioEngine.enabled;
    connectTapeVideoToAudio();
    if (tapeVideo.paused) {
      const p = tapeVideo.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  } else {
    tapeVideoWrap.classList.remove("playing");
    if (!tapeVideo.paused) tapeVideo.pause();
  }
}

/* ============================================================
   THREE.JS СЦЕНА: 2.5D ПЛОСКОСТЬ (КОМНАТЫ 1–9) + 360° СФЕРА (КОМНАТА 10)
============================================================ */
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 10);

scene.add(new THREE.AmbientLight(0x28322a, 0.85));
const spotLight = new THREE.SpotLight(0xffe6bd, 3.0, 35, Math.PI * 0.28, 0.72, 1.1);
spotLight.position.set(0, 0, 10);
scene.add(spotLight);
scene.add(spotLight.target);

const roomPlaneMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

const roomPlaneMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), roomPlaneMat);
scene.add(roomPlaneMesh);

const roomSphereGeo = new THREE.SphereGeometry(28, 64, 40);
roomSphereGeo.scale(-1, 1, 1);
const roomSphereMesh = new THREE.Mesh(roomSphereGeo, roomPlaneMat);
roomSphereMesh.visible = false;
scene.add(roomSphereMesh);

const view360 = {
  isDragging: false,
  lon: 145,
  lat: 5,
  targetLon: 145,
  targetLat: 5,
  downLon: 145,
  downLat: 5,
  downX: 0,
  downY: 0,
  lastX: 0,
  lastY: 0,
  lastTime: 0,
  velX: 0,
  velY: 0,
  maxLatOffset: 68
};

function clamp360Angles() {
  view360.targetLat = Math.max(-view360.maxLatOffset, Math.min(view360.maxLatOffset, view360.targetLat));
}

function updateCameraForActiveMode(timeMs, dt, camX, camY, camZ) {
  const room = ROOMS[currentRoomIndex];
  const is360 = Boolean(room && room.is360EditorRoom);

  roomPlaneMesh.visible = !is360;
  roomSphereMesh.visible = is360;

  if (!is360) {
    camera.fov = 42;
    camera.updateProjectionMatrix();
    camera.position.set(camX, camY, camZ);
    camera.lookAt(camX * 0.35, camY * 0.35, 0);
    return;
  }

  if (camera.fov !== 68) {
    camera.fov = 68;
    camera.updateProjectionMatrix();
  }

  if (view360.isDragging) {
    const k = 1 - Math.pow(1 - 0.35, dt);
    view360.lon += (view360.targetLon - view360.lon) * k;
    view360.lat += (view360.targetLat - view360.lat) * k;
  } else {
    if (Math.abs(view360.velX) > 0.005 || Math.abs(view360.velY) > 0.005) {
      view360.targetLon -= view360.velX * 6.5 * dt;
      view360.targetLat += view360.velY * 5.0 * dt;
      clamp360Angles();
      view360.velX *= Math.pow(0.87, dt);
      view360.velY *= Math.pow(0.87, dt);
    }
    const k = 1 - Math.pow(1 - 0.16, dt);
    view360.lon += (view360.targetLon - view360.lon) * k;
    view360.lat += (view360.targetLat - view360.lat) * k;
  }

  view360.lat = Math.max(-view360.maxLatOffset, Math.min(view360.maxLatOffset, view360.lat));
  const phi = THREE.MathUtils.degToRad(90 - view360.lat);
  const theta = THREE.MathUtils.degToRad(view360.lon);
  const radius = 28;
  camera.position.set(0, 0, 0.1);
  camera.lookAt(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/* ============================================================
   GOD RAYS И PRELOADER LENS (ДЛЯ 2.5D КОМНАТ)
============================================================ */
function buildGodRaysRig() {
  const group = new THREE.Group();
  const rayMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0.24 },
      uColor: { value: new THREE.Color(0x9fb89d) }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      uniform float uTime;
      uniform float uIntensity;
      uniform vec3 uColor;
      void main() {
        float fresnel = pow(abs(dot(vNormalView, vViewDir)), 1.65);
        float along = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.12, vUv.y);
        float edgeFade = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
        float shimmer = 0.78 + 0.22 * sin(uTime * 0.85 + vUv.x * 14.0 + vUv.y * 5.0);
        float alpha = fresnel * along * edgeFade * shimmer * uIntensity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `
  });

  const beamGeo = new THREE.PlaneGeometry(2.6, 8.5, 1, 1);
  const beam1 = new THREE.Mesh(beamGeo, rayMat);
  beam1.position.set(3.2, 0.8, 1.35);
  beam1.rotation.z = 0.42;
  beam1.rotation.y = -0.25;
  group.add(beam1);

  const beam2 = new THREE.Mesh(beamGeo, rayMat);
  beam2.position.set(1.6, 1.4, 1.05);
  beam2.rotation.z = 0.34;
  beam2.rotation.y = -0.15;
  beam2.scale.set(0.68, 0.86, 1.0);
  group.add(beam2);

  return { group, rayMat };
}

const godRaysRig = buildGodRaysRig();
scene.add(godRaysRig.group);

function createRefractionNormalCanvas() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  const img = g.createImageData(256, 256);
  const d = img.data;
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const nx = x / 256;
      const ny = y / 256;
      const wave = Math.sin(nx * Math.PI * 10 + ny * Math.PI * 6) * 0.5 +
                   Math.cos(nx * Math.PI * 18 - ny * Math.PI * 14) * 0.5;
      const b = Math.max(0, Math.min(255, Math.floor(128 + wave * 90)));
      const idx = (y * 256 + x) * 4;
      d[idx] = b;
      d[idx + 1] = b;
      d[idx + 2] = 255;
      d[idx + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const refractionBumpTex = createRefractionNormalCanvas();
const physicalLensMat = new THREE.MeshPhysicalMaterial({
  color: 0x8fa899,
  roughness: 0.18,
  metalness: 0.05,
  ior: 1.48,
  reflectivity: 0.85,
  bumpMap: refractionBumpTex,
  bumpScale: 0.035,
  transparent: true,
  opacity: 0.24
});
if ("transmission" in physicalLensMat) {
  physicalLensMat.transmission = 0.55;
}
const refractionLensMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 2), physicalLensMat);
refractionLensMesh.position.set(-2.6, -1.1, 1.55);
scene.add(refractionLensMesh);

const proceduralTextureCache = {};

/* ============================================================
   СОСТОЯНИЕ ИГРЫ
============================================================ */
let currentRoomIndex = 0;
let freeMode = false;
let flashlightOn = true;
const roomTextures = {};
const roomHallucinationTextures = {};
const roomImageDims = {};
const roomTickFlags = {};

/* ============================================================
   СИСТЕМА ГАЛЛЮЦИНАЦИЙ
============================================================ */
const HALLUCINATION_DELAYS_MS = [60000, 75000, 105000];
const hallucinationState = {
  roomIdx: -1,
  phase: "idle",
  nextTriggerAt: 0,
  phaseStartedAt: 0,
  holdDurationMs: 12000,
  flashSeqMs: [0, 140, 290, 460, 620],
  flashAlpha: 0,
  heartbeatTimer: null
};

function scheduleNextHallucination(roomIdx, customDelayMs = null) {
  const room = ROOMS[roomIdx];
  if (!room || !room.hallucinationFileName) {
    hallucinationState.roomIdx = -1;
    hallucinationState.phase = "idle";
    hallucinationState.nextTriggerAt = 0;
    hallucinationState.flashAlpha = 0;
    return;
  }
  const delay = customDelayMs !== null
    ? customDelayMs
    : HALLUCINATION_DELAYS_MS[Math.floor(Math.random() * HALLUCINATION_DELAYS_MS.length)];
  hallucinationState.roomIdx = roomIdx;
  hallucinationState.phase = "idle";
  hallucinationState.nextTriggerAt = performance.now() + delay;
  hallucinationState.flashAlpha = 0;
}

function stopHallucinationHeartbeat() {
  if (hallucinationState.heartbeatTimer) {
    clearInterval(hallucinationState.heartbeatTimer);
    hallucinationState.heartbeatTimer = null;
  }
}

function startHallucinationHeartbeat() {
  stopHallucinationHeartbeat();
  if (audioEngine.enabled) audioEngine.playHeartbeatPulse(1.0);
  hallucinationState.heartbeatTimer = setInterval(() => {
    if (document.hidden || hallucinationState.phase === "idle") {
      stopHallucinationHeartbeat();
      return;
    }
    if (audioEngine.enabled) audioEngine.playHeartbeatPulse(1.0);
  }, 540);
}

function triggerHallucinationNow(now = performance.now()) {
  const room = ROOMS[currentRoomIndex];
  if (!room || !room.hallucinationFileName) return;
  if (hallucinationState.phase !== "idle") return;

  const flashCount = Math.random() < 0.5 ? 2 : 3;
  hallucinationState.roomIdx = currentRoomIndex;
  hallucinationState.phase = "flash_in";
  hallucinationState.phaseStartedAt = now;
  hallucinationState.holdDurationMs = 10000 + Math.floor(Math.random() * 5001);
  hallucinationState.flashSeqMs = flashCount === 2 ? [0, 150, 320, 490] : [0, 130, 270, 420, 580, 740];

  startHallucinationHeartbeat();
  if (audioEngine.enabled) audioEngine.playWhisper();
}

function createHallucinationFallbackTexture(room) {
  const base = roomTextures[room.id] || proceduralTextureCache[room.id];
  const c = document.createElement("canvas");
  c.width = 1600;
  c.height = 900;
  const g = c.getContext("2d");

  if (base && base.image) {
    try { g.drawImage(base.image, 0, 0, 1600, 900); } catch (e) {}
  } else {
    g.fillStyle = "#111310";
    g.fillRect(0, 0, 1600, 900);
  }

  const bx = 680, by = 690;
  const vig = g.createRadialGradient(bx, by, 20, bx, by, 280);
  vig.addColorStop(0, "rgba(65, 10, 8, 0.42)");
  vig.addColorStop(1, "rgba(0, 0, 0, 0)");
  g.fillStyle = vig;
  g.fillRect(bx - 280, by - 280, 560, 560);

  g.fillStyle = "#3c2a1d";
  g.beginPath(); g.ellipse(bx, by + 25, 58, 72, 0.08, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(bx - 6, by - 62, 46, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(bx - 42, by - 96, 17, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(bx + 30, by - 94, 17, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(bx - 56, by + 18, 22, 34, 0.5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(bx + 54, by + 22, 22, 34, -0.45, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(bx - 36, by + 84, 24, 30, -0.3, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(bx + 42, by + 82, 24, 30, 0.35, 0, Math.PI * 2); g.fill();

  g.fillStyle = "rgba(115, 10, 10, 0.86)";
  g.beginPath(); g.ellipse(bx - 4, by - 36, 26, 20, 0.1, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(bx + 4, by + 12, 32, 36, -0.1, 0, Math.PI * 2); g.fill();

  g.fillStyle = "#060505";
  g.beginPath(); g.arc(bx - 20, by - 66, 7, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(bx + 10, by - 64, 7, 0, Math.PI * 2); g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

function updateHallucinationSystem(time) {
  const room = ROOMS[currentRoomIndex];
  if (!room || !room.hallucinationFileName || transition.active) {
    hallucinationState.flashAlpha = 0;
    return;
  }

  if (hallucinationState.roomIdx !== currentRoomIndex) {
    scheduleNextHallucination(currentRoomIndex);
    return;
  }

  const seq = hallucinationState.flashSeqMs;
  const totalFlashDur = seq[seq.length - 1] + 130;

  if (hallucinationState.phase === "idle") {
    hallucinationState.flashAlpha = 0;
    if (hallucinationState.nextTriggerAt > 0 && time >= hallucinationState.nextTriggerAt) {
      triggerHallucinationNow(time);
    }
  } else if (hallucinationState.phase === "flash_in") {
    const elapsed = time - hallucinationState.phaseStartedAt;
    let activePulse = 0;
    for (let i = 0; i < seq.length; i += 2) {
      const start = seq[i];
      const end = (seq[i + 1] || start + 120) + 50;
      if (elapsed >= start && elapsed <= end) {
        activePulse = 1;
        break;
      }
    }
    hallucinationState.flashAlpha = activePulse ? 0.92 : 0.0;

    if (elapsed >= (seq[2] || 260) && !hallucinationState.swappedToAlt) {
      hallucinationState.swappedToAlt = true;
      applyRoomTexture(currentRoomIndex, true);
    }

    if (elapsed >= totalFlashDur) {
      hallucinationState.phase = "active";
      hallucinationState.phaseStartedAt = time;
      hallucinationState.flashAlpha = 0;
      applyRoomTexture(currentRoomIndex, true);
    }
  } else if (hallucinationState.phase === "active") {
    hallucinationState.flashAlpha = 0;
    if (time - hallucinationState.phaseStartedAt >= hallucinationState.holdDurationMs) {
      const flashCount = Math.random() < 0.5 ? 2 : 3;
      hallucinationState.phase = "flash_out";
      hallucinationState.phaseStartedAt = time;
      hallucinationState.flashSeqMs = flashCount === 2 ? [0, 150, 320, 490] : [0, 130, 270, 420, 580, 740];
    }
  } else if (hallucinationState.phase === "flash_out") {
    const elapsed = time - hallucinationState.phaseStartedAt;
    let activePulse = 0;
    for (let i = 0; i < seq.length; i += 2) {
      const start = seq[i];
      const end = (seq[i + 1] || start + 120) + 50;
      if (elapsed >= start && elapsed <= end) {
        activePulse = 1;
        break;
      }
    }
    hallucinationState.flashAlpha = activePulse ? 0.92 : 0.0;

    if (elapsed >= (seq[2] || 260) && hallucinationState.swappedToAlt) {
      hallucinationState.swappedToAlt = false;
      applyRoomTexture(currentRoomIndex, false);
    }

    if (elapsed >= totalFlashDur) {
      hallucinationState.flashAlpha = 0;
      hallucinationState.swappedToAlt = false;
      applyRoomTexture(currentRoomIndex, false);
      stopHallucinationHeartbeat();
      scheduleNextHallucination(currentRoomIndex);
    }
  }
}

const pointer = {
  x: window.innerWidth * 0.5, y: window.innerHeight * 0.5,
  targetX: window.innerWidth * 0.5, targetY: window.innerHeight * 0.5,
  normX: 0, normY: 0,
  isTouchInput: false
};
const transition = { active: false, phase: "none", progress: 0, targetRoom: 0, focusX: 0.5, focusY: 0.5 };
const entityState = { visible: false, opacity: 0, targetOpacity: 0, evading: false, timer: 0, spot: { x: 0.59, y: 0.52, scale: 1.0 } };
const layout = { planeW: 16, planeH: 9, viewW: 16, viewH: 9 };

const PANIC_CHANCE_PER_CLICK = 0.055;
const PANIC_COOLDOWN_MS      = 26000;
const PANIC_DURATION_MS      = 6800;
const panicState = {
  active: false, startedAt: 0, duration: PANIC_DURATION_MS,
  lastTriggeredAt: -PANIC_COOLDOWN_MS, intensity: 0, dread: 0
};

const ENDINGS = {
  loop: {
    id: "loop",
    btnId: "btn-ending-loop",
    tag: "КОНЦОВКА I // ЗАМКНУТЫЙ КРУГ ПАМЯТИ",
    subtitle: "Вы сами оставили эти следы, пытаясь забыть ту ночь",
    text: "Мокрые тапочки у порога, царапины на штукатурке и голос на плёнке принадлежат вам. Вы уже пытались сбежать из этого дома раньше — и сами спрятали ключи, чтобы не встретиться с тем, что сделали. Дверь щёлкает, но за ней снова тянется знакомый сырой коридор, а счётчик попыток начинает тикать заново."
  },
  archive: {
    id: "archive",
    btnId: "btn-ending-archive",
    tag: "КОНЦОВКА II // АРХИВ НАБЛЮДЕНИЯ",
    subtitle: "Особняк не держит вас — он записывает каждый ваш срыв",
    text: "Каждая вспышка паники, каждый взгляд в темноту и каждый открытый тайник фиксировались стенами. Вы понимаете, что особняк работает как жуткий архив-установка, где комнаты считывают человеческий страх. Выход не выводит на улицу: вы остаётесь внутри системы — уже не жертвой, а новым наблюдателем за следующим вошедшим."
  },
  break: {
    id: "break",
    btnId: "btn-ending-break",
    tag: "КОНЦОВКА III // ПРОБУЖДЕНИЕ В ТРЕВОГЕ",
    subtitle: "Вы вырвались наверх, но эхо дома осталось с вами",
    text: "Пройдя сквозь сырой подвал и ловушки памяти, вы выталкиваете тяжёлый засов наружу. Холодный воздух бьёт в лицо, особняк остаётся позади — но в тишине по-прежнему слышится глухой пульс, скрип половиц и чьё-то дыхание за спиной. Полного покоя больше не будет."
  }
};

let unlockedEndings = [];
let selectedEndingId = "loop";
let panicEpisodesCount = 0;
let basementDescendedOnce = false;

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      solved: ROOMS.map(r => r.solved),
      solvedOnce: ROOMS.map(r => Boolean(r.solvedOnce)),
      currentRoom: currentRoomIndex,
      freeMode, flashlightOn,
      unlockedEndings,
      selectedEndingId,
      panicEpisodesCount,
      basementDescendedOnce
    }));
  } catch (e) {}
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.solved)) data.solved.forEach((s, i) => { if (ROOMS[i]) ROOMS[i].solved = Boolean(s); });
    if (Array.isArray(data.solvedOnce)) data.solvedOnce.forEach((s, i) => { if (ROOMS[i]) ROOMS[i].solvedOnce = Boolean(s); });
    if (typeof data.currentRoom === "number" && data.currentRoom >= 0 && data.currentRoom < ROOMS.length) currentRoomIndex = data.currentRoom;
    if (typeof data.freeMode === "boolean") freeMode = data.freeMode;
    if (typeof data.flashlightOn === "boolean") flashlightOn = data.flashlightOn;
    if (Array.isArray(data.unlockedEndings)) unlockedEndings = data.unlockedEndings.filter(id => Boolean(ENDINGS[id]));
    if (typeof data.selectedEndingId === "string" && ENDINGS[data.selectedEndingId]) selectedEndingId = data.selectedEndingId;
    if (typeof data.panicEpisodesCount === "number") panicEpisodesCount = data.panicEpisodesCount;
    if (typeof data.basementDescendedOnce === "boolean") basementDescendedOnce = data.basementDescendedOnce;
  } catch (e) {}
}

function inferEndingFromRun() {
  if (basementDescendedOnce) return "break";
  if (panicEpisodesCount >= 2) return "archive";
  return "loop";
}

function renderEndingModal(endingId = null) {
  const chosenId = endingId && ENDINGS[endingId] ? endingId : selectedEndingId;
  selectedEndingId = chosenId;
  const info = ENDINGS[chosenId];

  if (!unlockedEndings.includes(chosenId)) {
    unlockedEndings.push(chosenId);
  }
  saveProgress();

  const tagEl = document.getElementById("final-ending-tag");
  const subEl = document.getElementById("ending-subtitle");
  const narEl = document.getElementById("ending-narrative");
  const stEl  = document.getElementById("endings-unlocked-status");

  if (tagEl) tagEl.textContent = info.tag;
  if (subEl) subEl.textContent = info.subtitle;
  if (narEl) narEl.textContent = info.text;
  if (stEl)  stEl.textContent = `Открыто концовок: ${unlockedEndings.length} / 3 (срывов паники: ${panicEpisodesCount}, спуск в подвал: ${basementDescendedOnce ? "да" : "нет"})`;

  Object.values(ENDINGS).forEach(item => {
    const b = document.getElementById(item.btnId);
    if (!b) return;
    const isSel = item.id === chosenId;
    const isUnl = unlockedEndings.includes(item.id);
    b.classList.toggle("active", isSel);
    b.textContent = `${item.id === "loop" ? "I. ПЕТЛЯ ВИНЫ" : item.id === "archive" ? "II. АРХИВ / ЭКСПОНАТ" : "III. ПРОБУЖДЕНИЕ"}${isUnl ? " ✓" : ""}`;
  });
}

function openFinalModalWithSmartDefault() {
  const inferred = inferEndingFromRun();
  renderEndingModal(inferred);
  openModalEl(document.getElementById("final-modal"));
}
function resetProgress() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

/* ============================================================
   ФОНАРЬ 2D (ШИРОКИЙ AAA-ЛУЧ + ПЕРИФЕРИЙНАЯ ВИДИМОСТЬ)
============================================================ */
let flashlightSprite = null;
let flashlightSpriteRad = 0;
function ensureFlashlightSprite() {
  const rad = Math.min(window.innerWidth, window.innerHeight) * FLASHLIGHT_RATIO;
  if (flashlightSprite && Math.abs(rad - flashlightSpriteRad) < 0.5) return;
  flashlightSpriteRad = rad;
  const size = Math.ceil(rad * 2);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(rad, rad, rad * 0.16, rad, rad, rad);
  grad.addColorStop(0, "rgba(0, 0, 0, 1)");
  grad.addColorStop(0.55, "rgba(0, 0, 0, 0.78)");
  grad.addColorStop(0.82, "rgba(0, 0, 0, 0.34)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  flashlightSprite = c;
}

function getMarkerScreenPos(markerObj, w, h, t2D) {
  const room = ROOMS[currentRoomIndex];
  if (room && room.is360EditorRoom && typeof markerObj.u === "number") {
    const worldPt = uvToScenePosEditor(room, markerObj.u, markerObj.v, 25.5);
    worldPt.project(camera);
    if (worldPt.z > 1) return { x: -9999, y: -9999 };
    return {
      x: (worldPt.x * 0.5 + 0.5) * w,
      y: (-worldPt.y * 0.5 + 0.5) * h
    };
  }
  return {
    x: t2D.offsetX + (markerObj.x ?? markerObj.u ?? 0.5) * t2D.scaleX,
    y: t2D.offsetY + (markerObj.y ?? markerObj.v ?? 0.5) * t2D.scaleY
  };
}

function getOverlayTransform(w, h) {
  const scaleX = (layout.planeW / layout.viewW) * w;
  const scaleY = (layout.planeH / layout.viewH) * h;
  return {
    scaleX, scaleY,
    offsetX: (w - scaleX) * 0.5 - pointer.normX * 16,
    offsetY: (h - scaleY) * 0.5 - pointer.normY * 11
  };
}

function resizeAll() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  fxCanvas.width  = Math.floor(window.innerWidth * dpr);
  fxCanvas.height = Math.floor(window.innerHeight * dpr);
  fxCanvas.style.width  = window.innerWidth + "px";
  fxCanvas.style.height = window.innerHeight + "px";
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ensureFlashlightSprite();
}
window.addEventListener("resize", resizeAll);
resizeAll();

/* ============================================================
   ТЕКСТУРЫ КОМНАТ ИЗ РЕПОЗИТОРИЯ
============================================================ */
function createTextureFromImageSource(img, roomIdx) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return false;
  const tex = new THREE.Texture(img);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false; tex.needsUpdate = true;
  if (roomTextures[roomIdx] && roomTextures[roomIdx] !== proceduralTextureCache[roomIdx]) roomTextures[roomIdx].dispose();
  roomTextures[roomIdx] = tex;
  roomImageDims[roomIdx] = { w, h };
  if (roomIdx === currentRoomIndex) applyRoomTexture(roomIdx);
  return true;
}

function drawFallbackHint(g, room) {
  const hints = {
    0: { text: "F = 442 Hz", x: 0.14, y: 0.36, size: 32, rot: -0.05, sub: "несущая частота плёнки" },
    1: { text: "I · IV · VII · IX", x: 0.68, y: 0.34, size: 26, rot: 0.04, sub: "порядок дисков" },
    2: { text: "Л: 6 кг  =  П: 6 кг", x: 0.48, y: 0.60, size: 26, rot: -0.03, sub: "уравновесить чаши" },
    3: { text: "A = 3  ·  B = 1", x: 0.50, y: 0.42, size: 28, rot: 0.02, sub: "пропорция дозатора" },
    4: { text: "R · R · R · L · L", x: 0.82, y: 0.42, size: 24, rot: 0.06, sub: "обороты штурвала" },
    5: { text: "НЕ СМОТРИ", x: 0.72, y: 0.52, size: 30, rot: -0.02, sub: "выцарапано над водой" },
    6: { text: "618", x: 0.44, y: 0.76, size: 36, rot: -0.04, sub: "процарапано в золе" },
    7: { text: "I - III - IX - X", x: 0.40, y: 0.72, size: 28, rot: 0.0, sub: "выбито на плите пола" },
    8: { text: "9 / 4", x: 0.62, y: 0.14, size: 28, rot: 0.03, sub: "в проломе потолка" },
    9: { text: "4 - 0 - 9", x: 0.45, y: 0.45, size: 30, rot: -0.02, sub: "код релейного щитка" }
  };
  const h = hints[room.id];
  if (!h) return;
  g.save();
  g.translate(h.x * 1280, h.y * 720);
  g.rotate(h.rot);
  g.font = `bold ${h.size}px 'Courier New', monospace`;
  g.fillStyle = "rgba(10, 8, 7, 0.85)";
  g.fillText(h.text, 2, 2);
  g.fillStyle = "rgba(210, 195, 170, 0.55)";
  g.fillText(h.text, 0, 0);
  g.font = `italic 13px 'Courier New', monospace`;
  g.fillStyle = "rgba(160, 148, 130, 0.45)";
  g.fillText(h.sub, 0, h.size * 0.9);
  g.restore();
}

function createProceduralTexture(room) {
  const c = document.createElement("canvas");
  c.width = 1280; c.height = 720;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(640, 320, 40, 640, 360, 780);
  grad.addColorStop(0, room.palette.wall);
  grad.addColorStop(1, "#020302");
  g.fillStyle = grad; g.fillRect(0, 0, 1280, 720);
  const px = 1280 * (room.portal.x || 0.5), py = 720 * (room.portal.y || 0.5);
  g.strokeStyle = "rgba(120, 138, 115, 0.18)"; g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 0); g.lineTo(px - 110, py - 150);
  g.moveTo(1280, 0); g.lineTo(px + 110, py - 150);
  g.moveTo(0, 720); g.lineTo(px - 110, py + 150);
  g.moveTo(1280, 720); g.lineTo(px + 110, py + 150);
  g.stroke();
  g.fillStyle = "#010201";
  g.fillRect(px - 110, py - 150, 220, 300);
  if (room.id === 0) {
    const sx = 1280 * 0.25, sy = 720 * 0.72;
    g.fillStyle = "rgba(8, 12, 10, 0.75)";
    g.beginPath(); g.ellipse(sx, sy + 14, 58, 22, 0.08, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#3a3632";
    g.beginPath(); g.ellipse(sx - 18, sy, 14, 28, -0.18, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(sx + 18, sy + 4, 14, 28, 0.14, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#1e1c1a"; g.lineWidth = 2;
    g.stroke();
  }
  for (let i = 0; i < 50; i++) {
    const mx = Math.random() * 1280, my = Math.random() * 720, mr = 30 + Math.random() * 100;
    const mg = g.createRadialGradient(mx, my, 4, mx, my, mr);
    mg.addColorStop(0, i % 3 === 0 ? "rgba(65, 22, 14, 0.32)" : "rgba(10, 14, 10, 0.5)");
    mg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
  }
  drawFallbackHint(g, room);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

/* ============================================================
   ИНТЕРАКТИВНЫЕ 3D-СЛОИ РЕДАКТОРА (2.5D + 360°, ХРОМАКЕЙ, ЗВУКИ, УГЛЫ)
============================================================ */
const editor360ActiveObjects = [];
const editor360Raycaster = new THREE.Raycaster();
const editor360Ndc = new THREE.Vector2();
let activeCustomLayerAudio = null;

function uvToScenePosEditor(room, u, v, radius = 25.5) {
  if (!room || !room.is360EditorRoom) {
    const w = layout.planeW || 16;
    const h = layout.planeH || 9;
    return new THREE.Vector3((u - 0.5) * w, (0.5 - v) * h, 0.08);
  }
  const phi = v * Math.PI;
  const theta = u * Math.PI * 2;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

function hexToRgbNormEditor(hex) {
  const clean = (hex || "#00ff00").replace("#", "");
  const num = parseInt(clean, 16) || 0x00ff00;
  return new THREE.Vector3(
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255
  );
}

function applyCornerWarpEditor(geo, w, h, corners) {
  const c = corners || { tl: [0, 0], tr: [0, 0], br: [0, 0], bl: [0, 0] };
  const pTL = new THREE.Vector2((-0.5 + c.tl[0]) * w, ( 0.5 + c.tl[1]) * h);
  const pTR = new THREE.Vector2(( 0.5 + c.tr[0]) * w, ( 0.5 + c.tr[1]) * h);
  const pBR = new THREE.Vector2(( 0.5 + c.br[0]) * w, (-0.5 + c.br[1]) * h);
  const pBL = new THREE.Vector2((-0.5 + c.bl[0]) * w, (-0.5 + c.bl[1]) * h);

  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    const topX = pTL.x * (1 - u) + pTR.x * u;
    const topY = pTL.y * (1 - u) + pTR.y * u;
    const botX = pBL.x * (1 - u) + pBR.x * u;
    const botY = pBL.y * (1 - u) + pBR.y * u;
    pos.setXYZ(i, botX * (1 - v) + topX * v, botY * (1 - v) + topY * v, 0);
  }
  pos.needsUpdate = true;
  geo.computeBoundingSphere();
}

function createEditorLayerMaterial(cfg) {
  const mode = cfg.blendMode || (cfg.additiveBlend === false ? "alpha" : "additive");
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: mode === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uMap: { value: null },
      uOpacity: { value: 0.0 },
      uUseChroma: { value: mode === "chromakey" ? 1.0 : 0.0 },
      uKeyColor: { value: hexToRgbNormEditor(cfg.chromaKey?.color || "#00ff00") },
      uSimilarity: { value: cfg.chromaKey?.similarity ?? 0.36 },
      uSmoothness: { value: cfg.chromaKey?.smoothness ?? 0.10 },
      uSpill: { value: cfg.chromaKey?.spill ?? 0.65 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uOpacity;
      uniform float uUseChroma;
      uniform vec3 uKeyColor;
      uniform float uSimilarity;
      uniform float uSmoothness;
      uniform float uSpill;
      varying vec2 vUv;

      vec2 rgbToCbCr(vec3 c) {
        float cb = -0.168736 * c.r - 0.331264 * c.g + 0.5 * c.b;
        float cr =  0.5 * c.r - 0.418688 * c.g - 0.081312 * c.b;
        return vec2(cb, cr);
      }

      void main() {
        vec4 texColor = texture2D(uMap, vUv);
        float alpha = texColor.a;
        vec3 rgb = texColor.rgb;

        if (uUseChroma > 0.5) {
          vec2 pixCC = rgbToCbCr(rgb);
          vec2 keyCC = rgbToCbCr(uKeyColor);
          float dist = distance(pixCC, keyCC);
          float mask = smoothstep(uSimilarity, uSimilarity + uSmoothness, dist);
          alpha *= mask;

          float spillFactor = (1.0 - smoothstep(uSimilarity, uSimilarity + uSmoothness * 2.2, dist)) * uSpill;
          float luma = dot(rgb, vec3(0.299, 0.587, 0.114));
          rgb = mix(rgb, vec3(luma), spillFactor);
        }

        gl_FragColor = vec4(rgb, alpha * uOpacity);
      }
    `
  });
}

function clearEditor360Objects() {
  if (activeCustomLayerAudio) {
    try { activeCustomLayerAudio.pause(); } catch (e) {}
    activeCustomLayerAudio = null;
  }
  while (editor360ActiveObjects.length > 0) {
    const item = editor360ActiveObjects.pop();
    if (item.video) {
      try { item.video.pause(); item.video.removeAttribute("src"); item.video.load(); } catch (e) {}
    }
    if (item.mat?.uniforms?.uMap?.value) {
      try { item.mat.uniforms.uMap.value.dispose(); } catch (e) {}
    }
    if (item.mat) {
      try { item.mat.dispose(); } catch (e) {}
    }
    if (item.mesh?.geometry) {
      try { item.mesh.geometry.dispose(); } catch (e) {}
    }
    if (item.hitZone?.geometry) {
      try { item.hitZone.geometry.dispose(); } catch (e) {}
    }
    if (item.holder) scene.remove(item.holder);
  }
}

function playLayerConfiguredSound(cfg) {
  if (!audioEngine.enabled) return;
  const snd = cfg.sound || "tick";
  if (snd === "none") return;

  if (snd === "custom" && cfg.customSoundSrc) {
    if (activeCustomLayerAudio) {
      try { activeCustomLayerAudio.pause(); } catch (e) {}
    }
    const audio = new Audio(cfg.customSoundSrc);
    audio.volume = 0.88;
    audio.play().catch(() => {});
    activeCustomLayerAudio = audio;
    return;
  }

  const map = {
    spark: () => audioEngine.playElectricSparkSound(),
    tick: () => audioEngine.playTick(),
    chains: () => audioEngine.playSteelChains(0),
    creak: () => audioEngine.playWoodCreak(),
    whisper: () => audioEngine.playWhisper(),
    rumble: () => audioEngine.playSubterraneanRumble()
  };
  if (map[snd]) map[snd]();
}

function triggerEditor360Object(item) {
  if (!item || !item.cfg) return;
  playLayerConfiguredSound(item.cfg);

  if (item.cfg.type === "video" && item.video) {
    item.mat.uniforms.uOpacity.value = 1.0;
    item.video.currentTime = 0;
    const p = item.video.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } else if (item.cfg.type === "image") {
    const cur = item.mat.uniforms.uOpacity.value;
    item.mat.uniforms.uOpacity.value = cur > 0.5 ? 0.0 : 1.0;
  }

  if (item.cfg.action === "open_puzzle") {
    openPuzzleModal();
  } else if (item.cfg.action === "show_clue" && item.cfg.clueText) {
    openPuzzleModal();
    const fb = document.getElementById("modal-feedback");
    if (fb) fb.textContent = `УЛИКА: ${item.cfg.clueText}`;
  }
}

function mountEditor360ObjectsForRoom(room) {
  clearEditor360Objects();
  if (!room) return;

  const is360 = Boolean(room.is360EditorRoom);
  if (is360) {
    const startLon = room.startCamera ? room.startCamera.lon : 145;
    const startLat = room.startCamera ? room.startCamera.lat : 5;
    view360.lon = view360.targetLon = startLon;
    view360.lat = view360.targetLat = startLat;
    view360.velX = 0;
    view360.velY = 0;
    pointer.x = pointer.targetX = window.innerWidth * 0.5;
    pointer.y = pointer.targetY = window.innerHeight * 0.5;
  } else {
    updateWorldPlaneLayout();
  }

  const list = Array.isArray(room.editorInteractives) ? room.editorInteractives : [];
  if (list.length === 0) return;

  const radiusScale = is360 ? (25.5 / 460) : (1.0 / 65);

  list.forEach((cfg, idx) => {
    const radius = 25.5 - idx * 0.05;
    const holder = new THREE.Group();
    const u = cfg.position?.u ?? 0.5;
    const v = cfg.position?.v ?? 0.5;
    holder.position.copy(uvToScenePosEditor(room, u, v, radius));

    if (is360) holder.lookAt(0, 0, 0);
    else holder.rotation.set(0, 0, 0);

    holder.rotateZ(THREE.MathUtils.degToRad(cfg.rotationDeg || 0));
    const sx = (cfg.scaleX ?? cfg.scale ?? 1) * radiusScale;
    const sy = (cfg.scaleY ?? cfg.scale ?? 1) * radiusScale;
    holder.scale.set(sx, sy, 1);
    scene.add(holder);

    const w = cfg.size?.width ?? 160;
    const h = cfg.size?.height ?? 140;
    const mat = createEditorLayerMaterial(cfg);
    const geo = new THREE.PlaneGeometry(w, h, 16, 16);
    applyCornerWarpEditor(geo, w, h, cfg.corners);

    const mesh = new THREE.Mesh(geo, mat);
    const hitZone = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 1.35, h * 1.35),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    holder.add(mesh, hitZone);

    let video = null;
    if (cfg.type === "video" && cfg.src) {
      video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.loop = Boolean(cfg.loop);
      video.preload = "auto";
      video.crossOrigin = "anonymous";

      let triedFallback = false;
      video.addEventListener("error", () => {
        if (!triedFallback && cfg.fallbackSrc) {
          triedFallback = true;
          video.src = cfg.fallbackSrc;
          if (cfg.loop) video.play().catch(() => {});
        }
      });

      video.addEventListener("ended", () => {
        if (!cfg.loop) mat.uniforms.uOpacity.value = 0.0;
      });

      video.src = cfg.src;
      const vTex = new THREE.VideoTexture(video);
      vTex.minFilter = THREE.LinearFilter;
      vTex.magFilter = THREE.LinearFilter;
      vTex.generateMipmaps = false;
      mat.uniforms.uMap.value = vTex;

      if (cfg.loop) {
        mat.uniforms.uOpacity.value = 1.0;
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    } else if (cfg.type === "image" && cfg.src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        mat.uniforms.uMap.value = tex;
        mat.uniforms.uOpacity.value = 1.0;
      };
      img.src = cfg.src;
    }

    editor360ActiveObjects.push({ cfg, holder, mat, mesh, hitZone, video });
  });
}

function applyRoomTexture(idx, useHallucination = false) {
  const room = ROOMS[idx];
  if (!useHallucination) mountEditor360ObjectsForRoom(room);

  if (room.isAnimatedGif && gifRoomLayer) {
    if (gifRoomLayer.getAttribute("src") !== room.fileName) {
      gifRoomLayer.src = room.fileName;
    }
    gifRoomLayer.classList.add("visible");
  } else if (gifRoomLayer) {
    gifRoomLayer.classList.remove("visible");
  }

  if (useHallucination && room.hallucinationFileName) {
    if (!roomHallucinationTextures[idx]) {
      roomHallucinationTextures[idx] = createHallucinationFallbackTexture(room);
    }
    roomPlaneMat.map = roomHallucinationTextures[idx];
  } else if (roomTextures[idx]) {
    roomPlaneMat.map = roomTextures[idx];
  } else {
    if (!proceduralTextureCache[idx]) proceduralTextureCache[idx] = createProceduralTexture(room);
    roomPlaneMat.map = proceduralTextureCache[idx];
  }
  roomPlaneMat.needsUpdate = true;
}

function tryAutoLoadImages() {
  ROOMS.forEach((room, idx) => {
    const img = new Image();
    img.onload = () => {
      createTextureFromImageSource(img, idx);
      if (room.hallucinationFileName && !roomHallucinationTextures[idx]._fromRealFile) {
        roomHallucinationTextures[idx] = createHallucinationFallbackTexture(room);
      }
    };
    img.onerror = () => {
      if (room.fallbackFileName && img.getAttribute("data-fallback") !== "1") {
        img.setAttribute("data-fallback", "1");
        img.src = room.fallbackFileName;
        return;
      }
      if (idx === currentRoomIndex) applyRoomTexture(idx);
    };
    img.src = room.fileName;

    if (room.hallucinationFileName) {
      const hImg = new Image();
      hImg.onload = () => {
        const w = hImg.naturalWidth || hImg.width;
        const h = hImg.naturalHeight || hImg.height;
        if (!w || !h) return;
        const tex = new THREE.Texture(hImg);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        tex._fromRealFile = true;
        if (roomHallucinationTextures[idx]) roomHallucinationTextures[idx].dispose();
        roomHallucinationTextures[idx] = tex;
        if (idx === currentRoomIndex && (hallucinationState.phase === "active" || hallucinationState.swappedToAlt)) {
          applyRoomTexture(idx, true);
        }
      };
      hImg.src = room.hallucinationFileName;
    }
  });
}

/* ============================================================
   СУЩНОСТЬ 2.5D
============================================================ */
function createOrganicShadowSpriteTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 512, 512);

  const bodyGrad = g.createRadialGradient(256, 275, 18, 256, 275, 195);
  bodyGrad.addColorStop(0.0, "rgba(2, 3, 2, 0.96)");
  bodyGrad.addColorStop(0.55, "rgba(4, 6, 5, 0.72)");
  bodyGrad.addColorStop(1.0, "rgba(2, 3, 2, 0.0)");
  g.fillStyle = bodyGrad;
  g.beginPath();
  g.ellipse(256, 305, 92, 165, 0.04, 0, Math.PI * 2);
  g.fill();

  const headGrad = g.createRadialGradient(268, 138, 8, 268, 138, 72);
  headGrad.addColorStop(0.0, "rgba(1, 2, 1, 0.98)");
  headGrad.addColorStop(0.6, "rgba(4, 6, 5, 0.65)");
  headGrad.addColorStop(1.0, "rgba(2, 3, 2, 0.0)");
  g.fillStyle = headGrad;
  g.beginPath();
  g.ellipse(268, 138, 44, 58, -0.24, 0, Math.PI * 2);
  g.fill();

  for (let i = 0; i < 4; i++) {
    const side = i < 2 ? -1 : 1;
    const spread = (i % 2 === 0 ? 1 : 1.35) * side;
    const armGrad = g.createLinearGradient(256 + side * 48, 210, 256 + spread * 145, 420);
    armGrad.addColorStop(0, "rgba(2, 3, 2, 0.85)");
    armGrad.addColorStop(1, "rgba(2, 3, 2, 0.0)");
    g.strokeStyle = armGrad;
    g.lineWidth = 18 - (i % 2) * 5;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(256 + side * 42, 205);
    g.quadraticCurveTo(256 + spread * 115, 295, 256 + spread * 140, 415);
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

function build3DShadowEntity() {
  const group = new THREE.Group();
  const tex = createOrganicShadowSpriteTexture();
  const shadowMat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.0,
    depthWrite: false
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.2), shadowMat);
  group.add(plane);

  const eyeMat = new THREE.MeshBasicMaterial({
    color: 0xc9b89c,
    transparent: true,
    opacity: 0.0,
    depthWrite: false
  });
  const eyeGeo = new THREE.CircleGeometry(0.022, 10);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(0.04, 0.86, 0.03);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.16, 0.84, 0.03);
  group.add(eyeR);

  group.userData = { shadowMat, eyeMat };
  return group;
}
const shadowEntity = build3DShadowEntity();
scene.add(shadowEntity);

const dustParticles = Array.from({ length: 80 }, () => ({
  x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.9,
  vx: (Math.random() - 0.5) * 0.00025, vy: -0.00015 - Math.random() * 0.00035,
  size: 1.0 + Math.random() * 2.3
}));

/* ============================================================
   РЕНДЕРЕР АТМОСФЕРНЫХ ЭФФЕКТОВ КОМНАТЫ (atmosphereEffects)
============================================================ */
const roomAtmospherePool = {
  fog: Array.from({ length: 14 }, (_, i) => ({
    x: Math.random(), y: 0.62 + (i % 4) * 0.1,
    rx: 0.18 + Math.random() * 0.24, ry: 0.05 + Math.random() * 0.07,
    vx: (0.00025 + Math.random() * 0.00045) * (i % 2 === 0 ? 1 : -1),
    alpha: 0.04 + Math.random() * 0.05
  })),
  rain: Array.from({ length: 110 }, () => ({
    x: Math.random(), y: Math.random(),
    vy: 0.018 + Math.random() * 0.016, vx: -0.0025,
    len: 14 + Math.random() * 20
  })),
  smoke: Array.from({ length: 24 }, () => ({
    x: 0.3 + Math.random() * 0.4, y: 0.5 + Math.random() * 0.5,
    vy: -0.0008 - Math.random() * 0.001, vx: (Math.random() - 0.5) * 0.0006,
    r: 18 + Math.random() * 34, alpha: 0.06 + Math.random() * 0.08, phase: Math.random() * 6.28
  })),
  drops: Array.from({ length: 16 }, () => ({
    x: 0.1 + Math.random() * 0.8, y: Math.random(),
    vy: 0.008 + Math.random() * 0.009, r: 1.5 + Math.random() * 1.5
  })),
  insects: Array.from({ length: 26 }, () => ({
    x: 0.2 + Math.random() * 0.6, y: 0.2 + Math.random() * 0.6,
    vx: 0, vy: 0, phase: Math.random() * 6.28, size: 1.2 + Math.random() * 1.1
  }))
};

function renderCustomRoomAtmosphere(ctx, w, h, room, time, dt) {
  const atm = room.atmosphereEffects;
  if (!atm) return;
  const mult = atm.intensity ?? 1.0;
  const t = time * 0.001;

  if (atm.fog) {
    for (const f of roomAtmospherePool.fog) {
      f.x += f.vx * mult * dt;
      if (f.x > 1.3) f.x = -0.3;
      if (f.x < -0.3) f.x = 1.3;
      const cx = f.x * w, cy = f.y * h, rx = f.rx * w, ry = f.ry * h;
      const g = ctx.createRadialGradient(cx, cy, ry * 0.1, cx, cy, rx);
      const a = Math.min(0.32, f.alpha * mult);
      g.addColorStop(0, `rgba(175, 186, 172, ${a.toFixed(3)})`);
      g.addColorStop(1, "rgba(140, 150, 138, 0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  if (atm.smoke) {
    for (const s of roomAtmospherePool.smoke) {
      s.y += s.vy * mult * dt;
      s.x += (s.vx + Math.sin(t * 1.4 + s.phase) * 0.0005) * dt;
      if (s.y < -0.1) { s.y = 1.05; s.x = 0.2 + Math.random() * 0.6; }
      const cx = s.x * w, cy = s.y * h, rad = s.r * (0.8 + mult * 0.35);
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
      const a = Math.min(0.28, s.alpha * mult);
      g.addColorStop(0, `rgba(195, 200, 192, ${a.toFixed(3)})`);
      g.addColorStop(1, "rgba(150, 155, 148, 0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
    }
  }

  if (atm.rain) {
    ctx.strokeStyle = `rgba(190, 208, 218, ${Math.min(0.65, 0.28 * mult).toFixed(3)})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (const r of roomAtmospherePool.rain) {
      r.y += r.vy * mult * dt;
      r.x += r.vx * mult * dt;
      if (r.y > 1.05) { r.y = -0.05; r.x = Math.random(); }
      if (r.x < 0) r.x = 1;
      const x1 = r.x * w, y1 = r.y * h;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + r.vx * 900, y1 + r.len);
    }
    ctx.stroke();
  }

  if (atm.drops) {
    ctx.fillStyle = `rgba(195, 215, 225, ${Math.min(0.85, 0.55 * mult).toFixed(3)})`;
    for (const d of roomAtmospherePool.drops) {
      d.y += d.vy * mult * dt;
      if (d.y > 0.96) {
        ctx.strokeStyle = "rgba(195, 215, 225, 0.35)";
        ctx.beginPath(); ctx.ellipse(d.x * w, 0.96 * h, 9, 2.5, 0, 0, Math.PI * 2); ctx.stroke();
        d.y = 0.02; d.x = 0.1 + Math.random() * 0.8;
      } else {
        ctx.beginPath(); ctx.ellipse(d.x * w, d.y * h, d.r * 0.7, d.r * 2.2, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  if (atm.insects) {
    for (const b of roomAtmospherePool.insects) {
      b.vx = (b.vx + (Math.random() - 0.5) * 0.0012) * 0.92;
      b.vy = (b.vy + (Math.random() - 0.5) * 0.0012) * 0.92;
      b.x = THREE.MathUtils.clamp(b.x + b.vx * mult * dt, 0.05, 0.95);
      b.y = THREE.MathUtils.clamp(b.y + b.vy * mult * dt, 0.08, 0.90);
      const wing = Math.sin(t * 55 + b.phase) * 2.2;
      const bx = b.x * w, by = b.y * h;
      ctx.fillStyle = "rgba(25, 22, 18, 0.88)";
      ctx.beginPath(); ctx.arc(bx, by, b.size, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(220, 225, 215, 0.45)";
      ctx.fillRect(bx - wing, by - 1, wing * 2, 1.2);
    }
  }
}

let lastFrameTime = performance.now();

function updateWorldPlaneLayout() {
  const dist = Math.max(1, camera.position.z);
  const vFov = THREE.MathUtils.degToRad(42);
  const viewH = 2 * Math.tan(vFov / 2) * dist;
  const viewW = viewH * camera.aspect;
  const dims = roomImageDims[currentRoomIndex];
  const imgAspect = dims ? (dims.w / dims.h) : (16 / 9);
  const overscan = 1.12;
  let planeW, planeH;
  if (imgAspect >= camera.aspect) {
    planeH = viewH * overscan;
    planeW = planeH * imgAspect;
  } else {
    planeW = viewW * overscan;
    planeH = planeW / imgAspect;
  }
  roomPlaneMesh.scale.set(planeW, planeH, 1);
  layout.planeW = planeW;
  layout.planeH = planeH;
  layout.viewW = viewW;
  layout.viewH = viewH;
  return layout;
}

/* ============================================================
   ФОТОРЕАЛИСТИЧНЫЙ ТУМАН ИЗ УГЛОВ КОМНАТ
============================================================ */
const cornerFogCanvas = document.getElementById("corner-fog-canvas");
const cornerFogCtx = cornerFogCanvas ? cornerFogCanvas.getContext("2d") : null;

const CORNER_ANCHORS = [
  { name: "TL", x: 0.0, y: 0.0 },
  { name: "TR", x: 1.0, y: 0.0 },
  { name: "BL", x: 0.0, y: 1.0 },
  { name: "BR", x: 1.0, y: 1.0 }
];

const cornerFogPlumes = CORNER_ANCHORS.map((anc, idx) => ({
  id: idx,
  anchorX: anc.x,
  anchorY: anc.y,
  state: "dormant",
  stateStartedAt: performance.now() + 2500 + idx * 3200,
  stateDurMs: 6000,
  density: 0.0,
  targetDensity: 0.55,
  reach: 0.25,
  driftAngle: Math.atan2(0.5 - anc.y, 0.5 - anc.x),
  wobblePhase: Math.random() * Math.PI * 2
}));

function resizeCornerFog() {
  if (!cornerFogCanvas || !cornerFogCtx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cornerFogCanvas.width = Math.floor(window.innerWidth * dpr);
  cornerFogCanvas.height = Math.floor(window.innerHeight * dpr);
  cornerFogCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCornerFog);
resizeCornerFog();

function updateAndRenderCornerFog(now) {
  if (!cornerFogCanvas || !cornerFogCtx) return;
  const introEl = document.getElementById("intro-screen");
  const preloaderEl = document.getElementById("preloader-screen");
  const preloaderOpen = preloaderEl && !preloaderEl.classList.contains("done");
  const introOpen = introEl && !introEl.classList.contains("hidden");

  if (preloaderOpen || introOpen || chamberCutscenePlaying) {
    cornerFogCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    return;
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  const tSec = now * 0.001;

  cornerFogCtx.clearRect(0, 0, w, h);

  for (let i = 0; i < cornerFogPlumes.length; i++) {
    const p = cornerFogPlumes[i];
    const elapsed = now - p.stateStartedAt;

    if (p.state === "dormant") {
      p.density = 0;
      if (now >= p.stateStartedAt) {
        p.state = "creep_in";
        p.stateStartedAt = now;
        p.stateDurMs = 9500 + Math.floor(Math.random() * 6500);
        p.targetDensity = 0.28 + Math.random() * 0.24;
      }
    } else if (p.state === "creep_in") {
      const k = Math.min(1, Math.max(0, elapsed / p.stateDurMs));
      const ease = k * k * (3 - 2 * k);
      p.density = p.targetDensity * ease;
      p.reach = 0.08 + ease * 0.34;
      if (k >= 1) {
        p.state = "hold";
        p.stateStartedAt = now;
        p.stateDurMs = 6000 + Math.floor(Math.random() * 6000);
      }
    } else if (p.state === "hold") {
      p.density = p.targetDensity * (0.94 + 0.06 * Math.sin(tSec * 0.65 + p.wobblePhase));
      if (now >= p.stateStartedAt + p.stateDurMs) {
        p.state = "dissolve";
        p.stateStartedAt = now;
        p.stateDurMs = 11000 + Math.floor(Math.random() * 8000);
      }
    } else if (p.state === "dissolve") {
      const k = Math.min(1, Math.max(0, elapsed / p.stateDurMs));
      const easeOut = 1 - Math.pow(1 - k, 2.6);
      p.density = p.targetDensity * (1 - easeOut);
      p.reach = 0.42 * (1 - easeOut * 0.65);
      if (k >= 1) {
        p.density = 0;
        p.state = "dormant";
        p.stateStartedAt = now + 16000 + Math.floor(Math.random() * 16000);
      }
    }

    if (p.density <= 0.004) continue;

    const fromRight = p.anchorX > 0.5;
    const fromBottom = p.anchorY > 0.5;
    const horizDir = fromRight ? -1 : 1;
    const floorY = fromBottom ? h * (0.94 - p.reach * 0.16) : h * (0.14 + p.reach * 0.16);

    for (let lobe = 0; lobe < 3; lobe++) {
      const spanX = w * (0.16 + p.reach * (0.36 + lobe * 0.14));
      const spanY = Math.max(36, h * (0.05 + p.reach * (0.09 + lobe * 0.045)));
      const driftX = horizDir * (w * p.reach * (0.12 + lobe * 0.15)) + Math.sin(tSec * 0.25 + p.wobblePhase + lobe) * 18;
      const cx = (fromRight ? w : 0) + driftX;
      const cy = floorY + (fromBottom ? -lobe * 14 : lobe * 14) + Math.cos(tSec * 0.32 + p.wobblePhase) * 6;

      const grad = cornerFogCtx.createLinearGradient(
        fromRight ? cx + spanX * 0.5 : cx - spanX * 0.5,
        cy,
        fromRight ? cx - spanX * 0.5 : cx + spanX * 0.5,
        cy
      );
      const a = Math.min(0.36, p.density * (0.28 - lobe * 0.05));
      grad.addColorStop(0.0, `rgba(168, 178, 166, ${a.toFixed(3)})`);
      grad.addColorStop(0.55, `rgba(138, 148, 136, ${(a * 0.45).toFixed(3)})`);
      grad.addColorStop(1.0, "rgba(110, 120, 108, 0.0)");

      cornerFogCtx.fillStyle = grad;
      cornerFogCtx.beginPath();
      cornerFogCtx.ellipse(cx, cy, Math.max(40, spanX * 0.65), spanY, 0, 0, Math.PI * 2);
      cornerFogCtx.fill();
    }
  }
}

function animate(time) {
  requestAnimationFrame(animate);
  if (document.hidden) { lastFrameTime = time; return; }

  const dtMs = Math.min(100, time - lastFrameTime);
  lastFrameTime = time;
  const dt = dtMs / 16.667;

  if (panicState.active) {
    const elapsed = time - panicState.startedAt;
    if (elapsed >= panicState.duration) { panicState.active = false; panicState.intensity = 0; }
    else {
      const p = elapsed / panicState.duration;
      panicState.intensity = p < 0.14 ? p / 0.14 : (p > 0.72 ? (1 - p) / 0.28 : 1);
    }
  } else if (panicState.dread > 0.001) {
    panicState.dread *= Math.pow(0.5, dt / 120);
  }

  const w = window.innerWidth, h = window.innerHeight;
  const room = ROOMS[currentRoomIndex];
  const is360 = Boolean(room && room.is360EditorRoom);

  if (is360 && (view360.isDragging || pointer.isTouchInput)) {
    pointer.targetX += (w * 0.5 - pointer.targetX) * 0.08 * dt;
    pointer.targetY += (h * 0.48 - pointer.targetY) * 0.08 * dt;
  }

  const lerpFactor = 1 - Math.pow(1 - POINTER_LERP, dt);
  pointer.x += (pointer.targetX - pointer.x) * lerpFactor;
  pointer.y += (pointer.targetY - pointer.y) * lerpFactor;
  pointer.normX = (pointer.x / w - 0.5) * 2;
  pointer.normY = (pointer.y / h - 0.5) * 2;

  const L = updateWorldPlaneLayout();
  const planeW = L.planeW, planeH = L.planeH, viewW = L.viewW, viewH = L.viewH;

  let camZ = 10.0;
  let camX = pointer.normX * 0.32;
  let camY = -pointer.normY * 0.22 + Math.sin(time * 0.0022) * 0.03;
  if (panicState.active && !REDUCE_MOTION) {
    const pAmp = panicState.intensity;
    camX += Math.sin(time * 0.067) * 0.11 * pAmp + (Math.random() - 0.5) * 0.06 * pAmp;
    camY += Math.cos(time * 0.059) * 0.09 * pAmp + (Math.random() - 0.5) * 0.06 * pAmp;
    camZ -= Math.sin(time * 0.014) * 0.35 * pAmp;
  }
  let blackFade = 0;

  if (transition.active) {
    transition.progress += TRANSITION_SPEED * dt;
    if (transition.phase === "in") {
      const ease = transition.progress * transition.progress;
      camZ = 10.0 - ease * 6.4;
      const twX = (transition.focusX - 0.5) * planeW;
      const twY = (0.5 - transition.focusY) * planeH;
      camX += twX * ease * 0.85;
      camY += twY * ease * 0.85 + Math.sin(transition.progress * Math.PI * 5) * 0.12;
      blackFade = Math.min(1, transition.progress * 1.15);
      if (transition.progress >= 1) {
        currentRoomIndex = transition.targetRoom;
        entityState.visible = false;
        stopHallucinationHeartbeat();
        hallucinationState.swappedToAlt = false;
        scheduleNextHallucination(currentRoomIndex);
        applyRoomTexture(currentRoomIndex, false);
        updateRoomHUD();
        syncTapeVideo();
        editor360ActiveObjects.forEach(o => { if (o.video && o.cfg.loop && o.video.paused) o.video.play().catch(() => {}); });
        if (audioEngine.ctx) audioEngine.updateCavernReverb(ROOMS[currentRoomIndex].reverbDecay);
        saveProgress();
        transition.phase = "out";
        transition.progress = 0;
      }
    } else if (transition.phase === "out") {
      const ease = 1 - Math.pow(1 - transition.progress, 3);
      camZ = 7.6 + ease * 2.4;
      blackFade = 1 - ease;
      if (transition.progress >= 1) { transition.active = false; transition.phase = "none"; }
    }
  }

  updateCameraForActiveMode(time, dt, camX, camY, camZ);

  if (gifRoomLayer && gifRoomLayer.classList.contains("visible") && !REDUCE_MOTION) {
    gifRoomLayer.style.transform = `scale(1.06) translate(${(-pointer.normX * 14).toFixed(1)}px, ${(-pointer.normY * 10).toFixed(1)}px)`;
  }

  const lightWorldX = pointer.normX * (viewW * 0.5);
  const lightWorldY = -pointer.normY * (viewH * 0.5);
  spotLight.position.set(camX, camY, camZ);
  spotLight.target.position.set(lightWorldX, lightWorldY, 0);
  spotLight.intensity = flashlightOn ? 3.0 : 0.45;

  if (entityState.visible && !is360) {
    const ex = (entityState.spot.x - 0.5) * planeW;
    const ey = (0.5 - entityState.spot.y) * planeH;
    const esc = (entityState.spot.scale || 1.0) * (planeH * 0.16);
    shadowEntity.visible = true;
    shadowEntity.scale.set(esc, esc, esc);
    const distToSpot = Math.hypot(lightWorldX - ex, lightWorldY - ey);
    if (distToSpot < planeW * 0.18 && !entityState.evading) {
      entityState.evading = true;
      entityState.targetOpacity = 0;
      if (audioEngine.enabled) {
        const panDirection = (ex - lightWorldX) / planeW;
        audioEngine.playSteelChains(Math.max(-0.9, Math.min(0.9, panDirection * 2)));
        audioEngine.playHeartbeatPulse(1.0);
      }
    }
    entityState.timer -= dt;
    if (entityState.timer <= 0) entityState.targetOpacity = 0;
    const speed = entityState.evading ? ENTITY_EVADE_LERP : ENTITY_LERP;
    const opLerp = 1 - Math.pow(1 - speed, dt);
    entityState.opacity += (entityState.targetOpacity - entityState.opacity) * opLerp;
    const recoilX = entityState.evading ? (ex > 0 ? 0.75 : -0.75) * (1 - entityState.opacity) : Math.sin(time * 0.004) * 0.04;
    const recoilZ = entityState.evading ? -0.3 * (1 - entityState.opacity) : 0.35;
    shadowEntity.position.set(ex + recoilX, ey, recoilZ);
    shadowEntity.userData.shadowMat.opacity = entityState.opacity * 0.95;
    shadowEntity.userData.eyeMat.opacity = entityState.evading ? 0 : entityState.opacity * 0.8;
    if (entityState.opacity < 0.01 && entityState.targetOpacity === 0) {
      entityState.visible = false;
      shadowEntity.visible = false;
    }
  } else {
    shadowEntity.visible = false;
  }

  const tSec = time * 0.001;
  godRaysRig.group.visible = !is360;
  refractionLensMesh.visible = !is360;
  if (!is360) {
    godRaysRig.rayMat.uniforms.uTime.value = tSec;
    godRaysRig.rayMat.uniforms.uIntensity.value = flashlightOn
      ? (panicState.active ? 0.38 : 0.22)
      : 0.07;

    refractionLensMesh.rotation.x = tSec * 0.22;
    refractionLensMesh.rotation.y = tSec * 0.31;
    refractionLensMesh.position.x = -2.6 + Math.sin(tSec * 0.45) * 0.25;
    refractionLensMesh.position.y = -1.1 + Math.cos(tSec * 0.38) * 0.18;
  }

  updateHallucinationSystem(time);
  updateDiscoveryTicks(w, h);
  renderer.render(scene, camera);
  render2DOverlay(w, h, room, blackFade, time, dt);
  updateAndRenderCornerFog(time);
}

function updateDiscoveryTicks(w, h) {
  if (transition.active) return;
  const room = ROOMS[currentRoomIndex];
  const t = getOverlayTransform(w, h);
  if (!roomTickFlags[currentRoomIndex]) roomTickFlags[currentRoomIndex] = {};
  const flags = roomTickFlags[currentRoomIndex];
  const artPos = getMarkerScreenPos(room.artifact, w, h, t);
  if (!flags.artifact && Math.hypot(pointer.x - artPos.x, pointer.y - artPos.y) < 100) { flags.artifact = true; audioEngine.playTick(); }
  const portPos = getMarkerScreenPos(room.portal, w, h, t);
  if (!flags.portal && Math.hypot(pointer.x - portPos.x, pointer.y - portPos.y) < 100) { flags.portal = true; audioEngine.playTick(); }
}

function render2DOverlay(w, h, room, blackFade, time, dt) {
  fxCtx.clearRect(0, 0, w, h);
  const t = getOverlayTransform(w, h);
  const is360 = Boolean(room && room.is360EditorRoom);

  const showDust = !room.atmosphereEffects || room.atmosphereEffects.dust !== false;
  if (showDust) {
    const dustMult = room.atmosphereEffects?.intensity ?? 1.0;
    dustParticles.forEach(p => {
      p.x += p.vx * dt * 0.65 * dustMult;
      p.y += p.vy * dt * 0.65 * dustMult;
      if (p.y < 0) p.y = 1;
      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      const px = p.x * w - pointer.normX * 18 * p.z;
      const py = p.y * h - pointer.normY * 12 * p.z;
      const dist = Math.hypot(px - pointer.x, py - pointer.y);
      const boost = (flashlightOn && dist < 290) ? (1 - dist / 290) * 0.65 : 0;
      const rTiny = Math.max(0.8, p.size * 0.62 * p.z);
      fxCtx.fillStyle = `rgba(206, 216, 198, ${Math.min(0.85, (0.18 + boost) * dustMult)})`;
      fxCtx.beginPath(); fxCtx.arc(px, py, rTiny, 0, Math.PI * 2); fxCtx.fill();
    });
  }

  // Атмосферные эффекты из редактора (туман, дождь, дым, капли, насекомые)
  renderCustomRoomAtmosphere(fxCtx, w, h, room, time, dt);

  const artPos = getMarkerScreenPos(room.artifact, w, h, t);
  if (artPos.x > -100) drawMarker2D(artPos.x, artPos.y, room.artifact.label, room.solved ? "#528c63" : "#bd7d3b", time);

  if (room.clueProp) {
    const cpPos = getMarkerScreenPos(room.clueProp, w, h, t);
    if (cpPos.x > -100) drawMarker2D(cpPos.x, cpPos.y, room.clueProp.label, "#8c7d65", time);
  }

  const canPass = room.solved || freeMode;
  const portPos = getMarkerScreenPos(room.portal, w, h, t);
  if (portPos.x > -100) drawMarker2D(portPos.x, portPos.y, room.portal.label, canPass ? "#528c63" : "#8f3222", time);

  const darknessAlpha = is360 ? 0.68 : 0.86;
  if (flashlightOn) {
    const flicker = REDUCE_MOTION ? 1.0 : (Math.sin(time * 0.041) * Math.sin(time * 0.017) > 0.96 ? 0.82 : 1.0);
    fxCtx.fillStyle = `rgba(1, 2, 1, ${darknessAlpha})`;
    fxCtx.fillRect(0, 0, w, h);
    if (!flashlightSprite) ensureFlashlightSprite();
    const s = flashlightSpriteRad * flicker;
    fxCtx.globalCompositeOperation = "destination-out";
    fxCtx.drawImage(flashlightSprite, pointer.x - s, pointer.y - s, s * 2, s * 2);
    fxCtx.globalCompositeOperation = "source-over";
  } else {
    fxCtx.fillStyle = `rgba(1, 2, 1, ${is360 ? 0.62 : 0.85})`;
    fxCtx.fillRect(0, 0, w, h);
  }

  if (panicState.active) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.019);
    const alarmAlpha = (REDUCE_MOTION ? 0.12 : 0.28 * pulse) * panicState.intensity;
    const alarmGrad = fxCtx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.16, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    alarmGrad.addColorStop(0, "rgba(143, 50, 34, 0)");
    alarmGrad.addColorStop(1, `rgba(143, 50, 34, ${alarmAlpha.toFixed(3)})`);
    fxCtx.fillStyle = alarmGrad; fxCtx.fillRect(0, 0, w, h);
  }
  if (hallucinationState.flashAlpha > 0.01) {
    fxCtx.fillStyle = `rgba(215, 224, 212, ${(hallucinationState.flashAlpha * 0.72).toFixed(3)})`;
    fxCtx.fillRect(0, 0, w, h);
    const hGrad = fxCtx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.12, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    hGrad.addColorStop(0, "rgba(120, 14, 12, 0)");
    hGrad.addColorStop(1, `rgba(120, 14, 12, ${(hallucinationState.flashAlpha * 0.65).toFixed(3)})`);
    fxCtx.fillStyle = hGrad;
    fxCtx.fillRect(0, 0, w, h);
  }
  if (blackFade > 0.01) {
    fxCtx.fillStyle = `rgba(1, 2, 1, ${blackFade})`;
    fxCtx.fillRect(0, 0, w, h);
  }
}

function drawMarker2D(x, y, label, color, time) {
  const pulse = REDUCE_MOTION ? 1 : 1 + Math.sin(time * 0.005) * 0.2;
  fxCtx.save();
  fxCtx.strokeStyle = color; fxCtx.lineWidth = 1.6;
  fxCtx.beginPath(); fxCtx.arc(x, y, 14 * pulse, 0, Math.PI * 2); fxCtx.stroke();
  fxCtx.fillStyle = color;
  fxCtx.beginPath(); fxCtx.arc(x, y, 4, 0, Math.PI * 2); fxCtx.fill();
  fxCtx.font = "11px 'Courier New', monospace";
  const tw = fxCtx.measureText(label).width + 14;
  fxCtx.fillStyle = "rgba(5, 7, 5, 0.88)";
  fxCtx.fillRect(x - tw * 0.5, y + 19, tw, 20);
  fxCtx.strokeStyle = color; fxCtx.strokeRect(x - tw * 0.5, y + 19, tw, 20);
  fxCtx.fillStyle = "#ded6cc"; fxCtx.textAlign = "center";
  fxCtx.fillText(label, x, y + 33);
  fxCtx.restore();
}

/* ============================================================
   HUD
============================================================ */
const depthNav = document.getElementById("depth-nav");
function buildDepthNav() {
  depthNav.innerHTML = "";
  ROOMS.forEach((r, idx) => {
    const node = document.createElement("div");
    const lockedSecret = (r.isSecret || r.is360EditorRoom) && !areMainRoomsCompleted() && !freeMode;
    node.className = `depth-node ${idx === currentRoomIndex ? "active" : ""} ${r.solved ? "solved" : ""} ${r.isSecret ? "secret" : ""} ${lockedSecret ? "locked-secret" : ""}`;
    node.setAttribute("role", "button"); node.setAttribute("tabindex", "0");
    const numStr = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;
    const shortName = lockedSecret ? "ЗАПЕЧАТАНО" : r.title.split(" ")[0];
    node.setAttribute("title", `${numStr} // ${shortName}`);
    node.innerHTML = `<span class="depth-dot"></span>`;
    node.addEventListener("click", () => attemptRoomTransition(idx));
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); attemptRoomTransition(idx); }
    });
    depthNav.appendChild(node);
  });
}
function refreshDepthNavState() {
  const mainDone = areMainRoomsCompleted();
  depthNav.querySelectorAll(".depth-node").forEach((node, idx) => {
    const r = ROOMS[idx];
    const lockedSecret = (r.isSecret || r.is360EditorRoom) && !mainDone && !freeMode;
    node.classList.toggle("active", idx === currentRoomIndex);
    node.classList.toggle("solved", r.solved);
    node.classList.toggle("locked-secret", lockedSecret);
    const numStr = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;
    const shortName = lockedSecret ? "ЗАПЕЧАТАНО" : r.title.split(" ")[0];
    node.setAttribute("title", `${numStr} // ${shortName}`);
  });
}
function updateRoomHUD() {
  const room = ROOMS[currentRoomIndex];
  const curStr = currentRoomIndex < 9 ? `0${currentRoomIndex + 1}` : `${currentRoomIndex + 1}`;
  document.getElementById("hud-room-indicator").textContent =
    `ЛОКАЦИЯ ${curStr} / ${ROOMS.length} — ${room.title.toUpperCase()}`;
  document.getElementById("dossier-code").textContent = room.code;
  document.getElementById("dossier-title").textContent = room.title;
  document.getElementById("dossier-text").textContent = room.desc;
  const badge = document.getElementById("puzzle-badge");
  if (room.solved || freeMode) {
    badge.textContent = room.solved ? "ЗАМОК ОТКРЫТ" : "СВОБОДНЫЙ ОБХОД";
    badge.className = "status-badge unlocked";
  } else {
    badge.textContent = "ПРОХОД ЗАБЛОКИРОВАН";
    badge.className = "status-badge";
  }
  refreshDepthNavState();
}

function attemptRoomTransition(targetIdx) {
  if (transition.active || targetIdx === currentRoomIndex) return;
  if (targetIdx < 0 || targetIdx >= ROOMS.length) return;
  const currentRoom = ROOMS[currentRoomIndex];
  const targetRoom = ROOMS[targetIdx];

  if ((targetRoom.isSecret || targetRoom.is360EditorRoom) && !areMainRoomsCompleted() && !freeMode) {
    audioEngine.playSubterraneanRumble();
    audioEngine.playWallScratching();
    const badge = document.getElementById("puzzle-badge");
    badge.textContent = "НУЖНО ПРОЙТИ ПЕРВЫЕ 5 КОМНАТ";
    badge.className = "status-badge";
    setTimeout(updateRoomHUD, 2400);
    return;
  }

  if (targetIdx > currentRoomIndex && !currentRoom.solved && !freeMode) {
    audioEngine.playSubterraneanRumble();
    openPuzzleModal();
    return;
  }
  if (!isRoomAccessible(targetIdx)) {
    audioEngine.playSubterraneanRumble();
    return;
  }

  audioEngine.playFootsteps();
  transition.active = true;
  transition.phase = "in"; transition.progress = 0;
  transition.targetRoom = targetIdx;
  if (targetIdx < currentRoomIndex) {
    const tr = ROOMS[targetIdx];
    transition.focusX = tr.portal.x || 0.5; transition.focusY = tr.portal.y || 0.5;
  } else {
    transition.focusX = currentRoom.portal.x || 0.5; transition.focusY = currentRoom.portal.y || 0.5;
  }
}

/* ============================================================
   МОДАЛКИ
============================================================ */
let focusedBeforeModal = null;
function openModalEl(modalEl) {
  focusedBeforeModal = document.activeElement;
  modalEl.classList.add("open");
  setTimeout(() => {
    const first = modalEl.querySelector('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (first) first.focus();
  }, 60);
}
function closeModalEl(modalEl) {
  modalEl.classList.remove("open");
  if (focusedBeforeModal && focusedBeforeModal.focus) { try { focusedBeforeModal.focus(); } catch (e) {} }
  focusedBeforeModal = null;
}
document.addEventListener("keydown", (e) => {
  if (e.key !== "Tab") return;
  const openModal = document.querySelector(".modal-backdrop.open");
  if (!openModal) return;
  const focusable = openModal.querySelectorAll('button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
document.querySelectorAll(".modal-backdrop").forEach(m => {
  m.addEventListener("click", (e) => { if (e.target === m) closeModalEl(m); });
});

/* ============================================================
   ВВОД: 2.5D ДЛЯ КОМНАТ 1–9 И 360° ОБЗОР ДЛЯ 10-Й КОМНАТЫ
============================================================ */
glCanvas.addEventListener("pointerdown", (e) => {
  pointer.isTouchInput = (e.pointerType === "touch");
  if (!ROOMS[currentRoomIndex].is360EditorRoom) {
    pointer.targetX = e.clientX;
    pointer.targetY = e.clientY;
  }

  view360.isDragging = true;
  view360.downX = e.clientX;
  view360.downY = e.clientY;
  view360.downLon = view360.targetLon;
  view360.downLat = view360.targetLat;
  view360.lastX = e.clientX;
  view360.lastY = e.clientY;
  view360.lastTime = performance.now();
  view360.velX = 0;
  view360.velY = 0;
});

window.addEventListener("pointermove", (e) => {
  if (document.querySelector(".modal-backdrop.open")) return;
  const is360 = Boolean(ROOMS[currentRoomIndex] && ROOMS[currentRoomIndex].is360EditorRoom);

  if (!is360) {
    pointer.targetX = e.clientX;
    pointer.targetY = e.clientY;
    return;
  }

  if (!view360.isDragging) {
    if (e.pointerType === "mouse") {
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
    }
    return;
  }

  const factor = camera.fov / 380;
  view360.targetLon = view360.downLon + (view360.downX - e.clientX) * factor;
  view360.targetLat = view360.downLat + (e.clientY - view360.downY) * factor;
  clamp360Angles();

  const now = performance.now();
  const dtMove = now - view360.lastTime;
  if (dtMove > 0) {
    const instX = (e.clientX - view360.lastX) / dtMove;
    const instY = (e.clientY - view360.lastY) / dtMove;
    view360.velX = view360.velX * 0.5 + instX * 0.5;
    view360.velY = view360.velY * 0.5 + instY * 0.5;
  }
  view360.lastX = e.clientX;
  view360.lastY = e.clientY;
  view360.lastTime = now;
}, { passive: true });

window.addEventListener("pointerup", () => {
  if (!view360.isDragging) return;
  view360.isDragging = false;
  if (performance.now() - view360.lastTime > 110) {
    view360.velX = 0;
    view360.velY = 0;
  } else {
    view360.velX = Math.max(-1.2, Math.min(1.2, view360.velX));
    view360.velY = Math.max(-1.2, Math.min(1.2, view360.velY));
  }
});

glCanvas.addEventListener("click", (e) => {
  if (transition.active) return;
  if (document.querySelector(".modal-backdrop.open")) return;

  const room = ROOMS[currentRoomIndex];
  const is360 = Boolean(room && room.is360EditorRoom);

  if (is360 && Math.hypot(e.clientX - view360.downX, e.clientY - view360.downY) > 10) return;

  pointer.x = pointer.targetX = e.clientX;
  pointer.y = pointer.targetY = e.clientY;
  pointer.normX = (e.clientX / window.innerWidth - 0.5) * 2;
  pointer.normY = (e.clientY / window.innerHeight - 0.5) * 2;

  // Проверяем клик по любым 3D-слоям из редактора (и в 360°, и в 2.5D комнатах)
  if (editor360ActiveObjects.length > 0) {
    const rect = glCanvas.getBoundingClientRect();
    editor360Ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    editor360Ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    editor360Raycaster.setFromCamera(editor360Ndc, camera);

    for (const item of editor360ActiveObjects) {
      if (editor360Raycaster.intersectObject(item.hitZone).length > 0) {
        triggerEditor360Object(item);
        return;
      }
    }
  }

  const w = window.innerWidth, h = window.innerHeight;
  updateWorldPlaneLayout();
  const t = getOverlayTransform(w, h);

  const artPosClick = getMarkerScreenPos(room.artifact, w, h, t);
  if (Math.hypot(e.clientX - artPosClick.x, e.clientY - artPosClick.y) < 90) { openPuzzleModal(); return; }

  if (room.clueProp) {
    const cpPosClick = getMarkerScreenPos(room.clueProp, w, h, t);
    if (Math.hypot(e.clientX - cpPosClick.x, e.clientY - cpPosClick.y) < 90) {
      audioEngine.playTick();
      openPuzzleModal();
      const fb = document.getElementById("modal-feedback");
      if (fb) fb.textContent = `УЛИКА: ${room.clueProp.clueText}`;
      return;
    }
  }

  const portPosClick = getMarkerScreenPos(room.portal, w, h, t);
  if (Math.hypot(e.clientX - portPosClick.x, e.clientY - portPosClick.y) < 90) {
    attemptRoomTransition((currentRoomIndex + 1) % ROOMS.length); return;
  }

  const now = performance.now();
  panicState.dread = Math.min(1.0, panicState.dread + 0.14);
  const effectiveChance = PANIC_CHANCE_PER_CLICK + panicState.dread * 0.12;
  if (Math.random() < effectiveChance) triggerPanicEpisode(now);
});

let lastWheelTime = 0;
window.addEventListener("wheel", (e) => {
  const now = performance.now();
  if (now - lastWheelTime < 1100) return;
  if (document.querySelector(".modal-backdrop.open")) return;
  if (e.deltaY > 25) { lastWheelTime = now; attemptRoomTransition(Math.min(ROOMS.length - 1, currentRoomIndex + 1)); }
  else if (e.deltaY < -25) { lastWheelTime = now; attemptRoomTransition(Math.max(0, currentRoomIndex - 1)); }
}, { passive: true });

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "f" || k === "а") document.getElementById("btn-toggle-flashlight").click();
  if (k === "h" || k === "р") triggerHallucinationNow();
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-backdrop.open").forEach(m => closeModalEl(m));
  }
});

/* ============================================================
   ПАНИКА 2.5D
============================================================ */
function triggerPanicEpisode(now = performance.now()) {
  if (panicState.active) return;
  if (now - panicState.lastTriggeredAt < PANIC_COOLDOWN_MS) return;
  const room0 = ROOMS[0];
  if (room0.id === 0 && room0.tapePlaying && !room0.tapeFinished && currentRoomIndex === 0) return;
  panicState.active = true;
  panicState.startedAt = now;
  panicState.lastTriggeredAt = now;
  panicState.intensity = 1.0;
  panicState.dread = 0;
  panicEpisodesCount += 1;
  saveProgress();
  if (audioEngine.enabled) audioEngine.playPanicBurst();
  spawnShadowEntity(true);
}
function spawnShadowEntity(force = false) {
  const room = ROOMS[currentRoomIndex];
  if (room.is360EditorRoom) return;
  if (!room.shadowSpots || room.shadowSpots.length === 0) return;
  if (entityState.visible && !force) return;
  const spot = room.shadowSpots[Math.floor(Math.random() * room.shadowSpots.length)];
  entityState.spot = spot;
  entityState.visible = true;
  entityState.opacity = 0.05;
  entityState.targetOpacity = 0.92;
  entityState.evading = false;
  entityState.timer = 340;
  if (audioEngine.enabled) audioEngine.playSubterraneanRumble();
}
const entitySpawnTimer = setInterval(() => {
  if (document.hidden) return;
  if (document.getElementById("intro-screen").classList.contains("hidden") && !transition.active) {
    if (Math.random() < 0.65) spawnShadowEntity(false);
  }
}, 5500);

/* ============================================================
   ЗАГАДКИ (ОСНОВНЫЕ + СЕКРЕТНЫЕ + ТЕСТ 360°)
============================================================ */
function openPuzzleModal() {
  const room = ROOMS[currentRoomIndex];
  const modal = document.getElementById("puzzle-modal");
  document.getElementById("modal-tag").textContent = room.code;
  document.getElementById("modal-title").textContent = room.puzzleTitle;
  document.getElementById("modal-desc").textContent = room.puzzleDesc;
  const container = document.getElementById("modal-interactive");
  const feedback = document.getElementById("modal-feedback");
  container.innerHTML = "";
  feedback.textContent = room.solved ? "МЕХАНИЗМ УЖЕ РАЗБЛОКИРОВАН." : "Осмотрите поверхности комнаты лучом фонаря.";

  if (room.puzzleType === "frequency") {
    let cur = room.solved ? room.targetFreq : 390;
    container.innerHTML = `
      <div class="puzzle-row"><span>ЧАСТОТА ТОНВАЛА:</span><strong id="freq-rd" style="color:var(--amber-glow); font-size:16px;">${cur} Гц</strong></div>
      <input type="range" id="freq-sl" min="350" max="500" step="1" value="${cur}">
      <div style="margin-top:12px; display:flex; justify-content:space-between; gap:8px;">
        <button class="btn" id="btn-replay-tape" style="${room.solved ? '' : 'display:none;'}">ПОВТОРИТЬ ПЛЁНКУ</button>
        <button class="btn btn-primary" id="btn-chk" style="margin-left:auto;">ЗАПУСТИТЬ КАТУШКИ</button>
      </div>`;
    const sl = container.querySelector("#freq-sl");
    const rd = container.querySelector("#freq-rd");
    sl.addEventListener("input", () => { rd.textContent = `${sl.value} Гц`; audioEngine.playTick(); });
    const replayBtn = container.querySelector("#btn-replay-tape");
    if (replayBtn) replayBtn.addEventListener("click", () => {
      room.tapePlaying = true; room.tapeFinished = false;
      closeModalEl(modal);
      if (tapeVideo) { tapeVideo.currentTime = 0; syncTapeVideo(); }
    });
    container.querySelector("#btn-chk").addEventListener("click", () => {
      if (parseInt(sl.value, 10) === room.targetFreq) {
        room.tapePlaying = true; room.tapeFinished = false;
        solveCurrentRoom("Катушки запущены.");
        setTimeout(() => { closeModalEl(modal); if (tapeVideo) { tapeVideo.currentTime = 0; syncTapeVideo(); } }, 400);
      } else { audioEngine.playWallScratching(); feedback.textContent = "Неверная частота. Осмотрите стену слева."; }
    });
  } else if (room.puzzleType === "roman_code" || room.puzzleType === "roman_code_extended") {
    const syms = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    const st = room.solved ? [...room.targetCode] : ["I", "I", "I", "I"];
    const wrap = document.createElement("div"); wrap.className = "code-slots";
    st.forEach((s, i) => {
      const b = document.createElement("button"); b.className = "code-slot-btn"; b.textContent = s;
      b.addEventListener("click", () => { st[i] = syms[(syms.indexOf(st[i]) + 1) % syms.length]; b.textContent = st[i]; audioEngine.playTick(); });
      wrap.appendChild(b);
    });
    const cb = document.createElement("button");
    cb.className = "btn btn-primary"; cb.style.width = "100%"; cb.textContent = "ПРОВЕРНУТЬ ЗАСОВ";
    cb.addEventListener("click", () => {
      if (st.join("-") === room.targetCode.join("-")) solveCurrentRoom("Знаки совпали. Замок открыт.");
      else { audioEngine.playWallScratching(); feedback.textContent = "Замок заклинило. Сверьтесь с вырезанными цифрами на поверхности."; }
    });
    container.appendChild(wrap); container.appendChild(cb);
  } else if (room.puzzleType === "weights") {
    const weights = [{ kg: 2, side: "L" }, { kg: 4, side: room.solved ? "L" : "R" }, { kg: 6, side: "R" }];
    const renderW = () => {
      const l = weights.filter(x => x.side === "L").reduce((a, b) => a + b.kg, 0);
      const r = weights.filter(x => x.side === "R").reduce((a, b) => a + b.kg, 0);
      container.innerHTML = `
        <div class="puzzle-row"><span>ЛЕВАЯ (Л): <strong>${l} КГ</strong></span><span>ПРАВАЯ (П): <strong>${r} КГ</strong></span></div>
        <div class="scale-pan-group" id="w-grid"></div>
        <button class="btn btn-primary" id="btn-w" style="width:100%; margin-top:8px;">ОСВОБОДИТЬ СТОПОР</button>`;
      const grid = container.querySelector("#w-grid");
      weights.forEach(w => {
        const card = document.createElement("div"); card.className = "weight-card";
        card.innerHTML = `<div style="font-size:14px; font-weight:bold; margin-bottom:6px;">ГИРЯ ${w.kg}КГ</div><button class="hud-btn" style="width:100%">${w.side === "L" ? "ЛЕВАЯ" : "ПРАВАЯ"}</button>`;
        card.querySelector("button").addEventListener("click", () => {
          w.side = w.side === "L" ? "R" : "L"; audioEngine.playSteelChains(); renderW();
        });
        grid.appendChild(card);
      });
      container.querySelector("#btn-w").addEventListener("click", () => {
        if (l === 6 && r === 6) solveCurrentRoom("Весы в равновесии. Люк открыт.");
        else { audioEngine.playWallScratching(); feedback.textContent = "Перекос. Сверьтесь с отметкой на простыне."; }
      });
    };
    renderW();
  } else if (room.puzzleType === "dosage") {
    let dA = room.solved ? room.targetA : 0, dB = room.solved ? room.targetB : 0;
    const renderD = () => {
      container.innerHTML = `
        <div class="puzzle-row"><span>КОЛБА А: <strong>${dA}</strong></span><button class="hud-btn" id="ba">+1</button></div>
        <div class="puzzle-row"><span>КОЛБА B: <strong>${dB}</strong></span><button class="hud-btn" id="bb">+1</button></div>
        <div style="display:flex; gap:8px; margin-top:12px;">
          <button class="btn" id="br" style="flex:1;">СБРОС</button>
          <button class="btn btn-primary" id="bi" style="flex:2;">ПОДАТЬ</button>
        </div>`;
      container.querySelector("#ba").addEventListener("click", () => { dA = (dA + 1) % 7; audioEngine.playTick(); renderD(); });
      container.querySelector("#bb").addEventListener("click", () => { dB = (dB + 1) % 7; audioEngine.playTick(); renderD(); });
      container.querySelector("#br").addEventListener("click", () => { dA = 0; dB = 0; audioEngine.playTick(); renderD(); });
      container.querySelector("#bi").addEventListener("click", () => {
        if (dA === room.targetA && dB === room.targetB) solveCurrentRoom("Давление стабильно. Шлюз открыт.");
        else { audioEngine.playWallScratching(); feedback.textContent = "Неверная доза. Осмотрите кафель за столом."; }
      });
    };
    renderD();
  } else if (room.puzzleType === "valve") {
    let seq = [];
    const renderV = () => {
      container.innerHTML = `
        <div class="puzzle-row"><span>ОБОРОТЫ:</span><strong style="color:var(--amber-glow);">${seq.join(" → ") || "НЕТ"}</strong></div>
        <div style="display:flex; gap:8px; margin-bottom:12px;">
          <button class="btn" id="vr" style="flex:1;">↻ ВПРАВО (R)</button>
          <button class="btn" id="vl" style="flex:1;">↺ ВЛЕВО (L)</button>
          <button class="hud-btn" id="vrs">СБРОС</button>
        </div>
        <input type="text" id="b-msg" maxlength="80" placeholder="Сообщение в эфир..." style="width:100%; padding:9px; background:#050705; border:1px solid var(--mold-green); color:var(--bone-white); font-family:inherit; margin-bottom:8px;">
        <button class="btn btn-primary" id="bs" style="width:100%;">ОТПРАВИТЬ СИГНАЛ</button>`;
      const chk = () => {
        if (seq.join(",") === room.targetSequence.join(",")) solveCurrentRoom("Гермошлюз разгерметизирован. Путь в секретные сектора открыт.");
        else if (seq.length >= room.targetSequence.length) {
          audioEngine.playWallScratching(); feedback.textContent = "Клапан сорвался. Осмотрите металл у штурвала.";
          seq = []; setTimeout(renderV, 500);
        }
      };
      container.querySelector("#vr").addEventListener("click", () => { seq.push("R"); audioEngine.playSteelChains(); renderV(); chk(); });
      container.querySelector("#vl").addEventListener("click", () => { seq.push("L"); audioEngine.playSteelChains(); renderV(); chk(); });
      container.querySelector("#vrs").addEventListener("click", () => { seq = []; renderV(); });
      container.querySelector("#bs").addEventListener("click", () => {
        const msg = container.querySelector("#b-msg").value.trim();
        audioEngine.playSteelChains();
        feedback.textContent = msg ? `СИГНАЛ УШЁЛ: «${msg}»` : "АВАРИЙНЫЙ МАЯК ОТПРАВЛЕН.";
      });
    };
    renderV();
  } else if (room.puzzleType === "text_code") {
    const val = room.solved ? room.targetWord : "";
    container.innerHTML = `
      <div class="puzzle-row"><span>НАДПИСЬ НА СТЕНЕ:</span></div>
      <input type="text" id="secret-word-inp" maxlength="30" value="${val}" placeholder="${room.placeholder || 'Введите фразу...'}"
             style="width:100%; padding:10px; background:#050705; border:1px solid var(--mold-green); color:var(--bone-white); font-family:inherit; font-size:15px; letter-spacing:2px; text-transform:uppercase; margin-bottom:10px;">
      <button class="btn btn-primary" id="btn-word-chk" style="width:100%;">ПОДТВЕРДИТЬ ФРАЗУ</button>
    `;
    const inp = container.querySelector("#secret-word-inp");
    const submit = () => {
      const normalized = inp.value.trim().toUpperCase().replace(/\s+/g, " ");
      if (normalized === room.targetWord) {
        solveCurrentRoom("Засов архива поддался. Проход открыт.");
      } else {
        audioEngine.playWallScratching();
        feedback.textContent = "Неверная фраза. Осветите правую стену над водой.";
      }
    };
    container.querySelector("#btn-word-chk").addEventListener("click", submit);
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
  } else if (room.puzzleType === "pin_digits") {
    const len = room.targetPin.length;
    const curPin = room.solved ? [...room.targetPin] : Array(len).fill(0);
    const wrap = document.createElement("div"); wrap.className = "code-slots";
    curPin.forEach((digit, idx) => {
      const btn = document.createElement("button"); btn.className = "code-slot-btn"; btn.textContent = String(digit);
      btn.addEventListener("click", () => {
        curPin[idx] = (curPin[idx] + 1) % 10;
        btn.textContent = String(curPin[idx]);
        audioEngine.playTick();
      });
      wrap.appendChild(btn);
    });
    const submitBtn = document.createElement("button");
    submitBtn.className = "btn btn-primary"; submitBtn.style.width = "100%"; submitBtn.textContent = "СНЯТЬ БЛОКИРОВКУ";
    submitBtn.addEventListener("click", () => {
      if (curPin.join("-") === room.targetPin.join("-")) solveCurrentRoom("Шифр принят. Механизм разблокирован.");
      else { audioEngine.playWallScratching(); feedback.textContent = "Неверный шифр. Проведите фонарём по стенам, полу и потолку."; }
    });
    container.appendChild(wrap); container.appendChild(submitBtn);
  }
  openModalEl(modal);
}

function triggerLockHapticFeedback() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate([75, 55, 130]);
    } catch (e) {}
  }
}

function playMechanismUnlockClank() {
  if (!audioEngine.ctx || !audioEngine.enabled) return;
  const now = audioEngine.ctx.currentTime;

  [0, 0.14, 0.29].forEach((offset, idx) => {
    const t = now + offset;
    const osc = audioEngine.ctx.createOscillator();
    osc.type = idx === 1 ? "square" : "sawtooth";
    const startFreq = idx === 0 ? 195 : (idx === 1 ? 132 : 86);
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(idx === 2 ? 34 : 58, t + 0.16);

    const bp = audioEngine.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(idx === 0 ? 1150 : 680, t);
    bp.Q.value = 6.5;

    const g = audioEngine.ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(idx === 2 ? 0.55 : 0.42, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.19);

    osc.connect(bp);
    bp.connect(g);
    g.connect(audioEngine.dryGain);
    g.connect(audioEngine.convolver);
    osc.start(t);
    osc.stop(t + 0.21);
  });

  audioEngine.playSteelChains(0);
}

const chamberCutsceneWrap = document.getElementById("chamber-cutscene-wrap");
const chamberCutsceneVideo = document.getElementById("chamber-cutscene-video");
let chamberCutscenePlaying = false;

function playChamberCutscene() {
  if (!chamberCutsceneWrap || !chamberCutsceneVideo) return;
  chamberCutscenePlaying = true;
  if (tapeVideo && !tapeVideo.paused) tapeVideo.pause();
  if (tapeVideoWrap) tapeVideoWrap.classList.remove("playing");
  chamberCutsceneWrap.classList.add("playing");
  chamberCutsceneVideo.muted = !audioEngine.enabled;
  try { chamberCutsceneVideo.currentTime = 0; } catch (e) {}
  const p = chamberCutsceneVideo.play();
  if (p && typeof p.catch === "function") p.catch(() => {});
}

function stopChamberCutscene() {
  chamberCutscenePlaying = false;
  if (chamberCutsceneVideo && !chamberCutsceneVideo.paused) {
    try { chamberCutsceneVideo.pause(); } catch (e) {}
  }
  if (chamberCutsceneWrap) chamberCutsceneWrap.classList.remove("playing");
}

if (chamberCutsceneVideo) {
  chamberCutsceneVideo.addEventListener("ended", () => {
    stopChamberCutscene();
    if (ROOMS.every(r => r.solvedOnce)) {
      setTimeout(() => openFinalModalWithSmartDefault(), 900);
    }
  });
}

function solveCurrentRoom(msg) {
  const room = ROOMS[currentRoomIndex];
  const alreadySolvedOnce = Boolean(room.solvedOnce);
  room.solved = true;
  room.solvedOnce = true;
  playMechanismUnlockClank();
  triggerLockHapticFeedback();
  document.getElementById("modal-feedback").textContent = msg;
  updateRoomHUD();
  saveProgress();
  if (room.id === 7) {
    const pModal = document.getElementById("puzzle-modal");
    if (pModal) closeModalEl(pModal);
    setTimeout(() => playChamberCutscene(), 350);
    return;
  }
  if (!alreadySolvedOnce && ROOMS.every(r => r.solvedOnce)) {
    setTimeout(() => openFinalModalWithSmartDefault(), 1400);
  }
}

/* ============================================================
   ИНИЦИАЛИЗАЦИЯ UI
============================================================ */
const introBgm = document.getElementById("intro-bgm");
let introBgmStarted = false;
let introProceduralMixActive = false;

function startIntroProceduralLayer() {
  if (introProceduralMixActive) return;
  audioEngine.init();
  if (!audioEngine.ctx || !audioEngine.enabled) return;

  introProceduralMixActive = true;
  if (audioEngine.master) {
    audioEngine.master.gain.setTargetAtTime(0.42, audioEngine.ctx.currentTime, 0.25);
  }
  audioEngine.playHeartbeatPulse(0.45);
  setTimeout(() => {
    if (!document.getElementById("intro-screen").classList.contains("hidden") && audioEngine.enabled) {
      audioEngine.playWhisper();
    }
  }, 600);
}

function stopIntroProceduralLayer() {
  introProceduralMixActive = false;
  if (audioEngine.ctx && audioEngine.master) {
    audioEngine.master.gain.setTargetAtTime(
      audioEngine.enabled ? 1.38 : 0.0001,
      audioEngine.ctx.currentTime,
      0.25
    );
  }
}

function armAndLoadIntroBgm() {
  if (!introBgm) return;
  introBgm.preload = "metadata";
  introBgm.loop = true;
  introBgm.volume = 0.56;

  const attemptPlay = () => {
    if (!introBgm || document.getElementById("intro-screen").classList.contains("hidden")) return;
    introBgm.volume = 0.56;
    const p = introBgm.play();
    if (p && typeof p.then === "function") {
      p.then(() => { introBgmStarted = true; }).catch(() => {});
    }
  };

  attemptPlay();
  window.addEventListener("DOMContentLoaded", attemptPlay, { once: true });
  window.addEventListener("load", attemptPlay, { once: true });

  const unlockOnInteraction = () => {
    if (document.getElementById("intro-screen").classList.contains("hidden")) return;
    startIntroProceduralLayer();
    attemptPlay();
    if (introBgmStarted || !introBgm.paused) {
      window.removeEventListener("pointerdown", unlockOnInteraction);
      window.removeEventListener("keydown", unlockOnInteraction);
      window.removeEventListener("touchstart", unlockOnInteraction);
    }
  };

  window.addEventListener("pointerdown", unlockOnInteraction, { passive: true });
  window.addEventListener("keydown", unlockOnInteraction, { passive: true });
  window.addEventListener("touchstart", unlockOnInteraction, { passive: true });
}

function fadeOutIntroBgm() {
  stopIntroProceduralLayer();
  if (!introBgm) return;
  const step = 0.05;
  const timer = setInterval(() => {
    if (!introBgm || introBgm.volume <= step) {
      clearInterval(timer);
      if (introBgm) {
        introBgm.volume = 0;
        introBgm.pause();
      }
      return;
    }
    introBgm.volume = Math.max(0, introBgm.volume - step);
  }, 55);
}

/* ============================================================
   ФОТОРЕАЛИСТИЧНЫЙ МНОГОСЛОЙНЫЙ ТУМАН ПОВЕРХ TITLE.JPG
============================================================ */
const introFogCanvas = document.getElementById("intro-fog-canvas");
const introFogCtx = introFogCanvas ? introFogCanvas.getContext("2d") : null;

const fogNoiseCanvas = document.createElement("canvas");
fogNoiseCanvas.width = 256;
fogNoiseCanvas.height = 144;
const fogNoiseCtx = fogNoiseCanvas.getContext("2d");
const fogNoiseImg = fogNoiseCtx.createImageData(256, 144);

const GRID_W = 32;
const GRID_H = 18;
const baseGrid = new Float32Array(GRID_W * GRID_H);
for (let i = 0; i < baseGrid.length; i++) {
  baseGrid[i] = Math.random();
}

function samplePeriodicValue(gx, gy, w, h) {
  const xi = ((Math.floor(gx) % w) + w) % w;
  const yi = ((Math.floor(gy) % h) + h) % h;
  const xf = gx - Math.floor(gx);
  const yf = gy - Math.floor(gy);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const x1 = (xi + 1) % w;
  const y1 = (yi + 1) % h;

  const v00 = baseGrid[yi * w + xi];
  const v10 = baseGrid[yi * w + x1];
  const v01 = baseGrid[y1 * w + xi];
  const v11 = baseGrid[y1 * w + x1];

  const a = v00 + (v10 - v00) * u;
  const b = v01 + (v11 - v01) * u;
  return a + (b - a) * v;
}

function fbmFog(nx, ny, t) {
  const warpX = (samplePeriodicValue(nx * 5.0 + t * 0.045, ny * 4.0 - t * 0.02, GRID_W, GRID_H) - 0.5) * 1.45;
  const warpY = (samplePeriodicValue(nx * 4.5 - t * 0.03, ny * 5.0 + t * 0.038, GRID_W, GRID_H) - 0.5) * 1.25;

  let sum = 0;
  let amp = 0.55;
  let freq = 4.2;
  let norm = 0;

  for (let oct = 0; oct < 4; oct++) {
    const sx = (nx + warpX * (0.28 + oct * 0.08)) * freq + t * (0.06 + oct * 0.025) * (oct % 2 === 0 ? 1 : -0.7);
    const sy = (ny + warpY * (0.24 + oct * 0.07)) * freq + Math.sin(t * 0.03 + oct) * 0.35;
    sum += samplePeriodicValue(sx, sy, GRID_W, GRID_H) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.05;
  }
  return sum / norm;
}

const fogWisps = Array.from({ length: 22 }, (_, i) => ({
  x: Math.random(),
  y: 0.22 + Math.random() * 0.58,
  rx: 0.14 + Math.random() * 0.22,
  ry: 0.035 + Math.random() * 0.075,
  vx: (0.008 + Math.random() * 0.014) * (i % 2 === 0 ? 1 : -1),
  phase: Math.random() * Math.PI * 2,
  alpha: 0.05 + Math.random() * 0.09,
  tint: i % 3 === 0 ? "185, 196, 178" : (i % 3 === 1 ? "158, 168, 152" : "195, 145, 112")
}));

let lastFogTime = performance.now();

function resizeIntroFog() {
  if (!introFogCanvas || !introFogCtx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  introFogCanvas.width = Math.floor(window.innerWidth * dpr);
  introFogCanvas.height = Math.floor(window.innerHeight * dpr);
  introFogCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeIntroFog);
resizeIntroFog();

function renderIntroFog(now) {
  const introEl = document.getElementById("intro-screen");
  if (!introEl || introEl.classList.contains("hidden") || !introFogCanvas || !introFogCtx) {
    lastFogTime = now;
    requestAnimationFrame(renderIntroFog);
    return;
  }

  const dtSec = Math.min(0.08, (now - lastFogTime) / 1000);
  lastFogTime = now;
  const t = now * 0.001;
  const w = window.innerWidth;
  const h = window.innerHeight;

  const data = fogNoiseImg.data;
  const nw = fogNoiseCanvas.width;
  const nh = fogNoiseCanvas.height;

  for (let y = 0; y < nh; y++) {
    const ny = y / nh;
    const bandWeight = 0.55 + 0.45 * Math.exp(-Math.pow((ny - 0.52) / 0.28, 2));
    for (let x = 0; x < nw; x++) {
      const nx = x / nw;
      const nVal = fbmFog(nx, ny, t);
      const shaped = Math.pow(Math.max(0, (nVal - 0.34) / 0.58), 1.65);
      const alphaByte = Math.min(255, Math.floor(shaped * bandWeight * 175));

      const idx = (y * nw + x) * 4;
      data[idx]     = 176 + Math.floor(shaped * 24);
      data[idx + 1] = 184 + Math.floor(shaped * 20);
      data[idx + 2] = 172 + Math.floor(shaped * 14);
      data[idx + 3] = alphaByte;
    }
  }
  fogNoiseCtx.putImageData(fogNoiseImg, 0, 0);

  introFogCtx.clearRect(0, 0, w, h);

  introFogCtx.save();
  introFogCtx.filter = "blur(10px)";
  introFogCtx.globalAlpha = 0.86;
  introFogCtx.drawImage(fogNoiseCanvas, 0, 0, w, h);
  introFogCtx.restore();

  introFogCtx.save();
  for (let i = 0; i < fogWisps.length; i++) {
    const sp = fogWisps[i];
    sp.x += sp.vx * dtSec;
    if (sp.x > 1.25) sp.x = -0.25;
    if (sp.x < -0.25) sp.x = 1.25;

    const cx = sp.x * w;
    const cy = (sp.y + Math.sin(t * 0.55 + sp.phase) * 0.025) * h;
    const radX = sp.rx * w;
    const radY = Math.max(24, sp.ry * h);

    const grad = introFogCtx.createRadialGradient(cx, cy, radY * 0.08, cx, cy, radX);
    const pulseAlpha = sp.alpha * (0.75 + 0.25 * Math.sin(t * 0.9 + sp.phase));
    grad.addColorStop(0, `rgba(${sp.tint}, ${pulseAlpha.toFixed(3)})`);
    grad.addColorStop(0.55, `rgba(${sp.tint}, ${(pulseAlpha * 0.42).toFixed(3)})`);
    grad.addColorStop(1, `rgba(${sp.tint}, 0)`);

    introFogCtx.fillStyle = grad;
    introFogCtx.beginPath();
    introFogCtx.ellipse(cx, cy, radX, radY, Math.sin(t * 0.2 + sp.phase) * 0.06, 0, Math.PI * 2);
    introFogCtx.fill();
  }
  introFogCtx.restore();

  requestAnimationFrame(renderIntroFog);
}

requestAnimationFrame(renderIntroFog);

armAndLoadIntroBgm();

document.getElementById("btn-enter-house").addEventListener("click", () => {
  const introEl = document.getElementById("intro-screen");
  const preloaderEl = document.getElementById("preloader-screen");
  if (preloaderEl) preloaderEl.style.display = "none";
  if (introEl) introEl.classList.add("hidden");
  fadeOutIntroBgm();
  audioEngine.init();
  const sBtn = document.getElementById("btn-toggle-sound");
  if (sBtn) {
    sBtn.textContent = "ЗВУК: ВКЛ";
    sBtn.classList.add("active");
    sBtn.setAttribute("aria-pressed", "true");
  }
  if (tapeVideo) tapeVideo.muted = false;
  syncTapeVideo();
  resizeAll();
  setTimeout(() => { spawnShadowEntity(true); audioEngine.playWallScratching(); }, 600);
});

document.getElementById("btn-open-puzzle").addEventListener("click", openPuzzleModal);
document.getElementById("btn-close-puzzle").addEventListener("click", () => closeModalEl(document.getElementById("puzzle-modal")));

document.getElementById("btn-toggle-flashlight").addEventListener("click", (e) => {
  flashlightOn = !flashlightOn;
  e.target.textContent = `ФОНАРЬ [F]: ${flashlightOn ? "ВКЛ" : "ВЫКЛ"}`;
  e.target.classList.toggle("active", flashlightOn);
  e.target.setAttribute("aria-pressed", String(flashlightOn));
  saveProgress();
});

document.getElementById("btn-toggle-freemode").addEventListener("click", (e) => {
  freeMode = !freeMode;
  e.target.textContent = `РЕЖИМ: ${freeMode ? "СВОБОДНЫЙ" : "КВЕСТ"}`;
  e.target.classList.toggle("active", freeMode);
  e.target.setAttribute("aria-pressed", String(freeMode));
  updateRoomHUD();
  saveProgress();
});

document.getElementById("btn-toggle-sound").addEventListener("click", (e) => {
  const on = audioEngine.toggle();
  if (tapeVideo) tapeVideo.muted = !on;
  e.target.textContent = `ЗВУК: ${on ? "ВКЛ" : "ВЫКЛ"}`;
  e.target.classList.toggle("active", on);
  e.target.setAttribute("aria-pressed", String(on));
});

document.getElementById("btn-prev-room").addEventListener("click", () =>
  attemptRoomTransition(Math.max(0, currentRoomIndex - 1)));
document.getElementById("btn-next-room").addEventListener("click", () =>
  attemptRoomTransition((currentRoomIndex + 1) % ROOMS.length));

document.getElementById("btn-ending-loop").addEventListener("click", () => renderEndingModal("loop"));
document.getElementById("btn-ending-archive").addEventListener("click", () => renderEndingModal("archive"));
document.getElementById("btn-ending-break").addEventListener("click", () => renderEndingModal("break"));

document.getElementById("btn-close-final").addEventListener("click", () => closeModalEl(document.getElementById("final-modal")));

document.getElementById("btn-reset-progress").addEventListener("click", () => {
  resetProgress();
  ROOMS.forEach(r => { r.solved = false; r.solvedOnce = false; r.tapePlaying = false; r.tapeFinished = false; });
  unlockedEndings = [];
  selectedEndingId = "loop";
  panicEpisodesCount = 0;
  basementDescendedOnce = false;
  currentRoomIndex = 0;
  freeMode = false;
  const fBtn = document.getElementById("btn-toggle-freemode");
  fBtn.textContent = "РЕЖИМ: КВЕСТ";
  fBtn.classList.remove("active");
  fBtn.setAttribute("aria-pressed", "false");
  if (tapeVideo) { tapeVideo.pause(); tapeVideo.currentTime = 0; if (tapeVideoWrap) tapeVideoWrap.classList.remove("playing"); }
  closeModalEl(document.getElementById("final-modal"));
  applyRoomTexture(0);
  updateRoomHUD();
  saveProgress();
});

function handleTabBlurAudio(hidden) {
  if (!audioEngine.ctx || !audioEngine.master) return;
  const now = audioEngine.ctx.currentTime;
  if (hidden) {
    audioEngine.master.gain.cancelScheduledValues(now);
    audioEngine.master.gain.setTargetAtTime(0.0001, now, 0.04);
    stopHallucinationHeartbeat();
    setTimeout(() => {
      if (document.hidden && audioEngine.ctx && audioEngine.ctx.state === "running") {
        audioEngine.ctx.suspend().catch(() => {});
      }
    }, 140);
  } else {
    const resumeAudio = () => {
      if (!audioEngine.ctx || !audioEngine.master) return;
      const t = audioEngine.ctx.currentTime;
      const targetGain = audioEngine.enabled ? (introProceduralMixActive ? 0.42 : 1.38) : 0.0001;
      audioEngine.master.gain.cancelScheduledValues(t);
      audioEngine.master.gain.setValueAtTime(0.0001, t);
      audioEngine.master.gain.setTargetAtTime(targetGain, t + 0.05, 0.12);
      if (hallucinationState.phase !== "idle") startHallucinationHeartbeat();
    };
    if (audioEngine.ctx.state === "suspended") {
      audioEngine.ctx.resume().then(resumeAudio).catch(() => {});
    } else {
      resumeAudio();
    }
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    saveProgress();
    handleTabBlurAudio(true);
    if (tapeVideo && !tapeVideo.paused) tapeVideo.pause();
    if (activeCustomLayerAudio && !activeCustomLayerAudio.paused) activeCustomLayerAudio.pause();
    editor360ActiveObjects.forEach(o => { if (o.video && !o.video.paused) o.video.pause(); });
    if (chamberCutsceneVideo && !chamberCutsceneVideo.paused) chamberCutsceneVideo.pause();
  } else {
    handleTabBlurAudio(false);
    syncTapeVideo();
    editor360ActiveObjects.forEach(o => { if (o.video && o.cfg.loop && o.video.paused) o.video.play().catch(() => {}); });
    if (chamberCutscenePlaying && chamberCutsceneVideo && chamberCutsceneVideo.paused) {
      const p = chamberCutsceneVideo.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }
});

window.addEventListener("pagehide", () => {
  saveProgress();
  audioEngine.destroy();
  if (entitySpawnTimer) clearInterval(entitySpawnTimer);
});

glCanvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  document.getElementById("fatal-overlay").classList.add("visible");
});
glCanvas.addEventListener("webglcontextrestored", () => {
  document.getElementById("fatal-overlay").classList.remove("visible");
});

/* ============================================================
   ПРЕЛОАДЕР С PRELOADER.MP4
============================================================ */
(function initPreloaderFlow() {
  const preloaderEl = document.getElementById("preloader-screen");
  const preloaderVid = document.getElementById("preloader-video");
  const barFillEl = document.getElementById("preloader-bar-fill");
  const statusEl = document.getElementById("preloader-status");
  const titleEl = document.getElementById("preloader-title");
  const introEl = document.getElementById("intro-screen");

  function fitPreloaderTitle() {
    if (!titleEl) return;
    const avail = Math.max(200, window.innerWidth * 0.86);
    let size = Math.min(30, Math.max(12, Math.floor(window.innerWidth * 0.032)));
    titleEl.style.fontSize = size + "px";
    titleEl.style.letterSpacing = size > 18 ? "4px" : "2px";
    while (size > 11 && titleEl.scrollWidth > avail) {
      size -= 1;
      titleEl.style.fontSize = size + "px";
      titleEl.style.letterSpacing = size > 16 ? "3px" : "1px";
    }
  }

  fitPreloaderTitle();
  window.addEventListener("resize", fitPreloaderTitle);

  if (!preloaderEl) {
    if (introEl) introEl.classList.remove("hidden");
    return;
  }

  preloaderEl.style.display = "flex";
  preloaderEl.classList.remove("done");
  if (introEl) introEl.classList.add("hidden");

  if (preloaderVid) {
    preloaderVid.muted = true;
    preloaderVid.playsInline = true;
    preloaderVid.loop = true;
    const playPromise = preloaderVid.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }

  try {
    const imageAssets = ["title.jpg"];
    ROOMS.forEach(r => {
      if (r.fileName) imageAssets.push(r.fileName);
      if (r.hallucinationFileName) imageAssets.push(r.hallucinationFileName);
    });
    imageAssets.forEach(src => {
      const img = new Image();
      img.src = src;
    });
    ["tape.mp4", "Chamber_cutscene.mp4", "./assets/1000405140.mp4", "1000405140.mp4", "Abandoned%20Victims.mp3", "Abandoned%20Victims.ogg"].forEach(src => {
      const isAudio = src.includes("Abandoned");
      const el = document.createElement(isAudio ? "audio" : "video");
      el.preload = "auto";
      el.src = src;
    });
  } catch (e) {}

  const totalDurationMs = 15000;
  const startMs = performance.now();
  let currentPct = 0;
  let finished = false;

  function applyProgress(pct) {
    currentPct = Math.max(currentPct, Math.min(100, Math.round(pct)));
    if (barFillEl) barFillEl.style.width = currentPct + "%";
    if (statusEl) {
      if (currentPct < 30) statusEl.textContent = `Загрузка картинок и текстур... ${currentPct}%`;
      else if (currentPct < 65) statusEl.textContent = `Загрузка звуковых треков... ${currentPct}%`;
      else if (currentPct < 100) statusEl.textContent = `Сборка сцен и теней... ${currentPct}%`;
      else statusEl.textContent = "Загрузка завершена · 100%";
    }
  }

  function startSlowFadeToTitle() {
    if (finished) return;
    finished = true;
    clearInterval(tickTimer);
    clearTimeout(hardTimer);
    applyProgress(100);

    preloaderEl.classList.add("done");
    if (introEl) introEl.classList.remove("hidden");
    try {
      if (typeof armAndLoadIntroBgm === "function") armAndLoadIntroBgm();
      if (typeof startIntroProceduralLayer === "function") startIntroProceduralLayer();
      const b = document.getElementById("intro-bgm");
      if (b) {
        b.preload = "auto";
        b.volume = 0.65;
        const p = b.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    } catch (e) {}

    setTimeout(() => {
      if (preloaderVid && !preloaderVid.paused) {
        try { preloaderVid.pause(); } catch (e) {}
      }
      preloaderEl.style.display = "none";
    }, 2250);
  }

  const tickTimer = setInterval(() => {
    if (finished) return;
    const elapsed = performance.now() - startMs;
    const pct = (elapsed / totalDurationMs) * 100;
    applyProgress(pct);
    if (elapsed >= totalDurationMs) {
      startSlowFadeToTitle();
    }
  }, 100);

  const hardTimer = setTimeout(startSlowFadeToTitle, totalDurationMs + 250);
})();

/* ============================================================
   ЗАПУСК
============================================================ */
loadProgress();
tryAutoLoadImages();
applyRoomTexture(currentRoomIndex);
buildDepthNav();
updateRoomHUD();
ensureFlashlightSprite();

const fBtnInit = document.getElementById("btn-toggle-flashlight");
fBtnInit.textContent = `ФОНАРЬ [F]: ${flashlightOn ? "ВКЛ" : "ВЫКЛ"}`;
fBtnInit.classList.toggle("active", flashlightOn);
fBtnInit.setAttribute("aria-pressed", String(flashlightOn));

const fmBtnInit = document.getElementById("btn-toggle-freemode");
fmBtnInit.textContent = `РЕЖИМ: ${freeMode ? "СВОБОДНЫЙ" : "КВЕСТ"}`;
fmBtnInit.classList.toggle("active", freeMode);
fmBtnInit.setAttribute("aria-pressed", String(freeMode));

requestAnimationFrame(animate);
syncTapeVideo();
