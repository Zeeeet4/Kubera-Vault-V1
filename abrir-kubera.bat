@echo off
setlocal EnableDelayedExpansion

set "PORT=8888"

cd /d "%~dp0"

if /I "%~1"=="stop" goto :detener

echo ========================================
echo  Kubera Vault - Inicio
echo ========================================

if not exist "package.json" (
    echo [!] No se encontro package.json
    pause
    goto :fin
)

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:%PORT%' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo [AVISO] Ya hay un servicio en http://localhost:%PORT%
    start "" "C:\Program Files\LibreWolf\librewolf.exe" http://localhost:%PORT%
    goto :fin
)

echo [1/2] Iniciando Kubera Vault en puerto %PORT%...
start "Kubera-Vite" cmd /c "npm run dev -- --port %PORT%"

echo [2/2] Esperando a que arranque...
set /a intentos=0
:esperar
timeout /t 1 /nobreak >nul
set /a intentos+=1
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:%PORT%' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    if !intentos! lss 15 goto :esperar
    echo [!] Kubera no pudo arrancar en 15 segundos.
    echo     Revisa los errores en la ventana "Kubera-Vite".
    pause
    goto :fin
)

echo [OK] Kubera Vault corriendo en http://localhost:%PORT%
start "" "C:\Program Files\LibreWolf\librewolf.exe" http://localhost:%PORT%
goto :fin

:detener
echo Deteniendo Kubera Vault...
taskkill /FI "WINDOWTITLE eq Kubera-Vite" /T /F >nul 2>&1
echo [OK] Servidor detenido.
goto :fin

:fin
echo ========================================
echo  Cierra la ventana "Kubera-Vite" para detener
echo ========================================
