# Projet - INF8808

Cet entrepôt contient le code source du projet réalisé dans le cadre du cours INF8808. Il est à noter que la visualisation 
est disponible sur mon [site web personnel](http://www.antoinebeland.com/inf8808).

## Prérequis
Avant de pouvoir être en mesure d'exécuter le projet, vous devez installer [Node.js](https://nodejs.org/en/). 
Une fois Node.js installé, vous devez taper la commande suivante dans un terminal.

```
npm install -g @angular/cli
```

Pour plus de détails, voir [angular-cli](https://github.com/angular/angular-cli).

## Exécution
Un fois que vous avez installé les prérequis demandés, vous devez suivre les instructions suivantes pour être 
en mesure d'exécuter l'application sur une machine locale.

La première étape consiste à installer les dépendances nécessaires à Angular2.

```
npm install
```

La deuxième étape consiste à démarrer le serveur.

```
npm start
```

Une fois le serveur démarré, l'application est accessible au `http://localhost:4200/`.

## Structure
La structure de l'application est comme suit:

- script
- src (sources de l'application)
  * app
    * graphics (visualisations)
    * pipes (filtres)
    * services
    * views (vues)
  * assets
  * environments

Il est à noter que le code source de l'application se trouve dans le dossier `/src/app/`.

## Contact
Ce projet a été réalisé par:

- Antoine Béland
- Konstantinos Lambrou-Latreille
