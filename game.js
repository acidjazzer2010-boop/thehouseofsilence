'use strict';

/* ============================================================
   КОНСТАНТЫ И СПИСОК КОМНАТ
   1-5: основные (Taperoom.jpg, Gallery.jpg, attic.jpg, Surgeryroom.jpg, Bunker.jpg)
   6-9: секретные (открываются только после прохождения 1-5)
   10:  процедурная аномалия
============================================================ */
const REDUCE_MOTION     = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const STORAGE_KEY       = 'osobnyak_progress_v4';
const FLASHLIGHT_RATIO  = 0.34;
const TRANSITION_SPEED  = 0.026;
const POINTER_LERP      = 0.12;
const ENTITY_LERP       = 0.035;
const ENTITY_EVADE_LERP = 0.14;

const ROOMS = [
  {
    id: 0, code: "СЕКТОР 01 // TAPEROOM", fileName: "Taperoom.jpg",
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
    isSecret: true,
    title: "Тайник IV: Зеркальный изолятор",
    desc: "Круглая камера с треснувшими зеркалами, ржавой клеткой, грязными тапочками у порога и двумя цифрами в проломе потолка.",
    portal: { x: 0.62, y: 0.48, label: "Спуск в Процедурную аномалию" },
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
  /* ==== 10-Я КОМНАТА: ПРОЦЕДУРНАЯ АНОМАЛИЯ ==== */
  {
    id: 9, code: "СЕКТОР 10 // ПРОЦЕДУРНАЯ АНОМАЛИЯ", fileName: "PROCEDURAL_ENGINE",
    isProceduralRoom: true,
    title: "Меняющаяся камера под фундаментом",
    desc: "Стены этого помещения перестраиваются каждый раз, когда вы переступаете порог. Ищите выцарапанный шифр в луче фонаря.",
    portal: { x: 0.78, y: 0.50, label: "Выход на поверхность (В начало)" },
    artifact: { x: 0.35, y: 0.55, label: "Ржавый релейный шкаф" },
    shadowSpots: [{ x: 0.74, y: 0.53, scale: 1.05 }, { x: 0.22, y: 0.56, scale: 0.92 }],
    palette: { wall: "#161a18", floor: "#0a0c0b", light: "#8f3222" },
    reverbDecay: 5.8, solved: false, solvedOnce: false,
    puzzleTitle: "Релейный замок аномалии",
    puzzleDesc: "Осмотрите стены и бетонные балки этой камеры фонарём — на них процарапаны 3 цифры актуального шифра.",
    puzzleType: "procedural_pin",
    targetPin: [4, 0, 9]
  }
];

const PROCEDURAL_ARCHETYPES = [
  { name: "Затопленный коллектор под фундаментом", desc: "Чёрная стоячая вода отражает треснувшие бетонные своды и ржавые вентили. Откуда-то снизу доносится глухой стук.", bgTop: "#0e1513", bgBot: "#040605", accent: "#2c3d37", rust: "#5e251a" },
  { name: "Изолятор с облупленной кафельной кладкой", desc: "Узкая камера без окон. С потолка свисают обрывки проводов и крюки, а по углам расползлась чёрная плесень.", bgTop: "#171915", bgBot: "#050604", accent: "#393e33", rust: "#6b2b1e" },
  { name: "Архивный склеп с обрушенными стеллажами", desc: "Покосившиеся железные шкафы завалены истлевшими папками и битым стеклом. Воздух тяжёлый и ледяной.", bgTop: "#1a1412", bgBot: "#050403", accent: "#42332d", rust: "#7a2c1d" },
  { name: "Шахта старого грузового подъёмника", desc: "Ржавые тросы уходят в непроглядную черноту наверху. На сыром бетоне видны следы чьих-то ногтей.", bgTop: "#121316", bgBot: "#030405", accent: "#2d313b", rust: "#6e261b" }
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
    // Мягкий компрессор защищает от жёстких пиков после увеличения громкости на +50%
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -10;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.18;

    this.master = this.ctx.createGain();
    this.master.gain.value = 1.38; // +50% к базовой громкости 0.92
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
    const now = this.ctx.currentTime, dur = 3.2 + Math.random() * 1.5;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = (Math.random() * 1.4) - 0.7;
    const src = this.ctx.createBufferSource();
    src.buffer = this.ambientBuffer; src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(32, now);
    lp.frequency.exponentialRampToValueAtTime(65, now + dur * 0.5);
    lp.frequency.exponentialRampToValueAtTime(28, now + dur);
    lp.Q.value = 6.0;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.9, now + 0.8);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(lp); lp.connect(env); env.connect(panner); panner.connect(this.convolver);
    src.start(now); src.stop(now + dur);
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
      rumble: () => this.playSubterraneanRumble(), whisper: () => this.playWhisper(),
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
   THREE.JS СЦЕНА 2.5D
============================================================ */
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 10);

scene.add(new THREE.AmbientLight(0x222a24, 0.7));
const spotLight = new THREE.SpotLight(0xffe6bd, 2.8, 35, Math.PI * 0.22, 0.65, 1.2);
spotLight.position.set(0, 0, 10);
scene.add(spotLight);
scene.add(spotLight.target);

const roomPlaneGeo = new THREE.PlaneGeometry(16, 9);
const roomPlaneMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const roomMesh = new THREE.Mesh(roomPlaneGeo, roomPlaneMat);
scene.add(roomMesh);

/* ============================================================
   ОЖИВЛЕНИЕ КОМНАТ: GOD RAYS (ФРЕНЕЛЬ + АДДИТИВНОЕ СМЕШИВАНИЕ),
   MESHPHYSICALMATERIAL (ПРЕЛОМЛЕНИЕ / IOR) И ПРОЦЕДУРНЫЙ 3D-СЛОЙ
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

// Процедурная текстура ряби/неровности для преломляющей поверхности (MeshPhysicalMaterial)
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

// Процедурный 3D-кластер из примитивов без внешних файлов (обломки, ржавые кольца, шипы)
const proceduralDebrisGroup = new THREE.Group();
const debrisMat = new THREE.MeshStandardMaterial({
  color: 0x3b2c23,
  roughness: 0.86,
  metalness: 0.35,
  bumpMap: refractionBumpTex,
  bumpScale: 0.04,
  transparent: true,
  opacity: 0.55
});
const debrisItems = [];
for (let i = 0; i < 9; i++) {
  const geo = i % 3 === 0
    ? new THREE.OctahedronGeometry(0.18 + (i % 3) * 0.06, 0)
    : (i % 3 === 1 ? new THREE.TorusGeometry(0.22, 0.035, 8, 16) : new THREE.ConeGeometry(0.12, 0.36, 6));
  const mesh = new THREE.Mesh(geo, debrisMat);
  mesh.position.set(
    -4.2 + (i % 5) * 2.1,
    -2.2 + Math.floor(i / 5) * 2.8,
    0.75 + (i % 3) * 0.25
  );
  mesh.userData = {
    baseX: mesh.position.x,
    baseY: mesh.position.y,
    phase: i * 1.15,
    speed: 0.4 + (i % 4) * 0.14
  };
  proceduralDebrisGroup.add(mesh);
  debrisItems.push(mesh);
}
scene.add(proceduralDebrisGroup);

const proceduralTextureCache = {};

/* ============================================================
   РЕЖИМ РАЗРАБОТЧИКА: 360° ЖИВАЯ КОМНАТА С МАЯТНИКОМ (ЛОКАЦИЯ #7)
   Позволяет вращать камеру на все 360° по горизонтали и смотреть вверх/вниз,
   осматривать углы, улики и живой маятник перед масштабированием на весь дом.
============================================================ */
const dev360 = {
  active: false,
  scene: null,
  camera: null,
  flashLight: null,
  flashTarget: null,
  pendulumPivot: null,
  pendulumBlade: null,
  shadowFigure: null,
  shadowAngle: Math.PI, // стоит за спиной игрока
  yaw: 0,
  pitch: -0.05,
  targetYaw: 0,
  targetPitch: -0.05,
  dragging: false,
  lastX: 0,
  lastY: 0,
  lastSwingSide: 0,
  wallHotspots: [],
  keysHeld: Object.create(null)
};

