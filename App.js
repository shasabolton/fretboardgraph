class App {
  constructor() {
    this._stringSemis = [0, 5, 10, 15, 19, 24];
    this.fretboardCanvas = null;
    this._handed = "right";
    this._flipVertical = false;
    this._chordProgression = [1, 5, 6, 4];
    this._progressionSelect = null;
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

  setStringSemis(arr) {
    if (this._arraysEqual(this._stringSemis, arr)) return;
    this._stringSemis = arr.slice();
    if (this.fretboardCanvas) this.fretboardCanvas.updateCanvas();
  }

  setHanded(val) {
    if (this._handed === val) return;
    this._handed = val;
    if (this.fretboardCanvas) this.fretboardCanvas.updateCanvas();
  }

  setFlipVertical(val) {
    if (this._flipVertical === val) return;
    this._flipVertical = val;
    if (this.fretboardCanvas) this.fretboardCanvas.updateCanvas();
  }

  setChordProgression(progression) {
    if (this._arraysEqual(this._chordProgression, progression)) return;
    this._chordProgression = progression.slice();
    if (this.fretboardCanvas) this.fretboardCanvas.updateCanvas();
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
  get chordProgression() { return this._chordProgression; }

  init() {
    var canvas = document.getElementById("fretboard");
    if (!canvas) return;

    this.fretboardCanvas = new FretboardCanvas(canvas, this);
    this.fretboardCanvas.updateCanvas();
  }
}
