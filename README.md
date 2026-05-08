MyBourse

Application TypeScript sans framework pour le suivi et la comparaison de cours boursiers avec visualisation graphique interactive.

Installation
Prérequis
Node.js 18+
npm
Lancer le projet
Cloner le repo :
git clone https://github.com/Alphadragnir/mybourse.git

cd mybourse
Installer les dépendances :
npm install
Lancer le serveur de développement :
npm run dev

L’application est accessible à :
http://localhost:3000

Build production

npm run build
npm run preview

Fonctionnalités
 Sélection d’action : cliquez sur un symbole dans la liste (AAPL, TSLA, etc.)
 Comparaison : ajoutez une seconde action via "+ Comparer"
 Période : 1 semaine · 1 mois · 3 mois · 1 an · Tout
 Type de graphique : courbe · barres · aire · nuage de points
 Corrélation : coefficient de Pearson calculé sur les dates communes
 Export CSV : téléchargement des données de la période affichée
 Mode sombre : toggle ☀️/🌙 avec détection automatique du système
 Préférences : mode sombre mémorisé via localStorage
 Architecture

mybourse/
├── client/
│ ├── index.html → point d’entrée HTML
│ └── src/
│ ├── main.ts → état global, initialisation, dark mode
│ ├── types.ts → interfaces TypeScript (Stock, PriceEntry, AppState…)
│ ├── api.ts → fetch, filtrage, calculs (corrélation, stats, CSV)
│ ├── ui.ts → rendu DOM, event listeners
│ ├── chart.ts → intégration Chart.js
│ └── styles.css → styles CSS dark/light
├── package.json
├── tsconfig.json
└── vite.config.ts

Choix techniques
TypeScript strict (strict: true, noImplicitAny)
Aucun framework (DOM natif)
Chart.js pour les graphiques
Vite pour le build et le dev server
Corrélation de Pearson calculée côté client
API

GET https://keligmartin.github.io/api/stocks.json

Retour : liste de stocks avec leurs données de prix.

Auteur

Fayad Latifu
latifufayad1@gmail.com
