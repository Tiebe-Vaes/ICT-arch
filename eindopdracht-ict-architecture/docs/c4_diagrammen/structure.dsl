workspace "Travel Planning App" "ICT Architecture Assignment" {

    model {
        # Actors
        traveler = person "Traveler" "Plant trips, beheert budget, nodigt vrienden uit"
        admin    = person "Admin" "Modereert gebruikers en trips"

        # Externe systemen
        oauthProvider   = softwareSystem "OAuth Provider (GitHub)" "Externe identity provider" "External System"
        hotelApi        = softwareSystem "Hotel Booking API"       "Externe hotelprovider"     "External System"
        travelAgency    = softwareSystem "Travel Agency API"       "Externe vlucht-/reisprovider" "External System"
        paymentProvider = softwareSystem "Payment Provider"        "Externe betaalprovider"    "External System"

        # Eigen systeem — modulaire monoliet (ADR-001)
        travelApp = softwareSystem "Travel Planning System" "Plannen en delen van reizen met vrienden" {
            webApp   = container "Web Frontend" "SPA voor trips, budget, planning" "React"
            traefik  = container "Traefik" "Reverse proxy / ingress, TLS-terminatie" "Traefik"
            backend  = container "Backend (Modulaire Monoliet)" "Eén deploybare unit met modules: Auth, Trip, Planning, Budget, Integration, Notification, Audit" "Node.js / Express"
            worker   = container "Background Worker" "Zelfde image als backend, andere entrypoint. Consumeert events uit RabbitMQ (notificaties, audit)" "Node.js"
            postgres = container "PostgreSQL"   "Trips, users, budget, audit log" "PostgreSQL 16" "Database"
            redis    = container "Redis Cache"  "Cache van externe API-responses en sessies" "Redis 7"   "Database"
            rabbit   = container "RabbitMQ"     "Event bus voor asynchrone side effects" "RabbitMQ 3"   "Messaging"
        }

        # System context
        traveler  -> travelApp "Plant en deelt reizen via"
        admin     -> travelApp "Modereert via"
        travelApp -> oauthProvider   "Login delegeren naar"
        travelApp -> hotelApi        "Hotels zoeken/boeken"
        travelApp -> travelAgency    "Vluchten/reizen zoeken"
        travelApp -> paymentProvider "Betalingen afhandelen"

        # Container relaties
        traveler -> webApp  "Gebruikt"
        admin    -> webApp  "Gebruikt"
        webApp   -> traefik "HTTPS"
        traefik  -> backend "Routeert REST/JSON"
        backend  -> postgres "Leest/schrijft (ACID)"
        backend  -> redis    "Cached externe responses"
        backend  -> rabbit   "Publiceert domeinevents"
        worker   -> rabbit   "Consumeert events"
        worker   -> postgres "Schrijft notificaties / audit"

        # Externe integraties op container-niveau
        backend -> oauthProvider   "OAuth2 authorization code"
        backend -> hotelApi        "HTTP via ACL"
        backend -> travelAgency    "HTTP via ACL"
        backend -> paymentProvider "HTTP via ACL"

        # Deployment — testcluster: 3 managers + 2 workers
        deploymentEnvironment "Production" {
            deploymentNode "Docker Swarm Cluster" "3 managers, 2 workers" {
                deploymentNode "Manager 1" "Linux VM — ingress" {
                    containerInstance traefik
                    containerInstance webApp
                }
                deploymentNode "Manager 2" "Linux VM" {
                    containerInstance backend
                }
                deploymentNode "Manager 3" "Linux VM" {
                    containerInstance backend
                    containerInstance worker
                }
                deploymentNode "Worker 1" "Linux VM — stateful data" {
                    containerInstance postgres
                    containerInstance redis
                }
                deploymentNode "Worker 2" "Linux VM — messaging" {
                    containerInstance rabbit
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

        deployment travelApp "Production" "Deployment" {
            include *
            autoLayout
        }

        styles {
            element "Person" {
                shape Person
                background #08427B
                color #ffffff
            }
            element "Software System" {
                background #1168BD
                color #ffffff
            }
            element "External System" {
                background #999999
                color #ffffff
            }
            element "Container" {
                background #438DD5
                color #ffffff
            }
            element "Database" {
                shape Cylinder
                background #2E7C8F
                color #ffffff
            }
            element "Messaging" {
                shape Pipe
                background #C97A2E
                color #ffffff
            }
        }
    }
}
