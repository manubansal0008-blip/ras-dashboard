/* RRR Shala — question layout in RPSC style.
   Each statement on its own line, the closing question on its own line, and
   "Match List-I with List-II" shown as an aligned two-column table.
   Labels (A/B/C/D, I/II/III/IV, i/ii/iii/iv, a/b/c/d, 1/2/3/4) are kept exactly as written. */
(function () {
  if (window.__rrqFmt) return; window.__rrqFmt = true;
  var css = document.createElement('style');
  css.textContent =
    '.rrq{line-height:1.6}.rrq .ld{margin:0 0 6px}.rrq .st{margin:5px 0 5px 4px;padding-left:2px}' +
    '.rrq .cq{margin:10px 0 2px;font-weight:600}' +
    '.rrq table.mt{border-collapse:collapse;margin:8px 0 6px;min-width:60%;max-width:100%}' +
    '.rrq table.mt td,.rrq table.mt th{padding:5px 18px 5px 8px;text-align:left;vertical-align:top;border-bottom:1px solid rgba(127,127,127,.18)}' +
    '.rrq table.mt th{font-weight:700;border-bottom:1.5px solid rgba(127,127,127,.35)}' +
    '.rrq table.mt tr.sub th{font-weight:600;font-size:.93em;opacity:.85}';
  (document.head || document.documentElement).appendChild(css);

  var LABEL = /^(\(?([A-Da-d]|[ivxIVX]{1,4}|\d{1,2})\)?[.)])\s+/;
  var CLOSE = /([.।?:])\s+((?:How many|Which (?:of|one|is|are|among)|Select the|Choose the|Of the above|Of these|In the above|Using the codes?|Codes?\s*:|Find the|Identify the|उपर्युक्त|उपरोक्त|ऊपर (?:दिए|दिये)|नीचे (?:दिए|दिये)|इनमें से|कितने|कौन(?:-| )?सा|कौनसा|कौन से|कौन-से|सही उत्तर|सही कूट|कूट\s*:)[\s\S]*)$/;

  // Stacked "List-I ... List-II ..." blocks are turned into side-by-side rows.
  function sideBySide(s) {
    var L = String(s).split(/\r?\n/), H1 = /^\s*(List\s*-?\s*I(?!I)|सूची\s*-?\s*I(?!I))\b.*$/i, H2 = /^\s*(List\s*-?\s*II|सूची\s*-?\s*II)\b.*$/i;
    for (var i = 0; i < L.length; i++) {
      if (!H1.test(L[i])) continue;
      var a = [], j = i + 1;
      while (j < L.length && LABEL.test(L[j].trim())) { a.push(L[j].trim()); j++; }
      if (!a.length || j >= L.length || !H2.test(L[j])) continue;
      var b = [], k = j + 1;
      while (k < L.length && LABEL.test(L[k].trim()) && b.length < a.length + 2) { b.push(L[k].trim()); k++; }
      if (!b.length) continue;
      var n = Math.max(a.length, b.length), rows = [L[i].trim().replace(/:$/, '') + '\t' + L[j].trim().replace(/:$/, '')];
      for (var r = 0; r < n; r++) rows.push((a[r] || '–') + '\t' + (b[r] || '–'));
      Array.prototype.splice.apply(L, [i, k - i].concat(rows));
      i += rows.length - 1;
    }
    return L.join('\n');
  }
  function splitCols(line) {
    var p = line.split(/\t+|\s{2,}/).map(function (x) { return x.trim(); }).filter(Boolean);
    return p.length >= 2 ? p : null;
  }
  function render(s) {
    var lines = sideBySide(s).split(/\r?\n/).map(function (x) { return x.replace(/[ \u00a0]+$/, ''); }).filter(function (x) { return x.trim(); });
    var out = [], i = 0, closing = '';
    while (i < lines.length) {
      var raw = lines[i], cols = i > 0 ? splitCols(raw.trim()) : null;
      if (cols) {
        var rows = [];
        while (i < lines.length && (cols = splitCols(lines[i].trim()))) { rows.push(cols); i++; }
        var html = '<table class="mt">', bodyStarted = false;
        rows.forEach(function (r, ri) {
          var isHead = !bodyStarted && !LABEL.test(r[0]);
          if (!isHead) bodyStarted = true;
          var tag = isHead ? 'th' : 'td';
          html += '<tr' + (isHead && ri > 0 ? ' class="sub"' : '') + '>' + r.map(function (c) { return '<' + tag + '>' + c + '</' + tag + '>'; }).join('') + '</tr>';
        });
        out.push(html + '</table>');
        continue;
      }
      var line = raw.trim().replace(/[ \t]+/g, ' ');
      if (i === 0) { out.push('<div class="ld">' + line + '</div>'); i++; continue; }
      if (LABEL.test(line)) {
        var m = line.match(CLOSE);
        if (m && i === lines.length - 1) { line = line.slice(0, m.index + 1); closing = m[2]; }
        out.push('<div class="st">' + line + '</div>');
      } else {
        out.push('<div class="cq">' + line + '</div>');
      }
      i++;
    }
    if (closing) out.push('<div class="cq">' + closing + '</div>');
    return '<div class="rrq">' + out.join('') + '</div>';
  }
  window.rrqFormat = render;

  function install() {
    if (typeof window.fmt !== 'function') return setTimeout(install, 200);
    if (window.fmt.__rrq) return;
    var orig = window.fmt;
    var f = function (s) {
      if (!s || String(s).indexOf('\n') < 0) return orig.apply(this, arguments);
      try { return render(s); } catch (e) { return orig.apply(this, arguments); }
    };
    f.__rrq = true;
    window.fmt = f;
    try { fmt = f; } catch (e) {}
  }
  install();
})();
