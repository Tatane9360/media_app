# Application de Montage Vidéo Admin (Next.js + MongoDB)

Cette application permet à un administrateur d'importer, d'éditer, de rendre et de publier des vidéos via une interface web/mobile responsive basée sur Next.js.

## Architecture du Système

### Schéma Logique

```
+---------------------+    +----------------------+    +-------------------+
| Frontend (Next.js)  | <- | Backend (API Routes) | <- | MongoDB Database  |
+---------------------+    +----------------------+    +-------------------+
        ^                          ^                           ^
        |                          |                           |
        v                          v                           v
+---------------------+    +----------------------+    +-------------------+
| Client Mobile/Web   |    | Services de Rendu    |    | Stockage Cloud    |
|                     |    | (FFmpeg/Shotstack)   |    | (S3/Cloudinary)   |
+---------------------+    +----------------------+    +-------------------+
```

## Modèles de Données

### Admin
- Authentification et gestion des utilisateurs admin
- Stockage des informations de profil et des identifiants

### VideoAsset
- Gestion des rushes vidéo importés
- Stockage des métadonnées techniques (durée, résolution, etc.)
- Lien vers les fichiers stockés dans le cloud

### Project
- Organisation des projets de montage
- Liaison avec les assets vidéo
- Stockage de l'état de la timeline et des paramètres de rendu

### Timeline (intégré dans Project)
- Structure multi-pistes pour l'édition vidéo
- Gestion des clips, transitions, effets, et pistes audio
- Paramètres de rendu et de publication

## Services Recommandés

### Stockage Cloud
- **AWS S3**: Stockage économique et évolutif pour les vidéos originales et rendues
- **Cloudinary**: Alternative avec fonctionnalités de traitement d'image et vidéo intégrées
- **Google Cloud Storage**: Option robuste avec CDN intégré

### Traitement Vidéo
- **FFmpeg** (auto-hébergé): Solution complète et gratuite, mais nécessite plus de ressources serveur
- **Shotstack API**: Service cloud de montage vidéo programmable
- **Cloudinary Video API**: Fonctionnalités de traitement vidéo simplifiées
- **Mux**: API vidéo cloud pour le streaming et le traitement

### Authentification
- **NextAuth.js**: Intégration native avec Next.js
- **Auth0**: Service complet avec authentification multifacteur

## Architecture Frontend

### Pages Principales
- `/login`: Authentification administrateur
- `/admin/dashboard`: Liste des projets
- `/admin/upload`: Import des rushes vidéo
- `/project/[id]`: Édition de la timeline
- `/project/[id]/render`: Rendu et publication
- `/videos/[id]`: Lecture du montage final

### Composants Clés
- `TimelineEditor`: Éditeur de timeline interactif
- `VideoPlayer`: Lecteur vidéo personnalisé
- `AssetBrowser`: Explorateur d'assets vidéo
- `EffectsPanel`: Panneau d'ajout d'effets

## Architecture Backend

### API Routes
- `/api/auth/*`: Authentification (Next-Auth)
- `/api/video/upload`: Upload des fichiers vidéo
- `/api/video/assets`: Gestion des assets vidéo
- `/api/project/*`: CRUD des projets
- `/api/project/[id]/render`: Rendu vidéo

### Services Backend
- `cloudStorage.ts`: Gestion du stockage cloud
- `videoProcessing.ts`: Traitement vidéo avec FFmpeg
- `mongoose.ts`: Connexion à MongoDB

## Recommandations UI/UX pour Mobile

1. **Interface Timeline Mobile**
   - Zoom pinch-to-zoom pour la timeline
   - Contrôles adaptés aux écrans tactiles
   - Prévisualisation en temps réel avec résolution adaptative

2. **Optimisation Mobile**
   - Chargement progressif des assets
   - Compression côté client avant upload
   - Interface adaptative (taille des contrôles)

3. **PWA (Progressive Web App)**
   - Installation sur l'écran d'accueil
   - Fonctionnalités hors ligne (édition sans connexion)
   - Synchronisation en arrière-plan

## Considérations Techniques

1. **Performance**
   - Utiliser un service de queue (comme Bull) pour les tâches de rendu
   - Mise en cache des thumbnails et prévisualisations
   - Streaming adaptatif pour la lecture

2. **Sécurité**
   - Authentification JWT sécurisée
   - Validation des uploads et des formats
   - Protection contre les attaques CSRF

3. **Scalabilité**
   - Architecture en microservices pour le traitement vidéo
   - Séparation du stockage et du traitement
   - Utilisation d'un CDN pour la diffusion

## Démarrage du Projet

```bash
# Installation des dépendances
npm install
# ou
pnpm install

# Configuration des variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos paramètres

# Démarrer le serveur de développement
npm run dev
# ou
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir le résultat.

## Dépendances Requises

Pour le traitement vidéo et le stockage cloud, vous devrez installer les packages suivants :

```bash
# Traitement vidéo
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg

# Stockage Cloud (AWS S3)
npm install @aws-sdk/client-s3

# Autres utilitaires
npm install uuid
npm install next-auth
```

## Prochaines Étapes

1. Finalisation de l'intégration des services de rendu vidéo
2. Amélioration de l'interface timeline pour mobile
3. Mise en place des tests unitaires et d'intégration
4. Déploiement sur une plateforme cloud (Vercel, AWS, etc.)
5. Configuration du pipeline CI/CD

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# media_app
