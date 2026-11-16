"""Build static SEO pages for rrrshala.com from the published CMS (Firestore).
Runs in GitHub Actions (see .github/workflows/static-pages.yml). Safe to re-run:
it rewrites day pages and only appends new dates to index pages and the sitemap."""
import json, os, re, html, sys, urllib.request
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT = 'rrrshala-c2972'
API_KEY = 'AIzaSyC1h0iHOgH2i1PQviNLn1pqhpvADuKG-7c'  # public web key already in index.html

def load_cms():
    if os.environ.get('CMS_JSON'):
        return json.load(open(os.environ['CMS_JSON']))
    body = json.dumps({"structuredQuery": {"from": [{"collectionId": "cms"}], "where": {"fieldFilter": {
        "field": {"fieldPath": "published"}, "op": "EQUAL", "value": {"booleanValue": True}}}}}).encode()
    req = urllib.request.Request(
        f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents:runQuery?key={API_KEY}',
        data=body, headers={'Content-Type': 'application/json', 'Referer': 'https://www.rrrshala.com/'})
    rows = json.load(urllib.request.urlopen(req, timeout=60))
    out = {}
    for r in rows:
        doc = r.get('document')
        if not doc: continue
        f = doc.get('fields', {})
        try: out[doc['name'].rsplit('/', 1)[1]] = json.loads(f['json']['stringValue'])
        except Exception as e: print('skip', doc.get('name'), e)
    return out

D = load_cms()
print(len(D), 'published CMS entries')
if len(D) < 50: sys.exit('Too few CMS entries; aborting so nothing is overwritten.')
B = 'https://www.rrrshala.com'
E = lambda s: html.escape(str(s or ''), quote=True)
MEN = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
MHI = ['', 'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']
def lab(d, hi=False):
    y, m, dd = d.split('-'); return f"{int(dd)} {(MHI if hi else MEN)[int(m)]} {y}"
STYLE = re.search(r'<style>.*?</style>', open(f'{REPO}/news/2026-07-17/index.html', encoding='utf-8').read(), re.S).group(0)

def by(t): return {k.split('_', 1)[1]: v for k, v in D.items() if k.startswith(t + '_')}
NEWS, QUIZ, EDIT = by('news'), by('dailyquiz'), by('edit')

def existing(sec):
    p = f'{REPO}/{sec}'; return sorted(x for x in os.listdir(p) if re.match(r'\d{4}-\d\d-\d\d$', x))

