(function () {
  var app = new App();

  function resize() {
    var canvas = document.getElementById("fretboard");
    if (!canvas) return;
    var frets = 11;
    var strings = app.stringSemis.length;
    var aspect = (frets * 2) / (strings + 1);
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var cw, ch;
    if (vw / vh > aspect) {
      ch = vh;
      cw = vh * aspect;
    } else {
      cw = vw;
      ch = vw / aspect;
    }
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    if (app.fretboardCanvas) {
      app.fretboardCanvas.updateCanvas();
    }
  }

  window.addEventListener("load", function () {
    resize();
    app.init();
    var sel = document.getElementById("progressionSelect");
    if (sel && typeof CHORD_PROGRESSIONS !== "undefined") {
      app.setProgressionUI(sel);
      for (var i = 0; i < CHORD_PROGRESSIONS.length; i++) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.textContent = CHORD_PROGRESSIONS[i].name;
        sel.appendChild(opt);
      }
      sel.selectedIndex = 0;
      sel.addEventListener("change", function () {
        var idx = parseInt(sel.value, 10);
        app.setChordProgression(CHORD_PROGRESSIONS[idx].progression.slice());
      });
    }
    var btn = document.getElementById("handedBtn");
    if (btn) {
      btn.addEventListener("click", function () {
        app.toggleHanded();
        btn.textContent = "Handed: " + (app.handed === "right" ? "Right" : "Left");
      });
    }
    var flipBtn = document.getElementById("flipVerticalBtn");
    if (flipBtn) {
      flipBtn.addEventListener("click", function () {
        app.toggleFlipVertical();
        flipBtn.textContent = app.flipVertical ? "Flip V ✓" : "Flip V";
      });
    }
    var shiftLeft = document.getElementById("shiftLeftBtn");
    if (shiftLeft) shiftLeft.addEventListener("click", function () { app.addFretOffset(-1); });
    var shiftRight = document.getElementById("shiftRightBtn");
    if (shiftRight) shiftRight.addEventListener("click", function () { app.addFretOffset(1); });
  });

  window.addEventListener("resize", resize);
})();
