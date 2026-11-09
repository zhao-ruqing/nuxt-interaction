$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# 本机 D:\Environment\Python\python.exe 是 GUI 程序（无控制台）。
# 用它建的 venv 在 cmd 里会打印一行后立刻回到提示符，服务并不在跑。
$basePy = $null
foreach ($cand in @(
  "D:\Environment\Python310\python.exe",
  "$env:LocalAppData\Programs\Python\Python310\python.exe",
  "$env:LocalAppData\Programs\Python\Python311\python.exe",
  "$env:LocalAppData\Programs\Python\Python312\python.exe"
)) {
  if (Test-Path $cand) { $basePy = $cand; break }
}
if (-not $basePy) { $basePy = "python" }

$venvPy = ".\.venv\Scripts\python.exe"
$cfg = ".\.venv\pyvenv.cfg"
$badHome = $false
if (Test-Path $cfg) {
  $venvHome = (Select-String -Path $cfg -Pattern '^home\s*=\s*(.+)$').Matches[0].Groups[1].Value.Trim()
  if ($venvHome -eq 'D:\Environment\Python') { $badHome = $true }
}

if ($badHome) {
  Write-Host "Existing venv uses a windowless Python. Recreating..."
  Remove-Item -Recurse -Force .\.venv
}

if (-not (Test-Path $venvPy)) {
  Write-Host "Creating venv with $basePy"
  & $basePy -m venv .venv
  & $venvPy -m pip install -U pip
  & $venvPy -m pip install -r requirements.txt
}

$port = 8002
Write-Host "Starting nuxt-interaction RAG on http://127.0.0.1:$port"
Write-Host "Keep this window open. Press Ctrl+C to stop."
& $venvPy -m uvicorn app.main:app --host 127.0.0.1 --port $port
if ($LASTEXITCODE -ne 0) {
  Write-Host "RAG exited with code $LASTEXITCODE"
  exit $LASTEXITCODE
}
