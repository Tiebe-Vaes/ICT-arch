# POC1 deploy. Usage: .\deploy.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Init swarm if not active
$swarmActive = (docker info --format "{{.Swarm.LocalNodeState}}") -eq "active"
if (-not $swarmActive) {
  Write-Host "Initializing swarm..."
  docker swarm init | Out-Null
}

if (-not (Test-Path .env)) {
  Write-Error ".env not found. Copy .env.example and fill in."
  exit 1
}

# Load .env values
$envVars = @{}
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#=][^=]*)=(.*)$') {
    $envVars[$Matches[1].Trim()] = $Matches[2].Trim()
  }
}

# Create Swarm secrets from .env (if not yet present)
function Ensure-Secret($name, $value) {
  $existing = docker secret ls --format "{{.Name}}" | Select-String -SimpleMatch $name
  if ($existing) { Write-Host "Secret '$name' already exists, skip."; return }
  $tmp = New-TemporaryFile
  Set-Content -Path $tmp -Value $value -NoNewline -Encoding ascii
  docker secret create $name $tmp.FullName | Out-Null
  Remove-Item $tmp
  Write-Host "Secret '$name' created."
}

Ensure-Secret "github_client_id"     $envVars["GITHUB_CLIENT_ID"]
Ensure-Secret "github_client_secret" $envVars["GITHUB_CLIENT_SECRET"]
Ensure-Secret "jwt_secret"           $envVars["JWT_SECRET"]

# Build + deploy
Write-Host "Building image..."
docker build -t poc1-app:latest .\app

Write-Host "Deploying stack..."
docker stack deploy -c poc.yaml poc

Write-Host ""
Write-Host "Open http://localhost:8080"
Write-Host "Logs:    docker service logs -f poc_app"
Write-Host "Status:  docker stack services poc"
Write-Host "Remove:  docker stack rm poc"
Write-Host "Wipe secrets: docker secret rm github_client_id github_client_secret jwt_secret"
