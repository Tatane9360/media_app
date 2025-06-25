import { Timeline, Clip, AudioTrack } from "@interface";

import { CutResult, AudioCutResult, cutLinkedAudioTracks } from "./cutTool";

/**
 * Interface pour les paramètres de mise à jour après découpe
 */
export interface TimelineUpdateParams {
  timeline: Timeline;
  originalClipId?: string;
  originalTrackId?: string;
  cutResult?: CutResult;
  audioCutResult?: AudioCutResult;
  cutPosition: number;
}

/**
 * Met à jour la timeline après la découpe d'un clip vidéo
 * @param params - Paramètres de mise à jour
 * @returns La nouvelle timeline mise à jour
 */
export const updateTimelineAfterClipCut = (
  params: TimelineUpdateParams
): Timeline => {
  const { timeline, originalClipId, cutResult, cutPosition } = params;

  if (!originalClipId || !cutResult) {
    throw new Error(
      "originalClipId et cutResult sont requis pour la découpe de clip"
    );
  }

  // Remplacer le clip original par les deux nouveaux segments
  const newClips = timeline.clips
    .map((clip) => {
      const currentClipId = clip.id || clip._id?.toString();
      if (currentClipId === originalClipId) {
        return null; // Marquer pour suppression
      }
      return clip;
    })
    .filter((clip) => clip !== null) as Clip[];

  // Ajouter les nouveaux segments
  newClips.push(cutResult.firstClip, cutResult.secondClip);

  // Gérer les pistes audio liées
  const firstClipId =
    cutResult.firstClip.id || cutResult.firstClip._id?.toString();
  const secondClipId =
    cutResult.secondClip.id || cutResult.secondClip._id?.toString();

  if (!firstClipId || !secondClipId) {
    throw new Error(
      "Les nouveaux clips doivent avoir des IDs valides pour gérer les pistes audio liées"
    );
  }

  console.log(
    `updateTimelineAfterClipCut - originalClipId: ${originalClipId}, firstClipId: ${firstClipId}, secondClipId: ${secondClipId}`
  );
  console.log(
    `Pistes audio avant découpe:`,
    timeline.audioTracks.map((t) => ({
      id: t.id,
      linkedVideoClipId: t.linkedVideoClipId,
    }))
  );

  const newAudioTracks = cutLinkedAudioTracks(
    timeline.audioTracks,
    originalClipId,
    cutPosition,
    firstClipId,
    secondClipId
  );

  console.log(
    `Pistes audio après découpe:`,
    newAudioTracks.map((t) => ({
      id: t.id,
      linkedVideoClipId: t.linkedVideoClipId,
    }))
  );

  // Recalculer la durée totale si nécessaire
  const maxEndTime = Math.max(
    ...newClips.map((clip) => clip.endTime),
    ...newAudioTracks.map((track) => track.endTime)
  );

  return {
    ...timeline,
    clips: newClips,
    audioTracks: newAudioTracks,
    duration: Math.max(timeline.duration, maxEndTime),
  };
};

/**
 * Met à jour la timeline après la découpe d'une piste audio
 * @param params - Paramètres de mise à jour
 * @returns La nouvelle timeline mise à jour
 */
export const updateTimelineAfterAudioCut = (
  params: TimelineUpdateParams
): Timeline => {
  const { timeline, originalTrackId, audioCutResult } = params;

  if (!originalTrackId || !audioCutResult) {
    throw new Error(
      "originalTrackId et audioCutResult sont requis pour la découpe de piste audio"
    );
  }

  // Remplacer la piste originale par les deux nouveaux segments
  const newAudioTracks = timeline.audioTracks
    .map((track) => {
      const currentTrackId = track.id || track._id?.toString();
      if (currentTrackId === originalTrackId) {
        return null; // Marquer pour suppression
      }
      return track;
    })
    .filter((track) => track !== null) as AudioTrack[];

  // Ajouter les nouveaux segments
  newAudioTracks.push(audioCutResult.firstTrack, audioCutResult.secondTrack);

  // Recalculer la durée totale si nécessaire
  const maxEndTime = Math.max(
    ...timeline.clips.map((clip) => clip.endTime),
    ...newAudioTracks.map((track) => track.endTime)
  );

  return {
    ...timeline,
    audioTracks: newAudioTracks,
    duration: Math.max(timeline.duration, maxEndTime),
  };
};

/**
 * Trouve le clip à une position donnée dans la timeline
 * @param clips - Tous les clips de la timeline
 * @param position - Position en secondes
 * @param trackIndex - Index de la piste (optionnel, pour filtrer par piste)
 * @returns Le clip trouvé ou null
 */
