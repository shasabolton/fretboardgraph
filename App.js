class App {
  constructor() {
    this._stringSemis = [0, 5, 10, 15, 19, 24];
    this._loopFrets = 11;
    this._visibleFrets = 7;
    this._fretOffset = 0;
    this.fretboardCanvas = null;
    this._handed = "right";
    this._flipVertical = false;
    this._chordProgression = ["1", "5", "6", "4"];
    this._progressionSelect = null;
    this.semiMatrix = [];
    this._stringsUsed = this._stringSemis.length > 1
      ? [0, 1]
      : [0];
    this._stringFilterInputs = [];
    this.progressionPaths = [];
    this._pathIndex = 0;
    this._playbackButton = null;
    this._isPlaying = false;
    this._bpm = 100;
    this._beatMs = 60000 / this._bpm;
    this._beatsPerStep = 4;
    this._beatInStep = 0;
    this._activeStep = 0;
    this._lastBeatAtMs = 0;
    this._transitionFromStep = -1;
    this._transitionToStep = -1;
    this._transitionStartMs = 0;
    this._transitionDurationMs = Math.round(this._beatMs * 0.75);
    this._beatTimer = 0;
    this._rafId = 0;
    this._audioCtx = null;
  }

  generateSemisMatrix() {
    var rows = this._stringSemis.length;
    var cols = this._visibleFrets;
    this.semiMatrix = [];
    for (var s = 0; s < rows; s++) {
      this.semiMatrix[s] = [];
      for (var f = 0; f < cols; f++) {
        this.semiMatrix[s][f] = this.calcSemitones(s, f);
      }
    }
  }

  addFretOffset(delta) {
    if (delta === 0) return;
    this.setFretOffset(this._fretOffset + delta);
  }

  _arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  update() {
    this.generateSemisMatrix();
    this.generateProgressionPaths();
    if (this.fretboardCanvas) this.fretboardCanvas.updateCanvas();
    if (this.layoutStringFilterUI) this.layoutStringFilterUI();
    if (this.setPathUI) this.setPathUI();
    this._syncStringFilterUI();
    this._syncPlaybackUI();
  }

  generateProgressionPaths() {
    var prog = this._chordProgression;
    var matrix = this.semiMatrix;
    var used = this._stringsUsed;
    this.progressionPaths = [];
    if (!prog.length || !matrix.length) {
      this._activeStep = 0;
      this._clearTransition();
      this.setPlaybackRunning(false);
      return;
    }

    var candidates = [];
    for (var i = 0; i < prog.length; i++) {
      var deg = prog[i];
      var hits = [];
      for (var si = 0; si < used.length; si++) {
        var s = used[si];
        if (s < 0 || s >= matrix.length) continue;
        for (var f = 0; f < matrix[s].length; f++) {
          var semis = matrix[s][f];
          if (this.semitonesToDegree(semis) === deg) {
            hits.push({ x: f, y: s });
          }
        }
      }
      if (hits.length === 0) {
        this._activeStep = 0;
        this._clearTransition();
        this.setPlaybackRunning(false);
        return;
      }
      candidates.push(hits);
    }

    var paths = [];
    var maxJump = 4;
    var maxPathSpan = 5;
    var self = this;
    function cartesian(acc, idx) {
      if (idx === candidates.length) {
        if (self._calcPathLoopSpan(acc) <= maxPathSpan) paths.push(acc.slice());
        return;
      }
      for (var k = 0; k < candidates[idx].length; k++) {
        var pt = candidates[idx][k];
        if (idx > 0 && Math.abs(pt.x - acc[idx - 1].x) > maxJump) continue;
        acc.push(pt);
        cartesian(acc, idx + 1);
        acc.pop();
      }
    }
    cartesian([], 0);
    this.progressionPaths = paths;
    if (this._pathIndex >= paths.length) {
      this._pathIndex = paths.length > 0 ? paths.length - 1 : 0;
    }
    if (paths.length === 0) {
      this._activeStep = 0;
      this._clearTransition();
      this.setPlaybackRunning(false);
      return;
    }
    var activePath = paths[this._pathIndex] || paths[0];
    if (!activePath || !activePath.length) {
      this._activeStep = 0;
      this._clearTransition();
      this.setPlaybackRunning(false);
      return;
    }
    if (this._activeStep >= activePath.length) this._activeStep = activePath.length - 1;
    if (this._activeStep < 0) this._activeStep = 0;
    if (this._transitionFromStep >= activePath.length || this._transitionToStep >= activePath.length) {
      this._clearTransition();
    }
  }

  setPathIndex(i) {
    var max = this.progressionPaths.length;
    if (max === 0) return;
    var idx = i < 0 ? (i % max + max) % max : Math.min(i, max - 1);
    if (this._pathIndex === idx) return;
    this._pathIndex = idx;
    this._activeStep = 0;
    this._beatInStep = 0;
    this._clearTransition();
    this.update();
  }

  setStringSemis(arr) {
    if (this._arraysEqual(this._stringSemis, arr)) return;
    this._stringSemis = arr.slice();
    var kept = [];
    for (var i = 0; i < this._stringsUsed.length; i++) {
      var idx = this._stringsUsed[i];
      if (idx >= 0 && idx < this._stringSemis.length && kept.indexOf(idx) === -1) kept.push(idx);
    }
    if (kept.length === 0) {
      kept = this._stringSemis.length > 1
        ? [0, 1]
        : [0];
    }
    this._stringsUsed = kept;
    this.update();
  }

  setFretOffset(val) {
    var loop = this._loopFrets;
    var norm = ((val % loop) + loop) % loop;
    if (this._fretOffset === norm) return;
    this._fretOffset = norm;
    this.update();
  }

  setHanded(val) {
    if (this._handed === val) return;
    this._handed = val;
    this.update();
  }

  setFlipVertical(val) {
    if (this._flipVertical === val) return;
    this._flipVertical = val;
    this.update();
  }

  setStringsUsed(arr) {
    if (!arr) arr = [];
    var next = [];
    for (var i = 0; i < arr.length; i++) {
      var idx = parseInt(arr[i], 10);
      if (isNaN(idx)) continue;
      if (idx < 0 || idx >= this._stringSemis.length) continue;
      if (next.indexOf(idx) !== -1) continue;
      next.push(idx);
    }
    next.sort(function (a, b) { return a - b; });
    if (this._arraysEqual(this._stringsUsed, next)) return;
    this._stringsUsed = next;
    this._activeStep = 0;
    this._beatInStep = 0;
    this._clearTransition();
    this.update();
    this._syncStringFilterUI();
  }

  setChordProgression(progression) {
    if (this._arraysEqual(this._chordProgression, progression)) return;
    this._chordProgression = progression.slice();
    this._activeStep = 0;
    this._beatInStep = 0;
    this._clearTransition();
    this.update();
    if (this._progressionSelect && typeof CHORD_PROGRESSIONS !== "undefined") {
      var idx = this._findProgressionIndex(this._chordProgression);
      if (idx >= 0) this._progressionSelect.selectedIndex = idx;
    }
  }

  _findProgressionIndex(prog) {
    for (var i = 0; i < CHORD_PROGRESSIONS.length; i++) {
      var p = CHORD_PROGRESSIONS[i].progression;
      if (p.length !== prog.length) continue;
      var match = true;
      for (var j = 0; j < p.length; j++) {
        if (p[j] !== prog[j]) { match = false; break; }
      }
      if (match) return i;
    }
    return -1;
  }

  setProgressionUI(selectEl) {
    this._progressionSelect = selectEl;
  }

  setStringFilterUI(inputs) {
    if (this._stringFilterInputs === inputs) return;
    this._stringFilterInputs = inputs || [];
    this._syncStringFilterUI();
  }

  _syncStringFilterUI() {
    if (!this._stringFilterInputs || !this._stringFilterInputs.length) return;
    for (var i = 0; i < this._stringFilterInputs.length; i++) {
      var input = this._stringFilterInputs[i];
      if (!input) continue;
      var idx = parseInt(input.getAttribute("data-string-index"), 10);
      if (isNaN(idx)) continue;
      input.checked = this._stringsUsed.indexOf(idx) !== -1;
    }
  }

  setPlaybackUI(buttonEl) {
    if (this._playbackButton === buttonEl) return;
    this._playbackButton = buttonEl;
    this._syncPlaybackUI();
  }

  _syncPlaybackUI() {
    if (!this._playbackButton) return;
    this._playbackButton.textContent = this._isPlaying ? "Stop" : "Play";
    this._playbackButton.disabled = this.progressionPaths.length === 0;
  }

  togglePlayback() {
    this.setPlaybackRunning(!this._isPlaying);
  }

  setPlaybackRunning(val) {
    var next = !!val;
    if (next && this.progressionPaths.length === 0) next = false;
    if (this._isPlaying === next) return;
    this._isPlaying = next;
    if (next) {
      this._startPlayback();
    } else {
      this._stopPlayback();
    }
    this._syncPlaybackUI();
    this._startAnimationLoop();
    if (this.fretboardCanvas) this.fretboardCanvas.updateCanvas();
  }

  _startPlayback() {
    this._activeStep = 0;
    this._beatInStep = 0;
    this._lastBeatAtMs = 0;
    this._clearTransition();
    this._ensureAudioContext();
    this._runBeat();
    var self = this;
    if (this._beatTimer) window.clearInterval(this._beatTimer);
    this._beatTimer = window.setInterval(function () {
      self._runBeat();
    }, this._beatMs);
  }

  _stopPlayback() {
    if (this._beatTimer) {
      window.clearInterval(this._beatTimer);
      this._beatTimer = 0;
    }
    this._beatInStep = 0;
    this._lastBeatAtMs = 0;
    this._clearTransition();
  }

  _runBeat() {
    var path = this._getSelectedPath();
    if (!path || !path.length) {
      this.setPlaybackRunning(false);
      return;
    }
    var nowMs = performance.now();
    this._updateTransition(nowMs);
    this._lastBeatAtMs = nowMs;
    this._playBeatTone();
    this._beatInStep += 1;
    if (this._beatInStep >= this._beatsPerStep) {
      this._beatInStep = 0;
      this._beginStepTransition(nowMs);
    }
    this._startAnimationLoop();
    if (this.fretboardCanvas) this.fretboardCanvas.updateCanvas();
  }

  _getSelectedPath() {
    if (!this.progressionPaths || this.progressionPaths.length === 0) return null;
    var idx = this._pathIndex;
    if (idx < 0 || idx >= this.progressionPaths.length) idx = 0;
    return this.progressionPaths[idx];
  }

  _beginStepTransition(nowMs) {
    var path = this._getSelectedPath();
    if (!path || path.length < 2) return;
    var from = this._activeStep;
    if (from < 0 || from >= path.length) from = 0;
    var to = (from + 1) % path.length;
    if (to === from) return;
    this._transitionFromStep = from;
    this._transitionToStep = to;
    this._transitionStartMs = nowMs;
    this._transitionDurationMs = Math.round(this._beatMs * 0.75);
  }

  _clearTransition() {
    this._transitionFromStep = -1;
    this._transitionToStep = -1;
    this._transitionStartMs = 0;
  }

  _hasTransition() {
    return this._transitionStartMs > 0 && this._transitionFromStep >= 0 && this._transitionToStep >= 0;
  }

  _updateTransition(nowMs) {
    if (!this._hasTransition()) return;
    var path = this._getSelectedPath();
    if (!path || !path.length) {
      this._clearTransition();
      return;
    }
    if (this._transitionFromStep >= path.length || this._transitionToStep >= path.length) {
      this._clearTransition();
      return;
    }
    var elapsed = nowMs - this._transitionStartMs;
    if (elapsed >= this._transitionDurationMs) {
      this._activeStep = this._transitionToStep;
      this._clearTransition();
    }
  }

  _startAnimationLoop() {
    if (this._rafId) return;
    var self = this;
    function frame() {
      var nowMs = performance.now();
      self._updateTransition(nowMs);
      if (self.fretboardCanvas) self.fretboardCanvas.updateCanvas();
      if (self._isPlaying || self._hasTransition()) {
        self._rafId = window.requestAnimationFrame(frame);
        return;
      }
      self._rafId = 0;
    }
    this._rafId = window.requestAnimationFrame(frame);
  }

  _ensureAudioContext() {
    if (!this._audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this._audioCtx = new Ctx();
    }
    if (this._audioCtx.state === "suspended") this._audioCtx.resume();
    return this._audioCtx;
  }

  _playBeatTone() {
    var ctx = this._ensureAudioContext();
    if (!ctx) return;
    var path = this._getSelectedPath();
    if (!path || !path.length) return;
    var step = this._activeStep;
    if (step < 0 || step >= path.length) step = 0;
    var pt = path[step];
    var semis = this.calcSemitones(pt.y, pt.x);
    var freq = this._semitonesToFrequency(semis);
    var t = ctx.currentTime;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.14, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  _semitonesToFrequency(semis) {
    return 130.81278265 * Math.pow(2, semis / 12);
  }

  _calcPathLoopSpan(path) {
    if (!path || path.length < 2) return 0;
    var loop = this._loopFrets;
    var frets = [];
    for (var i = 0; i < path.length; i++) {
      var f = ((path[i].x + this._fretOffset) % loop + loop) % loop;
      frets.push(f);
    }
    frets.sort(function (a, b) { return a - b; });
    var largestGap = 0;
    for (var j = 0; j < frets.length - 1; j++) {
      var gap = frets[j + 1] - frets[j];
      if (gap > largestGap) largestGap = gap;
    }
    var wrapGap = loop - frets[frets.length - 1] + frets[0];
    if (wrapGap > largestGap) largestGap = wrapGap;
    return loop - largestGap;
  }

  getPlaybackMarker(nowMs) {
    var path = this._getSelectedPath();
    if (!path || !path.length) return null;
    var timeNow = typeof nowMs === "number" ? nowMs : performance.now();
    this._updateTransition(timeNow);

    var point;
    if (this._hasTransition()) {
      var from = path[this._transitionFromStep];
      var to = path[this._transitionToStep];
      var t = (timeNow - this._transitionStartMs) / this._transitionDurationMs;
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      point = {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t
      };
    } else {
      var step = this._activeStep;
      if (step < 0 || step >= path.length) step = 0;
      point = path[step];
    }

    var pulse = 0;
    if (this._isPlaying && this._lastBeatAtMs > 0) {
      var age = timeNow - this._lastBeatAtMs;
      if (age >= 0 && age <= this._beatMs) {
        pulse = 1 - age / this._beatMs;
      }
    }
    return {
      point: { x: point.x, y: point.y },
      pulse: pulse,
      playing: this._isPlaying
    };
  }

  toggleHanded() {
    this.setHanded(this._handed === "right" ? "left" : "right");
  }

  toggleFlipVertical() {
    this.setFlipVertical(!this._flipVertical);
  }

  semitonesToDegree(semis) {
    var m = ((semis % 12) + 12) % 12;
    var names = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];
    return names[m];
  }

  degreeToSemitones(deg) {
    var map = { "1": 0, "b2": 1, "2": 2, "b3": 3, "3": 4, "4": 5, "b5": 6, "5": 7, "b6": 8, "6": 9, "b7": 10, "7": 11 };
    return map[deg] !== undefined ? map[deg] : 0;
  }

  calcSemitones(stringIndex, fretIndex) {
    var loopFret = ((fretIndex + this._fretOffset) % this._loopFrets + this._loopFrets) % this._loopFrets;
    return this._stringSemis[stringIndex] % 12 + loopFret;
  }

  get stringSemis() { return this._stringSemis; }
  get handed() { return this._handed; }
  get flipVertical() { return this._flipVertical; }
  get stringsUsed() { return this._stringsUsed; }
  get pathIndex() { return this._pathIndex; }
  get chordProgression() { return this._chordProgression; }
  get isPlaying() { return this._isPlaying; }
  get visibleFrets() { return this._visibleFrets; }

  init() {
    var canvas = document.getElementById("fretboard");
    if (!canvas) return;

    this.fretboardCanvas = new FretboardCanvas(canvas, this);
    this.update();
  }
}
