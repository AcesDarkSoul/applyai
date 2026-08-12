# ApplyAI - Full Deploy Script
# Deploys Firestore rules, Storage rules, indexes, and Cloud Functions
# Usage: .\deploy.ps1
# Project must match the mobile app (.env / google-services.json): petcare-9f4e6

$ErrorActionPreference = "Stop"
$ProjectId = "petcare-9f4e6"

Write-Host "=== ApplyAI Full Deploy ($ProjectId) ===" -ForegroundColor Cyan

# Ensure correct Firebase account/project for this directory
firebase use $ProjectId
if ($LASTEXITCODE -ne 0) {
  Write-Host "Switch Firebase account if needed: firebase login:use nextgeninfotech.sdk@gmail.com" -ForegroundColor Red
  exit 1
}

Write-Host "`n[1/4] Deploying Firestore rules + indexes..." -ForegroundColor Yellow
firebase deploy --only firestore --project $ProjectId
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[2/4] Deploying Storage rules..." -ForegroundColor Yellow
firebase deploy --only storage --project $ProjectId
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[3/4] Building and deploying Cloud Functions..." -ForegroundColor Yellow
firebase deploy --only functions --project $ProjectId
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[4/4] Setting CORS on storage bucket..." -ForegroundColor Yellow
$gsutil = Get-Command gsutil -ErrorAction SilentlyContinue
if ($gsutil) {
  gsutil cors set cors.json "gs://petcare-9f4e6.firebasestorage.app"
} else {
  Write-Host "gsutil not found. Run manually:" -ForegroundColor Gray
  Write-Host "  gsutil cors set cors.json gs://petcare-9f4e6.firebasestorage.app" -ForegroundColor Gray
}

Write-Host "`n=== Deploy complete! ===" -ForegroundColor Green
