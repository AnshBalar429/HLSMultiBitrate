"use client";

import HLSPlayer from "@/components/HLSPlayer";
import { useEffect, useState } from "react";

interface VideoPageClientProps {
  videoId: string;
}

export default function VideoPlayer({ videoId }: VideoPageClientProps) {
  const account = process.env.NEXT_PUBLIC_STORAGE_ACCOUNT;
  const outputContainer = "outputs";

  const baseUrl = `https://${account}.blob.core.windows.net/${outputContainer}/${videoId}`;
  const masterUrl = `${baseUrl}/master.m3u8`;

  const [isReady, setIsReady] = useState(false);
  const [checking, setChecking] = useState(false);

  const variants = [
    { id: "360p", level: 0 },
    { id: "480p", level: 1 },
    { id: "720p", level: 2 },
  ];

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    async function checkStatus() {
      setChecking(true);
      try {
        const res = await fetch(`/api/video/${videoId}/status`);
        const { ready } = await res.json();
        if(ready) {
            setIsReady(true);
            return;
        }
        timeoutId = setTimeout(checkStatus, 5000);
      } catch (e) {
        console.error(e);
      } finally {
        setChecking(false);
      }
    }

    checkStatus();
    return () => clearTimeout(timeoutId);
  }, [videoId]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Video: {videoId}</h1>

      {!isReady ? (
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-lg">Transcoding your video…</p>
          {checking && <p className="text-sm text-gray-500">Checking status…</p>}
        </div>
      ) : (
        <HLSPlayer masterUrl={masterUrl} variants={variants} />
      )}
    </div>
  );
}
