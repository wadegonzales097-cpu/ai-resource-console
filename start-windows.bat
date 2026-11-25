@echo off
setlocal
cd /d "%~dp0"
title AI Resource Console

if not exist "server.py" (
  echo [ERROR] server.py not found in this folder.
  echo Please extract ALL files from the zip first,
  echo then double-click this file again.
  echo Do NOT run it from inside the zip preview window.
  echo.
  pause
  exit /b 1
)

set "PY="
where py >nul 2>nul && py -3 -c "import sys" >nul 2>nul && set "PY=py -3"
if not defined PY where python >nul 2>nul && python -c "import sys" >nul 2>nul && set "PY=python"
if not defined PY where python3 >nul 2>nul && python3 -c "import sys" >nul 2>nul && set "PY=python3"

if not defined PY (
  echo [ERROR] Python 3 was not found on this computer.
  echo.
  echo Please install Python 3 first:
  echo   1. Open https://www.python.org/downloads/
  echo   2. Download and install Python 3.
  echo   3. IMPORTANT: tick "Add python.exe to PATH" during install.
  echo   4. Then double-click this file again.
  echo.
  echo Note: a "python" entry from Microsoft Store does NOT count;
  echo it is only a stub and cannot run this program.
  echo.
  pause
  exit /b 1
)

set PYTHONUTF8=1
echo Starting AI Resource Console with %PY% ...
echo Your browser will open automatically in a few seconds.
echo Keep this window open while using the program.
echo The exact address is written in server-log.txt in this folder.
echo.
%PY% server.py > server-log.txt 2>&1
echo.
echo The server has stopped. Log content:
echo ----------------------------------------
chcp 65001 >nul
type server-log.txt
echo ----------------------------------------
echo If something went wrong, send server-log.txt back for help.
pause