# section config
SEC = {
 'news': dict(en=dict(name='News', title='RAS Daily News Digest {L} — Current Affairs', h1='RAS News Digest — {L}',
      desc='Rajasthan RAS daily news digest for {L} — {n} curated news items with key points. English & Hindi.',
      intro='Newspaper-based news digest for the RPSC RAS exam, dated {L}.', cta="Read & hear today's bulletin in the app →",
      all='&larr; All news dates', type='NewsArticle'),
    hi=dict(name='समाचार', title='आरएएस दैनिक समाचार सार {L} — समसामयिकी', h1='आरएएस समाचार सार — {L}',
      desc='{L} हेतु राजस्थान RAS दैनिक समाचार सार — {n} चयनित समाचार, मुख्य बिंदुओं सहित। अंग्रेज़ी व हिंदी।',
      intro='RPSC RAS परीक्षा हेतु समाचार-पत्र आधारित समाचार सार, दिनांक {L}।', cta='आज की बुलेटिन ऐप में पढ़ें व सुनें →',
      all='&larr; सभी समाचार तिथियाँ', type='NewsArticle')),
 'current-affairs': dict(en=dict(name='Current Affairs', title='RAS Current Affairs {L} — MCQs with Answers', h1='RAS Current Affairs — {L}',
      desc='Rajasthan RAS current-affairs MCQs for {L} — {n} questions with answers and explanations. Free, bilingual (English & Hindi).',
      intro='Daily current-affairs MCQs for the RPSC RAS exam, dated {L} — with answers and explanations.', cta='Practice these as a timed quiz in the app →',
      all='&larr; All current-affairs dates', type='Article'),
    hi=dict(name='समसामयिकी', title='आरएएस समसामयिकी {L} — उत्तर सहित MCQ', h1='आरएएस समसामयिकी — {L}',
      desc='{L} हेतु राजस्थान RAS समसामयिकी — {n} प्रश्न, उत्तर व व्याख्या सहित। निःशुल्क, द्विभाषी (अंग्रेज़ी व हिंदी)।',
      intro='RPSC RAS परीक्षा हेतु दैनिक समसामयिकी MCQ, दिनांक {L} — उत्तर व व्याख्या सहित।', cta='इन्हें ऐप में टाइम्ड क्विज़ के रूप में हल करें →',
      all='&larr; सभी समसामयिकी तिथियाँ', type='Article')),
 'editorials': dict(en=dict(name='Editorials', title='RAS Editorial Analysis {L} — Issues, Points & Mains Question', h1='RAS Editorial Analysis — {L}',
      desc='Editorial analysis for the RPSC RAS Mains, dated {L} — {n} editorial(s) with background, key points and a practice question. English & Hindi.',
      intro="Topic-shaped analysis of the day's editorials for the RPSC RAS Mains, dated {L}.", cta='Get the full analysis (mind map, debate, model answer) in the app →',
      all='&larr; All editorial dates', type='Article'),
    hi=dict(name='संपादकीय', title='आरएएस संपादकीय विश्लेषण {L} — मुद्दे, बिंदु व मुख्य प्रश्न', h1='आरएएस संपादकीय विश्लेषण — {L}',
      desc='RPSC RAS मुख्य परीक्षा हेतु संपादकीय विश्लेषण, दिनांक {L} — {n} संपादकीय, पृष्ठभूमि, मुख्य बिंदु व अभ्यास प्रश्न सहित। अंग्रेज़ी व हिंदी।',
      intro='RPSC RAS मुख्य परीक्षा हेतु दिन के संपादकीयों का विषयानुरूप विश्लेषण, दिनांक {L}।', cta='पूर्ण विश्लेषण (माइंडमैप, वाद-विवाद, आदर्श उत्तर) ऐप में पाएँ →',
      all='&larr; सभी संपादकीय तिथियाँ', type='Article')),
}

def url(sec, d, hi): return f"{B}/{'hi/' if hi else ''}{sec}/{d}/"

def page(sec, d, hi, n, body, prev, also):
    c = SEC[sec]['hi' if hi else 'en']; L = lab(d, hi)
    title = c['title'].format(L=L); desc = c['desc'].format(L=L, n=n); u = url(sec, d, hi)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": c['type'], "headline": c['h1'].format(L=L), "description": desc, "url": u,
         "mainEntityOfPage": {"@type": "WebPage", "@id": u}, "datePublished": d + "T06:00:00+05:30", "dateModified": d + "T06:00:00+05:30",
         "inLanguage": "hi-IN" if hi else "en-IN", "isAccessibleForFree": True, "image": B + "/og-cover.jpg",
         "publisher": {"@type": "Organization", "name": "RRRSHALA", "url": B + "/", "logo": {"@type": "ImageObject", "url": B + "/og-cover.jpg"}},
         "author": {"@type": "Organization", "name": "RRRSHALA", "url": B + "/"}, "articleSection": "Current Affairs"},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "होम" if hi else "Home", "item": B + "/"},
            {"@type": "ListItem", "position": 2, "name": c['name'], "item": f"{B}/{'hi/' if hi else ''}{sec}/"},
            {"@type": "ListItem", "position": 3, "name": L, "item": u}]}]}
    other = url(sec, d, not hi)
    h = f'''<!DOCTYPE html><html lang="{'hi' if hi else 'en'}"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="{u}">
<link rel="alternate" hreflang="en-IN" href="{url(sec, d, False)}">
<link rel="alternate" hreflang="hi-IN" href="{url(sec, d, True)}">
<link rel="alternate" hreflang="x-default" href="{url(sec, d, False)}">
<meta property="og:type" content="article"><meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}"><meta property="og:url" content="{u}">
<meta property="og:image" content="{B}/og-cover.jpg">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
{STYLE}</head><body>
<header class="top"><a class="logo" href="{B}/">RRRSHALA</a><a class="lang" href="{other}">{'English' if hi else 'हिन्दी'}</a></header>
<div class="wrap"><p class="crumb"><a href="{B}/">{'होम' if hi else 'Home'}</a> &rsaquo; <a href="{B}/{'hi/' if hi else ''}{sec}/">{c['name']}</a> &rsaquo; {L}</p>
<h1>{E(c['h1'].format(L=L))}</h1>
<p class="intro">{E(c['intro'].format(L=L))}</p>
{body}
<p style="margin-top:24px"><a class="cta" href="{B}/">{c['cta']}</a></p>
'''
    nav = ''
    if prev:
        nav = f'<nav class="daynav" aria-label="{"पिछला व अगला दिन" if hi else "Previous and next day"}"><a rel="prev" href="{url(sec, prev, hi)}">&larr; {"पिछला" if hi else "Previous"} ({prev})</a></nav>'
    al = ''
    if also:
        al = f'<p class="alsofor">{"इसी तिथि हेतु भी" if hi else "Also for this date"}: ' + ' · '.join(f'<a href="{url(s, d, hi)}">{t}</a>' for s, t in also) + '</p>'
    h += nav + al + f'\n<p class="crumb"><a href="{B}/{"hi/" if hi else ""}{sec}/">{c["all"]}</a></p></div></body></html>'
    return h

