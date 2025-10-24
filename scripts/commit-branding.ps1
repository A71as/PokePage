<#
commit-branding.ps1

Adds the branding asset and layout file to git and commits with a standard message.
Usage (PowerShell):
  .\commit-branding.ps1 -ProjectRoot "C:\Users\lizal\PagePerfect"

Notes:
- Ensure you have initialized a git repo in the project root before running (git init).
- This script does not push to remote.
#>
param(
    [string]$ProjectRoot = "$env:USERPROFILE\PagePerfect"
)

Set-Location -Path $ProjectRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed or not on PATH. Install Git before running this script. https://git-scm.com/downloads"
    exit 1
}

if (-not (Test-Path -Path (Join-Path $ProjectRoot '.git'))) {
    Write-Host "No git repository found in $ProjectRoot. Run 'git init' first or run the provided git-init-and-push.ps1 script."
    exit 1
}

Write-Host "Staging branding files..."
# Use paths relative to repo root
git add theme/assets/everyday-ai-branding.css.liquid theme/layout/theme.liquid

Write-Host "Committing..."
git commit -m "feat: Add Everyday AI brand CSS system with dynamic colors" --allow-empty

Write-Host "Done. To push, run: git push origin main"