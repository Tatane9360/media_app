'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  renderSettings: {
    format: string;
    quality: string;
    codec: string;
  };
  createdAt: string;
  updatedAt: string;
  adminId: string;
}

interface VideoResponse {
  success: boolean;
  data: {
    video: Video;
  };
  error?: string;
}

export default function VideoDetail() {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const params = useParams();
  const router = useRouter();
  const videoId = params.videoId as string;

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/videos/${videoId}`);
        const data: VideoResponse = await response.json();
        
        if (data.success) {
          setVideo(data.data.video);
        } else {
          setError(data.error || 'Vidéo non trouvée');
        }
      } catch (err) {
        setError('Erreur de connexion');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // Vous pouvez ajouter une notification toast ici
      alert('Lien copié dans le presse-papier !');
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement de la vidéo...</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <Link 
            href="/videos"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Retour aux vidéos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <div className="bg-gray-800 p-4">
        <div className="container mx-auto flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Retour</span>
          </button>
          <Link href="/videos" className="text-purple-400 hover:text-purple-300 transition-colors">
            Toutes les vidéos
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-xl overflow-hidden">
              <div className="aspect-video relative">
                {!isPlaying ? (
                  <div 
                    className="relative w-full h-full bg-cover bg-center cursor-pointer group"
                    style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
                    onClick={() => setIsPlaying(true)}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <div className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l8-5-8-5z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-1 rounded text-sm">
                      {video.duration > 0 && formatDuration(video.duration)}
                    </div>
                  </div>
                ) : (
                  <video 
                    controls 
                    autoPlay
                    className="w-full h-full"
                    poster={video.thumbnailUrl}
                  >
                    <source src={video.videoUrl} type={`video/${video.renderSettings?.format || 'mp4'}`} />
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                )}
              </div>
            </div>

            {/* Video Info */}
            <div className="mt-6">
              <h1 className="text-3xl font-bold mb-4">{video.title}</h1>
              
              {video.description && (
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-300 leading-relaxed">{video.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={() => copyToClipboard(video.videoUrl)}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copier le lien</span>
                </button>

                <a
                  href={video.videoUrl}
                  download={`${video.title}.${video.renderSettings?.format || 'mp4'}`}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Télécharger</span>
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Video Details */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Détails de la vidéo</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Créé le:</span>
                  <span>{formatDate(video.createdAt)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Modifié le:</span>
                  <span>{formatDate(video.updatedAt)}</span>
                </div>
                
                {video.duration > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Durée:</span>
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                )}
                
                {video.renderSettings && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Format:</span>
                      <span className="uppercase">{video.renderSettings.format}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Qualité:</span>
                      <span className="capitalize">{video.renderSettings.quality}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Codec:</span>
                      <span className="uppercase">{video.renderSettings.codec}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Share Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Partager</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={video.videoUrl}
                    readOnly
                    className="flex-1 bg-gray-700 text-sm px-3 py-2 rounded border-none outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(video.videoUrl)}
                    className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Back to Projects */}
            <Link 
              href="/projects"
              className="block w-full bg-orange-600 hover:bg-orange-700 text-center py-3 rounded-lg transition-colors"
            >
              Retour aux projets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
