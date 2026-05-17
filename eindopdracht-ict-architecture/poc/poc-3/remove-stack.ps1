$ErrorActionPreference = "Stop"

$StackName = "poc3"

Write-Host "Removing stack: $StackName"
docker stack rm $StackName

Write-Host "Stack removal started. Docker may need a few seconds to remove services and the overlay network."
