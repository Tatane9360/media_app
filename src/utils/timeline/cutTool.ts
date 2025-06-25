import { Clip, AudioTrack } from "@interface";

/**
 * Interface pour le résultat d'une découpe de clip
 */
export interface CutResult {
  firstClip: Clip;
  secondClip: Clip;
}

/**
 * Interface pour le résultat d'une découpe de piste audio
 */
export interface AudioCutResult {
  firstTrack: AudioTrack;
  secondTrack: AudioTrack;
}

/**
 * Génère un ID unique pour les nouveaux clips/tracks
 */
export const generateUniqueId = (type: "clip" | "audio"): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9); // Plus de caractères aléatoires
  const performance =
    typeof window !== "undefined" ? window.performance.now() : Date.now();
  return `${type}-${timestamp}-${Math.floor(performance)}-${random}`;
};

/**
 * Découpe un clip vidéo à une position donnée
 * @param clip - Le clip à découper
 * @param cutPosition - La position de coupe en secondes (dans la timeline)
 * @returns Les deux nouveaux clips ou null si la découpe n'est pas possible
 */
export const cutClipAtPosition = (
  clip: Clip,
  cutPosition: number
): CutResult | null => {
  // Vérifier que le point de coupe est dans la plage du clip
  if (cutPosition <= clip.startTime || cutPosition >= clip.endTime) {
    console.warn(
      `Point de coupe ${cutPosition}s en dehors du clip (${clip.startTime}s - ${clip.endTime}s)`
    );
    return null;
  }

  console.log(`Découpe du clip ${clip.id} à ${cutPosition}s`, {
    startTime: clip.startTime,
    endTime: clip.endTime,
    trimStart: clip.trimStart || 0,
    trimEnd: clip.trimEnd || 0,
    assetDuration: clip.asset?.duration,
  });

  // Simplification : pour les clips déjà découpés, on évite les calculs complexes de trimming
  // et on fait une découpe "simple" en conservant les propriétés existantes

  const currentTrimStart = clip.trimStart || 0;
  const currentTrimEnd = clip.trimEnd || 0;
  const clipDuration = clip.endTime - clip.startTime;
  const cutRelativePosition = cutPosition - clip.startTime;

  // Pour le premier segment : on garde le trimStart actuel et on ajuste la durée
  const firstClip: Clip = {
    ...clip,
    id: generateUniqueId("clip"),
    endTime: cutPosition,
    trimStart: currentTrimStart,
    // Pour trimEnd, on calcule combien on a coupé à la fin
    trimEnd: currentTrimEnd + (clipDuration - cutRelativePosition),
  };

  // Pour le second segment : on commence à la nouvelle position
  const secondClip: Clip = {
    ...clip,
    id: generateUniqueId("clip"),
    startTime: cutPosition,
    endTime: clip.endTime,
    // Pour trimStart, on ajoute ce qu'on a coupé au début
    trimStart: currentTrimStart + cutRelativePosition,
    trimEnd: currentTrimEnd,
  };

  console.log(`Résultat de la découpe:`, {
    firstClip: {
      id: firstClip.id,
      startTime: firstClip.startTime,
      endTime: firstClip.endTime,
      trimStart: firstClip.trimStart,
      trimEnd: firstClip.trimEnd,
    },
    secondClip: {
      id: secondClip.id,
      startTime: secondClip.startTime,
      endTime: secondClip.endTime,
      trimStart: secondClip.trimStart,
      trimEnd: secondClip.trimEnd,
    },
  });

  return { firstClip, secondClip };
};

/**
 * Découpe une piste audio à une position donnée
 * @param track - La piste audio à découper
 * @param cutPosition - La position de coupe en secondes (dans la timeline)
 * @returns Les deux nouvelles pistes ou null si la découpe n'est pas possible
 */
