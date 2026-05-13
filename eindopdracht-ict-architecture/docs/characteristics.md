# Karakteristieken

Top 7 quality attributes voor de applicatie.

## 1. Availability

Gebruikers bevinden zich in verschillende tijdzones en kunnen op elk moment toegang nodig hebben tot hun reisplanning, boekingen en budgetinformatie. Ook tijdens de reis zelf moet de applicatie betrouwbaar beschikbaar blijven, bijvoorbeeld om reservaties te raadplegen of wijzigingen door te voeren. Daarom moet het systeem ontworpen worden met minimale downtime en een hoge beschikbaarheid.

## 2. Confidentiality

De applicatie verwerkt gevoelige gegevens zoals persoonlijke informatie, reisdata, locaties en mogelijk betalingsgegevens. Deze informatie mag enkel toegankelijk zijn voor bevoegde gebruikers. Ongeautoriseerde toegang kan leiden tot privacyproblemen, misbruik of veiligheidsrisico's. Daarom moet het systeem vertrouwelijkheid garanderen via sterke authenticatie, toegangscontrole en versleuteling.

## 3. Interoperability

De applicatie integreert externe diensten van reisbureaus, hotels, vluchtenplatformen en andere aanbieders. Deze externe partijen gebruiken elk hun eigen API's, dataformaten en protocollen. Het systeem moet in staat zijn om vlot te communiceren met deze heterogene diensten, en moet ook nieuwe integraties kunnen toevoegen zonder de kern van de applicatie te hertekenen.

## 4. Fault Tolerance

Externe diensten zoals hotel-API's of vluchtdatabanken kunnen tijdelijk onbeschikbaar zijn. De applicatie mag hierdoor niet volledig uitvallen. Componenten moeten onafhankelijk van elkaar falen, en het systeem moet gracieus degraderen — bijvoorbeeld door gecachte data te tonen of de gebruiker te informeren zonder verlies van reeds ingevoerde planningsdata.

## 5. Latency

Gebruikers zoeken gelijktijdig door grote hoeveelheden activiteiten, hotels en vluchten. Trage zoekresultaten leiden rechtstreeks tot frustratie en verlaten sessies. Zeker op mobiele apparaten of bij beperkte dataverbinding tijdens een reis is een lage responstijd cruciaal voor een goede gebruikerservaring.

## 6. Data Consistency

Meerdere vrienden werken gelijktijdig aan hetzelfde reisplan en budget. Conflicterende wijzigingen moeten correct afgehandeld worden. Dit is een echte architecturale uitdaging die keuzes beïnvloedt tussen eventual consistency en strong consistency, met directe impact op gebruikerservaring en data-integriteit.

## 7. Scalability

De applicatie heeft duidelijke gebruikspieken (vakantieperiodes). Dit heeft een directe impact op architecturale keuzes zoals horizontale schaalbaarheid, load balancing en elastische infrastructuur. Het systeem moet pieken kunnen opvangen zonder degradatie van beschikbaarheid of latency.
