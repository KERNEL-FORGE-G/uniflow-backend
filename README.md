# ⚙️ UniFlow Backend — Services Utilitaires & Infrastructure

![UniFlow Logo](../uniflow-we/logo.png)

Le backend UniFlow est un service robuste basé sur **NestJS** conçu pour gérer les tâches de fond, les intégrations tierces et servir de passerelle utilitaire à l'infrastructure **Appwrite** de KERNEL FORGE.

## 🏗️ Évolution de l'Architecture
Dans la phase actuelle du projet, la majorité de la logique de données a été migrée vers **Appwrite** (Source de vérité unique). Le backend NestJS conserve les rôles critiques suivants :
- **Appwrite Storage Bridge** : Gestion sécurisée des fichiers via l'API Key serveur.
- **Sync & Audit** : Synchronisation entre les systèmes legacy et les nouvelles collections Appwrite.
- **Visioconférence** : Gestion des jetons et de l'infrastructure LiveKit.
- **IoT Sentinelle** : Réception et agrégation des logs provenant des puces Edge AI locales.

## 🛠️ Stack Technique
- **Framework** : NestJS (Node.js).
- **ORM** : Prisma (PostgreSQL pour les logs d'audit et la persistence auxiliaire).
- **BaaS Client** : Appwrite Server SDK.
- **Sécurité** : JWT, Chiffrement AES pour les secrets.
- **Documentation** : Swagger/OpenAPI intégré.

## 🚀 Fonctionnalités
- **Auth Gateway** : Gestion des sessions hybrides et renouvellement de jetons.
- **File Management** : Proxy sécurisé pour le téléversement vers Appwrite Storage.
- **Attendance Roll** : Agrégation périodique des émargements pour rapports statistiques.
- **Audit Logs** : Traçabilité complète des actions administratives critiques.

## ⚙️ Configuration
Un fichier `.env` complet est indispensable pour le fonctionnement :
```env
UNIFLOW_DATA_SOURCE=appwrite
APPWRITE_ENDPOINT=https://appwrite.kernelforge.codes/v1
APPWRITE_PROJECT_ID=6a959096002a64d9d4e6
APPWRITE_API_KEY=votre_cle_serveur_secret
DATABASE_URL=postgresql://...
JWT_SECRET=votre_secret_jwt
```

## 📦 Docker & Déploiement
Le backend est containerisé pour un déploiement facile sur VPS :
```bash
docker-compose up -d
```

---
© 2026 **KERNEL FORGE** — L'épine dorsale de l'écosystème UniFlow.
