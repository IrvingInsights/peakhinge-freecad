@echo off
REM One-click launcher for House Design Studio.
REM First run: sets up the environment and asks for your Claude API key.
REM Every run: auto-detects FreeCAD, starts the app, and opens your browser.
setlocal enabledelayedexpansion
cd /d "%~dp0.."

REM 1. Ensure the virtual environment + dependencies exist.
if not exist ".venv\Scripts\python.exe" (
  echo First-time setup needed. Running setup ...
  call "house_design_studio\setup.bat"
  if errorlevel 1 exit /b 1
)

REM 2. Ensure a .env file exists (copied from the template).
if not exist "house_design_studio\.env" (
  if exist "house_design_studio\.env.example" (
    copy "house_design_studio\.env.example" "house_design_studio\.env" >nul
  ) else (
    type nul > "house_design_studio\.env"
  )
)

REM 3. If the API key is missing, ask for it once and save it.
set "HAS_KEY="
for /f "usebackq eol=# tokens=1,* delims==" %%A in ("house_design_studio\.env") do (
  if /i "%%A"=="ANTHROPIC_API_KEY" if not "%%B"=="" set "HAS_KEY=1"
)
if not defined HAS_KEY (
  echo.
  echo Paste your Claude API key (from https://console.anthropic.com/ ).
  echo It will be saved locally in house_design_studio\.env and not shared.
  set /p "APIKEY=API key: "
  if defined APIKEY (
    >>"house_design_studio\.env" echo ANTHROPIC_API_KEY=!APIKEY!
  ) else (
    echo No key entered. You can add ANTHROPIC_API_KEY to house_design_studio\.env later.
  )
)

REM 4. Launch (auto-detects FreeCAD, opens the browser, starts the server).
echo.
echo Starting House Design Studio ... a browser window will open shortly.
echo (Keep this window open while you use the app. Press Ctrl+C to stop.)
".venv\Scripts\python.exe" -m house_design_studio.backend.launch

endlocal
