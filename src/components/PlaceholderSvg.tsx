import React from 'react';

// Placeholder SVG pour les miniatures vidéo
// Cette image sera utilisée lorsque les miniatures Cloudinary ne peuvent pas être chargées
const PlaceholderSvg: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 320 180"
    fill="none"
    style={{
      background: '#1a1a1a',
    }}
  >
    <rect width="320" height="180" fill="#1a1a1a" />
    <circle cx="160" cy="90" r="40" fill="none" stroke="#4b5563" strokeWidth="8" />
    <path d="M145 70l40 20l-40 20z" fill="#4b5563" />
    <text
      x="160"
      y="150"
      fontFamily="Arial, sans-serif"
      fontSize="14"
      textAnchor="middle"
      fill="#9ca3af"
    >
      Prévisualisation non disponible
    </text>
  </svg>
);

export default PlaceholderSvg;
