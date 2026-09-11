/* PETLAB · vet-web-5.0 */

// ── sticky nav ──
const nav = document.getElementById('nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('stuck', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ── mobile menu ──
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', e => {
    if (e.target.tagName === 'A') { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });
}

// ── reveal on scroll ──
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { threshold: 0.14, rootMargin: '0px 0px -40px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ── 3D stages: mouse-tracked tilt + idle float (hero kit and module stage) ──
function tilt(stage, scene, baseX, ampX, ampY) {
  let tx = 0, ty = 0, cx = 0, cy = 0, hover = false;
  const t0 = performance.now();
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    tx = ((e.clientY - r.top) / r.height - 0.5) * -ampX;
    ty = ((e.clientX - r.left) / r.width - 0.5) * ampY;
    hover = true;
  });
  stage.addEventListener('pointerleave', () => { hover = false; });
  (function tick(now) {
    const idle = (now - t0) / 1000;
    const ix = hover ? 0 : Math.sin(idle * 0.7) * 2.2;
    const iy = hover ? 0 : Math.cos(idle * 0.5) * 3.0;
    cx += ((tx + ix) - cx) * 0.07;
    cy += ((ty + iy) - cy) * 0.07;
    scene.style.transform = `rotateX(${(baseX + cx).toFixed(2)}deg) rotateY(${cy.toFixed(2)}deg)`;
    requestAnimationFrame(tick);
  })(t0);
}
if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const s1 = document.getElementById('stage'), c1 = document.getElementById('scene');
  if (s1 && c1) tilt(s1, c1, 6, 10, 14);
  const s2 = document.getElementById('heroStage'), c2 = document.getElementById('heroScene');
  if (s2 && c2) tilt(s2, c2, 4, 9, 12);
}

// ── footer year ──
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── demo form ──
//  Every enquiry is handed to WhatsApp with the details already written out: it
//  reaches the sales phone instantly, needs no backend, and leaves no customer
//  data in a spreadsheet or any third-party service. Email sits underneath for
//  anyone without WhatsApp. There is deliberately no server-side capture.
const WHATSAPP     = '919395714393';        // sales WhatsApp, digits only, with country code
const NOTIFY_EMAIL = 'shreyan@mobilab.in';  // where the email fallback goes

const form = document.getElementById('demoForm');
const status = document.getElementById('formStatus');

if (form) {
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
  const PHONE_RE = /^[+]?[\d][\d\s\-()]{7,17}$/;

  const setErr = (input, msg) => {
    const box = input.getAttribute('aria-describedby');
    const el = box && document.getElementById(box);
    if (el) el.textContent = msg || '';
    input.classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };

  const rules = {
    name:  v => v.trim().length >= 2 ? '' : 'Please tell us your name.',
    email: v => EMAIL_RE.test(v.trim()) ? '' : 'Please enter a valid email address.',
    phone: v => PHONE_RE.test(v.trim()) ? '' : 'Please enter a number we can reach you on.'
  };

  // validate on blur, but only clear errors while typing, never scold mid-keystroke
  for (const key of Object.keys(rules)) {
    const input = form.elements[key];
    if (!input) continue;
    input.addEventListener('blur', () => setErr(input, rules[key](input.value)));
    input.addEventListener('input', () => { if (input.classList.contains('is-invalid')) setErr(input, rules[key](input.value)); });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    // spam trap, a bot fills every field it finds, a person never sees this one
    if (data.website) { status.className = 'form__status is-ok'; status.textContent = 'Thank you, we have your request.'; form.reset(); return; }
    delete data.website;

    let firstBad = null;
    for (const [key, rule] of Object.entries(rules)) {
      const input = form.elements[key];
      if (!input) continue;
      if (!setErr(input, rule(input.value)) && !firstBad) firstBad = input;
    }
    if (firstBad) {
      status.className = 'form__status is-error';
      status.textContent = 'Please check the highlighted fields.';
      firstBad.focus();
      return;
    }

    status.className = 'form__status';
    status.textContent = '';

    // Everything below runs synchronously on purpose. window.open is only let
    // through while the submit that triggered it is still the browser's active
    // user gesture, and awaiting anything first spends it — which is how the old
    // endpoint path used to get its WhatsApp tab swallowed by the popup blocker.
    const lines = [
      '*New demo request: PETLAB website*', '',
      'Name: ' + data.name,
      'Clinic: ' + (data.clinic || '-'),
      'Email: ' + data.email,
      'Phone: ' + data.phone,
      'City: ' + (data.city || '-'),
      data.message ? ('Message: ' + data.message) : ''
    ].filter(Boolean).join('\n');

    const wa = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lines);
    const mail = 'mailto:' + NOTIFY_EMAIL
      + '?subject=' + encodeURIComponent('PETLAB demo request: ' + data.name)
      + '&body=' + encodeURIComponent(lines.replace(/\*/g, ''));

    window.open(wa, '_blank', 'noopener');
    status.className = 'form__status is-ok';
    status.innerHTML = 'Opening WhatsApp with your details, press send and we have it. '
      + 'If WhatsApp did not open, <a href="' + wa + '" target="_blank" rel="noopener">tap here</a> '
      + 'or <a href="' + mail + '">email us instead</a>.';
  });
}

