@echo off
REM Double-click to preview the GitHub Pages site offline, exactly as it's
REM served online (docs\ at http://localhost:8760/osmium-workshop/).
REM Opens your default browser; close this window to stop the preview.
REM Needs Node.js (already required for building the app).
title Osmium Workshop - site preview
cd /d "%~dp0"
where node >nul 2>nul || (
  echo Node.js isn't installed or isn't on PATH.
  pause
  exit /b 1
)
node scripts\preview-site.js
if errorlevel 1 pause
