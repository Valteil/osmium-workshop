@echo off
REM Double-click to open the Red Team harness: attacks each Osmium app's own
REM defences against a throwaway instance in a temp folder, and shows the
REM result per attack vector. Loopback only. Your running app and real data
REM are never touched. Close this window to stop it.
REM Needs Node.js (already required for building the app).
title Osmium Workshop - Red Team
cd /d "%~dp0"
where node >nul 2>nul || (
  echo Node.js isn't installed or isn't on PATH.
  pause
  exit /b 1
)
node tools\redteam\server.js
if errorlevel 1 pause