// ── gallery marquee: duplicate the track once for a seamless loop ──
const track = document.querySelector('.gallery__track');
if (track) track.innerHTML += track.innerHTML;

// ── hero film: shows its poster until asked for, so it costs nothing on load.
//    Hover or the play button starts it; it holds on the open case when done.
const film = document.getElementById('kitFilm');
if (film) {
  const hero = film.closest('.hero');
  const stageEl = document.getElementById('heroStage');
  const play = () => {
    hero && hero.classList.add('playing');
    if (film.ended) film.currentTime = 0;
    film.play().catch(() => {});
  };
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine && stageEl) stageEl.addEventListener('pointerenter', play);
  const btn = document.getElementById('kitPlay');
  if (btn) btn.addEventListener('click', e => { e.preventDefault(); play(); });
  film.addEventListener('click', e => { e.preventDefault(); play(); });
}

// ── product film: starts muted the moment it scrolls into view, pauses when it
//    leaves, and stays silent until someone asks for sound. The element carries
//    autoplay/muted/loop itself, so this refines what the browser already does
//    — and adds the controls, which stay hidden until .js is on the document.
document.querySelectorAll('[data-film]').forEach(fig => {
  const video = fig.querySelector('video');
  if (!video) return;
  const playBtn  = fig.querySelector('[data-film-play]');
  const soundBtn = fig.querySelector('[data-film-sound]');
  const soundTxt = soundBtn && soundBtn.querySelector('.prod__ctl-txt');

  // Someone who asked for less motion gets the still frame until they press play.
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  let wanted = !calm;
  if (calm) video.removeAttribute('autoplay');

  const start = () => { video.play().catch(() => {}); };

  // The button reads from intent, not from video.paused: scrolling past pauses
  // the film, and the control should not flip to 'play' because of that.
  const paint = () => {
    fig.classList.toggle('is-paused', !wanted);
    fig.classList.toggle('is-loud', !video.muted);
    if (playBtn) playBtn.setAttribute('aria-label', wanted ? 'Pause film' : 'Play film');
    if (soundBtn) soundBtn.setAttribute('aria-pressed', String(!video.muted));
    if (soundTxt) soundTxt.textContent = video.muted ? 'Unmute' : 'Mute';
  };

  // Only ever runs on screen: no sound from a section nobody is looking at, and
  // no bandwidth or battery spent on one either.
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { if (wanted) start(); }
      else video.pause();
    });
  }, { threshold: 0.35 }).observe(fig);

  if (playBtn) playBtn.addEventListener('click', () => {
    wanted = !wanted;
    if (wanted) start(); else video.pause();
    paint();
  });

  if (soundBtn) soundBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted) { wanted = true; start(); }   // asking for sound means play it
    paint();
  });

  video.addEventListener('volumechange', paint);
  paint();
});

