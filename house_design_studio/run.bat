@echo off
REM Start House Design Studio. Open http://localhost:8000 in your browser.
cd /d "%~dp0.."

if exist "house_design_studio\.env" (
  for /f "usebackq tokens=1,* delims==" %%A in ("house_design_studio\.env") do (
    if not "%%A"=="" if not "%%A:~0,1"=="#" set "%%A=%%B"
  )
)

echo Starting House Design Studio at http://localhost:8000 ...
python -m uvicorn house_design_studio.backend.app:app --host 0.0.0.0 --port 8000
