$ErrorActionPreference = "Stop"

$StackName = "poc3"
$ImageName = "poc3-rabbitmq-app:latest"

Write-Host "Checking Docker Swarm status..."
$swarmState = docker info --format '{{.Swarm.LocalNodeState}}'

if ($swarmState -ne "active") {
  Write-Host "Swarm is not active. Initializing single-node swarm..."
  docker swarm init
} else {
  Write-Host "Swarm is already active."
}

Write-Host "Building app image: $ImageName"
docker build -t $ImageName ./app

Write-Host "Deploying stack: $StackName"
docker stack deploy -c docker-stack.yml $StackName

Write-Host ""
Write-Host "Stack deployed. Useful commands:"
Write-Host "  docker stack services $StackName"
Write-Host "  docker stack ps $StackName"
Write-Host "  docker service logs -f ${StackName}_trip-api"
Write-Host "  docker service logs -f ${StackName}_notification-worker"
Write-Host ""
Write-Host "RabbitMQ dashboard: http://localhost:15672"
Write-Host "RabbitMQ login: guest / guest"
Write-Host "Trip API health: http://localhost:8080/health"