def news_body(z, hi):
    k = '_hi' if hi else '_en'; out = []
    for it in z['digest']:
        pts = ''.join(f'<li>{E(p)}</li>' for p in it.get('points' + k) or it.get('points_en') or [])
        out.append(f'<div class="card"><span class="qtag">{E(it.get("topic" + k) or it.get("topic_en"))}</span><h3 style="margin:0 0 6px">{E(it.get("head" + k) or it.get("head_en"))}</h3><ul>{pts}</ul></div>')
    return '\n'.join(out)

def quiz_body(z, hi):
    out = []
    for i, q in enumerate(z['questions'], 1):
        qt = (q.get('hq') if hi else q.get('eq')) or q.get('eq', '')
        op = (q.get('ho') if hi else q.get('eo')) or q.get('eo', {})
        ex = (q.get('exp_hi') if hi else q.get('exp_en')) or q.get('exp_en', '')
        sub = (q.get('sub_hi') if hi else q.get('sub')) or q.get('sub', '')
        a = q.get('a', 'A')
        lis = ''.join(f'<li>{E(op.get(x, ""))}</li>' for x in 'ABCD')
        qh = E(qt).replace('\n', '<br>')
        out.append(f'<div class="card qcard"><span class="qtag">{E(sub)}</span><h3 style="margin:0 0 4px">{i}. {qh}</h3><ol type="A">{lis}</ol><p class="ans"><b>{"उत्तर" if hi else "Answer"}:</b> {a}. {E(op.get(a, ""))} — {E(ex)}</p></div>')
    return '\n'.join(out)

def edit_body(z, hi):
    k = '_hi' if hi else '_en'; out = []
    for it in z['items']:
        g = lambda f: it.get(f + k) or it.get(f + '_en') or ''
        paras = ''
        for b in it.get('blocks', []):
            if b.get('kind') == 'p':
                paras += f'<p>{E(b.get("text" + k) or b.get("text_en"))}</p>'
            elif b.get('kind') == 'data':
                paras += '<ul>' + ''.join(f'<li>{E(x)}</li>' for x in (b.get('items' + k) or b.get('items_en') or [])) + '</ul>'
        kp = it.get('kp' + k) or it.get('kp_en') or []
        tags = ''.join(f'<span class="qtag">{E(x)}</span>' for x in kp)
        q = g('q')
        qa = f'<p class="ans"><b>{"मुख्य प्रश्न" if hi else "Mains question"} ({it.get("marks", 10)} {"अंक" if hi else "marks"}):</b> {E(q)}</p>' if q else ''
        out.append(f'<div class="card"><span class="qtag">{E(g("theme"))}</span><span class="qtag">{E(g("syllabus"))}</span><h3 style="margin:2px 0 6px">{E(g("topic"))}</h3><p><b>{E(g("intro_label"))}:</b> {E(g("intro"))}</p>{paras}<div style="margin:6px 0">{tags}</div>{qa}</div>')
    return '\n'.join(out)

