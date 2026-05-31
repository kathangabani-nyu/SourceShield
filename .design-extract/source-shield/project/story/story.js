/* ============================================================
   SourceShield Story — scroll engine & focal effects
   ============================================================ */
(function () {
  const deck = document.querySelector('.deck');
  const scenes = [...document.querySelectorAll('.scene')];
  const rail = document.querySelector('.rail');
  const counter = document.querySelector('.counter');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- build progress rail ---- */
  scenes.forEach((sc, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', sc.dataset.title || 'Scene ' + (i + 1));
    const tip = document.createElement('span');
    tip.className = 'tip';
    tip.textContent = sc.dataset.title || '';
    b.appendChild(tip);
    b.addEventListener('click', () => scrollToScene(sc));
    rail.appendChild(b);
  });
  const dots = [...rail.querySelectorAll('button')];

  /* ---- active scene tracking ---- */
  let current = 0;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const idx = scenes.indexOf(e.target);
      if (e.intersectionRatio >= 0.45) {
        e.target.classList.add('active');
        current = idx;
        dots.forEach((d, i) => d.classList.toggle('on', i === idx));
        if (counter) counter.innerHTML = '<b>' + String(idx + 1).padStart(2, '0') + '</b> / ' + String(scenes.length).padStart(2, '0');
        // phase tint for the tense problem scene
        deck.classList.toggle('phase-tense', e.target.id === 's-problem');
      } else if (e.intersectionRatio < 0.12) {
        e.target.classList.remove('active');
      }
    });
  }, { root: deck, threshold: [0, 0.12, 0.45, 0.7] });
  scenes.forEach((s) => io.observe(s));

  /* ---- keyboard navigation for live presenting ---- */
  window.addEventListener('keydown', (ev) => {
    if (['ArrowDown', 'PageDown', ' '].includes(ev.key)) { ev.preventDefault(); go(current + 1); }
    else if (['ArrowUp', 'PageUp'].includes(ev.key)) { ev.preventDefault(); go(current - 1); }
    else if (ev.key === 'Home') { ev.preventDefault(); go(0); }
    else if (ev.key === 'End') { ev.preventDefault(); go(scenes.length - 1); }
  });
  function go(i) {
    i = Math.max(0, Math.min(scenes.length - 1, i));
    scrollToScene(scenes[i]);
  }
  // snap fights programmatic jumps — briefly lift it, scroll, then restore
  let snapTimer;
  function scrollToScene(sc) {
    deck.style.scrollSnapType = 'none';
    deck.scrollTo({ top: sc.offsetTop, behavior: reduce ? 'auto' : 'smooth' });
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => { deck.style.scrollSnapType = ''; }, reduce ? 60 : 760);
  }

  /* ---- hide scroll hint after first move ---- */
  const hint = document.querySelector('.scroll-hint');
  if (hint) deck.addEventListener('scroll', () => { hint.style.opacity = '0'; }, { once: true });

  /* ---- PROBLEM: generate leaking particles ---- */
  const leak = document.querySelector('.leak');
  if (leak) {
    const eye = leak.querySelector('.eye');
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('span');
      p.className = 'particle focal';
      const oy = (Math.random() * 120 - 60);
      p.style.setProperty('--oy', oy + 'px');
      p.style.setProperty('--dx', (520 + Math.random() * 60) + 'px');
      p.style.top = 'calc(50% + ' + oy + 'px)';
      p.style.animationDelay = (Math.random() * 4.2).toFixed(2) + 's';
      p.style.animationDuration = (3.6 + Math.random() * 1.6).toFixed(2) + 's';
      leak.appendChild(p);
    }
  }

  /* ---- SECURE MEMORY: scramble plaintext into ciphertext ---- */
  const cipher = document.querySelector('.seal .cipher');
  if (cipher) {
    const hex = '0123456789abcdef';
    const target = 'a3f9 7c21 e8b4\n6d05 f11a 9e7c\n2b88 c4d3 0a6f';
    let raf;
    function scramble() {
      const sc = document.querySelector('#s-memory');
      if (!sc || !sc.classList.contains('active')) { raf = requestAnimationFrame(scramble); return; }
      const out = target.split('').map((ch) => {
        if (ch === ' ' || ch === '\n') return ch;
        return Math.random() < 0.78 ? hex[(Math.random() * 16) | 0] : ch;
      }).join('');
      cipher.textContent = out;
      setTimeout(() => { raf = requestAnimationFrame(scramble); }, 90);
    }
    if (!reduce) scramble(); else cipher.textContent = target;
  }

  /* ---- OUR APP: sequence the flow steps lighting up ---- */
  const flow = document.querySelector('.flow');
  if (flow) {
    const steps = [...flow.querySelectorAll('.fstep')];
    let timer;
    function runFlow() {
      const sc = document.querySelector('#s-app');
      if (!sc || !sc.classList.contains('active') || reduce) {
        if (reduce) steps.forEach((s) => s.classList.add('lit'));
        timer = setTimeout(runFlow, 700); return;
      }
      let i = 0;
      steps.forEach((s) => s.classList.remove('lit'));
      const tick = () => {
        if (!sc.classList.contains('active')) { timer = setTimeout(runFlow, 700); return; }
        if (i < steps.length) { steps[i].classList.add('lit'); i++; timer = setTimeout(tick, 900); }
        else { timer = setTimeout(() => { steps.forEach((s) => s.classList.remove('lit')); timer = setTimeout(tick, 600); }, 2600); }
      };
      tick();
    }
    runFlow();
  }

  /* ---- WHY IT WINS: position stars + draw connecting lines ---- */
  const constel = document.querySelector('.constel');
  if (constel) {
    const stars = [...constel.querySelectorAll('.star')];
    const svg = constel.querySelector('svg');
    const cx = 50, cy = 50, rx = 40, ry = 38;
    function layout() {
      svg.innerHTML = '';
      stars.forEach((st, i) => {
        const ang = (-90 + i * (360 / stars.length)) * Math.PI / 180;
        const x = cx + rx * Math.cos(ang);
        const y = cy + ry * Math.sin(ang);
        st.style.left = x + '%';
        st.style.top = y + '%';
        st.querySelector('.pt').style.animationDelay = (i * 0.4).toFixed(2) + 's';
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ln.setAttribute('x1', cx); ln.setAttribute('y1', cy);
        ln.setAttribute('x2', x); ln.setAttribute('y2', y);
        svg.appendChild(ln);
      });
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'none');
    }
    layout();
    window.addEventListener('resize', layout);
  }

  /* activate the first scene immediately */
  scenes[0] && scenes[0].classList.add('active');
})();
