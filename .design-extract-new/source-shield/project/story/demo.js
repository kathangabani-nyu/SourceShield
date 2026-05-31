/* ============================================================
   SourceShield Demo Logic
   Client-side demo mode — no backend required
   ============================================================ */
(function () {

  /* ---- demo data store ---- */
  const store = {
    tips: [
      {
        id: 'TIP-4471', channel: 'iMessage', status: 'new',
        raw: 'Sarah Chen from procurement told me that on March 15th, the Westfield distribution contracts were backdated by about six weeks to avoid the audit window. She has the original timestamps and can be reached at +1 415 555 0179.',
        safe: '<span class="sensitive">Sarah Chen</span> from procurement told me that on <span class="sensitive">March 15th</span>, the <span class="sensitive">Westfield distribution</span> contracts were backdated by about six weeks to avoid the audit window. She has the original timestamps and can be reached at <span class="sensitive">+1 415 555 0179</span>.',
        summary: '<span class="redact-token" data-t="[name]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> from procurement reported that on <span class="redact-token" data-t="[date]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, contracts at <span class="redact-token" data-t="[location]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> were backdated to avoid an audit window. Source has original timestamps.'
      },
      {
        id: 'TIP-4472', channel: 'Web', status: 'review',
        raw: 'I work in facilities at the Hargrove plant on Route 9. On April 2nd management told us to remove all documentation from Server Room B before the inspector arrived. My supervisor Marcus Webb was present.',
        safe: 'I work in facilities at the <span class="sensitive">Hargrove plant on Route 9</span>. On <span class="sensitive">April 2nd</span> management told us to remove all documentation from Server Room B before the inspector arrived. My supervisor <span class="sensitive">Marcus Webb</span> was present.',
        summary: 'Source at <span class="redact-token" data-t="[location]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> reports that on <span class="redact-token" data-t="[date]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, management directed removal of documentation ahead of an inspection. Named supervisor corroborates.'
      }
    ]
  };

  /* ---- client-side sanitizer ---- */
  function sanitizeText(text) {
    let s = text;
    // phone numbers
    s = s.replace(/\+?1?[\s\-]?\(?(\d{3})\)?[\s\-]?(\d{3})[\s\-]?(\d{4})/g, '+1 [contact]');
    // email
    s = s.replace(/\b[\w.+]+@[\w.]+\.\w{2,}\b/g, '[contact]');
    // dates
    s = s.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b/gi, '[date]');
    s = s.replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, '[date]');
    // proper name sequences in the middle of text (2+ title-case words)
    s = s.replace(/(?<=[a-z,;.!?]\s)([A-Z][a-z]{1,14}\s+[A-Z][a-z]{1,14}(?:\s+[A-Z][a-z]{1,14})?)/g, '[name]');
    // location-ish phrases (after at/in/near/from + title case)
    s = s.replace(/\b(at|in|near|from|the)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*(?:\s+(?:warehouse|facility|building|depot|office|plant|center|centre|street|avenue|road|route)))\b/gi,
      (m, prep, loc) => prep + ' [location]');
    return s;
  }

  function wrapSensitive(text) {
    let s = text;
    s = s.replace(/\+?1?[\s\-]?\(?(\d{3})\)?[\s\-]?(\d{3})[\s\-]?(\d{4})/g, '<span class="sensitive">$&</span>');
    s = s.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b/gi, '<span class="sensitive">$&</span>');
    s = s.replace(/(?<=[a-z,;.!?]\s)([A-Z][a-z]{1,14}\s+[A-Z][a-z]{1,14}(?:\s+[A-Z][a-z]{1,14})?)/g, '<span class="sensitive">$&</span>');
    s = s.replace(/\b(at|in|near|from|the)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*(?:\s+(?:warehouse|facility|building|depot|office|plant|center|centre|street|avenue|road|route)))\b/gi,
      (m) => '<span class="sensitive">' + m + '</span>');
    return s;
  }

  function makeSummaryTokens(sanitized) {
    return sanitized
      .replace(/\[name\]/g, '<span class="redact-token" data-t="[name]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>')
      .replace(/\[date\]/g, '<span class="redact-token" data-t="[date]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>')
      .replace(/\[location\]/g, '<span class="redact-token" data-t="[location]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>')
      .replace(/\[contact\]/g, '<span class="redact-token" data-t="[contact]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>');
  }

  /* ---- follow-up rewriter ---- */
  const rewriteRules = [
    [/who (are|is) (they|their|this person|the source)/i, 'Can you provide a reference identifier for this party without exposing their identity?'],
    [/what.*(name|called)/i, 'Can you share a pseudonymous reference I can use to corroborate this claim?'],
    [/how (can|do) I (contact|reach|get in touch)/i, 'Is there a secure channel or follow-up thread I can use for further questions?'],
    [/phone|number|email/i, 'Is there a secure way to continue this conversation without exchanging identifying details?'],
    [/where.*(they|this|located|happen)/i, 'Can you describe the location in a way that doesn\'t reveal identifiable details?'],
    [/address|location|place/i, 'Can you reference the location without specifying an identifiable address?'],
    [/when|date|time/i, 'Can you provide a general timeframe without an exact date that could narrow identification?'],
    [/proof|evidence|document/i, 'Can you describe what you observed in your own words, without sharing physical documents?'],
  ];

  function rewriteQuestion(q) {
    for (const [pattern, rewrite] of rewriteRules) {
      if (pattern.test(q)) return rewrite;
    }
    // Generic fallback: soften identifying terms
    let r = q
      .replace(/\b(name|names)\b/gi, 'identifier')
      .replace(/\b(contact|reach|call|email)\b/gi, 'communicate through secure channel with')
      .replace(/\b(where|location|address)\b/gi, 'general area')
      .replace(/\b(phone|number)\b/gi, 'secure contact method')
      .replace(/\b(when|date)\b/gi, 'timeframe')
      .replace(/\bwho\b/gi, 'which party');
    return r.charAt(0).toUpperCase() + r.slice(1).replace(/\?$/, '') + '?';
  }

  /* ---- INTAKE FORM ---- */
  function initIntake() {
    const form = document.getElementById('intake-form');
    if (!form) return;
    const card = document.getElementById('intake-card');
    const steps = [...card.querySelectorAll('.proc-step')];
    const submitBtn = card.querySelector('.submit-btn');

    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const tipText = form.querySelector('#tip-text').value.trim();
      const contact = form.querySelector('#tip-contact').value.trim() || 'web session';
      if (!tipText || tipText.length < 12) {
        form.querySelector('#tip-text').focus(); return;
      }

      // begin processing
      card.classList.add('processing');
      steps.forEach(s => s.classList.remove('done'));

      // step 1: encrypting
      await delay(1400); steps[0].classList.add('done');
      // step 2: sanitizing
      await delay(1300); steps[1].classList.add('done');
      // step 3: sealing
      await delay(1100); steps[2].classList.add('done');
      await delay(700);

      // build tip object
      const sanitized = sanitizeText(tipText);
      const safe = wrapSensitive(tipText);
      const summary = makeSummaryTokens(sanitized);
      const id = 'TIP-' + (4470 + store.tips.length + 1);
      store.tips.unshift({ id, channel: contact.startsWith('@') || contact.includes('imessage') ? 'iMessage' : 'Web', status: 'new', raw: tipText, safe, summary, isNew: true });

      // transition to success
      card.classList.remove('processing');
      card.classList.add('success');

      // auto-scroll to dashboard after 2.6s
      setTimeout(() => {
        const dash = document.getElementById('s-dash');
        const d = document.querySelector('.deck');
        if (dash && d) {
          d.style.scrollSnapType = 'none';
          d.style.scrollBehavior = 'smooth';
          d.scrollTop = dash.offsetTop;
          setTimeout(() => { d.style.scrollSnapType = ''; d.style.scrollBehavior = ''; }, 1200);
        }
        renderDashboard();
      }, 2600);
    });
  }

  /* ---- DASHBOARD ---- */
  function renderDashboard() {
    const grid = document.getElementById('tip-grid');
    if (!grid) return;
    grid.innerHTML = '';
    store.tips.forEach((tip, idx) => {
      const card = document.createElement('div');
      card.className = 'tip-card anim' + (tip.isNew ? ' new-tip' : '');
      card.style.transitionDelay = (idx * 0.12) + 's';
      card.innerHTML = `
        <div class="card-top">
          <span class="card-id">${tip.id}</span>
          <span class="card-channel"><span class="dot"></span>${tip.channel}</span>
        </div>
        <div class="card-summary">${tip.summary}</div>
        <div class="card-footer">
          <span class="status ${tip.status === 'new' ? 'new-s' : ''}">${tip.status === 'new' ? 'New · unread' : 'In review'}</span>
          <span class="expand-hint">Expand ↓</span>
        </div>
        <div class="card-detail">
          <div class="detail-inner">
            <div class="detail-cols">
              <div class="detail-col">
                <h4>As the source wrote it</h4>
                <div class="text">${tip.safe}</div>
              </div>
              <div class="detail-col">
                <h4>As the journalist sees it</h4>
                <div class="text">${tip.summary}</div>
              </div>
            </div>
            <div class="followup">
              <h4>Draft a follow-up question</h4>
              <div class="followup-row">
                <input type="text" placeholder="e.g. Can you share the document date?" class="fu-input" />
                <button class="rewrite-btn">Preview safe rewrite →</button>
              </div>
              <div class="rewrite-result">
                <div class="rlabel">Rewritten — safe to send</div>
                <div class="rtext"></div>
              </div>
            </div>
          </div>
        </div>`;
      card.querySelector('.card-top').addEventListener('click', () => {
        const wasOpen = card.classList.contains('open');
        grid.querySelectorAll('.tip-card.open').forEach(c => c.classList.remove('open'));
        if (!wasOpen) card.classList.add('open');
      });
      card.querySelector('.rewrite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const q = card.querySelector('.fu-input').value.trim();
        if (!q) return;
        const result = card.querySelector('.rewrite-result');
        result.querySelector('.rtext').textContent = rewriteQuestion(q);
        result.classList.add('show');
      });
      grid.appendChild(card);
      // trigger reveal
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('in')));
    });
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ---- init ---- */
  document.addEventListener('DOMContentLoaded', () => {
    initIntake();
    renderDashboard();
    // re-render on scene activation
    const dashScene = document.getElementById('s-dash');
    if (dashScene) {
      const obs = new MutationObserver(() => { if (dashScene.classList.contains('active')) renderDashboard(); });
      obs.observe(dashScene, { attributes: true, attributeFilter: ['class'] });
    }
  });

})();
