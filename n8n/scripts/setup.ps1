# ApplyAI n8n setup (Windows) — Docker not required
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "== ApplyAI n8n setup ==" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example — edit RAPIDAPI_KEY and candidate fields." -ForegroundColor Yellow
} else {
  Write-Host ".env already exists"
}

New-Item -ItemType Directory -Force -Path "data" | Out-Null
if (-not (Test-Path "data\.gitkeep")) {
  Set-Content -Path "data\.gitkeep" -Value ""
}

Write-Host "Running local logic self-test..."
node ./scripts/self-test.mjs

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1. Edit n8n\.env  (RAPIDAPI_KEY + your CANDIDATE_* fields)"
Write-Host "  2. npm run validate"
Write-Host "  3. npm run outreach     # fetch jobs + write data\outreach-log.csv"
Write-Host "  4. npm run start:n8n    # downloads n8n on first run, then opens UI"
Write-Host ""
Write-Host "Note: full n8n package install is optional; outreach runner needs only Node.js."
