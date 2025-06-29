'use client';
import React, { useEffect, useState } from 'react';
import Button from './Button';
import Icon from './Icon';

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  } | null;
}

const VideosSection = () => {
  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestVideo = async () => {
      try {
        const response = await fetch('/api/youtube/latest');

        if (!response.ok) {
          throw new Error('Failed to fetch video');
        }

        const data = await response.json();
        setVideo(data);
      } catch (err) {
        console.error('Error fetching latest video:', err);
        setError('Impossible de charger la dernière vidéo');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestVideo();
  }, []);

  const formatNumber = (num: string) => {
    const number = parseInt(num);
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    return number.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="bg-white dark:bg-[var(--background)] px-6 py-8 text-foreground">
        <h2 className="text-foreground dark:text-light text-2xl font-bold mb-6">
          DERNIÈRES VIDÉOS
        </h2>
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-navy rounded-lg p-6 animate-pulse">
            <div className="aspect-video bg-gray-600 rounded-lg mb-4"></div>
            <div className="space-y-3">
              <div className="h-6 bg-gray-600 rounded w-3/4"></div>
              <div className="h-4 bg-gray-600 rounded w-1/2"></div>
              <div className="h-10 bg-gray-600 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !video) {
    return (
      <section className="bg-white dark:bg-[var(--background)] px-6 py-8 min-h-screen pt-6 pb-24 text-foreground">
        <h2 className="text-foreground dark:text-light text-2xl font-bold mb-6">
          DERNIÈRES VIDÉOS
        </h2>
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-navy rounded-lg p-8 text-center">
            <div className="bg-red-500/20 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Icon name="youtube" size={32} color="#ef4444" />
            </div>
            <h3 className="text-light text-lg font-bold mb-2">
              Erreur de chargement
            </h3>
            <p className="text-light/70 mb-4">
              {error || 'Impossible de charger la dernière vidéo'}
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-[var(--background)] px-6 py-8 text-foreground">
      <h2 className="text-foreground dark:text-light text-2xl font-bold mb-6">
        DERNIÈRES VIDÉOS
      </h2>

      <div className="relative max-w-4xl mx-auto">
        <div className="bg-navy rounded-xl overflow-hidden">
          {/* Player vidéo YouTube */}
          <div className="relative pb-[56.25%] h-0">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${video.videoId}`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Informations de la vidéo */}
          <div className="p-6">
            <h3 className="text-foreground dark:text-light text-xl font-bold mb-3 line-clamp-2">
              {video.title}
            </h3>

            <div className="flex items-center justify-between mb-4 text-sm text-foreground/70 dark:text-light/70">
              <span>{video.channelTitle}</span>
              <span>{formatDate(video.publishedAt)}</span>
            </div>

            {/* Statistiques */}
            {video.statistics && (
              <div className="flex items-center gap-6 mb-6 text-sm text-foreground/80 dark:text-light/80">
                <div className="flex items-center gap-2">
                  <Icon name="eye" size={16} color="currentColor" />
                  <span>{formatNumber(video.statistics.viewCount)} vues</span>
                </div>
                {video.statistics.likeCount && (
                  <div className="flex items-center gap-2">
                    <span>👍</span>
                    <span>{formatNumber(video.statistics.likeCount)}</span>
                  </div>
                )}
                {video.statistics.commentCount && (
                  <div className="flex items-center gap-2">
                    <span>💬</span>
                    <span>{formatNumber(video.statistics.commentCount)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bouton YouTube */}
            <div className="text-center">
              <Button
                variant="white"
                size="lg"
                className="font-bold"
                onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
              >
                <div className="flex items-center gap-2">
                  <Icon name="logoYoutube" size={20} color="currentColor" />
                  Voir sur Youtube
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideosSection;