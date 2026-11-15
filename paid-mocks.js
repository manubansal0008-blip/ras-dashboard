/* RRR Shala — paid Full Length Tests (₹29, UPI + admin approval).
   Loaded by cms-loader.js. Data: Firestore "mocks" (paid users only), "paid_users", "pay_requests",
   UPI settings in cms/config_payment (public). */
(function () {
  if (window.__rrrPaid) return; window.__rrrPaid = true;
  var PRICE = 29;
  var st = { user: null, paid: false, req: null, cfg: null, loaded: false };

  function hi() { try { return LANG === 'hi'; } catch (e) { return (document.documentElement.lang || '').indexOf('hi') === 0; } }
  function T(en, h) { return hi() ? h : en; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function db() { return firebase.firestore(); }

  var css = document.createElement('style');
  css.textContent =
    '#rrrPaidCard{border:2px solid #e8a020;background:linear-gradient(135deg,#fffaf0,#fff);}' +
    '#rrrPaidCard h3{margin:0 0 6px;font-size:18px}#rrrPaidCard .price{font-size:26px;font-weight:800;color:#b86e00}' +
    '#rrrPaidCard ul{margin:8px 0 10px 18px;padding:0}#rrrPaidCard .pbtn{background:#e8a020;color:#1f2a3a;border:0;border-radius:10px;padding:11px 18px;font-weight:800;cursor:pointer;font-size:15px}' +
    '#rrrPayModal{position:fixed;inset:0;background:rgba(15,20,30,.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:14px}' +
    '#rrrPayModal .box{background:#fff;border-radius:14px;max-width:420px;width:100%;padding:18px;max-height:92vh;overflow:auto;font:15px/1.5 system-ui,"Segoe UI",sans-serif;color:#1f2a3a}' +
    '#rrrPayModal input{width:100%;padding:9px 10px;border:1px solid #ddd;border-radius:8px;font:inherit;margin:6px 0}' +
    '#rrrPayModal .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}#rrrPayModal .b{border:0;border-radius:9px;padding:10px 14px;font-weight:700;cursor:pointer}' +
    '#rrrPayModal .b.p{background:#e8a020;color:#1f2a3a}#rrrPayModal .b.s{background:#eef1f7;color:#26314f}#rrrPayModal .qr{display:block;margin:10px auto;width:210px;height:210px;border:1px solid #eee;border-radius:10px}' +
    '#rrrPayModal .m{font-size:13px;color:#5b6476}#rrrPayModal .ok{color:#1f8a4c;font-weight:700}#rrrPayModal .bad{color:#c0392b;font-weight:700}';
  document.head.appendChild(css);

  function upiLink() {
    var c = st.cfg || {};
    return 'upi://pay?pa=' + encodeURIComponent(c.upi || '') + '&pn=' + encodeURIComponent(c.payee || 'RRRSHALA') +
      '&am=' + PRICE + '&cu=INR&tn=' + encodeURIComponent('RRRSHALA Full Tests');
  }

  // ---------- card shown inside Mock Test view ----------
  function cardHTML() {
    var M = window.RRRMOCKS || {}, n = Object.keys(M).length;
    if (st.paid) {
      return '<div class="card" id="rrrPaidCard"><h3>🏆 ' + T('RRR Full Length Tests — unlocked', 'RRR फुल लेंथ टेस्ट — अनलॉक') + '</h3>' +
        '<p class="small">' + T('Your full tests are at the top of the Paper list above. Best of luck!', 'आपके फुल टेस्ट ऊपर Paper सूची में सबसे पहले हैं। शुभकामनाएँ!') + '</p></div>';
    }
    var pending = st.req && st.req.status === 'pending', rejected = st.req && st.req.status === 'rejected';
    return '<div class="card" id="rrrPaidCard"><h3>🏆 ' + T('RRR Full Length Tests', 'RRR फुल लेंथ टेस्ट') + '</h3>' +
      '<div class="price">₹' + PRICE + ' <span class="small" style="font-weight:600;color:#5b6476">' + T('one time · all full tests', 'एक बार · सभी फुल टेस्ट') + '</span></div>' +
      '<ul><li>' + T('Fresh 150-question papers on the RPSC pattern', 'RPSC पैटर्न पर नए 150 प्रश्नों के प्रश्न-पत्र') + '</li>' +
      '<li>' + T('3 hours · 4/3 mark each · 1/3 negative marking', '3 घंटे · प्रत्येक प्रश्न 4/3 अंक · 1/3 नकारात्मक अंकन') + '</li>' +
      '<li>' + T('Score, review and explanations in English & Hindi', 'स्कोर, रिव्यू और हिंदी-अंग्रेज़ी व्याख्या') + '</li>' +
      '<li>' + T('All future RRR full tests included', 'आगे आने वाले सभी RRR फुल टेस्ट शामिल') + '</li></ul>' +
      (pending ? '<p class="small"><b>⏳ ' + T('Payment received — waiting for approval (usually within a few hours).', 'भुगतान मिला — स्वीकृति की प्रतीक्षा (आमतौर पर कुछ घंटों में)।') + '</b></p>' :
        (rejected ? '<p class="small" style="color:#c0392b"><b>' + T('Your last payment could not be verified. Please check the UPI reference and try again.', 'आपका पिछला भुगतान सत्यापित नहीं हो सका। कृपया UPI संदर्भ संख्या जाँचकर दोबारा भेजें।') + '</b></p>' : '')) +
      '<button class="pbtn" onclick="rrrPayOpen()">' + (pending ? T('View payment status', 'भुगतान स्थिति देखें') : T('Unlock for ₹' + PRICE, '₹' + PRICE + ' में अनलॉक करें')) + '</button>' +
      '<p class="small muted" style="margin-top:8px">' + T('Previous-year papers (2016–2024) stay free in the list above.', 'पिछले वर्षों के प्रश्न-पत्र (2016–2024) ऊपर की सूची में निःशुल्क रहेंगे।') + '</p></div>';
  }
  function injectCard() {
    var v = document.getElementById('view-mock'); if (!v || window.__mockActive) return;
    var old = document.getElementById('rrrPaidCard'); if (old) old.remove();
    var first = v.querySelector('.card');
    var w = document.createElement('div'); w.innerHTML = cardHTML();
    if (first && first.nextSibling) v.insertBefore(w.firstChild, first.nextSibling); else v.appendChild(w.firstChild);
  }
  function hookRender() {
    if (typeof window.renderMock !== 'function' || window.__rrrPaidHook) return;
    var o = window.renderMock; window.__rrrPaidHook = true;
    window.renderMock = function () { var r = o.apply(this, arguments); try { injectCard(); } catch (e) {} return r; };
  }
  function rerender() {
    try {
      var v = document.getElementById('view-mock');
      var visible = v && v.offsetParent !== null;
      if (visible && !window.__mockActive && typeof window.renderMock === 'function') window.renderMock();
      else injectCard();
    } catch (e) {}
  }
  // Re-check unlock status (after admin approval) without needing a page refresh
  function recheck() {
    if (!st.user || st.paid) return;
    var em = (st.user.email || '').toLowerCase();
    db().collection('paid_users').doc(em).get().then(function (s) { if (s.exists) { st.paid = true; loadMocks(); } }).catch(function () {});
    db().collection('pay_requests').doc(em).get().then(function (s) { if (s.exists) { var d = s.data(); if (!st.req || st.req.status !== d.status) { st.req = d; rerender(); } } }).catch(function () {});
  }
  setInterval(recheck, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) recheck(); });

  // ---------- payment modal ----------
  window.rrrPayOpen = function () {
    var m = document.getElementById('rrrPayModal'); if (m) m.remove();
    m = document.createElement('div'); m.id = 'rrrPayModal';
    m.onclick = function (e) { if (e.target === m) m.remove(); };
    var c = st.cfg || {}, body;
    if (!st.user) {
      body = '<h3 style="margin:0 0 8px">' + T('Step 1: Sign in', 'चरण 1: साइन इन करें') + '</h3><p class="m">' +
        T('Sign in with Google so we can unlock the tests on your account.', 'Google से साइन इन करें ताकि टेस्ट आपके अकाउंट पर अनलॉक हो सकें।') + '</p>' +
        '<div class="row"><button class="b p" onclick="rrrPaySignIn()">' + T('Sign in with Google', 'Google से साइन इन') + '</button><button class="b s" onclick="this.closest(\'#rrrPayModal\').remove()">' + T('Close', 'बंद करें') + '</button></div>';
    } else if (st.paid) {
      body = '<p class="ok">✓ ' + T('Unlocked! Your full tests are in the Paper list.', 'अनलॉक! आपके फुल टेस्ट Paper सूची में हैं।') + '</p><div class="row"><button class="b s" onclick="this.closest(\'#rrrPayModal\').remove()">OK</button></div>';
    } else if (!c.upi) {
      body = '<p class="m">' + T('Payments are being set up. Please check back soon.', 'भुगतान की व्यवस्था की जा रही है। कृपया थोड़ी देर बाद देखें।') + '</p><div class="row"><button class="b s" onclick="this.closest(\'#rrrPayModal\').remove()">OK</button></div>';
    } else {
      var qr = 'https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=8&data=' + encodeURIComponent(upiLink());
      body = '<h3 style="margin:0 0 4px">' + T('Pay ₹' + PRICE + ' by UPI', 'UPI से ₹' + PRICE + ' भेजें') + '</h3>' +
        '<p class="m">' + T('Signed in as ', 'साइन इन: ') + esc(st.user.email) + '</p>' +
        '<img class="qr" alt="UPI QR" src="' + qr + '">' +
        '<p class="m" style="text-align:center">UPI ID: <b>' + esc(c.upi) + '</b> · ' + esc(c.payee || '') + '</p>' +
        '<div class="row" style="justify-content:center"><a class="b s" style="text-decoration:none" href="' + upiLink() + '">' + T('Open UPI app', 'UPI ऐप खोलें') + '</a></div>' +
        '<h3 style="margin:14px 0 4px;font-size:16px">' + T('Step 2: After paying, enter the UPI reference / UTR number', 'चरण 2: भुगतान के बाद UPI संदर्भ / UTR संख्या लिखें') + '</h3>' +
        '<input id="rrrUtr" maxlength="40" placeholder="' + T('12-digit UPI reference (UTR)', '12 अंकों की UPI संदर्भ संख्या (UTR)') + '" value="' + esc(st.req && st.req.utr || '') + '">' +
        '<input id="rrrPname" maxlength="60" placeholder="' + T('Your name (as in the UPI app)', 'आपका नाम (जैसा UPI ऐप में है)') + '" value="' + esc(st.req && st.req.name || '') + '">' +
        '<div id="rrrPayMsg" class="m"></div>' +
        '<div class="row"><button class="b p" onclick="rrrPaySubmit()">' + T('Submit for approval', 'स्वीकृति के लिए भेजें') + '</button><button class="b s" onclick="this.closest(\'#rrrPayModal\').remove()">' + T('Close', 'बंद करें') + '</button></div>' +
        '<p class="m" style="margin-top:10px">' + T('We check every payment and unlock your account, usually within a few hours. Your full tests then appear here automatically.', 'हम हर भुगतान जाँचकर आपका अकाउंट अनलॉक करते हैं, आमतौर पर कुछ घंटों में। फिर आपके फुल टेस्ट यहाँ अपने आप दिखेंगे।') + '</p>';
    }
    m.innerHTML = '<div class="box">' + body + '</div>';
    document.body.appendChild(m);
  };
  window.rrrPaySignIn = function () {
    firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(function () { setTimeout(window.rrrPayOpen, 800); }).catch(function () {});
  };
  window.rrrPaySubmit = function () {
    var utr = (document.getElementById('rrrUtr').value || '').replace(/\s+/g, ''), nm = (document.getElementById('rrrPname').value || '').trim();
    var out = document.getElementById('rrrPayMsg');
    if (!/^[A-Za-z0-9]{6,40}$/.test(utr)) { out.className = 'bad'; out.textContent = T('Please enter a valid UPI reference number.', 'कृपया सही UPI संदर्भ संख्या लिखें।'); return; }
    var em = (st.user.email || '').toLowerCase();
    var doc = { email: em, utr: utr, name: nm.slice(0, 60), amount: PRICE, status: 'pending', at: firebase.firestore.FieldValue.serverTimestamp() };
    db().collection('pay_requests').doc(em).set(doc).then(function () {
      st.req = doc; out.className = 'ok'; out.textContent = T('Sent! We will unlock your tests after checking the payment.', 'भेज दिया! भुगतान जाँचने के बाद हम आपके टेस्ट अनलॉक कर देंगे।');
      // Email the admin about the new request (FormSubmit)
      try {
        fetch('https://formsubmit.co/ajax/manubansal0008@gmail.com', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ _subject: 'RRRSHALA: new Rs 29 approval request', _template: 'table', _captcha: 'false',
            Student: em, Name: nm || '-', UTR: utr, Amount: 'Rs ' + PRICE, Approve_here: 'https://www.rrrshala.com/admin.html' })
        }).catch(function () {});
      } catch (e) {}
      rerender();
    }).catch(function (e) { out.className = 'bad'; out.textContent = T('Could not send. Please try again.', 'भेजा नहीं जा सका। कृपया दोबारा कोशिश करें।'); console.warn(e); });
  };

  // ---------- nav entry ----------
  function navEntry() {
    var nav = document.querySelector('nav.nav'); if (!nav || document.getElementById('rrrPaidNav')) return;
    var b = document.createElement('button'); b.id = 'rrrPaidNav'; b.type = 'button';
    b.innerHTML = '<span class="lf"><span class="ic">🏆</span><span class="tx">' + T('Full Length Tests', 'फुल लेंथ टेस्ट') + '</span></span><span class="badge" style="background:#e8a020;color:#1f2a3a">₹' + PRICE + '</span>';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      try { show('mock'); } catch (x) {}
      setTimeout(function () { var c = document.getElementById('rrrPaidCard'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
    });
    var mockBtn = nav.querySelector('[data-v="mock"]');
    if (mockBtn && mockBtn.parentNode === nav) nav.insertBefore(b, mockBtn.nextSibling); else nav.appendChild(b);
  }

  // ---------- data ----------
  function loadMocks() {
    db().collection('mocks').get().then(function (snap) {
      window.RRRMOCKS = window.RRRMOCKS || {};
      snap.forEach(function (s) {
        try {
          var d = JSON.parse(s.data().json); if (!d || !d.code) return;
          (d.questions || []).forEach(function (q) { try { BYID[q.id] = q; } catch (e) {} });
          window.RRRMOCKS[d.code] = d;
        } catch (e) { console.warn('mock skipped', s.id, e); }
      });
      rerender();
    }).catch(function (e) { console.warn('mocks load failed', e); });
  }
  function onUser(u) {
    st.user = u; st.paid = false; st.req = null;
    if (!u) { rerender(); return; }
    var em = (u.email || '').toLowerCase();
    db().collection('paid_users').doc(em).get().then(function (s) {
      st.paid = s.exists || em === 'manubansal0008@gmail.com';
      if (st.paid) loadMocks(); else rerender();
    }).catch(function () { rerender(); });
    db().collection('pay_requests').doc(em).get().then(function (s) { if (s.exists) { st.req = s.data(); rerender(); } }).catch(function () {});
  }

  function start() {
    if (!(window.firebase && firebase.apps && firebase.apps.length)) return setTimeout(start, 150);
    hookRender(); navEntry();
    db().collection('cms').doc('config_payment').get().then(function (s) { if (s.exists) { st.cfg = s.data(); try { st.cfg = Object.assign({}, st.cfg, JSON.parse(s.data().json || '{}')); } catch (e) {} } }).catch(function () {});
    firebase.auth().onAuthStateChanged(onUser);
    injectCard();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
