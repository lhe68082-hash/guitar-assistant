// ============ 吉他学习助手 微信小程序 ============
const app = getApp();

// 常量
const NOTE_SEMITONE = { 'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11 };
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const STR_OPEN_MIDI = [40,45,50,55,59,64];
const OPEN_NOTES = ['E','A','D','G','B','E'];
const OPEN_FREQS = [82.41,110.00,146.83,196.00,246.94,329.63];
const NUM_FRETS = 13, NUM_STRINGS = 6, SCALE_FRETS = 13;
const INTERVAL_NAMES = ['根音','小二度','大二度','小三度','大三度','纯四度','增四/减五','纯五度','小六度','大六度','小七度','大七度'];
const TAG_CLASSES = ['root','third','fifth','seventh','ninth','eleventh'];

const CHORD_DEFS = {
  major:{name:'大三和弦',sn:'',intervals:'根音 · 大三度 · 纯五度',st:[0,4,7]},
  minor:{name:'小三和弦',sn:'m',intervals:'根音 · 小三度 · 纯五度',st:[0,3,7]},
  '7':{name:'属七和弦',sn:'7',intervals:'根音 · 大三度 · 纯五度 · 小七度',st:[0,4,7,10]},
  maj7:{name:'大七和弦',sn:'Maj7',intervals:'根音 · 大三度 · 纯五度 · 大七度',st:[0,4,7,11]},
  m7:{name:'小七和弦',sn:'m7',intervals:'根音 · 小三度 · 纯五度 · 小七度',st:[0,3,7,10]},
  dim:{name:'减三和弦',sn:'dim',intervals:'根音 · 小三度 · 减五度',st:[0,3,6]},
  aug:{name:'增三和弦',sn:'aug',intervals:'根音 · 大三度 · 增五度',st:[0,4,8]},
  sus4:{name:'挂四和弦',sn:'sus4',intervals:'根音 · 纯四度 · 纯五度',st:[0,5,7]},
};

const SCALES = {
  major:{name:'大调音阶',notes:[0,2,4,5,7,9,11]},
  minor:{name:'自然小调',notes:[0,2,3,5,7,8,10]},
  majPenta:{name:'大调五声',notes:[0,2,4,7,9]},
  minPenta:{name:'小调五声',notes:[0,3,5,7,10]},
  blues:{name:'布鲁斯',notes:[0,3,5,6,7,10]},
};

const CAGED_PROTOTYPES = {
  major: [
    { name:'C型', nativeRoot:'C', frets:[null,3,2,0,1,0] },
    { name:'A型', nativeRoot:'A', frets:[null,0,2,2,2,0] },
    { name:'G型', nativeRoot:'G', frets:[3,2,0,0,0,3] },
    { name:'E型', nativeRoot:'E', frets:[0,2,2,1,0,0] },
    { name:'D型', nativeRoot:'D', frets:[null,null,0,2,3,2] },
  ],
  minor: [
    { name:'Am型', nativeRoot:'A', frets:[null,0,2,2,1,0] },
    { name:'Em型', nativeRoot:'E', frets:[0,2,2,0,0,0] },
    { name:'Dm型', nativeRoot:'D', frets:[null,null,0,2,3,1] },
    { name:'Cm型', nativeRoot:'C', frets:[null,3,1,0,1,3] },
    { name:'Gm型', nativeRoot:'G', frets:[3,1,0,0,3,3] },
  ],
  '7': [
    { name:'C7型', nativeRoot:'C', frets:[null,3,2,3,1,0] },
    { name:'A7型', nativeRoot:'A', frets:[null,0,2,0,2,0] },
    { name:'G7型', nativeRoot:'G', frets:[3,2,0,0,0,1] },
    { name:'E7型', nativeRoot:'E', frets:[0,2,0,1,0,0] },
    { name:'D7型', nativeRoot:'D', frets:[null,null,0,2,1,2] },
  ],
  maj7: [
    { name:'Cmaj7型', nativeRoot:'C', frets:[null,3,2,0,0,0] },
    { name:'Amaj7型', nativeRoot:'A', frets:[null,0,2,1,2,0] },
    { name:'Gmaj7型', nativeRoot:'G', frets:[3,2,0,0,0,2] },
    { name:'Emaj7型', nativeRoot:'E', frets:[0,2,1,1,0,0] },
    { name:'Dmaj7型', nativeRoot:'D', frets:[null,null,0,2,2,2] },
  ],
  m7: [
    { name:'Am7型', nativeRoot:'A', frets:[null,0,2,0,1,0] },
    { name:'Em7型', nativeRoot:'E', frets:[0,2,0,0,0,0] },
    { name:'Dm7型', nativeRoot:'D', frets:[null,null,0,2,1,1] },
    { name:'Cm7型', nativeRoot:'C', frets:[null,3,1,3,1,3] },
    { name:'Gm7型', nativeRoot:'G', frets:[3,1,0,0,3,1] },
  ],
  dim: [
    { name:'Adim型', nativeRoot:'A', frets:[null,0,1,2,1,2] },
    { name:'Edim型', nativeRoot:'E', frets:[null,null,0,1,0,1] },
    { name:'Ddim型', nativeRoot:'D', frets:[null,null,0,1,0,1] },
    { name:'Gdim型', nativeRoot:'G', frets:[3,4,5,3,5,3] },
    { name:'Cdim型', nativeRoot:'C', frets:[null,3,4,5,4,5] },
  ],
  aug: [
    { name:'Caug型', nativeRoot:'C', frets:[null,3,2,1,1,0] },
    { name:'Aaug型', nativeRoot:'A', frets:[null,0,2,2,2,1] },
    { name:'Eaug型', nativeRoot:'E', frets:[0,2,2,1,3,0] },
    { name:'Gaug型', nativeRoot:'G', frets:[3,2,1,0,0,3] },
    { name:'Daug型', nativeRoot:'D', frets:[null,null,0,2,3,3] },
  ],
  sus4: [
    { name:'Csus4型', nativeRoot:'C', frets:[null,3,3,0,1,1] },
    { name:'Asus4型', nativeRoot:'A', frets:[null,0,2,2,3,0] },
    { name:'Esus4型', nativeRoot:'E', frets:[0,2,2,2,0,0] },
    { name:'Dsus4型', nativeRoot:'D', frets:[null,null,0,2,3,3] },
    { name:'Gsus4型', nativeRoot:'G', frets:[3,3,0,0,1,3] },
  ],
};

const INSTRUMENTS = {
  guitar:{name:'吉他',desc:'标准调弦 · E₂ A₂ D₃ G₃ B₃ E₄',strings:[
    {num:6,note:'E',octave:2,freq:82.41},{num:5,note:'A',octave:2,freq:110.00},
    {num:4,note:'D',octave:3,freq:146.83},{num:3,note:'G',octave:3,freq:196.00},
    {num:2,note:'B',octave:3,freq:246.94},{num:1,note:'E',octave:4,freq:329.63}]},
  ukulele:{name:'尤克里里',desc:'标准调弦 · G₄ C₄ E₄ A₄',strings:[
    {num:4,note:'G',octave:4,freq:392.00},{num:3,note:'C',octave:4,freq:261.63},
    {num:2,note:'E',octave:4,freq:329.63},{num:1,note:'A',octave:4,freq:440.00}]},
  bass:{name:'贝斯',desc:'标准调弦 · E₁ A₁ D₂ G₂',strings:[
    {num:4,note:'E',octave:1,freq:41.21},{num:3,note:'A',octave:1,freq:55.00},
    {num:2,note:'D',octave:2,freq:73.42},{num:1,note:'G',octave:2,freq:98.00}]}
};

const METRONOME_SOUNDS = {
  click:{hi:1000,lo:750,type:'sine',dur:0.07,volHi:0.4,volLo:0.3},
  wood:{hi:550,lo:400,type:'triangle',dur:0.09,volHi:0.35,volLo:0.35},
  beep:{hi:880,lo:660,type:'square',dur:0.04,volHi:0.12,volLo:0.12},
  clave:{hi:2200,lo:1800,type:'sine',dur:0.03,volHi:0.5,volLo:0.5},
  cowbell:{hi:1200,lo:900,type:'square',dur:0.12,volHi:0.2,volLo:0.2},
  rimshot:{hi:3000,lo:2400,type:'sawtooth',dur:0.02,volHi:0.15,volLo:0.15},
  hihat:{hi:8000,lo:6000,type:'square',dur:0.05,volHi:0.06,volLo:0.06},
  stick:{hi:1600,lo:1200,type:'triangle',dur:0.04,volHi:0.3,volLo:0.3},
};

// ============ 工具函数 ============
function computeVoicings(root, type) {
  const shapes = CAGED_PROTOTYPES[type];
  if (!shapes) return [];
  const rootST = NOTE_SEMITONE[root];
  const results = [];
  for (const shape of shapes) {
    const nativeST = NOTE_SEMITONE[shape.nativeRoot];
    let offset = (rootST - nativeST + 12) % 12;
    const candidates = [offset, offset + 12];
    for (const o of candidates) {
      const frets = shape.frets.map(f => (f === null ? null : f + o));
      const active = frets.filter(f => f !== null);
      if (active.length < 3) continue;
      const minF = Math.min(...active), maxF = Math.max(...active);
      if (minF < 0 || maxF > 15 || maxF - minF > 5) continue;
      results.push({ name: shape.name, frets });
      break;
    }
  }
  const seen = new Set();
  return results.filter(r => {
    const k = r.frets.map(f => (f === null ? 'x' : f)).join(',');
    if (seen.has(k)) return false; seen.add(k); return true;
  }).sort((a, b) => {
    const ma = Math.min(...a.frets.filter(f => f !== null));
    const mb = Math.min(...b.frets.filter(f => f !== null));
    return ma - mb;
  }).slice(0, 5);
}

function getChordNotes(root, type) {
  const rs = NOTE_SEMITONE[root];
  return CHORD_DEFS[type].st.map(s => NOTE_NAMES[(rs + s) % 12]);
}

function getIntervalsFromRoot(rn, nums) {
  return nums.map(n => { const d = (n - rn + 12) % 12; return INTERVAL_NAMES[d] || '半音' + d; }).join(' · ');
}

function matchChordFromNotes(noteSet) {
  const arr = Array.from(noteSet).sort((a, b) => a - b);
  const best = [];
  for (const [tk, cd] of Object.entries(CHORD_DEFS)) {
    for (let ro = 0; ro < 12; ro++) {
      const expected = new Set(cd.st.map(s => (ro + s) % 12));
      if (arr.every(n => expected.has(n)) && arr.length === expected.size) {
        best.push({ type: tk, root: NOTE_NAMES[ro], name: cd.name, sn: cd.sn, score: arr.length });
      }
    }
  }
  best.sort((a, b) => b.score - a.score);
  return best;
}

// ============ 音频引擎 ============
let _webaudio = null;
function getWebAudioCtx() {
  if (!_webaudio) _webaudio = wx.createWebAudioContext();
  return _webaudio;
}

function playTone(freq, dur, type, vol) {
  const ctx = getWebAudioCtx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const now = ctx.currentTime;
  o.type = type || 'sine';
  o.frequency.value = freq;
  g.gain.value = vol || 0.3;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  g.gain.linearRampToValueAtTime(0.001, now + (dur || 1.5));
  setTimeout(() => { o.stop(); }, (dur || 1.5) * 1000 + 100);
}

function getFretFreq(si, f) { return OPEN_FREQS[si] * Math.pow(2, f / 12); }
function playFretSound(si, f) { playTone(getFretFreq(si, f), 1.8, 'triangle', 0.25); }

Page({
  data: {
    // 标签
    activeTab: 'chord',

    // 和弦查询
    rootNotes: ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
    chordTypes: [
      { key: 'major', label: '大三和弦' }, { key: 'minor', label: '小三和弦' },
      { key: '7', label: '属七和弦' }, { key: 'maj7', label: '大七和弦' },
      { key: 'm7', label: '小七和弦' }, { key: 'dim', label: '减三和弦' },
      { key: 'aug', label: '增三和弦' }, { key: 'sus4', label: '挂四和弦' },
    ],
    scaleTypes: [
      { key: 'major', label: '大调' }, { key: 'minor', label: '小调' },
      { key: 'majPenta', label: '大五声' }, { key: 'minPenta', label: '小五声' },
      { key: 'blues', label: '布鲁斯' },
    ],
    selRoot: 'C', selType: 'major', chordMode: 'query',
    chordName: 'C', chordTypeBadge: '大三和弦',
    chordNotes: 'C · E · G', chordIntervals: '根音 · 大三度 · 纯五度',
    chordNoteTags: [{ note: 'C', cls: 'root' }, { note: 'E', cls: 'third' }, { note: 'G', cls: 'fifth' }],
    voicingIdx: 0, voicingTotal: 0, voicingLabel: '1/5 · C型',
    showFavBtn: true, showVoicingNav: true, showChordSelector: true,
    showScaleType: false, showReverseHint: false,
    strumHint: '↕ 滑动指板浏览更多品位 · 水平拖拽扫弦',
    favs: [], progressions: [],
    progPlaying: false, progIdx: -1, progBpmVal: 80,
    showProgPanel: false,

    // 调音器
    currentInst: 'guitar', instStrings: [], isListening: false,
    detectedFreq: '-- Hz', detectedNote: '轻弹琴弦即可检测',
    tunerDesc: '标准调弦 · E₂ A₂ D₃ G₃ B₃ E₄',
    instruments: [
      { key: 'guitar', label: '吉他' },
      { key: 'ukulele', label: '尤克里里' },
      { key: 'bass', label: '贝斯' },
    ],

    // 节拍器
    bpm: 120, metroRunning: false, beatDots: [0,1,2,3],
    tsBtns: [
      { beats: 4, div: 4, label: '4/4', active: true },
      { beats: 3, div: 4, label: '3/4', active: false },
      { beats: 2, div: 4, label: '2/4', active: false },
      { beats: 6, div: 8, label: '6/8', active: false },
      { beats: 5, div: 4, label: '5/4', active: false },
      { beats: 7, div: 8, label: '7/8', active: false },
    ],
    bpmValB: 4, beatDiv: 4,
    soundTypes: [
      { key: 'click', label: '经典咔哒' }, { key: 'wood', label: '木鱼声' },
      { key: 'beep', label: '电子嘀' }, { key: 'clave', label: '响棒' },
      { key: 'cowbell', label: '牛铃' }, { key: 'rimshot', label: '鼓边' },
      { key: 'hihat', label: '踩镲' }, { key: 'stick', label: '鼓棒' },
    ],
    selSound: 'click',
    selSoundIdx: 0,
    selSoundLabel: '经典咔哒',
    isFav: false,
    selScale: 'major',
  },

  // 和弦指型缓存
  allVoicings: [],
  reverseFrets: [],

  // 调音器
  micListening: false,
  tunerAnimId: null,

  // 节拍器
  metroBeatIdx: 0, metroTimer: null, metroSchedTimer: null, metroNextBeat: 0,
  tapTimes: [],

  // 和弦进行
  progTimer: null,

  onLoad() {
    this.allVoicings = [];
    this.reverseFrets = Array(6).fill(null);
    const favs = app.globalData.favs || [];
    const progs = app.globalData.progressions || [];
    this.setData({ favs, progressions: progs });
    this.renderChord(true);
    this.renderHeadstock('guitar');
  },

  onReady() {
    // Canvas 初始化在 chordCanvasReady 中
  },

  onUnload() {
    this.stopMetro();
    this.stopListening();
    if (this.progTimer) clearTimeout(this.progTimer);
  },

  // ============ Tab 切换 ============
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === 'tuner') this.stopMetro();
    if (tab === 'metronome') this.stopListening();
    this.setData({ activeTab: tab });
  },

  // ============ 和弦查询 ============
  selectRoot(e) {
    const root = e.currentTarget.dataset.note;
    this.setData({ selRoot: root });
    this.renderChord();
  },
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ selType: type, voicingIdx: 0 });
    this.renderChord();
  },
  setChordMode(e) {
    const mode = e.currentTarget.dataset.mode;
    const updates = {
      chordMode: mode,
      showChordSelector: mode === 'query',
      showVoicingNav: mode === 'query',
      showFavBtn: mode === 'query',
      showScaleType: mode === 'scale',
      showReverseHint: mode === 'reverse',
      strumHint: mode === 'scale' ? '13品完整音阶指型 · 轻点音阶音试听' : '↕ 滑动指板浏览更多品位 · 水平拖拽扫弦',
    };
    if (mode !== 'scale') this.setData(updates, () => this.initCanvas('chord'));
    else this.setData(updates, () => this.initCanvas('scale'));
    if (mode === 'reverse') { this.reverseFrets = Array(6).fill(null); this.setData({ chordName: '点击指板', chordNotes: '点击品位标记按弦', chordIntervals: '点击指板自动识别和弦', chordNoteTags: [] }); }
    this.renderChord();
  },

  // ---- 指型导航 ----
  prevVoicing() {
    if (this.data.voicingIdx > 0) {
      this.setData({ voicingIdx: this.data.voicingIdx - 1 });
      this.renderVoicing();
    }
  },
  nextVoicing() {
    if (this.data.voicingIdx < this.allVoicings.length - 1) {
      this.setData({ voicingIdx: this.data.voicingIdx + 1 });
      this.renderVoicing();
    }
  },

  // ---- 收藏 ----
  toggleFav() {
    const { selRoot, selType, favs } = this.data;
    const idx = favs.findIndex(f => f.root === selRoot && f.type === selType);
    const newFavs = [...favs];
    if (idx >= 0) newFavs.splice(idx, 1);
    else newFavs.unshift({ root: selRoot, type: selType, name: selRoot + (CHORD_DEFS[selType].sn || '') });
    if (newFavs.length > 20) newFavs.pop();
    app.globalData.favs = newFavs;
    wx.setStorageSync('guitar_favs', JSON.stringify(newFavs));
    this.setData({ favs: newFavs });
  },
  selectFav(e) {
    const { root, type } = e.currentTarget.dataset;
    this.setData({ selRoot: root, selType: type, voicingIdx: 0, chordMode: 'query', showChordSelector: true, showVoicingNav: true, showFavBtn: true, showScaleType: false });
    this.initCanvas('chord');
    this.renderChord();
  },
  removeFav(e) {
    const idx = parseInt(e.currentTarget.dataset.idx);
    const newFavs = [...this.data.favs];
    newFavs.splice(idx, 1);
    app.globalData.favs = newFavs;
    wx.setStorageSync('guitar_favs', JSON.stringify(newFavs));
    this.setData({ favs: newFavs });
  },

  // ---- 音阶类型 ----
  selectScale(e) {
    this.setData({ selScale: e.currentTarget.dataset.scale });
    this.renderChord();
  },

  // ---- 和弦进行 ----
  toggleProgPanel() { this.setData({ showProgPanel: !this.data.showProgPanel }); },
  addToProg() {
    const { selRoot, selType, progressions } = this.data;
    if (this.data.chordMode !== 'query') return;
    const name = selRoot + (CHORD_DEFS[selType].sn || '');
    const newProgs = [...progressions, { root: selRoot, type: selType, name }];
    if (newProgs.length > 20) newProgs.shift();
    app.globalData.progressions = newProgs;
    wx.setStorageSync('guitar_progs', JSON.stringify(newProgs));
    this.setData({ progressions: newProgs });
  },
  clearProg() {
    app.globalData.progressions = [];
    wx.setStorageSync('guitar_progs', '[]');
    this.stopProg();
    this.setData({ progressions: [], progPlaying: false, progIdx: -1 });
  },
  toggleProgPlay() {
    if (this.data.progPlaying) this.stopProg();
    else this.startProg();
  },
  progBpmChange(e) {
    this.setData({ progBpmVal: parseInt(e.detail.value) });
  },
  removeProg(e) {
    const idx = parseInt(e.currentTarget.dataset.idx);
    const newProgs = [...this.data.progressions];
    newProgs.splice(idx, 1);
    app.globalData.progressions = newProgs;
    wx.setStorageSync('guitar_progs', JSON.stringify(newProgs));
    this.setData({ progressions: newProgs });
    if (this.data.progPlaying) this.stopProg();
  },
  startProg() {
    const { progressions } = this.data;
    if (progressions.length === 0) return;
    this.setData({ progPlaying: true, progIdx: 0 });
    this.playProgChord(0);
  },
  stopProg() {
    if (this.progTimer) clearTimeout(this.progTimer);
    this.progTimer = null;
    this.setData({ progPlaying: false, progIdx: -1 });
  },
  playProgChord(idx) {
    const { progressions, progBpmVal } = this.data;
    if (idx >= progressions.length) { this.stopProg(); return; }
    this.setData({ progIdx: idx });
    const p = progressions[idx];
    const notes = getChordNotes(p.root, p.type);
    notes.forEach((n, i) => { setTimeout(() => playTone(OPEN_FREQS[0] * Math.pow(2, (NOTE_SEMITONE[n] + 12) / 12), 0.5, 'triangle', 0.15), i * 100); });
    const interval = 60000 / progBpmVal * 4;
    this.progTimer = setTimeout(() => this.playProgChord(idx + 1), interval);
  },

  // ---- 渲染 ----
  renderChord(init) {
    if (this.data.chordMode === 'query') {
      if (init) {
        this.allVoicings = computeVoicings('C', 'major');
        this.setData({ voicingTotal: this.allVoicings.length, voicingIdx: 0, voicingLabel: '1/' + this.allVoicings.length });
      } else {
        this.allVoicings = computeVoicings(this.data.selRoot, this.data.selType);
        this.setData({ voicingIdx: 0, voicingTotal: this.allVoicings.length });
      }
      this.renderVoicing();
    } else if (this.data.chordMode === 'scale') {
      this.renderScale();
    }
  },

  renderVoicing() {
    const { selRoot, selType, voicingIdx } = this.data;
    const cd = CHORD_DEFS[selType];
    const entry = this.allVoicings[voicingIdx];
    if (!entry) return;
    const sn = cd.sn || '';
    const notes = getChordNotes(selRoot, selType);
    this.setData({
      chordName: (sn ? selRoot + sn : selRoot),
      chordTypeBadge: cd.name,
      chordNotes: notes.join(' · '),
      chordIntervals: cd.intervals,
      chordNoteTags: notes.map((n, i) => ({ note: n, cls: TAG_CLASSES[i] || 'fifth' })),
      voicingLabel: (voicingIdx + 1) + '/' + this.allVoicings.length + ' · ' + entry.name,
      voicingTotal: this.allVoicings.length,
    });
    const isFav = this.data.favs.some(f => f.root === selRoot && f.type === selType);
    this.setData({ isFav });
    this.drawFretboard(entry.frets, { name: cd.name, root: selRoot, shapeName: entry.name });
  },

  renderScale() {
    const { selRoot, selScale } = this.data;
    const scale = SCALES[selScale];
    const rootST = NOTE_SEMITONE[selRoot];
    const scaleNotes = scale.notes.map(s => NOTE_NAMES[(rootST + s) % 12]);
    this.setData({
      chordName: selRoot + ' ' + scale.name,
      chordNotes: scaleNotes.join(' · '),
      chordIntervals: '全部13品指型 · 轻点试听',
      chordNoteTags: [],
    });
    this.drawScale(scaleNotes, rootST, selRoot);
  },

  updateReverseChord() {
    const noteSet = new Set();
    let hasNotes = false;
    this.reverseFrets.forEach((f, idx) => {
      if (typeof f === 'number') {
        const on = NOTE_SEMITONE[OPEN_NOTES[idx]];
        noteSet.add((on + f) % 12);
        hasNotes = true;
      }
    });
    if (!hasNotes || noteSet.size === 0) {
      this.setData({ chordName: '点击指板', chordNotes: '点击品位标记按弦', chordIntervals: '点击指板自动识别和弦', chordNoteTags: [] });
      this.drawFretboard(this.reverseFrets, { name: '点击指板' });
      return;
    }
    const noteNums = Array.from(noteSet);
    const matches = matchChordFromNotes(noteSet);
    const rootNote = matches.length > 0 ? NOTE_SEMITONE[matches[0].root] : noteNums.sort((a, b) => a - b)[0];
    const sorted = noteNums.sort((a, b) => { const da = (a - rootNote + 12) % 12, db = (b - rootNote + 12) % 12; return da - db; });
    const nNames = sorted.map(n => NOTE_NAMES[n]);
    if (matches.length > 0) {
      const b = matches[0];
      let extra = '';
      if (matches.length > 1) extra = ' · 备选: ' + matches.slice(1, 4).map(m => m.root + (m.sn || '')).join(' / ');
      this.setData({
        chordName: b.root + (b.sn || ''),
        chordTypeBadge: b.name,
        chordNotes: nNames.join(' · '),
        chordIntervals: getIntervalsFromRoot(rootNote, sorted) + extra,
        chordNoteTags: nNames.map((n, i) => ({ note: n, cls: TAG_CLASSES[i] || 'fifth' })),
      });
    } else {
      this.setData({
        chordName: nNames.join(' · '),
        chordNotes: nNames.join(' · '),
        chordIntervals: getIntervalsFromRoot(rootNote, sorted) || '未匹配到已知和弦',
        chordNoteTags: nNames.map((n, i) => ({ note: n, cls: TAG_CLASSES[i] || 'fifth' })),
      });
    }
    this.drawFretboard(this.reverseFrets, { name: matches[0] ? matches[0].name : '' });
  },

  // ---- Canvas 指板绘制 ----
  initCanvas(mode) {
    const query = wx.createSelectorQuery().in(this);
    query.select('#chordCanvas').fields({ node: true, size: true }).exec(res => {
      if (!res || !res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      const w = res[0].width;
      const scale = Math.min(1, w / 340);
      const lm = Math.round(38 * scale), tm = Math.round(46 * scale);
      const fretH = mode === 'scale' ? Math.round(38 * scale) : Math.round(42 * scale);
      const nf = NUM_FRETS;
      const h = tm + nf * fretH + 20;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      this._canvasCtx = ctx;
      this._canvasLayout = { w, h, scale, leftMargin: lm, topMargin: tm, stringSpacing: Math.round(44 * scale), fretHeight: fretH, padding: Math.round(8 * scale) };
    });
  },

  chordCanvasReady() {
    const mode = this.data.chordMode;
    setTimeout(() => {
      this.initCanvas(mode);
      setTimeout(() => {
        if (mode === 'query') this.renderChord(true);
        else if (mode === 'scale') this.renderScale();
      }, 200);
    }, 100);
  },

  drawFretboard(shape, info) {
    const ctx = this._canvasCtx;
    const lay = this._canvasLayout;
    if (!ctx || !lay) return;
    const { w, h, leftMargin: lm, topMargin: tm, stringSpacing: ss, fretHeight: fh, scale } = lay;
    ctx.clearRect(0, 0, w, h);
    // 背景
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    this.roundRect(ctx, 2, 2, w - 4, h - 4, Math.round(10 * scale), true);
    // 品位标记
    [3, 5, 7, 9, 12].forEach(fn => {
      const y = tm + (fn - 0.5) * fh, dr = Math.max(2, Math.round(3 * scale));
      if (fn === 12) {
        [lm + 1.5 * ss, lm + 3.5 * ss].forEach(xx => {
          ctx.beginPath(); ctx.arc(xx, y, dr, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
        });
      } else {
        ctx.beginPath(); ctx.arc(lm + 2.5 * ss, y, dr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
      }
    });
    // 品丝
    for (let f = 0; f <= NUM_FRETS; f++) {
      const y = tm + f * fh;
      ctx.beginPath(); ctx.moveTo(lm - 6, y); ctx.lineTo(lm + 5 * ss + 6, y);
      ctx.strokeStyle = f === 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = f === 0 ? Math.max(1.5, 2.2 * scale) : Math.max(0.6, 1 * scale);
      ctx.stroke();
    }
    // 品位数字
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = `500 ${Math.max(8, Math.round(10 * scale))}px -apple-system,sans-serif`;
    ctx.textAlign = 'right';
    for (let f = 1; f <= NUM_FRETS; f++) ctx.fillText(f, lm - Math.round(10 * scale), tm + (f - 0.5) * fh + Math.round(3 * scale));
    // 弦线
    for (let s = 0; s < NUM_STRINGS; s++) {
      const x = lm + s * ss;
      ctx.beginPath(); ctx.moveTo(x, tm); ctx.lineTo(x, tm + NUM_FRETS * fh);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = Math.max(0.8, (1.2 - s * 0.12) * scale);
      ctx.stroke();
    }
    // 按弦标记
    const ds = Math.max(8, Math.round(10 * scale));
    (shape || []).forEach((fret, idx) => {
      if (fret === 'x' || fret === null || fret === undefined) return;
      const x = lm + idx * ss;
      if (fret === 0) {
        const rr = Math.max(5, Math.round(7 * scale));
        ctx.beginPath(); ctx.arc(x, tm - Math.round(18 * scale), rr, 0, Math.PI * 2);
        ctx.fillStyle = 'transparent'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = Math.max(1.2, 1.8 * scale); ctx.stroke();
      } else {
        if (fret < 1 || fret > NUM_FRETS) return;
        const y = tm + (fret - 0.5) * fh;
        ctx.beginPath(); ctx.arc(x, y + 1, ds, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
        const g = ctx.createRadialGradient(x - 2, y - 2, ds * 0.15, x, y, ds);
        g.addColorStop(0, '#5e9eff'); g.addColorStop(0.7, '#0a84ff'); g.addColorStop(1, '#0060d0');
        ctx.beginPath(); ctx.arc(x, y, ds - 0.5, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `600 ${Math.max(7, Math.round(9 * scale))}px -apple-system,sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(fret, x, y + 0.5);
      }
    });
    // 静音标记
    (shape || []).forEach((fret, idx) => {
      if (fret !== 'x') return;
      const x = lm + idx * ss, cy2 = tm - Math.round(18 * scale), cs = Math.max(3, Math.round(4.5 * scale));
      ctx.strokeStyle = 'rgba(255,69,58,0.7)'; ctx.lineWidth = Math.max(1.2, 1.8 * scale); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - cs, cy2 - cs); ctx.lineTo(x + cs, cy2 + cs);
      ctx.moveTo(x + cs, cy2 - cs); ctx.lineTo(x - cs, cy2 + cs); ctx.stroke();
    });
    // 弦号
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = `500 ${Math.max(8, Math.round(10 * scale))}px -apple-system,sans-serif`;
    ctx.textAlign = 'center';
    for (let s = 0; s < NUM_STRINGS; s++) ctx.fillText(6 - s, lm + s * ss, tm - Math.round(24 * scale));
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = `500 ${Math.max(7, Math.round(9 * scale))}px -apple-system,sans-serif`;
    for (let s = 0; s < NUM_STRINGS; s++) ctx.fillText(OPEN_NOTES[s], lm + s * ss, tm - Math.round(32 * scale));
    // 指型标签
    if (info.shapeName) {
      ctx.fillStyle = 'rgba(100,210,255,0.7)';
      ctx.font = `600 ${Math.max(8, Math.round(10 * scale))}px -apple-system,sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(info.shapeName, w - Math.round(8 * scale), Math.round(14 * scale));
    }
  },

  drawScale(scaleNotes, rootST, rootName) {
    const ctx = this._canvasCtx;
    const lay = this._canvasLayout;
    if (!ctx || !lay) return;
    const { w, h, leftMargin: lm, topMargin: tm, stringSpacing: ss, fretHeight: fh, scale } = lay;
    const nf = SCALE_FRETS;
    const noteSet = new Set(scaleNotes);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    this.roundRect(ctx, 2, 2, w - 4, h - 4, Math.round(10 * scale), true);
    [3, 5, 7, 9, 12].forEach(fn => {
      const y = tm + (fn - 0.5) * fh, dr = Math.max(2, Math.round(3 * scale));
      if (fn === 12) {
        [lm + 1.5 * ss, lm + 3.5 * ss].forEach(xx => {
          ctx.beginPath(); ctx.arc(xx, y, dr, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
        });
      } else {
        ctx.beginPath(); ctx.arc(lm + 2.5 * ss, y, dr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
      }
    });
    for (let f = 0; f <= nf; f++) {
      const y = tm + f * fh;
      ctx.beginPath(); ctx.moveTo(lm - 6, y); ctx.lineTo(lm + 5 * ss + 6, y);
      ctx.strokeStyle = f === 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = f === 0 ? Math.max(1.5, 2.2 * scale) : Math.max(0.6, 1 * scale);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = `500 ${Math.max(8, Math.round(9 * scale))}px -apple-system,sans-serif`;
    ctx.textAlign = 'right';
    for (let f = 1; f <= nf; f++) ctx.fillText(f, lm - Math.round(10 * scale), tm + (f - 0.5) * fh + Math.round(3 * scale));
    for (let s = 0; s < NUM_STRINGS; s++) {
      const x = lm + s * ss;
      ctx.beginPath(); ctx.moveTo(x, tm); ctx.lineTo(x, tm + nf * fh);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = Math.max(0.8, (1.2 - s * 0.12) * scale);
      ctx.stroke();
    }
    const ds = Math.max(8, Math.round(9 * scale)), lblSize = Math.max(7, Math.round(8 * scale));
    for (let s = 0; s < NUM_STRINGS; s++) {
      const os = STR_OPEN_MIDI[s] % 12;
      for (let f = 0; f <= nf; f++) {
        const ns = (os + f) % 12;
        const noteName = NOTE_NAMES[ns];
        if (!noteSet.has(noteName)) continue;
        const x = lm + s * ss, y = f === 0 ? tm - Math.round(18 * scale) : tm + (f - 0.5) * fh;
        const isRoot = (ns === rootST);
        ctx.beginPath(); ctx.arc(x, y, isRoot ? ds + 2 : ds, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(x - 1, y - 1, ds * 0.1, x, y, ds);
        if (isRoot) { g.addColorStop(0, '#ff6b6b'); g.addColorStop(0.7, '#ff375f'); g.addColorStop(1, '#d02a4a'); }
        else { g.addColorStop(0, '#64d2ff'); g.addColorStop(0.7, '#0a84ff'); g.addColorStop(1, '#0060d0'); }
        ctx.fillStyle = g; ctx.fill();
        if (f === 0) { ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5 * scale; ctx.stroke(); }
        ctx.fillStyle = '#fff';
        ctx.font = `700 ${lblSize}px -apple-system,sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(noteName, x, y + 0.5);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font = `600 ${Math.max(9, Math.round(11 * scale))}px -apple-system,sans-serif`;
    ctx.textAlign = 'center';
    for (let s = 0; s < NUM_STRINGS; s++) ctx.fillText((6 - s) + '弦', lm + s * ss, tm - Math.round(24 * scale));
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.font = `500 ${Math.max(7, Math.round(9 * scale))}px -apple-system,sans-serif`;
    for (let s = 0; s < NUM_STRINGS; s++) ctx.fillText(OPEN_NOTES[s], lm + s * ss, tm - Math.round(33 * scale));
    // 图例
    ctx.fillStyle = '#ff375f'; ctx.beginPath(); ctx.arc(w - 90, h - 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '500 8px -apple-system,sans-serif'; ctx.textAlign = 'left'; ctx.fillText('根音', w - 83, h - 9);
    ctx.fillStyle = '#0a84ff'; ctx.beginPath(); ctx.arc(w - 56, h - 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillText('音阶音', w - 49, h - 9);
  },

  roundRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
  },

  // ---- 指板交互 ----
  handleFretTap(e) {
    if (this.data.chordMode === 'scale') return;
    const lay = this._canvasLayout;
    if (!lay) return;
    // 获取 canvas 坐标（小程序 canvas touchstart 事件使用 e.detail）
    let cx, cy;
    if (e.detail && typeof e.detail.x === 'number') {
      cx = e.detail.x; cy = e.detail.y;
    } else if (e.touches && e.touches[0]) {
      cx = e.touches[0].x; cy = e.touches[0].y;
    } else {
      return;
    }
    const { leftMargin: lm, topMargin: tm, stringSpacing: ss, fretHeight: fh, scale } = lay;
      let cs = -1, cf = -1;
      for (let s = 0; s < NUM_STRINGS; s++) {
        const x = lm + s * ss;
        if (Math.abs(cx - x) < ss * 0.48) { cs = s; break; }
      }
      if (cs >= 0) {
        const muteZ = tm - Math.round(38 * scale), openZ = tm - Math.round(22 * scale);
        if (cy >= muteZ && cy < openZ) cf = 'x';
        else if (cy >= openZ && cy < tm) cf = 0;
        else if (cy >= tm && cy < tm + NUM_FRETS * fh) {
          cf = Math.floor((cy - tm) / fh) + 1;
          if (cf > NUM_FRETS) cf = NUM_FRETS;
        }
      }
      if (cs < 0) return;
      if (this.data.chordMode === 'reverse') {
        const cur = this.reverseFrets[cs];
        if (cur === null || cur === undefined) this.reverseFrets[cs] = cf;
        else if (cur === cf) this.reverseFrets[cs] = 0;
        else if (cur === 0) this.reverseFrets[cs] = 'x';
        else if (cur === 'x') this.reverseFrets[cs] = null;
        else this.reverseFrets[cs] = cf;
        if (typeof this.reverseFrets[cs] === 'number' && this.reverseFrets[cs] >= 0) playFretSound(cs, this.reverseFrets[cs]);
        this.updateReverseChord();
      } else if (typeof cf === 'number' && cf >= 0) {
        playFretSound(cs, cf);
      }
  },

  // ============ 调音器 ============
  renderHeadstock(ik) {
    const inst = INSTRUMENTS[ik];
    const half = Math.ceil(inst.strings.length / 2);
    const ls = inst.strings.slice(0, half).reverse();
    const rs = inst.strings.slice(half);
    const leftRows = ls.map(s => ({
      num: s.num, note: s.note, freq: s.freq, label: '①②③④⑤⑥'.charAt(s.num - 1)
    }));
    const rightRows = rs.map(s => ({
      num: s.num, note: s.note, freq: s.freq, label: '①②③④⑤⑥'.charAt(s.num - 1)
    }));
    this.setData({
      currentInst: ik,
      tunerDesc: inst.desc,
      leftRows, rightRows,
    });
  },
  selectInstrument(e) {
    const ik = e.currentTarget.dataset.instrument;
    if (ik === this.data.currentInst) return;
    this.stopListening();
    this.renderHeadstock(ik);
  },
  playRefTone(e) {
    const freq = parseFloat(e.currentTarget.dataset.freq);
    playTone(freq, 2.2, 'sine', 0.35);
  },
  async toggleMic() {
    if (this.data.isListening) { this.stopListening(); return; }
    await this.startListening();
  },
  async startListening() {
    try {
      const recorder = wx.getRecorderManager();
      recorder.onFrameRecorded(res => {
        if (!this.micListening) return;
        this.detectPitchFromPCM(res.frameBuffer);
      });
      recorder.onError(err => {
        console.error('录音错误:', err);
        this.stopListening();
        wx.showToast({ title: '录音失败，请重试', icon: 'none' });
      });
      recorder.start({
        duration: 60000,
        sampleRate: 44100,
        numberOfChannels: 1,
        encodeBitRate: 192000,
        format: 'pcm',
        frameSize: 10
      });
      this._recorder = recorder;
      this.micListening = true;
      this.setData({ isListening: true, detectedFreq: '-- Hz', detectedNote: '轻弹琴弦即可检测' });
    } catch (e) {
      wx.showToast({ title: '请授权麦克风权限', icon: 'none' });
    }
  },
  stopListening() {
    this.micListening = false;
    if (this._recorder) {
      this._recorder.stop();
      this._recorder = null;
    }
    this.setData({ isListening: false, detectedFreq: '-- Hz', detectedNote: '轻弹琴弦即可检测' });
  },
  detectPitchFromPCM(buffer) {
    // buffer is ArrayBuffer of Int16LE samples
    const samples = new Int16Array(buffer);
    const len = samples.length;
    let rms = 0;
    for (let i = 0; i < len; i++) rms += samples[i] * samples[i];
    rms = Math.sqrt(rms / len);
    if (rms < 50) return; // too quiet

    // Autocorrelation pitch detection
    const corr = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      let sum = 0;
      for (let j = 0; j < len - i; j++) sum += (samples[j] / 32768) * (samples[j + i] / 32768);
      corr[i] = sum;
    }
    let d = 0;
    while (d < len - 1 && corr[d] > corr[d + 1]) d++;
    let mv = -1, mp = -1;
    for (let i = d; i < len; i++) {
      if (corr[i] > mv) { mv = corr[i]; mp = i; }
    }
    if (mp <= 0) return;
    let T0 = mp;
    if (mp > 0 && mp < len - 1) {
      const x1 = corr[mp - 1], x2 = corr[mp], x3 = corr[mp + 1];
      const a = (x1 + x3 - 2 * x2) / 2, b = (x3 - x1) / 2;
      if (a && a !== 0) T0 = mp - b / (2 * a);
    }
    const freq = 44100 / T0;
    if (freq < 30 || freq > 500) return;

    const inst = INSTRUMENTS[this.data.currentInst];
    let bestNote = '', bestCents = Infinity;
    for (const s of inst.strings) {
      for (let oct = -1; oct <= 1; oct++) {
        const tf = s.freq * Math.pow(2, oct);
        if (tf < 20 || tf > 600) continue;
        const cs = 1200 * Math.log2(freq / tf);
        if (Math.abs(cs) < Math.abs(bestCents)) { bestCents = cs; bestNote = s.note; }
      }
    }
    const cr = Math.round(bestCents);
    const dir = cr > 5 ? '偏高 ♯' : cr < -5 ? '偏低 ♭' : '准确 ✓';
    this.setData({
      detectedFreq: freq.toFixed(1) + ' Hz',
      detectedNote: bestNote + ' · ' + dir + ' · ' + Math.abs(cr) + '¢',
    });
  },

  // ============ 节拍器 ============
  setBPM(v) {
    const bpm = Math.max(30, Math.min(250, v));
    this.setData({ bpm });
  },
  bpmSliderChange(e) { this.setBPM(parseInt(e.detail.value)); },
  bpmD10() { this.setBPM(this.data.bpm - 10); },
  bpmD1() { this.setBPM(this.data.bpm - 1); },
  bpmI1() { this.setBPM(this.data.bpm + 1); },
  bpmI10() { this.setBPM(this.data.bpm + 10); },
  tapTempo() {
    const n = Date.now();
    this.tapTimes.push(n);
    if (this.tapTimes.length > 5) this.tapTimes.shift();
    if (this.tapTimes.length > 1 && n - this.tapTimes[this.tapTimes.length - 2] > 2000) this.tapTimes = [n];
    if (this.tapTimes.length >= 2) {
      let t = 0;
      for (let i = 1; i < this.tapTimes.length; i++) t += this.tapTimes[i] - this.tapTimes[i - 1];
      this.setBPM(Math.round(60000 / (t / (this.tapTimes.length - 1))));
    }
  },
  selectTimeSig(e) {
    const { beats, div } = e.currentTarget.dataset;
    const tsBtns = this.data.tsBtns.map(b => ({ ...b, active: b.beats === beats && b.div === div }));
    this.setData({ tsBtns, bpmValB: beats, beatDiv: div });
    if (this.data.metroRunning) { this.metroBeatIdx = 0; this.metroNextBeat = getWebAudioCtx().currentTime; }
  },
  selectSound(e) {
    this.setData({ selSound: e.currentTarget.dataset.sound || this.data.selSound });
  },
  toggleMetro() {
    if (this.data.metroRunning) this.stopMetro();
    else this.startMetro();
  },
  startMetro() {
    const ctx = getWebAudioCtx();
    this.metroBeatIdx = 0;
    this.metroNextBeat = ctx.currentTime;
    this.setData({ metroRunning: true });
    this.scheduler();
  },
  stopMetro() {
    if (this.metroSchedTimer) clearTimeout(this.metroSchedTimer);
    this.metroSchedTimer = null;
    this.setData({ metroRunning: false });
  },
  scheduler() {
    if (!this.data.metroRunning) return;
    const ctx = getWebAudioCtx();
    const { bpm, bpmValB, selSound } = this.data;
    const iv = 60 / bpm;
    const snd = METRONOME_SOUNDS[selSound] || METRONOME_SOUNDS.click;
    while (this.metroNextBeat < ctx.currentTime + 0.1) {
      const accent = this.metroBeatIdx === 0;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = this.metroNextBeat;
      const f = accent ? snd.hi : snd.lo;
      const vol = accent ? snd.volHi : snd.volLo;
      o.type = snd.type;
      o.frequency.value = f;
      g.gain.value = vol;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.linearRampToValueAtTime(0.001, t + snd.dur);
      setTimeout(() => { o.stop(); }, snd.dur * 1000 + 100);
      this.metroBeatIdx = (this.metroBeatIdx + 1) % bpmValB;
      this.metroNextBeat += iv;
    }
    this.metroSchedTimer = setTimeout(() => this.scheduler(), 25);
  },

  // ---- 声音选择（pick） ----
  soundPickChange(e) {
    const idx = parseInt(e.detail.value);
    const key = this.data.soundTypes[idx].key;
    const label = this.data.soundTypes[idx].label;
    this.setData({ selSound: key, selSoundIdx: idx, selSoundLabel: label });
  },
});
