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

  ready(function () {
    patchDailyQuiz();
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
