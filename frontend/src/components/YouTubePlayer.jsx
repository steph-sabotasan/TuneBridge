import { useEffect, useRef, useState } from 'react';

function YouTubePlayer({ videoId, onVideoChange, autoplay = false }) {
  const playerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsReady(true);
      };
    } else {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (isReady && playerRef.current && videoId) {
      // Create or update player
      if (!playerInstanceRef.current) {
        playerInstanceRef.current = new window.YT.Player(playerRef.current, {
          videoId: videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
          },
          events: {
            onReady: (event) => {
              // Player is ready
            },
            onStateChange: (event) => {
              // Handle state changes if needed
              if (event.data === window.YT.PlayerState.ENDED && onVideoChange) {
                onVideoChange('next');
              }
            },
          },
        });
      } else {
        // Update existing player with new video
        if (autoplay) {
          playerInstanceRef.current.loadVideoById(videoId);
        } else {
          playerInstanceRef.current.cueVideoById(videoId);
        }
      }
    }
  }, [isReady, videoId, onVideoChange, autoplay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <div
          ref={playerRef}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
    </div>
  );
}

export default YouTubePlayer;
