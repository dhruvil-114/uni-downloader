@echo off
title Uni Downloader - Setup
cd /d "%~dp0"

echo =======================================================
echo              Uni Downloader - Setup        
echo =======================================================
echo.

:: 1. Check Node.js
echo [1/5] Checking Node.js runtime...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo After installing, restart this setup.
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo [OK] Node.js version: %%v

:: 2. Check Python / yt-dlp
echo.
echo [2/5] Checking yt-dlp engine...
if not exist "bin" mkdir "bin"

if exist "bin\yt-dlp.exe" goto :ytdlp_ready
echo [*] Setting up yt-dlp...
python -V >nul 2>&1
if not errorlevel 1 (
    python -m pip install yt-dlp --quiet
    for /f "delims=" %%p in ('where yt-dlp 2^>nul') do (
        if exist "%%p" copy /y "%%p" "bin\yt-dlp.exe" >nul
    )
    if exist "%APPDATA%\Python\Python315\Scripts\yt-dlp.exe" (
        copy /y "%APPDATA%\Python\Python315\Scripts\yt-dlp.exe" "bin\yt-dlp.exe" >nul
    )
)
if not exist "bin\yt-dlp.exe" (
    echo [*] Downloading yt-dlp standalone binary...
    curl -L -o "bin\yt-dlp.exe" "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
)

:ytdlp_ready
echo [OK] yt-dlp binary is present in bin\

:: 3. Check FFmpeg
echo.
echo [3/5] Checking FFmpeg multimedia engine...
if exist "bin\ffmpeg.exe" goto :ffmpeg_ready

ffmpeg -version >nul 2>&1
if not errorlevel 1 (
    for /f "delims=" %%f in ('where ffmpeg 2^>nul') do copy /y "%%f" "bin\ffmpeg.exe" >nul
    for /f "delims=" %%f in ('where ffprobe 2^>nul') do copy /y "%%f" "bin\ffprobe.exe" >nul
    echo [OK] Copied FFmpeg from system PATH.
    goto :ffmpeg_ready
)

echo [*] Fetching FFmpeg...
for /d %%p in ("%LOCALAPPDATA%\Microsoft\WinGet\Packages\*FFmpeg*") do (
    if exist "%%p\ffmpeg-*\bin\ffmpeg.exe" (
        copy /y "%%p\ffmpeg-*\bin\ffmpeg.exe" "bin\ffmpeg.exe" >nul
        copy /y "%%p\ffmpeg-*\bin\ffprobe.exe" "bin\ffprobe.exe" >nul
    )
)

if not exist "bin\ffmpeg.exe" (
    winget install --id Gyan.FFmpeg.Essentials --exact --silent --accept-package-agreements --accept-source-agreements >nul 2>&1
    for /d %%p in ("%LOCALAPPDATA%\Microsoft\WinGet\Packages\*FFmpeg*") do (
        if exist "%%p\ffmpeg-*\bin\ffmpeg.exe" (
            copy /y "%%p\ffmpeg-*\bin\ffmpeg.exe" "bin\ffmpeg.exe" >nul
            copy /y "%%p\ffmpeg-*\bin\ffprobe.exe" "bin\ffprobe.exe" >nul
        )
    )
)

:ffmpeg_ready
echo [OK] FFmpeg binary is present in bin\

:: 3b. Check aria2c (16x Turbo & Torrent Engine)
echo.
echo [*] Checking aria2c Turbo / Torrent engine...
if exist "bin\aria2c.exe" goto :aria2_ready
where aria2c >nul 2>&1
if not errorlevel 1 (
    for /f "delims=" %%a in ('where aria2c 2^>nul') do copy /y "%%a" "bin\aria2c.exe" >nul
    goto :aria2_ready
)
echo [*] Downloading aria2c (16x multi-connection & torrent engine)...
curl -L -o "bin\aria2.zip" "https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip" >nul 2>&1
if exist "bin\aria2.zip" (
    powershell -NoProfile -Command "Expand-Archive -LiteralPath 'bin\aria2.zip' -DestinationPath 'bin\aria2-temp' -Force; $exe = Get-ChildItem -Path 'bin\aria2-temp' -Filter 'aria2c.exe' -Recurse | Select-Object -First 1; if ($exe) { Copy-Item $exe.FullName 'bin\aria2c.exe' -Force }; Remove-Item 'bin\aria2.zip' -Force; Remove-Item 'bin\aria2-temp' -Recurse -Force" >nul 2>&1
)

:aria2_ready
if exist "bin\aria2c.exe" (
    echo [OK] aria2c 16x Turbo & Torrent engine is ready in bin\
) else (
    echo [WARN] aria2c not found yet; app can auto-download it from Settings.
)

:: 4. Install NPM Dependencies
echo.
echo [4/5] Checking application dependencies (NPM)...
if exist "node_modules\react" goto :npm_installed
echo [*] Running npm install...
call npm install
if errorlevel 1 (
    echo [ERROR] npm install encountered an error.
    pause
    exit /b 1
)

:npm_installed
echo [OK] Node modules already installed.

:: Ensure electron binary is properly extracted
if exist "node_modules\electron\dist\electron.exe" goto :electron_ready
echo [*] Finalizing Electron installation...
node node_modules\electron\install.js >nul 2>&1
if exist "node_modules\electron\dist\electron.exe" goto :electron_ready

powershell -NoProfile -Command "$c = (Get-ChildItem -Path $env:LOCALAPPDATA\electron\Cache -Filter *.zip -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1); if ($c) { Expand-Archive -Path $c.FullName -DestinationPath node_modules\electron\dist -Force; Set-Content -Path node_modules\electron\path.txt -Value electron.exe }" >nul 2>&1

:electron_ready
echo [OK] Electron engine verified.

:: 5. Build Frontend
echo.
echo [5/5] Building modern desktop user interface...
call npm run build
if errorlevel 1 (
    echo [ERROR] Vite build failed!
    pause
    exit /b 1
)

echo.
echo =======================================================
echo          [SUCCESS] Setup Completed Successfully!       
echo =======================================================
echo.
echo Uni Downloader is ready to use!
echo You can now start the app anytime by double-clicking:
echo.
echo     run.bat
echo.
exit /b 0
