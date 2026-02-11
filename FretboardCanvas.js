class FretboardCanvas {
  constructor(canvas, app) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.app = app;
    this.frets = 11;
    this.strings = app.stringSemis.length;
    this.scrollOffset = 0;
    this._lastX = 0;
  }

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

    var drawOffset = ((this.scrollOffset % fretboardW) + fretboardW) % fretboardW;

    var x = function (fx) {
      return originX + (handed === "left" ? fretboardW - fx : fx);
    };
    var y = function (sy) {
      return originY + (flipV ? fretboardH - sy : sy);
    };

    // --- Wood neck: burlywood, no margin ---
    var neckTop = originY;
    var neckBottom = originY + fretboardH;
    var neckLeft = originX;
    var neckRight = originX + fretboardW;

    var radius = Math.min(cellW, cellH) * 0.28;

    var drawPeriod = function (dx) {
      ctx.save();
      ctx.translate(-drawOffset + dx, 0);
      ctx.fillStyle = "burlywood";
    ctx.fillRect(neckLeft, neckTop, neckRight - neckLeft, neckBottom - neckTop);

    // --- Fret bars: vertical bars between cells (nut at 0, bars at 1..10) ---
    var neckHeight = neckBottom - neckTop;
    var fretBarWidth = Math.max(2, neckHeight * 0.035);
    for (var f = 0; f < self.frets; f++) {
      var fx = f * cellW;
      var barLeft = x(fx) - fretBarWidth / 2;
      ctx.fillStyle = "darkGoldenRod";
      ctx.fillRect(barLeft, neckTop, fretBarWidth, neckHeight);
    }

    // --- Strings: thick at index 0 (bass) to thin, pale with border ---
    var maxThick = cellH * 0.28;
    var minThick = cellH * 0.05;
    for (var s = 0; s < self.strings; s++) {
      var thick = self.strings > 1 ? maxThick - (maxThick - minThick) * s / (self.strings - 1) : maxThick;
      var sy = (s + 1) * cellH;
      var top = y(sy) - thick / 2;
      ctx.fillStyle = "#F5F0E6";
      ctx.fillRect(neckLeft, top, neckRight - neckLeft, thick);
      ctx.strokeStyle = "#8B7355";
      ctx.lineWidth = 1;
      ctx.strokeRect(neckLeft, top, neckRight - neckLeft, thick);
    }

    // --- Degree circles and labels ---
    for (var s = 0; s < self.strings; s++) {
      for (var f = 0; f < self.frets; f++) {
        var cx = x((f + 0.5) * cellW);
        var cy = y((s + 1) * cellH);
        var semis = self.app.calcSemitones(s, f);
        var deg = self.app.semitonesToDegree(semis);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#333";
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.fill();

        ctx.fillStyle = "#333";
        ctx.font = radius + "px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(deg, cx, cy);
      }
    }
      ctx.restore();
    };

    drawPeriod(0);
    drawPeriod(fretboardW);
  }

  setupScroll() {
    var self = this;
    var canvas = this.canvas;

    function getX(e) {
      if (e.touches) return e.touches[0].clientX;
      return e.clientX;
    }

    function onStart(e) {
      e.preventDefault();
      self._lastX = getX(e);
    }

    function onMove(e) {
      e.preventDefault();
      var currX = getX(e);
      self.scrollOffset -= currX - self._lastX;
      self._lastX = currX;
      self.updateCanvas();
    }

    function onEnd() {
      self._lastX = 0;
    }

    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onEnd);
    canvas.addEventListener("mousedown", onStart);
    canvas.addEventListener("mousemove", function (e) {
      if (e.buttons) onMove(e);
    });
    canvas.addEventListener("mouseup", onEnd);
    canvas.addEventListener("mouseleave", onEnd);
  }
}
