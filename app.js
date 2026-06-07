// ============ 吉他学习助手 v3 - 交互指板 + 琴头调音 + 多音色 + Vibe 手势 ============

(function () {
    "use strict";

    // ==================== 音频引擎 ====================
    const AudioEngine = {
        _ctx: null,
        get ctx() {
            if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (this._ctx.state === "suspended") this._ctx.resume();
            return this._ctx;
        },

        /** 播放频率音符 */
        playTone(freq, duration, type, volume) {
            type = type || "sine";
            volume = volume || 0.3;
            duration = duration || 1.5;
            const ctx = this.ctx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        },

        /** 获取吉他一根弦某品位的频率 */
        getFretFreq(stringIndex, fret) {
            // stringIndex: 0=⑥(E2), 1=⑤(A2), 2=④(D3), 3=③(G3), 4=②(B3), 5=①(E4)
            const openFreqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
            return openFreqs[stringIndex] * Math.pow(2, fret / 12);
        },

        /** 播放指板音 */
        playFretSound(stringIndex, fret) {
            const freq = this.getFretFreq(stringIndex, fret);
            // 吉他音色：用 triangle 波模拟拨弦
            this.playTone(freq, 1.8, "triangle", 0.25);
        },

        /** 生成节拍器音色 */
        scheduleMetronomeBeat(ctx, time, index, soundType, beatsPerMeasure) {
            beatsPerMeasure = beatsPerMeasure || 4;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const noiseGain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const isAccent = index === 0;

            switch (soundType) {
                case "click":
                    osc.frequency.value = isAccent ? 1000 : 750;
                    osc.type = "sine";
                    gain.gain.setValueAtTime(0.4, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
                    osc.start(time);
                    osc.stop(time + 0.07);
                    break;

                case "wood":
                    osc.frequency.value = isAccent ? 550 : 400;
                    osc.type = "triangle";
                    gain.gain.setValueAtTime(0.35, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
                    osc.start(time);
                    osc.stop(time + 0.09);
                    break;

                case "beep":
                    osc.frequency.value = isAccent ? 880 : 660;
                    osc.type = "square";
                    gain.gain.setValueAtTime(0.12, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
                    osc.start(time);
                    osc.stop(time + 0.04);
                    break;

                case "clave":
                    // 响棒：尖锐短促
                    osc.frequency.value = isAccent ? 2200 : 1800;
                    osc.type = "sine";
                    gain.gain.setValueAtTime(0.5, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
                    osc.start(time);
                    osc.stop(time + 0.03);
                    break;

                case "cowbell":
                    // 牛铃：双频叠加
                    osc.frequency.value = isAccent ? 1200 : 900;
                    osc.type = "square";
                    gain.gain.setValueAtTime(0.2, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
                    osc.start(time);
                    osc.stop(time + 0.12);
                    // 第二泛音
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.frequency.value = isAccent ? 1450 : 1100;
                    osc2.type = "square";
                    gain2.gain.setValueAtTime(0.1, time);
                    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
                    osc2.start(time);
                    osc2.stop(time + 0.12);
                    break;

                case "rimshot":
                    // 鼓边：短噪声 + 音调
                    osc.frequency.value = isAccent ? 3000 : 2400;
                    osc.type = "sawtooth";
                    gain.gain.setValueAtTime(0.15, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
                    osc.start(time);
                    osc.stop(time + 0.02);
                    break;

                case "hihat":
                    // 踩镲：高频噪声
                    osc.frequency.value = isAccent ? 8000 : 6000;
                    osc.type = "square";
                    gain.gain.setValueAtTime(0.06, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
                    osc.start(time);
                    osc.stop(time + 0.05);
                    // 噪声成分
                    const oscN = ctx.createOscillator();
                    const gn = ctx.createGain();
                    oscN.connect(gn);
                    gn.connect(ctx.destination);
                    oscN.frequency.value = 300;
                    oscN.type = "sawtooth";
                    gn.gain.setValueAtTime(0.03, time);
                    gn.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
                    oscN.start(time);
                    oscN.stop(time + 0.04);
                    break;

                case "stick":
                    // 鼓棒互击
                    osc.frequency.value = isAccent ? 1600 : 1200;
                    osc.type = "triangle";
                    gain.gain.setValueAtTime(0.3, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
                    osc.start(time);
                    osc.stop(time + 0.04);
                    break;

                default:
                    osc.frequency.value = isAccent ? 1000 : 750;
                    osc.type = "sine";
                    gain.gain.setValueAtTime(0.4, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
                    osc.start(time);
                    osc.stop(time + 0.07);
            }
        }
    };

    // ==================== 和弦数据库 ====================
    const CHORD_DATABASE = {
        major: {
            name: "大三和弦", shortName: "", intervals: "根音 · 大三度 · 纯五度",
            semitones: [0, 4, 7],
            shapes: {
                C: ["x", 3, 2, 0, 1, 0], "C#": ["x", 4, 3, 1, 2, 1],
                D: ["x", "x", 0, 2, 3, 2], "D#": ["x", 6, 5, 3, 4, 3],
                E: [0, 2, 2, 1, 0, 0], F: [1, 3, 3, 2, 1, 1],
                "F#": [2, 4, 4, 3, 2, 2], G: [3, 2, 0, 0, 0, 3],
                "G#": [4, 6, 6, 5, 4, 4], A: ["x", 0, 2, 2, 2, 0],
                "A#": ["x", 1, 3, 3, 3, 1], B: ["x", 2, 4, 4, 4, 2],
            },
        },
        minor: {
            name: "小三和弦", shortName: "m", intervals: "根音 · 小三度 · 纯五度",
            semitones: [0, 3, 7],
            shapes: {
                C: ["x", 3, 5, 5, 4, 3], "C#": ["x", 4, 6, 6, 5, 4],
                D: ["x", "x", 0, 2, 3, 1], "D#": ["x", 6, 8, 8, 7, 6],
                E: [0, 2, 2, 0, 0, 0], F: [1, 3, 3, 1, 1, 1],
                "F#": [2, 4, 4, 2, 2, 2], G: [3, 5, 5, 3, 3, 3],
                "G#": [4, 6, 6, 4, 4, 4], A: ["x", 0, 2, 2, 1, 0],
                "A#": ["x", 1, 3, 3, 2, 1], B: ["x", 2, 4, 4, 3, 2],
            },
        },
        7: {
            name: "属七和弦", shortName: "7", intervals: "根音 · 大三度 · 纯五度 · 小七度",
            semitones: [0, 4, 7, 10],
            shapes: {
                C: ["x", 3, 2, 3, 1, 0], "C#": ["x", 4, 3, 4, 2, 1],
                D: ["x", "x", 0, 2, 1, 2], "D#": ["x", 6, 5, 6, 4, 5],
                E: [0, 2, 0, 1, 0, 0], F: [1, 3, 1, 2, 1, 1],
                "F#": [2, 4, 2, 3, 2, 2], G: [3, 2, 0, 0, 0, 1],
                "G#": [4, 6, 4, 5, 4, 4], A: ["x", 0, 2, 0, 2, 0],
                "A#": ["x", 1, 3, 1, 3, 1], B: ["x", 2, 1, 2, 0, 2],
            },
        },
        maj7: {
            name: "大七和弦", shortName: "Maj7", intervals: "根音 · 大三度 · 纯五度 · 大七度",
            semitones: [0, 4, 7, 11],
            shapes: {
                C: ["x", 3, 2, 0, 0, 0], "C#": ["x", 4, 3, 1, 1, 1],
                D: ["x", "x", 0, 2, 2, 2], "D#": ["x", 6, 5, 3, 3, 3],
                E: [0, 2, 1, 1, 0, 0], F: ["x", "x", 3, 2, 1, 0],
                "F#": [2, 4, 3, 3, 2, 2], G: [3, 2, 0, 0, 0, 2],
                "G#": [4, 6, 5, 5, 4, 4], A: ["x", 0, 2, 1, 2, 0],
                "A#": ["x", 1, 3, 2, 3, 1], B: ["x", 2, 4, 3, 4, 2],
            },
        },
        m7: {
            name: "小七和弦", shortName: "m7", intervals: "根音 · 小三度 · 纯五度 · 小七度",
            semitones: [0, 3, 7, 10],
            shapes: {
                C: ["x", 3, 5, 3, 4, 3], "C#": ["x", 4, 6, 4, 5, 4],
                D: ["x", "x", 0, 2, 1, 1], "D#": ["x", 6, 8, 6, 7, 6],
                E: [0, 2, 0, 0, 0, 0], F: [1, 3, 1, 1, 1, 1],
                "F#": [2, 4, 2, 2, 2, 2], G: [3, 5, 3, 3, 3, 3],
                "G#": [4, 6, 4, 4, 4, 4], A: ["x", 0, 2, 0, 1, 0],
                "A#": ["x", 1, 3, 1, 2, 1], B: ["x", 2, 0, 2, 0, 2],
            },
        },
        dim: {
            name: "减三和弦", shortName: "dim", intervals: "根音 · 小三度 · 减五度",
            semitones: [0, 3, 6],
            shapes: {
                C: ["x", 3, 4, 5, 4, "x"], "C#": ["x", 4, 5, 6, 5, "x"],
                D: ["x", "x", 0, 1, 0, 1], "D#": ["x", 6, 7, 8, 7, "x"],
                E: ["x", "x", 2, 3, 2, 3], F: ["x", "x", 3, 4, 3, 4],
                "F#": ["x", "x", 4, 5, 4, 5], G: ["x", "x", 5, 6, 5, 6],
                "G#": ["x", "x", 6, 7, 6, 7], A: ["x", "x", 7, 8, 7, 8],
                "A#": ["x", 1, 2, 3, 2, "x"], B: ["x", 2, 3, 4, 3, "x"],
            },
        },
        aug: {
            name: "增三和弦", shortName: "aug", intervals: "根音 · 大三度 · 增五度",
            semitones: [0, 4, 8],
            shapes: {
                C: ["x", 3, 2, 1, 1, 0], "C#": ["x", 4, 3, 2, 2, 1],
                D: ["x", "x", 0, 3, 3, 2], "D#": ["x", 6, 5, 4, 4, 3],
                E: [0, 2, 1, 1, 1, 0], F: ["x", "x", 3, 2, 2, 1],
                "F#": [2, 4, 3, 3, 3, 2], G: [3, 2, 1, 0, 0, 3],
                "G#": [4, 6, 5, 5, 5, 4], A: ["x", 0, 3, 2, 2, 1],
                "A#": ["x", 1, 4, 3, 3, 2], B: ["x", 2, 1, 0, 0, 2],
            },
        },
        sus4: {
            name: "挂四和弦", shortName: "sus4", intervals: "根音 · 纯四度 · 纯五度",
            semitones: [0, 5, 7],
            shapes: {
                C: ["x", 3, 3, 0, 1, 1], "C#": ["x", 4, 4, 1, 2, 2],
                D: ["x", "x", 0, 2, 3, 3], "D#": ["x", 6, 6, 3, 4, 4],
                E: [0, 2, 2, 2, 0, 0], F: ["x", "x", 3, 3, 1, 1],
                "F#": [2, 4, 4, 4, 2, 2], G: [3, 5, 5, 5, 3, 3],
                "G#": [4, 6, 6, 6, 4, 4], A: ["x", 0, 2, 2, 3, 0],
                "A#": ["x", 1, 3, 3, 4, 1], B: ["x", 2, 4, 4, 5, 2],
            },
        },
    };

    const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    const OPEN_STRINGS = [
        { note: "E", octave: 2, freq: 82.41 },  // ⑥
        { note: "A", octave: 2, freq: 110.00 }, // ⑤
        { note: "D", octave: 3, freq: 146.83 }, // ④
        { note: "G", octave: 3, freq: 196.00 }, // ③
        { note: "B", octave: 3, freq: 246.94 }, // ②
        { note: "E", octave: 4, freq: 329.63 }, // ①
    ];

    // 乐器调弦数据
    const INSTRUMENTS = {
        guitar: {
            name: "吉他",
            description: "标准调弦 · E₂ A₂ D₃ G₃ B₃ E₄",
            strings: [
                { num: 6, note: "E", octave: 2, freq: 82.41 },
                { num: 5, note: "A", octave: 2, freq: 110.00 },
                { num: 4, note: "D", octave: 3, freq: 146.83 },
                { num: 3, note: "G", octave: 3, freq: 196.00 },
                { num: 2, note: "B", octave: 3, freq: 246.94 },
                { num: 1, note: "E", octave: 4, freq: 329.63 },
            ]
        },
        ukulele: {
            name: "尤克里里",
            description: "标准调弦 · G₄ C₄ E₄ A₄",
            strings: [
                { num: 4, note: "G", octave: 4, freq: 392.00 },
                { num: 3, note: "C", octave: 4, freq: 261.63 },
                { num: 2, note: "E", octave: 4, freq: 329.63 },
                { num: 1, note: "A", octave: 4, freq: 440.00 },
            ]
        },
        bass: {
            name: "贝斯",
            description: "标准调弦 · E₁ A₁ D₂ G₂",
            strings: [
                { num: 4, note: "E", octave: 1, freq: 41.21 },
                { num: 3, note: "A", octave: 1, freq: 55.00 },
                { num: 2, note: "D", octave: 2, freq: 73.42 },
                { num: 1, note: "G", octave: 2, freq: 98.00 },
            ]
        }
    };

    function getNoteNumber(noteName) {
        return NOTE_NAMES.indexOf(noteName);
    }

    function getNotesFromIntervals(rootNote, semitones) {
        const rootNum = getNoteNumber(rootNote);
        return semitones.map((st) => NOTE_NAMES[(rootNum + st) % 12]);
    }

    /** 根据一组音高集合（半音数），匹配和弦类型 */
    function matchChordFromNotes(noteSet) {
        // noteSet: Set of semitone numbers (0-11)
        const arr = Array.from(noteSet).sort((a, b) => a - b);
        const bestMatches = [];

        for (const [typeKey, chordData] of Object.entries(CHORD_DATABASE)) {
            for (let rootOffset = 0; rootOffset < 12; rootOffset++) {
                const expectedNotes = new Set(chordData.semitones.map(s => (rootOffset + s) % 12));
                const intersection = arr.filter(n => expectedNotes.has(n));
                // 精确匹配或超集匹配
                if (intersection.length === expectedNotes.size && intersection.length === arr.length) {
                    bestMatches.push({
                        type: typeKey,
                        root: NOTE_NAMES[rootOffset],
                        name: chordData.name,
                        shortName: chordData.shortName,
                        intervals: chordData.intervals,
                        score: intersection.length,
                    });
                }
            }
        }

        // 按匹配度排序
        bestMatches.sort((a, b) => b.score - a.score);
        return bestMatches;
    }

    // ==================== Vibe Coding 手势动画 ====================
    function initVibeGestures() {
        const cursorGlow = document.getElementById("cursorGlow");
        if (!cursorGlow) return;

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let currentX = mouseX;
        let currentY = mouseY;
        let isVisible = false;

        document.addEventListener("mousemove", (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!isVisible) {
                isVisible = true;
                cursorGlow.style.opacity = "1";
            }
        });

        document.addEventListener("mouseleave", () => {
            isVisible = false;
            cursorGlow.style.opacity = "0";
        });

        document.addEventListener("mouseenter", () => {
            isVisible = true;
            cursorGlow.style.opacity = "1";
        });

        // 触摸支持
        document.addEventListener("touchmove", (e) => {
            if (e.touches.length > 0) {
                mouseX = e.touches[0].clientX;
                mouseY = e.touches[0].clientY;
                if (!isVisible) { isVisible = true; cursorGlow.style.opacity = "1"; }
            }
        }, { passive: true });

        document.addEventListener("touchend", () => {
            setTimeout(() => { isVisible = false; cursorGlow.style.opacity = "0"; }, 800);
        });

        function animate() {
            currentX += (mouseX - currentX) * 0.08;
            currentY += (mouseY - currentY) * 0.08;
            cursorGlow.style.left = currentX + "px";
            cursorGlow.style.top = currentY + "px";
            requestAnimationFrame(animate);
        }
        animate();
    }

    // ==================== 标签切换 ====================
    function initTabNavigation() {
        const tabs = document.querySelectorAll(".nav-tab");
        const panels = document.querySelectorAll(".tab-panel");

        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                const target = tab.dataset.tab;
                tabs.forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                panels.forEach((p) => p.classList.remove("active"));
                const panel = document.getElementById("panel-" + target);
                panel.classList.add("active");
                panel.style.animation = "none";
                panel.offsetHeight;
                panel.style.animation = "";
            });
        });
    }

    // ==================== 和弦查询器（12品指板 + 扫弦） ====================
    function initChordFinder() {
        const rootNotesContainer = document.getElementById("rootNotes");
        const chordTypesContainer = document.getElementById("chordTypes");
        const chordNameDisplay = document.getElementById("chordName");
        const chordNotesComposition = document.getElementById("chordNotesComposition");
        const chordIntervals = document.getElementById("chordIntervals");
        const chordNoteTags = document.getElementById("chordNoteTags");
        const canvas = document.getElementById("chordCanvas");
        const chordSelector = document.getElementById("chordSelector");
        const reverseHint = document.getElementById("reverseHint");
        const chordModeTabs = document.getElementById("chordModeTabs");
        const scrollContainer = document.getElementById("fretboardScrollContainer");
        const strumHint = document.getElementById("strumHint");

        let selectedRoot = "C";
        let selectedType = "major";
        let currentMode = "query"; // "query" | "reverse"

        // 反向模式状态：用户点击指板构建的和弦 [stringIndex] = fret (null=未按, 0=空弦, "x"=静音)
        let reverseFrets = [null, null, null, null, null, null];

        // ========== 画布布局常量（12品，竖向滚动） ==========
        const NUM_FRETS = 12;
        const NUM_STRINGS = 6;

        // 根据容器宽度动态计算布局
        function getCanvasDimensions() {
            const containerWidth = scrollContainer ? scrollContainer.clientWidth - 4 : 340;
            const scale = Math.min(1, containerWidth / 340);

            const leftMargin = Math.round(38 * scale);
            const topMargin = Math.round(46 * scale);
            const stringSpacing = Math.round(44 * scale);
            const fretHeight = Math.round(42 * scale);
            const padding = Math.round(8 * scale);

            // 画布宽度填满容器，高度显示全部12品
            const w = containerWidth;
            const h = topMargin + NUM_FRETS * fretHeight + 20;

            return { scale, leftMargin, topMargin, stringSpacing, fretHeight, padding, w, h };
        }

        // 当前布局尺寸（在渲染时动态更新）
        let currentLayout = getCanvasDimensions();

        // 初始化画布尺寸
        function initCanvasSize() {
            currentLayout = getCanvasDimensions();
            canvas.width = currentLayout.w;
            canvas.height = currentLayout.h;
            canvas.style.width = currentLayout.w + "px";
            canvas.style.height = currentLayout.h + "px";
        }
        initCanvasSize();

        // 监听容器尺寸变化
        if (window.ResizeObserver && scrollContainer) {
            const ro = new ResizeObserver(() => {
                const newLayout = getCanvasDimensions();
                if (Math.abs(newLayout.w - currentLayout.w) > 2) {
                    initCanvasSize();
                    if (currentMode === "query") renderChord();
                    else renderReverseChord();
                }
            });
            ro.observe(scrollContainer);
        }

        // ========== 扫弦状态 ==========
        let isStrumming = false;
        let strumStartX = 0;
        let strumStartY = 0;
        let strumCurrentX = 0;
        let strumCurrentY = 0;
        let strumTouchedStrings = new Set();
        let strumLastSweep = 0; // 上次扫到的弦
        const STRUM_COOLDOWN = 40; // ms 防重复触发
        let clickMoved = false; // 标记是否发生了拖拽

        // ---- 模式切换 ----
        chordModeTabs.addEventListener("click", (e) => {
            const tab = e.target.closest(".chord-mode-tab");
            if (!tab) return;
            chordModeTabs.querySelectorAll(".chord-mode-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            currentMode = tab.dataset.mode;

            if (currentMode === "query") {
                chordSelector.style.display = "";
                reverseHint.style.display = "none";
                reverseFrets = [null, null, null, null, null, null];
                renderChord();
            } else {
                chordSelector.style.display = "none";
                reverseHint.style.display = "";
                chordNameDisplay.innerHTML = '<span style="color: var(--text-tertiary);">点击指板</span>';
                chordNotesComposition.textContent = "点击品位标记按弦 · 水平拖拽扫弦";
                chordIntervals.textContent = "点击指板自动识别和弦";
                chordNoteTags.innerHTML = "";
                reverseFrets = [null, null, null, null, null, null];
                drawChordDiagram(canvas, reverseFrets, "?", "点击指板推理");
            }
        });

        // ---- 根音选择 ----
        rootNotesContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".note-btn");
            if (!btn) return;
            rootNotesContainer.querySelectorAll(".note-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            selectedRoot = btn.dataset.note;
            if (currentMode === "query") renderChord();
        });

        // ---- 和弦类型选择 ----
        chordTypesContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".type-btn");
            if (!btn) return;
            chordTypesContainer.querySelectorAll(".type-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            selectedType = btn.dataset.type;
            if (currentMode === "query") renderChord();
        });

        // ========== 画布坐标转换辅助 ==========
        function canvasCoords(e) {
            const rect = canvas.getBoundingClientRect();
            // 使用 CSS 尺寸与内部尺寸的比例进行坐标转换
            // 注意：canvas.width/style.width 在 updateCanvasSize 中保持同步
            const scaleX = canvas.width / (rect.width || 1);
            const scaleY = canvas.height / (rect.height || 1);
            // 获取事件坐标（兼容 touch 和 pointer 事件）
            let clientX, clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY,
            };
        }

        function getStringAndFret(cx, cy, currentShape) {
            const { leftMargin, topMargin, stringSpacing, fretHeight, scale } = currentLayout;
            let clickedString = -1;
            let clickedFret = -1;

            // 弦的点击范围
            for (let s = 0; s < NUM_STRINGS; s++) {
                const x = leftMargin + s * stringSpacing;
                if (Math.abs(cx - x) < stringSpacing * 0.48) {
                    clickedString = s;
                    break;
                }
            }

            if (clickedString >= 0) {
                // 静音区域（品丝上方）
                const muteZoneTop = topMargin - Math.round(38 * scale);
                const openZoneTop = topMargin - Math.round(22 * scale);

                if (cy >= muteZoneTop && cy < openZoneTop) {
                    clickedFret = "x";
                } else if (cy >= openZoneTop && cy < topMargin) {
                    clickedFret = 0;
                } else if (cy >= topMargin && cy < topMargin + NUM_FRETS * fretHeight) {
                    clickedFret = Math.floor((cy - topMargin) / fretHeight) + 1;
                    if (clickedFret > 12) clickedFret = 12;
                }
            }

            return { clickedString, clickedFret };
        }

        function getFretsForShape() {
            return currentMode === "query"
                ? CHORD_DATABASE[selectedType].shapes[selectedRoot]
                : reverseFrets;
        }

        // ========== 扫弦播放 ==========
        function playStrum(stringIndices, direction) {
            // 按扫弦方向排列：down: ⑥→① (index 0→5), up: ①→⑥ (index 5→0)
            const ordered = [...stringIndices].sort((a, b) => {
                return direction === "down" ? a - b : b - a;
            });

            const shape = getFretsForShape();
            const now = AudioEngine.ctx.currentTime;
            const delayPerString = 0.04; // 每根弦间隔 40ms

            ordered.forEach((sIdx, i) => {
                const fret = shape && shape[sIdx] !== undefined ? shape[sIdx] : null;
                let freq;
                if (typeof fret === "number") {
                    freq = AudioEngine.getFretFreq(sIdx, fret);
                } else if (fret === null || fret === undefined) {
                    // 未标记的弦弹空弦音
                    freq = OPEN_STRINGS[sIdx].freq;
                } else {
                    return; // "x" 静音跳过
                }

                const startTime = now + i * delayPerString;
                const ctx = AudioEngine.ctx;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.value = freq;
                const vol = 0.2 * (1 - i * 0.06);
                gain.gain.setValueAtTime(vol, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.6);
            });
        }

        // ========== 鼠标/触摸事件（点击 + 扫弦，竖向滑动穿透） ==========

        // pointerdown: 记录起始位置
        canvas.addEventListener("pointerdown", (e) => {
            const coords = canvasCoords(e);
            strumStartX = coords.x;
            strumStartY = coords.y;
            strumCurrentX = coords.x;
            strumCurrentY = coords.y;
            isStrumming = true;
            strumTouchedStrings.clear();
            strumLastSweep = 0;
            clickMoved = false;
            strumHint.classList.add("active");
        });

        // pointermove: 水平拖拽=扫弦，竖向=穿透给容器滚动
        canvas.addEventListener("pointermove", (e) => {
            if (!isStrumming) return;
            const coords = canvasCoords(e);
            const dx = Math.abs(coords.x - strumStartX);
            const dy = Math.abs(coords.y - strumStartY);
            const totalDist = dx + dy;

            if (totalDist > 8) clickMoved = true;

            // 只有水平拖拽显著时才拦截作为扫弦
            if (dx > 20 && dx > dy * 1.5) {
                e.preventDefault();
                strumCurrentX = coords.x;
                strumCurrentY = coords.y;
                const { clickedString } = getStringAndFret(coords.x, coords.y, getFretsForShape());
                if (clickedString >= 0 && !strumTouchedStrings.has(clickedString)) {
                    const now = Date.now();
                    if (now - strumLastSweep > STRUM_COOLDOWN || strumTouchedStrings.size === 0) {
                        strumTouchedStrings.add(clickedString);
                        strumLastSweep = now;
                    }
                }
            }
            // 竖向移动不拦截 → 容器自然滚动
        });

        // pointerup: 结束交互
        canvas.addEventListener("pointerup", (e) => {
            if (!isStrumming) return;
            isStrumming = false;
            strumHint.classList.remove("active");

            let coords;
            try { coords = canvasCoords(e); } catch (_) { return; }

            if (strumTouchedStrings.size >= 2) {
                // 扫弦播放
                const dy = strumCurrentY - strumStartY;
                const direction = dy > 0 ? "down" : "up";
                playStrum(Array.from(strumTouchedStrings), direction);
            } else if (!clickMoved) {
                // 点击
                const { clickedString, clickedFret } = getStringAndFret(coords.x, coords.y, getFretsForShape());
                if (clickedString >= 0) handleClick(clickedString, clickedFret);
            } else if (strumTouchedStrings.size === 1) {
                // 只扫到一根弦，当作点击
                const { clickedString, clickedFret } = getStringAndFret(coords.x, coords.y, getFretsForShape());
                if (clickedString >= 0) handleClick(clickedString, clickedFret);
            }

            try { canvas.releasePointerCapture(e.pointerId); } catch (_e) {}
        });

        // touch 兼容事件
        canvas.addEventListener("touchstart", (e) => {
            if (isStrumming) return;
            const touch = e.touches[0];
            const coords = canvasCoords(touch);
            strumStartX = coords.x;
            strumStartY = coords.y;
            strumCurrentX = coords.x;
            strumCurrentY = coords.y;
            isStrumming = true;
            strumTouchedStrings.clear();
            strumLastSweep = 0;
            clickMoved = false;
            strumHint.classList.add("active");
        }, { passive: true });

        canvas.addEventListener("touchmove", (e) => {
            if (!isStrumming) return;
            const touch = e.touches[0];
            const coords = canvasCoords(touch);
            const dx = Math.abs(coords.x - strumStartX);
            const dy = Math.abs(coords.y - strumStartY);
            const totalDist = dx + dy;

            if (totalDist > 8) clickMoved = true;

            if (dx > 20 && dx > dy * 1.5) {
                e.preventDefault();
                strumCurrentX = coords.x;
                strumCurrentY = coords.y;
                const { clickedString } = getStringAndFret(coords.x, coords.y, getFretsForShape());
                if (clickedString >= 0 && !strumTouchedStrings.has(clickedString)) {
                    const now = Date.now();
                    if (now - strumLastSweep > STRUM_COOLDOWN || strumTouchedStrings.size === 0) {
                        strumTouchedStrings.add(clickedString);
                        strumLastSweep = now;
                    }
                }
            }
        }, { passive: false });

        canvas.addEventListener("touchend", (e) => {
            if (!isStrumming) return;
            isStrumming = false;
            strumHint.classList.remove("active");

            let coords;
            try { coords = canvasCoords(e); } catch (_) { return; }

            if (strumTouchedStrings.size >= 2) {
                const dy = strumCurrentY - strumStartY;
                const direction = dy > 0 ? "down" : "up";
                playStrum(Array.from(strumTouchedStrings), direction);
            } else if (!clickMoved) {
                const { clickedString, clickedFret } = getStringAndFret(coords.x, coords.y, getFretsForShape());
                if (clickedString >= 0) handleClick(clickedString, clickedFret);
            } else if (strumTouchedStrings.size === 1) {
                const { clickedString, clickedFret } = getStringAndFret(coords.x, coords.y, getFretsForShape());
                if (clickedString >= 0) handleClick(clickedString, clickedFret);
            }
        });

        function handleClick(clickedString, clickedFret) {
            if (currentMode === "reverse") {
                // 反向模式：循环切换
                if (clickedString >= 0 && clickedFret >= 0) {
                    const cur = reverseFrets[clickedString];
                    if (cur === null || cur === undefined) {
                        reverseFrets[clickedString] = clickedFret;
                    } else if (cur === clickedFret) {
                        reverseFrets[clickedString] = 0;
                    } else if (cur === 0) {
                        reverseFrets[clickedString] = "x";
                    } else if (cur === "x") {
                        reverseFrets[clickedString] = null;
                    } else {
                        reverseFrets[clickedString] = clickedFret;
                    }
                    if (typeof reverseFrets[clickedString] === "number" && reverseFrets[clickedString] > 0) {
                        AudioEngine.playFretSound(clickedString, reverseFrets[clickedString]);
                    } else if (reverseFrets[clickedString] === 0) {
                        AudioEngine.playFretSound(clickedString, 0);
                    }
                    renderReverseChord();
                }
            } else {
                // 查询模式：只播放声音
                if (clickedString >= 0 && typeof clickedFret === "number" && clickedFret >= 0) {
                    AudioEngine.playFretSound(clickedString, clickedFret);
                }
            }
        }

        // ========== 渲染函数 ==========
        function renderChord() {
            const chordData = CHORD_DATABASE[selectedType];
            const shape = chordData.shapes[selectedRoot];
            if (!shape) return;

            const shortName = chordData.shortName || "";
            const displayShort = shortName ? selectedRoot + shortName : selectedRoot;

            chordNameDisplay.innerHTML = `${displayShort} <span class="chord-type-badge">${chordData.name}</span>`;

            const notes = getNotesFromIntervals(selectedRoot, chordData.semitones);
            chordNotesComposition.textContent = notes.join(" · ");
            chordIntervals.textContent = chordData.intervals;

            const tagClasses = ["root", "third", "fifth", "seventh"];
            chordNoteTags.innerHTML = notes
                .map((n, i) => `<span class="chord-note-tag ${tagClasses[i] || "fifth"}">${n}</span>`)
                .join("");

            drawChordDiagram(canvas, shape, displayShort, chordData.name);
        }

        function renderReverseChord() {
            const noteSet = new Set();
            let hasNotes = false;

            reverseFrets.forEach((fret, idx) => {
                if (typeof fret === "number") {
                    const openNoteNum = getNoteNumber(OPEN_STRINGS[idx].note);
                    const noteNum = (openNoteNum + fret) % 12;
                    noteSet.add(noteNum);
                    hasNotes = true;
                }
            });

            if (!hasNotes || noteSet.size === 0) {
                chordNameDisplay.innerHTML = '<span style="color: var(--text-tertiary);">点击指板标记品位</span>';
                chordNotesComposition.textContent = "点击品位 · 水平拖拽扫弦";
                chordIntervals.textContent = "至少标记一个音";
                chordNoteTags.innerHTML = "";
                drawChordDiagram(canvas, reverseFrets, "?", "标记品位");
                return;
            }

            const matches = matchChordFromNotes(noteSet);

            // 决定根音：优先使用匹配到的和弦根音，否则取 noteSet 中最低的音
            let rootNote = null;
            let bestMatch = null;
            if (matches.length > 0) {
                bestMatch = matches[0];
                rootNote = getNoteNumber(bestMatch.root);
            } else {
                const sortedNotes = Array.from(noteSet).sort((a, b) => a - b);
                rootNote = sortedNotes[0];
            }

            // 按音程顺序排列组成音（以根音为基准）
            const noteNumbers = Array.from(noteSet);
            const sortedByInterval = noteNumbers.sort((a, b) => {
                const distA = (a - rootNote + 12) % 12;
                const distB = (b - rootNote + 12) % 12;
                return distA - distB;
            });
            const noteNames = sortedByInterval.map(n => NOTE_NAMES[n]);
            chordNotesComposition.textContent = noteNames.join(" · ");

            if (matches.length > 0) {
                const best = matches[0];
                const displayName = best.root + (best.shortName || "");
                chordNameDisplay.innerHTML = `${displayName} <span class="chord-type-badge">${best.name}</span>`;

                // 根据实际按出的音重新计算音程关系
                const intervals = getIntervalsFromRoot(rootNote, noteNumbers);
                chordIntervals.textContent = intervals;
            } else {
                chordNameDisplay.innerHTML = `<span style="color: var(--text-tertiary);">${noteNames.join(" · ")}</span>`;
                const intervals = getIntervalsFromRoot(rootNote, noteNumbers);
                chordIntervals.textContent = intervals || "未匹配到已知和弦";
            }

            if (matches.length > 1) {
                const altText = matches.slice(1, 4).map(m => m.root + (m.shortName || "")).join(" / ");
                chordIntervals.textContent += "  ·  备选: " + altText;
            }

            const tagClasses = ["root", "third", "fifth", "seventh", "ninth", "eleventh"];
            chordNoteTags.innerHTML = noteNames
                .map((n, i) => `<span class="chord-note-tag ${tagClasses[i] || "fifth"}">${n}</span>`)
                .join("");

            drawChordDiagram(canvas, reverseFrets, noteNames.join("·"), matches[0] ? matches[0].name : "");
        }

        /** 根据根音和音符集合生成音程关系文字 */
        function getIntervalsFromRoot(rootNum, noteNumbers) {
            const intervalNames = [
                "根音", "小二度", "大二度", "小三度", "大三度",
                "纯四度", "增四度/减五度", "纯五度", "小六度", "大六度",
                "小七度", "大七度"
            ];
            return noteNumbers
                .map(n => {
                    const dist = (n - rootNum + 12) % 12;
                    return intervalNames[dist] || `半音${dist}`;
                })
                .join(" · ");
        }

        // ========== 绘制12品指板图（竖向全12品，容器裁剪5品可见） ==========
        function drawChordDiagram(canvas, shape, displayName, typeName) {
            const ctx = canvas.getContext("2d");
            const { leftMargin, topMargin, stringSpacing, fretHeight, scale } = currentLayout;
            const w = canvas.width;
            const h = canvas.height;

            ctx.clearRect(0, 0, w, h);

            // 背景
            ctx.fillStyle = "rgba(255,255,255,0.02)";
            roundRect(ctx, 2, 2, w - 4, h - 4, Math.round(10 * scale), true, false);

            // 品位标记点（3, 5, 7, 9, 12品）
            const dotFrets = [3, 5, 7, 9, 12];
            const dotRadius = Math.max(2, Math.round(3 * scale));
            dotFrets.forEach(fretNum => {
                const y = topMargin + (fretNum - 0.5) * fretHeight;
                if (fretNum === 12) {
                    const x1 = leftMargin + 1.5 * stringSpacing;
                    const x2 = leftMargin + 3.5 * stringSpacing;
                    [x1, x2].forEach(xx => {
                        ctx.beginPath();
                        ctx.arc(xx, y, dotRadius, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(255,255,255,0.1)";
                        ctx.fill();
                    });
                } else {
                    const x = leftMargin + 2.5 * stringSpacing;
                    ctx.beginPath();
                    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(255,255,255,0.1)";
                    ctx.fill();
                }
            });

            // 品丝
            for (let f = 0; f <= NUM_FRETS; f++) {
                const y = topMargin + f * fretHeight;
                ctx.beginPath();
                ctx.moveTo(leftMargin - 6, y);
                ctx.lineTo(leftMargin + (NUM_STRINGS - 1) * stringSpacing + 6, y);
                if (f === 0) {
                    ctx.strokeStyle = "rgba(255,255,255,0.45)";
                    ctx.lineWidth = Math.max(1.5, 2.2 * scale);
                } else {
                    ctx.strokeStyle = "rgba(255,255,255,0.1)";
                    ctx.lineWidth = Math.max(0.6, 1 * scale);
                }
                ctx.stroke();
            }

            // 品位数字
            ctx.fillStyle = "rgba(255,255,255,0.18)";
            const fretNumSize = Math.max(8, Math.round(10 * scale));
            ctx.font = `500 ${fretNumSize}px -apple-system, sans-serif`;
            ctx.textAlign = "right";
            for (let f = 1; f <= NUM_FRETS; f++) {
                const y = topMargin + (f - 0.5) * fretHeight + Math.round(3 * scale);
                ctx.fillText(f, leftMargin - Math.round(10 * scale), y);
            }

            // 弦线
            for (let s = 0; s < NUM_STRINGS; s++) {
                const x = leftMargin + s * stringSpacing;
                const lineWidth = Math.max(0.8, (1.2 - s * 0.12) * scale);
                ctx.beginPath();
                ctx.moveTo(x, topMargin);
                ctx.lineTo(x, topMargin + NUM_FRETS * fretHeight);
                ctx.strokeStyle = "rgba(255,255,255,0.25)";
                ctx.lineWidth = lineWidth;
                ctx.stroke();
            }

            // 绘制按弦标记
            const dotSize = Math.max(8, Math.round(10 * scale));
            shape.forEach((fret, idx) => {
                if (fret === "x" || fret === null || fret === undefined) return;
                const x = leftMargin + idx * stringSpacing;

                if (fret === 0) {
                    // 空弦圆圈
                    const ringRadius = Math.max(5, Math.round(7 * scale));
                    ctx.beginPath();
                    ctx.arc(x, topMargin - Math.round(18 * scale), ringRadius, 0, Math.PI * 2);
                    ctx.fillStyle = "transparent";
                    ctx.fill();
                    ctx.strokeStyle = "rgba(255,255,255,0.5)";
                    ctx.lineWidth = Math.max(1.2, 1.8 * scale);
                    ctx.stroke();
                } else {
                    const drawFret = fret;
                    if (drawFret < 1 || drawFret > NUM_FRETS) return;
                    const y = topMargin + (drawFret - 0.5) * fretHeight;

                    // 阴影
                    ctx.beginPath();
                    ctx.arc(x, y + 1, dotSize, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(0,0,0,0.3)";
                    ctx.fill();

                    // 渐变填充
                    const grad = ctx.createRadialGradient(x - 2, y - 2, dotSize * 0.15, x, y, dotSize);
                    grad.addColorStop(0, "#5e9eff");
                    grad.addColorStop(0.7, "#0a84ff");
                    grad.addColorStop(1, "#0060d0");

                    ctx.beginPath();
                    ctx.arc(x, y, dotSize - 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();

                    // 品位数字
                    ctx.fillStyle = "#fff";
                    const fretTextSize = Math.max(7, Math.round(9 * scale));
                    ctx.font = `600 ${fretTextSize}px -apple-system, sans-serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(fret, x, y + 0.5);
                }
            });

            // 静音标记
            shape.forEach((fret, idx) => {
                if (fret !== "x") return;
                const x = leftMargin + idx * stringSpacing;
                const cy2 = topMargin - Math.round(18 * scale);
                const crossSize = Math.max(3, Math.round(4.5 * scale));
                ctx.strokeStyle = "rgba(255,69,58,0.7)";
                ctx.lineWidth = Math.max(1.2, 1.8 * scale);
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(x - crossSize, cy2 - crossSize);
                ctx.lineTo(x + crossSize, cy2 + crossSize);
                ctx.moveTo(x + crossSize, cy2 - crossSize);
                ctx.lineTo(x - crossSize, cy2 + crossSize);
                ctx.stroke();
            });

            // 弦号
            ctx.fillStyle = "rgba(255,255,255,0.25)";
            const stringNumSize = Math.max(8, Math.round(10 * scale));
            ctx.font = `500 ${stringNumSize}px -apple-system, sans-serif`;
            ctx.textAlign = "center";
            for (let s = 0; s < NUM_STRINGS; s++) {
                const x = leftMargin + s * stringSpacing;
                ctx.fillText(6 - s, x, topMargin - Math.round(24 * scale));
            }

            // 空弦音符名
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            const noteNameSize = Math.max(7, Math.round(9 * scale));
            ctx.font = `500 ${noteNameSize}px -apple-system, sans-serif`;
            ctx.textAlign = "center";
            const openNotes = ["E", "A", "D", "G", "B", "E"];
            for (let s = 0; s < NUM_STRINGS; s++) {
                const x = leftMargin + s * stringSpacing;
                ctx.fillText(openNotes[s], x, topMargin - Math.round(32 * scale));
            }
        }

        function roundRect(ctx, x, y, w, h, r, fill, stroke) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            if (fill) ctx.fill();
            if (stroke) ctx.stroke();
        }

        renderChord();
    }

    // ==================== 调音器 - 琴头样式 ====================
    function initTuner() {
        const micBtn = document.getElementById("micBtn");
        const detectedFreq = document.getElementById("detectedFreq");
        const detectedNote = document.getElementById("detectedNote");
        const headstockBody = document.getElementById("headstockBody");
        const leftCol = document.getElementById("headstockLeft");
        const rightCol = document.getElementById("headstockRight");
        const tunerDesc = document.getElementById("tunerDesc");
        const instrumentSelector = document.getElementById("instrumentSelector");

        let audioCtx = null;
        let analyser = null;
        let micStream = null;
        let isListening = false;
        let animationId = null;
        let activePlayingBtn = null;
        let currentInstrument = "guitar";

        // 渲染琴头
        function renderHeadstock(instrumentKey) {
            const inst = INSTRUMENTS[instrumentKey];
            currentInstrument = instrumentKey;
            tunerDesc.textContent = inst.description;

            leftCol.innerHTML = "";
            rightCol.innerHTML = "";

            const half = Math.ceil(inst.strings.length / 2);
            const leftStrings = inst.strings.slice(0, half).reverse();
            const rightStrings = inst.strings.slice(half);

            function renderString(s, side) {
                const pegClass = side === "left" ? "peg-left" : "peg-right";
                const infoDir = side === "left" ? "row-reverse" : "row";
                return `
                    <div class="headstock-string" data-string="${s.num}">
                        <div class="tuning-peg peg-${s.num} ${pegClass}"></div>
                        <div class="string-info" style="flex-direction:${infoDir}">
                            <span class="string-number">${"①②③④⑤⑥".charAt(s.num - 1)}</span>
                            <span class="string-note-display">${s.note}</span>
                            <span class="string-freq">${s.freq.toFixed(2)} Hz</span>
                        </div>
                        <div class="tuner-meter-horizontal">
                            <div class="tuner-bar-track">
                                <div class="tuner-fill" id="tunerFill${s.num}"></div>
                            </div>
                            <div class="tuner-labels">
                                <span>♭</span>
                                <span class="center-label">·</span>
                                <span>♯</span>
                            </div>
                        </div>
                        <button class="string-play-btn" data-string="${s.num}" data-freq="${s.freq}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="8,5 19,12 8,19"/>
                            </svg>
                        </button>
                    </div>
                `;
            }

            leftStrings.forEach(s => { leftCol.innerHTML += renderString(s, "left"); });
            rightStrings.forEach(s => { rightCol.innerHTML += renderString(s, "right"); });
        }

        // 初始渲染吉他
        renderHeadstock("guitar");

        // 乐器切换
        instrumentSelector.addEventListener("click", (e) => {
            const btn = e.target.closest(".instrument-btn");
            if (!btn) return;
            const inst = btn.dataset.instrument;
            if (inst === currentInstrument) return;

            instrumentSelector.querySelectorAll(".instrument-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            stopListening();
            resetAllTunerFills();
            renderHeadstock(inst);
        });

        // 播放标准音
        headstockBody.addEventListener("click", (e) => {
            const playBtn = e.target.closest(".string-play-btn");
            if (!playBtn) return;

            const freq = parseFloat(playBtn.dataset.freq);
            const stringNum = playBtn.dataset.string;

            if (activePlayingBtn) activePlayingBtn.classList.remove("playing");
            playBtn.classList.add("playing");
            activePlayingBtn = playBtn;
            setTimeout(() => {
                playBtn.classList.remove("playing");
                if (activePlayingBtn === playBtn) activePlayingBtn = null;
            }, 2200);

            AudioEngine.playTone(freq, 2.2, "sine", 0.35);
            highlightHeadstockString(stringNum);
        });

        function highlightHeadstockString(stringNum) {
            document.querySelectorAll(".headstock-string").forEach(el => el.classList.remove("active"));
            const el = document.querySelector(`.headstock-string[data-string="${stringNum}"]`);
            if (el) {
                el.classList.add("active");
                setTimeout(() => el.classList.remove("active"), 2400);
            }
        }

        micBtn.addEventListener("click", async () => {
            isListening ? stopListening() : await startListening();
        });

        async function startListening() {
            try {
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
                });
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 4096;
                analyser.smoothingTimeConstant = 0.8;
                const source = audioCtx.createMediaStreamSource(micStream);
                source.connect(analyser);
                isListening = true;
                micBtn.classList.add("listening");
                micBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="1"/>
                    </svg>
                    停止调音
                `;
                detectPitch();
            } catch (err) {
                alert("无法访问麦克风，请检查浏览器权限。\n请使用 HTTPS 或 localhost 访问。");
            }
        }

        function stopListening() {
            if (micStream) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; }
            if (audioCtx) { audioCtx.close(); audioCtx = null; }
            if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
            isListening = false;
            micBtn.classList.remove("listening");
            micBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
                开始调音
            `;
            detectedFreq.textContent = "-- Hz";
            detectedNote.textContent = "轻弹琴弦即可检测";
            detectedNote.style.color = "";
            resetAllTunerFills();
        }

        function autoCorrelate(buf, sampleRate) {
            const SIZE = buf.length;
            let rms = 0;
            for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
            rms = Math.sqrt(rms / SIZE);
            if (rms < 0.01) return -1;

            let r1 = 0, r2 = SIZE - 1;
            const threshold = 0.2;
            for (let i = 0; i < SIZE; i++) { if (Math.abs(buf[i]) < threshold) { r1 = i; break; } }
            for (let i = 1; i < SIZE; i++) { if (Math.abs(buf[SIZE - i]) < threshold) { r2 = SIZE - i; break; } }

            const trimmed = buf.slice(r1, r2);
            const c = new Array(trimmed.length).fill(0);
            for (let i = 0; i < c.length; i++)
                for (let j = 0; j < c.length - i; j++)
                    c[i] += trimmed[j] * trimmed[j + i];

            let d = 0;
            while (c[d] > c[d + 1]) d++;
            let maxval = -1, maxpos = -1;
            for (let i = d; i < c.length; i++) {
                if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
            }
            let T0 = maxpos;
            const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
            const a = (x1 + x3 - 2 * x2) / 2;
            const b = (x3 - x1) / 2;
            if (a) T0 -= b / (2 * a);
            return sampleRate / T0;
        }

        function findClosestNote(freq) {
            const A4 = 440;
            const C0 = A4 * Math.pow(2, -4.75);
            const halfSteps = 12 * Math.log2(freq / C0);
            const rounded = Math.round(halfSteps);
            const noteIndex = ((rounded % 12) + 12) % 12;
            const cents = (halfSteps - rounded) * 100;
            return { note: NOTE_NAMES[noteIndex], cents, freq: C0 * Math.pow(2, rounded / 12) };
        }

        function detectPitch() {
            if (!isListening || !analyser) return;
            const bufferLength = analyser.fftSize;
            const buffer = new Float32Array(bufferLength);
            analyser.getFloatTimeDomainData(buffer);
            const freq = autoCorrelate(buffer, audioCtx.sampleRate);

            if (freq > 30 && freq < 500) {
                detectedFreq.textContent = freq.toFixed(1) + " Hz";
                const result = findClosestNote(freq);
                const centsRounded = Math.round(result.cents);
                const direction = centsRounded > 5 ? "偏高 ♯" : centsRounded < -5 ? "偏低 ♭" : "准确 ✓";
                detectedNote.textContent = `${result.note} · ${direction} · ${Math.abs(centsRounded)}¢`;
                detectedNote.style.color = Math.abs(centsRounded) <= 5 ? "#30d158" : "#ff9f0a";
                updateHeadstockFills(result.note, centsRounded);
            } else {
                detectedFreq.textContent = "-- Hz";
                detectedNote.textContent = "轻弹琴弦即可检测";
                detectedNote.style.color = "";
                resetAllTunerFills();
            }
            animationId = requestAnimationFrame(detectPitch);
        }

        function updateHeadstockFills(detectedNoteName, cents) {
            resetAllTunerFills();
            const inst = INSTRUMENTS[currentInstrument];
            let bestString = -1;
            inst.strings.forEach((s) => { if (s.note === detectedNoteName) bestString = s.num; });
            if (bestString === -1) return;

            const fill = document.getElementById("tunerFill" + bestString);
            if (!fill) return;

            const clampedCents = Math.max(-50, Math.min(50, cents));
            const percentage = ((clampedCents + 50) / 100) * 100;
            fill.style.width = percentage + "%";

            if (Math.abs(cents) <= 5) {
                fill.className = "tuner-fill in-tune";
                fill.style.width = "50%";
            } else if (cents > 0) {
                fill.className = "tuner-fill sharp";
            } else {
                fill.className = "tuner-fill flat";
            }

            const stringEl = document.querySelector(`.headstock-string[data-string="${bestString}"]`);
            if (stringEl && Math.abs(cents) <= 5) {
                stringEl.classList.add("active");
            }
        }

        function resetAllTunerFills() {
            const inst = INSTRUMENTS[currentInstrument];
            inst.strings.forEach(s => {
                const fill = document.getElementById("tunerFill" + s.num);
                if (fill) { fill.style.width = "50%"; fill.className = "tuner-fill"; }
            });
            document.querySelectorAll(".headstock-string").forEach(el => el.classList.remove("active"));
        }

        window.addEventListener("beforeunload", () => stopListening());
    }

    // ==================== 节拍器（多音色 + 多拍号） ====================
    function initMetronome() {
        const bpmValue = document.getElementById("bpmValue");
        const bpmSlider = document.getElementById("bpmSlider");
        const bpmDecrease10 = document.getElementById("bpmDecrease10");
        const bpmDecrease1 = document.getElementById("bpmDecrease1");
        const bpmIncrease1 = document.getElementById("bpmIncrease1");
        const bpmIncrease10 = document.getElementById("bpmIncrease10");
        const tapBtn = document.getElementById("tapBtn");
        const metronomeStart = document.getElementById("metronomeStart");
        const beatVisual = document.getElementById("beatVisual");
        const soundSelect = document.getElementById("soundSelect");
        const timeSignatureSelector = document.getElementById("timeSignatureSelector");

        let bpm = 120;
        let isRunning = false;
        let beatIndex = 0;
        let beatsPerMeasure = 4;
        let beatDivision = 4; // 以几分音符为一拍
        let timerId = null;
        let tapTimes = [];
        let audioCtx = null;
        let nextBeatTime = 0;
        let schedulerTimer = null;

        function setBPM(newBpm) {
            bpm = Math.max(30, Math.min(250, newBpm));
            bpmValue.textContent = bpm;
            bpmSlider.value = bpm;
        }

        bpmSlider.addEventListener("input", () => setBPM(parseInt(bpmSlider.value)));
        bpmDecrease10.addEventListener("click", () => setBPM(bpm - 10));
        bpmDecrease1.addEventListener("click", () => setBPM(bpm - 1));
        bpmIncrease1.addEventListener("click", () => setBPM(bpm + 1));
        bpmIncrease10.addEventListener("click", () => setBPM(bpm + 10));

        document.addEventListener("keydown", (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
            switch (e.code) {
                case "Space": e.preventDefault(); toggleMetronome(); break;
                case "ArrowUp": e.preventDefault(); setBPM(bpm + 1); break;
                case "ArrowDown": e.preventDefault(); setBPM(bpm - 1); break;
                case "ArrowRight": e.preventDefault(); setBPM(bpm + 10); break;
                case "ArrowLeft": e.preventDefault(); setBPM(bpm - 10); break;
            }
        });

        tapBtn.addEventListener("click", () => {
            tapBtn.classList.add("tapping");
            setTimeout(() => tapBtn.classList.remove("tapping"), 120);

            const now = Date.now();
            tapTimes.push(now);
            if (tapTimes.length > 5) tapTimes.shift();
            if (tapTimes.length > 1 && now - tapTimes[tapTimes.length - 2] > 2000) tapTimes = [now];

            if (tapTimes.length >= 2) {
                let total = 0;
                for (let i = 1; i < tapTimes.length; i++) total += tapTimes[i] - tapTimes[i - 1];
                setBPM(Math.round(60000 / (total / (tapTimes.length - 1))));
            }
        });

        metronomeStart.addEventListener("click", toggleMetronome);

        // 拍号切换
        timeSignatureSelector.addEventListener("click", (e) => {
            const btn = e.target.closest(".ts-btn");
            if (!btn) return;
            timeSignatureSelector.querySelectorAll(".ts-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            beatsPerMeasure = parseInt(btn.dataset.beats);
            beatDivision = parseInt(btn.dataset.division);
            rebuildBeatDots();
            if (isRunning) {
                // 重新开始以应用新拍号
                beatIndex = 0;
                nextBeatTime = audioCtx.currentTime;
            }
        });

        // 动态生成节拍点
        function rebuildBeatDots() {
            beatVisual.innerHTML = "";
            for (let i = 0; i < beatsPerMeasure; i++) {
                const dot = document.createElement("div");
                dot.className = "beat-dot" + (i === 0 ? " active accent" : "");
                dot.dataset.beat = i;
                beatVisual.appendChild(dot);
            }
            // 根据拍号调整点的大小（拍子多时缩小）
            if (beatsPerMeasure >= 6) {
                beatVisual.style.gap = "6px";
            } else {
                beatVisual.style.gap = "10px";
            }
        }

        function toggleMetronome() {
            isRunning ? stopMetronome() : startMetronome();
        }

        function startMetronome() {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            isRunning = true;
            beatIndex = 0;
            nextBeatTime = audioCtx.currentTime;
            metronomeStart.classList.add("running");
            metronomeStart.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1.5"/>
                    <rect x="14" y="4" width="4" height="16" rx="1.5"/>
                </svg>
                停止
            `;
            scheduler();
        }

        function stopMetronome() {
            isRunning = false;
            if (schedulerTimer) { clearTimeout(schedulerTimer); schedulerTimer = null; }
            metronomeStart.classList.remove("running");
            metronomeStart.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="8,5 19,12 8,19"/>
                </svg>
                开始
            `;
            resetBeatVisual();
        }

        function scheduler() {
            if (!isRunning) return;
            const interval = 60 / bpm;

            while (nextBeatTime < audioCtx.currentTime + 0.1) {
                AudioEngine.scheduleMetronomeBeat(audioCtx, nextBeatTime, beatIndex, soundSelect.value, beatsPerMeasure);
                updateBeatVisual(beatIndex);
                nextBeatTime += interval;
                beatIndex = (beatIndex + 1) % beatsPerMeasure;
            }

            schedulerTimer = setTimeout(scheduler, 25);
        }

        function updateBeatVisual(index) {
            const dots = beatVisual.querySelectorAll(".beat-dot");
            dots.forEach((dot, i) => {
                dot.classList.remove("active", "accent");
                if (i === index) {
                    dot.classList.add("active");
                    if (i === 0) dot.classList.add("accent");
                }
            });
        }

        function resetBeatVisual() {
            beatVisual.querySelectorAll(".beat-dot").forEach((dot, i) => {
                dot.classList.remove("active", "accent");
                // 重新高亮第一个
                if (i === 0) { dot.classList.add("active", "accent"); }
            });
        }
    }

    // ==================== 初始化 ====================
    function init() {
        initVibeGestures();
        initTabNavigation();
        initChordFinder();
        initTuner();
        initMetronome();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
