import { NextResponse } from 'next/server';

export async function GET() {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  
  const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
  
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'YouTube API key not configured' }, 
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1&type=video`,
      { 
        next: { revalidate: 3600 } 
      }
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'No videos found' }, 
        { status: 404 }
      );
    }

    const latestVideo = data.items[0];
    
    const statsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${latestVideo.id.videoId}&part=statistics`,
      { 
        next: { revalidate: 3600 }
      }
    );
    
    let statistics = null;
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      statistics = statsData.items?.[0]?.statistics;
    }

    return NextResponse.json({
      videoId: latestVideo.id.videoId,
      title: latestVideo.snippet.title,
      description: latestVideo.snippet.description,
      thumbnail: latestVideo.snippet.thumbnails.high?.url || latestVideo.snippet.thumbnails.default.url,
      publishedAt: latestVideo.snippet.publishedAt,
      channelTitle: latestVideo.snippet.channelTitle,
      statistics: statistics ? {
        viewCount: statistics.viewCount,
        likeCount: statistics.likeCount,
        commentCount: statistics.commentCount
      } : null
    });

  } catch (error) {
    console.error('Error fetching YouTube video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest video' }, 
      { status: 500 }
    );
  }
} 