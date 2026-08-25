/* =====================================================================
   eddiekong.com — behaviour

     1.  Tab routing (hash based, back/forward friendly)
     2.  Sliding nav underline
     3.  Scroll reveals
     4.  Panel spotlight (cursor-tracking glow)
     5.  Hero collage parallax
     6.  Constellation canvas backdrop
     7.  Text scramble + typewriter + title glitch
     8.  Boot sequence
     9.  Photo lightbox
     10. Command palette + shortcut sheet + keyboard shortcuts
     11. Status bar

   No dependencies. Everything degrades to a plain stacked page if this
   file fails to load, and every effect is skipped under reduced motion.
   ===================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover     = window.matchMedia('(hover: hover)').matches;

  function store(key, value) {
    // sessionStorage throws in some privacy modes — never let that break boot.
    try {
      if (value === undefined) return window.sessionStorage.getItem(key);
      window.sessionStorage.setItem(key, value);
    } catch (err) { return null; }
  }

  /* ---------- 1. Tab routing --------------------------------------- */

  var views  = Array.prototype.slice.call(document.querySelectorAll('.view'));
  var tabs   = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var glider = document.querySelector('.tab-glider');
  var ids    = views.map(function (v) { return v.id; });
  var DEFAULT_ID = ids[0];
  var current = null;
  var bootRunning = false;

  function idFromHash() {
    var id = (location.hash || '').replace('#', '');
    return ids.indexOf(id) !== -1 ? id : DEFAULT_ID;
  }

  function show(id, opts) {
    if (id === current) return;
    current = id;

    views.forEach(function (view) {
      var on = view.id === id;
      view.classList.toggle('is-active', on);
      if (on) { view.removeAttribute('hidden'); } else { view.setAttribute('hidden', ''); }
    });

    var activeTab = null;
    tabs.forEach(function (tab) {
      var on = tab.getAttribute('href') === '#' + id;
      if (on) { tab.setAttribute('aria-current', 'page'); activeTab = tab; }
      else    { tab.removeAttribute('aria-current'); }
    });

    // Re-themes the whole page: css/styles.css keys every accent off this.
    document.documentElement.setAttribute('data-section', id);
    readAccent();

    moveGlider(activeTab);
    if (activeTab) activeTab.scrollIntoView({ block: 'nearest', inline: 'center' });

    // Each tab starts at the top. On first load this undoes the browser's
    // native jump to the anchor when someone opens a deep link like #dog.
    var initial = opts && opts.initial;
    window.scrollTo({ top: 0, behavior: initial || reduceMotion ? 'auto' : 'smooth' });

    revealVisible();
    if (!bootRunning) sectionFX(id);
    if (sbSection) sbSection.textContent = id;
  }

  // Internal links drive the router directly, so the browser never performs
  // its own anchor jump and then has to be scrolled back.
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var id = link.getAttribute('href').slice(1);
    if (ids.indexOf(id) === -1) return;
    e.preventDefault();
    if (id === current) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      return;
    }
    history.pushState(null, '', '#' + id);
    show(id);
  });

  function go(id) {
    if (id === current) return;
    history.pushState(null, '', '#' + id);
    show(id);
  }

  window.addEventListener('hashchange', function () { show(idFromHash()); });
  window.addEventListener('popstate',   function () { show(idFromHash()); });

  /* ---------- 2. Sliding nav underline ------------------------------ */

  function moveGlider(tab) {
    if (!glider || !tab) return;
    glider.style.width = tab.offsetWidth + 'px';
    glider.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    glider.classList.add('ready');
  }

  function refreshGlider() {
    moveGlider(document.querySelector('.tab[aria-current="page"]'));
  }
  window.addEventListener('resize', refreshGlider);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshGlider);

  /* ---------- 3. Scroll reveals ------------------------------------ */

  var revealables = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var observer = null;

  function reveal(el) {
    el.classList.add('in-view');
    if (observer) observer.unobserve(el);
  }

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) reveal(entry.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach(function (el) { observer.observe(el); });
  } else {
    revealables.forEach(reveal);
  }

  // Belt and braces after a tab switch: anything already on screen in the
  // newly shown section gets revealed without waiting for a scroll.
  function revealVisible() {
    revealables.forEach(function (el) {
      if (el.classList.contains('in-view')) return;
      if (!el.offsetParent) return;
      var box = el.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) reveal(el);
    });
  }

  /* ---------- 4. Panel spotlight ----------------------------------- */

  if (canHover) {
    document.addEventListener('pointermove', function (e) {
      var panel = e.target.closest && e.target.closest('.panel');
      if (!panel) return;
      var box = panel.getBoundingClientRect();
      panel.style.setProperty('--mx', (e.clientX - box.left) + 'px');
      panel.style.setProperty('--my', (e.clientY - box.top) + 'px');
    }, { passive: true });
  }

  /* ---------- 5. Hero collage parallax ------------------------------ */

  var collage = document.querySelector('.collage');
  if (collage && !reduceMotion && canHover) {
    window.addEventListener('pointermove', function (e) {
      if (current !== 'home') return;
      var x = (e.clientX / window.innerWidth  - 0.5) * 20;
      var y = (e.clientY / window.innerHeight - 0.5) * 20;
      collage.style.setProperty('--px', x.toFixed(1) + 'px');
      collage.style.setProperty('--py', y.toFixed(1) + 'px');
    }, { passive: true });
  }

  /* ---------- 6. Constellation canvas ------------------------------- */

  var accent = '#a06bff';

  function readAccent() {
    var value = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    if (value) accent = value;
  }
  readAccent();

  var canvas = document.getElementById('net');
  var net = null;

  if (canvas && canvas.getContext && !reduceMotion) {
    net = (function () {
      var ctx = canvas.getContext('2d');
      var nodes = [];
      var w = 0, h = 0, dpr = 1;
      var pointer = { x: -999, y: -999 };
      var raf = null;
      var LINK = 138;      // px between nodes before a line is drawn
      var PULL = 190;      // px around the cursor that lines reach for

      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width  = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Density scaled to the viewport, capped so phones stay smooth.
        var target = Math.round((w * h) / 20000);
        target = Math.max(24, Math.min(target, 84));
        nodes = [];
        for (var i = 0; i < target; i++) {
          nodes.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            r: Math.random() * 1.4 + 0.7
          });
        }
      }

      function frame() {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = accent;
        ctx.fillStyle = accent;

        var i, j, a, b, dx, dy, dist;

        for (i = 0; i < nodes.length; i++) {
          a = nodes[i];
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
          if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;

          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
          ctx.fill();

          // line to the cursor
          dx = a.x - pointer.x; dy = a.y - pointer.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < PULL) {
            ctx.globalAlpha = (1 - dist / PULL) * 0.42;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }

          // lines to nearby nodes
          for (j = i + 1; j < nodes.length; j++) {
            b = nodes[j];
            dx = a.x - b.x; dy = a.y - b.y;
            if (dx > LINK || dx < -LINK || dy > LINK || dy < -LINK) continue;
            dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > LINK) continue;
            ctx.globalAlpha = (1 - dist / LINK) * 0.22;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(frame);
      }

      function start() { if (raf === null) raf = requestAnimationFrame(frame); }
      function stop()  { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }

      resize();
      start();

      window.addEventListener('resize', resize);
      window.addEventListener('pointermove', function (e) {
        pointer.x = e.clientX; pointer.y = e.clientY;
      }, { passive: true });
      window.addEventListener('pointerleave', function () {
        pointer.x = -999; pointer.y = -999;
      });
      // Don't burn CPU in a background tab.
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });

      return { start: start, stop: stop };
    })();
  }

  /* ---------- 7. Scramble, typewriter, glitch ----------------------- */

  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>/\\[]{}=+-_';
  var timers = new WeakMap();

  function original(el) {
    if (!el.dataset.text) el.dataset.text = el.textContent;
    return el.dataset.text;
  }

  // Decodes text out of random glyphs. Timer driven rather than rAF so it
  // still lands when the tab isn't producing frames.
  function scramble(el) {
    var text = original(el);
    var frame = 0;
    var queue = [];
    var i;

    for (i = 0; i < text.length; i++) {
      queue.push({ ch: text[i], start: Math.floor(Math.random() * 8), end: Math.floor(Math.random() * 12) + 8 });
    }

    cancel(el);
    (function step() {
      var out = '';
      var done = 0;
      for (i = 0; i < queue.length; i++) {
        var q = queue[i];
        if (frame >= q.end)        { out += q.ch; done++; }
        else if (frame >= q.start) { out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; }
        else                       { out += ' '; }
      }
      el.textContent = out;
      if (done === queue.length) { el.textContent = text; return; }
      frame++;
      timers.set(el, { id: setTimeout(step, 40) });
    })();
  }

  function typeIn(el, speed) {
    var text = original(el);
    cancel(el);
    el.textContent = '';
    var i = 0;
    (function step() {
      el.textContent = text.slice(0, ++i);
      if (i >= text.length) return;
      timers.set(el, { id: setTimeout(step, speed + Math.random() * speed) });
    })();
  }

  function cancel(el) {
    var t = timers.get(el);
    if (!t) return;
    if (t.id) clearTimeout(t.id);
    timers.delete(el);
  }

  function sectionFX(id) {
    var view = document.getElementById(id);
    if (!view) return;

    if (reduceMotion) {
      // Make sure any text that a previous run emptied is restored.
      view.querySelectorAll('.typed, .scramble').forEach(function (el) {
        el.textContent = original(el);
      });
      return;
    }

    view.querySelectorAll('.typed').forEach(function (el, i) {
      original(el);            // stash the real text before blanking it
      el.textContent = '';
      setTimeout(function () { typeIn(el, el.classList.contains('lede') ? 16 : 34); }, 120 + i * 90);
    });

    view.querySelectorAll('.scramble').forEach(function (el, i) {
      setTimeout(function () { scramble(el); }, 60 + i * 110);
    });

    var title = view.querySelector('.section-title, .display');
    if (title) {
      title.classList.remove('glitching');
      void title.offsetWidth;           // restart the animation
      title.classList.add('glitching');
    }
  }

  /* ---------- 8. Boot sequence -------------------------------------- */

  var boot = document.getElementById('boot');
  var bootLog = document.getElementById('boot-log');

  var BOOT_LINES = [
    ['booting eddiekong.com', 'dim'],
    ['> mounting /home /facts /photos /opinions', ''],
    ['> loading dog module ................ ', 'ok:OK'],
    ['> fetching opinions ................. ', 'ok:LOADED'],
    ['> checking life.log ................. ', 'ok:FRESH'],
    ['> ready_', 'ok']
  ];

  function runBoot(done) {
    bootRunning = true;
    boot.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    var i = 0;
    var timer = null;

    function finish() {
      if (!bootRunning) return;
      bootRunning = false;
      clearTimeout(timer);
      document.removeEventListener('keydown', skip, true);
      boot.removeEventListener('click', skip);
      boot.classList.add('done');
      document.body.style.overflow = '';
      setTimeout(function () { boot.setAttribute('hidden', ''); }, 320);
      store('booted', '1');
      done();
    }

    // Swallow the skipping keypress so it doesn't also trigger a shortcut.
    function skip(e) {
      if (e && e.type === 'keydown') { e.preventDefault(); e.stopPropagation(); }
      finish();
    }

    function next() {
      if (i >= BOOT_LINES.length) { timer = setTimeout(finish, 380); return; }
      var line = BOOT_LINES[i++];
      var span = document.createElement('span');
      var cls = line[1];
      if (cls.indexOf('ok:') === 0) {
        span.textContent = line[0];
        var tag = document.createElement('span');
        tag.className = 'ok';
        tag.textContent = '[ ' + cls.slice(3) + ' ]';
        bootLog.appendChild(span);
        bootLog.appendChild(tag);
      } else {
        span.className = cls;
        span.textContent = line[0];
        bootLog.appendChild(span);
      }
      bootLog.appendChild(document.createTextNode('\n'));
      timer = setTimeout(next, 190 + Math.random() * 90);
    }

    document.addEventListener('keydown', skip, true);
    boot.addEventListener('click', skip);
    next();
  }

  /* ---------- 9. Photo lightbox ------------------------------------- */

  var lightbox = document.getElementById('lightbox');
  var lbImg    = lightbox.querySelector('.lb-img');
  var lbCap    = lightbox.querySelector('.lb-caption');
  var lbClose  = lightbox.querySelector('.lb-close');
  var lbPrev   = lightbox.querySelector('.lb-prev');
  var lbNext   = lightbox.querySelector('.lb-next');
  var group    = [];
  var index    = 0;
  var opener   = null;

  function renderShot() {
    var btn = group[index];
    if (!btn) return;
    var img = btn.querySelector('img');
    lbImg.src = btn.dataset.full || img.src;
    lbImg.alt = img.alt || '';
    lbCap.textContent = btn.dataset.caption || '';
    lbImg.style.animation = 'none';
    void lbImg.offsetWidth;
    lbImg.style.animation = '';
  }

  function openLightbox(btn) {
    var container = btn.closest('.gallery, .dog-strip') || document;
    group = Array.prototype.slice.call(container.querySelectorAll('.shot-btn'));
    index = group.indexOf(btn);
    opener = btn;
    renderShot();
    lightbox.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (opener) opener.focus();
    opener = null;
  }

  function step(delta) {
    if (!group.length) return;
    index = (index + delta + group.length) % group.length;
    renderShot();
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.shot-btn');
    if (btn) { e.preventDefault(); openLightbox(btn); }
  });

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', function () { step(-1); });
  lbNext.addEventListener('click', function () { step(1); });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  /* ---------- 10. Command palette + shortcuts ----------------------- */

  var palette   = document.getElementById('palette');
  var palInput  = document.getElementById('palette-input');
  var palList   = document.getElementById('palette-list');
  var palOpenBtn = document.getElementById('palette-open');
  var sheet     = document.getElementById('sheet');
  var sheetOpen = document.getElementById('sheet-open');
  var palIndex  = 0;
  var palMatches = [];
  var lastFocus = null;

  var COMMANDS = tabs.map(function (tab, i) {
    return {
      id: tab.getAttribute('href').slice(1),
      label: tab.textContent.trim(),
      key: String(i + 1)
    };
  });

  function renderPalette() {
    var query = palInput.value.trim().toLowerCase();
    palMatches = COMMANDS.filter(function (c) {
      return !query || c.label.indexOf(query) !== -1 || c.id.indexOf(query) !== -1;
    });
    if (palIndex >= palMatches.length) palIndex = 0;

    palList.innerHTML = '';
    if (!palMatches.length) {
      var empty = document.createElement('li');
      empty.className = 'pl-empty';
      empty.textContent = 'no matching section';
      palList.appendChild(empty);
      return;
    }
    palMatches.forEach(function (c, i) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === palIndex ? 'true' : 'false');
      li.innerHTML = '<span>cd ~/' + c.id + '</span><span class="pl-key">' + c.key + '</span>';
      li.addEventListener('click', function () { closePalette(); go(c.id); });
      li.addEventListener('pointermove', function () {
        if (palIndex === i) return;
        palIndex = i;
        renderPalette();
      });
      palList.appendChild(li);
    });
  }

  function openPalette() {
    lastFocus = document.activeElement;
    palette.removeAttribute('hidden');
    palInput.value = '';
    palIndex = 0;
    renderPalette();
    palInput.focus();
  }

  function closePalette() {
    palette.setAttribute('hidden', '');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openSheet() {
    lastFocus = document.activeElement;
    sheet.removeAttribute('hidden');
  }
  function closeSheet() {
    sheet.setAttribute('hidden', '');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  palInput.addEventListener('input', function () { palIndex = 0; renderPalette(); });

  if (palOpenBtn) palOpenBtn.addEventListener('click', openPalette);
  if (sheetOpen) sheetOpen.addEventListener('click', function (e) { e.preventDefault(); openSheet(); });
  palette.addEventListener('click', function (e) { if (e.target === palette) closePalette(); });
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });

  document.addEventListener('keydown', function (e) {
    if (!e.key) return;
    var typing = /^(INPUT|TEXTAREA)$/.test(e.target.tagName) || e.target.isContentEditable;

    // Command palette
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.hasAttribute('hidden') ? openPalette() : closePalette();
      return;
    }

    // Lightbox owns the keyboard while it is open.
    if (!lightbox.hasAttribute('hidden')) {
      if (e.key === 'Escape')     { closeLightbox(); }
      if (e.key === 'ArrowLeft')  { step(-1); }
      if (e.key === 'ArrowRight') { step(1); }
      if (e.key === 'Tab') {
        var focusable = [lbClose, lbPrev, lbNext];
        var at = focusable.indexOf(document.activeElement);
        e.preventDefault();
        var nxt = e.shiftKey ? at - 1 : at + 1;
        focusable[(nxt + focusable.length) % focusable.length].focus();
      }
      return;
    }

    if (!palette.hasAttribute('hidden')) {
      if (e.key === 'Escape')    { e.preventDefault(); closePalette(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); palIndex = Math.min(palIndex + 1, palMatches.length - 1); renderPalette(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); palIndex = Math.max(palIndex - 1, 0); renderPalette(); }
      if (e.key === 'Enter' && palMatches[palIndex]) {
        e.preventDefault();
        var target = palMatches[palIndex].id;
        closePalette();
        go(target);
      }
      return;
    }

    if (!sheet.hasAttribute('hidden')) {
      if (e.key === 'Escape') { e.preventDefault(); closeSheet(); }
      return;
    }

    if (typing) return;

    if (e.key === '?') { e.preventDefault(); openSheet(); return; }

    // Number keys jump straight to a section.
    if (/^[1-9]$/.test(e.key)) {
      var cmd = COMMANDS[parseInt(e.key, 10) - 1];
      if (cmd) { e.preventDefault(); go(cmd.id); }
      return;
    }

    // Left/right walk the tabs.
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var at2 = ids.indexOf(current);
      if (at2 === -1) return;
      var delta = e.key === 'ArrowRight' ? 1 : -1;
      e.preventDefault();
      go(ids[(at2 + delta + ids.length) % ids.length]);
    }
  });

  /* ---------- 11. Status bar ---------------------------------------- */

  var sbSection = document.getElementById('sb-section');
  var sbView    = document.getElementById('sb-view');
  var sbClock   = document.getElementById('sb-clock');
  var sbUptime  = document.getElementById('sb-uptime');
  var started   = Date.now();

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function tickStatus() {
    if (sbClock) {
      var now = new Date();
      sbClock.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    }
    if (sbUptime) {
      var secs = Math.floor((Date.now() - started) / 1000);
      sbUptime.textContent = pad(Math.floor(secs / 60)) + ':' + pad(secs % 60);
    }
  }

  function sizeStatus() {
    if (sbView) sbView.textContent = window.innerWidth + '×' + window.innerHeight;
  }

  window.addEventListener('resize', sizeStatus);
  setInterval(tickStatus, 1000);
  tickStatus();
  sizeStatus();

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- boot -------------------------------------------------- */

  var wantsBoot = boot && !reduceMotion && !store('booted');

  if (wantsBoot) bootRunning = true;   // hold the section effects back
  show(idFromHash(), { initial: true });

  if (wantsBoot) {
    runBoot(function () { sectionFX(current); });
  } else if (boot) {
    boot.parentNode.removeChild(boot);
    sectionFX(current);
  }

  requestAnimationFrame(refreshGlider);
  window.addEventListener('load', refreshGlider);
})();
