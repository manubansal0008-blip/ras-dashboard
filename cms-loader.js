/* fast-latest: hide stale static news until fresh CMS news is ready; show cached copy instantly */
(function(){try{var st=document.createElement('style');st.id='rrrLatestHide';st.textContent='#latest-en>*,#latest-hi>*{visibility:hidden}#latest-en::before,#latest-hi::before{content:"Loading today\u2019s news\u2026";display:block;padding:12px;color:#667}';var shown=false;['en','hi'].forEach(function(L){var b=document.getElementById('latest-'+L),c=null;try{c=localStorage.getItem('rrrLatest_'+L)}catch(e){}if(b&&c){b.innerHTML=c;shown=true;}});if(!shown)document.head.appendChild(st);window.__rrrRevealLatest=function(){var x=document.getElementById('rrrLatestHide');if(x)x.remove();['en','hi'].forEach(function(L){var b=document.getElementById('latest-'+L);if(b)try{localStorage.setItem('rrrLatest_'+L,b.innerHTML)}catch(e){}});};setTimeout(function(){var x=document.getElementById('rrrLatestHide');if(x)x.remove();},8000);}catch(e){}})();
/* RRR Shala CMS loader — merges admin-panel content (Firestore "cms") into the site,
   (no admin button is shown on the public site). Add before </body> in index.html:
   <script src="/cms-loader.js"></script>                                              */
