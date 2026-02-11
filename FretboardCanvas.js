class FretboardCanvas {
  constructor(canvas, app) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.app = app;
    this.frets = 11;
    this.strings = app.stringSemis.length;
    this._progressionNoteColor = "#B8D4E8";
  }

  setProgressionNoteColor(val) {
    if (this._progressionNoteColor === val) return;
    this._progressionNoteColor = val;
    this.updateCanvas();
  }

  get progressionNoteColor() { return this._progressionNoteColor; }

  updateCanvas() {
    var self = this;
    var c = this.canvas;
    var ctx = this.ctx;
    var w = c.width;
    var h = c.height;
    var handed = this.app.handed;
    var flipV = this.app.flipVertical;

    ctx.clearRect(0, 0, w, h);

    // --- Layout: cell aspect w=2h, 11 equal fret cells ---
    var cellH = Math.min(w / (this.frets * 2), h / (this.strings + 1));
    var cellW = 2 * cellH;
    var fretboardW = this.frets * cellW;
    var fretboardH = (this.strings + 1) * cellH;
    var originX = (w - fretboardW) / 2;
    var originY = (h - fretboardH) / 2;

    var x = function (fx) {
      return originX + (handed === "left" ? fretboardW - fx : fx);
    };
    var y = function (sy) {
      return originY + (flipV ? fretboardH - sy : sy);
    };

    var neckTop = originY;
    var neckBottom = originY + fretboardH;
    var neckLeft = originX;
    var neckRight = originX + fretboardW;
    var radius = Math.min(cellW, cellH) * 0.28;

    ctx.save();
    ctx.beginPath();
    ctx.rect(neckLeft, neckTop, fretboardW, neckBottom - neckTop);
    ctx.clip();

    ctx.fillStyle = "burlywood";
    ctx.fillRect(neckLeft, neckTop, fretboardW, neckBottom - neckTop);

    var neckHeight = neckBottom - neckTop;
    var fretBarWidth = Math.max(2, neckHeight * 0.035);
    for (var f = 0; f < self.frets; f++) {
      var fx = f * cellW;
      ctx.fillStyle = "darkGoldenRod";
      ctx.fillRect(x(fx) - fretBarWidth / 2, neckTop, fretBarWidth, neckHeight);
    }

    var maxThick = cellH * 0.28;
    var minThick = cellH * 0.05;
    for (var s = 0; s < self.strings; s++) {
      var thick = self.strings > 1 ? maxThick - (maxThick - minThick) * s / (self.strings - 1) : maxThick;
      var sy = (s + 1) * cellH;
      var top = y(sy) - thick / 2;
      ctx.fillStyle = "#F5F0E6";
      ctx.fillRect(neckLeft, top, fretboardW, thick);
      ctx.strokeStyle = "#8B7355";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(neckLeft, top);
      ctx.lineTo(neckRight, top);
      ctx.moveTo(neckLeft, top + thick);
      ctx.lineTo(neckRight, top + thick);
      ctx.stroke();
    }

    for (var s = 0; s < self.strings; s++) {
      for (var f = 0; f < self.frets; f++) {
        var cx = x((f + 0.5) * cellW);
        var cy = y((s + 1) * cellH);
        var semis = self.app.calcSemitones(s, f);
        var deg = self.app.semitonesToDegree(semis);
        var prog = self.app.chordProgression || [];
        var isProg = prog.indexOf(deg) !== -1;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#333";
        ctx.stroke();
        ctx.fillStyle = isProg ? self._progressionNoteColor : "#fff";
        ctx.fill();

        ctx.fillStyle = "#333";
        ctx.font = radius + "px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(deg, cx, cy);
      }
    }

    var toPx = function (pt) {
      var fx = (pt.x + 0.5) * cellW;
      var sy = (pt.y + 1) * cellH;
      return { x: x(fx), y: y(sy) };
    };

    var paths = self.app.progressionPaths || [];
    var pathIdx = self.app.pathIndex;
    var pathsToDraw = paths.length > 0 && pathIdx >= 0 && pathIdx < paths.length
      ? [paths[pathIdx]]
      : paths;
    var alpha = pathsToDraw.length === 1 ? 0.6 : 0.35;
    ctx.strokeStyle = "rgba(80, 80, 120, " + alpha + ")";
    ctx.lineWidth = Math.max(1, radius * 0.4);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (var pi = 0; pi < pathsToDraw.length; pi++) {
      var path = pathsToDraw[pi];
      for (var j = 0; j < path.length - 1; j++) {
        var a = toPx(path[j]);
        var b = toPx(path[j + 1]);
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) continue;
        var headLen = Math.min(radius * 1.2, len * 0.25);
        var ux = dx / len;
        var uy = dy / len;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x - ux * headLen, b.y - uy * headLen);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - ux * headLen - uy * headLen * 0.5, b.y - uy * headLen + ux * headLen * 0.5);
        ctx.lineTo(b.x - ux * headLen + uy * headLen * 0.5, b.y - uy * headLen - ux * headLen * 0.5);
        ctx.closePath();
        ctx.fillStyle = "rgba(80, 80, 120, " + alpha + ")";
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
