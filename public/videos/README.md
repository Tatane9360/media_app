# Dossier des vidéos de chargement

Placez ici vos fichiers vidéo pour l'AppLoader :

## Structure recommandée :
```
videos/
  loader-main.webm      # Vidéo principale (format optimal)
  loader-main.mp4       # Vidéo de fallback
  loader-fallback.webm  # Fallback alternatif (optionnel)
```

## Formats supportés :
- **WebM** (VP9/VP8) - Recommandé pour la qualité/taille
- **MP4** (H.264) - Fallback pour compatibilité maximale

## Spécifications optimales :
- Résolution : 1920x1080 (Full HD)
- Durée : 2-5 secondes en boucle
- Bitrate : 1-2 Mbps (WebM), 2-3 Mbps (MP4)
- Audio : Aucun (muted)

Voir `APPLOADER.md` pour plus de détails.
