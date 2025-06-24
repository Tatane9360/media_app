import { Timeline, Clip, AudioTrack } from "@/interface/iProject";
import {
  cutClipAtPosition,
  cutAudioTrackAtPosition,
  isCutPositionValid,
} from "./cutTool";
import {
  updateTimelineAfterClipCut,
  updateTimelineAfterAudioCut,
  findClipAtPosition,
  findAudioTrackAtPosition,
  validateTimelineCoherence,
} from "./timelineUpdater";

/**
 * Interface pour les callbacks du gestionnaire de l'outil cut
 */
export interface CutToolCallbacks {
  onTimelineUpdate: (timeline: Timeline) => void;
  onClipSelect: (clipId: string | null) => void;
  onAudioTrackSelect: (trackId: string | null) => void;
  onError: (message: string) => void;
}

/**
 * Interface pour l'état de l'outil cut
 */
export interface CutToolState {
  isActive: boolean;
  cutPosition: number;
  showIndicator: boolean;
  targetTrackIndex?: number;
}

/**
 * Classe pour gérer l'outil de découpe
 */
export class CutToolHandler {
  private state: CutToolState = {
    isActive: false,
    cutPosition: 0,
    showIndicator: false,
  };

  private callbacks: CutToolCallbacks;
  private timeline: Timeline;

  constructor(timeline: Timeline, callbacks: CutToolCallbacks) {
    this.timeline = timeline;
    this.callbacks = callbacks;
  }

  /**
   * Active l'outil de découpe
   */
  activate(): void {
    this.state.isActive = true;
    console.log("Outil de découpe activé");
  }

  /**
   * Désactive l'outil de découpe
   */
  deactivate(): void {
    this.state = {
      isActive: false,
      cutPosition: 0,
      showIndicator: false,
    };
    console.log("Outil de découpe désactivé");
  }

  /**
   * Bascule l'état de l'outil de découpe
   */
  toggle(): void {
    if (this.state.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  /**
   * Met à jour la timeline utilisée par le gestionnaire
   */
  updateTimeline(timeline: Timeline): void {
    this.timeline = timeline;
  }

  /**
   * Gère le mouvement de la souris sur la timeline
   * @param position - Position en secondes
   * @param trackIndex - Index de la piste
   */
  handleMouseMove(position: number, trackIndex?: number): void {
    if (!this.state.isActive) return;

    this.state.cutPosition = position;
    this.state.targetTrackIndex = trackIndex;

    // Vérifier s'il y a un élément à découper à cette position
    const clipAtPosition = findClipAtPosition(
      this.timeline.clips,
      position,
      trackIndex
    );
    const audioTrackAtPosition = findAudioTrackAtPosition(
      this.timeline.audioTracks,
      position,
      trackIndex
    );

    // Afficher l'indicateur seulement s'il y a quelque chose à découper
    this.state.showIndicator = !!(clipAtPosition || audioTrackAtPosition);
  }

  /**
   * Gère le clic sur la timeline pour effectuer la découpe
   * @param position - Position en secondes
   * @param trackIndex - Index de la piste (optionnel)
   */
  handleClick(position: number, trackIndex?: number): void {
    if (!this.state.isActive) return;

    try {
      // Chercher d'abord un clip à cette position
      const clipAtPosition = findClipAtPosition(
        this.timeline.clips,
        position,
        trackIndex
      );

      if (clipAtPosition) {
        this.cutClip(clipAtPosition, position);
        return;
      }

      // Si pas de clip, chercher une piste audio
      const audioTrackAtPosition = findAudioTrackAtPosition(
        this.timeline.audioTracks,
        position,
        trackIndex
      );

      if (audioTrackAtPosition) {
        this.cutAudioTrack(audioTrackAtPosition, position);
        return;
      }

      // Aucun élément à découper à cette position
      this.callbacks.onError("Aucun élément à découper à cette position");
    } catch (error) {
      console.error("Erreur lors de la découpe:", error);
      this.callbacks.onError(
        `Erreur lors de la découpe: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    }
  }

  /**
   * Découpe un clip à la position spécifiée
   */
  private cutClip(clip: Clip, position: number): void {
    const clipId = clip.id || clip._id?.toString();
    if (!clipId) {
      throw new Error("Clip sans ID valide");
    }

    // Valider la position de coupe
    if (!isCutPositionValid(clip.startTime, clip.endTime, position)) {
      throw new Error(
        `Position de coupe invalide: ${position}s pour le clip (${clip.startTime}s - ${clip.endTime}s)`
      );
    }

    // Effectuer la découpe
    const cutResult = cutClipAtPosition(clip, position);
    if (!cutResult) {
      throw new Error("Impossible de découper le clip");
    }

    // Mettre à jour la timeline
    const newTimeline = updateTimelineAfterClipCut({
      timeline: this.timeline,
      originalClipId: clipId,
      cutResult,
      cutPosition: position,
    });

    // Valider la cohérence
    if (!validateTimelineCoherence(newTimeline)) {
      throw new Error("La découpe a créé une timeline incohérente");
    }

    // Appliquer les changements
    this.callbacks.onTimelineUpdate(newTimeline);
    this.callbacks.onClipSelect(cutResult.firstClip.id || null);

    console.log(`Clip ${clipId} découpé avec succès à ${position}s`);
  }

  /**
   * Découpe une piste audio à la position spécifiée
   */
  private cutAudioTrack(track: AudioTrack, position: number): void {
    const trackId = track.id || track._id?.toString();
    if (!trackId) {
      throw new Error("Piste audio sans ID valide");
    }

    // Valider la position de coupe
    if (!isCutPositionValid(track.startTime, track.endTime, position)) {
      throw new Error(
        `Position de coupe invalide: ${position}s pour la piste audio (${track.startTime}s - ${track.endTime}s)`
      );
    }

    // Effectuer la découpe
    const audioCutResult = cutAudioTrackAtPosition(track, position);
    if (!audioCutResult) {
      throw new Error("Impossible de découper la piste audio");
    }

    // Mettre à jour la timeline
    const newTimeline = updateTimelineAfterAudioCut({
      timeline: this.timeline,
      originalTrackId: trackId,
      audioCutResult,
      cutPosition: position,
    });

    // Valider la cohérence
    if (!validateTimelineCoherence(newTimeline)) {
      throw new Error("La découpe a créé une timeline incohérente");
    }

    // Appliquer les changements
    this.callbacks.onTimelineUpdate(newTimeline);
    this.callbacks.onAudioTrackSelect(audioCutResult.firstTrack.id || null);

    console.log(`Piste audio ${trackId} découpée avec succès à ${position}s`);
  }

  /**
   * Gestionnaire pour les raccourcis clavier
   */
  handleKeyDown(event: KeyboardEvent): void {
    // Activer/désactiver avec la touche 'C'
    if (event.key.toLowerCase() === "c" && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      this.toggle();
    }

    // Désactiver avec Escape
    if (event.key === "Escape" && this.state.isActive) {
      event.preventDefault();
      this.deactivate();
    }
  }

  /**
   * Retourne l'état actuel de l'outil
   */
  getState(): Readonly<CutToolState> {
    return { ...this.state };
  }

  /**
   * Vérifie si l'outil est actif
   */
  isActive(): boolean {
    return this.state.isActive;
  }
}
