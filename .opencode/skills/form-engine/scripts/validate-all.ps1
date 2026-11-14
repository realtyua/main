# Validates every Form Engine config in _data with --strict.
#
#   powershell -File .opencode/skills/form-engine/scripts/validate-all.ps1
#
# Exits 1 if any existing config fails. Missing files are reported and skipped,
# so the script also works in a checkout that only carries some of the forms.

[CmdletBinding()]
param(
  [string[]]$Configs = @(
    '_data/add-property.yml',
    '_data/notify.yml',
    '_data/demo.yml'
  )
)

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))
Set-Location $root

$failed = @()
foreach ($config in $Configs) {
  $full = Join-Path $root $config
  if (-not (Test-Path -LiteralPath $full)) {
    Write-Host "SKIP: $config (missing)" -ForegroundColor DarkGray
    continue
  }

  Write-Host "==> $config" -ForegroundColor Cyan
  & node _form-engine/tools/validate-config.mjs $config --strict
  if ($LASTEXITCODE -ne 0) {
    $failed += $config
  }
}

if ($failed.Count -gt 0) {
  Write-Host ("FAILED: " + ($failed -join ', ')) -ForegroundColor Red
  exit 1
}

Write-Host "OK: all present configs valid" -ForegroundColor Green
exit 0
