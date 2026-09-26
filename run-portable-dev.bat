@echo off
REM Fast launcher for our persistent dev instance - just runs the exe
REM already sitting right here in the project root, no build step. This is
REM what you use day to day.
REM
REM First-time setup, or after any code change: run "npm run refresh-app"
REM first to (re)build it, then fully quit and relaunch.
cd /d "%~dp0"
if not exist "Osmium Workshop.exe" (
  echo The root build doesn't exist yet. Run: npm run refresh-app
  pause
  exit /b 1
)
start "" "Osmium Workshop.exe"
