/* ═══════════════════════════════════════════
   VISUAL EFFECTS (presentation only — no app logic)
   - Comet cursor inside the hero
   - Hero bloom + logomark parallax on mouse
   - Scroll-reveal for sections (gated so no-JS shows all)
═══════════════════════════════════════════ */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Comet cursor (hero-scoped, continuous tapered canvas trail) ---- */
  function initComet() {
    var hero = document.querySelector('.hero');
    var canvas = document.querySelector('.hero__comet');
    if (!hero || !canvas || reduce) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      var r = hero.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var pts = [];                 // trail history (head = last)
    var MAX = 32;                 // length of the comet
    var target = { x: -1e3, y: -1e3 };
    var head = { x: -1e3, y: -1e3 };
    var active = false, raf = null;

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      if (head.x < -500) { head.x = target.x; head.y = target.y; }
      if (!active) { active = true; canvas.style.opacity = '1'; }
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener('pointerleave', function () {
      active = false;
      canvas.style.opacity = '0';
    });

    function loop() {
      // ease head toward cursor → the trail bends on curves, straightens on fast straight moves
      head.x += (target.x - head.x) * 0.3;
      head.y += (target.y - head.y) * 0.3;
      pts.push({ x: head.x, y: head.y });
      if (pts.length > MAX) pts.shift();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (pts.length > 3) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'lighter';
        // Soft, low-contrast comet: wide blue haze → mid body → gentle pale core.
        drawSmooth(36, function (t) { return 'rgba(40,60,255,' + (0.045 * t) + ')'; });
        drawSmooth(20, function (t) { return 'rgba(80,95,250,' + (0.085 * t) + ')'; });
        drawSmooth(10, function (t) { return 'rgba(130,148,255,' + (0.12 * t) + ')'; });
        drawSmooth(4,  function (t) { return 'rgba(190,205,235,' + (0.16 * t) + ')'; });
      }

      var moving = Math.abs(target.x - head.x) > 0.4 || Math.abs(target.y - head.y) > 0.4;
      if (active || moving || pts.length) {
        if (!active && !moving) { pts.shift(); if (!pts.length) { raf = null; return; } }
        raf = requestAnimationFrame(loop);
      } else { raf = null; }
    }

    // Smooth tapered ribbon: quadratic curve through midpoints of the trail,
    // drawn segment-by-segment so width can taper head→tail (no hard polyline kinks).
    function drawSmooth(headW, colorFn) {
      var n = pts.length;
      for (var i = n - 1; i >= 2; i--) {
        var t = i / (n - 1);                    // 1 head → 0 tail
        var p0 = pts[i], p1 = pts[i - 1], p2 = pts[i - 2];
        var mid1x = (p0.x + p1.x) / 2, mid1y = (p0.y + p1.y) / 2;
        var mid2x = (p1.x + p2.x) / 2, mid2y = (p1.y + p2.y) / 2;
        ctx.beginPath();
        ctx.moveTo(mid1x, mid1y);
        ctx.quadraticCurveTo(p1.x, p1.y, mid2x, mid2y);   // p1 as control point → smooth
        ctx.lineWidth = Math.max(0.5, headW * t * t);
        ctx.strokeStyle = colorFn(t);
        ctx.stroke();
      }
    }
  }

  /* ---- 2. Hero parallax (blooms + logomark drift toward cursor) ---- */
  function initParallax() {
    var hero = document.querySelector('.hero');
    if (!hero || reduce) return;
    var blueB = hero.querySelector('.hero__bloom--blue');
    var limeB = hero.querySelector('.hero__bloom--lime');
    var mark = hero.querySelector('.hero__logomark');
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5);   // -0.5 … 0.5
      ty = ((e.clientY - r.top) / r.height - 0.5);
      if (!raf) raf = requestAnimationFrame(tick);
    });

    function tick() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (blueB) blueB.style.translate = (cx * 34) + 'px ' + (cy * 34) + 'px';
      if (limeB) limeB.style.translate = (cx * -26) + 'px ' + (cy * -26) + 'px';
      if (mark) mark.style.translate = (cx * -22) + 'px ' + (cy * -22) + 'px';
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) { raf = requestAnimationFrame(tick); }
      else { raf = null; }
    }
  }

  /* ---- 3. Scroll-reveal (gated by body.fx-ready) ---- */
  function initReveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    document.body.classList.add('fx-ready');
    var targets = document.querySelectorAll('.home-section');
    function reveal(el) { el.classList.add('in-view'); }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { io.observe(t); });
    // Fail-safe: never let a section stay hidden if IO doesn't fire as expected.
    setTimeout(function () { targets.forEach(reveal); }, 2600);
  }

  function boot() { initComet(); initParallax(); initReveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
