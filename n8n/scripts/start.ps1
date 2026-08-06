# Start local n8n UI (loads n8n/.env)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path ".env")) {
  Write-Error "Missing n8n\.env - run npm run setup first"
}

# Load .env into process for n8n $env access
Get-Content ".env" | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $eq = $line.IndexOf("=")
  if ($eq -lt 1) { return }
  $key = $line.Substring(0, $eq).Trim()
  $val = $line.Substring($eq + 1).Trim()
  [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
}

$env:N8N_BLOCK_ENV_ACCESS_IN_NODE = "false"
$env:N8N_SECURE_COOKIE = "false"
$env:GENERIC_TIMEZONE = if ($env:GENERIC_TIMEZONE) { $env:GENERIC_TIMEZONE } else { "Asia/Kolkata" }
$env:N8N_PORT = if ($env:N8N_PORT) { $env:N8N_PORT } else { "5678" }

Write-Host "Starting n8n on http://localhost:$($env:N8N_PORT)" -ForegroundColor Cyan
Write-Host "APIFY_TOKEN loaded: $([bool]$env:APIFY_TOKEN)  SERPAPI loaded: $([bool]$env:SERPAPI_API_KEY)" -ForegroundColor Yellow
Write-Host "Import workflow: workflows\job-outreach-auto-apply.json"
Write-Host "First run may download n8n via npx (large)."
Write-Host "Press Ctrl+C to stop"
Write-Host ""

npx --yes n8n@1.82.0 start
