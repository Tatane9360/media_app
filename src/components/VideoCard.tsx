import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BackButton } from '@/components';

interface Video {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

interface VideoCardProps {
  video: Video;
  className?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  className = '',
}) => {
  return (
    <div className={`group ${className}`}>
      <Link href={`/videos/${video.id}`}>
        <div className="flex flex-col gap-3">
          {/* Thumbnail */}
          <div className="relative aspect-video rounded-4xl overflow-hidden">
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover"
              sizes="100vw"
            />

            <BackButton 
              variant='icon-only' 
              href={`/videos/${video.id}`} 
              className='rotate-180 absolute bottom-3 right-3' 
            />
          </div>
          
          {/* Title below thumbnail */}
          <h3 className="text-2xl font-bold uppercase tracking-wide">
            {video.title}
          </h3>
        </div>
      </Link>
    </div>
  );
};

export default VideoCard;
