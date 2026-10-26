#!/usr/bin/env bash
# 下载渲染所需字体（SIL OFL 授权，来自 Google Fonts），体积较大，不纳入版本库。
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p fonts
get() { [ -s "fonts/$1" ] || curl -sSL -o "fonts/$1" "$2"; }
get Cinzel-Bold.ttf        https://fonts.gstatic.com/s/cinzel/v26/8vIU7ww63mVu7gtR-kwKxNvkNOjw-jHgTYo.ttf
get NotoSansSC-Light.ttf   https://fonts.gstatic.com/s/notosanssc/v41/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG4HFnYw.ttf
get NotoSansSC-Medium.ttf  https://fonts.gstatic.com/s/notosanssc/v41/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG-3FnYw.ttf
get NotoSansSC-Bold.ttf    https://fonts.gstatic.com/s/notosanssc/v41/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaGzjCnYw.ttf
get NotoSerifSC-Black.ttf  https://fonts.gstatic.com/s/notoserifsc/v36/H4cyBXePl9DZ0Xe7gG9cyOj7uK2-n-D2rd4FY7QrrCWv.ttf
get Oswald-Light.ttf       https://fonts.gstatic.com/s/oswald/v57/TK3_WkUHHAIjg75cFRf3bXL8LICs169vgUE.ttf
get Oswald-Medium.ttf      https://fonts.gstatic.com/s/oswald/v57/TK3_WkUHHAIjg75cFRf3bXL8LICs18NvgUE.ttf
ls -la fonts
