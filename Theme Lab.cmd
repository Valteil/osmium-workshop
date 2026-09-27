@echo off
REM Double-click to open the Theme Lab: every theme against the app's real
REM components, plus the opening flourish with slow motion.
REM Opens your default browser at http://localhost:8761/ ; close this window
REM to stop it. Needs Node.js (already required for building the app).
title Osmium Workshop - Theme Lab
cd /d "%~dp0"
where node >nul 2>nul || (
  echo Node.js isn't installed or isn't on PATH.
  pause
  exit /b 1
)
node scripts\theme-lab.js
if errorlevel 1 pause
