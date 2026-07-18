@echo off
chcp 65001 >nul
title Protocolo de Assis - Subir bonus para o Supabase
echo ============================================
echo   PROTOCOLO DE ASSIS - Enviar bonus ao Supabase
echo ============================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0subir-bonus-supabase.ps1"
echo.
pause
