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

  var LABEL = /^(\(?([A-Za-z]|[ivxIVX]{1,4}|\d{1,2})\)?[.)])\s+/;
  var CLOSE = /([.।?:])\s+((?:How many|Which (?:of|one|is|are|among)|Select the|Choose the|Of the above|Of these|In the above|Using the codes?|Codes?\s*:|Find the|Identify the|उपर्युक्त|उपरोक्त|ऊपर (?:दिए|दिये)|नीचे (?:दिए|दिये)|इनमें से|कितने|कौन(?:-| )?सा|कौनसा|कौन से|कौन-से|सही उत्तर|सही कूट|कूट\s*:)[\s\S]*)$/;

  // Any "Match List-I with List-II" layout (stacked, one-line, | table, P/Q/R/S, (a)/(I) labels) becomes side-by-side rows.
  function rrqMatch(s) {
  s = String(s);
  if (!/List\s*-?\s*I|सूची\s*-?\s*I/i.test(s)) return s;
  var TOK = '\\(?(?:[A-Za-z]|[ivxIVX]{1,4}|\\d{1,2})\\)?[.)]';
  var isTok = new RegExp('^' + TOK + '$');
  function typ(t) { t = t.replace(/[().]/g, ''); return /^\d+$/.test(t) ? 'd' : (/^[IVX]+$/.test(t) || /^[ivx]+$/.test(t)) ? 'r' : 'l'; }
  // 1) "| List-I | List-II | | (a) x | (I) y |" tables stored on one line
  if (s.indexOf('|') >= 0 && /\|\s*(List|सूची)/i.test(s)) {
    var k = s.indexOf('|'), pre = s.slice(0, k).trim(), LB = /^\(\w{1,4}\)|^\w{1,4}[.)]\s/;
    var cells = s.slice(k).split('|').map(function (c) { return c.trim(); }).filter(function (c) { return c && !/^[-:\s]+$/.test(c); });
    var out = [pre], j = 0;
    if (cells.length >= 2 && /^(List|सूची)/i.test(cells[0])) { out.push(cells[0] + ' ' + cells[1]); j = 2; }
    while (j + 1 < cells.length && LB.test(cells[j]) && LB.test(cells[j + 1])) { out.push(cells[j] + ' ' + cells[j + 1]); j += 2; }
    if (j < cells.length) out.push(cells.slice(j).join(' '));
    s = out.join('\n');
  }
  // 2) "List-I: P. a; Q. b" written on one line
  s = s.replace(/^\s*((?:List|सूची)\s*-?\s*I{1,2}(?:\s*\([^)]*\))?)\s*[:：]\s*(.+)$/gim, function (all, h, b) { var p = b.indexOf(';') >= 0 ? b.split(/\s*;\s*/) : b.split(/\s(?=\((?:[A-Za-z]|[ivxIVX]{1,4}|\d{1,2})\)\s)/); return p.length > 1 ? h + '\n' + p.join('\n') : all; });
  // 3) everything flattened into one line: split before each item of the first list
  s = s.split(/\r?\n/).map(function (line) {
    var re = /\s(\((?:[A-Za-z]|[ivxIVX]{1,4}|\d{1,2})\))\s/g, m, toks = [];
    while ((m = re.exec(line))) toks.push({ i: m.index, t: m[1] });
    if (toks.length < 4) return line;
    var T = typ(toks[0].t), cut = toks.filter(function (x) { return typ(x.t) === T; }).map(function (x) { return x.i; });
    if (cut.length < 2) return line;
    var parts = [], last = 0;
    cut.forEach(function (c) { parts.push(line.slice(last, c)); last = c + 1; });
    parts.push(line.slice(last));
    var tail = parts[parts.length - 1].match(/^(.*?)\s+((?:कूट|Codes?|Code)\s*[:：\-]*\s*)$/i);
    if (tail) { parts[parts.length - 1] = tail[1]; parts.push(tail[2]); }
    return parts.join('\n');
  }).join('\n');
  // 4) collect List-I / List-II items and lay them side by side
  var L = s.split(/\r?\n/), keep = [], left = [], right = [], first = -1, lt = null;
  var ITEM = new RegExp('^(' + TOK + ')\\s+(.+)$');
  var PAIR = new RegExp('^(' + TOK + ')\\s+(.+?\\S)\\s+(' + TOK + ')\\s+(.+)$');
  var HDR = /^\s*(List\s*-?\s*I{1,2}|सूची\s*-?\s*I{1,2})\b[^.?:।]*[:]?\s*$/i;
  for (var i = 0; i < L.length; i++) {
    var t = L[i].trim().replace(/\s+/g, ' '), pm = t.match(PAIR), im = t.match(ITEM);
    if (i > 0 && pm && typ(pm[1]) !== typ(pm[3])) {
      if (first < 0) first = keep.length; lt = lt || typ(pm[1]);
      left.push(pm[1] + ' ' + pm[2]); right.push(pm[3] + ' ' + pm[4]); continue;
    }
    if (i > 0 && im) {
      var tp = typ(im[1]);
      if (!left.length || (!right.length && tp === lt)) { if (first < 0) first = keep.length; lt = tp; left.push(t); continue; }
      if (tp !== lt && right.length < left.length + 2) { right.push(t); continue; }
    }
    if (HDR.test(t)) continue;
    keep.push(L[i]);
  }
  if (left.length < 2 || right.length < 2) return String(arguments[0]);
  var hm = s.match(/(List\s*-?\s*I(?!I)(?:\s*\([^)]*\))?)\s*[:\-]?\s*(List\s*-?\s*II(?:\s*\([^)]*\))?)\s*:?\s*$/im) ||
           s.match(/(सूची\s*-?\s*I(?!I)(?:\s*\([^)]*\))?)\s*[:\-]?\s*(सूची\s*-?\s*II(?:\s*\([^)]*\))?)\s*:?\s*$/m);
  var hi = /सूची/.test(s) && !/List\s*-?\s*I/i.test(s);
  var h1 = hm ? hm[1] : (hi ? 'सूची-I' : 'List-I'), h2 = hm ? hm[2] : (hi ? 'सूची-II' : 'List-II');
  keep = keep.map(function (x) {
    return x.replace(/\s*(List\s*-?\s*I(?!I)(?:\s*\([^)]*\))?)(\s*[:\-]?\s*List\s*-?\s*II(?:\s*\([^)]*\))?)?\s*$/i, '')
            .replace(/\s*(सूची\s*-?\s*I(?!I)(?:\s*\([^)]*\))?)(\s*[:\-]?\s*सूची\s*-?\s*II(?:\s*\([^)]*\))?)?\s*$/, '');
  });
  var sq = function (x) { return x.replace(/\s+/g, ' ').trim(); };
  var tl = right[right.length - 1].match(/^(.*?)\s+((?:कूट|Codes?)\s*[:：\-]*\s*)$/i), after = [];
  if (tl) { right[right.length - 1] = tl[1]; after.push(tl[2]); }
  var n = Math.max(left.length, right.length), rows = [sq(h1) + '\t' + sq(h2)];
  for (var r = 0; r < n; r++) rows.push(sq(left[r] || '–').replace(/\s*[-–—:]\s*$/, '') + '\t' + sq(right[r] || '–'));
  Array.prototype.splice.apply(keep, [first, 0].concat(rows).concat(after));
  return keep.join('\n');
}
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
    var lines = sideBySide(rrqMatch(s)).split(/\r?\n/).map(function (x) { return x.replace(/[ \u00a0]+$/, ''); }).filter(function (x) { return x.trim(); });
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
