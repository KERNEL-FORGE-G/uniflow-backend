# Variables Vercel — UniFlow Backend avec Appwrite Storage

Projet Vercel : `uniflow-backend`

Domaine de production : `https://api-uniflow.kernelforge.codes`

Le backend utilise désormais **Appwrite Storage** pour les fichiers. Cloudinary n’est plus utilisé.

## Variables obligatoires

| Nom | Valeur | Environnement | Type |
|---|---|---|---|
| `NODE_ENV` | `production` | Production, Preview | Configuration |
| `PORT` | `3000` | Production, Preview | Configuration |
| `DATABASE_URL` | URL PostgreSQL accessible depuis Vercel, avec SSL si nécessaire | Production, Preview | Secret |
| `JWT_SECRET` | Secret aléatoire long, au moins 64 caractères | Production, Preview | Secret |
| `ENCRYPTION_KEY` | 64 caractères hexadécimaux | Production, Preview | Secret |
| `CORS_ALLOWED_ORIGINS` | `https://uniflow.kernelforge.codes,https://api-uniflow.kernelforge.codes` | Production | Configuration |
| `APPWRITE_ENDPOINT` | `https://appwrite.kernelforge.codes/v1` | Production, Preview | Configuration |
| `APPWRITE_PROJECT_ID` | `6a959096002a64d9d4e6` | Production, Preview | Configuration |
| `APPWRITE_API_KEY` | Clé API serveur Appwrite avec accès Storage | Production, Preview | Secret |
| `APPWRITE_STORAGE_BUCKET_ID` | `uniflow_assets` | Production, Preview | Configuration |

La clé `APPWRITE_API_KEY` doit être une clé serveur Appwrite autorisée à lire, créer et supprimer des fichiers dans le bucket `uniflow_assets`. Elle ne doit jamais être utilisée dans le web, Flutter ou Electron.

## Variables qui ne sont plus nécessaires

Supprimez de Vercel les variables suivantes si elles existent et ne servent à aucun autre service :

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

## Génération des secrets

```bash
openssl rand -base64 64   # valeur de JWT_SECRET
openssl rand -hex 32       # valeur de ENCRYPTION_KEY
```

## Vérifications après déploiement

Après avoir enregistré les variables et relancé le déploiement Vercel, vérifiez :

```text
https://api-uniflow.kernelforge.codes/api/docs
https://api-uniflow.kernelforge.codes/api/v1/health
```

Un upload réussi doit créer le fichier dans `uniflow_assets`, puis enregistrer dans PostgreSQL l’ID Appwrite dans `Attachment.publicId` et l’URL de lecture Appwrite dans `Attachment.url`. Une suppression retire d’abord le fichier Appwrite, puis la ligne PostgreSQL.
