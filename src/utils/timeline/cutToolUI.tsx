import React from 'react';
import { CutToolState } from './cutToolHandler';
import { Icon } from '@/components';

/**
 * Props pour le composant CutToolUI
 */
export interface CutToolUIProps {
  /** État de l'outil de découpe */
  cutToolState: CutToolState;
  /** Classe CSS supplémentaire */
  className?: string;
}

/**
 * Props pour le bouton d'activation de l'outil cut
 */
export interface CutToolButtonProps {
  /** Si l'outil est actif */
  isActive: boolean;
  /** Callback quand le bouton est cliqué */
  onClick: () => void;
  /** Classe CSS supplémentaire */
  className?: string;
  /** Désactiver le bouton */
  disabled?: boolean;
}

/**
 * Props pour l'indicateur de position de coupe
 */
export interface CutIndicatorProps {
  /** Position de coupe en secondes */
  position: number;
  /** Nombre de pixels par seconde */
  pixelsPerSecond: number;
  /** Hauteur de l'indicateur */
  height: number;
  /** Si l'indicateur doit être visible */
  visible: boolean;
  /** Couleur de l'indicateur */
  color?: string;
  /** Classe CSS supplémentaire */
  className?: string;
}

/**
 * Composant principal pour l'interface utilisateur de l'outil cut
 */
export const CutToolUI: React.FC<CutToolUIProps> = ({
  cutToolState,
  className = ''
}) => {
  if (!cutToolState.isActive) {
    return null;
  }

  return (
    <div className={`cut-tool-overlay ${className}`}>
      {/* Overlay pour changer le curseur */}
      <div 
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          cursor: 'crosshair',
        }}
      />
    </div>
  );
};

/**
 * Bouton pour activer/désactiver l'outil de découpe
 */
export const CutToolButton: React.FC<CutToolButtonProps> = React.memo(({
  isActive,
  onClick,
  className = '',
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={`Outil de découpe ${isActive ? '(actif)' : ''} - Raccourci: C`}
      aria-pressed={isActive}
    >
      <Icon 
        name="cut" 
        size={15}
        className={`${isActive ? 'fill-main' : 'fill-foreground'}`}
      />
    </button>
  );
});

CutToolButton.displayName = 'CutToolButton';

/**
 * Curseur personnalisé pour l'outil de découpe
 */
export const CutCursor: React.FC<{
  position: { x: number; y: number };
  visible: boolean;
}> = ({ position, visible }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-12px, -12px)'
      }}
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M6 6L18 18M6 18L18 6" 
          stroke="#ef4444" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <circle cx="6" cy="6" r="2" fill="#ef4444"/>
        <circle cx="6" cy="18" r="2" fill="#ef4444"/>
      </svg>
    </div>
  );
};

/**
 * Formate le temps en secondes en format MM:SS.d
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const decimal = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${decimal}`;
};
