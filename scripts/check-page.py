#!/usr/bin/env python3
"""Validation rapide d'une page HTML Aircraft2Sell :
- syntaxe JS des blocs <script> inline (node --check)
- équilibre des balises principales
- présence d'emoji (interdits par le design system)
- marqueur *** (corruption de redaction)
Usage : python3 scripts/check-page.py fichier.html [...]
"""
import re, subprocess, sys, tempfile, os

EMOJI = re.compile('[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B50\u2B06\u2194-\u21AA\u2934\u2935\u3030\u303D\u3297\u3299\U0001F000-\U0001F2FF]')
TAGS = ['div','section','a','button','ul','li','span','form','select','table','header','footer','main','nav','label','p','h1','h2','h3']

def check(path):
    ok = True
    s = open(path, encoding='utf-8').read()
    # JS
    for i, m in enumerate(re.finditer(r'<script(?P<attrs>[^>]*)>(?P<body>.*?)</script>', s, re.S)):
        attrs, body = m.group('attrs'), m.group('body')
        if 'src=' in attrs or 'ld+json' in attrs or not body.strip():
            continue
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
            f.write(body); tmp = f.name
        r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
        os.unlink(tmp)
        if r.returncode != 0:
            ok = False
            print(f"  JS ERROR script#{i}: {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else r.stderr}")
    # tags
    body = re.sub(r'<script.*?</script>', '', s, flags=re.S)
    body = re.sub(r'<!--.*?-->', '', body, flags=re.S)
    for t in TAGS:
        o = len(re.findall(rf'<{t}(\s|>)', body)); c = len(re.findall(rf'</{t}\s*>', body))
        if o != c:
            ok = False; print(f"  TAG <{t}> open={o} close={c}")
    # emoji
    em = EMOJI.findall(s)
    if em:
        ok = False; print(f"  EMOJI x{len(em)}: {''.join(sorted(set(em)))[:40]}")
    if '***' in s:
        ok = False; print("  '***' présent (corruption)")
    if 'Bebas' in s or 'DM+Sans' in s or '#05080f' in s.lower() or '#e8a020' in s.lower():
        ok = False; print("  thème legacy sombre détecté (Bebas/DM Sans/#05080f/#e8a020)")
    print(('OK   ' if ok else 'FAIL ') + path)
    return ok

if __name__ == '__main__':
    res = [check(p) for p in sys.argv[1:]]
    sys.exit(0 if all(res) else 1)
