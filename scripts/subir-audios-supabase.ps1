# ==================================================================
# PROTOCOLO DE ASSIS — envia os áudios da pasta audio/ para o Supabase Storage
# ------------------------------------------------------------------
# Pré-requisitos (ver PROTEGER-AUDIOS.md):
#   1. Ter criado o bucket PRIVADO "audios" no Supabase.
#   2. Ter a "service_role key" em mãos (Supabase → Settings → API).
#
# Como rodar: clique com o direito neste arquivo > "Executar com o PowerShell"
#   (ou:  powershell -ExecutionPolicy Bypass -File scripts\subir-audios-supabase.ps1 )
# A chave é pedida na hora e NÃO fica salva em lugar nenhum.
# ==================================================================
$ErrorActionPreference = 'Stop'

# Mantém a janela aberta e mostra o erro se algo der problema (não fecha sozinho).
trap {
  Write-Host ""
  Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
  Read-Host "Pressione Enter para fechar"
  exit 1
}

# --- Configurações (o URL é público; o bucket idem) ---
$SUPABASE_URL = "https://ihdccpxqjjysjsxkdrlm.supabase.co"
$BUCKET       = "audios"

$root  = Split-Path -Parent $PSScriptRoot
$audio = Join-Path $root 'audio'

if (-not (Test-Path $audio)) { Write-Host "Pasta audio/ nao encontrada em $audio"; exit 1 }
$files = Get-ChildItem $audio -Filter *.mp3 | Sort-Object Name
if ($files.Count -eq 0) { Write-Host "Nenhum .mp3 na pasta audio/."; exit 1 }

Write-Host "Projeto: $SUPABASE_URL"
Write-Host "Bucket:  $BUCKET"
Write-Host "Arquivos a enviar: $($files.Count)"
Write-Host ""
$secure = Read-Host "Cole a SERVICE_ROLE key e tecle Enter" -AsSecureString
$key = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
if ([string]::IsNullOrWhiteSpace($key)) { Write-Host "Chave vazia. Abortado."; exit 1 }

$headers = @{
  "Authorization" = "Bearer $key"
  "apikey"        = $key
  "x-upsert"      = "true"   # sobrescreve se já existir
}

$ok = 0; $fail = 0
foreach ($f in $files) {
  $url = "$SUPABASE_URL/storage/v1/object/$BUCKET/$($f.Name)"
  try {
    Invoke-WebRequest -Uri $url -Method Post -Headers $headers `
      -ContentType "audio/mpeg" -InFile $f.FullName -UseBasicParsing -TimeoutSec 180 | Out-Null
    Write-Host ("OK   {0}" -f $f.Name); $ok++
  } catch {
    Write-Host ("FALHOU {0}: {1}" -f $f.Name, $_.Exception.Message); $fail++
  }
}
Write-Host ""
Write-Host "Enviados: $ok | Falhas: $fail"
if ($fail -eq 0) { Write-Host "Tudo certo! Os audios estao protegidos no bucket privado." -ForegroundColor Green }
Write-Host ""
Read-Host "Pressione Enter para fechar"
