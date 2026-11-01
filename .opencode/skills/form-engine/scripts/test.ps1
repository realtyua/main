# Runs the Form Engine test suite from the repository root.
#
#   powershell -File .opencode/skills/form-engine/scripts/test.ps1
#
# The flags mirror package.json: force-exit and a 60s timeout per test, because
# the runtime keeps resources open.

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))
Set-Location $root

Write-Host "==> npm test  ($root)" -ForegroundColor Cyan
& node --test --test-force-exit --test-timeout=60000 --test-concurrency=2 "test/*.test.mjs"
if ($LASTEXITCODE -ne 0) {
  Write-Host "FAILED: node --test exited with $LASTEXITCODE" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host "OK: tests passed" -ForegroundColor Green
exit 0
