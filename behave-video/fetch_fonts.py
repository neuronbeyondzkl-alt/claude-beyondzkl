"""下载渲染所需字体到 fonts/。

中文字体用 Google Fonts 的 text= 子集接口，只取片中真正出现的字；
英文用 Cormorant Garamond（与封面同为 Garamond 系衬线）。字体均为 SIL OFL。
"""
import os
import re
import sys
import urllib.parse
import urllib.request

from timeline import all_text

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "fonts")

FONTS = [
    # 文件名, family, 轴参数, 是否按片中文字取子集
    ("NotoSerifSC-Black.ttf", "Noto Serif SC", "wght@900", True),
    ("NotoSerifSC-Bold.ttf", "Noto Serif SC", "wght@700", True),
    ("NotoSansSC-Regular.ttf", "Noto Sans SC", "wght@400", True),
    ("CormorantGaramond-SemiBold.ttf", "Cormorant Garamond", "wght@600", False),
    ("CormorantGaramond-MediumItalic.ttf", "Cormorant Garamond", "ital,wght@1,500", False),
]


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main():
    os.makedirs(OUT, exist_ok=True)
    text = all_text()
    for name, family, axis, subset in FONTS:
        path = os.path.join(OUT, name)
        if os.path.exists(path) and "--force" not in sys.argv:
            continue
        q = {"family": f"{family}:{axis}"}
        if subset:
            q["text"] = text
        css = fetch("https://fonts.googleapis.com/css2?" + urllib.parse.urlencode(q)).decode()
        url = re.search(r"url\((https://[^)]+)\)", css).group(1)
        data = fetch(url)
        with open(path, "wb") as f:
            f.write(data)
        print(f"{name}: {len(data) // 1024} KB")


if __name__ == "__main__":
    main()
