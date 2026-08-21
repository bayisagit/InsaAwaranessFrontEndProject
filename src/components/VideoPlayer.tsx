import React, { forwardRef } from 'react';

interface VideoPlayerProps {
    src: string;
    className?: string;
    onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
    ({ src, className = '', onTimeUpdate }, ref) => {
        if (!src) return null;

    // Check for YouTube URL
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&?]*).*/;
    const match = src.match(ytRegExp);

    if (match && match[2].length === 11) {
        const embedUrl = `https://www.youtube.com/embed/${match[2]}`;
        return (
            <iframe
                src={embedUrl}
                className={className}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        );
    }

        // Fallback to native video element for other URLs (e.g., Cloudinary mp4)
        return (
            <video 
                ref={ref}
                controls 
                src={src} 
                className={className} 
                onTimeUpdate={onTimeUpdate}
            />
        );
    }
);

VideoPlayer.displayName = 'VideoPlayer';