(function () {

  // Load question layout (RPSC style) and paid Full Length Tests
  var rrrV = Math.floor(Date.now() / 3600000); // new version every hour so visitors always get the latest
  ['/q-format.js?v=' + rrrV, '/paid-mocks.js?v=' + rrrV].forEach(function (src) {
    try { var s = document.createElement('script'); s.src = src; s.defer = true; (document.head || document.documentElement).appendChild(s); } catch (e) {}
  });

  // Hide "PRO" / "SOON" badges everywhere on the site
  try {
    var st = document.createElement('style');
    st.textContent = '.badge.pro,.badge.soon{display:none!important}.edcard .row .chip[style*="good-bg"]{display:none!important}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}
   
  // Footer stamp: show the date the site was last updated (auto)
  function fixStamp() {
    try {
      var d = new Date(document.lastModified); if (isNaN(d)) return;
      var txt = 'updated ' + d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      document.querySelectorAll('.sitefoot span').forEach(function (s) { if (/^\s*(build|updated)\s/i.test(s.textContent)) s.textContent = txt; });
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fixStamp); else fixStamp();
   
  // Visitor count fallback: if the +1 request hangs, show the stored total
  setTimeout(function () {
    try {
      var el = document.getElementById('vcount');
      if (!el || /\d/.test(el.textContent)) return;
      fetch('https://abacus.jasoncameron.dev/get/rrrshala-com/visits').then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.value != null && !/\d/.test(el.textContent)) el.textContent = Number(d.value).toLocaleString();
      }).catch(function () {});
    } catch (e) {}
  }, 4000);

  // Visitor count: show the last known total instantly, then update when the counter replies
  try {
    var vcEl = document.getElementById('vcount');
    if (vcEl) {
      var vcLast = null; try { vcLast = localStorage.getItem('rrr_vc'); } catch (e) {}
      if (vcLast && !/\d/.test(vcEl.textContent)) vcEl.textContent = vcLast;
      new MutationObserver(function () {
        var t = vcEl.textContent; if (/\d/.test(t)) { try { localStorage.setItem('rrr_vc', t); } catch (e) {} }
      }).observe(vcEl, { childList: true, characterData: true, subtree: true });
    }
  } catch (e) {}

  // Footer + sidebar links: About Us and RAS exam-guide pages
  function addGuideLinks() {
    try {
      var hi = (document.documentElement.lang || '').indexOf('hi') === 0 || /[?&]lang=hi/.test(location.search);
      var p = hi ? '/hi' : '';
      var foot = document.querySelector('.sitefoot');
      if (foot && !document.getElementById('rrrGuideLinks')) {
        var s = document.createElement('div'); s.id = 'rrrGuideLinks'; s.style.cssText = 'margin-top:6px';
        s.innerHTML = '<a href="/about/">' + (hi ? 'हमारे बारे में' : 'About Us') + '</a> · ' +
          '<a href="' + p + '/ras/ras-syllabus-changes-2026/">' + (hi ? 'पाठ्यक्रम बदलाव 2026' : 'Syllabus Changes 2026') + '</a> · ' +
          '<a href="' + p + '/ras/ras-cut-off/">' + (hi ? 'कट ऑफ' : 'RAS Cut Off') + '</a> · ' +
          '<a href="' + p + '/ras/ras-previous-year-papers/">' + (hi ? 'पिछले प्रश्न-पत्र' : 'Previous Year Papers') + '</a> · ' +
          '<a href="' + p + '/ras/">' + (hi ? 'RAS परीक्षा गाइड' : 'RAS Exam Guide') + '</a>';
        foot.appendChild(s);
      }
      var nav = document.querySelector('nav.nav');
      if (nav && !document.getElementById('rrrAboutNav')) {
        var b = document.createElement('button'); b.id = 'rrrAboutNav'; b.type = 'button';
        b.innerHTML = '<span class="lf"><span class="ic">👥</span><span class="tx">' + (hi ? 'हमारे बारे में' : 'About Us') + '</span></span>';
        b.addEventListener('click', function (e) { e.stopPropagation(); location.href = '/about/'; });
        nav.appendChild(b);
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addGuideLinks); else addGuideLinks();

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

  // Remove "Why it matters for RAS" and source lines from all current-affairs content
  function stripRelev() {
    if (has('RAJSPEC')) RAJSPEC.forEach(function (e) { (e.items || []).forEach(function (it) { delete it.relev_en; delete it.relev_hi; delete it.src; }); });
    if (has('NEWS')) NEWS.forEach(function (e) { (e.digest || []).forEach(function (it) { delete it.src; }); });
    if (has('EDIT')) EDIT.forEach(function (e) { (e.items || []).forEach(function (it) { delete it.src; }); });
  }

  // Homepage "Today's News" + "Recent daily editions": always show the latest admin content
  function refreshLatest() {
    try {
      var sec = document.getElementById('latest'); if (!sec || !has('NEWS_BYDATE')) return;
      var nd = Object.keys(NEWS_BYDATE).sort(), last = nd[nd.length - 1]; if (!last) return;
      var z = NEWS_BYDATE[last], qd = has('DD_DATES') ? Object.keys(DD_DATES).sort().slice(-7).reverse() : [];
      var esc = function (x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
      var CH = 'background:#eef1f7;color:#26314f;text-decoration:none;font-weight:600;font-size:13px;border-radius:8px;padding:6px 11px';
      ['en', 'hi'].forEach(function (L) {
        var box = document.getElementById('latest-' + L); if (!box) return;
        var hi = L === 'hi', k = hi ? '_hi' : '_en';
        var links = box.querySelector('nav div[style*="font-size:13px"]'); links = links ? links.outerHTML : '';
        var lbl = hi ? (z.label_hi || last) : (z.label_en || last);
        var arts = (z.digest || []).map(function (it) {
          var pts = it['points' + k] || it.points_en || [];
          return '<article class="card"><h3>' + esc(it['head' + k] || it.head_en) + '</h3><ul>' + pts.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></article>';
        }).join('');
        var chips = qd.map(function (d) { var e = DD_DATES[d]; return '<a href="/' + (hi ? 'hi/' : '') + 'current-affairs/' + d + '/" style="' + CH + '">' + esc(hi ? e.label_hi : e.label_en) + '</a>'; }).join('');
        var navT = hi ? 'हाल की दैनिक प्रस्तुतियाँ' : 'Recent daily editions';
        box.innerHTML = '<h2>' + (hi ? 'आज की ख़बरें · ' : 'Today’s News · ') + esc(lbl) + '</h2>' + arts +
          '<nav aria-label="' + navT + '" style="border-top:1px solid var(--line);margin-top:14px;padding-top:12px"><h2 style="font-size:15px;margin:0 0 8px">' + navT + '</h2><div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">' + chips + '</div>' + links + '</nav>';
      });
      if (window.__rrrRevealLatest) window.__rrrRevealLatest();
    } catch (e) { console.warn('latest refresh failed', e); }
  }

  // Daily Quiz: show only the latest day's 5 questions
  function patchDailyQuiz() {
    if (typeof window.renderDailyQuiz !== 'function' || window.__dq5) return;
    var orig = window.renderDailyQuiz; window.__dq5 = true;
    window.renderDailyQuiz = function () {
      try {
        var hi = LANG === 'hi', dd = Object.keys(DD_DATES).sort(), last = dd[dd.length - 1];
        var list = (last ? DD_DATES[last].ids : []).map(function (id) { return BYID[id]; }).filter(Boolean).slice(0, 10);
        if (!list.length) return orig.apply(this, arguments);
        var lbl = hi ? DD_DATES[last].label_hi : DD_DATES[last].label_en;
        document.getElementById('view-dailyquiz').innerHTML = '<div class="card"><h2 class="h-sec">' + t('dailyquiz') + '</h2><p class="small muted">' +
          (hi ? 'आज की समसामयिकी से त्वरित प्रश्न (राष्ट्रीय + राजस्थान) — तुरंत उत्तर व व्याख्या।' : "Quick questions from today's current affairs (National + Rajasthan) — instant answers and explanations.") +
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
      refreshLatest();
      if (n && typeof render === 'function') { try { render(window.__cur_v || 'home'); } catch (e) {} }
    }).catch(function (e) { console.warn('cms load failed', e); });

  });
})();


/* Rajasthan Specific cards: optional sections only, no source tag, no empty "Practice questions" heading */
(function () {
  function patch() {
    if (typeof window.rsCard !== 'function' || typeof L2 !== 'function') return false;
    window.rsCard = function (it) {
      var theme = L2(it.theme_en, it.theme_hi), h = '<div class="card edcard">';
      if (theme) h += '<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center"><span class="chip">' + esc(theme) + '</span></div>';
      h += '<h2 style="font-size:17px;color:var(--brand);margin:8px 0 2px">' + esc(L2(it.topic_en, it.topic_hi)) + '</h2>';
      var sec = function (en, hi, body) { return '<div class="edh">' + L2(en, hi) + '</div>' + body; };
      if (L2(it.why_en, it.why_hi)) h += sec('Why in news', 'समाचार में क्यों', '<p class="edp">' + L2(it.why_en, it.why_hi) + '</p>');
      if ((L2(it.about_en, it.about_hi) || []).length) h += sec('About &amp; key facts', 'परिचय व मुख्य तथ्य', '<div class="eddata">' + edList(L2(it.about_en, it.about_hi)) + '</div>');
      if (L2(it.issue_en, it.issue_hi)) h += sec('The issue', 'मुद्दा', '<p class="edp">' + L2(it.issue_en, it.issue_hi) + '</p>');
      if ((L2(it.steps_en, it.steps_hi) || []).filter(Boolean).length) h += sec('Government steps', 'सरकारी कदम', edList(L2(it.steps_en, it.steps_hi)));
      if (L2(it.stake_en, it.stake_hi)) h += sec('Stakeholders', 'हितधारक', '<p class="edp">' + L2(it.stake_en, it.stake_hi) + '</p>');
      if ((it.mcqs || []).length) h += sec('Practice questions', 'अभ्यास प्रश्न', it.mcqs.map(function (q) { return qCard(q); }).join(''));
      return h + '</div>';
    };
    return true;
  }
  if (!patch()) document.addEventListener('DOMContentLoaded', patch);
})();


/* Flash banner: announces new content at the top of the homepage (edit FLASH below; it hides itself after "until") */
(function () {
  var FLASH = {
    until: '2026-12-06',
    en: 'NEW: October 2026 Current Affairs Quiz. Attempt now →',
    hi: 'नया: अक्टूबर 2026 करंट अफेयर्स क्विज़। अभी हल करें →',
    view: 'caquiz', code: 'OCT'
  };
  function showFlash() {
    if (document.getElementById('rrrFlash')) return;
    if (new Date() > new Date(FLASH.until + 'T23:59:59+05:30')) return;
    try { if (localStorage.getItem('rrrFlashClosed') === FLASH.en) return; } catch (e) {}
    var hi = (typeof LANG !== 'undefined' && LANG === 'hi');
    var bar = document.createElement('div');
    bar.id = 'rrrFlash';
    bar.style.cssText = 'position:sticky;top:0;z-index:9998;display:flex;align-items:center;gap:10px;justify-content:center;' +
      'background:linear-gradient(90deg,#e8a020,#f7d977);color:#23252e;font:700 14px system-ui,sans-serif;padding:9px 40px 9px 14px;' +
      'text-align:center;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.15)';
    bar.innerHTML = '<span style="background:#b3261e;color:#fff;border-radius:6px;padding:2px 7px;font-size:11px;animation:rrrBlink 1.2s infinite">' +
      (hi ? 'नया' : 'NEW') + '</span><span>' + (hi ? FLASH.hi : FLASH.en) + '</span>' +
      '<button aria-label="Close" style="position:absolute;right:10px;background:none;border:0;font:700 18px system-ui;color:#23252e;cursor:pointer">×</button>';
    var st = document.createElement('style'); st.textContent = '@keyframes rrrBlink{50%{opacity:.35}}'; document.head.appendChild(st);
    bar.onclick = function (e) {
      if (e.target.tagName === 'BUTTON') { bar.remove(); try { localStorage.setItem('rrrFlashClosed', FLASH.en); } catch (x) {} return; }
      try { window.__sjm = FLASH.code; if (typeof window.show === 'function') window.show(FLASH.view); setTimeout(function () { window.__sjm = FLASH.code; if (typeof renderSujas === 'function' && (FLASH.view === 'sujas' || FLASH.view === 'caquiz')) renderSujas(); }, 300); window.scrollTo(0, 0); } catch (x) {}
    };
    document.body.insertBefore(bar, document.body.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showFlash); else showFlash();
})();

// Current Affairs mock set: latest 100 questions, fixed 100 minutes
(function () {
  function apply() {
    if (typeof window.startMock !== 'function' || typeof CA === 'undefined') return setTimeout(apply, 500);
    if (window.__ca100) return; window.__ca100 = true;
    var oS = window.startMock;
    window.startMock = function () {
      var sel = document.getElementById('mkpaper');
      if (!sel || sel.value !== 'ca') return oS.apply(this, arguments);
      mock = { set: CA.slice(-100), ans: {}, end: Date.now() + 100 * 60000, paper: 'ca' };
      window.__mockActive = true; renderMockRun();
      clearInterval(window.__mt); window.__mt = setInterval(tickMock, 1000);
    };
    var oR = window.renderMock;
    if (typeof oR === 'function') window.renderMock = function () {
      var r = oR.apply(this, arguments);
      try {
        var sel = document.getElementById('mkpaper'), tm = document.getElementById('mktime');
        if (sel) {
          var o = sel.querySelector('option[value="ca"]');
          if (o) o.textContent = LANG === 'hi' ? 'CA सेट (100 प्रश्न · 100 मिनट)' : 'Current Affairs set (100 Q · 100 min)';
          var sync = function () {
            if (!tm) return;
            if (sel.value === 'ca') {
              if (!tm.querySelector('option[value="100"]')) { var x = document.createElement('option'); x.value = '100'; x.textContent = '100'; tm.appendChild(x); }
              tm.value = '100'; tm.disabled = true;
            } else tm.disabled = false;
          };
          sel.addEventListener('change', sync); sync();
        }
      } catch (e) {}
      return r;
    };
  }
  apply();
})();

// Current Affairs Quiz: its own section, kept separate from the Sujas quiz
(function () {
  function isCA(g) { return /^Current Affairs Quiz/i.test((g && g.label_en) || ''); }
  function setMode(ca) {
    if (typeof SUJASQ === 'undefined') return;
    var seen = {}, all = [];
    SUJASQ.concat(window.__sjStash || []).forEach(function (g) { if (g && !seen[g.code]) { seen[g.code] = 1; all.push(g); } });
    var keep = all.filter(function (g) { return isCA(g) === ca; });
    window.__sjStash = all.filter(function (g) { return isCA(g) !== ca; });
    SUJASQ.splice.apply(SUJASQ, [0, SUJASQ.length].concat(keep));
    if (!keep.some(function (g) { return g.code === window.__sjm; }) && window.__sjm !== 'ALL') window.__sjm = keep[0] ? keep[0].code : 'ALL';
  }
  function label() { return LANG === 'hi' ? 'करंट अफेयर्स क्विज़' : 'Current Affairs Quiz'; }
  function init() {
    if (typeof window.renderSujas !== 'function' || typeof window.show !== 'function' || typeof SUJASQ === 'undefined') return setTimeout(init, 400);
    if (window.__caq) return; window.__caq = true;
    var oR = window.renderSujas;
    window.renderSujas = function () {
      if (!window.__sjActive) setMode(!!window.__caMode);
      var r = oR.apply(this, arguments);
      try {
        var el = document.getElementById('view-sujas'), hi = LANG === 'hi';
        el.querySelectorAll('p').forEach(function (p) { if (/Copying\/downloading|कॉपी\/डाउनलोड/.test(p.textContent)) p.remove(); });
        if (window.__caMode && !window.__sjActive) {
          var h = el.querySelector('h2.h-sec'); if (h) h.textContent = label();
          var ds = h && h.nextElementSibling; if (ds) ds.textContent = hi ? 'मासिक करंट अफेयर्स प्रश्न। माह व प्रश्न-संख्या चुनकर क्विज़ शुरू करें।' : 'Monthly current affairs questions. Choose a month and set size, then start the quiz.';
        }
        if (window.__caMode) { var vt = document.getElementById('vtitle'); if (vt) vt.textContent = label(); }
      } catch (e) {}
      return r;
    };
    var oS = window.show;
    window.show = function (v) {
      if (v === 'caquiz') {
        if (!window.__caMode) window.__sjActive = false;
        window.__caMode = true;
        var r = oS.call(this, 'sujas');
        document.querySelectorAll('#nav [data-v]').forEach(function (b) { b.classList.toggle('active', b.dataset.v === 'caquiz'); });
        return r;
      }
      if (v === 'sujas' && window.__caMode) { window.__caMode = false; window.__sjActive = false; }
      return oS.apply(this, arguments);
    };
    try { show = window.show; } catch (e) {}
    var dq = document.querySelector('#nav [data-v="dailyquiz"]');
    if (dq && !document.querySelector('#nav [data-v="caquiz"]')) {
      var b = dq.cloneNode(true); b.dataset.v = 'caquiz'; b.classList.remove('active');
      b.removeAttribute('onclick'); b.onclick = function (e) { if (e) e.preventDefault(); window.show('caquiz'); };
      b.innerHTML = '📝 ' + label();
      dq.parentNode.insertBefore(b, dq.nextSibling);
    }
    if (typeof window.botSheet === 'function') {
      var oB = window.botSheet;
      window.botSheet = function (w) {
        var r = oB.apply(this, arguments);
        try {
          if (w === 'quiz') {
            var p = document.getElementById('botsheet-panel'), it = p && p.querySelector('.sh-item');
            if (it && !p.querySelector('[data-caq]')) {
              var n = it.cloneNode(false); n.setAttribute('data-caq', '1'); n.removeAttribute('onclick');
              n.innerHTML = '<span>📝 ' + label() + '</span>';
              n.onclick = function () { try { botClose(); } catch (e) {} window.show('caquiz'); };
              var last = p.querySelectorAll('.sh-item'); last = last[last.length - 1]; last.parentNode.insertBefore(n, last.nextSibling);
            }
          }
        } catch (e) {}
        return r;
      };
    }
  }
  init();
})();

// News maps: items with a "map" field ({lat, lon, zoom, label}) get a small location map under the card
(function () {
  function bbox(m) { var z = m.zoom || 5, d = 180 / Math.pow(2, z); return [m.lon - d, m.lat - d / 2, m.lon + d, m.lat + d / 2].map(function (x) { return x.toFixed(3); }).join(','); }
  function addMaps() {
    var host = document.getElementById('newsbody');
    if (!host || typeof NEWS_BYDATE === 'undefined') return;
    var vn = document.getElementById('view-news');
    if (vn) {
      vn.querySelectorAll('.small.muted, .muted.small').forEach(function (el) {
        var tx = el.textContent.trim();
        if (/^(Source|स्रोत)\s*:/i.test(tx)) el.remove();
        else if (/The Hindu|Hindustan|TOI/.test(tx)) el.textContent = LANG === 'hi' ? 'द्विभाषी दैनिक समाचार सार। नीचे कैलेंडर से दिनांक चुनें।' : 'Bilingual daily news digest. Pick a date below.';
      });
    }
    var items = [];
    Object.keys(NEWS_BYDATE).forEach(function (k) { ((NEWS_BYDATE[k] || {}).digest || []).forEach(function (d) { if (d && d.map) items.push(d); }); });
    if (!items.length) return;
    host.querySelectorAll('.card').forEach(function (card) {
      if (card.querySelector('.rrr-map')) return;
      var b = card.querySelector('b'); if (!b) return;
      var t = b.textContent.trim();
      var d = items.filter(function (x) { return x.head_en === t || x.head_hi === t; })[0];
      if (!d) return;
      var m = d.map, box = document.createElement('div');
      box.className = 'rrr-map'; box.style.cssText = 'margin-top:8px';
      box.innerHTML = '<iframe title="map" loading="lazy" style="width:100%;height:230px;border:0;border-radius:10px" src="https://www.openstreetmap.org/export/embed.html?bbox=' + bbox(m) + '&layer=mapnik&marker=' + m.lat + ',' + m.lon + '"></iframe>' +
        '<div class="small muted" style="margin-top:3px">📍 ' + (m.label || '') + '</div>';
      (card.querySelector('ul') || card).insertAdjacentElement('afterend', box);
    });
  }
  var ob = new MutationObserver(function () { clearTimeout(window.__rrrMapT); window.__rrrMapT = setTimeout(addMaps, 150); });
  function start() { ob.observe(document.body, { childList: true, subtree: true }); addMaps(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
