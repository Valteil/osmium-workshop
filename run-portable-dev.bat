@echo off
REM Fast launcher for our persistent dev instance - just runs the exe
REM already sitting right here in the project root, no build step. This is
REM what you use day to day.
REM
REM First-time setup (or after a main.js/preload.js change): run
REM "npm run refresh-app" first to (re)build it.
REM For renderer-only changes: run "npm run push-update" instead, then use
REM Apply update bundle inside the running app - no rebuild needed at all.
cd /d "%~dp0"
if not exist "Osmium Workshop.exe" (
  echo The root build doesn't exist yet. Run: npm run refresh-app
  pause
  exit /b 1
)
start "" "Osmium Workshop.exe"
