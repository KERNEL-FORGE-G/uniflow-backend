# UniFlow Backend (hors service)

Ancien backend NestJS + Prisma d'UniFlow. **Il n'est plus utilisé** : depuis la
migration vers Appwrite, les trois clients (web, mobile, desktop) lisent et
écrivent directement dans Appwrite Cloud, et la logique privilégiée vit dans
les Functions Appwrite du dépôt `uniflow-we` (`functions/`).

Le dépôt est conservé pour deux raisons :

1. **Son `.env` (non versionné) porte la clé serveur Appwrite** utilisée par
   les scripts de `uniflow-we/scripts/` (provisionnement, seeds, tests). Le
   fichier `.comptes-demo.local` (non versionné lui aussi) y garde les mots de
   passe des comptes de démonstration générés par `seed-accounts.mjs`.
2. Le code NestJS et les migrations Prisma documentent le modèle métier
   d'origine (utilisateurs, structure académique, présence, visioconférence,
   journaux d'audit).

## Configuration attendue dans `.env`

```env
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=uniflow
APPWRITE_DATABASE_ID=uniflow
APPWRITE_API_KEY=<clé serveur, jamais versionnée>
```

Voir `.env.example`. Aucun identifiant ne doit être commité ; `.gitignore`
exclut `.env` et `.comptes-demo.local`.

## Contenu

```
uniflow-backend/
├── src/            modules NestJS d'origine (auth, académique, présence, visio, audit, outil d'administration)
├── prisma/         schéma et migrations PostgreSQL d'origine
├── scripts/        check_db.js — inspection d'une base Prisma
├── docs/           notes de demandes en attente, ancienne configuration Vercel
├── Dockerfile, docker-compose*.yml, deploy.sh — déploiement VPS d'origine
└── .github/workflows/ci.yml
```

Rien ici ne doit être remis en service sans décision explicite : toute
nouvelle logique serveur va dans une Function Appwrite de `uniflow-we`.
