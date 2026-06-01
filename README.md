# SeniorLove - Frontend

Ce dépôt contient la partie frontend de l'application web **SeniorLove**, développée avec **React**, **TypeScript** et **Vite**.

L'application permet aux utilisateurs de créer un compte, de se connecter, de gérer leur profil, de consulter d'autres profils, d'échanger via une messagerie, de participer à des conversations et de consulter des événements.

---

## Démarrer le projet

### Installation

Clonez le dépôt et installez les dépendances :

```bash
git clone git@github.com:YannMOTTOLA/projet-senior-love-front.git
cd projet-senior-love-front/SeniorLove
npm install
````

### Variables d'environnement

Créez un fichier `.env` à la racine du dossier `SeniorLove` en vous basant sur le fichier `.env.example` :

```bash
cp .env.example .env
```

Puis renseignez les variables nécessaires :

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez ensuite :

```txt
http://localhost:5173
```

> Le frontend utilise un proxy Vite vers l'API backend sur `http://localhost:3001`.

---

## Scripts disponibles

| Commande             | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Lance le serveur de développement                     |
| `npm run build`      | Crée la version de production                         |
| `npm run preview`    | Prévisualise la version de production en local        |
| `npm run lint`       | Analyse le code avec Biome                            |
| `npm run lint:fix`   | Corrige automatiquement les erreurs de lint possibles |
| `npm run format`     | Vérifie le formatage du code                          |
| `npm run format:fix` | Formate automatiquement le code                       |
| `npm run check`      | Lance les vérifications Biome                         |
| `npm run check:fix`  | Corrige automatiquement les vérifications possibles   |

---

## Fonctionnalités principales

* Authentification utilisateur
* Création de compte membre
* Création de compte organisation
* Gestion du profil utilisateur
* Recherche et affichage de profils
* Messagerie et conversations
* Consultation et création d'événements
* Back-office d'administration
* Routes protégées selon les rôles utilisateurs

---

## Structure du projet

```txt
SeniorLove/
├── src/
│   ├── components/   # Composants réutilisables
│   ├── pages/        # Pages principales de l'application
│   ├── layouts/      # Layouts avec navigation ou footer
│   ├── hooks/        # Hooks personnalisés et protection des routes
│   ├── context/      # Contextes globaux
│   ├── axios/        # Configuration des appels API
│   ├── _services/    # Services liés aux comptes utilisateurs
│   └── styles/       # Fichiers de style
├── public/
├── vite.config.ts
├── package.json
└── README.md
```

---

## Technologies utilisées

* React
* TypeScript
* Vite
* React Router
* Axios
* Zod
* Supabase
* Biome

---

## Projet associé

Ce frontend fonctionne avec l'API backend disponible ici :

```txt
https://github.com/YannMOTTOLA/projet-senior-love-back
```

---
