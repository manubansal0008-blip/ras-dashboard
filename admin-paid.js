/* RRR Shala admin — Payments (₹29 full tests) and Full Tests manager. Loaded by admin.html. */
(function () {
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function when(ts) { try { return ts && ts.toDate ? ts.toDate().toLocaleString('en-IN') : ''; } catch (e) { return ''; } }
  var fdb = function () { return firebase.firestore(); };
  var FV = function () { return firebase.firestore.FieldValue; };

  var tabs = $('tabs'), main = document.querySelector('main #app');
  ['pay:💰 Payments (₹29)', 'full:🏆 Full Tests'].forEach(function (x) {
    var p = x.split(':'), b = document.createElement('button'); b.dataset.t = 'x_' + p[0]; b.textContent = p[1]; tabs.appendChild(b);
  });
  var box = document.createElement('div'); box.id = 'paidBox'; box.className = 'card hidden'; main.appendChild(box);

  var orig = tabs.onclick;
  tabs.onclick = function (e) {
    var t = e.target.dataset.t; if (!t) return;
    if (t.indexOf('x_') === 0) {
      document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); });
      $('editor').classList.add('hidden'); $('listCard').classList.add('hidden'); box.classList.remove('hidden');
      if (t === 'x_pay') showPay(); else showFull();
    } else { box.classList.add('hidden'); orig.call(this, e); }
  };

  // ---------------- Payments ----------------
  function showPay() {
    box.innerHTML =
      '<h3 style="margin-top:0">UPI settings</h3><div class="row"><div><label>UPI ID</label><input id="pUpi" placeholder="name@bank"></div>' +
      '<div><label>Payee name (shown on QR)</label><input id="pPayee" placeholder="RRRSHALA"></div></div>' +
      '<div style="margin-top:10px"><button class="btn acc" onclick="paySaveCfg()">Save UPI settings</button> <span id="pCfgMsg" class="msg"></span></div>' +
      '<h3>Payment requests</h3><p class="muted">Check each UTR in your UPI/bank app (₹29 received?) before approving.</p>' +
      '<table><thead><tr><th>Email</th><th>Name</th><th>UTR</th><th>Sent</th><th>Status</th><th></th></tr></thead><tbody id="pRows"><tr><td colspan="6" class="muted">Loading…</td></tr></tbody></table>' +
      '<h3>Unlocked students</h3><div class="row"><div><label>Add email manually</label><input id="pAdd" placeholder="student@gmail.com"></div><div style="align-self:end"><button class="btn" onclick="payAddManual()">Unlock this email</button></div></div>' +
      '<table style="margin-top:10px"><thead><tr><th>Email</th><th>UTR</th><th>Unlocked</th><th></th></tr></thead><tbody id="pPaid"><tr><td colspan="4" class="muted">Loading…</td></tr></tbody></table>';
    fdb().collection('cms').doc('config_payment').get().then(function (s) { if (s.exists) { $('pUpi').value = s.data().upi || ''; $('pPayee').value = s.data().payee || ''; } });
    loadReq(); loadPaid();
  }
  window.paySaveCfg = function () {
    var upi = $('pUpi').value.trim(), payee = $('pPayee').value.trim();
    if (!/^[\w.\-]{2,}@[\w.\-]{2,}$/.test(upi)) { $('pCfgMsg').className = 'msg bad'; $('pCfgMsg').textContent = 'Enter a valid UPI ID'; return; }
    fdb().collection('cms').doc('config_payment').set({ type: 'config', published: false, json: '{}', upi: upi, payee: payee, updatedAt: FV().serverTimestamp() })
      .then(function () { $('pCfgMsg').className = 'msg ok'; $('pCfgMsg').textContent = 'Saved ✓'; })
      .catch(function (e) { $('pCfgMsg').className = 'msg bad'; $('pCfgMsg').textContent = e.message; });
  };
  function loadReq() {
    fdb().collection('pay_requests').get().then(function (snap) {
      var r = []; snap.forEach(function (s) { r.push(Object.assign({ id: s.id }, s.data())); });
      var order = { pending: 0, rejected: 1, approved: 2 };
      r.sort(function (a, b) { return (order[a.status] || 0) - (order[b.status] || 0); });
      $('pRows').innerHTML = r.length ? r.map(function (x) {
        return '<tr><td>' + esc(x.email) + '</td><td>' + esc(x.name) + '</td><td><b>' + esc(x.utr) + '</b></td><td class="muted">' + when(x.at) + '</td><td><span class="pill">' + esc(x.status) + '</span></td><td style="white-space:nowrap">' +
          (x.status !== 'approved' ? '<button class="btn acc" onclick="payApprove(\'' + esc(x.id) + '\')">Approve</button> ' : '') +
          (x.status === 'pending' ? '<button class="btn alt" onclick="payReject(\'' + esc(x.id) + '\')">Reject</button>' : '') + '</td></tr>';
      }).join('') : '<tr><td colspan="6" class="muted">No requests yet.</td></tr>';
    }).catch(function (e) { $('pRows').innerHTML = '<tr><td colspan="6" class="bad">' + esc(e.message) + '</td></tr>'; });
  }
  function loadPaid() {
    fdb().collection('paid_users').get().then(function (snap) {
      var r = []; snap.forEach(function (s) { r.push(Object.assign({ id: s.id }, s.data())); });
      $('pPaid').innerHTML = r.length ? r.map(function (x) {
        return '<tr><td>' + esc(x.id) + '</td><td>' + esc(x.utr || '') + '</td><td class="muted">' + when(x.at) + '</td><td><button class="btn red" onclick="payRevoke(\'' + esc(x.id) + '\')">Remove</button></td></tr>';
      }).join('') : '<tr><td colspan="4" class="muted">No unlocked students yet.</td></tr>';
    });
  }
  function unlock(email, utr) {
    return fdb().collection('paid_users').doc(email).set({ utr: utr || '', at: FV().serverTimestamp(), by: firebase.auth().currentUser.email });
  }
  window.payApprove = function (id) {
    fdb().collection('pay_requests').doc(id).get().then(function (s) {
      var d = s.data() || {};
      return unlock(id, d.utr).then(function () { return fdb().collection('pay_requests').doc(id).update({ status: 'approved', decidedAt: FV().serverTimestamp() }); });
    }).then(function () { loadReq(); loadPaid(); }).catch(function (e) { alert(e.message); });
  };
  window.payReject = function (id) {
    fdb().collection('pay_requests').doc(id).update({ status: 'rejected', decidedAt: FV().serverTimestamp() }).then(loadReq).catch(function (e) { alert(e.message); });
  };
  window.payAddManual = function () {
    var em = $('pAdd').value.trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return alert('Enter a valid email');
    unlock(em, 'manual').then(function () { $('pAdd').value = ''; loadPaid(); }).catch(function (e) { alert(e.message); });
  };
  window.payRevoke = function (id) {
    if (!confirm('Remove access for ' + id + '?')) return;
    fdb().collection('paid_users').doc(id).delete().then(loadPaid).catch(function (e) { alert(e.message); });
  };

  // ---------------- Full tests ----------------
  function showFull() {
    box.innerHTML =
      '<h3 style="margin-top:0">Full Length Tests (paid ₹29)</h3><p class="muted">Only unlocked students can open these. Previous-year papers stay free.</p>' +
      '<table><thead><tr><th>Code</th><th>Title</th><th>Questions</th><th>Updated</th><th></th></tr></thead><tbody id="fRows"><tr><td colspan="5" class="muted">Loading…</td></tr></tbody></table>' +
      '<h3>Add / update a full test</h3><label>JSON <span class="muted">— must include "code" (e.g. RRR-M03), "label_en", "label_hi", "date" and "questions" (150)</span></label>' +
      '<textarea id="fJson" class="json" spellcheck="false"></textarea><div style="margin-top:10px"><button class="btn acc" onclick="fullSave()">Save full test</button> <span id="fMsg" class="msg"></span></div>' +
      '<h3>Old full tests in the free section</h3><p class="muted">Copies full tests still published in the free CMS into the paid list, then unpublishes the free copy.</p>' +
      '<button class="btn alt" onclick="fullMigrate()">Move old full tests to paid</button> <span id="mMsg" class="msg"></span>';
    loadFull();
  }
  function loadFull() {
    fdb().collection('mocks').get().then(function (snap) {
      var r = []; snap.forEach(function (s) { var x = s.data(), d = {}; try { d = JSON.parse(x.json); } catch (e) {} r.push({ id: s.id, label: d.label_en || '', n: (d.questions || []).length, at: x.updatedAt }); });
      r.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      $('fRows').innerHTML = r.length ? r.map(function (x) {
        return '<tr><td><b>' + esc(x.id) + '</b></td><td>' + esc(x.label) + '</td><td>' + x.n + '</td><td class="muted">' + when(x.at) + '</td><td><button class="btn alt" onclick="fullEdit(\'' + esc(x.id) + '\')">Edit</button></td></tr>';
      }).join('') : '<tr><td colspan="5" class="muted">No paid full tests yet.</td></tr>';
    }).catch(function (e) { $('fRows').innerHTML = '<tr><td colspan="5" class="bad">' + esc(e.message) + '</td></tr>'; });
  }
  window.fullEdit = function (id) {
    fdb().collection('mocks').doc(id).get().then(function (s) { try { $('fJson').value = JSON.stringify(JSON.parse(s.data().json), null, 2); } catch (e) { $('fJson').value = s.data().json; } $('fJson').scrollIntoView(); });
  };
  window.fullSave = function () {
    var d; try { d = JSON.parse($('fJson').value); } catch (e) { $('fMsg').className = 'msg bad'; $('fMsg').textContent = 'Invalid JSON: ' + e.message; return; }
    if (!d.code || !Array.isArray(d.questions)) { $('fMsg').className = 'msg bad'; $('fMsg').textContent = 'JSON needs "code" and "questions"'; return; }
    fdb().collection('mocks').doc(d.code).set({ code: d.code, json: JSON.stringify(d), updatedAt: FV().serverTimestamp(), by: firebase.auth().currentUser.email })
      .then(function () { $('fMsg').className = 'msg ok'; $('fMsg').textContent = 'Saved ✓ (' + d.code + ', ' + d.questions.length + ' Q)'; loadFull(); })
      .catch(function (e) { $('fMsg').className = 'msg bad'; $('fMsg').textContent = e.message; });
  };
  window.fullMigrate = function () {
    $('mMsg').className = 'msg'; $('mMsg').textContent = 'Working…';
    fdb().collection('cms').where('type', '==', 'mock').get().then(function (snap) {
      var jobs = [], names = [];
      snap.forEach(function (s) {
        var x = s.data(), d; try { d = JSON.parse(x.json); } catch (e) { return; }
        if (!d || !d.code) return; names.push(d.code);
        jobs.push(fdb().collection('mocks').doc(d.code).set({ code: d.code, json: x.json, updatedAt: FV().serverTimestamp(), by: firebase.auth().currentUser.email, from: 'cms/' + s.id })
          .then(function () { return fdb().collection('cms').doc(s.id).update({ published: false }); }));
      });
      return Promise.all(jobs).then(function () { return names; });
    }).then(function (names) { $('mMsg').className = 'msg ok'; $('mMsg').textContent = names.length ? 'Moved ✓ ' + names.join(', ') : 'Nothing to move'; loadFull(); })
      .catch(function (e) { $('mMsg').className = 'msg bad'; $('mMsg').textContent = e.message; });
  };
})();
