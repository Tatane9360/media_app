#!/bin/bash

# Script pour installer FFmpeg sur le système

echo "Installation de FFmpeg et FFprobe..."

# Détection du système d'exploitation
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  echo "Système détecté: macOS"
  
  # Vérifier si Homebrew est installé
  if ! command -v brew &> /dev/null; then
    echo "Homebrew n'est pas installé. Installation..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  
  # Installer FFmpeg avec Homebrew
  brew install ffmpeg
  
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  echo "Système détecté: Linux"
  
  # Détecter le gestionnaire de paquets
  if command -v apt-get &> /dev/null; then
    # Debian/Ubuntu
    sudo apt-get update
    sudo apt-get install -y ffmpeg
  elif command -v yum &> /dev/null; then
    # CentOS/RHEL/Fedora
    sudo yum install -y ffmpeg
  elif command -v pacman &> /dev/null; then
    # Arch Linux
    sudo pacman -S ffmpeg
  else
    echo "Gestionnaire de paquets non reconnu. Veuillez installer FFmpeg manuellement."
    exit 1
  fi
  
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  echo "Système détecté: Windows"
  echo "Sur Windows, il est recommandé d'installer FFmpeg manuellement."
  echo "1. Téléchargez FFmpeg depuis https://ffmpeg.org/download.html"
  echo "2. Extrayez l'archive et ajoutez le dossier bin à votre PATH"
  echo "3. Ou utilisez Chocolatey: choco install ffmpeg"
  exit 1
  
else
  echo "Système d'exploitation non reconnu: $OSTYPE"
  echo "Veuillez installer FFmpeg manuellement."
  exit 1
fi

# Vérifier l'installation
if command -v ffmpeg &> /dev/null && command -v ffprobe &> /dev/null; then
  echo "FFmpeg et FFprobe ont été installés avec succès."
  echo "Versions installées:"
  ffmpeg -version | head -n 1
  ffprobe -version | head -n 1
  
  # Créer ou mettre à jour le fichier .env avec les chemins
  FFMPEG_PATH=$(which ffmpeg)
  FFPROBE_PATH=$(which ffprobe)
  
  if [ -f .env ]; then
    # Mettre à jour le fichier .env existant
    grep -v "FFMPEG_PATH\|FFPROBE_PATH" .env > .env.tmp
    echo "FFMPEG_PATH=$FFMPEG_PATH" >> .env.tmp
    echo "FFPROBE_PATH=$FFPROBE_PATH" >> .env.tmp
    mv .env.tmp .env
  else
    # Créer un nouveau fichier .env
    echo "FFMPEG_PATH=$FFMPEG_PATH" > .env
    echo "FFPROBE_PATH=$FFPROBE_PATH" >> .env
  fi
  
  echo "Chemins ajoutés au fichier .env:"
  echo "FFMPEG_PATH=$FFMPEG_PATH"
  echo "FFPROBE_PATH=$FFPROBE_PATH"
  
  echo "Installation terminée."
else
  echo "Erreur: L'installation de FFmpeg a échoué."
  exit 1
fi
