<#
setup-shopify-theme.ps1

PowerShell helper to create a local Dawn theme and start the Shopify dev server.
This script only runs locally — I cannot execute it on your machine.

Usage (PowerShell):
  # replace store domain and optionally project path
  .\setup-shopify-theme.ps1 -Store "your-name-ai-store.myshopify.com" -ProjectPath "C:\Users\lizal\shopify_theme_tutorial"

Notes:
- Requires Git and Shopify CLI installed and available in PATH.
- `shopify login` will open a browser for auth. Run it interactively when prompted.
- This script will not push anything to remote; it only bootstraps the theme locally and starts `shopify theme dev`.
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$Store,
    [string]$ProjectPath = "$env:USERPROFILE\shopify_theme_tutorial",
    [string]$CloneUrl = 'https://github.com/Shopify/dawn.git'
)

Write-Host "== Shopify Theme Setup Helper =="
Write-Host "Store: $Store"
Write-Host "Project path: $ProjectPath"
Write-Host "Dawn clone url: $CloneUrl"

# Ensure git exists
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed or not on PATH. Install Git before running this script. https://git-scm.com/downloads"
    exit 1
}

# Ensure shopify CLI exists
if (-not (Get-Command shopify -ErrorAction SilentlyContinue)) {
    Write-Error "Shopify CLI is not installed or not on PATH. Install Shopify CLI before running this script. See https://shopify.dev"
    exit 1
}

# Create project directory if needed
if (-not (Test-Path -Path $ProjectPath)) {
    Write-Host "Creating project directory: $ProjectPath"
    New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
}

Set-Location -Path $ProjectPath

# Clone/Init Dawn via shopify theme init (this will create a 'dawn' directory by default)
Write-Host "Initializing Dawn theme (this will clone into a 'dawn' folder)"
$initResult = shopify theme init --clone-url $CloneUrl 2>&1
Write-Host $initResult

# Move into dawn folder
$themeDir = Join-Path $ProjectPath 'dawn'
if (-not (Test-Path -Path $themeDir)) {
    Write-Error "Expected theme folder '$themeDir' not found. Check the output above for errors from 'shopify theme init'."
    exit 1
}

Set-Location -Path $themeDir
Write-Host "Changed to theme directory: $themeDir"

# Login (interactive)
Write-Host "You will now be prompted to login to Shopify CLI for store: $Store"
shopify login --store $Store

Write-Host "Starting local theme dev server (preview + live reload). Press Ctrl+C to stop."
shopify theme dev --store $Store

# End of script