function makeDungeonSurfaceTexture(type = "wall") {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");

  g.fillStyle = type === "floor" ? "#141714" : (type === "ceiling" ? "#0d100d" : "#1f241d");
  g.fillRect(0, 0, size, size);

  // Каменная кладка / плиты
  const step = type === "floor" ? 128 : 170;
  g.strokeStyle = "rgba(6, 8, 6, 0.78)";
  g.lineWidth = 4;
  for (let y = 0; y < size; y += step) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(size, y); g.stroke();
    const rowShift = ((y / step) % 2) * (step * 0.5);
    for (let x = rowShift; x < size; x += step) {
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + step); g.stroke();
    }
  }

  // Зернистость сырого камня
  for (let i = 0; i < 16000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const d = (Math.random() - 0.5) * 38;
    g.fillStyle = `rgba(${72 + d}, ${78 + d}, ${66 + d}, 0.22)`;
    g.fillRect(x, y, 2, 2);
  }

  // Пятна чёрной плесени и бурой ржавчины
  for (let i = 0; i < 24; i++) {
    const mx = Math.random() * size;
    const my = Math.random() * size;
    const mr = 35 + Math.random() * 130;
    const mg = g.createRadialGradient(mx, my, 4, mx, my, mr);
    if (i % 3 === 0) {
      mg.addColorStop(0, "rgba(10, 14, 10, 0.82)");
      mg.addColorStop(1, "rgba(0,0,0,0)");
    } else if (i % 3 === 1) {
      mg.addColorStop(0, "rgba(74, 24, 14, 0.52)");
      mg.addColorStop(1, "rgba(0,0,0,0)");
    } else {
      mg.addColorStop(0, "rgba(38, 52, 34, 0.45)");
      mg.addColorStop(1, "rgba(0,0,0,0)");
    }
    g.fillStyle = mg;
    g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
  }

  // Подтёки влаги
  if (type === "wall") {
    for (let d = 0; d < 32; d++) {
      const dx = Math.random() * size;
      const dy = Math.random() * (size * 0.5);
      const len = 120 + Math.random() * 380;
      const dg = g.createLinearGradient(dx, dy, dx, dy + len);
      dg.addColorStop(0, "rgba(12, 16, 11, 0.72)");
      dg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = dg;
      g.fillRect(dx, dy, 3 + Math.random() * 5, len);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function buildDev360PendulumScene() {
  if (dev360.scene) return;
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x020302);
  s.fog = new THREE.FogExp2(0x020302, 0.085);

  const cam = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 60);
  cam.position.set(0, 1.65, 0);
  cam.rotation.order = "YXZ";
  s.add(cam);

  const wallTex = makeDungeonSurfaceTexture("wall");
  const floorTex = makeDungeonSurfaceTexture("floor");
  const ceilTex = makeDungeonSurfaceTexture("ceiling");

  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, bumpMap: wallTex, bumpScale: 0.04, roughness: 0.88, metalness: 0.08 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, bumpMap: floorTex, bumpScale: 0.05, roughness: 0.72, metalness: 0.15 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.94 });
  const rustMat = new THREE.MeshStandardMaterial({ color: 0x4b2a1d, roughness: 0.65, metalness: 0.72 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x8b948e, roughness: 0.28, metalness: 0.88 });

  const W = 9.0, H = 4.4, D = 9.0;
  // Пол и потолок
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  s.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  s.add(ceil);

  // 4 стены вокруг игрока
  const northWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
  northWall.position.set(0, H / 2, -D / 2);
  s.add(northWall);

  const southWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
  southWall.position.set(0, H / 2, D / 2);
  southWall.rotation.y = Math.PI;
  s.add(southWall);

  const westWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
  westWall.position.set(-W / 2, H / 2, 0);
  westWall.rotation.y = Math.PI / 2;
  s.add(westWall);

  const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
  eastWall.position.set(W / 2, H / 2, 0);
  eastWall.rotation.y = -Math.PI / 2;
  s.add(eastWall);

  // Решётка в потолке, сквозь которую падает холодный тусклый свет
  const grateGroup = new THREE.Group();
  for (let i = -3; i <= 3; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8), rustMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, H - 0.05, i * 0.28);
    grateGroup.add(bar);
  }
  s.add(grateGroup);

  // Огромный раскачивающийся маятник с серповидным лезвием перед игроком
  const pivot = new THREE.Group();
  pivot.position.set(0, H - 0.1, -2.5);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.0, 10), rustMat);
  rod.position.y = -1.5;
  pivot.add(rod);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.34, 0.03), bladeMat);
  blade.position.y = -3.0;
  pivot.add(blade);
  s.add(pivot);
  dev360.pendulumPivot = pivot;
  dev360.pendulumBlade = blade;

  // Каменная плита под маятником с выбитым знаком [X]
  const slabCanvas = document.createElement("canvas");
  slabCanvas.width = 512; slabCanvas.height = 512;
  const sg = slabCanvas.getContext("2d");
  sg.fillStyle = "#1a1e19"; sg.fillRect(0, 0, 512, 512);
  sg.strokeStyle = "#080a08"; sg.lineWidth = 8; sg.strokeRect(10, 10, 492, 492);
  sg.font = "bold 110px 'Courier New', monospace";
  sg.fillStyle = "rgba(195, 180, 155, 0.72)";
  sg.textAlign = "center";
  sg.fillText("X", 256, 285);
  sg.font = "22px 'Courier New', monospace";
  sg.fillStyle = "rgba(189, 125, 59, 0.75)";
  sg.fillText("ПОД ЛЕЗВИЕМ МАЯТНИКА", 256, 355);
  const slabTex = new THREE.CanvasTexture(slabCanvas);
  const slabMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.08, 1.6),
    new THREE.MeshStandardMaterial({ map: slabTex, roughness: 0.85 })
  );
  slabMesh.position.set(0, 0.04, -2.5);
  s.add(slabMesh);

  // Ржавые кандалы и порванный кожаный ремень на правой стене с уликой [I, III]
  const strapCanvas = document.createElement("canvas");
  strapCanvas.width = 512; strapCanvas.height = 256;
  const stg = strapCanvas.getContext("2d");
  stg.fillStyle = "#2b1911"; stg.fillRect(0, 0, 512, 256);
  stg.font = "bold 64px 'Courier New', monospace";
  stg.fillStyle = "#d9c9b2";
  stg.textAlign = "center";
  stg.fillText("I  ·  III", 256, 130);
  stg.font = "20px 'Courier New', monospace";
  stg.fillStyle = "#bd7d3b";
  stg.fillText("ВЫРЕЗАНО НА РЕМНЕ У КАНДАЛОВ", 256, 185);
  const strapTex = new THREE.CanvasTexture(strapCanvas);
  const strapMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.55, 0.06),
    new THREE.MeshStandardMaterial({ map: strapTex, roughness: 0.9 })
  );
  strapMesh.position.set(4.42, 1.45, 0.4);
  strapMesh.rotation.y = -Math.PI / 2;
  s.add(strapMesh);

  // Цепной стопор маятника на левой стене
  const leverBox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.75, 0.5), rustMat);
  leverBox.position.set(-4.42, 1.45, -0.6);
  s.add(leverBox);

  // Тёмная фигура-наблюдатель в дальнем углу за спиной (смещается, когда игрок отворачивается)
  const fig = build3DShadowEntity();
  fig.position.set(2.8, 1.15, 3.3);
  fig.userData.shadowMat.opacity = 0.88;
  fig.userData.eyeMat.opacity = 0.75;
  s.add(fig);
  dev360.shadowFigure = fig;

  // Освещение: слабый холодный свет из потолка + динамический фонарь в руке игрока
  s.add(new THREE.AmbientLight(0x161d17, 0.45));
  const ceilSpot = new THREE.PointLight(0x7c9682, 0.85, 11);
  ceilSpot.position.set(0, H - 0.35, -1.5);
  s.add(ceilSpot);

  const flash = new THREE.SpotLight(0xffe6bd, 3.4, 16, Math.PI * 0.22, 0.55, 1.1);
  const flashTarget = new THREE.Object3D();
  flashTarget.position.set(0, 0, -1);
  cam.add(flash);
  cam.add(flashTarget);
  flash.target = flashTarget;

  dev360.scene = s;
  dev360.camera = cam;
  dev360.flashLight = flash;
  dev360.flashTarget = flashTarget;
}

function toggleDev360Mode(forceState = null) {
  const next = forceState !== null ? Boolean(forceState) : !dev360.active;
  if (next === dev360.active) return;

  // Переводим текущую комнату на локацию #7 (Камера с маятником) для синхронизации с интерфейсом
  if (next) {
    currentRoomIndex = 7;
    applyRoomTexture(7);
    updateRoomHUD();
    buildDev360PendulumScene();
    dev360.yaw = 0;
    dev360.pitch = -0.04;
    dev360.targetYaw = 0;
    dev360.targetPitch = -0.04;
    if (gifRoomLayer) gifRoomLayer.classList.remove("visible");
  }

  dev360.active = next;
  const hudEl = document.getElementById("dev-360-hud");
  const btnEl = document.getElementById("btn-dev-pendulum");
  if (hudEl) hudEl.classList.toggle("visible", dev360.active);
  if (btnEl) {
    btnEl.classList.toggle("active", dev360.active);
    btnEl.textContent = dev360.active ? "DEV: ВЫЙТИ ИЗ 360°" : "DEV: МАЯТНИК 360°";
  }

  if (dev360.active && audioEngine.enabled) {
    audioEngine.playSubterraneanRumble();
    audioEngine.playSteelChains(0);
  }
}

function renderDev360Frame(time, dt) {
  if (!dev360.scene || !dev360.camera) return;

  // Поворот клавишами стрелок или A/D при тесте
  const rotSpeed = 0.032 * dt;
  if (dev360.keysHeld["arrowleft"] || dev360.keysHeld["a"] || dev360.keysHeld["ф"]) dev360.targetYaw += rotSpeed;
  if (dev360.keysHeld["arrowright"] || dev360.keysHeld["d"] || dev360.keysHeld["в"]) dev360.targetYaw -= rotSpeed;
  if (dev360.keysHeld["arrowup"] || dev360.keysHeld["w"] || dev360.keysHeld["ц"]) dev360.targetPitch += rotSpeed * 0.75;
  if (dev360.keysHeld["arrowdown"] || dev360.keysHeld["s"] || dev360.keysHeld["ы"]) dev360.targetPitch -= rotSpeed * 0.75;

  dev360.targetPitch = Math.max(-1.28, Math.min(1.22, dev360.targetPitch));
  const smooth = 1 - Math.pow(1 - 0.16, dt);
  dev360.yaw += (dev360.targetYaw - dev360.yaw) * smooth;
  dev360.pitch += (dev360.targetPitch - dev360.pitch) * smooth;

  const tSec = time * 0.001;
  // Лёгкое дыхание камеры и покачивание маятника
  dev360.camera.position.set(
    Math.sin(tSec * 0.9) * 0.03,
    1.65 + Math.sin(tSec * 1.8) * 0.02,
    Math.cos(tSec * 0.7) * 0.03
  );
  dev360.camera.rotation.y = dev360.yaw;
  dev360.camera.rotation.x = dev360.pitch;

  // Луч фонаря следует за курсором внутри 360° поля зрения
  dev360.flashLight.intensity = flashlightOn ? 3.5 : 0.25;
  dev360.flashTarget.position.set(pointer.normX * 0.48, -pointer.normY * 0.36, -1.0);

  // Раскачивание маятника и свист лезвия при прохождении нижней точки
  const swingAngle = Math.sin(tSec * 1.65) * 0.62;
  if (dev360.pendulumPivot) {
    dev360.pendulumPivot.rotation.z = swingAngle;
    const side = swingAngle >= 0 ? 1 : -1;
    if (side !== dev360.lastSwingSide) {
      dev360.lastSwingSide = side;
      if (audioEngine.enabled) audioEngine.playWoodCreak();
    }
  }

  // Тень в углу: когда игрок смотрит прямо на неё, она отступает в тень; когда отворачивается — подбирается ближе
  if (dev360.shadowFigure) {
    const sx = Math.sin(dev360.shadowAngle) * 3.4;
    const sz = Math.cos(dev360.shadowAngle) * 3.4;
    dev360.shadowFigure.position.set(sx, 1.15, sz);
    dev360.shadowFigure.lookAt(0, 1.15, 0);

    const lookDirX = -Math.sin(dev360.yaw);
    const lookDirZ = -Math.cos(dev360.yaw);
    const toShadowX = sx / 3.4;
    const toShadowZ = sz / 3.4;
    const dot = lookDirX * toShadowX + lookDirZ * toShadowZ;

    if (dot > 0.78 && flashlightOn) {
      // Игрок навёл взгляд/фонарь — фигура исчезает и перебегает в другой угол за спиной
      dev360.shadowFigure.userData.shadowMat.opacity *= 0.86;
      dev360.shadowFigure.userData.eyeMat.opacity *= 0.82;
      if (dev360.shadowFigure.userData.shadowMat.opacity < 0.05) {
        dev360.shadowAngle += Math.PI * (0.75 + Math.random() * 0.5);
        if (audioEngine.enabled) audioEngine.playStepBehind();
      }
    } else {
      dev360.shadowFigure.userData.shadowMat.opacity = Math.min(0.9, dev360.shadowFigure.userData.shadowMat.opacity + 0.015 * dt);
      dev360.shadowFigure.userData.eyeMat.opacity = Math.min(0.85, dev360.shadowFigure.userData.eyeMat.opacity + 0.015 * dt);
    }
  }

  const telEl = document.getElementById("dev-360-telemetry");
  if (telEl) {
    const degYaw = Math.round((((-dev360.yaw * 180 / Math.PI) % 360) + 360) % 360);
    const degPitch = Math.round(dev360.pitch * 180 / Math.PI);
    const degSwing = (swingAngle * 180 / Math.PI).toFixed(1);
    telEl.textContent = `УГОЛ: ${degYaw}° · НАКЛОН: ${degPitch}° · МАЯТНИК: ${degSwing}°`;
  }

  renderer.render(dev360.scene, dev360.camera);
  fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}


/* ============================================================
   СОСТОЯНИЕ 2.5D
============================================================ */
let currentRoomIndex = 0;
let freeMode = false;
let flashlightOn = true;
const roomTextures = {};
const roomImageDims = {};
const roomTickFlags = {};

