class App {
  constructor() {
    this.stringSemis = [0, 5, 10, 15, 19, 24];
    this.fretboardCanvas = null;
    this.handed = "right";
    this.flipVertical = false;
  }

  toggleHanded() {
    this.handed = this.handed === "right" ? "left" : "right";
    if (this.fretboardCanvas) this.fretboardCanvas.updateCanvas();
  }

  toggleFlipVertical() {
    this.flipVertical = !this.flipVertical;
    if (this.fretboardCanvas) this.fretboardCanvas.updateCanvas();
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
    return this.stringSemis[stringIndex] % 12 + fretIndex;
  }

  init() {
    var canvas = document.getElementById("fretboard");
    if (!canvas) return;

    this.fretboardCanvas = new FretboardCanvas(canvas, this);
    this.fretboardCanvas.updateCanvas();
    this.fretboardCanvas.setupScroll();
  }
}
