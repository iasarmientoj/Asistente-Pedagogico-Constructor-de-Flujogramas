<#
    construir-plugin.ps1
    Constructor de Flujogramas - Semillero SIEPSI

    Empaqueta la herramienta como plugin de WordPress listo para subir.

    Que hace, en tres pasos:
      1. Copia assets/flujograma.css y assets/flujograma.js dentro de la carpeta
         del plugin, para que las dos versiones nunca se desincronicen.
      2. Comprueba que el numero de version del PHP y el del JS coincidan.
      3. Genera dist\siepsi-flujograma-<version>.zip

    Uso, desde esta misma carpeta:
        .\construir-plugin.ps1

    El ZIP resultante se sube en WordPress desde:
        Escritorio -> Plugins -> Anadir nuevo -> Subir plugin
#>

$ErrorActionPreference = 'Stop'

$raiz    = Split-Path -Parent $MyInvocation.MyCommand.Path
$origen  = Join-Path $raiz 'assets'
$plugin  = Join-Path $raiz 'wordpress\siepsi-flujograma'
$destino = Join-Path $plugin 'assets'
$dist    = Join-Path $raiz 'dist'
$php     = Join-Path $plugin 'siepsi-flujograma.php'

Write-Host ''
Write-Host '  Constructor de Flujogramas - empaquetado para WordPress' -ForegroundColor Cyan
Write-Host '  ------------------------------------------------------' -ForegroundColor DarkGray

# --- Comprobaciones previas -------------------------------------------------
foreach ($f in @((Join-Path $origen 'flujograma.css'), (Join-Path $origen 'flujograma.js'), $php)) {
    if (-not (Test-Path $f)) {
        Write-Host "  ERROR: no se encuentra $f" -ForegroundColor Red
        exit 1
    }
}

# --- Version ----------------------------------------------------------------
$verPhp = ([regex]::Match((Get-Content $php -Raw), "Version:\s*([0-9.]+)")).Groups[1].Value
$verJs  = ([regex]::Match((Get-Content (Join-Path $origen 'flujograma.js') -Raw), "var VERSION = '([0-9.]+)'")).Groups[1].Value

if ($verPhp -ne $verJs) {
    Write-Host "  AVISO: la version del plugin ($verPhp) no coincide con la del JS ($verJs)." -ForegroundColor Yellow
    Write-Host '         Actualiza las dos antes de publicar.' -ForegroundColor Yellow
}
Write-Host "  Version: $verPhp"

# --- 1. Sincronizar los assets ---------------------------------------------
if (-not (Test-Path $destino)) { New-Item -ItemType Directory -Path $destino -Force | Out-Null }
Copy-Item (Join-Path $origen 'flujograma.css') $destino -Force
Copy-Item (Join-Path $origen 'flujograma.js')  $destino -Force
Write-Host '  [1/3] Assets copiados al plugin' -ForegroundColor Green

# --- 2. Limpiar el ZIP anterior --------------------------------------------
if (-not (Test-Path $dist)) { New-Item -ItemType Directory -Path $dist -Force | Out-Null }
$zip = Join-Path $dist "siepsi-flujograma-$verPhp.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Write-Host '  [2/3] Carpeta dist lista' -ForegroundColor Green

# --- 3. Comprimir -----------------------------------------------------------
#
# OJO: aqui NO se usa Compress-Archive. En Windows PowerShell 5.1 ese cmdlet
# guarda las rutas internas con barra invertida (siepsi-flujograma\assets\...),
# que es invalido segun la especificacion ZIP. El hosting de WordPress es Linux
# y al descomprimir crearia un unico archivo llamado literalmente
# "siepsi-flujograma\assets\flujograma.css" en vez de la carpeta: el plugin se
# instala roto y sin CSS ni JS.
#
# ZipFile::CreateFromDirectory tampoco sirve: en .NET Framework (el que trae
# Windows PowerShell 5.1) hace exactamente lo mismo. Se comprobo y falla igual.
#
# La unica forma fiable es crear cada entrada a mano dandole el nombre exacto,
# con barras normales. Es lo que hace este bloque.
# Hacen falta los dos ensamblados: ZipFile vive en .FileSystem, pero ZipArchive
# y ZipArchiveMode viven en System.IO.Compression.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$flujo   = [System.IO.File]::Open($zip, [System.IO.FileMode]::Create)
$archivo = New-Object System.IO.Compression.ZipArchive($flujo, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($f in (Get-ChildItem -Path $plugin -Recurse -File)) {
        $rel    = $f.FullName.Substring($plugin.Length).TrimStart('\', '/')
        $nombre = 'siepsi-flujograma/' + ($rel -replace '\\', '/')

        $entrada = $archivo.CreateEntry($nombre, [System.IO.Compression.CompressionLevel]::Optimal)
        $salida  = $entrada.Open()
        $bytes   = [System.IO.File]::ReadAllBytes($f.FullName)
        $salida.Write($bytes, 0, $bytes.Length)
        $salida.Dispose()
    }
} finally {
    $archivo.Dispose()
    $flujo.Dispose()
}

# Verificacion: si alguna ruta trae barra invertida, el ZIP no sirve.
$archivo = [System.IO.Compression.ZipFile]::OpenRead($zip)
$rutas   = $archivo.Entries | ForEach-Object { $_.FullName }
$archivo.Dispose()

if ($rutas -match '\\') {
    Write-Host '  ERROR: el ZIP contiene rutas con barra invertida. No lo subas.' -ForegroundColor Red
    exit 1
}

$kb = [math]::Round((Get-Item $zip).Length / 1KB, 1)
Write-Host "  [3/3] ZIP generado y verificado ($kb KB)" -ForegroundColor Green
$rutas | ForEach-Object { Write-Host "        $_" -ForegroundColor DarkGray }

Write-Host ''
Write-Host "  Listo: $zip" -ForegroundColor Cyan
Write-Host ''
Write-Host '  Siguiente paso en WordPress:' -ForegroundColor White
Write-Host '    1. Plugins -> Anadir nuevo -> Subir plugin -> elegir este ZIP'
Write-Host '    2. Activar'
Write-Host '    3. Crear la pagina y pegar el shortcode:  [flujograma_siepsi]'
Write-Host ''