export const findClipAtPosition = (
  clips: Clip[],
  position: number,
  trackIndex?: number
): Clip | null => {
  return (
    clips.find((clip) => {
      const isInTimeRange =
        position >= clip.startTime && position <= clip.endTime;
      const isInTrack =
        trackIndex === undefined || clip.trackIndex === trackIndex;
      return isInTimeRange && isInTrack;
    }) || null
  );
};

/**
 * Trouve la piste audio à une position donnée dans la timeline
 * @param tracks - Toutes les pistes audio de la timeline
 * @param position - Position en secondes
 * @param trackIndex - Index de la piste (optionnel, pour filtrer par piste)
 * @returns La piste audio trouvée ou null
 */
export const findAudioTrackAtPosition = (
  tracks: AudioTrack[],
  position: number,
  trackIndex?: number
): AudioTrack | null => {
  return (
    tracks.find((track) => {
      const isInTimeRange =
        position >= track.startTime && position <= track.endTime;
      const isInTrack =
        trackIndex === undefined || track.trackIndex === trackIndex;
      // Exclure les pistes liées car elles seront gérées via leur clip vidéo
      const isIndependent = !track.linkedVideoClipId;
      return isInTimeRange && isInTrack && isIndependent;
    }) || null
  );
};

/**
 * Valide la cohérence de la timeline après une mise à jour
 * @param timeline - La timeline à valider
 * @returns true si la timeline est cohérente
 */
export const validateTimelineCoherence = (timeline: Timeline): boolean => {
  // Vérifier qu'il n'y a pas de chevauchements de clips sur la même piste
  const clipsByTrack = new Map<number, Clip[]>();

  timeline.clips.forEach((clip) => {
    if (!clipsByTrack.has(clip.trackIndex)) {
      clipsByTrack.set(clip.trackIndex, []);
    }
    clipsByTrack.get(clip.trackIndex)!.push(clip);
  });

  for (const [trackIndex, clips] of clipsByTrack) {
    // Trier les clips par temps de début
    const sortedClips = clips.sort((a, b) => a.startTime - b.startTime);

    // Vérifier les chevauchements
    for (let i = 0; i < sortedClips.length - 1; i++) {
      const currentClip = sortedClips[i];
      const nextClip = sortedClips[i + 1];

      if (currentClip.endTime > nextClip.startTime) {
        console.error(
          `Chevauchement détecté sur la piste ${trackIndex} entre les clips:`,
          currentClip,
          nextClip
        );
        return false;
      }
    }
  }

  // Vérifier la cohérence des pistes audio liées
  console.log(
    `🔍 VALIDATION: Vérification de ${timeline.audioTracks.length} pistes audio`
  );
  console.log(
    `🔍 VALIDATION: ${timeline.clips.length} clips disponibles:`,
    timeline.clips.map((c) => ({ id: c.id, _id: c._id }))
  );

  timeline.audioTracks.forEach((track) => {
    if (track.linkedVideoClipId) {
      console.log(
        `🔍 Vérification piste audio ${track.id} liée au clip ${track.linkedVideoClipId}`
      );

      const linkedClip = timeline.clips.find(
        (clip) =>
          clip.id === track.linkedVideoClipId ||
          clip._id?.toString() === track.linkedVideoClipId
      );

      if (!linkedClip) {
        console.error(`❌ ERREUR: Piste audio liée à un clip inexistant:`, {
          trackId: track.id,
          linkedVideoClipId: track.linkedVideoClipId,
          trackLinkedVideoClipIdType: typeof track.linkedVideoClipId,
          availableClipIds: timeline.clips.map((c) => ({
            id: c.id,
            idType: typeof c.id,
            _id: c._id?.toString(),
            _idType: typeof c._id,
          })),
        });
        return false;
      } else {
        console.log(
          `✅ VALIDATION: Piste ${track.id} correctement liée au clip ${linkedClip.id}`
        );
      }

      // Vérifier que les temps correspondent
      if (
        track.startTime !== linkedClip.startTime ||
        track.endTime !== linkedClip.endTime
      ) {
        console.error(
          `❌ ERREUR: Désynchronisation entre clip et piste audio liée:`,
          linkedClip,
          track
        );
        return false;
      }
    } else {
      console.log(
        `🔍 Piste audio ${track.id} indépendante (pas de linkedVideoClipId)`
      );
    }
  });

  return true;
};