files = {}
def put(path, s, keep_existing=False):
    if keep_existing and os.path.exists(f'{REPO}/{path}'): return  # never overwrite a day page someone else made
    files[path] = s

all_news = sorted(set(existing('news')) | set(NEWS)); all_q = sorted(set(existing('current-affairs')) | set(QUIZ)); all_e = sorted(set(existing('editorials')) | set(EDIT))
def prev_of(lst, d):
    i = lst.index(d); return lst[i - 1] if i > 0 else None
for hi in (False, True):
    p = 'hi/' if hi else ''
    for d, z in NEWS.items():
        also = []
        if d in all_q: also.append(('current-affairs', 'आज की समसामयिकी' if hi else 'Daily Quiz'))
        if d in all_e: also.append(('editorials', 'संपादकीय विश्लेषण' if hi else 'Editorial Analysis'))
        put(f'{p}news/{d}/index.html', page('news', d, hi, len(z['digest']), news_body(z, hi), prev_of(all_news, d), also), keep_existing=True)
    for d, z in QUIZ.items():
        also = []
        if d in all_news: also.append(('news', 'आज की ख़बरें' if hi else "Today's News"))
        if d in all_e: also.append(('editorials', 'संपादकीय विश्लेषण' if hi else 'Editorial Analysis'))
        put(f'{p}current-affairs/{d}/index.html', page('current-affairs', d, hi, len(z['questions']), quiz_body(z, hi), prev_of(all_q, d), also), keep_existing=True)
    for d, z in EDIT.items():
        put(f'{p}editorials/{d}/index.html', page('editorials', d, hi, len(z['items']), edit_body(z, hi), prev_of(all_e, d), []), keep_existing=True)

# index pages: append links for new dates
def upd_index(path, sec, dates, hi):
    s = open(f'{REPO}/{path}', encoding='utf-8').read()
    m = re.search(r'<div class="related">(.*?)</div>', s, re.S)
    have = set(re.findall(r'/' + re.escape(sec) + r'/(\d{4}-\d\d-\d\d)/', m.group(1)))
    add = ''.join(f'<a href="{url(sec, d, hi)}">{lab(d, hi)}</a>' for d in dates if d not in have)
    s = s[:m.end(1)] + add + s[m.end(1):]
    put(path, s)
for hi in (False, True):
    p = 'hi/' if hi else ''
    upd_index(f'{p}news/index.html', 'news', sorted(NEWS), hi)
    upd_index(f'{p}current-affairs/index.html', 'current-affairs', sorted(QUIZ), hi)
    upd_index(f'{p}editorials/index.html', 'editorials', sorted(EDIT), hi)

# sitemap
sm = open(f'{REPO}/sitemap.xml', encoding='utf-8').read()
have = set(re.findall(r'<loc>([^<]+)</loc>', sm)); add = ''
for sec, ds in (('news', NEWS), ('current-affairs', QUIZ), ('editorials', EDIT)):
    for d in sorted(ds):
        for hi in (False, True):
            u = url(sec, d, hi)
            if u in have: continue
            add += f'''  <url>
    <loc>{u}</loc>
    <lastmod>{d}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="en-IN" href="{url(sec, d, False)}"/>
    <xhtml:link rel="alternate" hreflang="hi-IN" href="{url(sec, d, True)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="{url(sec, d, False)}"/>
  </url>
'''
latest = max(NEWS)
sm = re.sub(r'(<loc>https://www.rrrshala.com/</loc>\s*<lastmod>)[^<]+', r"\g<1>" + latest, sm, count=1)
sm = sm.replace('</urlset>', add + '</urlset>')
put('sitemap.xml', sm)

# homepage: the live '#latest' block is refreshed in the browser by cms-loader.js, so index.html is not touched here.

for pth, c in files.items():
    fp = f'{REPO}/{pth}'; os.makedirs(os.path.dirname(fp), exist_ok=True); open(fp, 'w', encoding='utf-8').write(c)
print(len(files), 'files written; latest', latest)