export const cutAudioTrackAtPosition = (
  track: AudioTrack,
  cutPosition: number
): AudioCutResult | null => {
  // Ne pas découper les pistes audio liées (elles suivent leur clip vidéo)
  if (track.linkedVideoClipId) {
    console.warn(
      `Impossible de découper une piste audio liée. Découpez le clip vidéo correspondant.`
    );
    return null;
  }

  // Vérifier que le point de coupe est dans la plage de la piste
  if (cutPosition <= track.startTime || cutPosition >= track.endTime) {
    console.warn(
      `Point de coupe ${cutPosition}s en dehors de la piste audio (${track.startTime}s - ${track.endTime}s)`
    );
    return null;
  }

  // Créer le premier segment (garde la position d'origine)
  const firstTrack: AudioTrack = {
    ...track,
    id: generateUniqueId("audio"),
    endTime: cutPosition,
  };

  // Créer le second segment (commence à la position de coupe)
  const secondTrack: AudioTrack = {
    ...track,
    id: generateUniqueId("audio"),
    startTime: cutPosition,
  };

  return { firstTrack, secondTrack };
};

/**
 * Découpe les pistes audio liées à un clip vidéo
 * @param audioTracks - Toutes les pistes audio de la timeline
 * @param clipId - L'ID du clip vidéo découpé (ancien ID)
 * @param cutPosition - La position de coupe
 * @param newFirstClipId - L'ID du premier nouveau clip
 * @param newSecondClipId - L'ID du second nouveau clip
 * @returns Les nouvelles pistes audio mises à jour
 */
export const cutLinkedAudioTracks = (
  audioTracks: AudioTrack[],
  clipId: string,
  cutPosition: number,
  newFirstClipId: string,
  newSecondClipId: string
): AudioTrack[] => {
  console.log(
    `Début cutLinkedAudioTracks - clipId: ${clipId}, newFirstClipId: ${newFirstClipId}, newSecondClipId: ${newSecondClipId}`
  );

  const updatedTracks: AudioTrack[] = [];

  audioTracks.forEach((track) => {
    if (track.linkedVideoClipId === clipId) {
      console.log(
        `Découpe de la piste audio liée ${track.id} pour le clip ${clipId}`
      );

      // Créer deux pistes audio pour correspondre aux deux segments du clip
      const firstAudioTrack: AudioTrack = {
        ...track,
        id: generateUniqueId("audio"),
        endTime: cutPosition,
        linkedVideoClipId: newFirstClipId,
      };

      const secondAudioTrack: AudioTrack = {
        ...track,
        id: generateUniqueId("audio"),
        startTime: cutPosition,
        linkedVideoClipId: newSecondClipId,
      };

      console.log(`Création de deux pistes audio:`, {
        firstAudioTrack: {
          id: firstAudioTrack.id,
          startTime: firstAudioTrack.startTime,
          endTime: firstAudioTrack.endTime,
          linkedVideoClipId: firstAudioTrack.linkedVideoClipId,
        },
        secondAudioTrack: {
          id: secondAudioTrack.id,
          startTime: secondAudioTrack.startTime,
          endTime: secondAudioTrack.endTime,
          linkedVideoClipId: secondAudioTrack.linkedVideoClipId,
        },
      });

      updatedTracks.push(firstAudioTrack, secondAudioTrack);
    } else {
      // Garder les pistes non liées au clip découpé
      // Mais filtrer les pistes avec des IDs invalides
      if (track.id && track.id !== "undefined") {
        console.log(`Piste ${track.id} conservée (non liée au clip ${clipId})`);
        updatedTracks.push(track);
      } else {
        console.log(`⚠️ Piste avec ID invalide ignorée:`, {
          id: track.id,
          linkedVideoClipId: track.linkedVideoClipId,
        });
      }
    }
  });

  console.log(
    `cutLinkedAudioTracks terminé. ${updatedTracks.length} pistes au total`
  );
  return updatedTracks;
};

/**
 * Valide qu'une position de coupe est valide pour un élément donné
 * @param startTime - Temps de début de l'élément
 * @param endTime - Temps de fin de l'élément
 * @param cutPosition - Position de coupe proposée
 * @returns true si la position est valide
 */
export const isCutPositionValid = (
  startTime: number,
  endTime: number,
  cutPosition: number
): boolean => {
  return cutPosition > startTime && cutPosition < endTime;
};