const pointer = {
  x: window.innerWidth * 0.5, y: window.innerHeight * 0.5,
  targetX: window.innerWidth * 0.5, targetY: window.innerHeight * 0.5,
  normX: 0, normY: 0
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
   ФОНАРЬ 2D
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
  const grad = g.createRadialGradient(rad, rad, rad * 0.08, rad, rad, rad);
  grad.addColorStop(0, "rgba(0, 0, 0, 1)");
  grad.addColorStop(0.48, "rgba(0, 0, 0, 0.55)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  flashlightSprite = c;
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
  if (window.Episode1 && typeof window.Episode1.onResize === "function") {
    window.Episode1.onResize();
  }
  if (dev360.camera) {
    dev360.camera.aspect = window.innerWidth / window.innerHeight;
    dev360.camera.updateProjectionMatrix();
  }
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
  if (room.isProceduralRoom) return;
  const hints = {
    0: { text: "F = 442 Hz", x: 0.14, y: 0.36, size: 32, rot: -0.05, sub: "несущая частота плёнки" },
    1: { text: "I · IV · VII · IX", x: 0.68, y: 0.34, size: 26, rot: 0.04, sub: "порядок дисков" },
    2: { text: "Л: 6 кг  =  П: 6 кг", x: 0.48, y: 0.60, size: 26, rot: -0.03, sub: "уравновесить чаши" },
    3: { text: "A = 3  ·  B = 1", x: 0.50, y: 0.42, size: 28, rot: 0.02, sub: "пропорция дозатора" },
    4: { text: "R · R · R · L · L", x: 0.82, y: 0.42, size: 24, rot: 0.06, sub: "обороты штурвала" },
    5: { text: "НЕ СМОТРИ", x: 0.72, y: 0.52, size: 30, rot: -0.02, sub: "выцарапано над водой" },
    6: { text: "618", x: 0.44, y: 0.76, size: 36, rot: -0.04, sub: "процарапано в золе" },
    7: { text: "I - III - IX - X", x: 0.40, y: 0.72, size: 28, rot: 0.0, sub: "выбито на плите пола" },
    8: { text: "9 / 4", x: 0.62, y: 0.14, size: 28, rot: 0.03, sub: "в проломе потолка" }
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
  const px = 1280 * room.portal.x, py = 720 * room.portal.y;
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
    // Отрисовываем мокрые тапочки у порога и отметку +42 на полу в процедурной текстуре
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

function generateRandomHorrorRoom(roomObj) {
  const arch = PROCEDURAL_ARCHETYPES[Math.floor(Math.random() * PROCEDURAL_ARCHETYPES.length)];
  const d1 = Math.floor(Math.random() * 10), d2 = Math.floor(Math.random() * 10), d3 = Math.floor(Math.random() * 10);
  roomObj.targetPin = [d1, d2, d3];
  roomObj.solved = false;
  roomObj.title = arch.name; roomObj.desc = arch.desc;
  const portalX = 0.68 + Math.random() * 0.18;
  const portalY = 0.44 + Math.random() * 0.10;
  const artX = 0.22 + Math.random() * 0.24;
  const artY = 0.48 + Math.random() * 0.14;
  roomObj.portal = { x: portalX, y: portalY, label: "Выход на поверхность (В начало)" };
  roomObj.artifact = { x: artX, y: artY, label: "Ржавый релейный шкаф" };
  roomObj.shadowSpots = [
    { x: Math.min(0.88, portalX - 0.04), y: portalY + 0.04, scale: 1.04 },
    { x: 0.16 + Math.random() * 0.65, y: 0.54, scale: 0.90 }
  ];
  const c = document.createElement("canvas");
  c.width = 1600; c.height = 900;
  const g = c.getContext("2d");
  const bg = g.createRadialGradient(800, 380, 60, 800, 450, 980);
  bg.addColorStop(0, arch.bgTop); bg.addColorStop(0.65, arch.bgBot); bg.addColorStop(1, "#010201");
  g.fillStyle = bg; g.fillRect(0, 0, 1600, 900);
  const px = portalX * 1600, py = portalY * 900;
  const pw = 230 + Math.random() * 60, ph = 340 + Math.random() * 60;
  g.strokeStyle = "rgba(130, 145, 125, 0.16)"; g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 0); g.lineTo(px - pw * 0.5, py - ph * 0.5);
  g.moveTo(1600, 0); g.lineTo(px + pw * 0.5, py - ph * 0.5);
  g.moveTo(0, 900); g.lineTo(px - pw * 0.5, py + ph * 0.5);
  g.moveTo(1600, 900); g.lineTo(px + pw * 0.5, py + ph * 0.5);
  g.stroke();
  const ribs = 4 + Math.floor(Math.random() * 5);
  for (let i = 1; i <= ribs; i++) {
    const t = i / (ribs + 1);
    const xL = (px - pw * 0.5) * t, xR = 1600 - (1600 - (px + pw * 0.5)) * t;
    const yT = (py - ph * 0.5) * t, yB = 900 - (900 - (py + ph * 0.5)) * t;
    g.strokeStyle = "rgba(95, 110, 95, 0.14)"; g.lineWidth = 3;
    g.strokeRect(xL, yT, xR - xL, yB - yT);
  }
  g.fillStyle = "#010201"; g.fillRect(px - pw * 0.5, py - ph * 0.5, pw, ph);
  g.strokeStyle = arch.rust; g.lineWidth = 4;
  g.strokeRect(px - pw * 0.5, py - ph * 0.5, pw, ph);
  for (let i = 0; i < 65; i++) {
    const mx = Math.random() * 1600, my = Math.random() * 900, mr = 25 + Math.random() * 110;
    const mg = g.createRadialGradient(mx, my, 4, mx, my, mr);
    mg.addColorStop(0, i % 3 === 0 ? "rgba(65, 22, 14, 0.34)" : "rgba(10, 14, 10, 0.52)");
    mg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
  }
  const cables = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < cables; i++) {
    const cx = 180 + Math.random() * 1240, len = 140 + Math.random() * 340;
    g.strokeStyle = "rgba(25, 28, 25, 0.85)"; g.lineWidth = 2 + Math.random() * 3;
    g.beginPath(); g.moveTo(cx, 0);
    g.quadraticCurveTo(cx + (Math.random() - 0.5) * 80, len * 0.5, cx + (Math.random() - 0.5) * 40, len);
    g.stroke();
  }
  const ax = artX * 1600, ay = artY * 900;
  g.fillStyle = "#171412"; g.fillRect(ax - 75, ay - 95, 150, 190);
  g.strokeStyle = "#4d3c30"; g.lineWidth = 3; g.strokeRect(ax - 75, ay - 95, 150, 190);
  const clueSpots = [
    { x: 0.16, y: 0.34 }, { x: 0.52, y: 0.30 }, { x: 0.56, y: 0.72 }, { x: 0.22, y: 0.76 }
  ];
  const chosen = clueSpots[Math.floor(Math.random() * clueSpots.length)];
  const codeText = `${d1} - ${d2} - ${d3}`;
  g.save();
  g.translate(chosen.x * 1600, chosen.y * 900);
  g.rotate((Math.random() - 0.5) * 0.18);
  g.font = "bold 34px 'Courier New', monospace";
  g.fillStyle = "rgba(12, 10, 9, 0.82)"; g.fillText(codeText, 3, 3);
  g.fillStyle = "rgba(205, 190, 165, 0.58)"; g.fillText(codeText, 0, 0);
  g.strokeStyle = "rgba(200, 185, 160, 0.32)"; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(-18, -32); g.lineTo(145, -26);
  g.moveTo(-12, 16); g.lineTo(138, 20); g.stroke();
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false; tex.needsUpdate = true;
  const anomIdx = ROOMS.length - 1;
  if (roomTextures[anomIdx]) roomTextures[anomIdx].dispose();
  roomTextures[anomIdx] = tex;
  roomImageDims[anomIdx] = { w: 1600, h: 900 };
}

function applyRoomTexture(idx) {
  const room = ROOMS[idx];
  if (room.isProceduralRoom && !roomTextures[idx]) generateRandomHorrorRoom(room);

  // Анимированная GIF-комната (Archive_secret1.gif) отображается через нативный <img>,
  // чтобы браузер воспроизводил все кадры анимации
  if (room.isAnimatedGif && gifRoomLayer) {
    if (gifRoomLayer.getAttribute("src") !== room.fileName) {
      gifRoomLayer.src = room.fileName;
    }
    gifRoomLayer.classList.add("visible");
  } else if (gifRoomLayer) {
    gifRoomLayer.classList.remove("visible");
  }

  if (roomTextures[idx]) {
    roomPlaneMat.map = roomTextures[idx];
  } else {
    if (!proceduralTextureCache[idx]) proceduralTextureCache[idx] = createProceduralTexture(room);
    roomPlaneMat.map = proceduralTextureCache[idx];
  }
  roomPlaneMat.needsUpdate = true;
}

function tryAutoLoadImages() {
  ROOMS.forEach((room, idx) => {
    if (room.isProceduralRoom) return;
    const img = new Image();
    img.onload = () => createTextureFromImageSource(img, idx);
    img.onerror = () => { if (idx === currentRoomIndex) applyRoomTexture(idx); };
    img.src = room.fileName;
  });
}

/* ============================================================
   СУЩНОСТЬ 2.5D
============================================================ */
function build3DShadowEntity() {
  const group = new THREE.Group();
  const shadowMat = new THREE.MeshStandardMaterial({ color: 0x020302, roughness: 0.98, transparent: true, opacity: 0.0 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.45, 16), shadowMat);
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 16), shadowMat);
  head.scale.set(0.88, 1.18, 0.92); head.position.set(0.06, 0.92, 0.08); head.rotation.z = -0.22;
  group.add(head);
  const armGeo = new THREE.CylinderGeometry(0.065, 0.045, 1.35, 10);
  const leftArm = new THREE.Mesh(armGeo, shadowMat); leftArm.position.set(-0.32, -0.12, 0.05); leftArm.rotation.z = 0.12; group.add(leftArm);
  const rightArm = new THREE.Mesh(armGeo, shadowMat); rightArm.position.set(0.32, -0.14, 0.05); rightArm.rotation.z = -0.10; group.add(rightArm);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd9e0d4, transparent: true, opacity: 0.0 });
  const eyeGeo = new THREE.SphereGeometry(0.018, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.01, 0.94, 0.26); group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.11, 0.92, 0.25); group.add(eyeR);
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

let lastFrameTime = performance.now();

function updateWorldPlaneLayout() {
  const dist = camera.position.z;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const viewH = 2 * Math.tan(vFov / 2) * dist;
  const viewW = viewH * camera.aspect;
  const dims = roomImageDims[currentRoomIndex] || { w: 16, h: 9 };
  const imgAspect = dims.w / dims.h;
  const viewAspect = viewW / viewH;
  let planeW, planeH;
  if (viewAspect > imgAspect) { planeW = viewW * 1.08; planeH = planeW / imgAspect; }
  else { planeH = viewH * 1.08; planeW = planeH * imgAspect; }
  roomMesh.scale.set(planeW / 16, planeH / 9, 1);
  layout.planeW = planeW; layout.planeH = planeH;
  layout.viewW = viewW; layout.viewH = viewH;
  return layout;
}

