/* ═══════════════════════════════════════════
   VISUAL EFFECTS (presentation only — no app logic)
   - Comet cursor inside the hero
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
    var MAX = 28;                 // max recorded points
    var MIN_DIST = 6;             // resample spacing — long segments, butt caps → seamless ribbon
    var target = { x: -1e3, y: -1e3 };
    var head = { x: -1e3, y: -1e3 };
    var active = false, raf = null, drain = 0, headAlpha = 1;

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
      head.x += (target.x - head.x) * 0.32;
      head.y += (target.y - head.y) * 0.32;

      // Resample by distance: only record a point once the head has travelled
      // MIN_DIST. Even spacing keeps segments long enough that their round caps
      // overlap into one smooth ribbon instead of a string of dots.
      var last = pts[pts.length - 1];
      if (!last || Math.hypot(head.x - last.x, head.y - last.y) >= MIN_DIST) {
        pts.push({ x: head.x, y: head.y });
        if (pts.length > MAX) pts.shift();
      } else if (!active && pts.length) {
        pts.shift();                       // retract the tail after the pointer leaves
      }

      // Holding still inside the hero: drain the tail so it never pools into a
      // bright dot under the cursor.
      var nearTarget = Math.hypot(target.x - head.x, target.y - head.y) < 0.8;
      if (active && nearTarget && pts.length) {
        drain = (drain + 1) % 2;
        if (drain === 0) pts.shift();
      }

      // Fade head glow in/out: snap to 1 when moving, ease slowly to 0 when still.
      if (active && nearTarget) {
        headAlpha += (0 - headAlpha) * 0.025;   // slow fade → ~2-3 s to dark
      } else {
        headAlpha = 1;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (pts.length > 3) {
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'lighter';
        // Soft comet in the LIME accent: wide haze → mid body → bright pale core.
        drawSmooth(72, function (t) { return 'rgba(150,240,95,'  + (0.18  * t) + ')'; });
        drawSmooth(40, function (t) { return 'rgba(196,246,108,' + (0.35  * t) + ')'; });
        drawSmooth(20, function (t) { return 'rgba(226,241,105,' + (0.55  * t) + ')'; });
        drawSmooth(8,  function (t) { return 'rgba(243,255,200,' + (0.80  * t) + ')'; });
        // Round cap on the head only — a filled circle at the cursor tip.
        var hp = pts[pts.length - 1];
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,220,' + (0.95 * headAlpha) + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(196,246,108,' + (0.55 * headAlpha) + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 40, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150,240,95,' + (0.25 * headAlpha) + ')';
        ctx.fill();
      }

      var moving = Math.hypot(target.x - head.x, target.y - head.y) > 0.4;
      if (active || moving || pts.length > 1 || headAlpha > 0.01) {
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

  /* ---- 2. Scroll-reveal (gated by body.fx-ready) ---- */
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

  /* ---- 3. Generic scroll-reveal (planning / portfolio / cards) ---- */
  function initGenericReveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    document.body.classList.add('fx-ready');
    var SEL = '.industry-section, .portfolio-grid > *, .school-grid-card, .person-card, .offer-card, .course-card';
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    function stagger(el) {
      var i = 0, p = el;
      while ((p = p.previousElementSibling) && i < 9) i++;
      el.style.transitionDelay = (Math.min(i, 9) * 0.05) + 's';
    }
    function scan() {
      document.querySelectorAll(SEL).forEach(function (el) {
        if (el.__fxr) return;
        el.__fxr = true;
        el.classList.add('fx-reveal');
        stagger(el);
        io.observe(el);
      });
    }
    scan();
    var mo = new MutationObserver(function () { scan(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function boot() { initComet(); initReveal(); initGenericReveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
