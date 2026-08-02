# Deploy ApplyAI Cloud Functions with OpenAI
# Run AFTER: firebase login (with applyai-444b2 owner account) + Blaze plan enabled

$ErrorActionPreference = "Stop"
Write-Host "`n=== Deploy ApplyAI Functions ===" -ForegroundColor Green

# OpenAI key is in functions/.env (gitignored) — also set as Firebase secret:
Write-Host "Setting OPENAI_API_KEY secret..." -ForegroundColor Cyan
$key = (Get-Content "functions\.env" | Where-Object { $_ -match "^OPENAI_API_KEY=" }) -replace "OPENAI_API_KEY=", ""
if ($key) {
  $key | firebase functions:secrets:set OPENAI_API_KEY --project applyai-444b2 --force
}

Write-Host "`nDeploying functions..." -ForegroundColor Cyan
firebase deploy --only functions --project applyai-444b2

Write-Host "`nDeploying Firestore rules..." -ForegroundColor Cyan
firebase deploy --only firestore:rules --project applyai-444b2

Write-Host "`n=== Done! Restart app: npm run web ===" -ForegroundColor Green
