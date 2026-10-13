@echo off
rem Starts the ALVIA site on this computer and opens it in the browser.
rem Double-click this file. Keep the window open while you use the site; close it to stop.
cd /d "%~dp0"
title ALVIA shop - keep this window open
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get it from https://nodejs.org and try again.
  pause
  exit /b 1
)
rem Always port 3000 here, whatever another program has set PORT to.
set PORT=3000
rem Only this computer can open the shop: nobody else on the Wi-Fi or network reaches it.
set HOST=127.0.0.1
start "" http://localhost:3000/admin/
rem --watch: the server restarts by itself when its code changes, so the shop never runs on old code.
node --watch server\server.js
pause
