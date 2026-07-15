@echo off
chcp 65001 >nul
title Protocolo X - Subir audios para o Supabase
echo ============================================
echo   PROTOCOLO X - Enviar audios ao Supabase
echo ============================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0subir-audios-supabase.ps1"
echo.
pause
