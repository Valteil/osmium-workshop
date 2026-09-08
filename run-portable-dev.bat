@echo off
REM Fast launcher for our persistent dev instance - just runs the exe
REM already sitting in portable-dev\, no build step. This is what you use
REM day to day.
REM
REM First-time setup (or after a main.js/preload.js change): run
REM "npm run refresh-app" first to (re)build portable-dev\.
REM For renderer-only changes: run "npm run push-update" instead, then use
REM Apply update bundle inside the running app - no rebuild needed at all.
cd /d "%~dp0"
if not exist "portable-dev\Dataset Tag Studio.exe" (
  echo portable-dev\ doesn't exist yet. Run: npm run refresh-app
  pause
  exit /b 1
)
start "" "portable-dev\Dataset Tag Studio.exe"
