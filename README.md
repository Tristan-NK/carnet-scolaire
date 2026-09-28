# Carnet Scolaire 2.0

Appli PWA (Progressive Web App) pour gérer ses notes, son emploi du temps et ses rappels de devoirs — installable comme une vraie appli, utilisable hors-ligne, et **sans compte** : toutes les données restent dans le navigateur (IndexedDB), sur l'appareil de l'utilisateur.

## Installer les dépendances

```bash
npm install
```

## Lancer en développement

```bash
npm run dev
```
Puis ouvrir l'URL affichée (en général http://localhost:5173).

## Générer la version de production

```bash
npm run build
```
Le résultat est généré dans le dossier `dist/`. C'est ce dossier qu'il faut déployer.

## Déployer en vraie PWA installable

N'importe quel hébergement de fichiers statiques en **HTTPS** convient (l'installation d'une PWA nécessite HTTPS, sauf en local) :

- **Netlify** ou **Vercel** : glisser-déposer le dossier `dist/` après `npm run build`, ou connecter le dépôt Git — c'est le plus simple.
- **GitHub Pages** : pousser `dist/` sur la branche `gh-pages`.
- Tout autre hébergeur statique (OVH, Firebase Hosting, etc.).

Une fois en ligne :
- Sur **Android/Chrome** : un bandeau "Installer l'application" apparaît, ou via le menu ⋮ → "Installer l'application".
- Sur **iPhone/Safari** : bouton Partager → "Sur l'écran d'accueil".
- Sur **ordinateur (Chrome/Edge)** : icône d'installation dans la barre d'adresse.

Le plugin `vite-plugin-pwa` génère automatiquement le `manifest.json` et le service worker nécessaires au fonctionnement hors-ligne et à l'installation — rien à configurer en plus.

## Notifications

Les rappels affichés dans l'appli (bandeau sur l'écran d'Accueil) fonctionnent dès que l'appli est ouverte. Pour de **vraies notifications push** (reçues même appli fermée), il faudrait ajouter :
1. une demande de permission `Notification.requestPermission()`,
2. un service worker étendu avec l'API Push,
3. un petit serveur (ou service comme OneSignal/Firebase Cloud Messaging) pour déclencher les envois programmés.

C'est une étape supplémentaire volontairement laissée de côté ici pour garder une appli 100% locale sans serveur.

## Structure du projet

```
carnet-scolaire/
├── index.html
├── package.json
├── vite.config.js          # config Vite + PWA (manifest, service worker)
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── icons/               # icônes de l'appli (192px, 512px)
└── src/
    ├── main.jsx              # point d'entrée React
    ├── App.jsx                # toute l'appli (Accueil, Notes, EDT, Devoirs, Réglages)
    ├── storage.js             # petit wrapper IndexedDB (lecture/écriture locale)
    └── styles.css              # Tailwind
```

## Personnaliser

- **Matières par défaut** : `PRESETS` en haut de `src/App.jsx`.
- **Couleurs / thème** : constantes `INK`, `RED`, `YELLOW`, `GREEN`, `PAPER` en haut de `src/App.jsx`.
- **Nom / icônes de l'appli** : `vite-plugin-pwa` dans `vite.config.js`, et fichiers dans `public/icons/`.
