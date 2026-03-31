param(
  [switch]$SkipWinget,
  [switch]$SkipNpmInstall
)

$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Test-Command($name) {
  return $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

function Ensure-WingetPackage($id, $displayName) {
  if ($SkipWinget) {
    Write-Host "$displayName 설치는 건너뜁니다. (-SkipWinget)"
    return
  }

  if (-not (Test-Command "winget")) {
    throw "winget을 찾을 수 없습니다. Microsoft Store의 App Installer를 먼저 설치해 주세요."
  }

  Write-Step "$displayName 설치 또는 업데이트"
  winget install --id $id --exact --accept-package-agreements --accept-source-agreements
}

function Refresh-PathFromMachine() {
  $machine = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
  $user = [System.Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machine;$user"
}

Write-Step "개발 환경 점검 시작"

if (-not (Test-Command "node")) {
  Ensure-WingetPackage "OpenJS.NodeJS.LTS" "Node.js LTS"
  Refresh-PathFromMachine
} else {
  Write-Host "Node.js가 이미 설치되어 있습니다."
}

if (-not (Test-Command "cargo")) {
  Ensure-WingetPackage "Rustlang.Rustup" "Rustup / Cargo"
  Refresh-PathFromMachine
} else {
  Write-Host "Rust / Cargo가 이미 설치되어 있습니다."
}

if (-not (Test-Command "cargo")) {
  throw "cargo를 찾을 수 없습니다. 새 PowerShell 창을 다시 열고 스크립트를 다시 실행해 주세요."
}

if (-not (Test-Command "node")) {
  throw "node를 찾을 수 없습니다. 새 PowerShell 창을 다시 열고 스크립트를 다시 실행해 주세요."
}

Write-Step "Tauri CLI 설치"
cargo install tauri-cli --locked

if (-not $SkipNpmInstall) {
  Write-Step "프로젝트 npm 패키지 설치"
  npm install
} else {
  Write-Host "npm install은 건너뜁니다. (-SkipNpmInstall)"
}

Write-Step "설치 결과 확인"
node --version
npm --version
cargo --version
cargo tauri --version

Write-Step "다음 단계"
Write-Host "1. npm run dev"
Write-Host "2. npm run tauri:dev"
