(function () {
  var app = new App();
  var stringFilterInputs = [];

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
    cw = Math.max(1, Math.round(cw));
    ch = Math.max(1, Math.round(ch));
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    app.update();
  }

  function layoutStringFilters() {
    var canvas = document.getElementById("fretboard");
    var host = document.getElementById("stringFilters");
    if (!canvas || !host) return;
    var rect = canvas.getBoundingClientRect();
    var w = rect.width;
    var h = rect.height;
    if (w <= 0 || h <= 0) return;

    host.style.left = (rect.left + window.scrollX) + "px";
    host.style.top = (rect.top + window.scrollY) + "px";
    host.style.width = w + "px";
    host.style.height = h + "px";

    var frets = 11;
    var strings = app.stringSemis.length;
    var cellH = Math.min(w / (frets * 2), h / (strings + 1));
    var cellW = 2 * cellH;
    var fretboardW = frets * cellW;
    var fretboardH = (strings + 1) * cellH;
    var originX = (w - fretboardW) / 2;
    var originY = (h - fretboardH) / 2;
    var left = Math.max(56, originX - 10);

    for (var s = 0; s < stringFilterInputs.length; s++) {
      var input = stringFilterInputs[s];
      if (!input || !input.parentNode) continue;
      var sy = (s + 1) * cellH;
      var y = originY + (app.flipVertical ? fretboardH - sy : sy);
      input.parentNode.style.left = left + "px";
      input.parentNode.style.top = y + "px";
    }
  }

  function rebuildStringFilters() {
    var host = document.getElementById("stringFilters");
    if (!host) return;
    host.innerHTML = "";
    stringFilterInputs = [];

    for (var s = 0; s < app.stringSemis.length; s++) {
      var row = document.createElement("label");
      row.className = "string-filter-item";

      var input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("data-string-index", s);

      var txt = document.createElement("span");
      txt.textContent = "S" + (s + 1);

      input.addEventListener("change", function () {
        var selected = [];
        for (var i = 0; i < stringFilterInputs.length; i++) {
          var cb = stringFilterInputs[i];
          if (!cb || !cb.checked) continue;
          selected.push(parseInt(cb.getAttribute("data-string-index"), 10));
        }
        app.setStringsUsed(selected);
      });

      row.appendChild(input);
      row.appendChild(txt);
      host.appendChild(row);
      stringFilterInputs.push(input);
    }

    app.setStringFilterUI(stringFilterInputs);
    layoutStringFilters();
  }

  window.addEventListener("load", function () {
    app.layoutStringFilterUI = function () { layoutStringFilters(); };
    resize();
    app.init();
    rebuildStringFilters();
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
    });
    if (pathNext) pathNext.addEventListener("click", function () {
      app.setPathIndex(app.pathIndex + 1);
    });

    app.setPathUI = function () { refreshPathUI(); };
    refreshPathUI();
    layoutStringFilters();
  });

  window.addEventListener("resize", resize);
})();
