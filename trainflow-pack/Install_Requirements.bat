@echo off
setlocal
cd /d %~dp0

rem Osmium Workshop's Anima-TrainFlow: installs the exact package versions
rem Osmium's Trainflow tab is tested with (requirements-osmium.txt), into the
rem bundled portable Python. Run once; about 5 GB download.

if not exist "python_embeded\python.exe" (
    echo [ERROR] python_embeded folder not found next to this file.
    pause
    exit /b 1
)

set "PY_EXE=%~dp0python_embeded\python.exe"

echo [1/2] Installing PyTorch (CUDA 12.8) and the trainer's packages...
echo       This downloads about 5 GB and can take a while.
rem --no-cache-dir: the 5 GB isn't kept a second time in pip's cache.
"%PY_EXE%" -m pip install --no-cache-dir --no-warn-script-location -r "%~dp0requirements-osmium.txt" --extra-index-url https://download.pytorch.org/whl/cu128
if errorlevel 1 (
    echo.
    echo [ERROR] Package install failed. Check your internet connection and run this again.
    pause
    exit /b 1
)

echo [2/2] Linking sd-scripts...
"%PY_EXE%" -m pip install --no-warn-script-location --no-deps -e "%~dp0training\sd-scripts"
if errorlevel 1 (
    echo.
    echo [ERROR] Could not link sd-scripts.
    pause
    exit /b 1
)

echo.
echo Done. In Osmium Workshop, open the Trainflow tab and choose this folder:
echo   %~dp0
pause
