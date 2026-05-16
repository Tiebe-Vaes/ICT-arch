workspace "Travel Planning App" "ICT Architecture Assignment" {

    model {
        # Actors
        user = person "Traveler" "Plans and shares trips"
        friend = person "Friend" "Views shared itineraries"

        # External systems
        hotelApi = softwareSystem "Hotel Booking API" "External hotel provider" "External System"
        travelAgency = softwareSystem "Travel Agency API" "External travel services" "External System"

        # Your system
        travelApp = softwareSystem "Travel Planning System" "Core application" {
            webApp = container "Web Frontend" "User interface" "React"
            apiGateway = container "API Gateway" "Routes requests, handles auth" "Node.js"
            tripService = container "Trip Service" "Manages trips and itineraries" "Java/Spring"
            budgetService = container "Budget Service" "Tracks expenses and budgets" "Java/Spring"
            sharingService = container "Sharing Service" "Friend invites and permissions" "Java/Spring"
            integrationService = container "Integration Service" "Talks to external APIs" "Java/Spring"
            database = container "Database" "Stores trip data" "PostgreSQL" "Database"
            cache = container "Cache" "Speeds up searches" "Redis" "Database"
        }

        # Relationships — system context level
        user -> travelApp "Plans trips using"
        friend -> travelApp "Views shared trips via"
        travelApp -> hotelApi "Fetches hotel availability"
        travelApp -> travelAgency "Books travel services"

        # Relationships — container level
        user -> webApp "Uses"
        webApp -> apiGateway "Calls"
        apiGateway -> tripService "Routes to"
        apiGateway -> budgetService "Routes to"
        apiGateway -> sharingService "Routes to"
        tripService -> database "Reads/writes"
        tripService -> cache "Caches results"
        integrationService -> hotelApi "Calls"
        integrationService -> travelAgency "Calls"
        tripService -> integrationService "Delegates external calls"

        # Deployment
        deploymentEnvironment "Production" {
            deploymentNode "Docker Swarm" {
                deploymentNode "Manager Node" {
                    containerInstance apiGateway
                }
                deploymentNode "Worker Node 1" {
                    containerInstance tripService
                    containerInstance budgetService
                    containerInstance sharingService
                    containerInstance integrationService
                }
                deploymentNode "Worker Node 2" {
                    containerInstance webApp
                }
                deploymentNode "Data Node" {
                    containerInstance database
                    containerInstance cache
                }
            }
        }
    }

    views {
        systemContext travelApp "SystemContext" {
            include *
            autoLayout
        }

        container travelApp "Containers" {
            include *
            autoLayout
        }

        deployment travelApp "Production" "DeploymentDiagram" {
            include *
            autoLayout
        }

        styles {
            element "Person" {
                shape Person
                background #08427B
                color #ffffff
            }
            element "External System" {
                background #999999
                color #ffffff
            }
            element "Database" {
                shape Cylinder
            }
            element "Software System" {
                background #1168BD
                color #ffffff
            }
            element "Container" {
                background #438DD5
                color #ffffff
            }
        }
    }
}