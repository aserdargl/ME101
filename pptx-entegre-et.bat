@echo off
chcp 65001 >nul
powershell -ExecutionPolicy Bypass -File "%~dp0pptx-entegre-et.ps1"
pause
