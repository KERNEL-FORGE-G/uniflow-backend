# Variables Vercel — UniFlow Backend

Projet Vercel : `uniflow-backend`

Domaine de production : `https://api-uniflow.kernelforge.codes`

Identifiant Vercel : `prj_PetAIi6scVXVGDJFl4xR5Cr7b9xd`

## Variables obligatoires

| Nom | Valeur à charger | Environnement | Type |
|---|---|---|---|
| `NODE_ENV` | `production` | Production, Preview | Configuration |
| `PORT` | `3000` | Production, Preview | Configuration |
| `DATABASE_URL` | URL PostgreSQL de production avec `sslmode=require` si nécessaire | Production, Preview | Secret |
| `JWT_SECRET` | Secret aléatoire long, au moins 64 caractères | Production, Preview | Secret |
| `ENCRYPTION_KEY` | 64 caractères hexadécimaux pour AES-256 | Production, Preview | Secret |
| `CORS_ALLOWED_ORIGINS` | `https://uniflow.kernelforge.codes,https://api-uniflow.kernelforge.codes` | Production | Configuration |

## Variables nécessaires aux uploads

Ces trois variables sont obligatoires si les routes de fichiers sont utilisées :

```text
CLOUDINARY_CLOUD_NAME=VOTRE_CLOUD_NAME
CLOUDINARY_API_KEY=VOTRE_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=VOTRE_CLOUDINARY_API_SECRET
```

Ajoutez-les en Production et Preview si vous voulez tester les uploads dans les previews. Sinon, limitez-les à Production.

## Valeurs Appwrite

Le backend NestJS actuel utilise **Prisma/PostgreSQL** pour ses routes métier. Il ne doit donc pas recevoir une clé Appwrite simplement parce que le frontend utilise Appwrite. Une clé Appwrite serveur ne doit jamais être exposée au navigateur.

Si un module Appwrite serveur est ajouté ultérieurement, utilisez alors ces variables secrètes côté backend uniquement :

```text
APPWRITE_ENDPOINT=https://appwrite.kernelforge.codes/v1
APPWRITE_PROJECT_ID=6a959096002a64d9d4e6
APPWRITE_API_KEY=VOTRE_CLE_API_SERVEUR_APPWRITE
APPWRITE_DATABASE_ID=uniflow
APPWRITE_STORAGE_BUCKET_ID=uniflow_assets
```

## Configuration depuis l’interface Vercel

Dans le projet `uniflow-backend`, ouvrez **Settings → Environment Variables** et ajoutez chaque variable. Les valeurs de `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `CLOUDINARY_API_KEY` et `CLOUDINARY_API_SECRET` doivent être enregistrées comme secrets et ne doivent pas être commitées.

Après modification des variables, déclenchez un nouveau déploiement. Vérifiez ensuite :

```text
https://api-uniflow.kernelforge.codes/api/docs
https://api-uniflow.kernelforge.codes/api/v1/health
```

La route de santé doit répondre avec `status: ok`, tandis que les routes protégées doivent répondre `401` lorsqu’elles sont appelées sans JWT.
