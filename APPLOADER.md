# AppLoader - Guide d'utilisation

## 📁 Fichiers de vidéo recommandés

Placez vos fichiers vidéo dans le dossier `public/videos/` :

```
public/
  videos/
    loader-main.webm      # Vidéo principale (format optimal)
    loader-main.mp4       # Vidéo de fallback
    loader-fallback.webm  # Fallback alternatif (optionnel)
```

## 🚀 Configuration rapide

### 1. Dans votre layout principal (`src/app/layout.tsx`) :

```tsx
import ClientLayout from "./ClientLayout";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ClientLayout
          loaderConfig={{
            videoSrc: "/videos/loader-main.webm",
            fallbackVideoSrc: "/videos/loader-main.mp4",
            minDuration: 3000,
            loadingText: "Bienvenue sur Media Challenge",
            showProgress: true,
          }}
        >
          <Header />
          <main>{children}</main>
          <Footer />
        </ClientLayout>
      </body>
    </html>
  );
}
```

### 2. Configuration des vidéos

```tsx
const loaderConfig = {
  // Vidéo principale (webM recommandé pour la qualité/taille)
  videoSrc: "/videos/loader-main.webm",
  
  // Vidéo de fallback (mp4 pour compatibilité)
  fallbackVideoSrc: "/videos/loader-main.mp4",
  
  // Durée minimale d'affichage (2 secondes par défaut)
  minDuration: 3000,
  
  // Texte personnalisé
  loadingText: "Chargement de votre application...",
  
  // Afficher la barre de progression
  showProgress: true,
};
```

## 🎛️ Options de configuration

| Propriété          | Type      | Default                    | Description                       |
| ------------------ | --------- | -------------------------- | --------------------------------- |
| `videoSrc`         | `string`  | **Requis**                 | Chemin vers la vidéo principale   |
| `fallbackVideoSrc` | `string`  | `undefined`                | Vidéo de fallback en cas d'erreur |
| `minDuration`      | `number`  | `2000`                     | Durée minimale en ms              |
| `loadingText`      | `string`  | `"Chargement en cours..."` | Texte affiché                     |
| `showProgress`     | `boolean` | `true`                     | Afficher la barre de progression  |

## 📱 Comportement

- **Première visite** : Le loader s'affiche intégralement
- **Visites suivantes** : Le loader ne s'affiche plus (session)
- **Gestion d'erreur** : Fallback automatique vers mp4 ou mode dégradé
- **Responsive** : Optimisé pour mobile et desktop
- **Accessibilité** : Support des lecteurs d'écran

## 🎨 Format vidéo recommandé

### Spécifications optimales :
- **Format** : WebM (VP9) + MP4 (H.264) en fallback
- **Résolution** : 1920x1080 (Full HD)
- **Durée** : 2-5 secondes en boucle
- **Bitrate** : 1-2 Mbps pour WebM, 2-3 Mbps pour MP4
- **FPS** : 30 ou 60
- **Audio** : Aucun (le loader est en `muted`)

### Commande FFmpeg pour optimiser :

```bash
# Conversion en WebM optimisé
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 1M -c:a libvorbis -b:a 128k public/videos/loader-main.webm

# Conversion en MP4 optimisé
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -b:v 2M -c:a aac -b:a 128k public/videos/loader-main.mp4
```

## 🔧 Utilisation avancée

### Reset du loader pour testing :

```tsx
import { useAppLoader } from '@hooks';

const { resetLoader } = useAppLoader();

// Pour forcer le re-affichage du loader
resetLoader();
```

### Configuration personnalisée :

```tsx
const { isLoading, completeLoading } = useAppLoader({
  minDuration: 4000,
  sessionKey: 'myCustomLoader',
  forceShow: process.env.NODE_ENV === 'development',
});
```

## 🐛 Dépannage

### Le loader ne s'affiche pas :
1. Vérifiez que les fichiers vidéo existent dans `public/videos/`
2. Vérifiez la configuration dans `ClientLayout`
3. Videz le sessionStorage : `sessionStorage.clear()`

### La vidéo ne se charge pas :
1. Vérifiez les formats supportés par le navigateur
2. Assurez-vous d'avoir un fallback MP4
3. Vérifiez la console pour les erreurs

### Performance :
1. Optimisez la taille des vidéos (< 5MB recommandé)
2. Utilisez un CDN pour les gros fichiers
3. Préchargez avec `preload="auto"`
