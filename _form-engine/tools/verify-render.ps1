<#
.SYNOPSIS
  Safety net for form-engine work: build the site and prove that the tracked
  pages came out unchanged.

.DESCRIPTION
  Any refactor of _includes/form/**, form-engine.js or the form controllers is
  expected to leave the rendered output of new.html, the add-property worker
  manifest and a property page byte-identical. This script builds and enforces
  that, so a regression shows up as a diff instead of as a broken form.

  The build is a fast one: --limit_posts 1 renders only the newest listing
  post instead of all 1428 (a full build takes over fifteen minutes). The
  property page in the baseline follows the newest post and is recorded in
  _form-engine/baseline/.render-baseline.json at capture time.

  After the build, check-notify.mjs asserts the config-driven modal contract
  on every property page that was built.

  capture  record the current output as the baseline (do this once, before
           touching anything; re-run when a newer listing post appears)
  verify   compare the current output against the baseline (run after every
           change)

.EXAMPLE
  .\_form-engine\tools\verify-render.ps1 capture
  .\_form-engine\tools\verify-render.ps1 verify
#>

[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet('capture', 'verify', 'build')]
  [string]$Mode = 'verify',

  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..\..')

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

if (-not $SkipBuild) {
  Write-Step 'jekyll build --limit_posts 1'
  $sw = [Diagnostics.Stopwatch]::StartNew()
  & bundle exec jekyll build --limit_posts 1 --trace --profile
  if ($LASTEXITCODE -ne 0) { throw "jekyll build failed (exit $LASTEXITCODE)" }
  $sw.Stop()
  Write-Host "    built in $([int]$sw.Elapsed.TotalSeconds)s" -ForegroundColor DarkGray
}

Write-Step 'check-notify'
& node _form-engine/tools/check-notify.mjs
if ($LASTEXITCODE -ne 0) { throw "check-notify failed (exit $LASTEXITCODE)" }

switch ($Mode) {
  'build' { }
  'capture' { Write-Step 'capturing baseline'; & node _form-engine/tools/verify-render.mjs capture }
  'verify'  { Write-Step 'verifying against baseline'; & node _form-engine/tools/verify-render.mjs verify }
}

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
exit 0