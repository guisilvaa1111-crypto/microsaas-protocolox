@echo off
chcp 65001 >nul
title Protocolo X - Subir bonus para o Supabase
echo ============================================
echo   PROTOCOLO X - Enviar bonus ao Supabase
echo ============================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0subir-bonus-supabase.ps1"
echo.
pause
