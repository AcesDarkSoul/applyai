# ApplyAI - Full Deploy Script
# Deploys Firestore rules, Storage rules, indexes, and Cloud Functions
# Usage: .\deploy.ps1

Write-Host "=== ApplyAI Full Deploy ===" -ForegroundColor Cyan

# Deploy Firestore rules + indexes
Write-Host "`n[1/4] Deploying Firestore rules..." -ForegroundColor Yellow
firebase deploy --only firestore --project applyai-444b2

# Deploy Storage rules
Write-Host "`n[2/4] Deploying Storage rules..." -ForegroundColor Yellow
firebase deploy --only storage --project applyai-444b2

# Build and deploy Cloud Functions
Write-Host "`n[3/4] Building and deploying Cloud Functions..." -ForegroundColor Yellow
firebase deploy --only functions --project applyai-444b2

# Set CORS on storage bucket
Write-Host "`n[4/4] Setting CORS on storage bucket..." -ForegroundColor Yellow
Write-Host "Run manually: gsutil cors set cors.json gs://applyai-444b2.firebasestorage.app" -ForegroundColor Gray

Write-Host "`n=== Deploy complete! ===" -ForegroundColor Green
