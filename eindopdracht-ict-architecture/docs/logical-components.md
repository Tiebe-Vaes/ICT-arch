# Logische componenten

Bepaald via de actor-action approach, voor de keuze van een architecturale stijl.
Componenten zijn geen services en staan los van enige implementatiebeslissing.

## Actoren

- Gast: een niet-ingelogde bezoeker.
- Reiziger: een geregistreerde gebruiker die reizen plant en deelt met anderen.
- Groepsbeheerder: een reiziger met extra rechten binnen een specifieke reis.
- System: automatische acties die zonder directe gebruikersinteractie plaatsvinden.
- Extern systeem: een derde partij zoals een reisbureau, hotel of betalingsprovider.

## Actor-action tabel

| Actor | Acties | Component |
|---|---|---|
| Gast | Registreren, inloggen | Gebruikersbeheer |
| Reiziger | Profiel beheren | Gebruikersbeheer |
| Reiziger | Reis bekijken | Reisbeheer |
| Reiziger | Activiteit voorstellen, stemmen op activiteit | Activiteitenplanning |
| Reiziger | Uitgave registreren, budgetoverzicht raadplegen | Budgetbeheer |
| Reiziger | Betaling initiëren | Betalingen |
| Groepsbeheerder | Reis aanmaken, bewerken, verwijderen | Reisbeheer |
| Groepsbeheerder | Deelnemers uitnodigen en beheren | Reisbeheer |
| Groepsbeheerder | Totaalbudget instellen | Budgetbeheer |
| System | Externe prijzen en beschikbaarheid opvragen | Integratie |
| System | Budget bijwerken na betalingsbevestiging | Budgetbeheer |
| System | Notificatie versturen bij gebeurtenis | Notificatie |
| Extern systeem | Prijzen en beschikbaarheid aanleveren | Integratie |
| Extern systeem | Betalingsbevestiging aanleveren | Betalingen |

## Takenoverzicht per component

### Gebruikersbeheer

- Registratie van nieuwe gebruikers
- Authenticatie (inloggen, uitloggen, wachtwoord herstellen)
- Profielbeheer (naam, e-mail, voorkeuren)
- Autorisatie: bepalen wat een gebruiker mag binnen een reis

### Reisbeheer

- Aanmaken, bewerken en verwijderen van reizen
- Instellen van reisdetails (bestemming, datums, beschrijving)
- Uitnodigen van deelnemers via link of e-mail
- Beheren van de ledenlijst (toevoegen, verwijderen, rollen toewijzen)
- Overzicht van alle reizen van een gebruiker

### Activiteitenplanning

- Voorstellen van activiteiten (naam, datum, locatie, beschrijving)
- Stemmen op voorgestelde activiteiten
- Definitief inplannen van activiteiten in een tijdlijn
- Overzicht van de reisagenda

### Budgetbeheer

- Instellen van een totaalbudget per reis
- Registreren van individuele uitgaven door deelnemers
- Automatisch berekenen van wie hoeveel verschuldigd is aan wie (splits)
- Bewaken van het budgetplafond en signaleren bij overschrijding
- Overzicht van alle uitgaven en openstaande bedragen per deelnemer
- Budget bijwerken na ontvangst van een betalingsbevestiging

### Integratie

- Opvragen van beschikbaarheid en prijzen bij hotels en reisbureaus
- Vertalen van externe dataformaten naar interne domeinmodellen
- Afhandelen van fouten en time-outs bij externe diensten

### Betalingen

- Initiëren van betalingen via een externe betalingsprovider
- Verwerken en valideren van betalingsbevestigingen
- Doorgeven van bevestigde betalingen aan Budgetbeheer
- Afhandelen van mislukte of geannuleerde betalingen

### Notificatie

- Versturen van uitnodigingen voor een reis
- Notificeren bij nieuwe activiteitsvoorstellen of wijzigingen
- Waarschuwen bij budgetoverschrijding
- Bevestigen van betalingen en uitgaven
- Ondersteunen van meerdere kanalen (e-mail, in-app)
