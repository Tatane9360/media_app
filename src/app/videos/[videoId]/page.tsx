'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { BackButton, VideoCard } from '@components';

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

interface VideosResponse {
  success: boolean;
  data: {
    videos: Video[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export default function VideoDetail() {
  const [video, setVideo] = useState<Video | null>(null);
  const [otherVideos, setOtherVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const params = useParams();
  const videoId = params.videoId as string;

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        
        // Récupérer la vidéo actuelle
        const videoResponse = await fetch(`/api/videos/${videoId}`);
        const videoData: VideoResponse = await videoResponse.json();
        
        if (videoData.success) {
          setVideo(videoData.data.video);
        } else {
          setError(videoData.error || 'Vidéo non trouvée');
          return;
        }

        // Récupérer les autres vidéos
        const videosResponse = await fetch('/api/videos?limit=6');
        const videosData: VideosResponse = await videosResponse.json();
        
        if (videosData.success) {
          // Filtrer pour exclure la vidéo actuelle
          const filtered = videosData.data.videos.filter(v => v.id !== videoId);
          setOtherVideos(filtered.slice(0, 5)); // Limiter à 5 autres vidéos
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
    <div className="min-h-screen gap-3 flex flex-col px-4 py-5">
      <div className='flex flex-col gap-4'>
        <BackButton variant='icon-only' />
        <h1 className="font-bold  uppercase tracking-wide">{video.title}</h1>
      </div>

      <div className="flex flex-col gap-8">
        {/* Video Player */}
        <div className="flex flex-col gap-[30px]">
          <div className="relative rounded-4xl overflow-hidden">
              <div className="aspect-video relative">
                {!isPlaying ? (
                  <div 
                    className="relative w-full h-full bg-cover bg-center cursor-pointer group"
                    style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
                    onClick={() => setIsPlaying(true)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="43" height="53" viewBox="0 0 43 53" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.481 1.32871C3.8181 -0.365867 0.333496 1.54699 0.333496 4.70335V48.4633C0.333496 51.6197 3.8181 53.5325 6.481 51.8379L40.8638 29.958C43.3338 28.3862 43.3338 24.7805 40.8638 23.2087L6.481 1.32871Z" fill="white"/>
                      </svg>
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
          <div>
              {video.description ? <p>{video.description}</p> : <p>Aucune description disponible</p>}
          </div>
        </div>
        <div className='flex flex-col gap-5'>
          <h2 className='uppercase'>Découvre aussi</h2>
          
          {otherVideos.length > 0 ? (
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4" style={{ width: 'max-content' }}>
                {otherVideos.map((otherVideo) => (
                  <VideoCard 
                    key={otherVideo.id}
                    video={otherVideo}
                    className="flex-shrink-0 w-80"
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-foreground">Aucune autre vidéo disponible pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
