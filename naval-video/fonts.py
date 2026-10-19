"""Download Noto Serif SC / Noto Sans SC from Google Fonts, subset to exactly
the characters the video uses, into build/fonts/ with a fonts.css."""
import json
import os
import re
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "build", "fonts")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
FACES = [("Noto Serif SC", w) for w in (500, 600, 700)] + [("Noto Sans SC", w) for w in (400, 500, 700)]


def charset():
    html = open(os.path.join(HERE, "index.html"), encoding="utf-8").read()
    spec = json.load(open(os.path.join(HERE, "script.json"), encoding="utf-8"))
    text = html + "".join("".join(s["chunks"]) for s in spec["scenes"])
    chars = {c for c in text if ord(c) > 0x7F}
    chars |= {chr(i) for i in range(0x20, 0x7F)}
    return "".join(sorted(chars))


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main():
    os.makedirs(OUT, exist_ok=True)
    chars = charset()
    print(f"[fonts] {len(chars)} unique characters")
    css = []
    for fam, w in FACES:
        q = urllib.parse.urlencode({"family": f"{fam}:wght@{w}", "text": chars, "display": "block"})
        sheet = get("https://fonts.googleapis.com/css2?" + q).decode()
        src = re.search(r"url\((https://[^)]+)\)", sheet).group(1)
        name = f"{fam.replace(' ', '')}-{w}.woff2"
        data = get(src)
        open(os.path.join(OUT, name), "wb").write(data)
        css.append(f'@font-face{{font-family:"{fam}";font-weight:{w};font-style:normal;src:url({name}) format("woff2")}}')
        print(f"[fonts] {name}: {len(data) // 1024} KB")
    open(os.path.join(OUT, "fonts.css"), "w").write("\n".join(css) + "\n")


if __name__ == "__main__":
    main()