function animate(time) {
  requestAnimationFrame(animate);
  if (document.hidden) { lastFrameTime = time; return; }

  const dtMs = Math.min(100, time - lastFrameTime);
  lastFrameTime = time;
  const dt = dtMs / 16.667;

  if (window.Episode1 && window.Episode1.isActive()) {
    window.Episode1.tick(dtMs / 1000);
    return;
  }

  if (dev360.active) {
    pointer.x += (pointer.targetX - pointer.x) * 0.16;
    pointer.y += (pointer.targetY - pointer.y) * 0.16;
    pointer.normX = (pointer.x / window.innerWidth - 0.5) * 2;
    pointer.normY = (pointer.y / window.innerHeight - 0.5) * 2;
    renderDev360Frame(time, dt);
    return;
  }

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
        if (ROOMS[currentRoomIndex].isProceduralRoom) generateRandomHorrorRoom(ROOMS[currentRoomIndex]);
        applyRoomTexture(currentRoomIndex);
        updateRoomHUD();
        syncTapeVideo();
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

  camera.position.set(camX, camY, camZ);
  camera.lookAt(camX * 0.65, camY * 0.65, 0);

  if (gifRoomLayer && gifRoomLayer.classList.contains("visible") && !REDUCE_MOTION) {
    gifRoomLayer.style.transform = `scale(1.06) translate(${(-pointer.normX * 14).toFixed(1)}px, ${(-pointer.normY * 10).toFixed(1)}px)`;
  }

  const lightWorldX = pointer.normX * (viewW * 0.5);
  const lightWorldY = -pointer.normY * (viewH * 0.5);
  spotLight.position.set(camX, camY, camZ);
  spotLight.target.position.set(lightWorldX, lightWorldY, 0);
  spotLight.intensity = flashlightOn ? 2.8 : 0.35;

  if (entityState.visible) {
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
  godRaysRig.rayMat.uniforms.uTime.value = tSec;
  godRaysRig.rayMat.uniforms.uIntensity.value = flashlightOn
    ? (panicState.active ? 0.38 : 0.22)
    : 0.07;

  refractionLensMesh.rotation.x = tSec * 0.22;
  refractionLensMesh.rotation.y = tSec * 0.31;
  refractionLensMesh.position.x = -2.6 + Math.sin(tSec * 0.45) * 0.25;
  refractionLensMesh.position.y = -1.1 + Math.cos(tSec * 0.38) * 0.18;

  for (let i = 0; i < debrisItems.length; i++) {
    const m = debrisItems[i];
    const ud = m.userData;
    m.rotation.x = tSec * ud.speed + ud.phase;
    m.rotation.y = tSec * ud.speed * 0.75;
    m.position.y = ud.baseY + Math.sin(tSec * ud.speed + ud.phase) * 0.12;
  }

  updateDiscoveryTicks(w, h);
  renderer.render(scene, camera);
  render2DOverlay(w, h, room, blackFade, time, dt);
}

function updateDiscoveryTicks(w, h) {
  if (transition.active) return;
  const room = ROOMS[currentRoomIndex];
  const t = getOverlayTransform(w, h);
  if (!roomTickFlags[currentRoomIndex]) roomTickFlags[currentRoomIndex] = {};
  const flags = roomTickFlags[currentRoomIndex];
  const artX = t.offsetX + room.artifact.x * t.scaleX;
  const artY = t.offsetY + room.artifact.y * t.scaleY;
  if (!flags.artifact && Math.hypot(pointer.x - artX, pointer.y - artY) < 100) { flags.artifact = true; audioEngine.playTick(); }
  const portX = t.offsetX + room.portal.x * t.scaleX;
  const portY = t.offsetY + room.portal.y * t.scaleY;
  if (!flags.portal && Math.hypot(pointer.x - portX, pointer.y - portY) < 100) { flags.portal = true; audioEngine.playTick(); }
}

function render2DOverlay(w, h, room, blackFade, time, dt) {
  fxCtx.clearRect(0, 0, w, h);
  const t = getOverlayTransform(w, h);
  const scaleX = t.scaleX, scaleY = t.scaleY, offsetX = t.offsetX, offsetY = t.offsetY;
  dustParticles.forEach(p => {
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.y < 0) p.y = 1;
    if (p.x < 0) p.x = 1;
    if (p.x > 1) p.x = 0;
    const px = p.x * w - pointer.normX * 20 * p.z;
    const py = p.y * h - pointer.normY * 14 * p.z;
    const dist = Math.hypot(px - pointer.x, py - pointer.y);
    const boost = (flashlightOn && dist < 240) ? (1 - dist / 240) * 0.7 : 0;
    fxCtx.fillStyle = `rgba(195, 208, 188, ${Math.min(0.92, 0.12 + boost)})`;
    fxCtx.beginPath(); fxCtx.arc(px, py, p.size * p.z, 0, Math.PI * 2); fxCtx.fill();
  });
  drawMarker2D(offsetX + room.artifact.x * scaleX, offsetY + room.artifact.y * scaleY,
    room.artifact.label, room.solved ? "#528c63" : "#bd7d3b", time);
  if (room.clueProp) {
    drawMarker2D(offsetX + room.clueProp.x * scaleX, offsetY + room.clueProp.y * scaleY,
      room.clueProp.label, "#8c7d65", time);
  }
  const canPass = room.solved || freeMode;
  drawMarker2D(offsetX + room.portal.x * scaleX, offsetY + room.portal.y * scaleY,
    room.portal.label, canPass ? "#528c63" : "#8f3222", time);
  if (flashlightOn) {
    const flicker = REDUCE_MOTION ? 1.0 : (Math.sin(time * 0.041) * Math.sin(time * 0.017) > 0.96 ? 0.72 : 1.0);
    fxCtx.fillStyle = "rgba(1, 2, 1, 0.94)";
    fxCtx.fillRect(0, 0, w, h);
    if (!flashlightSprite) ensureFlashlightSprite();
    const s = flashlightSpriteRad * flicker;
    fxCtx.globalCompositeOperation = "destination-out";
    fxCtx.drawImage(flashlightSprite, pointer.x - s, pointer.y - s, s * 2, s * 2);
    fxCtx.globalCompositeOperation = "source-over";
  } else {
    fxCtx.fillStyle = "rgba(1, 2, 1, 0.91)";
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
   HUD 2.5D
============================================================ */
const depthNav = document.getElementById("depth-nav");
function buildDepthNav() {
  depthNav.innerHTML = "";
  ROOMS.forEach((r, idx) => {
    const node = document.createElement("div");
    const lockedSecret = (r.isSecret || r.isProceduralRoom) && !areMainRoomsCompleted() && !freeMode;
    node.className = `depth-node ${idx === currentRoomIndex ? "active" : ""} ${r.solved ? "solved" : ""} ${r.isSecret ? "secret" : ""} ${r.isProceduralRoom ? "procedural" : ""} ${lockedSecret ? "locked-secret" : ""}`;
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
    const lockedSecret = (r.isSecret || r.isProceduralRoom) && !mainDone && !freeMode;
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
  document.getElementById("dossier-file-hint").textContent = room.isProceduralRoom ? "ГЕНЕРАТОР: АКТИВЕН" : `ФАЙЛ: ${room.fileName}`;
  document.getElementById("dossier-title").textContent = room.title;
  document.getElementById("dossier-text").textContent = room.desc;
  const regenBtn = document.getElementById("btn-regen-room");
  if (regenBtn) regenBtn.style.display = room.isProceduralRoom ? "inline-block" : "none";
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

  // Секретные комнаты (индексы 5..8) и аномалия (9) открываются только после прохождения первых 5 комнат
  if ((targetRoom.isSecret || targetRoom.isProceduralRoom) && !areMainRoomsCompleted() && !freeMode) {
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
    transition.focusX = tr.portal.x; transition.focusY = tr.portal.y;
  } else {
    transition.focusX = currentRoom.portal.x; transition.focusY = currentRoom.portal.y;
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
   ВВОД 2.5D
============================================================ */
glCanvas.addEventListener("pointerdown", (e) => {
  if (window.Episode1 && window.Episode1.isActive()) return;
  pointer.targetX = e.clientX; pointer.targetY = e.clientY;
  if (dev360.active) {
    dev360.dragging = true;
    dev360.lastX = e.clientX;
    dev360.lastY = e.clientY;
  }
});
window.addEventListener("pointermove", (e) => {
  if (document.querySelector(".modal-backdrop.open")) return;
  if (window.Episode1 && window.Episode1.isActive()) return;
  pointer.targetX = e.clientX; pointer.targetY = e.clientY;
  if (dev360.active && dev360.dragging) {
    const dx = e.clientX - dev360.lastX;
    const dy = e.clientY - dev360.lastY;
    dev360.targetYaw -= dx * 0.0055;
    dev360.targetPitch -= dy * 0.0045;
    dev360.lastX = e.clientX;
    dev360.lastY = e.clientY;
  }
}, { passive: true });
window.addEventListener("pointerup", () => { dev360.dragging = false; });

glCanvas.addEventListener("click", (e) => {
  if (window.Episode1 && window.Episode1.isActive()) return;
  if (transition.active) return;
  if (document.querySelector(".modal-backdrop.open")) return;

  pointer.x = pointer.targetX = e.clientX;
  pointer.y = pointer.targetY = e.clientY;
  pointer.normX = (e.clientX / window.innerWidth - 0.5) * 2;
  pointer.normY = (e.clientY / window.innerHeight - 0.5) * 2;

  const w = window.innerWidth, h = window.innerHeight;
  const room = ROOMS[currentRoomIndex];
  updateWorldPlaneLayout();
  const t = getOverlayTransform(w, h);

  const artX = t.offsetX + room.artifact.x * t.scaleX;
  const artY = t.offsetY + room.artifact.y * t.scaleY;
  if (Math.hypot(e.clientX - artX, e.clientY - artY) < 90) { openPuzzleModal(); return; }

  if (room.clueProp) {
    const cpX = t.offsetX + room.clueProp.x * t.scaleX;
    const cpY = t.offsetY + room.clueProp.y * t.scaleY;
    if (Math.hypot(e.clientX - cpX, e.clientY - cpY) < 90) {
      audioEngine.playTick();
      openPuzzleModal();
      const fb = document.getElementById("modal-feedback");
      if (fb) fb.textContent = `УЛИКА: ${room.clueProp.clueText}`;
      return;
    }
  }

  const portX = t.offsetX + room.portal.x * t.scaleX;
  const portY = t.offsetY + room.portal.y * t.scaleY;
  if (Math.hypot(e.clientX - portX, e.clientY - portY) < 90) {
    attemptRoomTransition((currentRoomIndex + 1) % ROOMS.length); return;
  }

  const now = performance.now();
  panicState.dread = Math.min(1.0, panicState.dread + 0.14);
  const effectiveChance = PANIC_CHANCE_PER_CLICK + panicState.dread * 0.12;
  if (Math.random() < effectiveChance) triggerPanicEpisode(now);
});

let lastWheelTime = 0;
window.addEventListener("wheel", (e) => {
  if (window.Episode1 && window.Episode1.isActive()) return;
  const now = performance.now();
  if (now - lastWheelTime < 1100) return;
  if (document.querySelector(".modal-backdrop.open")) return;
  if (e.deltaY > 25) { lastWheelTime = now; attemptRoomTransition(Math.min(ROOMS.length - 1, currentRoomIndex + 1)); }
  else if (e.deltaY < -25) { lastWheelTime = now; attemptRoomTransition(Math.max(0, currentRoomIndex - 1)); }
}, { passive: true });

window.addEventListener("keydown", (e) => {
  if (window.Episode1 && window.Episode1.isActive()) return;
  const k = e.key.toLowerCase();
  if (e.shiftKey && (k === "d" || k === "в")) {
    e.preventDefault();
    toggleDev360Mode();
    return;
  }
  if (dev360.active) dev360.keysHeld[k] = true;
  if (k === "f" || k === "а") document.getElementById("btn-toggle-flashlight").click();
  if (e.key === "Escape") {
    if (dev360.active) toggleDev360Mode(false);
    document.querySelectorAll(".modal-backdrop.open").forEach(m => closeModalEl(m));
  }
});
window.addEventListener("keyup", (e) => {
  delete dev360.keysHeld[e.key.toLowerCase()];
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
  if (window.Episode1 && window.Episode1.isActive()) return;
  if (document.getElementById("intro-screen").classList.contains("hidden") && !transition.active) {
    if (Math.random() < 0.65) spawnShadowEntity(false);
  }
}, 5500);

/* ============================================================
   ЗАГАДКИ 2.5D (ОСНОВНЫЕ + СЕКРЕТНЫЕ)
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
  } else if (room.puzzleType === "pin_digits" || room.puzzleType === "procedural_pin") {
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
      // Двойной тяжёлый импульс лязга замка на мобильных устройствах
      navigator.vibrate([75, 55, 130]);
    } catch (e) {}
  }
}

function playMechanismUnlockClank() {
  if (!audioEngine.ctx || !audioEngine.enabled) return;
  const now = audioEngine.ctx.currentTime;

  // Металлический лязг засова и пружины
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
  if (!alreadySolvedOnce && ROOMS.every(r => r.solvedOnce)) {
    setTimeout(() => openFinalModalWithSmartDefault(), 1400);
  }
}

/* ============================================================
   ЭПИЗОД 1 — «СПУСК В ПОДВАЛ» С ФОТОРЕАЛИСТИЧНЫМИ СТЕНОВЫМИ ТЕКСТУРАМИ
   Поддерживает загрузку structure.jpg из репозитория + процедурный PBR-рельеф (плесень, подтёки, сырость)
============================================================ */
window.Episode1 = (() => {
  const EYE = 1.7, PR = 0.35;
  const WALK = 4.0, RUN = 7.5;
  const ENTITY_SPEED = 4.8;
  const INTERACT_RANGE = 3.0;

  let active = false, paused = false, pointerLocked = false, started = false;
  let epScene, epCamera, epFlash, epFlashTarget, epEmergLight;
  let bobTimer = 0;
  const keys = Object.create(null);
  const player = {
    pos: new THREE.Vector3(0, EYE, 6),
    vel: new THREE.Vector3(),
    yaw: 0, pitch: 0, flashlightOn: true
  };
  const walls = [];
  const interactables = [];
  const gateDoor = { mesh: null, opening: 0, isOpening: false, baseY: 0, wall: null };
  const entity = { active: false, mesh: null, pos: new THREE.Vector3(), speed: ENTITY_SPEED, caught: false };
  const state = { hasHandle: false, handleInstalled: false, powerOn: false, gateOpen: false, gameOver: false, won: false, wireChecked: false, bottleChecked: false };

  let elHud, elCrosshair, elPrompt, elObjective, elInventory, elWarning, elHint;
  let elOverlay, elOverlayTitle, elOverlayText;
  let elPause, elFade, elStartScreen;
  let elTouch, elJoystick, elJoystickKnob, elBtnF, elBtnE;

  const touch = { moveId: null, moveStartX: 0, moveStartY: 0, moveDX: 0, moveDY: 0, lookId: null, lookLastX: 0, lookLastY: 0 };
  const raycaster = new THREE.Raycaster();
  const screenCenter = new THREE.Vector2(0, 0);
  let hotInteractable = null;
  let inited = false;

  // Генератор мерзких, сырых, покрытых плесенью и бурыми подтёками стен фундамента
  // Если в репозитории есть structure.jpg — подмешивает его поверх фактуры!
  function makeGrimyBasementSet(repeatX = 3, repeatY = 2) {
    const size = 1024;
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = colorCanvas.height = size;
    const cg = colorCanvas.getContext('2d');

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = bumpCanvas.height = size;
    const bg = bumpCanvas.getContext('2d');

    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = roughCanvas.height = size;
    const rg = roughCanvas.getContext('2d');

    const paintGrimeLayers = (baseImg = null) => {
      if (baseImg) {
        cg.drawImage(baseImg, 0, 0, size, size);
        // Затемняем и тонируем под сырой подвал
        cg.fillStyle = 'rgba(18, 22, 16, 0.36)';
        cg.fillRect(0, 0, size, size);
      } else {
        cg.fillStyle = '#383832';
        cg.fillRect(0, 0, size, size);
      }

      bg.fillStyle = '#808080';
      bg.fillRect(0, 0, size, size);
      rg.fillStyle = '#d8d8d8';
      rg.fillRect(0, 0, size, size);

      // Швы бетонных блоков фундамента и вздутия штукатурки
      for (let y = 0; y < size; y += 256) {
        cg.fillStyle = 'rgba(10, 12, 9, 0.62)';
        cg.fillRect(0, y, size, 4);
        bg.fillStyle = '#242424';
        bg.fillRect(0, y, size, 4);
      }

      // Зернистость, раковины и облупившаяся краска
      for (let i = 0; i < 20000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const w = 1 + Math.random() * 3;
        const h = 1 + Math.random() * 3;
        const delta = (Math.random() - 0.5) * 42;

        cg.fillStyle = `rgba(${96 + delta}, ${98 + delta}, ${84 + delta}, 0.24)`;
        cg.fillRect(x, y, w, h);

        const bVal = Math.max(0, Math.min(255, 128 + delta * 2.1)) | 0;
        bg.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
        bg.fillRect(x, y, w, h);
      }

      // Глубокие трещины и обвалы штукатурки
      for (let i = 0; i < 14; i++) {
        let x = Math.random() * size;
        let y = Math.random() * size;
        cg.strokeStyle = 'rgba(8, 9, 7, 0.85)';
        cg.lineWidth = 1.4 + Math.random() * 2.0;
        bg.strokeStyle = '#121212';
        bg.lineWidth = 2.8;

        cg.beginPath(); bg.beginPath();
        cg.moveTo(x, y); bg.moveTo(x, y);
        for (let j = 0; j < 14; j++) {
          x += (Math.random() - 0.48) * 44;
          y += (Math.random() - 0.48) * 44;
          cg.lineTo(x, y); bg.lineTo(x, y);
        }
        cg.stroke(); bg.stroke();
      }

      // Колонии чёрно-зелёной плесени и бурой ржавчины
      for (let i = 0; i < 22; i++) {
        const mx = Math.random() * size;
        const my = Math.random() * size;
        const mr = 40 + Math.random() * 145;
        const mode = i % 3;

        const mg = cg.createRadialGradient(mx, my, 4, mx, my, mr);
        if (mode === 0) {
          // Чёрная слизистая плесень
          mg.addColorStop(0, 'rgba(12, 18, 11, 0.78)');
          mg.addColorStop(0.5, 'rgba(26, 38, 22, 0.45)');
          mg.addColorStop(1, 'rgba(0,0,0,0)');
        } else if (mode === 1) {
          // Буро-кровавая ржавчина и гниль
          mg.addColorStop(0, 'rgba(64, 20, 12, 0.62)');
          mg.addColorStop(0.55, 'rgba(42, 18, 11, 0.35)');
          mg.addColorStop(1, 'rgba(0,0,0,0)');
        } else {
          // Болотный грибок и высолы
          mg.addColorStop(0, 'rgba(46, 58, 36, 0.55)');
          mg.addColorStop(1, 'rgba(0,0,0,0)');
        }
        cg.fillStyle = mg;
        cg.beginPath(); cg.arc(mx, my, mr, 0, Math.PI * 2); cg.fill();

        // Мокрый глянцевый след на карте шероховатости
        const rGrad = rg.createRadialGradient(mx, my, 4, mx, my, mr * 0.9);
        rGrad.addColorStop(0, 'rgba(48, 48, 48, 0.92)');
        rGrad.addColorStop(1, 'rgba(220, 220, 220, 0)');
        rg.fillStyle = rGrad;
        rg.beginPath(); rg.arc(mx, my, mr * 0.9, 0, Math.PI * 2); rg.fill();
      }

      // Длинные грязные и бурые подтёки сверху вниз по стене
      for (let d = 0; d < 42; d++) {
        const dx = Math.random() * size;
        const dy = Math.random() * (size * 0.55);
        const len = 120 + Math.random() * 440;
        const width = 2 + Math.random() * 7;

        const dripGrad = cg.createLinearGradient(dx, dy, dx, dy + len);
        dripGrad.addColorStop(0, d % 2 === 0 ? 'rgba(14, 18, 12, 0.72)' : 'rgba(58, 18, 10, 0.65)');
        dripGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        cg.fillStyle = dripGrad;
        cg.fillRect(dx, dy, width, len);

        rg.fillStyle = 'rgba(42, 42, 42, 0.75)';
        rg.fillRect(dx, dy, width + 1, len);
      }

      // Тёмная сырая полоса гнили у самого пола
      const bottomGrime = cg.createLinearGradient(0, size * 0.72, 0, size);
      bottomGrime.addColorStop(0, 'rgba(0,0,0,0)');
      bottomGrime.addColorStop(1, 'rgba(10, 14, 9, 0.85)');
      cg.fillStyle = bottomGrime;
      cg.fillRect(0, size * 0.72, size, size * 0.28);
    };

    paintGrimeLayers(null);

    const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4;
    const buildTex = (canvas, isColor) => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX, repeatY);
      tex.anisotropy = maxAniso;
      if (isColor && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
      return tex;
    };

    const mapTex = buildTex(colorCanvas, true);
    const bumpTex = buildTex(bumpCanvas, false);
    const roughTex = buildTex(roughCanvas, false);

    // Подгружаем structure.jpg из репозитория и накладываем поверх грязь/плесень/подтёки
    const structImg = new Image();
    structImg.onload = () => {
      paintGrimeLayers(structImg);
      mapTex.needsUpdate = true;
      bumpTex.needsUpdate = true;
      roughTex.needsUpdate = true;
    };
    structImg.src = 'structure.jpg';

    return { map: mapTex, bumpMap: bumpTex, roughnessMap: roughTex };
  }

  function makeMetalTextureSet() {
    const size = 512;
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = colorCanvas.height = size;
    const cg = colorCanvas.getContext('2d');

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = bumpCanvas.height = size;
    const bg = bumpCanvas.getContext('2d');

    cg.fillStyle = '#2d2118';
    cg.fillRect(0, 0, size, size);
    bg.fillStyle = '#808080';
    bg.fillRect(0, 0, size, size);

    for (let i = 0; i < 4500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const v = (Math.random() * 60 - 30) | 0;
      cg.fillStyle = `rgba(${120 + v},${88 + v},${58 + v},0.32)`;
      cg.fillRect(x, y, 2, 2);

      const bv = Math.max(0, Math.min(255, 128 + v * 1.5)) | 0;
      bg.fillStyle = `rgb(${bv},${bv},${bv})`;
      bg.fillRect(x, y, 2, 2);
    }

    for (let i = 0; i < 28; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      const rw = 24 + Math.random() * 60;
      const rh = 6 + Math.random() * 14;
      cg.fillStyle = `rgba(${115 + Math.random() * 45},${52 + Math.random() * 28},${20 + Math.random() * 16},0.45)`;
      cg.fillRect(rx, ry, rw, rh);
      bg.fillStyle = '#606060';
      bg.fillRect(rx, ry, rw, rh);
    }

    const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4;
    const map = new THREE.CanvasTexture(colorCanvas);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = maxAniso;
    if (THREE.sRGBEncoding) map.encoding = THREE.sRGBEncoding;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.anisotropy = maxAniso;

    return { map, bumpMap };
  }

  function addWallBox(cx, cy, cz, w, h, d, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(cx, cy, cz);
    epScene.add(mesh);
    const wall = {
      box: new THREE.Box3(new THREE.Vector3(cx - w/2, cy - h/2, cz - d/2), new THREE.Vector3(cx + w/2, cy + h/2, cz + d/2)),
      enabled: true, mesh
    };
    walls.push(wall);
    return wall;
  }

  function buildLevel() {
    const wallTex = makeGrimyBasementSet(4, 2);
    const floorTex = makeGrimyBasementSet(7, 7);
    const metalTex = makeMetalTextureSet();

    const conc = new THREE.MeshStandardMaterial({
      map: wallTex.map,
      bumpMap: wallTex.bumpMap,
      bumpScale: 0.055,
      roughnessMap: wallTex.roughnessMap,
      roughness: 0.88,
      metalness: 0.07
    });
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex.map,
      bumpMap: floorTex.bumpMap,
      bumpScale: 0.06,
      roughnessMap: floorTex.roughnessMap,
      roughness: 0.85,
      metalness: 0.06,
      color: 0x7c8074
    });
    const ceilMat = new THREE.MeshStandardMaterial({
      map: wallTex.map,
      bumpMap: wallTex.bumpMap,
      bumpScale: 0.04,
      roughness: 0.96,
      metalness: 0.03,
      color: 0x22251f
    });
    const metal = new THREE.MeshStandardMaterial({
      map: metalTex.map,
      bumpMap: metalTex.bumpMap,
      bumpScale: 0.035,
      roughness: 0.52,
      metalness: 0.78
    });
    const rustMetal = new THREE.MeshStandardMaterial({
      map: metalTex.map,
      bumpMap: metalTex.bumpMap,
      bumpScale: 0.045,
      roughness: 0.84,
      metalness: 0.36,
      color: 0x9e7d62
    });
    const WALL_H = 3.0, wallTh = 0.3;

    addWallBox(0, -0.1, 5, 7, 0.2, 8, floorMat);
    addWallBox(0, WALL_H + 0.1, 5, 7, 0.2, 8, ceilMat);
    addWallBox(-3.5, WALL_H/2, 5, wallTh, WALL_H, 4, conc);
    addWallBox(3.5, WALL_H/2, 5, wallTh, WALL_H, 4, conc);
    addWallBox(0, WALL_H/2, 7, 7, WALL_H, wallTh, conc);
    addWallBox(-2.75, WALL_H/2, 3, 1.5, WALL_H, wallTh, conc);
    addWallBox(2.75, WALL_H/2, 3, 1.5, WALL_H, wallTh, conc);

    for (let i = 0; i < 6; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 0.5), conc);
      step.position.set(0, 0.2 + i * 0.35, 7.3 + i * 0.5);
      epScene.add(step);
    }

    addWallBox(0, -0.1, -19.5, 4, 0.2, 45, floorMat);
    addWallBox(0, WALL_H + 0.1, -19.5, 4, 0.2, 45, ceilMat);
    addWallBox(-2.15, WALL_H/2, -19.5, wallTh, WALL_H, 45, conc);
    addWallBox(2.15, WALL_H/2, -7.5, wallTh, WALL_H, 21, conc);
    addWallBox(2.15, WALL_H/2, -32, wallTh, WALL_H, 20, conc);
    addWallBox(2.15, 2.8, -20, wallTh, 0.4, 4, conc);

    addWallBox(10, -0.1, -21, 16, 0.2, 18, floorMat);
    addWallBox(10, WALL_H + 0.1, -21, 16, 0.2, 18, ceilMat);
    addWallBox(18.15, WALL_H/2, -21, wallTh, WALL_H, 18, conc);
    addWallBox(10, WALL_H/2, -12, 16, WALL_H, wallTh, conc);
    addWallBox(10, WALL_H/2, -30, 16, WALL_H, wallTh, conc);
    addWallBox(2.15, WALL_H/2, -14.5, wallTh, WALL_H, 5, conc);
    addWallBox(2.15, WALL_H/2, -26, wallTh, WALL_H, 8, conc);

    const pipeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 42, 12), rustMetal);
    pipeMesh.rotation.x = Math.PI / 2;
    pipeMesh.position.set(-1.92, 2.55, -20);
    epScene.add(pipeMesh);

    const gateGroup = new THREE.Group();
    const gateMesh = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.0, 0.25), metal);
    gateMesh.position.set(0, 1.5, -42);
    gateGroup.add(gateMesh);
    for (let i = 0; i < 3; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.12, 0.3), rustMetal);
      rib.position.set(0, 0.6 + i * 1.0, -42);
      gateGroup.add(rib);
    }
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 8, 20), rustMetal);
    wheel.position.set(0, 1.5, -41.85);
    gateGroup.add(wheel);
    epScene.add(gateGroup);
    gateDoor.mesh = gateMesh;
    gateDoor.baseY = 1.5;
    gateDoor.wall = {
      box: new THREE.Box3(new THREE.Vector3(-2, 0, -42.2), new THREE.Vector3(2, 3, -41.8)),
      enabled: true
    };
    walls.push(gateDoor.wall);

    addWallBox(0, -0.1, -47, 6, 0.2, 10, floorMat);
    addWallBox(0, WALL_H + 0.1, -47, 6, 0.2, 10, ceilMat);
    addWallBox(-3.15, WALL_H/2, -47, wallTh, WALL_H, 10, conc);
    addWallBox(3.15, WALL_H/2, -47, wallTh, WALL_H, 10, conc);
    addWallBox(0, WALL_H/2, -52, 6, WALL_H, wallTh, conc);
    for (let i = 0; i < 6; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 0.5), conc);
      step.position.set(0, 0.2 + i * 0.35, -52.3 - i * 0.5);
      epScene.add(step);
    }

    const handleGroup = new THREE.Group();
    const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), rustMetal);
    hb.rotation.z = Math.PI / 2; handleGroup.add(hb);
    const hg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.9 }));
    hg.rotation.z = Math.PI / 2; hg.position.x = 0.32; handleGroup.add(hg);
    handleGroup.position.set(16, 0.3, -28);
    handleGroup.rotation.y = Math.random() * Math.PI;
    const handleGlow = new THREE.PointLight(0xffcc88, 0.4, 2.0);
    handleGroup.add(handleGlow);
    epScene.add(handleGroup);

    const wireMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 1.35, 6),
      new THREE.MeshStandardMaterial({ color: 0x181615, roughness: 0.75 })
    );
    wireMesh.position.set(14.5, 2.35, -24.5);
    wireMesh.rotation.z = 0.28;
    epScene.add(wireMesh);

    const bottleMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.075, 0.28, 10),
      new THREE.MeshStandardMaterial({ color: 0x2c4232, roughness: 0.3, transparent: true, opacity: 0.85 })
    );
    bottleMesh.position.set(13.8, 0.14, -26.5);
    epScene.add(bottleMesh);

    interactables.push({
      id: 'basement_wire', mesh: wireMesh,
      getPrompt: () => state.wireChecked ? 'ПРОВОД ОСМОТРЕН (ЗВЕНО 1/3)' : 'ОСМОТРЕТЬ ОБОРВАННЫЙ ПРОВОД',
      canInteract: () => !state.wireChecked,
      onInteract: () => {
        state.wireChecked = true;
        audioEngine.playTick();
        updateObjective();
      }
    });

    interactables.push({
      id: 'basement_bottle', mesh: bottleMesh,
      getPrompt: () => state.bottleChecked ? 'БУТЫЛКА ОСМОТРЕНА (ЗВЕНО 2/3)' : 'ОСМОТРЕТЬ МУТНУЮ БУТЫЛКУ',
      canInteract: () => !state.bottleChecked,
      onInteract: () => {
        state.bottleChecked = true;
        audioEngine.playDrip();
        updateObjective();
      }
    });

    interactables.push({
      id: 'handle', mesh: handleGroup,
      getPrompt: () => state.hasHandle || state.handleInstalled ? null : 'ВЗЯТЬ РУКОЯТКУ (ЗВЕНО 3/3)',
      canInteract: () => !state.hasHandle && !state.handleInstalled,
      onInteract: () => {
        state.hasHandle = true;
        handleGroup.visible = false;
        updateObjective(); updateInventory();
        audioEngine.playSteelChains();
      }
    });

    const mechGroup = new THREE.Group();
    const mechBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.3), metal);
    mechGroup.add(mechBase);
    const socket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x110a06, roughness: 1 }));
    socket.position.set(0, 0.15, 0.16); mechGroup.add(socket);
    const visualHandle = new THREE.Group();
    const vh1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), rustMetal);
    vh1.rotation.z = Math.PI / 2; vh1.position.set(0, 0.15, 0.2); visualHandle.add(vh1);
    const vh2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.9 }));
    vh2.rotation.z = Math.PI / 2; vh2.position.set(0.32, 0.15, 0.2); visualHandle.add(vh2);
    visualHandle.visible = false; mechGroup.add(visualHandle);
    const mechIndicator = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2200 }));
    mechIndicator.position.set(0, -0.3, 0.17); mechGroup.add(mechIndicator);
    mechGroup.position.set(4, 1.5, -20);
    mechGroup.rotation.y = -Math.PI / 2;
    epScene.add(mechGroup);

    interactables.push({
      id: 'mechanism', mesh: mechGroup,
      getPrompt: () => {
        if (state.gateOpen) return null;
        if (!state.handleInstalled) return state.hasHandle ? 'УСТАНОВИТЬ РУКОЯТКУ' : 'НУЖНА РУКОЯТКА';
        if (!state.powerOn) return 'НЕТ ПИТАНИЯ';
        return 'ОТКРЫТЬ ГЕРМОЗАТВОР';
      },
      canInteract: () => {
        if (state.gateOpen) return false;
        if (!state.handleInstalled) return state.hasHandle;
        return state.powerOn;
      },
      onInteract: () => {
        if (!state.handleInstalled) {
          state.handleInstalled = true; state.hasHandle = false;
          visualHandle.visible = true;
          audioEngine.playSteelChains();
          updateObjective(); updateInventory();
        } else if (state.powerOn) openGate();
      }
    });

    const powerGroup = new THREE.Group();
    const powerBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.25), metal);
    powerGroup.add(powerBox);
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xa01010, roughness: 0.5 }));
    lever.position.set(0, 0.15, 0.18); powerGroup.add(lever);
    const powerInd = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x220000 }));
    powerInd.position.set(0, -0.3, 0.18); powerGroup.add(powerInd);
    powerGroup.position.set(-1.8, 1.5, -38);
    powerGroup.rotation.y = Math.PI / 2;
    epScene.add(powerGroup);

    interactables.push({
      id: 'power', mesh: powerGroup,
      getPrompt: () => state.powerOn ? 'ПИТАНИЕ ВКЛЮЧЕНО' : 'ВКЛЮЧИТЬ АВАРИЙНОЕ ПИТАНИЕ',
      canInteract: () => !state.powerOn,
      onInteract: () => {
        state.powerOn = true;
        lever.rotation.z = -Math.PI / 3;
        powerInd.material.color.setHex(0x22ff44);
        mechIndicator.material.color.setHex(0x22ff44);
        activatePower();
      }
    });

    epFlash = new THREE.SpotLight(0xffe9c8, 3.2, 18, Math.PI / 6.5, 0.45, 1.2);
    epFlashTarget = new THREE.Object3D();
    epFlashTarget.position.set(0, 0, -1);
    epCamera.add(epFlash);
    epCamera.add(epFlashTarget);
    epFlash.target = epFlashTarget;

    epEmergLight = new THREE.PointLight(0xff2200, 0, 10);
    epEmergLight.position.set(0, 2.6, -41.5);
    epScene.add(epEmergLight);

    epScene.add(new THREE.AmbientLight(0x0a0c0a, 0.35));

    entity.mesh = createEntityMesh();
    entity.mesh.visible = false;
    epScene.add(entity.mesh);
  }

  function createEntityMesh() {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 1.6, 12), bodyMat);
    torso.position.y = 0.8; g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), bodyMat);
    head.position.y = 1.85; head.scale.set(0.9, 1.15, 0.95); g.add(head);
    const armGeo = new THREE.CylinderGeometry(0.07, 0.05, 1.4, 8);
    const la = new THREE.Mesh(armGeo, bodyMat); la.position.set(-0.42, 0.95, 0.05); la.rotation.z = 0.18; g.add(la);
    const ra = new THREE.Mesh(armGeo, bodyMat); ra.position.set(0.42, 0.95, 0.05); ra.rotation.z = -0.18; g.add(ra);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
    const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const le = new THREE.Mesh(eyeGeo, eyeMat); le.position.set(-0.08, 1.9, 0.18); g.add(le);
    const re = new THREE.Mesh(eyeGeo, eyeMat); re.position.set(0.08, 1.9, 0.18); g.add(re);
    return g;
  }

  function activatePower() {
    audioEngine.playSubterraneanRumble();
    setTimeout(() => audioEngine.playDistantCry(), 400);
    setTimeout(() => audioEngine.playSteelChains(), 900);
    epEmergLight.intensity = 1.8;
    updateObjective();
    setTimeout(() => spawnEntity(), 1400);
  }
  function spawnEntity() {
    if (entity.active) return;
    entity.pos.set(16, 0, -28);
    entity.mesh.position.set(16, 0, -28);
    entity.mesh.visible = true;
    entity.active = true;
    audioEngine.playWallScratching();
    audioEngine.playHeartbeatPulse(1.0);
    updateObjective();
  }
  function openGate() {
    if (gateDoor.isOpening) return;
    gateDoor.isOpening = true; gateDoor.opening = 0;
    if (typeof playMechanismUnlockClank === "function") playMechanismUnlockClank();
    else audioEngine.playSteelChains();
    if (typeof triggerLockHapticFeedback === "function") triggerLockHapticFeedback();
    audioEngine.playSubterraneanRumble();
    gateDoor.wall.enabled = false;
    state.gateOpen = true;
    updateObjective();
    if (!entity.active) spawnEntity();
  }

  function updateObjective() {
    let txt = '';
    if (state.won) txt = 'ВЫ ВЫБРАЛИСЬ';
    else if (state.gateOpen) txt = 'БЕГИТЕ К ВЫХОДУ. НЕ ОГЛЯДЫВАЙТЕСЬ.';
    else if (state.powerOn && state.handleInstalled) txt = 'Питание восстановлено. Откройте гермозатвор.';
    else if (state.powerOn && !state.handleInstalled) txt = 'Питание есть. Установите рукоятку в механизм у проёма.';
    else if (state.handleInstalled) txt = 'Рукоятка на месте. Найдите аварийное питание в конце коридора.';
    else if (state.hasHandle) txt = 'Рукоятка найдена. Установите её в механизм у проёма.';
    else txt = 'Обыщите комнату справа от коридора.';
    elObjective.textContent = txt;
  }
  function updateInventory() {
    if (state.hasHandle) elInventory.innerHTML = '<span class="item">[ РУКОЯТКА ]</span>';
    else if (state.handleInstalled) elInventory.innerHTML = '<span class="item">[ МЕХАНИЗМ: ГОТОВ ]</span>';
    else elInventory.innerHTML = '';
  }
  function updateWarning() {
    if (!entity.active || state.gameOver || state.won) { elWarning.classList.remove('visible'); return; }
    const dx = entity.pos.x - player.pos.x, dz = entity.pos.z - player.pos.z;
    if (Math.sqrt(dx*dx + dz*dz) < 8) elWarning.classList.add('visible');
    else elWarning.classList.remove('visible');
  }

  function resolveCollisions(pos, radius) {
    for (const wall of walls) {
      if (!wall.enabled) continue;
      if (wall.box.max.y < 0.4 || wall.box.min.y > EYE + 0.6) continue;
      const cx = Math.max(wall.box.min.x, Math.min(pos.x, wall.box.max.x));
      const cz = Math.max(wall.box.min.z, Math.min(pos.z, wall.box.max.z));
      const dx = pos.x - cx, dz = pos.z - cz;
      const distSq = dx*dx + dz*dz;
      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const push = radius - dist;
          pos.x += (dx / dist) * push;
          pos.z += (dz / dist) * push;
        } else {
          const opts = [
            { axis: 'x', d: pos.x - wall.box.min.x, s: -1 },
            { axis: 'x', d: wall.box.max.x - pos.x, s: 1 },
            { axis: 'z', d: pos.z - wall.box.min.z, s: -1 },
            { axis: 'z', d: wall.box.max.z - pos.z, s: 1 }
          ];
          opts.sort((a, b) => a.d - b.d);
          const n = opts[0], push = radius + n.d;
          if (n.axis === 'x') pos.x += n.s * push; else pos.z += n.s * push;
        }
      }
    }
  }

  function updateInteraction() {
    raycaster.setFromCamera(screenCenter, epCamera);
    raycaster.far = INTERACT_RANGE;
    const hits = raycaster.intersectObjects(interactables.map(i => i.mesh), true);
    let found = null;
    if (hits.length > 0) {
      for (const hit of hits) {
        let obj = hit.object;
        while (obj && obj !== epScene) {
          const inter = interactables.find(i => i.mesh === obj);
          if (inter) { found = inter; break; }
          obj = obj.parent;
        }
        if (found) break;
      }
    }
    hotInteractable = found;
    if (found) {
      const prompt = found.getPrompt();
      if (prompt) {
        elPrompt.textContent = `[E] ${prompt}`;
        elPrompt.classList.add('visible');
        elCrosshair.classList.add('hot');
      } else {
        elPrompt.classList.remove('visible');
        elCrosshair.classList.remove('hot');
      }
    } else {
      elPrompt.classList.remove('visible');
      elCrosshair.classList.remove('hot');
    }
  }
  function tryInteract() {
    if (hotInteractable && hotInteractable.canInteract()) {
      hotInteractable.onInteract();
      updateInteraction();
    }
  }

  const tmpForward = new THREE.Vector3(), tmpRight = new THREE.Vector3();
  function updatePlayer(dt) {
    let mx = 0, mz = 0;
    if (keys['w'] || keys['ц'] || keys['arrowup'])    mz -= 1;
    if (keys['s'] || keys['ы'] || keys['arrowdown'])  mz += 1;
    if (keys['a'] || keys['ф'] || keys['arrowleft'])  mx -= 1;
    if (keys['d'] || keys['в'] || keys['arrowright']) mx += 1;
    if (touch.moveId !== null) { mx += touch.moveDX; mz += touch.moveDY; }
    const len = Math.hypot(mx, mz);
    if (len > 1) { mx /= len; mz /= len; }

    tmpForward.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    tmpRight.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    const sprint = keys['shift'] || keys['shiftleft'] || keys['shiftright'];
    const speed = sprint ? RUN : WALK;
    const targetVx = (tmpForward.x * (-mz) + tmpRight.x * mx) * speed;
    const targetVz = (tmpForward.z * (-mz) + tmpRight.z * mx) * speed;
    player.vel.x += (targetVx - player.vel.x) * Math.min(1, dt * 12);
    player.vel.z += (targetVz - player.vel.z) * Math.min(1, dt * 12);
    player.pos.x += player.vel.x * dt;
    player.pos.z += player.vel.z * dt;
    resolveCollisions(player.pos, PR);

    const horizSpeed = Math.hypot(player.vel.x, player.vel.z);
    if (horizSpeed > 0.25 && !REDUCE_MOTION) {
      bobTimer += dt * (sprint ? 13 : 8.5);
    } else {
      bobTimer = 0;
    }
    const bobOffset = horizSpeed > 0.25 && !REDUCE_MOTION ? Math.sin(bobTimer) * 0.032 : 0;

    epCamera.position.copy(player.pos);
    epCamera.position.y = EYE + bobOffset;
    epCamera.rotation.order = 'YXZ';
    epCamera.rotation.y = player.yaw;
    epCamera.rotation.x = player.pitch;
    epFlash.intensity = player.flashlightOn ? 3.2 : 0;

    if (state.gameOver || state.won) return;

    if (state.gateOpen && player.pos.z < -47 && !state.won) {
      state.won = true;
      showOverlay('win', 'ВЫ ВЫБРАЛИСЬ',
        'Гермозатвор остался позади. Лестница вывела вас обратно на поверхность. Что-то внизу всё ещё смотрит вам вслед.');
      audioEngine.playDistantCry();
      setTimeout(() => audioEngine.playSubterraneanRumble(), 600);
    }
  }

  function updateEntity(dt) {
    if (!entity.active || state.gameOver || state.won) return;
    const dx = player.pos.x - entity.pos.x, dz = player.pos.z - entity.pos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    if (dist < 1.5) {
      entity.caught = true;
      state.gameOver = true;
      audioEngine.playHeartbeatPulse(1.0);
      setTimeout(() => audioEngine.playDistantCry(), 100);
      setTimeout(() => audioEngine.playWallScratching(), 300);
      showOverlay('caught', 'ВЫ ПОЙМАНЫ',
        'Тёмная фигура догнала вас в коридоре. Не хватило одного шага. Попробуйте снова — бегите быстрее.');
      return;
    }
    if (dist > 0.05) {
      const step = entity.speed * dt;
      entity.pos.x += (dx / dist) * step;
      entity.pos.z += (dz / dist) * step;
      resolveCollisions(entity.pos, 0.4);
    }
    entity.mesh.position.set(entity.pos.x, 0, entity.pos.z);
    const targetYaw = Math.atan2(dx, dz);
    let dyaw = targetYaw - entity.mesh.rotation.y;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    entity.mesh.rotation.y += dyaw * Math.min(1, dt * 6);
    if (dist < 4 && Math.random() < dt * 1.2) audioEngine.playHeartbeatPulse(1.0);
  }

  function updateGate(dt) {
    if (!gateDoor.isOpening) return;
    gateDoor.opening = Math.min(1, gateDoor.opening + dt / 2.0);
    const ease = 1 - Math.pow(1 - gateDoor.opening, 3);
    gateDoor.mesh.position.y = gateDoor.baseY + ease * 3.2;
    if (gateDoor.opening >= 1) gateDoor.isOpening = false;
  }

  function showOverlay(kind, title, text) {
    elOverlay.className = 'visible ' + kind;
    elOverlayTitle.textContent = title;
    elOverlayText.textContent = text;
    if (document.pointerLockElement === glCanvas) document.exitPointerLock();
  }
  function hideOverlay() { elOverlay.className = ''; }

  function resetState() {
    state.hasHandle = false;
    state.handleInstalled = false;
    state.wireChecked = false;
    state.bottleChecked = false;
    state.powerOn = false;
    state.gateOpen = false;
    state.gameOver = false;
    state.won = false;
  }
  function resetLevelVisuals() {
    for (const inter of interactables) {
      if (inter.id === 'handle') inter.mesh.visible = true;
    }
    gateDoor.mesh.position.y = gateDoor.baseY;
    gateDoor.opening = 0;
    gateDoor.isOpening = false;
    gateDoor.wall.enabled = true;
    epEmergLight.intensity = 0;
    entity.mesh.visible = false;
    entity.active = false;
    entity.caught = false;
  }

  function isTouchDevice() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }

  function onKeyDown(e) {
    if (!active) return;
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (k === 'f' || k === 'а') toggleFlashlight();
    if (k === 'e' || k === 'у') tryInteract();
    if (e.key === 'Escape') {
      if (pointerLocked) document.exitPointerLock();
      else togglePause();
    }
  }
  function onKeyUp(e) {
    if (!active) return;
    keys[e.key.toLowerCase()] = false;
  }
  function onMouseMove(e) {
    if (!active || !pointerLocked) return;
    const sens = 0.0022;
    player.yaw -= e.movementX * sens;
    player.pitch -= e.movementY * sens;
    player.pitch = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, player.pitch));
  }
  function onPointerLockChange() {
    pointerLocked = (document.pointerLockElement === glCanvas);
    if (active && !pointerLocked && !state.gameOver && !state.won && !paused) togglePause();
  }
  function onCanvasClick() {
    if (!active) return;
    if (!pointerLocked && !isTouchDevice() && !state.gameOver && !state.won && !paused) glCanvas.requestPointerLock?.();
  }
  function toggleFlashlight() {
    player.flashlightOn = !player.flashlightOn;
    epFlash.intensity = player.flashlightOn ? 3.2 : 0;
    elBtnF.style.background = player.flashlightOn ? 'rgba(189,125,59,0.55)' : '';
  }
  function togglePause() {
    if (!active) return;
    paused = !paused;
    elPause.classList.toggle('visible', paused);
    if (paused && pointerLocked) document.exitPointerLock();
    if (!paused && !isTouchDevice()) glCanvas.requestPointerLock?.();
  }

  function bindTouchControls() {
    if (!isTouchDevice()) return;
    elTouch.classList.add('visible');
    elHint.style.display = 'none';
    const js = elJoystick;
    js.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      touch.moveId = t.identifier;
      touch.moveStartX = t.clientX;
      touch.moveStartY = t.clientY;
    }, { passive: false });
    js.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === touch.moveId) {
          const dx = t.clientX - touch.moveStartX, dy = t.clientY - touch.moveStartY;
          const maxR = 55, dist = Math.hypot(dx, dy);
          const nx = dist > maxR ? dx / dist * maxR : dx;
          const ny = dist > maxR ? dy / dist * maxR : dy;
          touch.moveDX = nx / maxR; touch.moveDY = ny / maxR;
          elJoystickKnob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
        }
      }
    }, { passive: false });
    const endMove = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === touch.moveId) {
          touch.moveId = null; touch.moveDX = 0; touch.moveDY = 0;
          elJoystickKnob.style.transform = 'translate(-50%, -50%)';
        }
      }
    };
    js.addEventListener('touchend', endMove, { passive: false });
    js.addEventListener('touchcancel', endMove, { passive: false });

    elHud.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) {
        if (t.clientX > window.innerWidth / 2 &&
            !e.target.closest('#ep1-joystick, #ep1-btn-f, #ep1-btn-e, #ep1-pause, #ep1-overlay-msg')) {
          touch.lookId = t.identifier;
          touch.lookLastX = t.clientX; touch.lookLastY = t.clientY;
          break;
        }
      }
    }, { passive: true });
    elHud.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === touch.lookId) {
          player.yaw -= (t.clientX - touch.lookLastX) * 0.005;
          player.pitch -= (t.clientY - touch.lookLastY) * 0.005;
          player.pitch = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, player.pitch));
          touch.lookLastX = t.clientX; touch.lookLastY = t.clientY;
        }
      }
    }, { passive: true });
    const endLook = (e) => {
      for (const t of e.changedTouches) if (t.identifier === touch.lookId) touch.lookId = null;
    };
    elHud.addEventListener('touchend', endLook, { passive: true });
    elHud.addEventListener('touchcancel', endLook, { passive: true });
    elBtnF.addEventListener('touchstart', (e) => { e.preventDefault(); toggleFlashlight(); });
    elBtnE.addEventListener('touchstart', (e) => { e.preventDefault(); tryInteract(); });
  }

  function init() {
    if (inited) return;
    inited = true;
    elHud = document.getElementById('ep1-hud');
    elCrosshair = document.getElementById('ep1-crosshair');
    elPrompt = document.getElementById('ep1-prompt');
    elObjective = document.getElementById('ep1-objective');
    elInventory = document.getElementById('ep1-inventory');
    elWarning = document.getElementById('ep1-warning');
    elHint = document.getElementById('ep1-hint');
    elOverlay = document.getElementById('ep1-overlay-msg');
    elOverlayTitle = document.getElementById('ep1-overlay-title');
    elOverlayText = document.getElementById('ep1-overlay-text');
    elPause = document.getElementById('ep1-pause');
    elFade = document.getElementById('ep1-fade');
    elStartScreen = document.getElementById('ep1-startscreen');
    elTouch = document.getElementById('ep1-touch');
    elJoystick = document.getElementById('ep1-joystick');
    elJoystickKnob = document.getElementById('ep1-joystick-knob');
    elBtnF = document.getElementById('ep1-btn-f');
    elBtnE = document.getElementById('ep1-btn-e');

    epScene = new THREE.Scene();
    epScene.background = new THREE.Color(0x000000);
    epScene.fog = new THREE.FogExp2(0x000000, 0.075);
    epCamera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 100);
    epCamera.position.set(0, EYE, 6);
    epCamera.rotation.order = 'YXZ';
    epScene.add(epCamera);

    buildLevel();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    glCanvas.addEventListener('click', onCanvasClick);

    document.getElementById('ep1-btn-retry').addEventListener('click', restartEpisode);
    document.getElementById('ep1-btn-exit').addEventListener('click', () => stop());
    document.getElementById('ep1-btn-resume').addEventListener('click', () => togglePause());
    document.getElementById('ep1-btn-quit').addEventListener('click', () => stop());

    bindTouchControls();
  }

  function start() {
    if (active) return;
    active = true;
    paused = false;
    resetState();
    resetLevelVisuals();
    player.pos.set(0, EYE, 6);
    player.vel.set(0, 0, 0);
    player.yaw = 0;
    player.pitch = 0;
    player.flashlightOn = true;
    epFlash.intensity = 3.2;
    elBtnF.style.background = 'rgba(189,125,59,0.55)';

    document.body.classList.add('ep1-active');
    elHud.classList.add('active');
    hideOverlay();
    elPause.classList.remove('visible');
    updateObjective();
    updateInventory();

    if (!isTouchDevice()) glCanvas.requestPointerLock?.();
    basementDescendedOnce = true;
    saveProgress();
    if (!started) { started = true; audioEngine.playSubterraneanRumble(); }
    audioEngine.playFootsteps();
  }

  function stop() {
    if (!active) return;
    active = false;
    paused = false;
    if (document.pointerLockElement === glCanvas) document.exitPointerLock();
    document.body.classList.remove('ep1-active');
    elHud.classList.remove('active');
    hideOverlay();
    elPause.classList.remove('visible');
    entity.mesh.visible = false;
    entity.active = false;
    saveProgress();
    syncTapeVideo();
  }

  function restartEpisode() {
    hideOverlay();
    resetState();
    resetLevelVisuals();
    player.pos.set(0, EYE, 6);
    player.vel.set(0, 0, 0);
    player.yaw = 0;
    player.pitch = 0;
    player.flashlightOn = true;
    epFlash.intensity = 3.2;
    elBtnF.style.background = 'rgba(189,125,59,0.55)';
    updateObjective();
    updateInventory();
    elWarning.classList.remove('visible');
    if (!isTouchDevice()) setTimeout(() => glCanvas.requestPointerLock?.(), 100);
  }

  function onResize() {
    if (!epCamera) return;
    epCamera.aspect = window.innerWidth / window.innerHeight;
    epCamera.updateProjectionMatrix();
  }

  function tick(dtSec) {
    if (!active) return;
    if (paused) { renderer.render(epScene, epCamera); return; }
    if (state.gameOver || state.won) {
      if (entity.active) entity.mesh.rotation.y += dtSec * 0.5;
      renderer.render(epScene, epCamera);
      return;
    }
    updatePlayer(dtSec);
    updateEntity(dtSec);
    updateGate(dtSec);
    updateInteraction();
    updateWarning();
    renderer.render(epScene, epCamera);
  }

  return {
    init, start, stop, tick, onResize,
    isActive: () => active
  };
})();

