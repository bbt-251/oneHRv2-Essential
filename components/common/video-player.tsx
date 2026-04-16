"use client";

import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { convertToPlayableUrl } from "@/lib/util/learning/url-utils";

interface VideoPlayerProps {
    url: string;
    format: string;
    initialProgress?: number;
    setProgress?: Dispatch<SetStateAction<number>>;
}

export function VideoPlayer({ url, format, initialProgress, setProgress }: VideoPlayerProps) {
    const [duration, setDuration] = useState(0);

    const playerRef = useRef<any | null>(null);

    const handleDuration = (dur: number) => setDuration(dur);
    const handleProgress = (state: any) => {
        const { playedSeconds } = state;
        if (duration > 0 && setProgress) {
            const percent = Math.ceil((playedSeconds / duration) * 100);
            setProgress(percent);
        }
    };

    const playbackInfo = convertToPlayableUrl(url);

    if (!["Video", "Audio"].includes(format ?? "")) {
        return (
            <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Content not available</p>
            </div>
        );
    }

    if (!playbackInfo) {
        return (
            <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Invalid video URL</p>
            </div>
        );
    }

    return (
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
            {playbackInfo.type === "react-player" ? (
                <ReactPlayer
                    ref={playerRef}
                    url={playbackInfo.url}
                    controls
                    width="100%"
                    height="100%"
                    onDuration={handleDuration}
                    onProgress={handleProgress}
                    onReady={() => {
                        if (playerRef.current) {
                            playerRef.current.seekTo((initialProgress ?? 0) / 100, "fraction");
                        }
                    }}
                />
            ) : (
                <iframe
                    src={playbackInfo.url}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="w-full h-full border-0"
                />
            )}
        </div>
    );
}
