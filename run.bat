@echo off
setlocal
title Uni Downloader
cd /d "%~dp0"

:: 1. Check if setup was executed
if not exist "node_modules\react" (
    echo [ERROR] Dependencies not found!
    echo Please run setup.bat first to initialize Uni Downloader.
    echo.
    pause
    exit /b 1
)

:: 2. Check if build exists
if not exist "dist\index.html" (
    echo [*] Frontend build not found. Building UI now...
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Build failed.
        pause
        exit /b 1
    )
)

:: 3. Launch App
if "%~1"=="--dev" goto :dev_mode
if "%~1"=="dev" goto :dev_mode

if exist "node_modules\electron\dist\electron.exe" (
    start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
    exit /b 0
) else (
    call npm start
    if errorlevel 1 (
        pause
        exit /b 1
    )
    exit /b 0
)

:dev_mode
echo Starting Uni Downloader in Developer Mode (Vite Dev Server + Hot Reload)...
call npm run electron:dev
if errorlevel 1 (
    pause
    exit /b 1
)
exit /b 0
