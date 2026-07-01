@echo off
REM Start House Design Studio. Open http://localhost:8000 in your browser.
setlocal enabledelayedexpansion
cd /d "%~dp0.."

REM Load KEY=VALUE lines from house_design_studio\.env, skipping blanks/comments.
if exist "house_design_studio\.env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("house_design_studio\.env") do (
    if not "%%A"=="" if not "%%B"=="" set "%%A=%%B"
  )
)

echo Starting House Design Studio at http://localhost:8000 ...
echo (Press Ctrl+C to stop.)
python -m uvicorn house_design_studio.backend.app:app --host 127.0.0.1 --port 8000
