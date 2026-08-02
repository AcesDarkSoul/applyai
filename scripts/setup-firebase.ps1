# Firebase one-time setup script for ApplyAI
# Run in PowerShell from the applyai folder AFTER: firebase login (with the Google account that owns applyai-444b2)

Write-Host "`n=== ApplyAI Firebase Setup ===" -ForegroundColor Green
Write-Host "Project: applyai-444b2`n"

# Step 1: Deploy Firestore rules (required for profile + applications)
Write-Host "[1/2] Deploying Firestore rules..." -ForegroundColor Cyan
firebase deploy --only firestore:rules --project applyai-444b2
if ($LASTEXITCODE -ne 0) {
  Write-Host "`nFAILED: Rules deploy failed." -ForegroundColor Red
  Write-Host "Fix: Run 'firebase login' with the Google account that created applyai-444b2"
  Write-Host "Or deploy manually in Firebase Console -> Firestore -> Rules`n"
  exit 1
}

Write-Host "`nNote: Resumes are stored LOCALLY on device — Firebase Storage is NOT required." -ForegroundColor Green

# Step 2: Cloud Functions (optional — needs Blaze plan + API keys)
Write-Host "`n[2/2] Cloud Functions (optional)..." -ForegroundColor Cyan
Write-Host "Requires Blaze plan. Set secrets first:"
Write-Host "  firebase functions:secrets:set OPENAI_API_KEY --project applyai-444b2"
Write-Host "  firebase functions:secrets:set RAPIDAPI_KEY --project applyai-444b2"
Write-Host "  firebase functions:secrets:set SENDGRID_API_KEY --project applyai-444b2"
Write-Host "  firebase functions:secrets:set FROM_EMAIL --project applyai-444b2"
Write-Host "Then: firebase deploy --only functions --project applyai-444b2`n"

Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Restart the app: npm run web`n"
