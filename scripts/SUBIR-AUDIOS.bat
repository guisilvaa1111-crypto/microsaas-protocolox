@echo off
chcp 65001 >nul
title Protocolo de Assis - Subir audios para o Supabase
echo ============================================
echo   PROTOCOLO DE ASSIS - Enviar audios ao Supabase
echo ============================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0subir-audios-supabase.ps1"
echo.
pause
