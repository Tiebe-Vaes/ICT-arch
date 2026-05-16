# POC1 deploy. Usage: .\deploy.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Init swarm if not active
$swarmActive = (docker info --format "{{.Swarm.LocalNodeState}}") -eq "active"
if (-not $swarmActive) {
  Write-Host "Initializing swarm..."
  docker swarm init | Out-Null
}

if (-not (Test-Path .\app\.env)) {
  Write-Error "app/.env not found. Copy app/.env.example and fill in."
  exit 1
}

Write-Host "Building image..."
docker build -t poc1-app:latest .\app

Write-Host "Deploying stack..."
docker stack deploy -f poc.yaml poc

Write-Host ""
Write-Host "Open http://localhost:8080"
Write-Host "Logs:   docker service logs -f poc_app"
Write-Host "Remove: docker stack rm poc"
