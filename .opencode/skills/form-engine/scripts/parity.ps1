# Compares the Form Engine runtime between the Jekyll and Eleventy checkouts.
#
#   powershell -File .opencode/skills/form-engine/scripts/parity.ps1
#   powershell -File .opencode/skills/form-engine/scripts/parity.ps1 -ReifuaRoot C:\path\to\reifua\main
#   powershell -File .opencode/skills/form-engine/scripts/parity.ps1 -ShowMatches
#
# The engine must be identical file-for-file; only the path prefix differs
# (Jekyll: assets/js/form-engine, Eleventy: src/assets/js/form-engine).
# Exits 1 on any missing file, extra file or hash mismatch.

[CmdletBinding()]
param(
  [string]$ReifuaRoot = '',
  [switch]$ShowMatches
)

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))

if ([string]::IsNullOrWhiteSpace($ReifuaRoot)) {
  $ReifuaRoot = Join-Path $root '..\..\reifua\main'
}
$reifua = [IO.Path]::GetFullPath($ReifuaRoot)

$left = Join-Path $root 'assets\js\form-engine'
$right = Join-Path $reifua 'src\assets\js\form-engine'

if (-not (Test-Path -LiteralPath $left)) {
  Write-Host "FAILED: Jekyll engine not found: $left" -ForegroundColor Red
  exit 2
}
if (-not (Test-Path -LiteralPath $right)) {
  Write-Host "FAILED: Eleventy engine not found: $right" -ForegroundColor Red
  Write-Host "Pass -ReifuaRoot if the twin checkout lives elsewhere." -ForegroundColor DarkGray
  exit 2
}

function Get-EngineHashes([string]$Base) {
  $map = @{}
  Get-ChildItem -LiteralPath $Base -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($Base.Length + 1).Replace('\', '/')
    $map[$rel] = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
  }
  return $map
}

$jekyll = Get-EngineHashes $left
$eleventy = Get-EngineHashes $right

$names = @($jekyll.Keys + $eleventy.Keys | Sort-Object -Unique)
$diffs = 0

Write-Host "==> Jekyll : $left" -ForegroundColor Cyan
Write-Host "==> Eleventy: $right" -ForegroundColor Cyan
Write-Host ''

foreach ($name in $names) {
  $hasLeft = $jekyll.ContainsKey($name)
  $hasRight = $eleventy.ContainsKey($name)

  if (-not $hasRight) {
    Write-Host "MISSING in 11ty:   $name" -ForegroundColor Yellow
    $diffs++
  }
  elseif (-not $hasLeft) {
    Write-Host "MISSING in Jekyll: $name" -ForegroundColor Yellow
    $diffs++
  }
  elseif ($jekyll[$name] -ne $eleventy[$name]) {
    Write-Host "DIFF:              $name" -ForegroundColor Red
    $diffs++
  }
  elseif ($ShowMatches) {
    Write-Host "same:              $name" -ForegroundColor DarkGray
  }
}

Write-Host ''
if ($diffs -gt 0) {
  Write-Host "FAILED: $diffs file(s) differ. Fix in EL-1 before claiming parity." -ForegroundColor Red
  exit 1
}

Write-Host "OK: engines are identical ($($names.Count) files)" -ForegroundColor Green
exit 0
