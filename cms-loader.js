/* RRR Shala CMS loader — merges admin-panel content (Firestore "cms") into the site,
   and shows an "Admin" button to admin accounts. Add before </body> in index.html:
   <script src="/cms-loader.js"></script>                                              */
(function () {
  var ADMIN_EMAILS = ['manubansal0008@gmail.com'];

  // Hide "PRO" / "SOON" badges everywhere on the site
  try {
    var st = document.createElement('style');
    st.textContent = '.badge.pro,.badge.soon{display:none!important}.edcard .row .chip[style*="good-bg"]{display:none!important}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}

  function ready(fn) {
    var n = 0;
    (function wait() {
      if (window.firebase && firebase.apps && firebase.apps.length) return fn();
      if (++n > 100) return; // ~10 s
      setTimeout(wait, 100);
    })();
  }

  function has(name) { try { return typeof eval(name) !== 'undefined'; } catch (e) { return false; } }

  function upsert(arr, entry) {
    var i = arr.findIndex(function (e) { return e.date === entry.date; });
    if (i >= 0) arr[i] = entry; else arr.push(entry);
    arr.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  }

  function merge(type, d) {
    if (!d || !d.date) return;
    if (type === 'news' && has('NEWS')) {
      upsert(NEWS, d);
      NEWS_BYDATE[d.date] = d;
      NEWS_DATES[d.date] = { label_en: d.label_en, label_hi: d.label_hi, ids: (d.items || []).map(function (q) { return q.id; }) };
    } else if (type === 'rajspec' && has('RAJSPEC')) {
      upsert(RAJSPEC, d);
      RAJSPEC_BYDATE[d.date] = d;
      RAJSPEC_DATES[d.date] = { label_en: d.label_en, label_hi: d.label_hi, ids: [] };
      (d.items || []).forEach(function (it) { (it.mcqs || []).forEach(function (q) { BYID[q.id] = q; }); });
    } else if (type === 'edit' && has('EDIT')) {
      upsert(EDIT, d);
      EDIT_BYDATE[d.date] = d;
      EDIT_DATES[d.date] = { label_en: d.label_en, label_hi: d.label_hi, ids: [] };
    } else if (type === 'dailyquiz' && has('DD_DATES')) {
      var qs = d.questions || [];
      qs.forEach(function (q, i) {
        q.id = q.id || ('DD-' + d.date + '-' + (i + 1));
        q.y = q.y || 'DD'; q.date = q.date || d.date; q.n = q.n || i + 1; q.th = q.th || 'Daily Digest';
        BYID[q.id] = q;
        if (has('ALL') && !ALL.some(function (x) { return x.id === q.id; })) ALL.push(q);
      });
      DD_DATES[d.date] = { label_en: d.label_en, label_hi: d.label_hi, ids: qs.map(function (q) { return q.id; }) };
      if (has('DDMETA') && d.date >= (DDMETA.date || '')) { DDMETA.date = d.date; DDMETA.label_en = d.label_en; DDMETA.label_hi = d.label_hi; }
    } else if (type === 'mock' && d.code) {
      window.RRRMOCKS = window.RRRMOCKS || {};
      (d.questions || []).forEach(function (q) { BYID[q.id] = q; });
      window.RRRMOCKS[d.code] = d;
    } else if (type === 'sujas' && has('SUJASQ') && d.code) {
      var gi = SUJASQ.findIndex(function (g) { return g.code === d.code; });
      if (gi >= 0) SUJASQ[gi] = d; else SUJASQ.unshift(d);
      (d.questions || []).forEach(function (q) { BYID[q.id] = q; });
    }
  }

  function adminButton() {
    var a = document.getElementById('cmsAdminBtn');
    if (a) return a;
    a = document.createElement('a');
    a.id = 'cmsAdminBtn'; a.href = '/admin.html'; a.textContent = '⚙ Admin';
    a.style.cssText = 'display:none;position:fixed;right:16px;bottom:70px;z-index:9999;background:#1f2a3a;color:#fff;' +
      'padding:9px 14px;border-radius:20px;font:600 13px system-ui,sans-serif;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.25)';
    document.body.appendChild(a);
    return a;
  }

  // Remove "Why it matters for RAS" and source lines from all current-affairs content
  function stripRelev() {
    if (has('RAJSPEC')) RAJSPEC.forEach(function (e) { (e.items || []).forEach(function (it) { delete it.relev_en; delete it.relev_hi; delete it.src; }); });
    if (has('NEWS')) NEWS.forEach(function (e) { (e.digest || []).forEach(function (it) { delete it.src; }); });
    if (has('EDIT')) EDIT.forEach(function (e) { (e.items || []).forEach(function (it) { delete it.src; }); });
  }

  // Daily Quiz: show only the latest day's 5 questions
  function patchDailyQuiz() {
    if (typeof window.renderDailyQuiz !== 'function' || window.__dq5) return;
    var orig = window.renderDailyQuiz; window.__dq5 = true;
    window.renderDailyQuiz = function () {
      try {
        var hi = LANG === 'hi', dd = Object.keys(DD_DATES).sort(), last = dd[dd.length - 1];
        var list = (last ? DD_DATES[last].ids : []).map(function (id) { return BYID[id]; }).filter(Boolean).slice(0, 5);
        if (!list.length) return orig.apply(this, arguments);
        var lbl = hi ? DD_DATES[last].label_hi : DD_DATES[last].label_en;
        document.getElementById('view-dailyquiz').innerHTML = '<div class="card"><h2 class="h-sec">' + t('dailyquiz') + '</h2><p class="small muted">' +
          (hi ? 'आज की समसामयिकी से 5 त्वरित प्रश्न — तुरंत उत्तर व व्याख्या।' : "5 quick questions from today's current affairs — instant answers and explanations.") +
          '</p><div class="small muted" style="margin-top:6px">' + list.length + ' ' + t('qs') + ' · ' + lbl + '</div></div>' +
          list.map(function (q) { return qCard(q); }).join('');
      } catch (e) { return orig.apply(this, arguments); }
    };
  }


  // News Anchor: prefer Indian-accent voices (en-IN, then hi-IN), let visitor choose, remember choice
  function patchAnchorVoice() {
    if (window.__ivoice || typeof window.pickVoice !== 'function') return;
    window.__ivoice = true;
    function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) { return ''; } }
    function score(v, want) {
      var L = (v.lang || '').toLowerCase().replace(/_/g, '-'), n = (v.name || '').toLowerCase(), s = 0;
      if (want === 'en') { if (L.indexOf('en-in') === 0) s = 100; else if (L.indexOf('hi') === 0) s = 60; else if (L.indexOf('en') === 0) s = 10; else return -1; }
      else { if (L.indexOf('hi') === 0) s = 100; else return -1; }
      if (/natural|neural|online|enhanced|premium/.test(n)) s += 20;
      if (/google/.test(n)) s += 12;
      if (/neerja|heera|swara|kalpana|aditi|raveena|lekha|rishi|prabhat|madhur|india|hindi|हिन्दी/.test(n)) s += 8;
      if (/heera|neerja|swara|kalpana|lekha|aditi/.test(n)) s += 5; // female anchor voices first
      return s;
    }
    function ranked(lang) {
      var want = lang === 'hi' ? 'hi' : 'en', vs = [];
      try { vs = window.speechSynthesis.getVoices() || []; } catch (e) {}
      return vs.map(function (v) { return { v: v, s: score(v, want) }; }).filter(function (x) { return x.s >= 0; })
        .sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.v; });
    }
    window.pickVoice = function (lang) {
      var list = ranked(lang), saved = ls('rrrVoice_' + (lang === 'hi' ? 'hi' : 'en'));
      for (var i = 0; i < list.length; i++) if (list[i].name === saved) return list[i];
      return list[0] || null;
    };
    if (typeof window._aNext === 'function') {
      window._aNext = function (st) {
        if (_aI >= _aQ.length) { _aStopKeep(); if (st) st.textContent = ''; return; }
        var u = new SpeechSynthesisUtterance(_aQ[_aI]); var v = window.pickVoice(LANG);
        u.lang = v ? v.lang : (LANG === 'hi' ? 'hi-IN' : 'en-IN'); if (v) u.voice = v;
        u.rate = anchorRate; u.pitch = 1;
        u.onend = function () { _aI++; window._aNext(st); }; u.onerror = function () { _aI++; window._aNext(st); };
        window.speechSynthesis.speak(u);
      };
    }
    window.rrrSetVoice = function (name) { ls('rrrVoice_' + (LANG === 'hi' ? 'hi' : 'en'), name); };
    function label(v) {
      var L = (v.lang || '').toLowerCase().replace(/_/g, '-');
      var tag = L.indexOf('en-in') === 0 ? '🇮🇳 EN' : L.indexOf('hi') === 0 ? '🇮🇳 हिं' : L.toUpperCase();
      return tag + ' · ' + (v.name || '').replace(/Microsoft |Google |\(.*?\)| - .*/g, '').trim().slice(0, 22);
    }
    if (typeof window.anchorPlayer === 'function') {
      var origPlayer = window.anchorPlayer;
      window.anchorPlayer = function (date) {
        var html = origPlayer.apply(this, arguments);
        try {
          var list = ranked(LANG), cur = window.pickVoice(LANG);
          if (list.length > 1) {
            var sel = '<select onchange="rrrSetVoice(this.value)" title="voice" style="padding:6px 8px;margin-right:4px;max-width:190px">' +
              list.slice(0, 12).map(function (v) { var nm = (v.name || '').replace(/"/g, ''); return '<option value="' + nm + '"' + (cur && v.name === cur.name ? ' selected' : '') + '>' + label(v) + '</option>'; }).join('') + '</select>';
            html = html.replace('<button class="btn amber"', sel + '<button class="btn amber"');
          }
          var hasIndian = list.some(function (v) { var L = (v.lang || '').toLowerCase().replace(/_/g, '-'); return L.indexOf('en-in') === 0 || L.indexOf('hi') === 0; });
          if (!hasIndian) html = html.replace('<div id="anchorstatus"', '<div class="small muted" style="margin-top:6px">' + (LANG === 'hi' ? 'इस डिवाइस में भारतीय आवाज़ उपलब्ध नहीं है — फ़ोन की Text-to-speech सेटिंग में Hindi / English (India) आवाज़ डाउनलोड करें।' : 'No Indian voice on this device — install "English (India)" or Hindi in your phone/PC text-to-speech settings.') + '</div><div id="anchorstatus"');
        } catch (e) {}
        return html;
      };
    }
    function refreshBar() {
      try {
        var bar = document.querySelector('.anchorbar'); if (!bar || bar.querySelector('select[title=voice]')) return;
        var b = bar.querySelector('button.btn.amber'); var m = b && (b.getAttribute('onclick') || '').match(/anchorPlay\('([^']+)'\)/);
        if (m) bar.outerHTML = window.anchorPlayer(m[1]);
      } catch (e) {}
    }
    try { window.speechSynthesis.addEventListener('voiceschanged', refreshBar); } catch (e) {}
    setTimeout(refreshBar, 1500);
    document.addEventListener('click', function () { setTimeout(refreshBar, 300); }, true);
  }

  // RRR full-length mock tests: list them first in the Mock Test view; unlock the Mock tile on Home
  function patchMocks() {
    if (window.__rrrmock) return; window.__rrrmock = true;
    try {
      if (window.__LOCKED) delete window.__LOCKED.mock;
      document.querySelectorAll('#nav [data-v="mock"]').forEach(function (b) {
        b.classList.remove('locked'); b.removeAttribute('aria-disabled');
        var bd = b.querySelector('.badge'); if (bd) bd.remove();
        b.onclick = function (e) { if (e) e.preventDefault(); show('mock'); };
      });
    } catch (e) {}
    if (typeof window.renderMock === 'function') {
      var oR = window.renderMock;
      window.renderMock = function () {
        var r = oR.apply(this, arguments);
        try {
          var sel = document.getElementById('mkpaper'), M = window.RRRMOCKS || {};
          if (sel && !window.__mockActive) {
            Object.keys(M).sort().reverse().forEach(function (c) {
              var o = document.createElement('option'); o.value = c; o.textContent = LANG === 'hi' ? M[c].label_hi : M[c].label_en; sel.insertBefore(o, sel.firstChild);
            });
            if (Object.keys(M).length) {
              var first = Object.keys(M).sort()[0]; sel.value = first;
              var card = sel.closest('.card'); if (card && !document.getElementById('rrrmocknote')) {
                var n = document.createElement('p'); n.id = 'rrrmocknote'; n.className = 'small muted'; n.style.marginTop = '10px';
                n.textContent = LANG === 'hi' ? 'RRR मॉक टेस्ट: RPSC पैटर्न पर नए 150 प्रश्न · 3 घंटे · प्रत्येक प्रश्न 4/3 अंक (कुल 200) · गलत उत्तर पर 1/3 कटौती।' : 'RRR Mock Tests: fresh 150 questions on the RPSC pattern · 3 hours · 4/3 mark each (200 total) · 1/3 negative marking.';
                card.appendChild(n);
              }
            }
          }
        } catch (e) {}
        return r;
      };
    }
    if (typeof window.startMock === 'function') {
      var oS = window.startMock;
      window.startMock = function () {
        var sel = document.getElementById('mkpaper'), M = window.RRRMOCKS || {};
        if (!sel || !M[sel.value]) return oS.apply(this, arguments);
        var mins = +document.getElementById('mktime').value;
        mock = { set: M[sel.value].questions.slice(), ans: {}, end: Date.now() + mins * 60000, paper: sel.value };
        window.__mockActive = true; renderMockRun();
        clearInterval(window.__mt); window.__mt = setInterval(tickMock, 1000);
      };
    }
    if (typeof window.submitMock === 'function') {
      var oSub = window.submitMock;
      window.submitMock = function () {
        var isRRR = mock && window.RRRMOCKS && window.RRRMOCKS[mock.paper];
        var r = oSub.apply(this, arguments);
        if (isRRR) try {
          var cor = 0, wr = 0; mock.set.forEach(function (q) { var a = mock.ans[q.id]; if (a && a !== '__NA__') { if (a === q.a) cor++; else wr++; } });
          var big = document.querySelector('#view-mock .big');
          if (big) big.innerHTML = ((cor - wr / 3) * 4 / 3).toFixed(2) + ' / 200';
        } catch (e) {}
        return r;
      };
    }
    if (typeof window.renderHome === 'function') {
      var oH = window.renderHome;
      window.renderHome = function () {
        var r = oH.apply(this, arguments);
        try {
          document.querySelectorAll('#view-home .tile.locked').forEach(function (t) {
            if (/150/.test(t.textContent)) { t.classList.remove('locked'); t.style.cursor = 'pointer'; t.onclick = function () { show('mock'); }; var b = t.querySelector('.badge'); if (b) b.remove(); }
          });
        } catch (e) {}
        return r;
      };
    }
  }

  ready(function () {
    patchDailyQuiz();
    patchMocks();
    patchAnchorVoice();
    stripRelev();
    try { if (window.__cur_v === 'caraj' && typeof render === 'function') render('caraj'); } catch (e) {}
    var db = firebase.firestore();
    db.collection('cms').where('published', '==', true).get().then(function (snap) {
      var n = 0;
      snap.forEach(function (doc) {
        var x = doc.data();
        try { merge(x.type, JSON.parse(x.json)); n++; } catch (e) { console.warn('cms entry skipped', doc.id, e); }
      });
      stripRelev();
      if (n && typeof render === 'function') { try { render(window.__cur_v || 'home'); } catch (e) {} }
    }).catch(function (e) { console.warn('cms load failed', e); });

    var btn = adminButton();
    firebase.auth().onAuthStateChanged(function (u) {
      var em = ((u && u.email) || '').toLowerCase();
      if (btn) btn.style.display = ADMIN_EMAILS.indexOf(em) >= 0 ? 'inline-block' : 'none';
    });
  });
})();
