/* RRR Shala CMS loader — merges admin-panel content (Firestore "cms") into the site,
   and shows an "Admin" button to admin accounts. Add before </body> in index.html:
   <script src="/cms-loader.js"></script>                                              */
(function () {
  var ADMIN_EMAILS = ['manubansal0008@gmail.com'];

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
    }
  }

  function adminButton() {
    if (document.getElementById('cmsAdminBtn')) return;
    var a = document.createElement('a');
    a.id = 'cmsAdminBtn'; a.href = '/admin.html'; a.textContent = '⚙ Admin';
    a.style.cssText = 'display:none;position:fixed;right:16px;bottom:70px;z-index:9999;background:#1f2a3a;color:#fff;' +
      'padding:9px 14px;border-radius:20px;font:600 13px system-ui,sans-serif;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.25)';
    document.body.appendChild(a);
    return a;
  }

  ready(function () {
    var db = firebase.firestore();
    db.collection('cms').where('published', '==', true).get().then(function (snap) {
      var n = 0;
      snap.forEach(function (doc) {
        var x = doc.data();
        try { merge(x.type, JSON.parse(x.json)); n++; } catch (e) { console.warn('cms entry skipped', doc.id, e); }
      });
      if (n && typeof render === 'function') { try { render(window.__cur_v || 'home'); } catch (e) {} }
    }).catch(function (e) { console.warn('cms load failed', e); });

    var btn = adminButton();
    firebase.auth().onAuthStateChanged(function (u) {
      var em = ((u && u.email) || '').toLowerCase();
      if (btn) btn.style.display = ADMIN_EMAILS.indexOf(em) >= 0 ? 'inline-block' : 'none';
    });
  });
})();
