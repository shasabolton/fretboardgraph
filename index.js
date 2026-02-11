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
    app.update();
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
        if (app.setPathUI) app.setPathUI();
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

    function refreshPathUI() {
      var lbl = document.getElementById("pathLabel");
      var prev = document.getElementById("pathPrevBtn");
      var next = document.getElementById("pathNextBtn");
      if (!lbl) return;
      var n = app.progressionPaths.length;
      var i = app.pathIndex;
      lbl.textContent = "Path " + (n > 0 ? (i + 1) + " of " + n : "0");
      if (prev) prev.disabled = n <= 1;
      if (next) next.disabled = n <= 1;
    }

    var pathPrev = document.getElementById("pathPrevBtn");
    var pathNext = document.getElementById("pathNextBtn");
    if (pathPrev) pathPrev.addEventListener("click", function () {
      app.setPathIndex(app.pathIndex - 1);
      refreshPathUI();
    });
    if (pathNext) pathNext.addEventListener("click", function () {
      app.setPathIndex(app.pathIndex + 1);
      refreshPathUI();
    });

    app.setPathUI = function () { refreshPathUI(); };
    refreshPathUI();
  });

  window.addEventListener("resize", resize);
})();
