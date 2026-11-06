$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
  Write-Host "Creating venv..."
  python -m venv .venv
  & .\.venv\Scripts\python.exe -m pip install -U pip
  & .\.venv\Scripts\pip.exe install -r requirements.txt
}
$port = 8002
Write-Host "Starting nuxt-interaction RAG on http://127.0.0.1:$port"
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port $port
