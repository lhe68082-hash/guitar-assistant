// ============ 吉他学习助手 v4 - 多指型 + 收藏 + 进行 + 音阶 + PWA ============
(function () { "use strict";

// ==================== 常量 ====================
const NOTE_SEMITONE = { 'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11 };
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const STR_OPEN_MIDI = [40,45,50,55,59,64]; // E2 A2 D3 G3 B3 E4
const OPEN_NOTES = ['E','A','D','G','B','E'];
const OPEN_FREQS = [82.41,110.00,146.83,196.00,246.94,329.63];

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

const NUM_FRETS=13, NUM_STRINGS=6, SCALE_FRETS=13;
const INTERVAL_NAMES = ['根音','小二度','大二度','小三度','大三度','纯四度','增四/减五','纯五度','小六度','大六度','小七度','大七度'];
const TAG_CLASSES = ['root','third','fifth','seventh','ninth','eleventh'];

// ==================== 音频引擎 ====================
const AudioEngine = {
  _ctx:null,
  get ctx(){ if(!this._ctx) this._ctx=new(window.AudioContext||window.webkitAudioContext)(); if(this._ctx.state==='suspended') this._ctx.resume(); return this._ctx; },
  playTone(f,dur,type,vl){vl=vl||0.3;dur=dur||1.5;const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.value=f;g.gain.setValueAtTime(vl,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);o.connect(g);g.connect(c.destination);o.start(c.currentTime);o.stop(c.currentTime+dur);},
  getFretFreq(si,f){return OPEN_FREQS[si]*Math.pow(2,f/12);},
  playFretSound(si,f){this.playTone(this.getFretFreq(si,f),1.8,'triangle',0.25);},
  scheduleMetronomeBeat(ctx,time,idx,soundType,bpm){
    const o=ctx.createOscillator(),g=ctx.createGain(),accent=idx===0;let f,dur,type,vol;
    switch(soundType){
      case'click':f=accent?1000:750;type='sine';dur=0.07;vol=accent?0.4:0.3;break;
      case'wood':f=accent?550:400;type='triangle';dur=0.09;vol=0.35;break;
      case'beep':f=accent?880:660;type='square';dur=0.04;vol=0.12;break;
      case'clave':f=accent?2200:1800;type='sine';dur=0.03;vol=0.5;break;
      case'cowbell':f=accent?1200:900;type='square';dur=0.12;vol=0.2;break;
      case'rimshot':f=accent?3000:2400;type='sawtooth';dur=0.02;vol=0.15;break;
      case'hihat':f=accent?8000:6000;type='square';dur=0.05;vol=0.06;break;
      case'stick':f=accent?1600:1200;type='triangle';dur=0.04;vol=0.3;break;
      default:f=accent?1000:750;type='sine';dur=0.07;vol=0.4;
    }
    o.type=type;o.frequency.value=f;g.gain.setValueAtTime(vol,time);g.gain.exponentialRampToValueAtTime(0.001,time+dur);o.connect(g);g.connect(ctx.destination);o.start(time);o.stop(time+dur);
  }
};

// ==================== 和弦引擎（CAGED 系统） ====================
const VoicingCache = {};
function getChordNotes(root,type){const rs=NOTE_SEMITONE[root];return CHORD_DEFS[type].st.map(s=>NOTE_NAMES[(rs+s)%12]);}

// CAGED 五个把位原型 - 每个都是常见开放和弦在该调中的标准按法
// frets: [6弦, 5弦, 4弦, 3弦, 2弦, 1弦], null=静音
const CAGED_PROTOTYPES = {
  major: [
    { name:'C型', nativeRoot:'C', frets:[null,3,2,0,1,0] },   // 开放C和弦
    { name:'A型', nativeRoot:'A', frets:[null,0,2,2,2,0] },   // 开放A和弦
    { name:'G型', nativeRoot:'G', frets:[3,2,0,0,0,3] },     // 开放G和弦
    { name:'E型', nativeRoot:'E', frets:[0,2,2,1,0,0] },     // 开放E和弦
    { name:'D型', nativeRoot:'D', frets:[null,null,0,2,3,2] }, // 开放D和弦
  ],
  minor: [
    { name:'Am型', nativeRoot:'A', frets:[null,0,2,2,1,0] },
    { name:'Em型', nativeRoot:'E', frets:[0,2,2,0,0,0] },
    { name:'Dm型', nativeRoot:'D', frets:[null,null,0,2,3,1] },
    // C大调形状降3度 → 小调
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

function computeVoicings(root, type) {
  const key = root + '|' + type;
  if (VoicingCache[key]) return VoicingCache[key];

  const shapes = CAGED_PROTOTYPES[type];
  if (!shapes) { VoicingCache[key] = []; return []; }

  const rootST = NOTE_SEMITONE[root];
  const results = [];

  for (const shape of shapes) {
    // 计算需要移动的半音数
    const nativeST = NOTE_SEMITONE[shape.nativeRoot];
    let offset = (rootST - nativeST + 12) % 12;

    // 尝试 offset 和 offset+12，找到第一个有效的
    const candidates = [offset, offset + 12];
    for (const o of candidates) {
      const frets = shape.frets.map(f => (f === null ? null : f + o));
      const active = frets.filter(f => f !== null);
      if (active.length < 3) continue;

      const minF = Math.min(...active);
      const maxF = Math.max(...active);

      // 过滤：品位不能太高、跨度不能太大
      if (minF < 0 || maxF > 15) continue;
      if (maxF - minF > 5) continue;

      results.push({ name: shape.name, frets: frets });
      break; // 找到有效位置就停止
    }
  }

  // 如果不足5个，尝试 offset-12（往低把位走）来补
  if (results.length < 5) {
    const usedNames = new Set(results.map(r => r.name));
    for (const shape of shapes) {
      if (results.length >= 5) break;
      if (usedNames.has(shape.name)) continue;
      const nativeST = NOTE_SEMITONE[shape.nativeRoot];
      let offset = (rootST - nativeST + 12) % 12;
      offset -= 12; // 往低把位
      const frets = shape.frets.map(f => (f === null ? null : f + offset));
      const active = frets.filter(f => f !== null);
      if (active.length < 3) continue;
      const minF = Math.min(...active), maxF = Math.max(...active);
      if (minF < 0 || maxF > 15 || maxF - minF > 5) continue;
      results.push({ name: shape.name, frets: frets });
    }
  }

  // 去重并排序（按最低品位从低到高）
  const seen = new Set();
  const unique = [];
  for (const r of results) {
    const k = r.frets.map(f => (f === null ? 'x' : f)).join(',');
    if (!seen.has(k)) { seen.add(k); unique.push(r); }
  }
  unique.sort((a, b) => {
    const ma = Math.min(...a.frets.filter(f => f !== null));
    const mb = Math.min(...b.frets.filter(f => f !== null));
    return ma - mb;
  });

  VoicingCache[key] = unique.slice(0, 5);
  return VoicingCache[key];
}

function getNotesFromIntervals(root,st){const rn=NOTE_SEMITONE[root];return st.map(s=>NOTE_NAMES[(rn+s)%12]);}
function getIntervalsFromRoot(rn,nums){return nums.map(n=>{const d=(n-rn+12)%12;return INTERVAL_NAMES[d]||'半音'+d;}).join(' · ');}

// ==================== 数据存储 ====================
const STORE_FAV='guitar_favs',STORE_PROG='guitar_progs';
function loadFavs(){try{return JSON.parse(localStorage.getItem(STORE_FAV)||'[]');}catch(_){return[];}}
function saveFavs(favs){localStorage.setItem(STORE_FAV,JSON.stringify(favs));}
function loadProgs(){try{return JSON.parse(localStorage.getItem(STORE_PROG)||'[]');}catch(_){return[];}}
function saveProgs(progs){localStorage.setItem(STORE_PROG,JSON.stringify(progs));}

// ==================== Vibe 手势 ====================
function initVibeGestures(){
  const gl=document.getElementById('cursorGlow');if(!gl)return;
  let mx=innerWidth/2,my=innerHeight/2,cx=mx,cy=my,vis=false;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;if(!vis){vis=true;gl.style.opacity='1';}});
  document.addEventListener('mouseleave',()=>{vis=false;gl.style.opacity='0';});
  document.addEventListener('mouseenter',()=>{vis=true;gl.style.opacity='1';});
  document.addEventListener('touchmove',e=>{if(e.touches.length>0){mx=e.touches[0].clientX;my=e.touches[0].clientY;if(!vis){vis=true;gl.style.opacity='1';}}},{passive:true});
  document.addEventListener('touchend',()=>{setTimeout(()=>{vis=false;gl.style.opacity='0';},800);});
  (function a(){cx+=(mx-cx)*0.08;cy+=(my-cy)*0.08;gl.style.left=cx+'px';gl.style.top=cy+'px';requestAnimationFrame(a);})();
}

// ==================== 标签切换 ====================
function initTabNavigation(){
  document.querySelectorAll('.nav-tab').forEach(t=>t.addEventListener('click',()=>{
    const target=t.dataset.tab;
    document.querySelectorAll('.nav-tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    const panel=document.getElementById('panel-'+target);
    panel.classList.add('active');panel.style.animation='none';panel.offsetHeight;panel.style.animation='';
  }));
}

// ==================== 和弦查询器（多指型+收藏+音阶） ====================
function initChordFinder(){
  const rootNotesEl=document.getElementById('rootNotes'),chordTypesEl=document.getElementById('chordTypes');
  const chordNameEl=document.getElementById('chordName'),notesEl=document.getElementById('chordNotesComposition');
  const intervalsEl=document.getElementById('chordIntervals'),tagsEl=document.getElementById('chordNoteTags');
  const canvas=document.getElementById('chordCanvas'),chordSelector=document.getElementById('chordSelector');
  const reverseHint=document.getElementById('reverseHint'),modeTabs=document.getElementById('chordModeTabs');
  const scrollContainer=document.getElementById('fretboardScrollContainer'),strumHint=document.getElementById('strumHint');
  const voicingNav=document.getElementById('voicingNav'),voicingLabel=document.getElementById('voicingLabel');
  const voicingPrev=document.getElementById('voicingPrev'),voicingNext=document.getElementById('voicingNext');
  const voicingDots=document.getElementById('voicingDots');
  const favBtn=document.getElementById('favBtn'),favList=document.getElementById('favList');
  const scaleTypeRow=document.getElementById('scaleTypeRow'),scaleTypeBtns=document.getElementById('scaleTypeBtns');
  const progToggle=document.getElementById('progToggle'),progPanel=document.getElementById('progPanel');
  const progList=document.getElementById('progList'),progAdd=document.getElementById('progAdd');
  const progPlay=document.getElementById('progPlay'),progBpm=document.getElementById('progBpm');
  const progBpmVal=document.getElementById('progBpmVal'),progClear=document.getElementById('progClear');

  let selRoot='C',selType='major',currentMode='query',reverseFrets=[null,null,null,null,null,null];
  let allVoicings=[],voicingIdx=0,showScale=false,selScale='major';
  let favs=loadFavs(),progressions=loadProgs();
  let progPlaying=false,progTimer=null,progIdx=0,progBpmValI=80;
  let currentLayout={scale:1,leftMargin:38,topMargin:46,stringSpacing:44,fretHeight:42,padding:8,w:340,h:0};
  let isStrumming=false,strumTouched=new Set(),strumLast=0;

  function getCanvasDims(){
    const cw=scrollContainer?scrollContainer.clientWidth-4:340,scale=Math.min(1,cw/340);
    const lm=Math.round(38*scale),tm=Math.round(46*scale),ss=Math.round(44*scale),fh=Math.round(42*scale),pd=Math.round(8*scale);
    return{scale,leftMargin:lm,topMargin:tm,stringSpacing:ss,fretHeight:fh,padding:pd,w:cw,h:tm+NUM_FRETS*fh+20};
  }

  function initCanvas(){
    currentLayout=getCanvasDims();
    canvas.width=currentLayout.w;canvas.height=currentLayout.h;
    canvas.style.width=currentLayout.w+'px';canvas.style.height=currentLayout.h+'px';
  }
  initCanvas();
  if(window.ResizeObserver&&scrollContainer){new ResizeObserver(()=>{const nl=getCanvasDims();if(Math.abs(nl.w-currentLayout.w)>2){initCanvas();doRender();}}).observe(scrollContainer);}

  // ---- 模式切换（统一管理 UI 元素显示/隐藏）----
  function setMode(mode){
    currentMode=mode;
    // 非音阶模式恢复13品标准布局
    if(mode!=='scale')initCanvas();
    modeTabs.querySelectorAll('.chord-mode-tab').forEach(t=>t.classList.toggle('active',t.dataset.mode===mode));
    // 更新底部提示
    if(mode==='scale')strumHint.textContent='13品完整音阶指型 · 轻点音阶音试听';
    else strumHint.textContent='↕ 滑动指板浏览更多品位 · 水平拖拽扫弦';
    if(mode==='query'){
      chordSelector.style.display='';reverseHint.style.display='none';
      voicingNav.style.display='';favBtn.style.display='';favList.style.display='';
      scaleTypeRow.style.display='none';showScale=false;
      reverseFrets=Array(6).fill(null);voicingIdx=0;
      doRender();
    }else if(mode==='reverse'){
      chordSelector.style.display='none';reverseHint.style.display='';
      voicingNav.style.display='none';favBtn.style.display='none';favList.style.display='none';
      scaleTypeRow.style.display='none';showScale=false;
      reverseFrets=Array(6).fill(null);resetReverse();
      drawFretboard(reverseFrets,{name:'点击指板'});
    }else if(mode==='scale'){
      chordSelector.style.display='none';reverseHint.style.display='none';
      voicingNav.style.display='none';favBtn.style.display='none';favList.style.display='none';
      scaleTypeRow.style.display='';showScale=true;
      reverseFrets=Array(6).fill(null);
      doRender();
    }
  }
  modeTabs.addEventListener('click',e=>{
    const tab=e.target.closest('.chord-mode-tab');if(!tab)return;
    setMode(tab.dataset.mode);
  });

  // ---- 根音选择 ----
  rootNotesEl.addEventListener('click',e=>{
    const btn=e.target.closest('.note-btn');if(!btn)return;
    rootNotesEl.querySelectorAll('.note-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    selRoot=btn.dataset.note;if(currentMode==='query'){voicingIdx=0;doRender();}else if(currentMode==='scale')doRender();
  });

  // ---- 和弦类型选择 ----
  chordTypesEl.addEventListener('click',e=>{
    const btn=e.target.closest('.type-btn');if(!btn)return;
    chordTypesEl.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    selType=btn.dataset.type;if(currentMode==='query'){voicingIdx=0;doRender();}
  });

  // ---- 音阶类型选择 ----
  scaleTypeBtns.addEventListener('click',e=>{
    const btn=e.target.closest('.scale-type-btn');if(!btn)return;
    scaleTypeBtns.querySelectorAll('.scale-type-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    selScale=btn.dataset.scale;if(currentMode==='scale')doRender();
  });

  // ---- 指型导航 ----
  voicingPrev.addEventListener('click',()=>{if(voicingIdx>0){voicingIdx--;renderVoicing();}});
  voicingNext.addEventListener('click',()=>{if(voicingIdx<allVoicings.length-1){voicingIdx++;renderVoicing();}});
  canvas.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY))e.preventDefault();},{passive:false});

  // ---- 收藏 ----
  favBtn.addEventListener('click',()=>{toggleFav();});
  function toggleFav(){
    const idx=favs.findIndex(f=>f.root===selRoot&&f.type===selType);
    if(idx>=0)favs.splice(idx,1);else favs.unshift({root:selRoot,type:selType,name:selRoot+(CHORD_DEFS[selType].sn||'')});
    if(favs.length>20)favs.pop();saveFavs(favs);updateFavBtn();renderFavs();
  }
  function updateFavBtn(){
    const isFav=favs.some(f=>f.root===selRoot&&f.type===selType);
    favBtn.innerHTML=isFav?'<svg width="16" height="16" viewBox="0 0 24 24" fill="#ff375f"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
  }
  favList.addEventListener('click',e=>{
    const btn=e.target.closest('.fav-chip');if(!btn)return;
    selRoot=btn.dataset.root;selType=btn.dataset.type;voicingIdx=0;
    rootNotesEl.querySelectorAll('.note-btn').forEach(b=>b.classList.toggle('active',b.dataset.note===selRoot));
    chordTypesEl.querySelectorAll('.type-btn').forEach(b=>b.classList.toggle('active',b.dataset.type===selType));
    if(currentMode!=='query')setMode('query');
    else doRender();
  });
  function renderFavs(){
    if(favs.length===0){favList.innerHTML='<span class="fav-empty">暂无收藏，点击 ♡ 添加</span>';return;}
    favList.innerHTML=favs.map((f,i)=>`<button class="fav-chip" data-root="${f.root}" data-type="${f.type}">${f.name}<span class="fav-remove" data-idx="${i}">&times;</span></button>`).join('');
    favList.querySelectorAll('.fav-remove').forEach(rm=>rm.addEventListener('click',e=>{e.stopPropagation();const idx=parseInt(rm.dataset.idx);favs.splice(idx,1);saveFavs(favs);renderFavs();updateFavBtn();}));
  }

  // ---- 和弦进行播放器 ----
  progToggle.addEventListener('click',()=>{progPanel.classList.toggle('collapsed');});
  progAdd.addEventListener('click',()=>{
    if(currentMode!=='query')return;const name=selRoot+(CHORD_DEFS[selType].sn||'');
    progressions.push({root:selRoot,type:selType,name});if(progressions.length>20)progressions.shift();
    saveProgs(progressions);renderProgs();
  });
  progClear.addEventListener('click',()=>{progressions=[];saveProgs(progressions);renderProgs();stopProg();});
  progPlay.addEventListener('click',()=>{progPlaying?stopProg():startProg();});
  progBpm.addEventListener('input',()=>{progBpmValI=parseInt(progBpm.value);progBpmVal.textContent=progBpmValI;});
  
  function renderProgs(){
    if(progressions.length===0){progList.innerHTML='<span class="prog-empty">点击和弦下方的 +加入进行 来构建和弦进行</span>';return;}
    progList.innerHTML=progressions.map((p,i)=>`<div class="prog-chip${progPlaying&&progIdx===i?' active':''}"><span>${p.name}</span><button class="prog-remove" data-idx="${i}">&times;</button></div>`).join('');
    progList.querySelectorAll('.prog-remove').forEach(rm=>rm.addEventListener('click',e=>{e.stopPropagation();const idx=parseInt(rm.dataset.idx);progressions.splice(idx,1);saveProgs(progressions);renderProgs();if(progPlaying)stopProg();}));
  }
  function startProg(){if(progressions.length===0)return;progPlaying=true;progIdx=0;progPlay.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>';progPlay.classList.add('running');playProgChord(0);}
  function stopProg(){progPlaying=false;if(progTimer)clearTimeout(progTimer);progTimer=null;progPlay.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>';progPlay.classList.remove('running');progIdx=0;renderProgs();}
  function playProgChord(idx){
    if(!progPlaying||idx>=progressions.length){stopProg();return;}
    progIdx=idx;
    const p=progressions[idx];const cached=VoicingCache[p.root+'|'+p.type];const entry=cached?cached[0]:null;const shape=entry?entry.frets:null;
    if(shape){
      const notes=getChordNotes(p.root,p.type);
      notes.forEach((n,i)=>{setTimeout(()=>{AudioEngine.playTone(OPEN_FREQS[0]*Math.pow(2,(NOTE_SEMITONE[n]+12)/12),0.5,'triangle',0.15);},i*100);});
      shape.forEach((f,si)=>{if(typeof f==='number'&&f>=0)setTimeout(()=>{AudioEngine.playFretSound(si,f);},si*60);});
    }
    renderProgs();
    const interval=60000/progBpmValI*4; // 4 beats per chord
    progTimer=setTimeout(()=>playProgChord(idx+1),interval);
  }

  // ---- 坐标转换 ----
  function canvasCoords(e){
    const rect=canvas.getBoundingClientRect();
    const sx=canvas.width/(rect.width||1),sy=canvas.height/(rect.height||1);
    let cx,cy;
    if(e.touches&&e.touches.length>0){cx=e.touches[0].clientX;cy=e.touches[0].clientY;}
    else if(e.changedTouches&&e.changedTouches.length>0){cx=e.changedTouches[0].clientX;cy=e.changedTouches[0].clientY;}
    else{cx=e.clientX;cy=e.clientY;}
    return{x:(cx-rect.left)*sx,y:(cy-rect.top)*sy};
  }
  function getStringAndFret(cx,cy){
    const{leftMargin,topMargin,stringSpacing,fretHeight,scale}=currentLayout;let cs=-1,cf=-1;
    for(let s=0;s<NUM_STRINGS;s++){const x=leftMargin+s*stringSpacing;if(Math.abs(cx-x)<stringSpacing*0.48){cs=s;break;}}
    if(cs>=0){const muteZ=topMargin-Math.round(38*scale),openZ=topMargin-Math.round(22*scale);
      if(cy>=muteZ&&cy<openZ)cf='x';else if(cy>=openZ&&cy<topMargin)cf=0;else if(cy>=topMargin&&cy<topMargin+NUM_FRETS*fretHeight){cf=Math.floor((cy-topMargin)/fretHeight)+1;if(cf>NUM_FRETS)cf=NUM_FRETS;}}
    return{clickedString:cs,clickedFret:cf};
  }
  function getCurrentShape(){if(currentMode==='query'){const e=allVoicings[voicingIdx];return e?e.frets:[];}return reverseFrets;}

  // ---- 扫弦播放 ----
  function playStrum(stringIndices,direction){
    const ordered=[...stringIndices].sort((a,b)=>direction==='down'?a-b:b-a);
    const shape=getCurrentShape(),now=AudioEngine.ctx.currentTime;
    ordered.forEach((si,i)=>{
      const fret=shape&&shape[si]!==undefined?shape[si]:null;let freq;
      if(typeof fret==='number')freq=AudioEngine.getFretFreq(si,fret);
      else if(fret===null||fret===undefined)freq=OPEN_FREQS[si];
      else return;
      const st=now+i*0.04,ctx=AudioEngine.ctx,o=ctx.createOscillator(),g=ctx.createGain();
      o.type='triangle';o.frequency.value=freq;const vol=0.2*(1-i*0.06);
      g.gain.setValueAtTime(vol,st);g.gain.exponentialRampToValueAtTime(0.001,st+0.6);
      o.connect(g);g.connect(ctx.destination);o.start(st);o.stop(st+0.6);
    });
  }

  // ---- 指板触摸/点击事件（touch事件 + pointer兜底）----
  let ptrStartTime=0,ptrStartX=0,ptrStartY=0,ptrMoved=false,ptrHorizontal=false;
  let lastTapTime=0,lastTapString=-1,lastTapFret=-1;
  let touchActive=false; // 标记当前是否有活跃的触摸

  function handleReverseTap(cs,cf){
    if(typeof cf!=='number'||cf<0)return;
    const cur=reverseFrets[cs];
    if(cur===null||cur===undefined)reverseFrets[cs]=cf;
    else if(cur===cf)reverseFrets[cs]=0;
    else if(cur===0)reverseFrets[cs]='x';
    else if(cur==='x')reverseFrets[cs]=null;
    else reverseFrets[cs]=cf;
    if(typeof reverseFrets[cs]==='number'&&reverseFrets[cs]>=0)AudioEngine.playFretSound(cs,reverseFrets[cs]);
    renderReverseChord();
  }

  function handleFretTap(cx,cy){
    const{clickedString:cs,clickedFret:cf}=getStringAndFret(cx,cy);
    if(cs<0)return;
    lastTapTime=Date.now();lastTapString=cs;lastTapFret=cf;
    if(currentMode==='reverse')handleReverseTap(cs,cf);
    else if(typeof cf==='number'&&cf>=0)AudioEngine.playFretSound(cs,cf);
  }

  // --- 触摸事件（移动端） ---
  canvas.addEventListener('touchstart',e=>{
    if(e.touches.length!==1)return;
    const t=e.touches[0],c=canvasCoords(t);
    ptrStartX=c.x;ptrStartY=c.y;ptrStartTime=Date.now();ptrMoved=false;ptrHorizontal=false;
    touchActive=true;isStrumming=true;strumTouched.clear();strumLast=0;
    strumHint.classList.add('active');
  },{passive:true});

  canvas.addEventListener('touchmove',e=>{
    if(!isStrumming||!touchActive||e.touches.length!==1)return;
    const t=e.touches[0],c=canvasCoords(t);
    const dx=Math.abs(c.x-ptrStartX),dy=Math.abs(c.y-ptrStartY);
    if(dx+dy>16)ptrMoved=true;
    if(dx>18&&dx>dy*1.6){ptrHorizontal=true;
      e.preventDefault();
      const{clickedString}=getStringAndFret(c.x,c.y);
      if(clickedString>=0&&!strumTouched.has(clickedString)){
        const n=Date.now();if(n-strumLast>40||strumTouched.size===0){strumTouched.add(clickedString);strumLast=n;}
      }
    }
  },{passive:false});

  canvas.addEventListener('touchend',e=>{
    if(!isStrumming||!touchActive)return;
    isStrumming=false;touchActive=false;strumHint.classList.remove('active');
    const dur=Date.now()-ptrStartTime;
    const ct=(e.changedTouches&&e.changedTouches.length>0)?e.changedTouches[0]:null;
    const c=ct?canvasCoords(ct):{x:ptrStartX,y:ptrStartY};
    if(strumTouched.size>=2&&ptrHorizontal){
      playStrum(Array.from(strumTouched),c.y-ptrStartY>0?'down':'up');
      return;
    }
    const totalDx=Math.abs(c.x-ptrStartX),totalDy=Math.abs(c.y-ptrStartY);
    if(totalDx+totalDy<36&&dur<450){
      handleFretTap(c.x,c.y);
    }
  });

  canvas.addEventListener('touchcancel',()=>{
    isStrumming=false;touchActive=false;strumHint.classList.remove('active');
    const dur=Date.now()-ptrStartTime;
    if(dur<450){handleFretTap(ptrStartX,ptrStartY);}
  });

  // --- Pointer事件（桌面端鼠标） ---
  canvas.addEventListener('pointerdown',e=>{
    if(touchActive)return;
    if(e.pointerType==='touch')return;
    const c=canvasCoords(e);ptrStartX=c.x;ptrStartY=c.y;ptrStartTime=Date.now();ptrMoved=false;ptrHorizontal=false;
    isStrumming=true;strumTouched.clear();strumLast=0;strumHint.classList.add('active');
  });

  canvas.addEventListener('pointermove',e=>{
    if(touchActive||e.pointerType==='touch')return;
    if(!isStrumming)return;
    const c=canvasCoords(e),dx=Math.abs(c.x-ptrStartX),dy=Math.abs(c.y-ptrStartY);
    if(dx+dy>6)ptrMoved=true;
    if(dx>14&&dx>dy*1.8){ptrHorizontal=true;
      const{clickedString}=getStringAndFret(c.x,c.y);
      if(clickedString>=0&&!strumTouched.has(clickedString)){
        const n=Date.now();if(n-strumLast>40||strumTouched.size===0){strumTouched.add(clickedString);strumLast=n;}
      }
    }
  });

  canvas.addEventListener('pointerup',e=>{
    if(touchActive||e.pointerType==='touch')return;
    if(!isStrumming)return;isStrumming=false;strumHint.classList.remove('active');
    const c=canvasCoords(e);
    const dur=Date.now()-ptrStartTime,totalDx=Math.abs(c.x-ptrStartX),totalDy=Math.abs(c.y-ptrStartY);
    const isTap=!ptrMoved||(totalDx+totalDy)<10;
    if(strumTouched.size>=2&&ptrHorizontal){
      playStrum(Array.from(strumTouched),c.y-ptrStartY>0?'down':'up');
      return;
    }
    if(isTap&&dur<400)handleFretTap(c.x,c.y);
  });

  // 兜底：直接 click 事件处理
  canvas.addEventListener('click',e=>{
    if(touchActive)return;
    if(e.pointerType==='touch'||e.detail===0)return;
    const dur=Date.now()-lastTapTime;
    if(dur<500&&lastTapString>=0)return;
    const c=canvasCoords(e);
    console.log('canvasCoords:',c,{csAndFret:getStringAndFret(c.x,c.y)});
    handleFretTap(c.x,c.y);
  });

  canvas.addEventListener('contextmenu',e=>e.preventDefault());

  function resetReverse(){reverseFrets=Array(6).fill(null);
    chordNameEl.innerHTML='<span style="color:var(--text-tertiary)">点击指板</span>';
    notesEl.textContent='点击品位标记按弦 · 水平拖拽扫弦';intervalsEl.textContent='点击指板自动识别和弦';
    tagsEl.innerHTML='';updateFavBtn();
  }

  // ---- 渲染 ----
  function doRender(){
    // 非音阶模式恢复13品标准布局
    if(currentMode!=='scale')initCanvas();
    if(currentMode==='query')renderChord();
    else if(currentMode==='scale')renderScale();
  }

  function renderChord(){
    allVoicings=computeVoicings(selRoot,selType);
    if(voicingIdx>=allVoicings.length)voicingIdx=0;
    renderVoicing();
  }

  function renderVoicing(){
    const cd=CHORD_DEFS[selType],entry=allVoicings[voicingIdx];
    if(!entry){return;}
    const shape=entry.frets,sn=cd.sn||'',displayShort=sn?selRoot+sn:selRoot;
    chordNameEl.innerHTML=`${displayShort} <span class="chord-type-badge">${cd.name}</span>`;
    const notes=getNotesFromIntervals(selRoot,cd.st);
    notesEl.textContent=notes.join(' · ');intervalsEl.textContent=cd.intervals;
    tagsEl.innerHTML=notes.map((n,i)=>`<span class="chord-note-tag ${TAG_CLASSES[i]||'fifth'}">${n}</span>`).join('');
    updateFavBtn();
    // 指型导航
    voicingLabel.textContent=`${voicingIdx+1}/${allVoicings.length} · ${entry.name}`;
    voicingPrev.disabled=voicingIdx===0;voicingNext.disabled=voicingIdx===allVoicings.length-1;
    voicingDots.innerHTML=allVoicings.map((v,i)=>`<span class="voicing-dot${i===voicingIdx?' active':''}" title="${v.name}"></span>`).join('');
    voicingDots.querySelectorAll('.voicing-dot').forEach((d,i)=>d.addEventListener('click',()=>{voicingIdx=i;renderVoicing();}));
    drawFretboard(shape,{name:cd.name,root:selRoot,shapeName:entry.name});
    // 更新进行面板的当前和弦名
    if(progAdd)progAdd.title='加入进行: '+displayShort;
  }

  function renderScale(){
    const scale=SCALES[selScale];const rootST=NOTE_SEMITONE[selRoot];
    const scaleNotes=scale.notes.map(s=>NOTE_NAMES[(rootST+s)%12]);
    const scaleNoteSet=new Set(scaleNotes);
    const displayName=selRoot+' '+scale.name;
    chordNameEl.innerHTML=`<span style="color:var(--teal)">${displayName}</span>`;
    notesEl.textContent=scaleNotes.join(' · ');intervalsEl.textContent='全部13品指型 · 轻点试听';
    tagsEl.innerHTML='';
    // 音阶模式：显示全部13品，无需滚动
    const cw=scrollContainer?scrollContainer.clientWidth-4:340;const sc=Math.min(1,cw/340);
    const lm=Math.round(38*sc),tm=Math.round(46*sc),ss=Math.round(44*sc),fh=Math.round(38*sc),pd=Math.round(8*sc);
    currentLayout={scale:sc,leftMargin:lm,topMargin:tm,stringSpacing:ss,fretHeight:fh,padding:pd,w:cw,h:tm+SCALE_FRETS*fh+20};
    canvas.width=currentLayout.w;canvas.height=currentLayout.h;
    canvas.style.width=currentLayout.w+'px';canvas.style.height=currentLayout.h+'px';
    drawScaleOnFretboard(scaleNotes,scaleNoteSet,rootST,selRoot);
  }

  function renderReverseChord(){
    const noteSet=new Set();let hasNotes=false;
    reverseFrets.forEach((f,idx)=>{if(typeof f==='number'){const on=NOTE_SEMITONE[OPEN_NOTES[idx]];noteSet.add((on+f)%12);hasNotes=true;}});
    if(!hasNotes||noteSet.size===0){resetReverse();drawFretboard(reverseFrets,{name:'点击指板'});return;}
    const noteNums=Array.from(noteSet);const matches=matchChordFromNotes(noteSet);
    let rootNote=null;if(matches.length>0)rootNote=NOTE_SEMITONE[matches[0].root];else{const sn=noteNums.sort((a,b)=>a-b);rootNote=sn[0];}
    const sorted=noteNums.sort((a,b)=>{const da=(a-rootNote+12)%12,db=(b-rootNote+12)%12;return da-db;});
    const nNames=sorted.map(n=>NOTE_NAMES[n]);notesEl.textContent=nNames.join(' · ');
    if(matches.length>0){const b=matches[0];chordNameEl.innerHTML=`${b.root+(b.sn||'')} <span class="chord-type-badge">${b.name}</span>`;intervalsEl.textContent=getIntervalsFromRoot(rootNote,sorted);if(matches.length>1){intervalsEl.textContent+=' · 备选: '+matches.slice(1,4).map(m=>m.root+(m.sn||'')).join(' / ');}}
    else{chordNameEl.innerHTML=`<span style="color:var(--text-tertiary)">${nNames.join(' · ')}</span>`;intervalsEl.textContent=getIntervalsFromRoot(rootNote,sorted)||'未匹配到已知和弦';}
    tagsEl.innerHTML=nNames.map((n,i)=>`<span class="chord-note-tag ${TAG_CLASSES[i]||'fifth'}">${n}</span>`).join('');
    drawFretboard(reverseFrets,{name:matches[0]?matches[0].name:''});
  }

  function matchChordFromNotes(noteSet){
    const arr=Array.from(noteSet).sort((a,b)=>a-b);const best=[];
    for(const[tk,cd]of Object.entries(CHORD_DEFS)){for(let ro=0;ro<12;ro++){const expected=new Set(cd.st.map(s=>(ro+s)%12));const inter=arr.filter(n=>expected.has(n));if(inter.length===expected.size&&inter.length===arr.length){best.push({type:tk,root:NOTE_NAMES[ro],name:cd.name,sn:cd.sn,intervals:cd.intervals,score:inter.length});}}}
    best.sort((a,b)=>b.score-a.score);return best;
  }

  // ---- 指板绘制 ----
  function drawFretboard(shape,info){
    const ctx=canvas.getContext('2d');const{leftMargin:lm,topMargin:tm,stringSpacing:ss,fretHeight:fh,scale,w,h}=currentLayout;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='rgba(255,255,255,0.02)';roundRect(ctx,2,2,w-4,h-4,Math.round(10*scale),true);
    // 品位标记点
    [3,5,7,9,12].forEach(fn=>{const y=tm+(fn-0.5)*fh,dr=Math.max(2,Math.round(3*scale));
      if(fn===12){[lm+1.5*ss,lm+3.5*ss].forEach(xx=>{ctx.beginPath();ctx.arc(xx,y,dr,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fill();});}
      else{ctx.beginPath();ctx.arc(lm+2.5*ss,y,dr,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fill();}});
    // 品丝
    for(let f=0;f<=NUM_FRETS;f++){const y=tm+f*fh;ctx.beginPath();ctx.moveTo(lm-6,y);ctx.lineTo(lm+(NUM_STRINGS-1)*ss+6,y);
      if(f===0){ctx.strokeStyle='rgba(255,255,255,0.45)';ctx.lineWidth=Math.max(1.5,2.2*scale);}
      else{ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=Math.max(0.6,1*scale);}ctx.stroke();}
    // 品位数字
    ctx.fillStyle='rgba(255,255,255,0.18)';const ffs=Math.max(8,Math.round(10*scale));ctx.font=`500 ${ffs}px -apple-system,sans-serif`;ctx.textAlign='right';
    for(let f=1;f<=NUM_FRETS;f++)ctx.fillText(f,lm-Math.round(10*scale),tm+(f-0.5)*fh+Math.round(3*scale));
    // 弦线
    for(let s=0;s<NUM_STRINGS;s++){const x=lm+s*ss;ctx.beginPath();ctx.moveTo(x,tm);ctx.lineTo(x,tm+NUM_FRETS*fh);ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=Math.max(0.8,(1.2-s*0.12)*scale);ctx.stroke();}
    // 按弦标记
    const ds=Math.max(8,Math.round(10*scale));
    (shape||[]).forEach((fret,idx)=>{
      if(fret==='x'||fret===null||fret===undefined)return;const x=lm+idx*ss;
      if(fret===0){const rr=Math.max(5,Math.round(7*scale));ctx.beginPath();ctx.arc(x,tm-Math.round(18*scale),rr,0,Math.PI*2);ctx.fillStyle='transparent';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.lineWidth=Math.max(1.2,1.8*scale);ctx.stroke();}
      else{if(fret<1||fret>NUM_FRETS)return;const y=tm+(fret-0.5)*fh;ctx.beginPath();ctx.arc(x,y+1,ds,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fill();
        const g=ctx.createRadialGradient(x-2,y-2,ds*0.15,x,y,ds);g.addColorStop(0,'#5e9eff');g.addColorStop(0.7,'#0a84ff');g.addColorStop(1,'#0060d0');
        ctx.beginPath();ctx.arc(x,y,ds-0.5,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
        ctx.fillStyle='#fff';ctx.font=`600 ${Math.max(7,Math.round(9*scale))}px -apple-system,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(fret,x,y+0.5);}
    });
    // 静音标记
    (shape||[]).forEach((fret,idx)=>{if(fret!=='x')return;const x=lm+idx*ss,cy2=tm-Math.round(18*scale),cs=Math.max(3,Math.round(4.5*scale));ctx.strokeStyle='rgba(255,69,58,0.7)';ctx.lineWidth=Math.max(1.2,1.8*scale);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-cs,cy2-cs);ctx.lineTo(x+cs,cy2+cs);ctx.moveTo(x+cs,cy2-cs);ctx.lineTo(x-cs,cy2+cs);ctx.stroke();});
    // 弦号
    ctx.fillStyle='rgba(255,255,255,0.25)';ctx.font=`500 ${Math.max(8,Math.round(10*scale))}px -apple-system,sans-serif`;ctx.textAlign='center';
    for(let s=0;s<NUM_STRINGS;s++)ctx.fillText(6-s,lm+s*ss,tm-Math.round(24*scale));
    ctx.fillStyle='rgba(255,255,255,0.2)';ctx.font=`500 ${Math.max(7,Math.round(9*scale))}px -apple-system,sans-serif`;
    for(let s=0;s<NUM_STRINGS;s++)ctx.fillText(OPEN_NOTES[s],lm+s*ss,tm-Math.round(32*scale));
    // 指型名称标签
    if(info.shapeName){
      ctx.fillStyle='rgba(100,210,255,0.7)';ctx.font=`600 ${Math.max(8,Math.round(10*scale))}px -apple-system,sans-serif`;
      ctx.textAlign='right';ctx.fillText(info.shapeName,w-Math.round(8*scale),Math.round(14*scale));
    }
  }

  function drawScaleOnFretboard(scaleNotes,noteSet,rootST,rootName){
    const ctx=canvas.getContext('2d');const{leftMargin:lm,topMargin:tm,stringSpacing:ss,fretHeight:fh,scale,w,h}=currentLayout;
    const nf=SCALE_FRETS; // 全部13品
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='rgba(255,255,255,0.02)';roundRect(ctx,2,2,w-4,h-4,Math.round(10*scale),true);
    // 品位标记点（3,5,7,9,12品）
    [3,5,7,9,12].forEach(fn=>{const y=tm+(fn-0.5)*fh,dr=Math.max(2,Math.round(3*scale));
      if(fn===12){[lm+1.5*ss,lm+3.5*ss].forEach(xx=>{ctx.beginPath();ctx.arc(xx,y,dr,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fill();});}
      else{ctx.beginPath();ctx.arc(lm+2.5*ss,y,dr,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fill();}});
    // 品丝
    for(let f=0;f<=nf;f++){const y=tm+f*fh;ctx.beginPath();ctx.moveTo(lm-6,y);ctx.lineTo(lm+(NUM_STRINGS-1)*ss+6,y);
      ctx.strokeStyle=f===0?'rgba(255,255,255,0.45)':'rgba(255,255,255,0.1)';ctx.lineWidth=f===0?Math.max(1.5,2.2*scale):Math.max(0.6,1*scale);ctx.stroke();}
    // 品位数字
    ctx.fillStyle='rgba(255,255,255,0.18)';const ffs=Math.max(8,Math.round(9*scale));ctx.font=`500 ${ffs}px -apple-system,sans-serif`;ctx.textAlign='right';
    for(let f=1;f<=nf;f++)ctx.fillText(f,lm-Math.round(10*scale),tm+(f-0.5)*fh+Math.round(3*scale));
    // 弦线
    for(let s=0;s<NUM_STRINGS;s++){const x=lm+s*ss;ctx.beginPath();ctx.moveTo(x,tm);ctx.lineTo(x,tm+nf*fh);ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=Math.max(0.8,(1.2-s*0.12)*scale);ctx.stroke();}
    // 绘制音阶标记（带音名）
    const ds=Math.max(8,Math.round(9*scale)),lblSize=Math.max(7,Math.round(8*scale));
    for(let s=0;s<NUM_STRINGS;s++){const os=STR_OPEN_MIDI[s]%12;
      for(let f=0;f<=nf;f++){const ns=(os+f)%12;const noteName=NOTE_NAMES[ns];if(!noteSet.has(noteName))continue;const x=lm+s*ss,y=f===0?tm-Math.round(18*scale):tm+(f-0.5)*fh;const isRoot=(ns===rootST);
        // 圆圈
        ctx.beginPath();ctx.arc(x,y,isRoot?ds+2:ds,0,Math.PI*2);
        const g=ctx.createRadialGradient(x-1,y-1,ds*0.1,x,y,ds);
        if(isRoot){g.addColorStop(0,'#ff6b6b');g.addColorStop(0.7,'#ff375f');g.addColorStop(1,'#d02a4a');}
        else{g.addColorStop(0,'#64d2ff');g.addColorStop(0.7,'#0a84ff');g.addColorStop(1,'#0060d0');}
        ctx.fillStyle=g;ctx.fill();
        if(f===0){ctx.strokeStyle='rgba(255,255,255,0.45)';ctx.lineWidth=1.5*scale;ctx.stroke();}
        // 音名文字
        ctx.fillStyle='#fff';ctx.font=`700 ${lblSize}px -apple-system,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(noteName,x,y+0.5);
    }}
    // 弦号和空弦名
    ctx.fillStyle='rgba(255,255,255,0.28)';ctx.font=`600 ${Math.max(9,Math.round(11*scale))}px -apple-system,sans-serif`;ctx.textAlign='center';
    for(let s=0;s<NUM_STRINGS;s++)ctx.fillText(6-s+'弦',lm+s*ss,tm-Math.round(24*scale));
    ctx.fillStyle='rgba(255,255,255,0.22)';ctx.font=`500 ${Math.max(7,Math.round(9*scale))}px -apple-system,sans-serif`;
    for(let s=0;s<NUM_STRINGS;s++)ctx.fillText(OPEN_NOTES[s],lm+s*ss,tm-Math.round(33*scale));
    // 图例
    const lx=w-90,ly=h-12;
    ctx.fillStyle='#ff375f';ctx.beginPath();ctx.arc(lx,ly,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.45)';ctx.font='500 8px -apple-system,sans-serif';ctx.textAlign='left';ctx.fillText('根音',lx+7,ly+3);
    ctx.fillStyle='#0a84ff';ctx.beginPath();ctx.arc(lx+34,ly,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.45)';ctx.fillText('音阶音',lx+41,ly+3);
    // 指型名称
    ctx.fillStyle='rgba(100,210,255,0.6)';ctx.font=`600 ${Math.max(9,Math.round(11*scale))}px -apple-system,sans-serif`;
    ctx.textAlign='right';ctx.fillText(rootName+' '+getScaleName(),w-Math.round(8*scale),Math.round(16*scale));
  }
  function getScaleName(){return SCALES[selScale]?SCALES[selScale].name:'';}

  function roundRect(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();if(fill)ctx.fill();}

  // ---- 初始化 ----
  renderFavs();renderProgs();updateFavBtn();renderChord();
}

// ==================== 调音器 ====================
function initTuner(){
  const micBtn=document.getElementById('micBtn'),detectedFreq=document.getElementById('detectedFreq'),detectedNote=document.getElementById('detectedNote');
  const headstockBody=document.getElementById('headstockBody'),leftCol=document.getElementById('headstockLeft'),rightCol=document.getElementById('headstockRight');
  const tunerDesc=document.getElementById('tunerDesc'),instrumentSelector=document.getElementById('instrumentSelector');

  const INSTRUMENTS={
    guitar:{name:'吉他',desc:'标准调弦 · E₂ A₂ D₃ G₃ B₃ E₄',strings:[{num:6,note:'E',octave:2,freq:82.41},{num:5,note:'A',octave:2,freq:110.00},{num:4,note:'D',octave:3,freq:146.83},{num:3,note:'G',octave:3,freq:196.00},{num:2,note:'B',octave:3,freq:246.94},{num:1,note:'E',octave:4,freq:329.63}]},
    ukulele:{name:'尤克里里',desc:'标准调弦 · G₄ C₄ E₄ A₄',strings:[{num:4,note:'G',octave:4,freq:392.00},{num:3,note:'C',octave:4,freq:261.63},{num:2,note:'E',octave:4,freq:329.63},{num:1,note:'A',octave:4,freq:440.00}]},
    bass:{name:'贝斯',desc:'标准调弦 · E₁ A₁ D₂ G₂',strings:[{num:4,note:'E',octave:1,freq:41.21},{num:3,note:'A',octave:1,freq:55.00},{num:2,note:'D',octave:2,freq:73.42},{num:1,note:'G',octave:2,freq:98.00}]}
  };

  let audioCtx=null,analyser=null,micStream=null,isListening=false,animId=null,activePlayBtn=null,currentInst='guitar';
  function renderHeadstock(ik){const inst=INSTRUMENTS[ik];currentInst=ik;tunerDesc.textContent=inst.desc;leftCol.innerHTML='';rightCol.innerHTML='';const half=Math.ceil(inst.strings.length/2),ls=inst.strings.slice(0,half).reverse(),rs=inst.strings.slice(half);
    function rsHTML(s,side){const pc=side==='left'?'peg-left':'peg-right',id=side==='left'?'row-reverse':'row';
      return`<div class="headstock-string" data-string="${s.num}" data-freq="${s.freq}"><button class="tuning-peg peg-${s.num} ${pc}" data-string="${s.num}" data-freq="${s.freq}" title="第${s.num}弦 · ${s.note} · 点击试听参考音" aria-label="第${s.num}弦 ${s.note} 参考音"></button><div class="string-info" style="flex-direction:${id}"><span class="string-number">${'①②③④⑤⑥'.charAt(s.num-1)}</span><span class="string-note-display">${s.note}<sub>${s.octave}</sub></span><span class="string-freq">${s.freq.toFixed(2)} Hz</span></div><div class="tuner-meter-horizontal"><div class="tuner-bar-track"><div class="tuner-fill" id="tunerFill${s.num}"></div></div><div class="tuner-labels"><span>♭</span><span class="center-label">·</span><span>♯</span></div></div><button class="string-play-btn" data-string="${s.num}" data-freq="${s.freq}" title="试听 ${s.note} 参考音"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg><span class="play-label">试听</span></button></div>`;}
    ls.forEach(s=>{leftCol.innerHTML+=rsHTML(s,'left');});rs.forEach(s=>{rightCol.innerHTML+=rsHTML(s,'right');});
  }
  renderHeadstock('guitar');

  instrumentSelector.addEventListener('click',e=>{const btn=e.target.closest('.instrument-btn');if(!btn)return;const ik=btn.dataset.instrument;if(ik===currentInst)return;instrumentSelector.querySelectorAll('.instrument-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');stopListening();resetFills();renderHeadstock(ik);});
  headstockBody.addEventListener('click',e=>{const row=e.target.closest('.headstock-string');if(!row)return;const freq=parseFloat(row.dataset.freq),sn=row.dataset.string;if(activePlayBtn)activePlayBtn.classList.remove('playing');const pb=row.querySelector('.string-play-btn');if(pb){pb.classList.add('playing');activePlayBtn=pb;setTimeout(()=>{pb.classList.remove('playing');if(activePlayBtn===pb)activePlayBtn=null;},2200);}AudioEngine.playTone(freq,2.2,'sine',0.35);document.querySelectorAll('.headstock-string').forEach(el=>el.classList.remove('active'));row.classList.add('active');setTimeout(()=>row.classList.remove('active'),2400);});
  micBtn.addEventListener('click',async()=>{isListening?stopListening():await startListening();});

  async function startListening(){try{micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});audioCtx=new(window.AudioContext||window.webkitAudioContext)();analyser=audioCtx.createAnalyser();analyser.fftSize=4096;analyser.smoothingTimeConstant=0.5;analyser.minDecibels=-90;analyser.maxDecibels=-10;audioCtx.createMediaStreamSource(micStream).connect(analyser);isListening=true;micBtn.classList.add('listening');micBtn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>停止调音';detectPitch();}catch(_){alert('无法访问麦克风，请检查浏览器权限。');}}
  function stopListening(){if(micStream){micStream.getTracks().forEach(t=>t.stop());micStream=null;}if(audioCtx){audioCtx.close();audioCtx=null;}if(animId){cancelAnimationFrame(animId);animId=null;}isListening=false;micBtn.classList.remove('listening');micBtn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>开始调音';detectedFreq.textContent='-- Hz';detectedNote.textContent='轻弹琴弦即可检测';detectedNote.style.color='';resetFills();}

  function autoCorrelate(buf,sr){const S=buf.length;let rms=0;for(let i=0;i<S;i++)rms+=buf[i]*buf[i];rms=Math.sqrt(rms/S);if(rms<0.005)return -1;let r1=0,r2=S-1;for(let i=0;i<S;i++){if(Math.abs(buf[i])<0.15){r1=i;break;}}for(let i=1;i<S;i++){if(Math.abs(buf[S-i])<0.15){r2=S-i;break;}}const t=buf.slice(r1,r2),c=new Array(t.length).fill(0);for(let i=0;i<c.length;i++)for(let j=0;j<c.length-i;j++)c[i]+=t[j]*t[j+i];let d=0;while(c[d]>c[d+1])d++;let mv=-1,mp=-1;for(let i=d;i<c.length;i++){if(c[i]>mv){mv=c[i];mp=i;}}let T0=mp;const x1=c[T0-1],x2=c[T0],x3=c[T0+1],a=(x1+x3-2*x2)/2,b=(x3-x1)/2;if(a&&a!==0)T0-=b/(2*a);return sr/T0;}
  function detectPitch(){if(!isListening||!analyser)return;const bl=analyser.fftSize,bf=new Float32Array(bl);analyser.getFloatTimeDomainData(bf);const freq=autoCorrelate(bf,audioCtx.sampleRate);
    if(freq>30&&freq<500){detectedFreq.textContent=freq.toFixed(1)+' Hz';
      // 八度感知弦匹配：在各目标弦的 ±1 八度范围内找最佳匹配
      const inst=INSTRUMENTS[currentInst];let bestStr=-1,bestCents=Infinity,bestNote='';
      for(const s of inst.strings){for(let oct=-1;oct<=1;oct++){const tf=s.freq*Math.pow(2,oct);if(tf<20||tf>600)continue;const cs=1200*Math.log2(freq/tf);if(Math.abs(cs)<Math.abs(bestCents)){bestCents=cs;bestStr=s.num;bestNote=s.note;}}}
      const cr=Math.round(bestCents),dir=cr>5?'偏高 ♯':cr<-5?'偏低 ♭':'准确 ✓';detectedNote.textContent=`${bestNote} · ${dir} · ${Math.abs(cr)}¢`;detectedNote.style.color=Math.abs(cr)<=5?'#30d158':'#ff9f0a';updFills(bestStr,cr);}
    else{detectedFreq.textContent='-- Hz';detectedNote.textContent='轻弹琴弦即可检测';detectedNote.style.color='';resetFills();}animId=requestAnimationFrame(detectPitch);}
  function updFills(sn,cts){resetFills();if(!sn||sn<0)return;const fill=document.getElementById('tunerFill'+sn);if(!fill)return;const cc=Math.max(-50,Math.min(50,cts)),pct=((cc+50)/100)*100;fill.style.width=pct+'%';
    if(Math.abs(cts)<=5)fill.className='tuner-fill in-tune';else if(cts>0)fill.className='tuner-fill sharp';else fill.className='tuner-fill flat';
    if(Math.abs(cts)<=5){const se=document.querySelector(`.headstock-string[data-string="${sn}"]`);if(se)se.classList.add('active');}}
  function resetFills(){const inst=INSTRUMENTS[currentInst];inst.strings.forEach(s=>{const f=document.getElementById('tunerFill'+s.num);if(f){f.style.width='50%';f.className='tuner-fill';}});document.querySelectorAll('.headstock-string').forEach(el=>el.classList.remove('active'));}
  window.addEventListener('beforeunload',()=>stopListening());
}

// ==================== 节拍器 ====================
function initMetronome(){
  const bpmVal=document.getElementById('bpmValue'),bpmSlider=document.getElementById('bpmSlider'),bpmD10=document.getElementById('bpmDecrease10'),bpmD1=document.getElementById('bpmDecrease1'),bpmI1=document.getElementById('bpmIncrease1'),bpmI10=document.getElementById('bpmIncrease10'),tapBtn=document.getElementById('tapBtn'),metroStart=document.getElementById('metronomeStart'),beatVis=document.getElementById('beatVisual'),soundSel=document.getElementById('soundSelect'),tsSel=document.getElementById('timeSignatureSelector');
  let bpm=120,running=false,beatIdx=0,bpmValB=4,beatDiv=4,timerId=null,tapTimes=[],audioCtx=null,nextBeat=0,schedTimer=null;
  function setBPM(v){bpm=Math.max(30,Math.min(250,v));bpmVal.textContent=bpm;bpmSlider.value=bpm;}
  bpmSlider.addEventListener('input',()=>setBPM(parseInt(bpmSlider.value)));
  bpmD10.addEventListener('click',()=>setBPM(bpm-10));bpmD1.addEventListener('click',()=>setBPM(bpm-1));
  bpmI1.addEventListener('click',()=>setBPM(bpm+1));bpmI10.addEventListener('click',()=>setBPM(bpm+10));
  document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;switch(e.code){case'Space':e.preventDefault();toggleMetro();break;case'ArrowUp':e.preventDefault();setBPM(bpm+1);break;case'ArrowDown':e.preventDefault();setBPM(bpm-1);break;case'ArrowRight':e.preventDefault();setBPM(bpm+10);break;case'ArrowLeft':e.preventDefault();setBPM(bpm-10);break;}});
  tapBtn.addEventListener('click',()=>{tapBtn.classList.add('tapping');setTimeout(()=>tapBtn.classList.remove('tapping'),120);const n=Date.now();tapTimes.push(n);if(tapTimes.length>5)tapTimes.shift();if(tapTimes.length>1&&n-tapTimes[tapTimes.length-2]>2000)tapTimes=[n];if(tapTimes.length>=2){let t=0;for(let i=1;i<tapTimes.length;i++)t+=tapTimes[i]-tapTimes[i-1];setBPM(Math.round(60000/(t/(tapTimes.length-1))));}});
  metroStart.addEventListener('click',toggleMetro);
  tsSel.addEventListener('click',e=>{const btn=e.target.closest('.ts-btn');if(!btn)return;tsSel.querySelectorAll('.ts-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');bpmValB=parseInt(btn.dataset.beats);beatDiv=parseInt(btn.dataset.division);rebuildDots();if(running){beatIdx=0;nextBeat=audioCtx.currentTime;}});
  function rebuildDots(){beatVis.innerHTML='';for(let i=0;i<bpmValB;i++){const d=document.createElement('div');d.className='beat-dot'+(i===0?' active accent':'');d.dataset.beat=i;beatVis.appendChild(d);}beatVis.style.gap=bpmValB>=6?'6px':'10px';}
  function toggleMetro(){running?stopMetro():startMetro();}
  function startMetro(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();running=true;beatIdx=0;nextBeat=audioCtx.currentTime;metroStart.classList.add('running');metroStart.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>停止';scheduler();}
  function stopMetro(){running=false;if(schedTimer){clearTimeout(schedTimer);schedTimer=null;}metroStart.classList.remove('running');metroStart.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>开始';resetBeat();}
  function scheduler(){if(!running)return;const iv=60/bpm;while(nextBeat<audioCtx.currentTime+0.1){AudioEngine.scheduleMetronomeBeat(audioCtx,nextBeat,beatIdx,soundSel.value,bpmValB);updBeat(beatIdx);nextBeat+=iv;beatIdx=(beatIdx+1)%bpmValB;}schedTimer=setTimeout(scheduler,25);}
  function updBeat(idx){beatVis.querySelectorAll('.beat-dot').forEach((d,i)=>{d.classList.remove('active','accent');if(i===idx){d.classList.add('active');if(i===0)d.classList.add('accent');}});}
  function resetBeat(){beatVis.querySelectorAll('.beat-dot').forEach((d,i)=>{d.classList.remove('active','accent');if(i===0){d.classList.add('active','accent');}});}
}

// ==================== PWA 注册 ====================
function initPWA(){
  if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{});}
}

// ==================== 初始化 ====================
function init(){
  initVibeGestures();
  initTabNavigation();
  initChordFinder();
  initTuner();
  initMetronome();
  initPWA();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