/* ============================================================
   ИНИЦИАЛИЗАЦИЯ UI
============================================================ */
function openEpisodeStartscreen() {
  document.getElementById('ep1-startscreen').style.display = 'flex';
}
document.getElementById('btn-enter-ep1').addEventListener('click', openEpisodeStartscreen);
document.getElementById('btn-hud-ep1').addEventListener('click', openEpisodeStartscreen);
document.getElementById('ep1-start-go').addEventListener('click', () => {
  document.getElementById('intro-screen').classList.add("hidden");
  fadeOutIntroBgm();
  document.getElementById('ep1-startscreen').style.display = 'none';
  window.Episode1.init();
  window.Episode1.start();
});
document.getElementById('ep1-start-cancel').addEventListener('click', () => {
  document.getElementById('ep1-startscreen').style.display = 'none';
});

const introBgm = document.getElementById("intro-bgm");
let introBgmStarted = false;
let introProceduralMixActive = false;

// Подмешиваем генерацию DarkAmbientAudio к тихому/короткому лупу, чтобы атмосфера звучала сразу без ожидания OGG
function startIntroProceduralLayer() {
  if (introProceduralMixActive) return;
  audioEngine.init();
  if (!audioEngine.ctx || !audioEngine.enabled) return;

  introProceduralMixActive = true;
  if (audioEngine.master) {
    // Делаем процедурный слой на экране входа приглушённым подложкой под луп
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
  introBgm.volume = 0.56; // тихий/комфортный луп, подмешиваемый к генерации

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
   Ползёт между буквами, обволакивает тени и подсвечивается изнутри
============================================================ */
const introFogCanvas = document.getElementById("intro-fog-canvas");
const introFogCtx = introFogCanvas ? introFogCanvas.getContext("2d") : null;

// Оффскрин-буфер низкого разрешения для плавного FBM-шума без просадки FPS
const fogNoiseCanvas = document.createElement("canvas");
fogNoiseCanvas.width = 256;
fogNoiseCanvas.height = 144;
const fogNoiseCtx = fogNoiseCanvas.getContext("2d");
const fogNoiseImg = fogNoiseCtx.createImageData(256, 144);

// Плавная детерминированная решётка градиентов / значений
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
  // Доменное искажение (domain warping) — создаёт живые завихрения тумана между буквами
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

  // Обновляем FBM-поле тумана с доменным искажением
  const data = fogNoiseImg.data;
  const nw = fogNoiseCanvas.width;
  const nh = fogNoiseCanvas.height;

  for (let y = 0; y < nh; y++) {
    const ny = y / nh;
    // Плотнее всего в средней полосе, где находятся буквы заголовка, и у земли
    const bandWeight = 0.55 + 0.45 * Math.exp(-Math.pow((ny - 0.52) / 0.28, 2));
    for (let x = 0; x < nw; x++) {
      const nx = x / nw;
      const nVal = fbmFog(nx, ny, t);
      const shaped = Math.pow(Math.max(0, (nVal - 0.34) / 0.58), 1.65);
      const alphaByte = Math.min(255, Math.floor(shaped * bandWeight * 175));

      const idx = (y * nw + x) * 4;
      // Холодно-серебристый туман с лёгким тёплым/болотным оттенком внутри облачных масс
      data[idx]     = 176 + Math.floor(shaped * 24);
      data[idx + 1] = 184 + Math.floor(shaped * 20);
      data[idx + 2] = 172 + Math.floor(shaped * 14);
      data[idx + 3] = alphaByte;
    }
  }
  fogNoiseCtx.putImageData(fogNoiseImg, 0, 0);

  introFogCtx.clearRect(0, 0, w, h);

  // Слой 1: мягко интерполированный объёмный FBM-туман
  introFogCtx.save();
  introFogCtx.filter = "blur(10px)";
  introFogCtx.globalAlpha = 0.86;
  introFogCtx.drawImage(fogNoiseCanvas, 0, 0, w, h);
  introFogCtx.restore();

  // Слой 2: тонкие ползущие клочья дымки, просачивающиеся сквозь просветы букв
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
  document.getElementById("intro-screen").classList.add("hidden");
  fadeOutIntroBgm();
  audioEngine.init();
  const sBtn = document.getElementById("btn-toggle-sound");
  sBtn.textContent = "ЗВУК: ВКЛ";
  sBtn.classList.add("active");
  sBtn.setAttribute("aria-pressed", "true");
  if (tapeVideo) tapeVideo.muted = false;
  syncTapeVideo();
  setTimeout(() => { spawnShadowEntity(true); audioEngine.playWallScratching(); }, 800);
});

document.getElementById("btn-regen-room").addEventListener("click", () => {
  const room = ROOMS[currentRoomIndex];
  if (!room.isProceduralRoom) return;
  audioEngine.playSubterraneanRumble();
  audioEngine.playWallScratching();
  generateRandomHorrorRoom(room);
  applyRoomTexture(currentRoomIndex);
  updateRoomHUD();
});

document.getElementById("btn-dev-pendulum").addEventListener("click", () => toggleDev360Mode());
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

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    saveProgress();
    if (tapeVideo && !tapeVideo.paused) tapeVideo.pause();
  } else {
    if (!(window.Episode1 && window.Episode1.isActive())) syncTapeVideo();
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
