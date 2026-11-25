#!/bin/sh
cd "$(dirname "$0")"

wait_enter() {
  printf "按回车关闭… / Press Enter to close..."
  read -r _ < /dev/tty 2>/dev/null || read -r _
}

if [ ! -f server.py ]; then
  echo "[ERROR] server.py not found. Please extract ALL files from the zip first, then run again."
  wait_enter
  exit 1
fi

if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  echo "[ERROR] Python 3 not found. Install Python 3 (https://www.python.org) and run again."
  echo "未找到 Python 3。请先安装 Python 3（https://www.python.org），再运行本脚本。"
  wait_enter
  exit 1
fi

echo "Starting AI Resource Console with $PY ... Keep this window open."
echo "启动中，浏览器会自动打开；保持本窗口开着。日志写入 server-log.txt。"
$PY server.py 2>&1 | tee server-log.txt
echo "The server has stopped. See server-log.txt in this folder."
wait_enter
