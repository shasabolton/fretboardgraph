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
  });

  window.addEventListener("resize", resize);
})();
