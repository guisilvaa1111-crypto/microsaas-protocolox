# ==================================================================
# PROTOCOLO X — baixa as músicas do Google Drive para a pasta audio/
# Uso: clique com o botão direito > "Executar com o PowerShell"
#      (ou no terminal:  powershell -ExecutionPolicy Bypass -File scripts\baixar-audios.ps1)
# Só baixa o que ainda não existe, então pode rodar quantas vezes quiser.
# ==================================================================
$ErrorActionPreference = 'Stop'
$root  = Split-Path -Parent $PSScriptRoot
$audio = Join-Path $root 'audio'
New-Item -ItemType Directory -Force -Path $audio | Out-Null

$tracks = @(
  @{ f='01-deriva-celestial.mp3';          id='1EYvjBDyrq9A_gM9gxu0WlfJ6JV_am_Ps' },
  @{ f='02-voo-das-estrelas.mp3';          id='1T2CXynTqIdSx9LCmx20pWAT6i8VgbRwb' },
  @{ f='03-ressonancia-celeste.mp3';       id='1FR606hv1tQ1S3BcdjTZEHY3zys8qqVTv' },
  @{ f='04-frequencia-do-cosmos.mp3';      id='1fsWkp5OJigwg52LR9nw7jCB4UyVtR9sE' },
  @{ f='05-quietude-celestial.mp3';        id='1IOwQEyK15BLTfM98ep6QaDUDkVeq58jq' },
  @{ f='06-profundezas-azuis.mp3';         id='11ys3PYgCV5KvsGWr543p9cCr11fN-OWw' },
  @{ f='07-oceano-interior.mp3';           id='1Ix8Niwn6e-HNqCBNLxLkyNEnkGmI6v7C' },
  @{ f='08-silencio-cosmico.mp3';          id='1fLRCxA6B7uK5z_27stsRKn5Q94HErWEo' },
  @{ f='09-floresta-sagrada.mp3';          id='1zkKAC0SNTVHA0fsNLrd-qSAb6ADj0qkD' },
  @{ f='10-respiro-da-mata.mp3';           id='10NrPYJYR5bKEtLu95_r_MhkFw3z9oynu' },
  @{ f='11-flutuando-no-zumbido.mp3';      id='19Pl7JteDS8V5T5ib0DEDOVu4SK9jq7Js' },
  @{ f='12-vibracao-suave.mp3';            id='1n0FjE_T9bTWhfM0h_JgX_6gEyopE8SaN' },
  @{ f='13-alvorada-dourada.mp3';          id='1nODuLTd1QsusweP-z_nVfLcjjjJFhLho' },
  @{ f='14-despertar-do-sol-interior.mp3'; id='1GOsLDqp8MPCVjP4jfZOBRPyg1UNTkgBO' },
  @{ f='15-luz-dourada-ascendente.mp3';    id='1TKjeXe4BD0T0a6gyDCX_WprngyqHc76M' },
  @{ f='16-elevacao-da-chama.mp3';         id='1PI92O_dHgaxYtMl2RlZk-sXRyrAzocH-' },
  @{ f='17-brilho-interior.mp3';           id='1RDjBg26QihDHXSGsEQJ1laGAN5tuxW5B' },
  @{ f='18-ressonancia-luminosa.mp3';      id='1B1FywZQB9orozm8_wG-JYru1EMKJLrix' },
  @{ f='19-aura-de-luz.mp3';               id='1W4XGCvRklES-FnGE7hVZfSnhzClzY7yj' },
  @{ f='20-silencio-luminoso.mp3';         id='1GxN4katOg3I8YuMNaQihI-X19O-5r1Jz' },
  @{ f='21-veu-de-cristal.mp3';            id='1o5TwqRwk2qjPDeIEbqpqveK9MS06ie4T' },
  @{ f='22-chuva-de-frequencias.mp3';      id='1q2nUAHWihMfmqHv04JDpdR0y0F_iRW0z' },
  @{ f='23-gotas-de-cura.mp3';             id='11gWk5AprYN5OwpFLNN2q43rwlFB2weB5' },
  @{ f='24-geometria-sagrada.mp3';         id='1h_eGyQQWvxvLKZhZ-_f7fehaFM_U9Rma' },
  @{ f='25-padroes-do-universo.mp3';       id='1JhnNKCQJtRFEu2Q6BoOuh_mb5St3o1kL' },
  @{ f='26-silencio-ressonante.mp3';       id='1aXsJ-kJ6Cg45z12KIonpxW2DwUPTP3EA' },
  @{ f='27-espaco-vazio.mp3';              id='1M8USfQ3G6FeU8HO-lvyuYfqTR3B-Msvo' },
  @{ f='28-quietude-vibrante.mp3';         id='1TQPlNv6HN2AS8OkQC56sLzbbsLv-ySub' },
  @{ f='29-centro-imovel.mp3';             id='1PTWUkxT7E64MBL1FPMHkSvC01oIVOtr6' },
  @{ f='30-deriva-silenciosa.mp3';         id='1JYiQTIRnVPQodTpR2CTjSXH825ex5eqI' },
  @{ f='31-orbita-do-silencio.mp3';        id='1HpwsWV5UzQApDbemvJnxlvRvgK1F6y3u' },
  @{ f='32-orbita-solitaria.mp3';          id='1DUuIZldsqGup8Jk9h-zRGQ6E8MImJd86' },
  @{ f='33-ponto-de-paz.mp3';              id='1td_DaMrv_V-yh4DM9UJzdQOcYkQTSF3l' },
  @{ f='34-estrela-silenciosa.mp3';        id='1xiEg8TfsVnUNK4cz6CbGKwhJhTEzrTBU' },
  @{ f='35-luz-das-constelacoes.mp3';      id='1A3fF8kcZwH-afPQM5P0YmgbSx9QmwwLF' },
  @{ f='36-ressonancia-estelar.mp3';       id='19Gc1SKgJFa_D8QWLsD-IaTq4eOOW-Wnc' },
  @{ f='37-canto-das-estrelas.mp3';        id='1Qc8iD5MrhBtfhsVOe402Iun7_pTdyleA' },
  @{ f='38-aguas-serenas.mp3';             id='1uDWsO88ornAeXvUZJMtvJgy8IHzGFDM2' },
  @{ f='39-espelho-das-aguas.mp3';         id='1icQQVSonbiX3GlOmvtme-09noR2b3yBM' },
  @{ f='40-correnteza-tranquila.mp3';      id='1cC20oinCdRquzx0fDOp4F4h_-V5t_14Y' },
  @{ f='41-canto-das-aguas.mp3';           id='1jif2knFTVFbRn_okUnqOLGlrffBumgxT' },
  @{ f='42-voz-do-rio.mp3';                id='16jfwb2Sm5q4XthSr0UTojMf_wPjb0qC2' },
  @{ f='43-lago-interior.mp3';             id='1_EsKuMFzbS-jcbHBOeLMpHpkpWmbLl4X' },
  @{ f='44-quietude-na-correnteza.mp3';    id='1sftH716WudciWDLJ9GgjZXG9xQh8La-u' },
  @{ f='45-paz-interior.mp3';              id='1Y7rWdl8AXmu2_w5PH3fjKwmfXafSc-Mp' },
  @{ f='46-recolhimento.mp3';              id='1iwFR-6BlrxSYQyVqrPpTmRelh6CJnDlB' },
  @{ f='47-despertar-do-terceiro-olho.mp3';id='123UfCZ8GHBRZ5OvGHZXldKb7557c3UNb' },
  @{ f='48-mare-da-quietude.mp3';          id='1bfWf_m_LEGu1yLnkshVkB5Jf91YE7dXo' },
  @{ f='49-ondas-de-serenidade.mp3';       id='1iUNrkEihtfSGkRMJZctuZDYTXQ9X9bs3' },
  @{ f='50-portal-do-silencio.mp3';        id='18HFq7FC-ZTXJp8NDyuXCboweOn4j2cJm' }
)

$ok = 0; $skip = 0; $fail = 0
foreach ($t in $tracks) {
  $dest = Join-Path $audio $t.f
  if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 100000)) { $skip++; continue }
  try {
    Invoke-WebRequest -Uri "https://drive.usercontent.google.com/download?export=download&id=$($t.id)" -OutFile $dest -TimeoutSec 120
    Write-Host ("OK   {0}  ({1:N1} MB)" -f $t.f, ((Get-Item $dest).Length/1MB))
    $ok++
  } catch {
    Write-Host ("FALHOU {0}: {1}" -f $t.f, $_.Exception.Message)
    $fail++
  }
}
Write-Host ""
Write-Host "Baixados: $ok | Já existiam: $skip | Falhas: $fail"
