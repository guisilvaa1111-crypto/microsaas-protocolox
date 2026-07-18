# ==================================================================
# PROTOCOLO DE ASSIS — envia os BÔNUS (pasta bonus/) para o Supabase Storage
# ------------------------------------------------------------------
# Pré-requisitos:
#   1. Ter criado o bucket PRIVADO "bonus" no Supabase.
#   2. Ter a "service_role key" em mãos (Supabase -> Settings -> API).
# A chave é pedida na hora e NAO fica salva.
# ==================================================================
$ErrorActionPreference = 'Stop'
trap { Write-Host ""; Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red; Read-Host "Pressione Enter para fechar"; exit 1 }

$SUPABASE_URL = "https://ihdccpxqjjysjsxkdrlm.supabase.co"
$BUCKET       = "bonus"

$root  = Split-Path -Parent $PSScriptRoot
$dir   = Join-Path $root 'bonus'
if (-not (Test-Path $dir)) { Write-Host "Pasta bonus/ nao encontrada em $dir"; Read-Host "Enter para fechar"; exit 1 }
$files = Get-ChildItem $dir -File | Where-Object { $_.Extension -in '.pdf','.png','.jpg','.jpeg' }
if ($files.Count -eq 0) { Write-Host "Nenhum arquivo em bonus/."; Read-Host "Enter para fechar"; exit 1 }

# Tipos de conteudo por extensao
$mime = @{ '.pdf'='application/pdf'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg' }

Write-Host "Projeto: $SUPABASE_URL"
Write-Host "Bucket:  $BUCKET"
Write-Host "Arquivos a enviar: $($files.Count)"
Write-Host ""
$secure = Read-Host "Cole a SERVICE_ROLE key e tecle Enter" -AsSecureString
$key = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
if ([string]::IsNullOrWhiteSpace($key)) { Write-Host "Chave vazia. Abortado."; Read-Host "Enter para fechar"; exit 1 }

$headers = @{ "Authorization"="Bearer $key"; "apikey"=$key; "x-upsert"="true" }

$ok = 0; $fail = 0
foreach ($f in $files) {
  $ct = $mime[$f.Extension.ToLower()]; if (-not $ct) { $ct = 'application/octet-stream' }
  $url = "$SUPABASE_URL/storage/v1/object/$BUCKET/$($f.Name)"
  try {
    Invoke-WebRequest -Uri $url -Method Post -Headers $headers -ContentType $ct -InFile $f.FullName -UseBasicParsing -TimeoutSec 300 | Out-Null
    Write-Host ("OK   {0}  ({1:N1} MB)" -f $f.Name, ($f.Length/1MB)); $ok++
  } catch {
    Write-Host ("FALHOU {0}: {1}" -f $f.Name, $_.Exception.Message); $fail++
  }
}
Write-Host ""
Write-Host "Enviados: $ok | Falhas: $fail"
if ($fail -eq 0) { Write-Host "Tudo certo! Os bonus estao protegidos no bucket privado." -ForegroundColor Green }
Write-Host ""
Read-Host "Pressione Enter para fechar"
