<h2  align="center">NodeJS API for SkoleIntra</h2>
<p align="center"> Uofficiel API for ItsLearning's SkoleIntra til NodeJS.</p>

# Getting started
 ![NPM Version](https://img.shields.io/npm/v/skoleintra) ![Node LTS](https://img.shields.io/node/v-lts/skoleintra) ![NPM License](https://img.shields.io/npm/l/skoleintra)
 
ForældreIntra er en del af SkoleIntra, som brugers af folkeskoler til kommunikation mellem skole og hjem. Denne NPM pakke logger automatisk på ForældreIntra og kan hente et barns kalender, ugeskema og ugeplaner.

Bemærk at dette bibliotek ikke er udviklet af ItsLearning, men er et uofficielt program. Hvis du oplever fejl må du meget gerne indrapportere dem på [Issues](https://github.com/CavaleriDK/skoleintra/issues).

## Opsætning

Du henter og installerer pakken ved at køre `npm install skoleintra`

### Anvendelse

Biblioteket skal først instantieres med loginoplysninger til ForældreIntra platformen. Herefter kan du kalde forskellige asynkrone metoder til at hente oplysninger fra SkoleIntra siden.

```js
import SkoleIntra from 'skoleintra'

const instance = new SkoleIntra('brugernavn', 'adgangskode', 'https://MIN_SKOLE.m.skoleintra.dk');

const kalendar = await instance.getCalendarActivitiesByMonth(Date.now());
```

## Avanceret brug

### Promises

Da alle metoder er asynkrone er returnerer et Promise, er det muligt chaine flere metoder sammen. For at kunne chaine flere metoder sammen, er det vigtigt at du først kalder metoden `initialize()` og at du altid kalder `closeAll()` afslutningsvist.

`initialize()` sørger for at starte en ny Chromium instans op i baggrunden, og `closeAll()` sørger for altid at lukke ned for samme browser instans.

Se dette eksempel på at hente skoleskema og efterfølgende ugeplanen for et barn.

```js
import SkoleIntra from 'skoleintra'

const instance = new SkoleIntra('brugernavn', 'adgangskode', 'https://MIN_SKOLE.m.skoleintra.dk');

instance.initialize()
  .then(() => instance.getWeeklySchedule(new Date(), false))
  .then((schedule) => {
      console.log(schedule);
  })
  .then(() => instance.getWeeklyPlan(new Date(), false))
  .then((plan) => {
      console.log(plan);
  })
  .finally(() => instance.closeAll());
```
### Brug eksisterende cookie

Det hænder af og til at du bliver blokkeret fra automatisk at logge ind. Når dette sker kaster biblioteket den generiske fejl:

> Error: Request was blocked by automation protection. Try initializing SkoleIntra with an existing cookie.

For at omgå den blokkering, kan du kalde `initialize()` med en cookie-streng, efter at have logget ind første gang i din normale browser. Biblioketet er vil stadig automatisk logge ind for dig efterfølgende, men det lader SkoleIntra forstå at du allerede har besøgt deres platform som bruger tidligere og så blokkerer de ikke efterfølgende kald til deres side.

```js
import SkoleIntra from 'skoleintra'

const instance = new SkoleIntra('brugernavn', 'adgangskode', 'https://MIN_SKOLE.m.skoleintra.dk');

instance.initialize('Pool=nsiu SsoSelectedSchoo...');
  .then(() => instance.getCalendarActivitiesByMonth("2024-02-29", false))
  .then((calendar) => {
      console.log(calendar);
  })
  .finally(() => instance.closeAll());
```

### Chromium version

Biblioteket vil ikke automatisk hente en version af Chromium ned, når du kører det første gang. Derfor skal du pege ind på den version af Chrome eller en Chromium-baseret browser, som du vil lade biblioteket anvende.

For at vælge dette, skal du sætte environment-variablen `PUPPETEER_EXECUTABLE_PATH` op med den absolutte sti til hvilken browser du vil bruge. 

Eksempel: `PUPPETEER_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`.

## Deltagelse og videre udvikling

På nuværende tidspunkt er det muligt at hente et barns aktivitetsekalender, ugeskema og ugeplan for en given dato. Jeg overvejer at udvide til også at kunne hente informationer om flere af ens tilknyttede børn, samt at skrive en driver der gør biblioteket i stand til også at gemme de data den henter fra gang til gang.

Du er også mere end velkommen til at fortsætte udviklingen af biblioteket her og sende dine egne pull requests ind.

Kig også gerne med på [issues siden](https://github.com/CavaleriDK/skoleintra/issues), hvis der skulle være nogle åbne fejlrapporter.

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.md) 