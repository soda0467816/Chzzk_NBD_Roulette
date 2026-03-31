param(
  [switch]$SkipSetup
)

$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not $SkipSetup) {
  Write-Step "개발 환경 자동 설치 스크립트 실행"
  & "$PSScriptRoot\dev-setup.ps1"
}

Write-Step "Vite 개발 서버 실행"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot'; npm run dev"

Write-Step "Tauri 개발 모드 실행"
npm run tauri:dev