// ── chat widget (interface only, scripted replies until the backend exists) ──
(function () {
  const root = document.getElementById('chat');
  if (!root) return;
  const launcher = document.getElementById('chatLauncher');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const log = document.getElementById('chatLog');
  const chips = document.getElementById('chatChips');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  let greeted = false;

  const CANNED = [
    [/fast|quick|time|30|minute|report/i, 'A PETLAB report is ready in about 30 minutes, sample to structured, AI-analysed result, inside a single consultation rather than the 24–48 hours a central lab takes.'],
    [/test|parameter|panel|menu|profile/i, 'Eleven parameters across five clinical profiles: Liver (AST, ALT, Total Protein, Albumin, Total Bilirubin), Kidney (Urea, Creatinine), Diabetic (Glucose), Lipid (Cholesterol, Triglyceride) and Haematology (Haemoglobin).'],
    [/where|use|clinic|home|camp|field|portable/i, 'Anywhere care happens. The unit is battery operated and packed in one rugged case, so it runs at the clinic, on a home visit, or at a mobile camp, no fixed laboratory needed.'],
    [/approv|licen|certif|cdsco|iso|regulat/i, 'The platform is CDSCO licensed (MFG/IVD/2025/000042), ISO 13485 & 9001 certified and IEC ESD compliant, and has been validated by AIIMS Delhi, the Indian Army, IIT Guwahati and hospitals in Guwahati.'],
    [/ai|intelligen|species|flag/i, 'The AI runs on the device: it applies species-specific reference ranges automatically, flags every parameter high or low, and catches anomalous readings before they mislead a diagnosis.'],
    [/demo|book|buy|price|cost|contact|sales/i, 'Happy to arrange a demonstration. Use the form at the bottom of this page, email business@mobilab.in, or call +91 93957 14393.']
  ];
  const FALLBACK = 'Thanks, the assistant is still in development, so I can only answer a few set questions for now. For anything else, email business@mobilab.in or call +91 93957 14393.';

  function bubble(text, who) {
    const p = document.createElement('p');
    p.className = 'msg msg--' + who;
    p.textContent = text;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
    return p;
  }
  function reply(q) {
    const typing = document.createElement('p');
    typing.className = 'msg msg--bot msg--typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;
    setTimeout(() => {
      typing.remove();
      const hit = CANNED.find(([re]) => re.test(q));
      bubble(hit ? hit[1] : FALLBACK, 'bot');
    }, 620);
  }
  function open() {
    root.classList.add('open');
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    if (!greeted) {
      greeted = true;
      bubble('Hello, I can answer quick questions about PETLAB: turnaround time, the test menu, where it can be used and how it is licensed. For anything else, we will put you straight through to the team.', 'bot');
    }
    input.focus();
  }
  function close() {
    root.classList.remove('open');
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }
  // role="dialog" promises a focus trap, without one, Tab walks the page behind it
  panel.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll('button,[href],input,textarea')].filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  launcher.addEventListener('click', () => (root.classList.contains('open') ? close() : open()));
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('open')) close(); });
  chips.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    bubble(b.dataset.q, 'me'); reply(b.dataset.q);
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim(); if (!q) return;
    bubble(q, 'me'); input.value = ''; reply(q);
  });
})();

// ── test-menu tabs ──
(function () {
  const root = document.getElementById('menuTabs');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const select = i => {
    tabs.forEach((t, n) => {
      const on = n === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = (i + d + tabs.length) % tabs.length;
      select(n); tabs[n].focus();
    });
  });
})();

// ── mobile menu: Escape closes it and focus returns to the toggle ──
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const links = document.getElementById('navLinks');
  if (links && links.classList.contains('open')) {
    links.classList.remove('open');
    const t = document.getElementById('navToggle');
    t.setAttribute('aria-expanded', 'false');
    t.focus();
  }
});
