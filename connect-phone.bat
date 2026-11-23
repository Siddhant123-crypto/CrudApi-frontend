@echo off
setlocal EnableDelayedExpansion

title Farm2Home - Android Wireless ADB Connector

echo ============================================================
echo   Farm2Home - Android Wireless ADB Connection Helper
echo ============================================================
echo.

:: ------------------------------------------------------------
:: 1. Locate ADB executable (no hardcoded outdated paths)
:: ------------------------------------------------------------
set "ADB_EXE="
for /f "delims=" %%A in ('where adb 2^>nul') do (
    if not defined ADB_EXE set "ADB_EXE=%%A"
)
if not defined ADB_EXE (
    if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
        set "ADB_EXE=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
    )
)
if not defined ADB_EXE (
    echo [ERROR] adb.exe not found in PATH or %%LOCALAPPDATA%%\Android\Sdk\platform-tools.
    echo         Please install Android SDK Platform-Tools and add it to PATH.
    pause
    exit /b 1
)

echo [INFO] Using ADB: "%ADB_EXE%"
for /f "usebackq delims=" %%V in (`call "%ADB_EXE%" version ^| findstr /C:"Version"`) do (
    echo [INFO] %%V
)
echo.

:: Ensure ADB server is running
"%ADB_EXE%" start-server >nul 2>&1

:: ------------------------------------------------------------
:: 2. Check if a device is already connected
:: ------------------------------------------------------------
set "CONNECTED_DEV="
for /f "usebackq skip=1 tokens=1,2" %%D in (`"%ADB_EXE%" devices`) do (
    if "%%E"=="device" (
        if not defined CONNECTED_DEV set "CONNECTED_DEV=%%D"
    )
)

if defined CONNECTED_DEV (
    echo [OK] Device already connected: %CONNECTED_DEV%
    goto :VERIFY_SUCCESS
)

:: ------------------------------------------------------------
:: 3. Try automatic mDNS discovery (_adb-tls-connect._tcp)
:: ------------------------------------------------------------
echo [INFO] Scanning local network via ADB mDNS for Wireless Debugging...
set "DISCOVERED_ADDR="
for /f "usebackq tokens=1,2,3" %%A in (`call "%ADB_EXE%" mdns services 2^>nul ^| findstr /C:"_adb-tls-connect._tcp"`) do (
    if not defined DISCOVERED_ADDR set "DISCOVERED_ADDR=%%C"
)

if defined DISCOVERED_ADDR (
    echo [OK] Found phone via mDNS: !DISCOVERED_ADDR!
    echo [INFO] Connecting to !DISCOVERED_ADDR!...
    "%ADB_EXE%" connect !DISCOVERED_ADDR!
    timeout /t 2 /nobreak >nul

    set "CONNECTED_DEV="
    for /f "skip=1 tokens=1,2" %%D in ('"%ADB_EXE%" devices') do (
        if "%%E"=="device" (
            if not defined CONNECTED_DEV set "CONNECTED_DEV=%%D"
        )
    )
    if defined CONNECTED_DEV goto :VERIFY_SUCCESS

    echo.
    echo [WARN] Auto-connect to !DISCOVERED_ADDR! did not authorize.
    echo        This usually means one-time pairing is required on this network.
    goto :PROMPT_PAIR_OR_MANUAL
)

echo [WARN] No wireless ADB devices discovered via mDNS.
echo.
echo   Possible reasons:
echo   1. Phone "Wireless debugging" is turned OFF.
echo   2. Current Wi-Fi (e.g. FUTURE / campus / office Wi-Fi) has AP Client Isolation
echo      blocking device-to-device traffic.
echo      -^> Recommended: Connect laptop to your phone's Personal Hotspot (or home Wi-Fi).
echo.

:PROMPT_PAIR_OR_MANUAL
set /p "NEED_PAIR=Do you need to pair this phone first? (Y/N) [N]: "
if /i "%NEED_PAIR%"=="Y" (
    echo.
    echo On your phone: Settings -^> Developer Options -^> Wireless debugging -^> Pair device with pairing code
    set /p "PAIR_ADDR=Enter Pairing IP:PORT (example 192.168.x.x:37123): "
    set /p "PAIR_CODE=Enter 6-digit Pairing Code: "
    if not "!PAIR_ADDR!"=="" if not "!PAIR_CODE!"=="" (
        echo [INFO] Pairing with !PAIR_ADDR!...
        "%ADB_EXE%" pair !PAIR_ADDR! !PAIR_CODE!
        echo.
    )
)

echo On your phone: Settings -^> Developer Options -^> Wireless debugging
echo Check the "IP address & Port" shown on the main Wireless debugging screen.
set /p "CONN_ADDR=Enter Debugging IP:PORT (or press Enter to exit): "
if "%CONN_ADDR%"=="" (
    echo [INFO] Cancelled by user.
    exit /b 1
)

:: Extract IP (before colon) for quick reachability check
for /f "tokens=1 delims=:" %%I in ("%CONN_ADDR%") do set "TARGET_IP=%%I"

echo.
echo [INFO] Testing network reachability to %TARGET_IP%...
ping -n 1 -w 1500 %TARGET_IP% >nul 2>&1
if errorlevel 1 (
    echo [WARN] Ping to %TARGET_IP% timed out!
    echo        If you are on a public/campus Wi-Fi like FUTURE, AP Client Isolation is likely blocking peer connections.
    echo        Still attempting ADB connect in case ICMP is blocked...
)

echo [INFO] Connecting to %CONN_ADDR%...
"%ADB_EXE%" connect %CONN_ADDR%
timeout /t 2 /nobreak >nul

set "CONNECTED_DEV="
for /f "skip=1 tokens=1,2" %%D in ('"%ADB_EXE%" devices') do (
    if "%%E"=="device" (
        if not defined CONNECTED_DEV set "CONNECTED_DEV=%%D"
    )
)

if not defined CONNECTED_DEV (
    echo.
    echo ============================================================
    echo [FAILED] Could not connect to %CONN_ADDR%.
    echo ============================================================
    echo Troubleshooting:
    echo  1. If you see "10060" or timeout, your Wi-Fi network has AP Client Isolation.
    echo     Fix: Turn on your phone's Personal Hotspot, connect your Windows laptop to it,
    echo          and run connect-phone.bat again.
    echo  2. Make sure "Wireless debugging" is ON and you used the latest Port shown on screen.
    echo  3. On Vivo (Funtouch OS), keep the Wireless debugging screen open while pairing.
    echo.
    pause
    exit /b 1
)

:VERIFY_SUCCESS
echo.
echo ============================================================
echo [SUCCESS] Android Device Connected!
echo ============================================================
"%ADB_EXE%" devices -l
echo.
for /f "delims=" %%M in ('"%ADB_EXE%" -s %CONNECTED_DEV% shell getprop ro.product.model 2^>nul') do (
    echo [DEVICE MODEL] %%M
)
for /f "delims=" %%A in ('"%ADB_EXE%" -s %CONNECTED_DEV% shell getprop ro.build.version.release 2^>nul') do (
    echo [ANDROID VER ] Android %%A
)
echo.
echo You can now run:  npx expo start --dev-client
echo ============================================================
echo.
exit /b 0
