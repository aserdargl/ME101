@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sync-weeks.ps1" %*
set "SYNC_EXIT=%ERRORLEVEL%"
echo.
pause
exit /b %SYNC_EXIT%
