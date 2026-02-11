class App {
  constructor() {
    this._stringSemis = [0, 5, 10, 15, 19, 24];
    this.fretboardCanvas = null;
    this._handed = "right";
    this._flipVertical = false;
    this._chordProgression = ["1", "5", "6", "4"];
    this._progressionSelect = null;
    this.semiMatrix = [];
    this._stringsUsed = [0, 1];
    this.progressionPaths = [];
    this._pathIndex = 0;
  }

  generateSemisMatrix() {
    var rows = this._stringSemis.length;
    var cols = 11;
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
    var arr = [];
    for (var i = 0; i < this._stringSemis.length; i++) {
      arr.push(this._stringSemis[i] + delta);
    }
    this.setStringSemis(arr);
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
  }

  generateProgressionPaths() {
    var prog = this._chordProgression;
    var matrix = this.semiMatrix;
    var used = this._stringsUsed;
    this.progressionPaths = [];
    if (!prog.length || !matrix.length) return;

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
      if (hits.length === 0) return;
      candidates.push(hits);
    }

    var paths = [];
    var maxJump = 3;
    function cartesian(acc, idx) {
      if (idx === candidates.length) {
        paths.push(acc.slice());
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
  }

  setPathIndex(i) {
    var max = this.progressionPaths.length;
    if (max === 0) return;
    var idx = i < 0 ? (i % max + max) % max : Math.min(i, max - 1);
    if (this._pathIndex === idx) return;
    this._pathIndex = idx;
    this.update();
  }

  setStringSemis(arr) {
    if (this._arraysEqual(this._stringSemis, arr)) return;
    this._stringSemis = arr.slice();
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
    if (this._arraysEqual(this._stringsUsed, arr)) return;
    this._stringsUsed = arr.slice();
    this.update();
  }

  setChordProgression(progression) {
    if (this._arraysEqual(this._chordProgression, progression)) return;
    this._chordProgression = progression.slice();
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
    return this._stringSemis[stringIndex] % 12 + fretIndex;
  }

  get stringSemis() { return this._stringSemis; }
  get handed() { return this._handed; }
  get flipVertical() { return this._flipVertical; }
  get stringsUsed() { return this._stringsUsed; }
  get pathIndex() { return this._pathIndex; }
  get chordProgression() { return this._chordProgression; }

  init() {
    var canvas = document.getElementById("fretboard");
    if (!canvas) return;

    this.fretboardCanvas = new FretboardCanvas(canvas, this);
    this.update();
  }
}
