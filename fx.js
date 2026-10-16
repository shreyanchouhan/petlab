/* VETCARE · fx.js — the motion layer, driven by Motion (motion.dev, vendored
   as motion.min.js). Everything in this file is an enhancement: delete this
   file or motion.min.js and the site runs exactly as it did before. Nothing
   below animates for prefers-reduced-motion. */
(function () {
  'use strict';
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const M = window.Motion;
  // decorative only: a failure here must never take the page down with it
  const safe = fn => { try { fn(); } catch (err) { /* leave the page as built */ } };

  /* ── scrollspy: the nav underlines the section being read ── */
  safe(() => {
    const links = [...document.querySelectorAll('.nav__links a[href^="#"]')];
    const byTarget = new Map();
    links.forEach(a => {
      const el = document.getElementById(a.getAttribute('href').slice(1));
      if (el) byTarget.set(el, a);
    });
    if (!byTarget.size) return;
    let current = null;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        if (current) current.classList.remove('active');
        current = byTarget.get(e.target);
        if (current) current.classList.add('active');
      });
    }, { rootMargin: '-35% 0px -55%' });
    byTarget.forEach((a, section) => io.observe(section));
  });

  /* ── mobile quick actions: appear after the hero, step aside at the form ── */
  safe(() => {
    const bar = document.getElementById('ctabar');
    if (!bar) return;
    const hero = document.querySelector('.hero');
    const contact = document.getElementById('contact');
    let pastHero = false, atContact = false;
    const paint = () => bar.classList.toggle('show', pastHero && !atContact);
    if (hero) new IntersectionObserver(es => {
      es.forEach(e => { pastHero = !e.isIntersecting; }); paint();
    }).observe(hero);
    if (contact) new IntersectionObserver(es => {
      es.forEach(e => { atContact = e.isIntersecting; }); paint();
    }, { threshold: 0.15 }).observe(contact);
  });

  if (calm || !M || !M.animate) return;

  const out = [0.22, 1, 0.36, 1];          // settles cleanly
  const outBack = [0.34, 1.56, 0.64, 1];   // a touch of overshoot, spring-like
  const rise = (el, dy, opt) => M.animate(el,
    { opacity: [0, 1], transform: ['translateY(' + dy + 'px)', 'translateY(0px)'] },
    Object.assign({ duration: 0.7, ease: out }, opt));

  /* ── 1 · the hero headline enters word by word ── */
  safe(() => {
    const h1 = document.querySelector('.hero h1');
    if (!h1 || h1.querySelector('.hw')) return;
    const wrapWords = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.className = 'hw';
            s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) wrapWords(child);
      });
    };
    wrapWords(h1);
    h1.classList.remove('reveal', 'in');
    h1.style.opacity = '1';
    h1.querySelectorAll('.hw').forEach((w, i) => {
      w.style.opacity = '0';
      M.animate(w, { opacity: [0, 1], transform: ['translateY(0.55em)', 'translateY(0px)'] },
        { duration: 0.75, delay: 0.15 + i * 0.055, ease: out });
    });
  });

  /* ── 2 · stat counters: numbers count up the first time they are seen.
         The markup already holds the finished figure, so without this
         block (or without JS at all) nothing is lost. ── */
  safe(() => {
    const nums = document.querySelectorAll('.num[data-to]');
    if (!nums.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target;
        const finished = el.textContent;
        const to = parseFloat(el.dataset.to);
        const suffix = el.dataset.suffix || '';
        if (!isFinite(to)) return;
        M.animate(0, to, {
          duration: 1.3, ease: out,
          onUpdate: v => { el.textContent = Math.round(v).toLocaleString('en-US') + suffix; },
          onComplete: () => { el.textContent = finished; }
        });
      });
    }, { threshold: 0.6 });
    nums.forEach(el => io.observe(el));
  });

  /* ── 3 · card grids cascade in with a spring, replacing their flat fade.
         Each child loses its .reveal before app.js's observer can fire, so
         the two systems never fight over the same element. ── */
  safe(() => {
    const GRIDS = ['.pillars__grid', '.why__cards', '.near__grid', '.tc__pillars',
                   '.gains', '.tm__stats', '.ab__stats', '.ab__certs'];
    document.querySelectorAll(GRIDS.join(',')).forEach(grid => {
      let items = [...grid.children];
      if (grid.classList.contains('reveal')) {
        if (grid.classList.contains('in')) return;
        grid.classList.remove('reveal');
      } else {
        items = items.filter(el => el.classList.contains('reveal') && !el.classList.contains('in'));
        items.forEach(el => el.classList.remove('reveal'));
      }
      if (!items.length) return;
      items.forEach(el => { el.style.opacity = '0'; });
      new IntersectionObserver((es, io) => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          io.disconnect();
          items.forEach((el, i) => M.animate(el,
            { opacity: [0, 1], transform: ['translateY(30px)', 'translateY(0px)'] },
            { duration: 0.8, delay: i * 0.1, ease: outBack }));
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px' }).observe(grid);
    });
  });

  /* ── 4 · the shift, told in sequence: the old way drags through its five
         steps, the arrow lands, and VETCARE's four snap past it ── */
  safe(() => {
    const flow = document.querySelector('.flow');
    if (!flow) return;
    const before = [...flow.querySelectorAll('.flow__panel--before .steps li')];
    const after = [...flow.querySelectorAll('.flow__panel--after .steps li')];
    const turn = flow.querySelector('.flow__turn');
    const notes = [...flow.querySelectorAll('.flow__note')];
    if (!before.length && !after.length) return;
    [...before, ...after, ...notes].forEach(el => { el.style.opacity = '0'; });
    if (turn) { turn.classList.remove('reveal', 'in'); turn.style.opacity = '0'; }
    new IntersectionObserver((es, io) => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        io.disconnect();
        before.forEach((el, i) => rise(el, 18, { delay: 0.1 + i * 0.22, duration: 0.6 }));
        if (notes[0]) rise(notes[0], 10, { delay: 0.15 + before.length * 0.22 });
        if (turn) M.animate(turn,
          { opacity: [0, 1], transform: ['scale(.55)', 'scale(1)'] },
          { duration: 0.6, delay: 0.55, ease: outBack });
        after.forEach((el, i) => rise(el, 18, { delay: 1.2 + i * 0.1, duration: 0.45 }));
        if (notes[1]) rise(notes[1], 10, { delay: 1.25 + after.length * 0.1 });
      });
    }, { threshold: 0.3 }).observe(flow);
  });

  /* ── 5 · test-menu tabs: the chosen profile's parameters cascade in
         (the pane itself already fades via the paneIn CSS animation) ── */
  safe(() => {
    const bar = document.querySelector('#menuTabs .tm__bar');
    if (!bar) return;
    const run = () => requestAnimationFrame(() => {
      const pane = document.querySelector('#menuTabs .tm__pane:not([hidden])');
      if (!pane) return;
      pane.querySelectorAll('.tm__params li').forEach((li, i) =>
        M.animate(li, { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0px)'] },
          { duration: 0.4, delay: 0.05 + i * 0.028, ease: out }));
    });
    bar.addEventListener('click', e => { if (e.target.closest('[role="tab"]')) run(); });
    bar.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') run(); });
  });

  /* ── 6 · FAQ answers ease open instead of snapping ── */
  safe(() => {
    document.querySelectorAll('.faq__list details').forEach(d => {
      d.addEventListener('toggle', () => {
        if (!d.open) return;
        const p = d.querySelector('p');
        if (p) M.animate(p, { opacity: [0, 1], transform: ['translateY(-8px)', 'translateY(0px)'] },
          { duration: 0.45, ease: out });
      });
    });
  });

  /* ── 7 · chat: the panel springs from its corner, messages pop in ── */
  safe(() => {
    const root = document.getElementById('chat');
    const panel = document.getElementById('chatPanel');
    const launcher = document.getElementById('chatLauncher');
    if (!root || !panel || !launcher) return;
    launcher.addEventListener('click', () => {
      if (root.classList.contains('open')) M.animate(panel,
        { opacity: [0, 1], transform: ['translateY(16px) scale(.95)', 'translateY(0px) scale(1)'] },
        { duration: 0.45, ease: outBack });
    });
    const log = document.getElementById('chatLog');
    if (log) new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1 && n.classList.contains('msg')) M.animate(n,
          { opacity: [0, 1], transform: ['translateY(10px) scale(.97)', 'translateY(0px) scale(1)'] },
          { duration: 0.35, ease: outBack });
      }));
    }).observe(log, { childList: true });
  });

  /* ── 8 · the route drives itself: the dashed path draws in behind the
         van as the section scrolls through, and pin B lands on arrival ── */
  safe(() => {
    if (!M.scroll) return;
    const route = document.querySelector('.near__route');
    if (!route) return;
    const svg = route.querySelector('.near__path');
    const path = svg && svg.querySelector('path');
    const van = route.querySelector('.near__van');
    const pinB = route.querySelector('.near__pin--b');
    if (!svg || !path || !van) return;
    const L = path.getTotalLength();
    van.style.animation = 'none';
    van.style.left = '0';
    van.style.top = '0';
    van.style.margin = '0';
    let landed = false;
    const place = p => {
      if (route.offsetParent === null) return;   // the route hides on small screens
      const w = route.clientWidth || 1;
      svg.style.clipPath = 'inset(-20% ' + Math.max(0, (1 - p) * 100 - 2).toFixed(2) + '% -20% -2%)';
      const pt = path.getPointAtLength(L * p);
      const ahead = path.getPointAtLength(Math.min(L, L * p + 6));
      const sx = w / 1000;                       // viewBox is 1000×70; height maps 1:1
      const ang = Math.atan2(ahead.y - pt.y, (ahead.x - pt.x) * sx) * 180 / Math.PI;
      van.style.transform = 'translate(' + (pt.x * sx - 33).toFixed(1) + 'px,' +
        (pt.y - 26).toFixed(1) + 'px) rotate(' + (ang * 0.5).toFixed(1) + 'deg)';
      if (p > 0.97 && !landed && pinB) {
        landed = true;
        M.animate(pinB, { transform: ['scale(.4)', 'scale(1)'] }, { duration: 0.5, ease: outBack });
      }
    };
    place(0);
    M.scroll(p => {
      const v = typeof p === 'number' ? p : 0;
      place(Math.min(1, Math.max(0, v)));
    }, { target: route, offset: ['start 0.95', 'start 0.35'] });
  });

  /* ── 9 · a burst of paws when a demo request goes through ── */
  safe(() => {
    const form = document.getElementById('demoForm');
    const status = document.getElementById('formStatus');
    if (!form || !status) return;
    const PAW = '<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><ellipse cx="14" cy="27" rx="6" ry="8" transform="rotate(-20 14 27)"/><ellipse cx="26" cy="14" rx="6.2" ry="8.4" transform="rotate(-6 26 14)"/><ellipse cx="40" cy="14" rx="6.2" ry="8.4" transform="rotate(6 40 14)"/><ellipse cx="52" cy="27" rx="6" ry="8" transform="rotate(20 52 27)"/><path d="M33 31c-9 0-18 10-18 19 0 6 5 9 10.5 8 3-.6 5-2 7.5-2s4.5 1.4 7.5 2C46 59 51 56 51 50c0-9-9-19-18-19z"/></svg>';
    const COLORS = ['#5B34A0', '#7A5CC4', '#A98CDC', '#C2510E'];
    form.addEventListener('submit', () => {
      setTimeout(() => {
        if (!status.classList.contains('is-ok')) return;
        const btn = form.querySelector('button[type="submit"]');
        const r = (btn || form).getBoundingClientRect();
        const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
        const burst = document.createElement('div');
        burst.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:95;overflow:hidden';
        document.body.appendChild(burst);
        for (let i = 0; i < 18; i++) {
          const s = document.createElement('span');
          const size = 14 + Math.random() * 14;
          s.style.cssText = 'position:absolute;left:0;top:0;width:' + size + 'px;height:' + size + 'px;color:' + COLORS[i % COLORS.length];
          s.innerHTML = PAW;
          burst.appendChild(s);
          const dx = (Math.random() - 0.5) * 320;
          const up = -(60 + Math.random() * 150);
          const down = 40 + Math.random() * 80;
          const rot = (Math.random() - 0.5) * 240;
          M.animate(s, {
            opacity: [1, 1, 0],
            transform: [
              'translate(' + x0 + 'px,' + y0 + 'px) scale(.3) rotate(0deg)',
              'translate(' + (x0 + dx * 0.7) + 'px,' + (y0 + up) + 'px) scale(1) rotate(' + rot * 0.6 + 'deg)',
              'translate(' + (x0 + dx) + 'px,' + (y0 + up + down) + 'px) scale(.85) rotate(' + rot + 'deg)'
            ]
          }, { duration: 1.1 + Math.random() * 0.5, ease: 'easeOut' });
        }
        setTimeout(() => burst.remove(), 1900);
      }, 60);
    });
  });

  /* ── 10 · primary buttons lean toward the pointer (fine pointers only;
         the shine sweep that pairs with this lives in the stylesheet) ── */
  safe(() => {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    document.querySelectorAll('.btn--3d').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = 'translate(' + (x * 10).toFixed(1) + 'px,' + (y * 8).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', () => {
        M.animate(btn, { transform: 'translate(0px, 0px)' }, { duration: 0.5, ease: outBack });
        // clear the inline transform once settled so CSS hover styles rule again
        setTimeout(() => { btn.style.transform = ''; }, 540);
      });
    });
  });

  /* ── 11 · the handwritten notes write themselves in, left to right.
         A CSS transition does the wipe, and the inline clip is removed
         afterwards, so the resting state is always the untouched note. ── */
  safe(() => {
    const notes = document.querySelectorAll('.script, .x-script, .ab__script, .dh__sig, .dh__tagline, .gallery__script');
    if (!notes.length) return;
    /* the resting clip leaves a hairline sliver visible: a fully clipped
       element has an empty intersection box, so the observer would never
       report it as intersecting and the note would stay hidden */
    const HID = 'inset(-15% 99.6% -15% -3%)';
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target;
        el.style.transition = 'clip-path 1.2s cubic-bezier(.22,1,.36,1)';
        void el.offsetWidth;   // commit the hidden state before the target value
        el.style.clipPath = 'inset(-15% -3% -15% -3%)';
        setTimeout(() => { el.style.clipPath = ''; el.style.transition = ''; }, 1400);
      });
    });
    notes.forEach(el => { el.style.clipPath = HID; io.observe(el); });
  });
})();
