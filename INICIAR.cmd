@echo off
cd /d "%~dp0"
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing http://localhost:5173 -TimeoutSec 2; if ($response.Content.Contains('Cine')) { exit 0 }; exit 1 } catch { exit 1 }"
if not errorlevel 1 (
  start "" "http://localhost:5173"
  exit /b
)
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js 22.12 ou superior para abrir o Cine.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm.cmd install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
start "" "http://localhost:5173"
call npm.cmd run dev
pause
