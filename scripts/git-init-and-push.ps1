<#
git-init-and-push.ps1

PowerShell helper to initialize git, create an initial commit and push to a remote repository.

Usage (PowerShell):
  .\git-init-and-push.ps1 -ProjectRoot "C:\Users\lizal\PagePerfect" -RemoteUrl "git@github.com:yourusername/your-repo-name.git"

Notes:
- Replace the remote URL with your repository (create repo on GitHub first).
- This script will prompt before adding a remote and before pushing.
- Ensure you have SSH keys or HTTPS credentials configured for your GitHub account.
#>
param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectRoot = "$env:USERPROFILE\PagePerfect",
    [Parameter(Mandatory=$true)]
    [string]$RemoteUrl
)

Write-Host "== Git Init & Push Helper =="
Write-Host "Project root: $ProjectRoot"
Write-Host "Remote URL: $RemoteUrl"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed or not on PATH. Install Git before running this script. https://git-scm.com/downloads"
    exit 1
}

Set-Location -Path $ProjectRoot

# If not a git repo, init
if (-not (Test-Path -Path (Join-Path $ProjectRoot '.git'))) {
    Write-Host "Initializing new git repository in $ProjectRoot"
    git init
} else {
    Write-Host "Existing git repository detected."
}

# Configure user if not set
$globalName = git config --global user.name
$globalEmail = git config --global user.email
if (-not $globalName -or -not $globalEmail) {
    Write-Host "Global git user.name or user.email not set. It's recommended to set these."
    Write-Host "You can run: git config --global user.name \"Your Name\"; git config --global user.email \"you@example.com\""
}

Write-Host "Staging files..."
git add .

Write-Host "Committing..."
git commit -m "feat: Initialize Dawn theme for Everyday AI customization" --allow-empty

# Add remote if not exists
$existingRemotes = git remote
if ($existingRemotes -match 'origin') {
    Write-Host "Remote 'origin' already exists. It will be updated to: $RemoteUrl"
    git remote set-url origin $RemoteUrl
} else {
    Write-Host "Adding remote origin: $RemoteUrl"
    git remote add origin $RemoteUrl
}

Write-Host "Setting main branch and pushing to origin (you may be prompted for credentials)."
git branch -M main

git push -u origin main

Write-Host "Done. If the push failed due to authentication, ensure your SSH keys are added to GitHub or use HTTPS + PAT."